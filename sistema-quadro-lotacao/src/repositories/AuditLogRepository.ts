import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository.js';
import { AuditLogModel } from '../models/AuditLog.js';

export class AuditLogRepository extends BaseRepository<AuditLogModel> {
  constructor(pool: Pool) {
    super(pool, 'audit_logs');
  }

  fromDatabase(row: any): AuditLogModel {
    return AuditLogModel.fromDatabase(row);
  }

  toDatabase(entity: AuditLogModel): Record<string, any> {
    return entity.toDatabase();
  }

  async findByEntity(entidadeId: string, entidadeTipo?: string): Promise<AuditLogModel[]> {
    const filters: Record<string, any> = { entidade_id: entidadeId };
    if (entidadeTipo) {
      filters.entidade_tipo = entidadeTipo;
    }
    return this.findAll(filters, 'timestamp DESC');
  }

  async findByUser(usuarioId: string, limit?: number): Promise<AuditLogModel[]> {
    return this.findAll({ usuario_id: usuarioId }, 'timestamp DESC', limit);
  }

  async findByAction(acao: string, limit?: number): Promise<AuditLogModel[]> {
    return this.findAll({ acao }, 'timestamp DESC', limit);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLogModel[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp DESC
    `;
    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows.map(row => this.fromDatabase(row));
  }

  async findRecent(days: number = 7, limit?: number): Promise<AuditLogModel[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE timestamp >= $1
      ORDER BY timestamp DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    const result = await this.pool.query(query, [startDate]);
    return result.rows.map(row => this.fromDatabase(row));
  }

  async searchLogs(criteria: {
    entidadeId?: string;
    entidadeTipo?: string;
    acao?: string;
    usuarioId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLogModel[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (criteria.entidadeId) {
      conditions.push(`entidade_id = $${paramIndex++}`);
      values.push(criteria.entidadeId);
    }

    if (criteria.entidadeTipo) {
      conditions.push(`entidade_tipo = $${paramIndex++}`);
      values.push(criteria.entidadeTipo);
    }

    if (criteria.acao) {
      conditions.push(`acao = $${paramIndex++}`);
      values.push(criteria.acao);
    }

    if (criteria.usuarioId) {
      conditions.push(`usuario_id = $${paramIndex++}`);
      values.push(criteria.usuarioId);
    }

    if (criteria.startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      values.push(criteria.startDate);
    }

    if (criteria.endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      values.push(criteria.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get logs
    const limitClause = this.buildLimitClause(criteria.limit, criteria.offset);
    const logsQuery = `
      SELECT * FROM ${this.tableName} 
      ${whereClause} 
      ORDER BY timestamp DESC 
      ${limitClause}
    `;
    
    const logsResult = await this.pool.query(logsQuery, values);
    const logs = logsResult.rows.map(row => this.fromDatabase(row));

    return { logs, total };
  }

  async getActionStats(startDate?: Date, endDate?: Date): Promise<Record<string, number>> {
    let query = `
      SELECT acao, COUNT(*) as count
      FROM ${this.tableName}
    `;
    const values: any[] = [];
    const conditions: string[] = [];

    if (startDate) {
      conditions.push(`timestamp >= $${values.length + 1}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`timestamp <= $${values.length + 1}`);
      values.push(endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY acao ORDER BY count DESC`;

    const result = await this.pool.query(query, values);
    
    const stats: Record<string, number> = {};
    for (const row of result.rows) {
      stats[row.acao] = parseInt(row.count);
    }
    
    return stats;
  }

  async getUserActivityStats(startDate?: Date, endDate?: Date): Promise<Array<{ usuarioId: string; usuarioNome: string; count: number }>> {
    let query = `
      SELECT usuario_id, usuario_nome, COUNT(*) as count
      FROM ${this.tableName}
    `;
    const values: any[] = [];
    const conditions: string[] = [];

    if (startDate) {
      conditions.push(`timestamp >= $${values.length + 1}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`timestamp <= $${values.length + 1}`);
      values.push(endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY usuario_id, usuario_nome ORDER BY count DESC`;

    const result = await this.pool.query(query, values);
    
    return result.rows.map(row => ({
      usuarioId: row.usuario_id,
      usuarioNome: row.usuario_nome,
      count: parseInt(row.count)
    }));
  }

  async getEntityTypeStats(startDate?: Date, endDate?: Date): Promise<Record<string, number>> {
    let query = `
      SELECT entidade_tipo, COUNT(*) as count
      FROM ${this.tableName}
    `;
    const values: any[] = [];
    const conditions: string[] = [];

    if (startDate) {
      conditions.push(`timestamp >= $${values.length + 1}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`timestamp <= $${values.length + 1}`);
      values.push(endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY entidade_tipo ORDER BY count DESC`;

    const result = await this.pool.query(query, values);
    
    const stats: Record<string, number> = {};
    for (const row of result.rows) {
      stats[row.entidade_tipo] = parseInt(row.count);
    }
    
    return stats;
  }

  // Override create to not use audit context (audit logs don't audit themselves)
  async create(entity: AuditLogModel): Promise<AuditLogModel> {
    const data = this.toDatabase(entity);
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return this.fromDatabase(result.rows[0]);
  }

  // Override update to prevent audit log modifications
  async update(): Promise<never> {
    throw new Error('Audit logs cannot be modified');
  }

  // Override delete to prevent audit log deletions
  async delete(): Promise<never> {
    throw new Error('Audit logs cannot be deleted');
  }
}