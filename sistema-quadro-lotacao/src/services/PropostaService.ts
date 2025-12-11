import type { Pool } from 'pg';
import { PropostaRepository } from '../repositories/PropostaRepository.js';
import type { PropostaFilters } from '../repositories/PropostaRepository.js';
import { AprovacaoRepository } from '../repositories/AprovacaoRepository.js';
import { QuadroLotacaoRepository } from '../repositories/QuadroLotacaoRepository.js';
import { AuditService } from './AuditService.js';
import { PropostaModel } from '../models/Proposta.js';

import type { PropostaStatus, WorkflowConfig } from '../types/index.js';

export interface CreatePropostaRequest {
  tipo: 'inclusao' | 'alteracao' | 'exclusao' | 'transferencia';
  descricao: string;
  detalhamento: string;
  solicitanteId: string;
  quadroLotacaoId: string;
  cargoAtual?: string;
  cargoNovo?: string;
  vagasAtuais?: number;
  vagasSolicitadas?: number;
  centroCustoDestino?: string;
  impactoOrcamentario?: string;
  analiseImpacto?: string;
  anexos?: string[];
}

export interface ApprovalRequest {
  aprovadorId: string;
  comentario?: string;
}

export interface RejectionRequest {
  aprovadorId: string;
  comentario: string;
  motivo: string;
}

export interface WorkflowAprovador {
  nivel: number;
  aprovadorId: string;
  nome?: string;
}

/**
 * PropostaService - Business logic for proposal management
 * Handles CRUD operations, workflow state transitions, and approval/rejection logic
 */
export class PropostaService {
  private propostaRepository: PropostaRepository;
  private aprovacaoRepository: AprovacaoRepository;
  private quadroRepository: QuadroLotacaoRepository;
  private auditService: AuditService;

  constructor(pool: Pool) {
    this.propostaRepository = new PropostaRepository(pool);
    this.aprovacaoRepository = new AprovacaoRepository(pool);
    this.quadroRepository = new QuadroLotacaoRepository(pool);
    this.auditService = new AuditService(pool);
  }

  /**
   * Create a new proposta
   */
  async createProposta(
    request: CreatePropostaRequest,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    // Validate quadro exists
    const quadro = await this.quadroRepository.findById(request.quadroLotacaoId);
    if (!quadro) {
      throw new Error('Quadro de lotação não encontrado');
    }

    // Create proposta model
    const proposta = new PropostaModel(
      crypto.randomUUID(),
      request.tipo,
      request.descricao,
      request.detalhamento,
      request.solicitanteId,
      request.quadroLotacaoId,
      'rascunho',
      request.cargoAtual,
      request.cargoNovo,
      request.vagasAtuais,
      request.vagasSolicitadas,
      request.centroCustoDestino,
      request.impactoOrcamentario,
      request.analiseImpacto,
      request.anexos,
      new Date(),
      new Date()
    );

    // Validate proposta
    const validationErrors = proposta.validate();
    if (validationErrors.length > 0) {
      throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`);
    }

    // Create proposta
    const createdProposta = await this.propostaRepository.create(proposta, auditContext);

    // Log audit
    await this.auditService.logAction(
      createdProposta.id,
      'proposta',
      'criacao',
      auditContext,
      undefined,
      createdProposta.toJSON()
    );

    return createdProposta;
  }

  /**
   * Update proposta (only if in draft status)
   */
  async updateProposta(
    id: string,
    updates: Partial<CreatePropostaRequest>,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    const proposta = await this.propostaRepository.findById(id);
    if (!proposta) {
      throw new Error('Proposta não encontrada');
    }

    if (!proposta.canEdit()) {
      throw new Error('Proposta não pode ser editada no status atual');
    }

    const valoresAntes = proposta.toJSON();

    // Apply updates
    if (updates.descricao !== undefined) proposta.descricao = updates.descricao;
    if (updates.detalhamento !== undefined) proposta.detalhamento = updates.detalhamento;
    if (updates.cargoAtual !== undefined) proposta.cargoAtual = updates.cargoAtual;
    if (updates.cargoNovo !== undefined) proposta.cargoNovo = updates.cargoNovo;
    if (updates.vagasAtuais !== undefined) proposta.vagasAtuais = updates.vagasAtuais;
    if (updates.vagasSolicitadas !== undefined) proposta.vagasSolicitadas = updates.vagasSolicitadas;
    if (updates.centroCustoDestino !== undefined) proposta.centroCustoDestino = updates.centroCustoDestino;
    if (updates.impactoOrcamentario !== undefined) proposta.impactoOrcamentario = updates.impactoOrcamentario;
    if (updates.analiseImpacto !== undefined) proposta.analiseImpacto = updates.analiseImpacto;
    if (updates.anexos !== undefined) proposta.anexos = updates.anexos;

    // Validate updated proposta
    const validationErrors = proposta.validate();
    if (validationErrors.length > 0) {
      throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`);
    }

