import { Request, Response } from 'express';
import { Pool } from 'pg';
import { IntegrationMonitoringService } from '../services/IntegrationMonitoringService.js';
import { AuditService } from '../services/AuditService.js';

export class IntegrationMonitoringController {
  private integrationService: IntegrationMonitoringService;
  private auditService: AuditService;

  constructor(pool: Pool) {
    this.integrationService = new IntegrationMonitoringService(pool);
    this.auditService = new AuditService(pool);
  }

  /**
   * Get integration dashboard data
   * Requirements: 10.3, 10.4 - Integration health dashboard
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const [statuses, stats, alerts, recentEvents] = await Promise.all([
        this.integrationService.getIntegrationStatuses(),
        this.integrationService.getIntegrationStats(),
        this.integrationService.getActiveAlerts(),
        this.integrationService.getRecentEvents(undefined, 20)
      ]);

      res.json({
        statuses,
        stats,
        alerts,
        recentEvents,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting integration dashboard:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to load integration dashboard'
      });
    }
  }

  /**
   * Get status for a specific service
   */
  async getServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { serviceName } = req.params;
      
      const status = await this.integrationService.getServiceStatus(serviceName);
      
      if (!status) {
        res.status(404).json({
          error: 'Service not found',
          message: `No monitoring data found for service: ${serviceName}`
        });
        return;
      }

      res.json(status);

    } catch (error) {
      console.error('Error getting service status:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get service status'
      });
    }
  }

  /**
   * Get integration events with filtering
   */
  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const {
        serviceName,
        eventType,
        status,
        limit = '50',
        offset = '0',
        startDate,
        endDate
      } = req.query;

      // Basic pagination
      const limitNum = Math.min(parseInt(limit as string) || 50, 200);
      const offsetNum = parseInt(offset as string) || 0;

      let events = await this.integrationService.getRecentEvents(
        serviceName as string,
        limitNum,
        offsetNum
      );

      // Apply additional filters
      if (eventType) {
        events = events.filter(e => e.eventType === eventType);
      }

      if (status) {
        events = events.filter(e => e.status === status);
      }

      if (startDate) {
        const start = new Date(startDate as string);
        events = events.filter(e => e.timestamp >= start);
      }

      if (endDate) {
        const end = new Date(endDate as string);
        events = events.filter(e => e.timestamp <= end);
      }

      res.json({
        events,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: events.length
        }
      });

    } catch (error) {
      console.error('Error getting integration events:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get integration events'
      });
    }
  }

  /**
   * Get active alerts
   */
  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await this.integrationService.getActiveAlerts();
      res.json({ alerts });

    } catch (error) {
      console.error('Error getting alerts:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get alerts'
      });
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const userId = req.user?.id || 'unknown';
      
      await this.integrationService.resolveAlert(alertId, userId);

      // Log the action
      await this.auditService.logAction({
        entidadeId: alertId,
        entidadeTipo: 'integration_alert',
        acao: 'alert_resolved_manual',
        usuarioId: userId,
        usuarioNome: req.user?.name || 'Unknown User',
        motivo: 'Alert resolved manually by user',
        valoresDepois: { alertId, resolvedBy: userId }
      });

      res.json({
        success: true,
        message: 'Alert resolved successfully'
      });

    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to resolve alert'
      });
    }
  }

  /**
   * Request manual reprocessing of a failed event
   * Requirements: 10.5 - Manual reprocessing capabilities
   */
  async requestReprocessing(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const { maxAttempts = 3 } = req.body;
      const userId = req.user?.id || 'unknown';
      const userName = req.user?.name || 'Unknown User';

      const requestId = await this.integrationService.requestReprocessing(
        eventId,
        userId,
        maxAttempts
      );

      // Log the reprocessing request
      await this.auditService.logAction({
        entidadeId: requestId,
        entidadeTipo: 'reprocessing_request',
        acao: 'reprocessing_requested_manual',
        usuarioId: userId,
        usuarioNome: userName,
        motivo: `Manual reprocessing requested for event ${eventId}`,
        valoresDepois: { 
          requestId, 
          originalEventId: eventId, 
          maxAttempts,
          requestedBy: userId 
        }
      });

      res.json({
        success: true,
        requestId,
        message: 'Reprocessing request created successfully'
      });

    } catch (error) {
      console.error('Error requesting reprocessing:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Event not found',
          message: error.message
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to create reprocessing request'
        });
      }
    }
  }

  /**
   * Get integration statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.integrationService.getIntegrationStats();
      res.json(stats);

    } catch (error) {
      console.error('Error getting integration stats:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get integration statistics'
      });
    }
  }

  /**
   * Record a manual integration event (for testing)
   */
  async recordEvent(req: Request, res: Response): Promise<void> {
    try {
      const {
        serviceName,
        eventType,
        status,
        responseTime,
        payload,
        error,
        correlationId
      } = req.body;

      // Validate required fields
      if (!serviceName || !eventType || !status || responseTime === undefined) {
        res.status(400).json({
          error: 'Missing required fields',
          required: ['serviceName', 'eventType', 'status', 'responseTime']
        });
        return;
      }

      const eventId = await this.integrationService.recordIntegrationEvent(
        serviceName,
        eventType,
        status,
        responseTime,
        payload,
        error,
        correlationId
      );

      res.json({
        success: true,
        eventId,
        message: 'Integration event recorded successfully'
      });

    } catch (error) {
      console.error('Error recording integration event:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to record integration event'
      });
    }
  }

  /**
   * Health check endpoint for the monitoring service itself
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.integrationService.getIntegrationStats();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'integration-monitoring',
        version: '1.0.0',
        stats: {
          totalServices: stats.totalServices,
          healthyServices: stats.healthyServices,
          activeAlerts: stats.activeAlerts
        }
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}