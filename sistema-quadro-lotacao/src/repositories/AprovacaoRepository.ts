import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository.js';
import { AprovacaoModel } from '../models/Aprovacao.js';

export interface AprovacaoFilters {
  propostaId?: string;
  aprovadorId?: string;
  nivel?: number;
  acao?: 'aprovado' | 'rejeitado' | 'aguardando';
}

export class AprovacaoRepository extends BaseRepository<AprovacaoModel> {
  constructor(pool: Pool) {
    super(pool, 'aprovacoes');
  }

  fromDatabase(row: any): AprovacaoModel {
    return AprovacaoModel.fromDatabase(row);
  }

  toDatabase(entity: AprovacaoModel): Record<string, any> {
    return entity.toDatabase();
  }

  /**
   * Find aprovacoes by proposta ID
   */
  async findByProposta(propostaId: string): Promise<AprovacaoModel[]> {
    return this.findAll({ proposta_id: propostaId }, 'nivel ASC');
  }

  /**
   * Find aprovacoes by aprovador ID
   */
  async findByAprovador(aprovadorId: string): Promise<AprovacaoModel[]> {
    return this.findAll({ aprovador_id: aprovadorId }, 'created_at DESC');
  }

  /**
   * Find pending aprovacoes for a specific aprovador
   */
  async findPendingByAprovador(aprovadorId: string): Promise<AprovacaoModel[]> {
    return this.findAll({ 
      aprovador_id: aprovadorId, 
      acao: 'aguardando' 
    }, 'created_at ASC');
  }

  /**
   * Find aprovacao by proposta and nivel
   */
  async findByPropostaAndNivel(propostaId: string, nivel: number): Promise<AprovacaoModel | null> {
    const query = `
      SELECT * FROM aprovacoes 
      WHERE proposta_id = $1 AND nivel = $2
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [propostaId, nivel]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.fromDatabase(result.rows[0]);
  }

  /**
   * Create multiple aprovacoes for a proposta workflow
   */
  async createWorkflowAprovacoes(
    propostaId: string,
    aprovadores: Array<{ nivel: number; aprovadorId: string }>,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<AprovacaoModel[]> {
    return this.withTransaction(async (client) => {
      await this.setAuditContext(
        client,
        auditContext.userId,
        auditContext.userName,
        auditContext.motivo || 'Criação de workflow de aprovação'
      );

      const aprovacoes: AprovacaoModel[] = [];

      for (const { nivel, aprovadorId } of aprovadores) {
        const aprovacao = new AprovacaoModel(
          crypto.randomUUID(),
          propostaId,
          nivel,
          aprovadorId
        );

        const data = aprovacao.toDatabase();
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 1}`);

        const query = `
          INSERT INTO aprovacoes (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;

        const result = await client.query(query, values);
        aprovacoes.push(this.fromDatabase(result.rows[0]));
      }

      return aprovacoes;
    });
  }

  /**
   * Update aprovacao action (approve/reject)
   */
  async updateAction(
    id: string,
    acao: 'aprovado' | 'rejeitado',
    comentario?: string,
    auditContext?: { userId: string; userName: string; motivo?: string }
  ): Promise<AprovacaoModel> {
    return this.withTransaction(async (client) => {
      if (auditContext) {
        await this.setAuditContext(
          client,
          auditContext.userId,
          auditContext.userName,
          auditContext.motivo || `${acao === 'aprovado' ? 'Aprovação' : 'Rejeição'} de proposta`
        );
      }

      const query = `
        UPDATE aprovacoes 
        SET acao = $1, comentario = $2, data_acao = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      const result = await client.query(query, [acao, comentario, id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Aprovacao with id ${id} not found`);
      }
      
      return this.fromDatabase(result.rows[0]);
    });
  }

  /**
   * Get aprovacao statistics by aprovador
   */
  async getAprovadorStatistics(aprovadorId: string): Promise<{
    total: number;
    aprovadas: number;
    rejeitadas: number;
    pendentes: number;
    tempoMedioResposta: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN acao = 'aprovado' THEN 1 END) as aprovadas,
        COUNT(CASE WHEN acao = 'rejeitado' THEN 1 END) as rejeitadas,
        COUNT(CASE WHEN acao = 'aguardando' THEN 1 END) as pendentes,
        AVG(
          CASE 
            WHEN data_acao IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (data_acao - created_at)) / 86400 
          END
        ) as tempo_medio_resposta_dias
      FROM aprovacoes
      WHERE aprovador_id = $1
    `;
    
    const result = await this.pool.query(query, [aprovadorId]);
    const row = result.rows[0];
    
    return {
      total: parseInt(row.total),
      aprovadas: parseInt(row.aprovadas),
      rejeitadas: parseInt(row.rejeitadas),
      pendentes: parseInt(row.pendentes),
      tempoMedioResposta: parseFloat(row.tempo_medio_resposta_dias) || 0
    };
  }

  /**
   * Find overdue aprovacoes
   */
  async findOverdue(maxDays: number = 3): Promise<AprovacaoModel[]> {
    const query = `
      SELECT * FROM aprovacoes
      WHERE acao = 'aguardando'
        AND created_at < NOW() - INTERVAL '${maxDays} days'
      ORDER BY created_at ASC
    `;
    
    const result = await this.pool.query(query);
    return result.rows.map(row => this.fromDatabase(row));
  }

  /**
   * Get next pending aprovacao for a proposta
   */
  async getNextPendingAprovacao(propostaId: string): Promise<AprovacaoModel | null> {
    const query = `
      SELECT * FROM aprovacoes
      WHERE proposta_id = $1 AND acao = 'aguardando'
      ORDER BY nivel ASC
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [propostaId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.fromDatabase(result.rows[0]);
  }

  /**
   * Check if all aprovacoes for a proposta are completed
   */
  async areAllAprovacoesConcluidas(propostaId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as pending_count
      FROM aprovacoes
      WHERE proposta_id = $1 AND acao = 'aguardando'
    `;
    
    const result = await this.pool.query(query, [propostaId]);
    return parseInt(result.rows[0].pending_count) === 0;
  }

  /**
   * Check if any aprovacao for a proposta was rejected
   */
  async hasRejectedAprovacao(propostaId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as rejected_count
      FROM aprovacoes
      WHERE proposta_id = $1 AND acao = 'rejeitado'
    `;
    
    const result = await this.pool.query(query, [propostaId]);
    return parseInt(result.rows[0].rejected_count) > 0;
  }

  /**
   * Reset all aprovacoes for a proposta (when rejected)
   */
  async resetAprovacoes(
    propostaId: string,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<void> {
    return this.withTransaction(async (client) => {
      await this.setAuditContext(
        client,
        auditContext.userId,
        auditContext.userName,
        auditContext.motivo || 'Reset de aprovações após rejeição'
      );

      const query = `
        UPDATE aprovacoes 
        SET acao = 'aguardando', comentario = NULL, data_acao = NULL
        WHERE proposta_id = $1
      `;

      await client.query(query, [propostaId]);
    });
  }
}