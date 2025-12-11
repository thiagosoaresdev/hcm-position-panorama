import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository.js';
import { EmpresaModel } from '../models/Empresa.js';

export class EmpresaRepository extends BaseRepository<EmpresaModel> {
  constructor(pool: Pool) {
    super(pool, 'empresas');
  }

  fromDatabase(row: any): EmpresaModel {
    return EmpresaModel.fromDatabase(row);
  }

  toDatabase(entity: EmpresaModel): Record<string, any> {
    return entity.toDatabase();
  }

  async findByCnpj(cnpj: string): Promise<EmpresaModel | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE cnpj = $1`;
    const result = await this.pool.query(query, [cnpj]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.fromDatabase(result.rows[0]);
  }

  async findActive(): Promise<EmpresaModel[]> {
    return this.findAll({ ativo: true }, 'nome');
  }

  async existsByCnpj(cnpj: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT 1 FROM ${this.tableName} WHERE cnpj = $1`;
    const params: any[] = [cnpj];
    
    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }
    
    const result = await this.pool.query(query, params);
    return result.rows.length > 0;
  }

  async activate(id: string, auditContext: { userId: string; userName: string; motivo?: string }): Promise<EmpresaModel> {
    return this.withTransaction(async (client) => {
      await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);

      const query = `
        UPDATE ${this.tableName}
        SET ativo = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Empresa with id ${id} not found`);
      }
      
      return this.fromDatabase(result.rows[0]);
    });
  }

  async deactivate(id: string, auditContext: { userId: string; userName: string; motivo?: string }): Promise<EmpresaModel> {
    return this.withTransaction(async (client) => {
      await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);

      const query = `
        UPDATE ${this.tableName}
        SET ativo = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Empresa with id ${id} not found`);
      }
      
      return this.fromDatabase(result.rows[0]);
    });
  }
}