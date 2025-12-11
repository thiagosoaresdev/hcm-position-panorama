import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { AuditService, type AuditSearchCriteria } from '../services/AuditService.js';
import type { ApiResponse, PaginatedResponse } from '../types/index.js';
import { AuditLogModel } from '../models/AuditLog.js';

/**
 * Audit Controller - API endpoints for audit functionality
 * Provides REST endpoints for audit trail queries and reporting
 */
export class AuditController {
  private auditService: AuditService;

  constructor(pool: Pool) {
    this.auditService = new AuditService(pool);
  }

  /**
   * GET /api/audit/entity/:entityId
   * Get complete audit trail for a specific entity
   */
  async getEntityAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const { entityId } = req.params;
      const { entityType } = req.query;

      const auditTrail = await this.auditService.getAuditTrail(
        entityId,
        entityType as string
      );

      const response: ApiResponse<typeof auditTrail> = {
        success: true,
        data: auditTrail,
        message: `Histórico de auditoria recuperado para entidade ${entityId}`
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao recuperar histórico de auditoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * POST /api/audit/search
   * Search audit logs with comprehensive criteria
   */
  async searchAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const criteria: AuditSearchCriteria = req.body;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      criteria.limit = limit;
      criteria.offset = (page - 1) * limit;

      const { logs, total } = await this.auditService.searchAuditLogs(criteria);

      const response: PaginatedResponse<AuditLogModel> = {
        data: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro na busca de logs de auditoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/audit/recent
   * Get recent audit activity
   */
  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const limit = parseInt(req.query.limit as string) || 50;

      const recentActivity = await this.auditService.getRecentActivity(days, limit);

      const response: ApiResponse<AuditLogModel[]> = {
        success: true,
        data: recentActivity,
        message: `Atividade recente dos últimos ${days} dias`
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao recuperar atividade recente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/audit/stats
   * Get audit statistics for dashboard
   */
  async getAuditStats(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.auditService.getAuditStats(startDate, endDate);

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        message: 'Estatísticas de auditoria recuperadas'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao recuperar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/audit/user/:userId
   * Get audit history for a specific user
   */
  async getUserAuditHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      const userHistory = await this.auditService.getUserAuditHistory(userId, limit);

      const response: ApiResponse<AuditLogModel[]> = {
        success: true,
        data: userHistory,
        message: `Histórico de auditoria do usuário ${userId}`
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao recuperar histórico do usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/audit/export
   * Export audit logs for compliance reporting
   */
  async exportAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const criteria: AuditSearchCriteria = req.query as any;
      const format = (req.query.format as 'json' | 'csv') || 'json';

      // Convert string dates to Date objects
      if (criteria.startDate) {
        criteria.startDate = new Date(criteria.startDate as any);
      }
      if (criteria.endDate) {
        criteria.endDate = new Date(criteria.endDate as any);
      }

      const exportData = await this.auditService.exportAuditLogs(criteria, format);

      // Set appropriate headers for download
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      const contentType = format === 'csv' ? 'text/csv' : 'application/json';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao exportar logs de auditoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/audit/entity/:entityId/summary
   * Get audit summary for an entity
   */
  async getEntityAuditSummary(req: Request, res: Response): Promise<void> {
    try {
      const { entityId } = req.params;
      const { entityType } = req.query;

      if (!entityType) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Tipo da entidade é obrigatório'
        });
        return;
      }

      const summary = await this.auditService.getEntityAuditSummary(
        entityId,
        entityType as string
      );

      const response: ApiResponse<typeof summary> = {
        success: true,
        data: summary,
        message: `Resumo de auditoria para entidade ${entityId}`
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao recuperar resumo de auditoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }

  /**
   * GET /api/audit/integrity/:entityId
   * Validate audit data integrity for an entity
   */
  async validateAuditIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const { entityId } = req.params;
      const { entityType } = req.query;

      if (!entityType) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Tipo da entidade é obrigatório'
        });
        return;
      }

      const validation = await this.auditService.validateAuditIntegrity(
        entityId,
        entityType as string
      );

      const response: ApiResponse<typeof validation> = {
        success: true,
        data: validation,
        message: validation.valid 
          ? 'Integridade dos dados de auditoria validada'
          : 'Problemas de integridade encontrados'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `Erro ao validar integridade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }
}