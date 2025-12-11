import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository.js';
import { QuadroLotacaoModel } from '../models/QuadroLotacao.js';
import { cacheStrategyService, CachePattern } from '../core/cache/CacheStrategy.js';

export class QuadroLotacaoRepository extends BaseRepository<QuadroLotacaoModel> {
  constructor(pool: Pool) {
    super(pool, 'quadro_lotacao');
  }

  fromDatabase(row: any): QuadroLotacaoModel {
    return QuadroLotacaoModel.fromDatabase(row);
  }

  toDatabase(entity: QuadroLotacaoModel): Record<string, any> {
    return entity.toDatabase();
  }

  async findByPlanoVagas(planoVagasId: string): Promise<QuadroLotacaoModel[]> {
    return this.findAll({ plano_vagas_id: planoVagasId, ativo: true }, 'created_at');
  }

  async findByPostoTrabalho(postoTrabalhoId: string): Promise<QuadroLotacaoModel[]> {
    return this.findAll({ posto_trabalho_id: postoTrabalhoId, ativo: true }, 'created_at');
  }

  async findByCargo(cargoId: string): Promise<QuadroLotacaoModel[]> {
    return this.findAll({ cargo_id: cargoId, ativo: true }, 'created_at');
  }

  async findByPlanoPostoCargo(
    planoVagasId: string,
    postoTrabalhoId: string,
    cargoId: string
  ): Promise<QuadroLotacaoModel | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE plano_vagas_id = $1 AND posto_trabalho_id = $2 AND cargo_id = $3
      LIMIT 1
    `;
    const result = await this.pool.query(query, [planoVagasId, postoTrabalhoId, cargoId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.fromDatabase(result.rows[0]);
  }

  async existsForPlanoPostoCargo(
    planoVagasId: string,
    postoTrabalhoId: string,
    cargoId: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = `
      SELECT 1 FROM ${this.tableName}
      WHERE plano_vagas_id = $1 AND posto_trabalho_id = $2 AND cargo_id = $3
    `;
    const params: any[] = [planoVagasId, postoTrabalhoId, cargoId];
    
    if (excludeId) {
      query += ` AND id != $4`;
      params.push(excludeId);
    }
    
    const result = await this.pool.query(query, params);
    return result.rows.length > 0;
  }

  async updateVagasEfetivas(
    id: string,
    novasVagasEfetivas: number,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<QuadroLotacaoModel> {
    return this.withTransaction(async (client) => {
      await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);

      const query = `
        UPDATE ${this.tableName}
        SET vagas_efetivas = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await client.query(query, [novasVagasEfetivas, id]);
      
      if (result.rows.length === 0) {
        throw new Error(`QuadroLotacao with id ${id} not found`);
      }
      
