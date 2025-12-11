import { Pool } from 'pg';
import { QuadroLotacaoRepository } from '../repositories/index.js';
import { QuadroLotacaoModel, ColaboradorModel } from '../models/index.js';
import { AuditService } from './AuditService.js';
import { Colaborador } from '../types/index.js';

export interface NormalizacaoParams {
  planoVagasId: string;
  dataInicio?: Date;
  dataFim?: Date;
  centroCustoIds?: string[];
  forceRecalculate?: boolean;
}

export interface NormalizacaoResult {
  processedPostos: number;
  updatedQuadros: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface ColaboradorEvent {
  colaboradorId: string;
  nome: string;
  cpf: string;
  cargoId: string;
  centroCustoId: string;
  turno: string;
  dataAdmissao: Date;
  dataDesligamento?: Date;
  pcd: boolean;
  status: 'ativo' | 'inativo';
  eventType: 'admissao' | 'transferencia' | 'desligamento' | 'promocao';
  eventData?: {
    centroCustoAnterior?: string;
    cargoAnterior?: string;
    dataEvento: Date;
  };
}

export class NormalizacaoService {
  private quadroRepository: QuadroLotacaoRepository;
  private auditService: AuditService;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.quadroRepository = new QuadroLotacaoRepository(pool);
    this.auditService = new AuditService(pool);
  }

