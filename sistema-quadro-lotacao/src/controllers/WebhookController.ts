import { Request, Response } from 'express';
import { Pool } from 'pg';
import { NormalizacaoService, type ColaboradorEvent } from '../services/NormalizacaoService.js';
import { AuditService } from '../services/AuditService.js';
import { NotificationService } from '../services/NotificationService.js';
import { PropostaService } from '../services/PropostaService.js';
import { EmpresaRepository } from '../repositories/EmpresaRepository.js';
import { QuadroLotacaoRepository } from '../repositories/QuadroLotacaoRepository.js';
import { IntegrationMonitoringService } from '../services/IntegrationMonitoringService.js';
import crypto from 'crypto';

export interface WebhookPayload {
  event_type: 'colaborador.admitido' | 'colaborador.transferido' | 'colaborador.desligado' | 'colaborador.promovido';
  timestamp: string;
  data: {
    colaborador_id: string;
    nome: string;
    cpf: string;
    cargo_id: string;
    centro_custo_id: string;
    turno: string;
    data_admissao: string;
    data_desligamento?: string;
    pcd: boolean;
    status: 'ativo' | 'inativo';
    // Additional fields for specific events
    centro_custo_anterior?: string;
    cargo_anterior?: string;
    data_evento?: string;
  };
  signature?: string;
}

export interface WebhookConfig {
  secretKey: string;
  retryAttempts: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
}

export interface CargoDiscrepancyResult {
  action: 'alertar' | 'permitir' | 'bloquear' | 'exigir_aprovacao';
  allowed: boolean;
  message: string;
  requiresApproval: boolean;
  propostaId?: string;
}

export class WebhookController {
  private normalizacaoService: NormalizacaoService;
  private auditService: AuditService;
  private notificationService: NotificationService;
  private propostaService: PropostaService;
  private empresaRepository: EmpresaRepository;
  private quadroRepository: QuadroLotacaoRepository;
  private integrationMonitoring: IntegrationMonitoringService;
  private config: WebhookConfig;
  private pool: Pool;

  constructor(pool: Pool, config: WebhookConfig) {
    this.pool = pool;
    this.normalizacaoService = new NormalizacaoService(pool);
    this.auditService = new AuditService(pool);
    this.notificationService = new NotificationService(pool);
    this.propostaService = new PropostaService(pool);
    this.empresaRepository = new EmpresaRepository(pool);
    this.quadroRepository = new QuadroLotacaoRepository(pool);
    this.integrationMonitoring = new IntegrationMonitoringService(pool);
    this.config = config;
  }