      return this.fromDatabase(result.rows[0]);
    });
  }

  async incrementVagasEfetivas(
    id: string,
    increment: number,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<QuadroLotacaoModel> {
    return this.withTransaction(async (client) => {
      await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);

      const query = `
        UPDATE ${this.tableName}
        SET vagas_efetivas = vagas_efetivas + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await client.query(query, [increment, id]);
      
      if (result.rows.length === 0) {
        throw new Error(`QuadroLotacao with id ${id} not found`);
      }
      
      return this.fromDatabase(result.rows[0]);
    });
  }

  async updateVagasReservadas(
    id: string,
    novasVagasReservadas: number,
    auditContext: { userId: string; userName: string; motivo?: string }
  ): Promise<QuadroLotacaoModel> {
    return this.withTransaction(async (client) => {
      await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);

      const query = `
        UPDATE ${this.tableName}
        SET vagas_reservadas = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await client.query(query, [novasVagasReservadas, id]);
      
      if (result.rows.length === 0) {
        throw new Error(`QuadroLotacao with id ${id} not found`);
      }
      
      return this.fromDatabase(result.rows[0]);
    });
  }

  // Override create to invalidate cache
  async create(entity: QuadroLotacaoModel, auditContext?: { userId: string; userName: string; motivo?: string }): Promise<QuadroLotacaoModel> {
    const result = await super.create(entity, auditContext);
    
    // Invalidate related caches
    await this.invalidateQuadroCache(entity.planoVagasId);
    
    return result;
  }

  // Override update to invalidate cache
  async update(id: string, entity: QuadroLotacaoModel, auditContext?: { userId: string; userName: string; motivo?: string }): Promise<QuadroLotacaoModel> {
    const result = await super.update(id, entity, auditContext);
    
    // Invalidate related caches
    await this.invalidateQuadroCache(entity.planoVagasId);
    await cacheStrategyService.invalidatePattern(CachePattern.SEMI_STATIC, `quadro:${id}`);
    
    return result;
  }

  // Override findById with caching
  async findById(id: string): Promise<QuadroLotacaoModel | null> {
    return cacheStrategyService.getOrSet(
      CachePattern.SEMI_STATIC,
      `quadro:${id}`,
      async () => {
        const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
        const result = await this.pool.query(query, [id]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return this.fromDatabase(result.rows[0]);
      }
    );
  }

  async getOccupancyStats(planoVagasId: string): Promise<{
    totalVagasPrevistas: number;
    totalVagasEfetivas: number;
    totalVagasReservadas: number;
    taxaOcupacao: number;
  }> {
    const cacheKey = `occupancy:${planoVagasId}`;
    
    return cacheStrategyService.getOrSet(
      CachePattern.REALTIME,
      cacheKey,
      async () => {
        // Use optimized index for occupancy calculations
        const query = `
          SELECT 
            COALESCE(SUM(vagas_previstas), 0) as total_vagas_previstas,
            COALESCE(SUM(vagas_efetivas), 0) as total_vagas_efetivas,
            COALESCE(SUM(vagas_reservadas), 0) as total_vagas_reservadas
          FROM ${this.tableName}
          WHERE plano_vagas_id = $1 AND ativo = true
        `;

        const result = await this.pool.query(query, [planoVagasId]);
        const row = result.rows[0];

        const totalVagasPrevistas = parseInt(row.total_vagas_previstas) || 0;
        const totalVagasEfetivas = parseInt(row.total_vagas_efetivas) || 0;
        const totalVagasReservadas = parseInt(row.total_vagas_reservadas) || 0;
        const taxaOcupacao = totalVagasPrevistas > 0 ? (totalVagasEfetivas / totalVagasPrevistas) * 100 : 0;

        return {
          totalVagasPrevistas,
          totalVagasEfetivas,
          totalVagasReservadas,
          taxaOcupacao
        };
      },
      undefined,
      30 // 30 seconds TTL for occupancy stats
    );
  }

  async findWithDeficit(planoVagasId: string): Promise<QuadroLotacaoModel[]> {
    const cacheKey = `deficit:${planoVagasId}`;
    
    return cacheStrategyService.getOrSet(
      CachePattern.SEMI_STATIC,
      cacheKey,
      async () => {
        // Use optimized index for deficit queries
        const query = `
          SELECT * FROM ${this.tableName}
          WHERE plano_vagas_id = $1 AND ativo = true AND vagas_efetivas > vagas_previstas
          ORDER BY (vagas_efetivas - vagas_previstas) DESC
        `;

        const result = await this.pool.query(query, [planoVagasId]);
        return result.rows.map((row: any) => this.fromDatabase(row));
      }
    );
  }

  async findAvailable(planoVagasId: string): Promise<QuadroLotacaoModel[]> {
    const cacheKey = `available:${planoVagasId}`;
    
    return cacheStrategyService.getOrSet(
      CachePattern.SEMI_STATIC,
      cacheKey,
      async () => {
        // Use optimized index for available positions
        const query = `
          SELECT * FROM ${this.tableName}
          WHERE plano_vagas_id = $1 AND ativo = true 
            AND (vagas_previstas - vagas_efetivas - vagas_reservadas) > 0
          ORDER BY (vagas_previstas - vagas_efetivas - vagas_reservadas) DESC
        `;

        const result = await this.pool.query(query, [planoVagasId]);
        return result.rows.map((row: any) => this.fromDatabase(row));
      }
    );
  }

  async findByPostoAndCargo(postoTrabalhoId: string, cargoId: string): Promise<QuadroLotacaoModel[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE posto_trabalho_id = $1 AND cargo_id = $2 AND ativo = true
      ORDER BY created_at
    `;

    const result = await this.pool.query(query, [postoTrabalhoId, cargoId]);
    return result.rows.map(row => this.fromDatabase(row));
  }

  async findByPosto(postoTrabalhoId: string): Promise<QuadroLotacaoModel[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE posto_trabalho_id = $1 AND ativo = true
      ORDER BY created_at
    `;

    const result = await this.pool.query(query, [postoTrabalhoId]);
    return result.rows.map((row: any) => this.fromDatabase(row));
  }

  /**
   * Batch update for better performance during normalization
   */
  async batchUpdateVagasEfetivas(updates: Array<{
    id: string;
    vagasEfetivas: number;
  }>, auditContext?: { userId: string; userName: string; motivo?: string }): Promise<void> {
    if (updates.length === 0) return;

    return this.withTransaction(async (client) => {
      if (auditContext) {
        await this.setAuditContext(client, auditContext.userId, auditContext.userName, auditContext.motivo);
      }

      // Use CASE statement for batch update - much more efficient than individual updates
      const ids = updates.map(u => u.id);
      const whenClauses = updates.map(u => `WHEN '${u.id}' THEN ${u.vagasEfetivas}`).join(' ');
      
      const query = `
        UPDATE ${this.tableName}
        SET vagas_efetivas = CASE id ${whenClauses} END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($1::uuid[])
      `;

      await client.query(query, [ids]);

      // Invalidate caches for affected planos
      const planoIds = new Set<string>();
      for (const update of updates) {
        const quadro = await this.findById(update.id);
        if (quadro) {
          planoIds.add(quadro.planoVagasId);
        }
      }

      // Invalidate caches after transaction
      for (const planoId of planoIds) {
        await this.invalidateQuadroCache(planoId);
      }
    });
  }

  /**
   * Get aggregated statistics for dashboard with optimized query
   */
  async getDashboardStats(planoVagasId: string): Promise<{
    totalVagas: number;
    vagasOcupadas: number;
    vagasDisponiveis: number;
    vagasReservadas: number;
    taxaOcupacao: number;
    cargosCriticos: number; // < 50% occupancy
  }> {
    const cacheKey = `dashboard:${planoVagasId}`;
    
    return cacheStrategyService.getOrSet(
      CachePattern.REALTIME,
      cacheKey,
      async () => {
        const query = `
          SELECT 
            SUM(vagas_previstas) as total_vagas,
            SUM(vagas_efetivas) as vagas_ocupadas,
            SUM(vagas_previstas - vagas_efetivas - vagas_reservadas) as vagas_disponiveis,
            SUM(vagas_reservadas) as vagas_reservadas,
            COUNT(CASE WHEN vagas_previstas > 0 AND (vagas_efetivas::float / vagas_previstas::float) < 0.5 THEN 1 END) as cargos_criticos
          FROM ${this.tableName}
          WHERE plano_vagas_id = $1 AND ativo = true
        `;
        
        const result = await this.pool.query(query, [planoVagasId]);
        const row = result.rows[0];
        
        const totalVagas = parseInt(row.total_vagas) || 0;
        const vagasOcupadas = parseInt(row.vagas_ocupadas) || 0;
        const vagasDisponiveis = parseInt(row.vagas_disponiveis) || 0;
        const vagasReservadas = parseInt(row.vagas_reservadas) || 0;
        const cargosCriticos = parseInt(row.cargos_criticos) || 0;
        
        const taxaOcupacao = totalVagas > 0 ? (vagasOcupadas / totalVagas) * 100 : 0;

        return {
          totalVagas,
          vagasOcupadas,
          vagasDisponiveis,
          vagasReservadas,
          taxaOcupacao,
          cargosCriticos
        };
      },
      undefined,
      30 // 30 seconds TTL for dashboard stats
    );
  }

  /**
   * Invalidate all caches related to a plano de vagas
   */
  private async invalidateQuadroCache(planoVagasId: string): Promise<void> {
    await Promise.all([
      cacheStrategyService.invalidatePattern(CachePattern.REALTIME, `occupancy:${planoVagasId}`),
      cacheStrategyService.invalidatePattern(CachePattern.REALTIME, `dashboard:${planoVagasId}`),
      cacheStrategyService.invalidatePattern(CachePattern.SEMI_STATIC, `deficit:${planoVagasId}`),
      cacheStrategyService.invalidatePattern(CachePattern.SEMI_STATIC, `available:${planoVagasId}`),
      cacheStrategyService.invalidatePattern(CachePattern.SEMI_STATIC, `plano:${planoVagasId}`),
      cacheStrategyService.invalidatePattern(CachePattern.REALTIME, `exists:${planoVagasId}`)
    ]);
  }
}