import { Pool } from 'pg';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { v4 as uuidv4 } from 'uuid';

export interface AuditContext {
  userId: string;
  userName: string;
  motivo?: string;
  aprovadorId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
}

export interface AuditSearchCriteria {
  entidadeId?: string;
  entidadeTipo?: string;
  acao?: string;
  usuarioId?: string;
  aprovadorId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  acao: string;
  usuarioNome: string;
  motivo?: string;
  aprovadorNome?: string;
  changedFields: string[];
  summary: string;
}

export interface AuditStats {
  totalEntries: number;
  actionStats: Record<string, number>;
  userActivityStats: Array<{ usuarioId: string; usuarioNome: string; count: number }>;
  entityTypeStats: Record<string, number>;
  recentActivity: AuditLogModel[];
}

/**
 * Audit Service - Sistema de Gestão de Quadro de Lotação
 * 
 * Provides comprehensive audit logging and tracking functionality
 * following requirements 8.1, 8.2, and 8.4:
 * - QUEM (who): User identification and name
 * - QUANDO (when): ISO 8601 timestamp
 * - MOTIVO (why): Reason for the change
 * - APROVADOR (approver): If applicable
 * - Complete before/after values tracking
 * - Permanent data retention (no physical deletion)
 */
export class AuditService {
  private auditRepository: AuditLogRepository;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.auditRepository = new AuditLogRepository(pool);
  }

  /**
   * Log an audit entry for any system change
   * Implements requirement 8.1: Complete audit trail tracking
   */
  async logAction(
    entidadeId: string,
    entidadeTipo: string,
    acao: string,
    context: AuditContext,
    valoresAntes?: Record<string, any>,
    valoresDepois?: Record<string, any>
  ): Promise<AuditLogModel> {
    const auditLog = new AuditLogModel(
      uuidv4(),
      entidadeId,
      entidadeTipo,
      acao,
      context.userId,
      context.userName,
      new Date(),
      context.motivo,
      valoresAntes,
      valoresDepois,
      context.aprovadorId,
      context.ipAddress,
      context.userAgent,
      context.sessionId,
      context.requestId
    );

    // Validate audit log
    const errors = auditLog.validate();
    if (errors.length > 0) {
      throw new Error(`Erro na validação do log de auditoria: ${errors.join(', ')}`);
    }

    return await this.auditRepository.create(auditLog);
  }

  /**
   * Log creation of a new entity
   */
  async logCreate(
    entidadeId: string,
    entidadeTipo: string,
    context: AuditContext,
    valoresDepois: Record<string, any>
  ): Promise<AuditLogModel> {
    return await this.logAction(
      entidadeId,
      entidadeTipo,
      'create',
      context,
      undefined,
      valoresDepois
    );
  }

  /**
   * Log update of an existing entity
   */
  async logUpdate(
    entidadeId: string,
    entidadeTipo: string,
    context: AuditContext,
    valoresAntes: Record<string, any>,
    valoresDepois: Record<string, any>
  ): Promise<AuditLogModel> {
    return await this.logAction(
      entidadeId,
      entidadeTipo,
      'update',
      context,
      valoresAntes,
      valoresDepois
    );
  }

  /**
   * Log deletion of an entity (soft delete)
   */
  async logDelete(
    entidadeId: string,
    entidadeTipo: string,
    context: AuditContext,
    valoresAntes: Record<string, any>
  ): Promise<AuditLogModel> {
    return await this.logAction(
      entidadeId,
      entidadeTipo,
      'delete',
      context,
      valoresAntes,
      undefined
    );
  }

  /**
   * Log approval action
   */
  async logApproval(
    entidadeId: string,
    entidadeTipo: string,
    context: AuditContext,
    aprovadorId: string,
    comentario?: string
  ): Promise<AuditLogModel> {
    const contextWithApprover = {
      ...context,
      aprovadorId,
      motivo: comentario || context.motivo
    };

    return await this.logAction(
      entidadeId,
      entidadeTipo,
      'approve',
      contextWithApprover
    );
  }

  /**
   * Log rejection action
   */
  async logRejection(
    entidadeId: string,
    entidadeTipo: string,
    context: AuditContext,
    aprovadorId: string,
    comentario?: string
  ): Promise<AuditLogModel> {
    const contextWithApprover = {
      ...context,
      aprovadorId,
      motivo: comentario || context.motivo
    };

    return await this.logAction(
      entidadeId,
      entidadeTipo,
      'reject',
      contextWithApprover
    );
  }

  /**
   * Log system automated actions (normalization, webhooks, etc.)
   */
  async logSystemAction(
    entidadeId: string,
    entidadeTipo: string,
    acao: string,
    motivo: string,
    valoresAntes?: Record<string, any>,
    valoresDepois?: Record<string, any>
  ): Promise<AuditLogModel> {
    const systemContext: AuditContext = {
      userId: 'sistema',
      userName: 'Sistema Automático',
      motivo
    };

    return await this.logAction(
      entidadeId,
      entidadeTipo,
      acao,
      systemContext,
      valoresAntes,
      valoresDepois
    );
  }

  /**
   * Get complete audit trail for an entity
   * Implements requirement 8.2: Timeline chronological with filters
   */
  async getAuditTrail(
    entidadeId: string,
    entidadeTipo?: string
  ): Promise<AuditTrailEntry[]> {
    const logs = await this.auditRepository.findByEntity(entidadeId, entidadeTipo);
    
    return logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      acao: log.acao,
      usuarioNome: log.usuarioNome,
      motivo: log.motivo,
      aprovadorNome: log.aprovadorId ? `Aprovador: ${log.aprovadorId}` : undefined,
      changedFields: log.getChangedFields(),
      summary: log.getSummary()
    }));
  }

  /**
   * Search audit logs with comprehensive criteria
   * Implements requirement 8.2: Filters by type, period, user, entity
   */
  async searchAuditLogs(criteria: AuditSearchCriteria): Promise<{
    logs: AuditLogModel[];
    total: number;
  }> {
    return await this.auditRepository.searchLogs(criteria);
  }

  /**
   * Get recent activity across the system
   */
  async getRecentActivity(days: number = 7, limit: number = 50): Promise<AuditLogModel[]> {
    return await this.auditRepository.findRecent(days, limit);
  }

  /**
   * Get recent activities for dashboard with filtering options
   */
  async getRecentActivities(options: {
    limit?: number;
    empresaId?: string;
    days?: number;
  } = {}): Promise<AuditLogModel[]> {
    const { limit = 10, days = 7 } = options;
    
    // For now, return recent activity - in production this would filter by empresa
    return await this.auditRepository.findRecent(days, limit);
  }

  /**
   * Get audit statistics for dashboard and reporting
   */
  async getAuditStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditStats> {
    const [actionStats, userActivityStats, entityTypeStats, recentActivity] = await Promise.all([
      this.auditRepository.getActionStats(startDate, endDate),
      this.auditRepository.getUserActivityStats(startDate, endDate),
      this.auditRepository.getEntityTypeStats(startDate, endDate),
      this.auditRepository.findRecent(7, 10)
    ]);

    const totalEntries = Object.values(actionStats).reduce((sum, count) => sum + count, 0);

    return {
      totalEntries,
      actionStats,
      userActivityStats,
      entityTypeStats,
      recentActivity
    };
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditHistory(
    usuarioId: string,
    limit?: number
  ): Promise<AuditLogModel[]> {
    return await this.auditRepository.findByUser(usuarioId, limit);
  }

  /**
   * Get audit logs for a specific action type
   */
  async getActionAuditHistory(
    acao: string,
    limit?: number
  ): Promise<AuditLogModel[]> {
    return await this.auditRepository.findByAction(acao, limit);
  }

  /**
   * Get audit logs within a date range
   */
  async getAuditLogsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<AuditLogModel[]> {
    return await this.auditRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Export audit logs for compliance reporting
   * Implements requirement 8.4: Complete export with all traceability fields
   */
  async exportAuditLogs(
    criteria: AuditSearchCriteria,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const { logs } = await this.searchAuditLogs(criteria);
    
    if (format === 'csv') {
      return this.exportToCSV(logs);
    }
    
    return JSON.stringify(logs.map(log => log.toJSON()), null, 2);
  }

  /**
   * Set audit context for database operations
   * This sets PostgreSQL session variables that are used by audit triggers
   */
  async setAuditContext(context: AuditContext): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT set_config($1, $2, true)', ['audit.user_id', context.userId]);
      await client.query('SELECT set_config($1, $2, true)', ['audit.user_name', context.userName]);
      
      if (context.motivo) {
        await client.query('SELECT set_config($1, $2, true)', ['audit.motivo', context.motivo]);
      }
      
      if (context.aprovadorId) {
        await client.query('SELECT set_config($1, $2, true)', ['audit.aprovador_id', context.aprovadorId]);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Clear audit context
   */
  async clearAuditContext(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT set_config($1, $2, true)', ['audit.user_id', '']);
      await client.query('SELECT set_config($1, $2, true)', ['audit.user_name', '']);
      await client.query('SELECT set_config($1, $2, true)', ['audit.motivo', '']);
      await client.query('SELECT set_config($1, $2, true)', ['audit.aprovador_id', '']);
    } finally {
      client.release();
    }
  }

  /**
   * Execute operation with audit context
   * Automatically sets and clears audit context around the operation
   */
  async withAuditContext<T>(
    context: AuditContext,
    operation: () => Promise<T>
  ): Promise<T> {
    await this.setAuditContext(context);
    try {
      return await operation();
    } finally {
      await this.clearAuditContext();
    }
  }

  /**
   * Validate audit data integrity
   * Ensures audit logs haven't been tampered with
   */
  async validateAuditIntegrity(
    entidadeId: string,
    entidadeTipo: string
  ): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const logs = await this.auditRepository.findByEntity(entidadeId, entidadeTipo);
    const issues: string[] = [];

    // Check chronological order
    for (let i = 1; i < logs.length; i++) {
      if (logs[i].timestamp < logs[i - 1].timestamp) {
        issues.push(`Ordem cronológica incorreta entre logs ${logs[i - 1].id} e ${logs[i].id}`);
      }
    }

    // Check for missing create log
    const hasCreateLog = logs.some(log => log.isCreate());
    if (!hasCreateLog && logs.length > 0) {
      issues.push('Log de criação não encontrado para a entidade');
    }

    // Check for orphaned update/delete logs
    const createLog = logs.find(log => log.isCreate());
    if (createLog) {
      const logsAfterCreate = logs.filter(log => log.timestamp >= createLog.timestamp);
      if (logsAfterCreate.length !== logs.length) {
        issues.push('Logs encontrados antes da criação da entidade');
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get audit summary for an entity
   */
  async getEntityAuditSummary(
    entidadeId: string,
    entidadeTipo: string
  ): Promise<{
    totalChanges: number;
    firstChange: Date;
    lastChange: Date;
    uniqueUsers: number;
    mostActiveUser: string;
    changesByAction: Record<string, number>;
  }> {
    const logs = await this.auditRepository.findByEntity(entidadeId, entidadeTipo);
    
    if (logs.length === 0) {
      throw new Error('Nenhum log de auditoria encontrado para a entidade');
    }

    const userCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    logs.forEach(log => {
      // Count by user
      userCounts[log.usuarioNome] = (userCounts[log.usuarioNome] || 0) + 1;
      
      // Count by action
      actionCounts[log.acao] = (actionCounts[log.acao] || 0) + 1;
    });

    const mostActiveUser = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    return {
      totalChanges: logs.length,
      firstChange: logs[logs.length - 1].timestamp, // logs are ordered DESC
      lastChange: logs[0].timestamp,
      uniqueUsers: Object.keys(userCounts).length,
      mostActiveUser,
      changesByAction: actionCounts
    };
  }

  /**
   * Private method to export logs to CSV format
   */
  private exportToCSV(logs: AuditLogModel[]): string {
    const headers = [
      'ID',
      'Timestamp',
      'Entidade ID',
      'Entidade Tipo',
      'Ação',
      'Usuário ID',
      'Usuário Nome',
      'Motivo',
      'Aprovador ID',
      'IP Address',
      'User Agent',
      'Valores Antes',
      'Valores Depois'
    ];

    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.entidadeId,
      log.entidadeTipo,
      log.acao,
      log.usuarioId,
      log.usuarioNome,
      log.motivo || '',
      log.aprovadorId || '',
      log.ipAddress || '',
      log.userAgent || '',
      log.valoresAntes ? JSON.stringify(log.valoresAntes) : '',
      log.valoresDepois ? JSON.stringify(log.valoresDepois) : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}