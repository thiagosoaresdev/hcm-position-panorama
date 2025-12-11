import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository.js';
import { PropostaModel } from '../models/Proposta.js';
import type { PropostaStatus } from '../types/index.js';

export interface PropostaFilters {
  solicitanteId?: string;
  status?: PropostaStatus;
  tipo?: 'inclusao' | 'alteracao' | 'exclusao' | 'transferencia';
  quadroLotacaoId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export class PropostaRepository extends BaseRepository<PropostaModel> {
  constructor(pool: Pool) {
    super(pool, 'propostas');
  }

  fromDatabase(row: any): PropostaModel {
    return PropostaModel.fromDatabase(row);
  }

  toDatabase(entity: PropostaModel): Record<string, any> {
    return entity.toDatabase();
  }

  /**
   * Find propostas by solicitante ID
   */
  async findBySolicitante(solicitanteId: string): Promise<PropostaModel[]> {
    return this.findAll({ solicitante_id: solicitanteId }, 'created_at DESC');
  }

  /**
   * Find propostas by status
   */
  async findByStatus(status: PropostaStatus): Promise<PropostaModel[]> {
    return this.findAll({ status }, 'created_at DESC');
  }

  /**
   * Find propostas pending approval for a specific user
   */
  async findPendingForApprover(aprovadorId: string): Promise<PropostaModel[]> {
    const query = `
      SELECT p.* FROM propostas p
      INNER JOIN aprovacoes a ON p.id = a.proposta_id
      WHERE a.aprovador_id = $1 
        AND a.acao = 'aguardando'
        AND p.status IN ('nivel_1', 'nivel_2', 'nivel_3', 'rh')
      ORDER BY p.created_at ASC
    `;
    
    const result = await this.pool.query(query, [aprovadorId]);
    return result.rows.map(row => this.fromDatabase(row));
  }

  /**
   * Find propostas with detailed information including quadro data
   */
  async findWithQuadroDetails(filters: PropostaFilters = {}): Promise<any[]> {
    const { clause: whereClause, values } = this.buildPropostaWhereClause(filters);
    
    const query = `
      SELECT 
        p.*,
        ql.vagas_previstas,
        ql.vagas_efetivas,
        pt.nome as posto_trabalho_nome,
        cc.nome as centro_custo_nome,
        c.nome as cargo_nome
      FROM propostas p
      INNER JOIN quadro_lotacao ql ON p.quadro_lotacao_id = ql.id
      INNER JOIN postos_trabalho pt ON ql.posto_trabalho_id = pt.id
      INNER JOIN centros_custo cc ON pt.centro_custo_id = cc.id
      INNER JOIN cargos c ON ql.cargo_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Update proposta status with audit trail
   */
  async updateStatus(
    id: string, 
    newStatus: PropostaStatus,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<PropostaModel> {
    return this.withTransaction(async (client) => {
      await this.setAuditContext(
        client, 
        auditContext.userId, 
        auditContext.userName, 
        auditContext.motivo || `Alteração de status para ${newStatus}`
      );

      const query = `
        UPDATE propostas 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await client.query(query, [newStatus, id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Proposta with id ${id} not found`);
      }
      
      return this.fromDatabase(result.rows[0]);
    });
  }

  /**
   * Get propostas statistics by status
   */
  async getStatusStatistics(): Promise<Record<PropostaStatus, number>> {
    const query = `
      SELECT status, COUNT(*) as count
      FROM propostas
      GROUP BY status
    `;
    
    const result = await this.pool.query(query);
    
    const stats: Record<PropostaStatus, number> = {
      'rascunho': 0,
      'nivel_1': 0,
      'nivel_2': 0,
      'nivel_3': 0,
      'rh': 0,
      'aprovada': 0,
      'rejeitada': 0
    };
    
    result.rows.forEach(row => {
      stats[row.status as PropostaStatus] = parseInt(row.count);
    });
    
    return stats;
  }

  /**
   * Find overdue propostas (pending for more than specified days)
   */
  async findOverdue(maxDays: number = 3): Promise<PropostaModel[]> {
    const query = `
      SELECT * FROM propostas
      WHERE status IN ('nivel_1', 'nivel_2', 'nivel_3', 'rh')
        AND created_at < NOW() - INTERVAL '${maxDays} days'
      ORDER BY created_at ASC
    `;
    
    const result = await this.pool.query(query);
    return result.rows.map(row => this.fromDatabase(row));
  }

  /**
   * Get propostas with approval history
   */
  async findWithApprovalHistory(id: string): Promise<any> {
    const query = `
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', a.id,
            'nivel', a.nivel,
            'aprovador_id', a.aprovador_id,
            'acao', a.acao,
            'comentario', a.comentario,
            'data_acao', a.data_acao,
            'created_at', a.created_at
          ) ORDER BY a.nivel
        ) as aprovacoes
      FROM propostas p
      LEFT JOIN aprovacoes a ON p.id = a.proposta_id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      proposta: this.fromDatabase(row),
      aprovacoes: row.aprovacoes || []
    };
  }

  private buildPropostaWhereClause(filters: PropostaFilters): { clause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.solicitanteId) {
      conditions.push(`p.solicitante_id = $${paramIndex++}`);
      values.push(filters.solicitanteId);
    }

    if (filters.status) {
      conditions.push(`p.status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.tipo) {
      conditions.push(`p.tipo = $${paramIndex++}`);
      values.push(filters.tipo);
    }

    if (filters.quadroLotacaoId) {
      conditions.push(`p.quadro_lotacao_id = $${paramIndex++}`);
      values.push(filters.quadroLotacaoId);
    }

    if (filters.createdAfter) {
      conditions.push(`p.created_at >= $${paramIndex++}`);
      values.push(filters.createdAfter);
    }

    if (filters.createdBefore) {
      conditions.push(`p.created_at <= $${paramIndex++}`);
      values.push(filters.createdBefore);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { clause, values };
  }
}