    // Update proposta
    const updatedProposta = await this.propostaRepository.update(id, proposta, auditContext);

    // Log audit
    await this.auditService.logAction(
      id,
      'proposta',
      'atualizacao',
      auditContext,
      valoresAntes,
      updatedProposta.toJSON()
    );

    return updatedProposta;
  }

  /**
   * Submit proposta for approval (creates workflow)
   */
  async submitProposta(
    id: string,
    workflowConfig: WorkflowConfig,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    const proposta = await this.propostaRepository.findById(id);
    if (!proposta) {
      throw new Error('Proposta não encontrada');
    }

    if (!proposta.canSubmit()) {
      throw new Error('Proposta não pode ser enviada para aprovação');
    }

    const valoresAntes = proposta.toJSON();

    // Update status to nivel_1
    proposta.submit();
    const updatedProposta = await this.propostaRepository.update(id, proposta, auditContext);

    // Create workflow aprovacoes
    const aprovadores: Array<{ nivel: number; aprovadorId: string }> = [];
    
    // Add configured levels
    workflowConfig.niveis.forEach(nivel => {
      nivel.aprovadores.forEach(aprovadorId => {
        aprovadores.push({
          nivel: nivel.ordem,
          aprovadorId
        });
      });
    });

    // Add RH level if configured
    if (workflowConfig.incluirRH) {
      // This would typically come from configuration or be passed as parameter
      // For now, we'll add a placeholder RH level
      aprovadores.push({
        nivel: 4,
        aprovadorId: 'rh-aprovador' // This should come from configuration
      });
    }

    await this.aprovacaoRepository.createWorkflowAprovacoes(id, aprovadores, auditContext);

    // Log audit
    await this.auditService.logAction(
      id,
      'proposta',
      'envio_aprovacao',
      auditContext,
      valoresAntes,
      updatedProposta.toJSON()
    );

    return updatedProposta;
  }

  /**
   * Approve proposta at current level
   */
  async approveProposta(
    id: string,
    request: ApprovalRequest,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    const proposta = await this.propostaRepository.findById(id);
    if (!proposta) {
      throw new Error('Proposta não encontrada');
    }

    if (!proposta.canApprove()) {
      throw new Error('Proposta não pode ser aprovada no status atual');
    }

    // Find current level aprovacao
    const currentLevel = proposta.getCurrentApprovalLevel();
    const aprovacao = await this.aprovacaoRepository.findByPropostaAndNivel(id, currentLevel);
    
    if (!aprovacao) {
      throw new Error('Aprovação não encontrada para o nível atual');
    }

    if (!aprovacao.belongsToApprover(request.aprovadorId)) {
      throw new Error('Usuário não autorizado para esta aprovação');
    }

    const valoresAntes = proposta.toJSON();

    // Update aprovacao
    await this.aprovacaoRepository.updateAction(
      aprovacao.id,
      'aprovado',
      request.comentario,
      auditContext
    );

    // Check if this was the last approval
    const allCompleted = await this.aprovacaoRepository.areAllAprovacoesConcluidas(id);
    
    if (allCompleted) {
      // All approvals completed - mark as approved
      proposta.status = 'aprovada';
    } else {
      // Move to next level
      const nextLevel = proposta.getNextApprovalLevel();
      if (nextLevel) {
        const statusMap: Record<number, PropostaStatus> = {
          2: 'nivel_2',
          3: 'nivel_3',
          4: 'rh'
        };
        proposta.status = statusMap[nextLevel] || 'aprovada';
      }
    }

    const updatedProposta = await this.propostaRepository.update(id, proposta, auditContext);

    // If fully approved, apply changes to quadro
    if (proposta.status === 'aprovada') {
      await this.applyPropostaChanges(proposta, auditContext);
    }

    // Log audit
    const auditContextWithApprover = {
      ...auditContext,
      aprovadorId: request.aprovadorId,
      motivo: auditContext.motivo || 'Aprovação de proposta'
    };
    await this.auditService.logAction(
      id,
      'proposta',
      'aprovacao',
      auditContextWithApprover,
      valoresAntes,
      updatedProposta.toJSON()
    );

    return updatedProposta;
  }

  /**
   * Reject proposta (returns to draft)
   */
  async rejectProposta(
    id: string,
    request: RejectionRequest,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    const proposta = await this.propostaRepository.findById(id);
    if (!proposta) {
      throw new Error('Proposta não encontrada');
    }

    if (!proposta.canReject()) {
      throw new Error('Proposta não pode ser rejeitada no status atual');
    }

    // Find current level aprovacao
    const currentLevel = proposta.getCurrentApprovalLevel();
    const aprovacao = await this.aprovacaoRepository.findByPropostaAndNivel(id, currentLevel);
    
    if (!aprovacao) {
      throw new Error('Aprovação não encontrada para o nível atual');
    }

    if (!aprovacao.belongsToApprover(request.aprovadorId)) {
      throw new Error('Usuário não autorizado para esta aprovação');
    }

    const valoresAntes = proposta.toJSON();

    // Update aprovacao
    await this.aprovacaoRepository.updateAction(
      aprovacao.id,
      'rejeitado',
      request.comentario,
      auditContext
    );

    // Reset proposta to draft
    proposta.reject();
    const updatedProposta = await this.propostaRepository.update(id, proposta, auditContext);

    // Reset all aprovacoes
    await this.aprovacaoRepository.resetAprovacoes(id, auditContext);

    // Log audit
    const auditContextWithApprover = {
      ...auditContext,
      aprovadorId: request.aprovadorId,
      motivo: request.motivo
    };
    await this.auditService.logAction(
      id,
      'proposta',
      'rejeicao',
      auditContextWithApprover,
      valoresAntes,
      updatedProposta.toJSON()
    );

    return updatedProposta;
  }

  /**
   * Get proposta by ID
   */
  async getPropostaById(id: string): Promise<PropostaModel | null> {
    return this.propostaRepository.findById(id);
  }

  /**
   * Get proposta with approval history
   */
  async getPropostaWithHistory(id: string): Promise<any> {
    return this.propostaRepository.findWithApprovalHistory(id);
  }

  /**
   * List propostas with filters
   */
  async listPropostas(filters: PropostaFilters): Promise<PropostaModel[]> {
    return this.propostaRepository.findAll(filters);
  }

  /**
   * Get propostas for a specific user (as solicitante)
   */
  async getPropostasBySolicitante(solicitanteId: string): Promise<PropostaModel[]> {
    return this.propostaRepository.findBySolicitante(solicitanteId);
  }

  /**
   * Get pending propostas for approval by user
   */
  async getPendingPropostasForApprover(aprovadorId: string): Promise<PropostaModel[]> {
    return this.propostaRepository.findPendingForApprover(aprovadorId);
  }

  /**
   * Get propostas statistics
   */
  async getPropostasStatistics(): Promise<Record<PropostaStatus, number>> {
    return this.propostaRepository.getStatusStatistics();
  }

  /**
   * Get overdue propostas
   */
  async getOverduePropostas(maxDays: number = 3): Promise<PropostaModel[]> {
    return this.propostaRepository.findOverdue(maxDays);
  }

  /**
   * Delete proposta (only if in draft)
   */
  async deleteProposta(
    id: string,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<void> {
    const proposta = await this.propostaRepository.findById(id);
    if (!proposta) {
      throw new Error('Proposta não encontrada');
    }

    if (!proposta.isDraft()) {
      throw new Error('Apenas propostas em rascunho podem ser excluídas');
    }

    // Log audit before deletion
    await this.auditService.logAction(
      id,
      'proposta',
      'exclusao',
      auditContext,
      proposta.toJSON(),
      undefined
    );

    await this.propostaRepository.delete(id, auditContext);
  }

  /**
   * Apply proposta changes to quadro (when approved)
   */
  private async applyPropostaChanges(
    proposta: PropostaModel,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<void> {
    const quadro = await this.quadroRepository.findById(proposta.quadroLotacaoId);
    if (!quadro) {
      throw new Error('Quadro de lotação não encontrado');
    }

    const valoresAntes = quadro.toJSON();

    switch (proposta.tipo) {
      case 'inclusao':
        if (proposta.vagasSolicitadas) {
          quadro.vagasPrevistas += proposta.vagasSolicitadas;
        }
        break;

      case 'alteracao':
        if (proposta.vagasSolicitadas !== undefined && proposta.vagasAtuais !== undefined) {
          const diferenca = proposta.vagasSolicitadas - proposta.vagasAtuais;
          quadro.vagasPrevistas += diferenca;
        }
        break;

      case 'exclusao':
        if (proposta.vagasAtuais) {
          quadro.vagasPrevistas = Math.max(0, quadro.vagasPrevistas - proposta.vagasAtuais);
        }
        break;

      case 'transferencia':
        // For transfers, this would involve updating multiple quadros
        // Implementation would depend on specific business rules
        break;
    }

    // Ensure vagas_previstas is not negative
    if (quadro.vagasPrevistas < 0) {
      quadro.vagasPrevistas = 0;
    }

    await this.quadroRepository.update(quadro.id, quadro, auditContext);

    // Log audit for quadro change
    const quadroAuditContext = {
      ...auditContext,
      motivo: `Aplicação da proposta ${proposta.id}`
    };
    await this.auditService.logAction(
      quadro.id,
      'quadro_lotacao',
      'aplicacao_proposta',
      quadroAuditContext,
      valoresAntes,
      quadro.toJSON()
    );
  }
}