  /**
   * Executes real-time normalization for a specific colaborador event
   * Requirements: 3.1 - Real-time processing (< 2 seconds)
   */
  async processColaboradorEvent(event: ColaboradorEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      const auditContext = {
        userId: 'sistema',
        userName: 'Sistema de Normalização',
        motivo: `Processamento automático - ${event.eventType}: ${event.colaboradorId}`
      };

      // Validate event data
      this.validateColaboradorEvent(event);

      switch (event.eventType) {
        case 'admissao':
          await this.processAdmissao(event, auditContext);
          break;
        case 'transferencia':
          await this.processTransferencia(event, auditContext);
          break;
        case 'desligamento':
          await this.processDesligamento(event, auditContext);
          break;
        case 'promocao':
          await this.processPromocao(event, auditContext);
          break;
        default:
          throw new Error(`Tipo de evento não suportado: ${event.eventType}`);
      }

      const duration = Date.now() - startTime;
      
      // Log successful processing
      await this.auditService.logAction(
        event.colaboradorId,
        'colaborador',
        `normalizacao_${event.eventType}`,
        {
          userId: 'sistema',
          userName: 'Sistema de Normalização',
          motivo: `Processamento concluído em ${duration}ms`
        },
        undefined,
        { event, duration }
      );

      // Ensure processing time is under 2 seconds (requirement 3.1)
      if (duration > 2000) {
        console.warn(`Normalization processing took ${duration}ms, exceeding 2s requirement`);
        
        // Log performance warning
        await this.auditService.logAction(
          event.colaboradorId,
          'performance',
          'normalizacao_performance_warning',
          {
            userId: 'sistema',
            userName: 'Sistema de Normalização',
            motivo: `Processamento excedeu limite de 2s: ${duration}ms`
          },
          undefined,
          { event, duration, threshold: 2000 }
        );
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      await this.auditService.logAction(
        event.colaboradorId,
        'colaborador',
        `normalizacao_erro_${event.eventType}`,
        {
          userId: 'sistema',
          userName: 'Sistema de Normalização',
          motivo: `Erro no processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        },
        { event },
        { error: error instanceof Error ? error.message : 'Erro desconhecido', duration }
      );

      throw error;
    }
  }

  /**
   * Executes full normalization for a period
   * Requirements: 3.2 - Process all postos regardless of control start date
   */
  async executeNormalizacao(params: NormalizacaoParams): Promise<NormalizacaoResult> {
    const startTime = new Date();
    const result: NormalizacaoResult = {
      processedPostos: 0,
      updatedQuadros: 0,
      errors: [],
      startTime,
      endTime: new Date(),
      duration: 0
    };

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Clear existing efetivo data for the period (requirement 3.3)
      if (params.forceRecalculate) {
        await this.clearQuadroEfetivo(params.planoVagasId, client);
      }

      // Get all quadros for the plan
      const quadros = await this.quadroRepository.findByPlanoVagas(params.planoVagasId);
      
      for (const quadro of quadros) {
        try {
          // Process each posto de trabalho regardless of control start date (requirement 3.2)
          const colaboradores = await this.getColaboradoresAtivos(
            quadro.postoTrabalhoId,
            quadro.cargoId,
            client
          );

          const vagasEfetivasAntes = quadro.vagasEfetivas;
          quadro.vagasEfetivas = colaboradores.length;

          if (vagasEfetivasAntes !== quadro.vagasEfetivas) {
            await this.quadroRepository.update(quadro.id, quadro, {
              userId: 'sistema',
              userName: 'Sistema de Normalização',
              motivo: `Normalização automática - Efetivo: ${vagasEfetivasAntes} → ${quadro.vagasEfetivas}`
            });
            result.updatedQuadros++;
          }

          result.processedPostos++;

        } catch (error) {
          const errorMsg = `Erro ao processar posto ${quadro.postoTrabalhoId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      const errorMsg = `Erro na normalização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      result.errors.push(errorMsg);
      throw error;
    } finally {
      client.release();
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
    }

    // Log normalization completion
    await this.auditService.logAction({
      entidadeId: params.planoVagasId,
      entidadeTipo: 'plano_vagas',
      acao: 'normalizacao_completa',
      usuarioId: 'sistema',
      usuarioNome: 'Sistema de Normalização',
      motivo: 'Normalização executada',
      valoresDepois: result
    });

    return result;
  }

  /**
   * Validate colaborador event data
   */
  private validateColaboradorEvent(event: ColaboradorEvent): void {
    const errors: string[] = [];

    if (!event.colaboradorId) errors.push('colaboradorId é obrigatório');
    if (!event.nome) errors.push('nome é obrigatório');
    if (!event.cpf) errors.push('cpf é obrigatório');
    if (!event.cargoId) errors.push('cargoId é obrigatório');
    if (!event.centroCustoId) errors.push('centroCustoId é obrigatório');
    if (!event.dataAdmissao) errors.push('dataAdmissao é obrigatória');
    if (!['admissao', 'transferencia', 'desligamento', 'promocao'].includes(event.eventType)) {
      errors.push('eventType deve ser: admissao, transferencia, desligamento ou promocao');
    }

    // Specific validations per event type
    if (event.eventType === 'transferencia' && !event.eventData?.centroCustoAnterior) {
      errors.push('centroCustoAnterior é obrigatório para transferência');
    }

    if (event.eventType === 'promocao' && !event.eventData?.cargoAnterior) {
      errors.push('cargoAnterior é obrigatório para promoção');
    }

    if (errors.length > 0) {
      throw new Error(`Dados do evento inválidos: ${errors.join(', ')}`);
    }
  }

  private async processAdmissao(event: ColaboradorEvent, auditContext: any): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Find the appropriate quadro for this colaborador
      const quadros = await this.quadroRepository.findByPostoAndCargo(
        event.centroCustoId, // Using centroCustoId as posto for now
        event.cargoId
      );

      if (quadros.length === 0) {
        // Try to find any quadro for this posto to suggest alternatives
        const allQuadrosForPosto = await this.quadroRepository.findByPosto(event.centroCustoId);
        const availableCargos = allQuadrosForPosto.map(q => q.cargoId).join(', ');
        
        throw new Error(
          `Nenhum quadro encontrado para centro de custo ${event.centroCustoId} e cargo ${event.cargoId}. ` +
          `Cargos disponíveis neste posto: ${availableCargos || 'nenhum'}`
        );
      }

      // Use the first active quadro
      const quadro = quadros.find(q => q.ativo) || quadros[0];
      
      if (!quadro.ativo) {
        console.warn(`Admissão em quadro inativo: ${quadro.id}`);
      }
      
      // Check if there are available positions
      if (!quadro.canAddColaborador()) {
        // Log warning but allow admission (business rule may handle this)
        console.warn(`Admissão em quadro sem vagas disponíveis: ${quadro.id} - Vagas previstas: ${quadro.vagasPrevistas}, Efetivas: ${quadro.vagasEfetivas}, Reservadas: ${quadro.vagasReservadas}`);
        
        await this.auditService.logAction(
          quadro.id,
          'quadro_lotacao',
          'admissao_sem_vagas',
          {
            userId: auditContext.userId,
            userName: auditContext.userName,
            motivo: `Admissão realizada sem vagas disponíveis - Colaborador: ${event.nome}`
          },
          { 
            vagasPrevistas: quadro.vagasPrevistas,
            vagasEfetivas: quadro.vagasEfetivas,
            vagasReservadas: quadro.vagasReservadas
          },
          { event }
        );
      }

      // Update quadro efetivo
      const vagasEfetivasAntes = quadro.vagasEfetivas;
      quadro.vagasEfetivas++;
      quadro.updatedAt = new Date();

      await this.quadroRepository.update(quadro.id, quadro, {
        ...auditContext,
        motivo: `${auditContext.motivo} - Efetivo: ${vagasEfetivasAntes} → ${quadro.vagasEfetivas}`
      });

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async processTransferencia(event: ColaboradorEvent, auditContext: any): Promise<void> {
    if (!event.eventData?.centroCustoAnterior) {
      throw new Error('Centro de custo anterior é obrigatório para transferência');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Remove from previous quadro
      const quadrosAnteriores = await this.quadroRepository.findByPostoAndCargo(
        event.eventData.centroCustoAnterior,
        event.eventData.cargoAnterior || event.cargoId
      );

      let removedFromPrevious = false;
      for (const quadroAnterior of quadrosAnteriores) {
        if (quadroAnterior.vagasEfetivas > 0) {
          const vagasEfetivasAntes = quadroAnterior.vagasEfetivas;
          quadroAnterior.vagasEfetivas--;
          quadroAnterior.updatedAt = new Date();
          
          await this.quadroRepository.update(quadroAnterior.id, quadroAnterior, {
            ...auditContext,
            motivo: `${auditContext.motivo} - Saída por transferência - Efetivo: ${vagasEfetivasAntes} → ${quadroAnterior.vagasEfetivas}`
          });
          removedFromPrevious = true;
          break;
        }
      }

      if (!removedFromPrevious) {
        console.warn(`Transferência: Nenhum colaborador encontrado no quadro anterior - Centro: ${event.eventData.centroCustoAnterior}, Cargo: ${event.eventData.cargoAnterior || event.cargoId}`);
      }

      // Add to new quadro
      const quadrosNovos = await this.quadroRepository.findByPostoAndCargo(
        event.centroCustoId,
        event.cargoId
      );

      if (quadrosNovos.length === 0) {
        throw new Error(`Nenhum quadro encontrado para o destino da transferência - Centro: ${event.centroCustoId}, Cargo: ${event.cargoId}`);
      }

      const quadroNovo = quadrosNovos.find(q => q.ativo) || quadrosNovos[0];
      const vagasEfetivasAntes = quadroNovo.vagasEfetivas;
      quadroNovo.vagasEfetivas++;
      quadroNovo.updatedAt = new Date();
      
      await this.quadroRepository.update(quadroNovo.id, quadroNovo, {
        ...auditContext,
        motivo: `${auditContext.motivo} - Entrada por transferência - Efetivo: ${vagasEfetivasAntes} → ${quadroNovo.vagasEfetivas}`
      });

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async processDesligamento(event: ColaboradorEvent, auditContext: any): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Find quadros for this colaborador
      const quadros = await this.quadroRepository.findByPostoAndCargo(
        event.centroCustoId,
        event.cargoId
      );

      if (quadros.length === 0) {
        console.warn(`Desligamento: Nenhum quadro encontrado para Centro: ${event.centroCustoId}, Cargo: ${event.cargoId}`);
        return;
      }

      let removedFromQuadro = false;
      for (const quadro of quadros) {
        if (quadro.vagasEfetivas > 0) {
          const vagasEfetivasAntes = quadro.vagasEfetivas;
          quadro.vagasEfetivas--;
          quadro.updatedAt = new Date();
          
          await this.quadroRepository.update(quadro.id, quadro, {
            ...auditContext,
            motivo: `${auditContext.motivo} - Efetivo: ${vagasEfetivasAntes} → ${quadro.vagasEfetivas}`
          });
          removedFromQuadro = true;
          break;
        }
      }

      if (!removedFromQuadro) {
        console.warn(`Desligamento: Nenhum colaborador efetivo encontrado no quadro - Centro: ${event.centroCustoId}, Cargo: ${event.cargoId}`);
        
        await this.auditService.logAction(
          event.colaboradorId,
          'colaborador',
          'desligamento_sem_efetivo',
          {
            userId: auditContext.userId,
            userName: auditContext.userName,
            motivo: `Desligamento processado mas nenhum colaborador efetivo encontrado no quadro`
          },
          undefined,
          { event, quadros: quadros.map(q => ({ id: q.id, vagasEfetivas: q.vagasEfetivas })) }
        );
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async processPromocao(event: ColaboradorEvent, auditContext: any): Promise<void> {
    if (!event.eventData?.cargoAnterior) {
      throw new Error('Cargo anterior é obrigatório para promoção');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Remove from previous cargo quadro
      const quadrosAnteriores = await this.quadroRepository.findByPostoAndCargo(
        event.centroCustoId,
        event.eventData.cargoAnterior
      );

      let removedFromPrevious = false;
      for (const quadroAnterior of quadrosAnteriores) {
        if (quadroAnterior.vagasEfetivas > 0) {
          const vagasEfetivasAntes = quadroAnterior.vagasEfetivas;
          quadroAnterior.vagasEfetivas--;
          quadroAnterior.updatedAt = new Date();
          
          await this.quadroRepository.update(quadroAnterior.id, quadroAnterior, {
            ...auditContext,
            motivo: `${auditContext.motivo} - Saída por promoção - Efetivo: ${vagasEfetivasAntes} → ${quadroAnterior.vagasEfetivas}`
          });
          removedFromPrevious = true;
          break;
        }
      }

      if (!removedFromPrevious) {
        console.warn(`Promoção: Nenhum colaborador encontrado no cargo anterior - Centro: ${event.centroCustoId}, Cargo: ${event.eventData.cargoAnterior}`);
      }

      // Add to new cargo quadro
      const quadrosNovos = await this.quadroRepository.findByPostoAndCargo(
        event.centroCustoId,
        event.cargoId
      );

      if (quadrosNovos.length === 0) {
        throw new Error(`Nenhum quadro encontrado para o novo cargo da promoção - Centro: ${event.centroCustoId}, Cargo: ${event.cargoId}`);
      }

      const quadroNovo = quadrosNovos.find(q => q.ativo) || quadrosNovos[0];
      const vagasEfetivasAntes = quadroNovo.vagasEfetivas;
      quadroNovo.vagasEfetivas++;
      quadroNovo.updatedAt = new Date();
      
      await this.quadroRepository.update(quadroNovo.id, quadroNovo, {
        ...auditContext,
        motivo: `${auditContext.motivo} - Entrada por promoção - Efetivo: ${vagasEfetivasAntes} → ${quadroNovo.vagasEfetivas}`
      });

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async clearQuadroEfetivo(planoVagasId: string, client: any): Promise<void> {
    await client.query(
      'UPDATE quadro_lotacao SET vagas_efetivas = 0, updated_at = NOW() WHERE plano_vagas_id = $1',
      [planoVagasId]
    );
  }

  private async getColaboradoresAtivos(postoTrabalhoId: string, cargoId: string, client: any): Promise<Colaborador[]> {
    // This is a simplified query - in a real implementation, you'd need to join with posto_trabalho
    // to get the centro_custo_id and then find colaboradores
    const result = await client.query(`
      SELECT c.* FROM colaboradores c
      INNER JOIN postos_trabalho pt ON c.centro_custo_id = pt.centro_custo_id
      WHERE pt.id = $1 AND c.cargo_id = $2 AND c.status = 'ativo'
    `, [postoTrabalhoId, cargoId]);

    return result.rows.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      cpf: row.cpf,
      cargoId: row.cargo_id,
      centroCustoId: row.centro_custo_id,
      turno: row.turno,
      pcd: row.pcd,
      dataAdmissao: new Date(row.data_admissao),
      dataDesligamento: row.data_desligamento ? new Date(row.data_desligamento) : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  /**
   * Get normalization history for reporting
   */
  async getNormalizacaoHistory(planoVagasId?: string, limit: number = 50): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT * FROM audit_logs 
        WHERE acao LIKE 'normalizacao%' 
      `;
      const params: any[] = [];

      if (planoVagasId) {
        query += ` AND entidade_id = $1`;
        params.push(planoVagasId);
      }

      query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(query, params);
      return result.rows;

    } finally {
      client.release();
    }
  }

  /**
   * Process multiple colaborador events in batch for better performance
   * Requirements: 3.1 - Real-time processing with batch optimization
   */
  async processBatchColaboradorEvents(events: ColaboradorEvent[]): Promise<{
    processed: number;
    failed: number;
    errors: Array<{ event: ColaboradorEvent; error: string }>;
  }> {
    const startTime = Date.now();
    const result = {
      processed: 0,
      failed: 0,
      errors: [] as Array<{ event: ColaboradorEvent; error: string }>
    };

    // Process events in parallel with concurrency limit
    const BATCH_SIZE = 10;
    const batches = [];
    
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      batches.push(events.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const promises = batch.map(async (event) => {
        try {
          await this.processColaboradorEvent(event);
          result.processed++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            event,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      });

      await Promise.all(promises);
    }

    const duration = Date.now() - startTime;

    // Log batch processing result
    await this.auditService.logAction(
      'batch_processing',
      'normalizacao_batch',
      'batch_processing_completed',
      {
        userId: 'sistema',
        userName: 'Sistema de Normalização',
        motivo: `Processamento em lote concluído - ${result.processed} sucessos, ${result.failed} falhas em ${duration}ms`
      },
      undefined,
      { 
        totalEvents: events.length,
        processed: result.processed,
        failed: result.failed,
        duration,
        averageTimePerEvent: events.length > 0 ? duration / events.length : 0
      }
    );

    return result;
  }

  /**
   * Get real-time processing statistics
   */
  async getProcessingStats(timeRangeHours: number = 24): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    averageProcessingTime: number;
    eventsByType: Record<string, number>;
    performanceWarnings: number;
  }> {
    const client = await this.pool.connect();
    
    try {
      const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
      
      const result = await client.query(`
        SELECT 
          acao,
          COUNT(*) as count,
          AVG(CASE 
            WHEN valores_depois->>'duration' IS NOT NULL 
            THEN (valores_depois->>'duration')::numeric 
            ELSE NULL 
          END) as avg_duration
        FROM audit_logs 
        WHERE acao LIKE 'normalizacao_%' 
          AND timestamp >= $1
          AND entidade_tipo = 'colaborador'
        GROUP BY acao
        ORDER BY count DESC
      `, [cutoffTime]);

      const stats = {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        averageProcessingTime: 0,
        eventsByType: {} as Record<string, number>,
        performanceWarnings: 0
      };

      let totalDuration = 0;
      let eventsWithDuration = 0;

      for (const row of result.rows) {
        const action = row.acao;
        const count = parseInt(row.count);
        const avgDuration = row.avg_duration ? parseFloat(row.avg_duration) : 0;

        stats.totalEvents += count;

        if (action.includes('_erro_')) {
          stats.failedEvents += count;
        } else if (action.startsWith('normalizacao_') && !action.includes('_erro_')) {
          stats.successfulEvents += count;
        }

        // Extract event type from action
        const eventType = action.replace('normalizacao_', '').replace('_erro_', '');
        stats.eventsByType[eventType] = (stats.eventsByType[eventType] || 0) + count;

        if (avgDuration > 0) {
          totalDuration += avgDuration * count;
          eventsWithDuration += count;
        }
      }

      // Get performance warnings
      const warningResult = await client.query(`
        SELECT COUNT(*) as warning_count
        FROM audit_logs 
        WHERE acao = 'normalizacao_performance_warning'
          AND timestamp >= $1
      `, [cutoffTime]);

      stats.performanceWarnings = parseInt(warningResult.rows[0]?.warning_count || '0');
      stats.averageProcessingTime = eventsWithDuration > 0 ? totalDuration / eventsWithDuration : 0;

      return stats;

    } finally {
      client.release();
    }
  }
}