  /**
   * Handle colaborador admission webhook
   * Requirements: 10.1 - Webhook processing with validation
   */
  async handleColaboradorAdmitido(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const correlationId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const payload: WebhookPayload = req.body;
      
      // Record webhook received event
      await this.integrationMonitoring.recordIntegrationEvent(
        'rh_legado_webhook',
        'webhook_received',
        'success',
        0,
        { eventType: 'colaborador.admitido', colaboradorId: payload.data?.colaborador_id },
        undefined,
        correlationId
      );
      
      // Validate webhook signature
      if (!this.validateWebhookSignature(req.headers, req.body)) {
        const responseTime = Date.now() - startTime;
        await this.integrationMonitoring.recordIntegrationEvent(
          'rh_legado_webhook',
          'webhook_processed',
          'failure',
          responseTime,
          payload,
          'Invalid webhook signature',
          correlationId
        );
        
        res.status(401).json({ 
          error: 'Invalid webhook signature',
          acknowledged: false 
        });
        return;
      }

      // Validate payload
      const validationErrors = this.validateAdmissaoPayload(payload);
      if (validationErrors.length > 0) {
        const responseTime = Date.now() - startTime;
        await this.integrationMonitoring.recordIntegrationEvent(
          'rh_legado_webhook',
          'webhook_processed',
          'failure',
          responseTime,
          payload,
          `Validation errors: ${validationErrors.join(', ')}`,
          correlationId
        );
        
        res.status(400).json({ 
          error: 'Invalid payload',
          details: validationErrors,
          acknowledged: false 
        });
        return;
      }

      // Convert to colaborador event
      const event: ColaboradorEvent = {
        colaboradorId: payload.data.colaborador_id,
        nome: payload.data.nome,
        cpf: payload.data.cpf,
        cargoId: payload.data.cargo_id,
        centroCustoId: payload.data.centro_custo_id,
        turno: payload.data.turno,
        dataAdmissao: new Date(payload.data.data_admissao),
        pcd: payload.data.pcd,
        status: payload.data.status,
        eventType: 'admissao'
      };

      // Check for cargo discrepancy (Requirement 10.2)
      const discrepancyResult = await this.handleCargoDiscrepancy(event, payload);
      
      if (!discrepancyResult.allowed) {
        const responseTime = Date.now() - startTime;
        await this.integrationMonitoring.recordIntegrationEvent(
          'rh_legado_webhook',
          'webhook_processed',
          'failure',
          responseTime,
          payload,
          `Cargo discrepancy: ${discrepancyResult.message}`,
          correlationId
        );
        
        res.status(409).json({
          error: 'Cargo discrepancy detected',
          message: discrepancyResult.message,
          action: discrepancyResult.action,
          acknowledged: false,
          colaborador_id: payload.data.colaborador_id,
          proposta_id: discrepancyResult.propostaId
        });
        return;
      }

      // Process with retry logic only if allowed
      await this.processWithRetry(event, payload, correlationId);

      const responseTime = Date.now() - startTime;
      
      // Record successful processing
      await this.integrationMonitoring.recordIntegrationEvent(
        'rh_legado_webhook',
        'webhook_processed',
        'success',
        responseTime,
        payload,
        undefined,
        correlationId
      );

      // Log successful webhook processing
      await this.auditService.logAction(
        payload.data.colaborador_id,
        'webhook',
        'webhook_admissao_processado',
        {
          userId: 'sistema',
          userName: 'RH Legado Webhook',
          motivo: 'Webhook de admissão processado com sucesso'
        },
        undefined,
        { payload, event }
      );

      res.json({ 
        acknowledged: true, 
        message: 'Admission processed successfully',
        colaborador_id: payload.data.colaborador_id
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Record failed processing
      await this.integrationMonitoring.recordIntegrationEvent(
        'rh_legado_webhook',
        'webhook_processed',
        'failure',
        responseTime,
        req.body,
        errorMessage,
        correlationId
      );
      
      // Log error
      await this.auditService.logAction(
        req.body?.data?.colaborador_id || 'unknown',
        'webhook',
        'webhook_admissao_erro',
        {
          userId: 'sistema',
          userName: 'RH Legado Webhook',
          motivo: `Erro no processamento: ${errorMessage}`
        },
        { payload: req.body },
        { error: errorMessage }
      );

      res.status(500).json({ 
        error: 'Internal server error',
        acknowledged: false 
      });
    }
  }

  /**
   * Handle colaborador transfer webhook
   */
  async handleColaboradorTransferido(req: Request, res: Response): Promise<void> {
    try {
      const payload: WebhookPayload = req.body;
      
      if (!this.validateWebhookSignature(req.headers, req.body)) {
        res.status(401).json({ error: 'Invalid signature', acknowledged: false });
        return;
      }

      const validationErrors = this.validateTransferenciaPayload(payload);
      if (validationErrors.length > 0) {
        res.status(400).json({ 
          error: 'Invalid payload', 
          details: validationErrors, 
          acknowledged: false 
        });
        return;
      }

      const event: ColaboradorEvent = {
        colaboradorId: payload.data.colaborador_id,
        nome: payload.data.nome,
        cpf: payload.data.cpf,
        cargoId: payload.data.cargo_id,
        centroCustoId: payload.data.centro_custo_id,
        turno: payload.data.turno,
        dataAdmissao: new Date(payload.data.data_admissao),
        pcd: payload.data.pcd,
        status: payload.data.status,
        eventType: 'transferencia',
        eventData: {
          centroCustoAnterior: payload.data.centro_custo_anterior!,
          cargoAnterior: payload.data.cargo_anterior,
          dataEvento: new Date(payload.data.data_evento || payload.timestamp)
        }
      };

      await this.processWithRetry(event, payload);

      await this.auditService.logAction(
        payload.data.colaborador_id,
        'webhook',
        'webhook_transferencia_processado',
        {
          userId: 'sistema',
          userName: 'RH Legado Webhook',
          motivo: 'Webhook de transferência processado com sucesso'
        },
        undefined,
        { payload, event }
      );

      res.json({ 
        acknowledged: true, 
        message: 'Transfer processed successfully',
        colaborador_id: payload.data.colaborador_id
      });

    } catch (error) {
      console.error('Transfer webhook error:', error);
      
      await this.auditService.logAction(
        req.body?.data?.colaborador_id || 'unknown',
        'webhook',
        'webhook_transferencia_erro',
        {
          userId: 'sistema',
          userName: 'RH Legado Webhook',
          motivo: `Erro no processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        },
        { payload: req.body },
        { error: error instanceof Error ? error.message : 'Erro desconhecido' }
      );

      res.status(500).json({ error: 'Internal server error', acknowledged: false });
    }
  }

  /**
   * Handle colaborador termination webhook
   */
  async handleColaboradorDesligado(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const correlationId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const payload: WebhookPayload = req.body;
      
      // Record webhook received event
      await this.integrationMonitoring.recordIntegrationEvent(
        'rh_legado_webhook',
        'webhook_received',
        'success',
        0,
        { eventType: 'colaborador.desligado', colaboradorId: payload.data?.colaborador_id },
        undefined,
        correlationId
      );
      
      if (!this.validateWebhookSignature(req.headers, req.body)) {
        const responseTime = Date.now() - startTime;
        await this.integrationMonitoring.recordIntegrationEvent(
          'rh_legado_webhook',
          'webhook_processed',
          'failure',
          responseTime,
          payload,
          'Invalid webhook signature',
          correlationId
        );
        
        res.status(401).json({ error: 'Invalid signature', acknowledged: false });
        return;
      }

      const validationErrors = this.validateDesligamentoPayload(payload);
      if (validationErrors.length > 0) {
        const responseTime = Date.now() - startTime;
        await this.integrationMonitoring.recordIntegrationEvent(
          'rh_legado_webhook',
          'webhook_processed',
          'failure',
          responseTime,
          payload,
          `Validation errors: ${validationErrors.join(', ')}`,
          correlationId
        );
        
        res.status(400).json({ 
          error: 'Invalid payload', 
          details: validationErrors, 
          acknowledged: false 
        });
        return;
      }

      const event: ColaboradorEvent = {
        colaboradorId: payload.data.colaborador_id,
        nome: payload.data.nome,
        cpf: payload.data.cpf,
        cargoId: payload.data.cargo_id,
        centroCustoId: payload.data.centro_custo_id,
        turno: payload.data.turno,
        dataAdmissao: new Date(payload.data.data_admissao),
        dataDesligamento: payload.data.data_desligamento ? new Date(payload.data.data_desligamento) : new Date(),
        pcd: payload.data.pcd,
        status: 'inativo',
        eventType: 'desligamento'
      };

      await this.processWithRetry(event, payload, correlationId);

      const responseTime = Date.now() - startTime;
      
      // Record successful processing
      await this.integrationMonitoring.recordIntegrationEvent(
        'rh_legado_webhook',
        'webhook_processed',
        'success',
        responseTime,
        payload,
        undefined,
        correlationId
      );

      await this.auditService.logAction(
        payload.data.colaborador_id,
        'webhook',
        'webhook_desligamento_processado',
        {
          userId: 'sistema',
          userName: 'RH Legado Webhook',
          motivo: 'Webhook de desligamento processado com sucesso'
        },
        undefined,
        { payload, event }
      );

      res.json({ 
        acknowledged: true, 
        message: 'Termination processed successfully',
        colaborador_id: payload.data.colaborador_id
      });

    } catch (error) {
      console.error('Termination webhook error:', error);
      
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Record failed processing
      await this.integrationMonitoring.recordIntegrationEvent(
        'rh_legado_webhook',
        'webhook_processed',
        'failure',
        responseTime,
        req.body,
        errorMessage,
        correlationId
      );
      
      await this.auditService.logAction(
        req.body?.data?.colaborador_id || 'unknown',
        'webhook',
        'webhook_desligamento_erro',
        {
          userId: 'sistema',
          userName: 'RH Legado Webhook',
          motivo: `Erro no processamento: ${errorMessage}`
        },
        { payload: req.body },
        { error: errorMessage }
      );

      res.status(500).json({ error: 'Internal server error', acknowledged: false });
    }
  }

  /**
   * Handle colaborador promotion webhook
   */
  async handleColaboradorPromovido(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const correlationId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const payload: WebhookPayload = req.body;
      
      // Record webhook received event
      await this.integrationMonitoring.recordIntegrationEvent(
        'rh_legado_webhook',
        'webhook_received',
        'success',
        0,
        { eventType: 'colaborador.promovido', colaboradorId: payload.data?.colaborador_id },
        undefined,
        correlationId
      );
      
      if (!this.validateWebhookSignature(req.headers, req.body)) {
        const responseTime = Date.now() - startTime;
        await this.integrationMonitoring.recordIntegrationEvent(
          'rh_legado_webhook',
          'webhook_processed',
          'failure',
          responseTime,
          payload,
          'Invalid webhook signature',
          correlationId
        );
        
        res.status(401).json({ error: 'Invalid signature', acknowledged: false });
        return;
      }

      const validationErrors = this.validatePromocaoPayload(payload);
      if (validationErrors.length > 0) {
        const responseTime = Date.now() - startTime;
        await this.integrationMonitoring.recordIntegrationEvent(
          'rh_legado_webhook',
          'webhook_processed',
          'failure',
          responseTime,
          payload,
          `Validation errors: ${validationErrors.join(', ')}`,
          correlationId
        );
        
        res.status(400).json({ 
          error: 'Invalid payload', 
          details: validationErrors, 
          acknowledged: false 
        });
        return;
      }

      const event: ColaboradorEvent = {
        colaboradorId: payload.data.colaborador_id,
        nome: payload.data.nome,
        cpf: payload.data.cpf,
        cargoId: payload.data.cargo_id,
        centroCustoId: payload.data.centro_custo_id,
        turno: payload.data.turno,
        dataAdmissao: new Date(payload.data.data_admissao),
        pcd: payload.data.pcd,
        status: payload.data.status,
        eventType: 'promocao',
        eventData: {
          cargoAnterior: payload.data.cargo_anterior!,
          dataEvento: new Date(payload.data.data_evento || payload.timestamp)
        }
      };

      await this.processWithRetry(event, payload, correlationId);

      const responseTime = Date.now() - startTime;
      
      // Record successful processing
      await this.integrationMonitoring.recordIntegrationEvent(
        'rh_legado_webhook',
        'webhook_processed',
        'success',
        responseTime,
        payload,
        undefined,
        correlationId
      );

      await this.auditService.logAction(
        payload.data.colaborador_id,
        'webhook',
        'webhook_promocao_processado',
        {
          userId: 'sistema',
          userName: 'RH Legado Webhook',
          motivo: 'Webhook de promoção processado com sucesso'
        },
        undefined,
        { payload, event }
      );

      res.json({ 
        acknowledged: true, 
        message: 'Promotion processed successfully',
        colaborador_id: payload.data.colaborador_id
      });

    } catch (error) {
      console.error('Promotion webhook error:', error);
      
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Record failed processing
      await this.integrationMonitoring.recordIntegrationEvent(
        'rh_legado_webhook',
        'webhook_processed',
        'failure',
        responseTime,
        req.body,
        errorMessage,
        correlationId
      );
      
      await this.auditService.logAction(
        req.body?.data?.colaborador_id || 'unknown',
        'webhook',
        'webhook_promocao_erro',
        {
          userId: 'sistema',
          userName: 'RH Legado Webhook',
          motivo: `Erro no processamento: ${errorMessage}`
        },
        { payload: req.body },
        { error: errorMessage }
      );

      res.status(500).json({ error: 'Internal server error', acknowledged: false });
    }
  }

  /**
   * Process event with exponential backoff retry logic
   * Requirements: 10.5 - Retry logic with exponential backoff
   */
  private async processWithRetry(event: ColaboradorEvent, payload: WebhookPayload, correlationId?: string): Promise<void> {
    let lastError: Error | null = null;
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const attemptStartTime = Date.now();
        await this.normalizacaoService.processColaboradorEvent(event);
        
        const attemptDuration = Date.now() - attemptStartTime;
        const totalDuration = Date.now() - startTime;
        
        // Log successful processing after retries
        if (attempt > 1) {
          await this.auditService.logAction(
            event.colaboradorId,
            'webhook',
            'webhook_retry_success',
            {
              userId: 'sistema',
              userName: 'RH Legado Webhook',
              motivo: `Processamento bem-sucedido na tentativa ${attempt}`
            },
            { totalAttempts: attempt, totalDuration },
            { payload, event, attemptDuration }
          );
        }
        
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === this.config.retryAttempts) {
          // Last attempt failed, log final failure
          const totalDuration = Date.now() - startTime;
          
          await this.auditService.logAction(
            event.colaboradorId,
            'webhook',
            'webhook_retry_exhausted',
            {
              userId: 'sistema',
              userName: 'RH Legado Webhook',
              motivo: `Todas as ${attempt} tentativas falharam após ${totalDuration}ms`
            },
            { totalAttempts: attempt, totalDuration },
            { error: lastError.message, payload, event }
          );
          
          throw lastError;
        }

        // Calculate exponential backoff delay with jitter
        const baseDelay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * baseDelay; // Add up to 10% jitter
        const delay = Math.min(baseDelay + jitter, this.config.maxRetryDelayMs);

        console.warn(`Webhook processing attempt ${attempt} failed, retrying in ${Math.round(delay)}ms:`, lastError.message);
        
        // Record retry event
        await this.integrationMonitoring.recordIntegrationEvent(
          'rh_legado_webhook',
          'webhook_retry',
          'retry',
          delay,
          payload,
          lastError.message,
          correlationId
        );
        
        // Log retry attempt
        await this.auditService.logAction(
          event.colaboradorId,
          'webhook',
          'webhook_retry',
          {
            userId: 'sistema',
            userName: 'RH Legado Webhook',
            motivo: `Tentativa ${attempt} falhou, reagendando em ${Math.round(delay)}ms`
          },
          { attempt, delay: Math.round(delay), error: lastError.message },
          { payload, event }
        );

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Validate webhook signature for security
   * Requirements: 10.1 - Webhook signature validation
   */
  private validateWebhookSignature(headers: any, body: any): boolean {
    const signature = headers['x-webhook-signature'] || headers['X-Webhook-Signature'];
    
    if (!signature) {
      console.warn('Missing webhook signature');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(JSON.stringify(body))
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  private validateAdmissaoPayload(payload: WebhookPayload): string[] {
    const errors: string[] = [];

    if (!payload.data.colaborador_id) errors.push('colaborador_id é obrigatório');
    if (!payload.data.nome) errors.push('nome é obrigatório');
    if (!payload.data.cpf) errors.push('cpf é obrigatório');
    if (!payload.data.cargo_id) errors.push('cargo_id é obrigatório');
    if (!payload.data.centro_custo_id) errors.push('centro_custo_id é obrigatório');
    if (!payload.data.turno) errors.push('turno é obrigatório');
    if (!payload.data.data_admissao) errors.push('data_admissao é obrigatória');
    if (typeof payload.data.pcd !== 'boolean') errors.push('pcd deve ser boolean');
    if (!['ativo', 'inativo'].includes(payload.data.status)) errors.push('status deve ser ativo ou inativo');

    return errors;
  }

  private validateTransferenciaPayload(payload: WebhookPayload): string[] {
    const errors = this.validateAdmissaoPayload(payload);
    
    if (!payload.data.centro_custo_anterior) {
      errors.push('centro_custo_anterior é obrigatório para transferência');
    }

    return errors;
  }

  private validateDesligamentoPayload(payload: WebhookPayload): string[] {
    const errors = this.validateAdmissaoPayload(payload);
    
    // For termination, data_desligamento is optional (defaults to current date)
    return errors;
  }

  private validatePromocaoPayload(payload: WebhookPayload): string[] {
    const errors = this.validateAdmissaoPayload(payload);
    
    if (!payload.data.cargo_anterior) {
      errors.push('cargo_anterior é obrigatório para promoção');
    }

    return errors;
  }

  /**
   * Handle cargo discrepancy according to company configuration
   * Requirements: 10.2 - Apply configured action (alert, allow, block, require approval)
   */
  private async handleCargoDiscrepancy(event: ColaboradorEvent, payload: WebhookPayload): Promise<CargoDiscrepancyResult> {
    try {
      // Find the expected quadro for this position
      const quadros = await this.quadroRepository.findByPostoAndCargo(
        event.centroCustoId,
        event.cargoId
      );

      // If no quadro found, this might be a discrepancy
      let expectedCargoId: string | null = null;
      let empresaId: string | null = null;

      if (quadros.length === 0) {
        // Try to find any quadro for this posto to get the expected cargo
        const allQuadrosForPosto = await this.quadroRepository.findByPosto(event.centroCustoId);
        if (allQuadrosForPosto.length > 0) {
          expectedCargoId = allQuadrosForPosto[0].cargoId;
          // Get empresa_id through plano_vagas relationship
          empresaId = await this.getEmpresaIdFromPlanoVagas(allQuadrosForPosto[0].planoVagasId);
        }
      } else {
        // Check if the cargo matches the expected one
        const activeQuadro = quadros.find(q => q.ativo) || quadros[0];
        if (activeQuadro.cargoVaga && activeQuadro.cargoVaga !== event.cargoId) {
          expectedCargoId = activeQuadro.cargoVaga;
          // Get empresa_id through plano_vagas relationship
          empresaId = await this.getEmpresaIdFromPlanoVagas(activeQuadro.planoVagasId);
        }
      }

      // No discrepancy detected
      if (!expectedCargoId || !empresaId) {
        return {
          action: 'permitir',
          allowed: true,
          message: 'No cargo discrepancy detected',
          requiresApproval: false
        };
      }

      // Get company configuration
      const empresa = await this.empresaRepository.findById(empresaId);
      if (!empresa || !empresa.configuracoes) {
        // Default to 'alertar' if no configuration found
        await this.logCargoDiscrepancy(event, expectedCargoId, 'alertar', 'No company configuration found, defaulting to alert');
        return {
          action: 'alertar',
          allowed: true,
          message: `Cargo discrepancy detected: expected ${expectedCargoId}, got ${event.cargoId}. Defaulting to alert.`,
          requiresApproval: false
        };
      }

      const action = empresa.configuracoes.acaoCargoDiscrepante;

      // Log the discrepancy
      await this.logCargoDiscrepancy(event, expectedCargoId, action, `Cargo discrepancy handled with action: ${action}`);

      switch (action) {
        case 'permitir':
          return {
            action: 'permitir',
            allowed: true,
            message: 'Cargo discrepancy detected but admission allowed by configuration',
            requiresApproval: false
          };

        case 'alertar':
          // Send notification to RH about the discrepancy
          await this.notificationService.sendNotification({
            templateId: 'cargo_discrepancy_alert',
            recipient: 'rh_team', // This should be configurable
            variables: {
              colaboradorNome: event.nome,
              cargoEsperado: expectedCargoId,
              cargoReal: event.cargoId,
              centroCusto: event.centroCustoId,
              dataAdmissao: event.dataAdmissao.toISOString()
            },
            priority: 'high',
            channels: ['email', 'inapp']
          });

          return {
            action: 'alertar',
            allowed: true,
            message: `Cargo discrepancy detected: expected ${expectedCargoId}, got ${event.cargoId}. Alert sent to RH.`,
            requiresApproval: false
          };

        case 'bloquear':
          return {
            action: 'bloquear',
            allowed: false,
            message: `Admission blocked due to cargo discrepancy: expected ${expectedCargoId}, got ${event.cargoId}. Please create a proposal for approval.`,
            requiresApproval: false
          };

        case 'exigir_aprovacao':
          // Create a proposal for approval
          const propostaId = await this.createDiscrepancyProposal(event, expectedCargoId, empresaId!);
          
          return {
            action: 'exigir_aprovacao',
            allowed: false,
            message: `Cargo discrepancy detected: expected ${expectedCargoId}, got ${event.cargoId}. Proposal created for approval.`,
            requiresApproval: true,
            propostaId
          };

        default:
          throw new Error(`Unknown cargo discrepancy action: ${action}`);
      }

    } catch (error) {
      console.error('Error handling cargo discrepancy:', error);
      
      // Log error and default to 'bloquear' for safety
      await this.auditService.logAction(
        event.colaboradorId,
        'webhook',
        'cargo_discrepancy_error',
        {
          userId: 'sistema',
          userName: 'Webhook Controller',
          motivo: `Error handling cargo discrepancy: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        { event, payload },
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        action: 'bloquear',
        allowed: false,
        message: 'Error processing cargo discrepancy. Admission blocked for safety.',
        requiresApproval: false
      };
    }
  }

  /**
   * Log cargo discrepancy for audit trail
   */
  private async logCargoDiscrepancy(
    event: ColaboradorEvent, 
    expectedCargoId: string, 
    action: string, 
    message: string
  ): Promise<void> {
    await this.auditService.logAction(
      event.colaboradorId,
      'colaborador',
      'cargo_discrepancy_detected',
      {
        userId: 'sistema',
        userName: 'RH Legado Webhook',
        motivo: message
      },
      { 
        cargoEsperado: expectedCargoId,
        cargoReal: event.cargoId,
        centroCusto: event.centroCustoId
      },
      { 
        action,
        colaboradorNome: event.nome,
        dataAdmissao: event.dataAdmissao.toISOString()
      }
    );
  }

  /**
   * Create a proposal for cargo discrepancy approval
   */
  private async createDiscrepancyProposal(
    event: ColaboradorEvent, 
    expectedCargoId: string, 
    empresaId: string
  ): Promise<string> {
    // Find the quadro that needs to be modified
    const quadros = await this.quadroRepository.findByPosto(event.centroCustoId);
    const targetQuadro = quadros.find(q => q.cargoVaga === expectedCargoId) || quadros[0];

    if (!targetQuadro) {
      throw new Error(`No quadro found for posto ${event.centroCustoId}`);
    }

    const proposta = await this.propostaService.createProposta({
      tipo: 'alteracao',
      descricao: `Aprovação de discrepância de cargo - Admissão de ${event.nome}`,
      detalhamento: `
        Colaborador: ${event.nome} (${event.cpf})
        Cargo Esperado: ${expectedCargoId}
        Cargo Real: ${event.cargoId}
        Centro de Custo: ${event.centroCustoId}
        Data de Admissão: ${event.dataAdmissao.toISOString()}
        
        Esta proposta foi criada automaticamente devido à discrepância entre o cargo previsto na vaga e o cargo real da contratação.
      `,
      solicitanteId: 'sistema',
      quadroLotacaoId: targetQuadro.id,
      cargoAtual: expectedCargoId,
      cargoNovo: event.cargoId,
      impactoOrcamentario: 'A ser avaliado pelo aprovador',
      analiseImpacto: 'Discrepância de cargo detectada automaticamente pelo sistema'
    }, {
      userId: 'sistema',
      userName: 'Sistema de Webhook'
    });

    // Send notification about the proposal creation
    await this.notificationService.sendNotification({
      templateId: 'proposal_created',
      recipient: 'rh_team',
      variables: {
        propostaId: proposta.id,
        colaboradorNome: event.nome,
        cargoEsperado: expectedCargoId,
        cargoReal: event.cargoId,
        tipo: 'Discrepância de Cargo'
      },
      priority: 'high',
      channels: ['email', 'inapp']
    });

    return proposta.id;
  }

  /**
   * Get empresa_id from plano_vagas_id
   */
  private async getEmpresaIdFromPlanoVagas(planoVagasId: string): Promise<string | null> {
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(
          'SELECT empresa_id FROM planos_vagas WHERE id = $1',
          [planoVagasId]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return result.rows[0].empresa_id;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting empresa_id from plano_vagas:', error);
      return null;
    }
  }

  /**
   * Health check endpoint for webhook service
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Basic health check - could be expanded to check database connectivity
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'webhook-controller',
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}