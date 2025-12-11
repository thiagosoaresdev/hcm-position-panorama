import { Pool, PoolClient } from 'pg';

export abstract class BaseRepository<T> {
  constructor(
    protected pool: Pool,
    protected tableName: string
  ) {}

  protected async withTransaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  protected async setAuditContext(
    client: PoolClient,
    userId: string,
    userName: string,
    motivo?: string,
    aprovadorId?: string
  ): Promise<void> {
    await client.query(`SET LOCAL audit.user_id = '${userId}'`);
    await client.query(`SET LOCAL audit.user_name = '${userName}'`);
    if (motivo) {
      await client.query(`SET LOCAL audit.motivo = '${motivo}'`);
    }
    if (aprovadorId) {
      await client.query(`SET LOCAL audit.aprovador_id = '${aprovadorId}'`);
    }
  }

  protected buildWhereClause(filters: Record<string, any>): { clause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          conditions.push(`${key} IN (${placeholders})`);
          values.push(...value);
        } else {
          conditions.push(`${key} = $${paramIndex++}`);
          values.push(value);
        }
      }
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { clause, values };
  }

  protected buildOrderClause(orderBy?: string, orderDirection: 'ASC' | 'DESC' = 'ASC'): string {
    if (!orderBy) return '';
    return `ORDER BY ${orderBy} ${orderDirection}`;
  }

  protected buildLimitClause(limit?: number, offset?: number): string {
    let clause = '';
    if (limit) {
      clause += `LIMIT ${limit}`;
    }
    if (offset) {
      clause += ` OFFSET ${offset}`;
    }
    return clause;
  }

  abstract fromDatabase(row: any): T;
  abstract toDatabase(entity: T): Record<string, any>;

  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.fromDatabase(result.rows[0]);
  }

  async findAll(filters: Record<string, any> = {}, orderBy?: string, limit?: number, offset?: number): Promise<T[]> {
    const { clause: whereClause, values } = this.buildWhereClause(filters);
    const orderClause = this.buildOrderClause(orderBy);
    const limitClause = this.buildLimitClause(limit, offset);
    
    const query = `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause} ${limitClause}`;
    const result = await this.pool.query(query, values);
    
    return result.rows.map(row => this.fromDatabase(row));
  }

  async count(filters: Record<string, any> = {}): Promise<number> {
    const { clause: whereClause, values } = this.buildWhereClause(filters);
    const query = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const result = await this.pool.query(query, values);
    
    return parseInt(result.rows[0].count);
  }

  async exists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }

  async create(entity: T, auditContext?: { userId: string; userName: string; motivo?: string }): Promise<T> {
    return this.withTransaction(async (client) => {
      if (auditContext) {
        await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);
      }

      const data = this.toDatabase(entity);
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`);

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await client.query(query, values);
      return this.fromDatabase(result.rows[0]);
    });
  }

  async update(id: string, entity: T, auditContext?: { userId: string; userName: string; motivo?: string }): Promise<T> {
    return this.withTransaction(async (client) => {
      if (auditContext) {
        await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);
      }

      const data = this.toDatabase(entity);
      const columns = Object.keys(data);
      const values = Object.values(data);
      const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = $${values.length + 1}
        RETURNING *
      `;

      const result = await client.query(query, [...values, id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Entity with id ${id} not found`);
      }
      
      return this.fromDatabase(result.rows[0]);
    });
  }

  async delete(id: string, auditContext?: { userId: string; userName: string; motivo?: string }): Promise<void> {
    return this.withTransaction(async (client) => {
      if (auditContext) {
        await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);
      }

      const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
      const result = await client.query(query, [id]);
      
      if (result.rowCount === 0) {
        throw new Error(`Entity with id ${id} not found`);
      }
    });
  }

  async softDelete(id: string, auditContext?: { userId: string; userName: string; motivo?: string }): Promise<T> {
    return this.withTransaction(async (client) => {
      if (auditContext) {
        await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);
      }

      const query = `
        UPDATE ${this.tableName}
        SET ativo = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Entity with id ${id} not found`);
      }
      
      return this.fromDatabase(result.rows[0]);
    });
  }
}