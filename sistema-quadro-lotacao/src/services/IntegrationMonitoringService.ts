import { Pool } from 'pg';
import { AuditService } from './AuditService.js';
import { NotificationService } from './NotificationService.js';

export interface IntegrationStatus {
  id: string;
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastSuccessfulCall: Date | null;
  lastFailedCall: Date | null;
  consecutiveFailures: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  lastError?: string;
  updatedAt: Date;
}

export interface IntegrationEvent {
  id: string;
  serviceName: string;
  eventType: 'webhook_received' | 'webhook_processed' | 'webhook_failed' | 'webhook_retry';
  status: 'success' | 'failure' | 'timeout' | 'retry';
  payload?: any;
  responseTime: number;
  error?: string;
  timestamp: Date;
  correlationId?: string;
}

export interface IntegrationAlert {
  id: string;
  serviceName: string;
  alertType: 'service_down' | 'high_error_rate' | 'slow_response' | 'consecutive_failures';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ReprocessingRequest {
  id: string;
  originalEventId: string;
  serviceName: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  requestedBy: string;
  requestedAt: Date;
  processedAt?: Date;
  error?: string;
}

export class IntegrationMonitoringService {
  private pool: Pool;
  private auditService: AuditService;
  private notificationService: NotificationService;
  private integrationStatuses: Map<string, IntegrationStatus> = new Map();
  private activeAlerts: Map<string, IntegrationAlert> = new Map();

  // Configuration thresholds
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly CONSECUTIVE_FAILURE_THRESHOLD = 5;
  private readonly ERROR_RATE_THRESHOLD = 0.1; // 10%
  private readonly RESPONSE_TIME_THRESHOLD = 5000; // 5 seconds
  private readonly SERVICE_DOWN_THRESHOLD = 300000; // 5 minutes

  constructor(pool: Pool) {
    this.pool = pool;
    this.auditService = new AuditService(pool);
    this.notificationService = new NotificationService(pool);
    
    // Initialize monitoring
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring for known services
   */
  private async initializeMonitoring(): Promise<void> {
    const services = ['rh_legado_webhook', 'platform_auth', 'platform_authz', 'platform_notifications'];
    
    for (const serviceName of services) {
      await this.initializeServiceStatus(serviceName);
    }

    // Start periodic health checks
    setInterval(() => {
      this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Initialize status tracking for a service
   */
  private async initializeServiceStatus(serviceName: string): Promise<void> {
    try {
      const client = await this.pool.connect();
      try {
        // Get existing status from database or create new
        const result = await client.query(`
          SELECT * FROM integration_status WHERE service_name = $1
        `, [serviceName]);

        let status: IntegrationStatus;
        
        if (result.rows.length > 0) {
          const row = result.rows[0];
          status = {
            id: row.id,
            serviceName: row.service_name,
            status: row.status,
            lastSuccessfulCall: row.last_successful_call,
            lastFailedCall: row.last_failed_call,
            consecutiveFailures: row.consecutive_failures,
            totalCalls: row.total_calls,
            successfulCalls: row.successful_calls,
            failedCalls: row.failed_calls,
            averageResponseTime: row.average_response_time,
            lastError: row.last_error,
            updatedAt: row.updated_at
          };
        } else {
          // Create new status record
          status = {
            id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            serviceName,
            status: 'unknown',
            lastSuccessfulCall: null,
            lastFailedCall: null,
            consecutiveFailures: 0,
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageResponseTime: 0,
            updatedAt: new Date()
          };

          await client.query(`
            INSERT INTO integration_status (
              id, service_name, status, consecutive_failures, total_calls,
              successful_calls, failed_calls, average_response_time, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            status.id, status.serviceName, status.status, status.consecutiveFailures,
            status.totalCalls, status.successfulCalls, status.failedCalls,
            status.averageResponseTime, status.updatedAt
          ]);
        }

        this.integrationStatuses.set(serviceName, status);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error initializing status for service ${serviceName}:`, error);
    }
  }

  /**
   * Record an integration event (webhook received, processed, failed, etc.)
   * Requirements: 10.3, 10.4 - Integration monitoring and error logging
   */
  async recordIntegrationEvent(
    serviceName: string,
    eventType: IntegrationEvent['eventType'],
    status: IntegrationEvent['status'],
    responseTime: number,
    payload?: any,
    error?: string,
    correlationId?: string
  ): Promise<string> {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const event: IntegrationEvent = {
      id: eventId,
      serviceName,
      eventType,
      status,
      payload,
      responseTime,
      error,
      timestamp: new Date(),
      correlationId
    };

    try {
      const client = await this.pool.connect();
      try {
        // Store event in database
        await client.query(`
          INSERT INTO integration_events (
            id, service_name, event_type, status, payload, response_time,
            error, timestamp, correlation_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          event.id, event.serviceName, event.eventType, event.status,
          event.payload ? JSON.stringify(event.payload) : null,
          event.responseTime, event.error, event.timestamp, event.correlationId
        ]);

        // Update service status
        await this.updateServiceStatus(serviceName, status === 'success', responseTime, error);

        // Check for alerts
        await this.checkAndCreateAlerts(serviceName);

        // Log to audit trail
        await this.auditService.logAction({
          entidadeId: eventId,
          entidadeTipo: 'integration_event',
          acao: `integration_${eventType}`,
          usuarioId: 'sistema',
          usuarioNome: 'Integration Monitoring',
          motivo: `Integration event recorded: ${eventType} - ${status}`,
          valoresDepois: { event }
        });

      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Error recording integration event:', dbError);
      throw dbError;
    }

    return eventId;
  }

  /**
   * Update service status based on latest event
   */
  private async updateServiceStatus(
    serviceName: string,
    isSuccess: boolean,
    responseTime: number,
    error?: string
  ): Promise<void> {
    const status = this.integrationStatuses.get(serviceName);
    if (!status) {
      await this.initializeServiceStatus(serviceName);
      return this.updateServiceStatus(serviceName, isSuccess, responseTime, error);
    }

    const now = new Date();
    
    // Update counters
    status.totalCalls++;
    if (isSuccess) {
      status.successfulCalls++;
      status.lastSuccessfulCall = now;
      status.consecutiveFailures = 0;
    } else {
      status.failedCalls++;
      status.lastFailedCall = now;
      status.consecutiveFailures++;
      status.lastError = error;
    }

    // Update average response time (simple moving average)
    status.averageResponseTime = (
      (status.averageResponseTime * (status.totalCalls - 1) + responseTime) / status.totalCalls
    );

    // Determine health status
    const errorRate = status.failedCalls / status.totalCalls;
    const timeSinceLastSuccess = status.lastSuccessfulCall 
      ? now.getTime() - status.lastSuccessfulCall.getTime()
      : Infinity;

    if (status.consecutiveFailures >= this.CONSECUTIVE_FAILURE_THRESHOLD || 
        timeSinceLastSuccess > this.SERVICE_DOWN_THRESHOLD) {
      status.status = 'unhealthy';
    } else if (errorRate > this.ERROR_RATE_THRESHOLD || 
               status.averageResponseTime > this.RESPONSE_TIME_THRESHOLD) {
      status.status = 'degraded';
    } else {
      status.status = 'healthy';
    }

    status.updatedAt = now;

    // Update database
    try {
      const client = await this.pool.connect();
      try {
        await client.query(`
          UPDATE integration_status SET
            status = $2,
            last_successful_call = $3,
            last_failed_call = $4,
            consecutive_failures = $5,
            total_calls = $6,
            successful_calls = $7,
            failed_calls = $8,
            average_response_time = $9,
            last_error = $10,
            updated_at = $11
          WHERE service_name = $1
        `, [
          serviceName, status.status, status.lastSuccessfulCall, status.lastFailedCall,
          status.consecutiveFailures, status.totalCalls, status.successfulCalls,
          status.failedCalls, status.averageResponseTime, status.lastError, status.updatedAt
        ]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating service status:', error);
    }
  }

  /**
   * Check for alert conditions and create alerts if needed
   */
  private async checkAndCreateAlerts(serviceName: string): Promise<void> {
    const status = this.integrationStatuses.get(serviceName);
    if (!status) return;

    const alerts: Partial<IntegrationAlert>[] = [];

    // Check for service down
    if (status.status === 'unhealthy') {
      const alertKey = `${serviceName}_service_down`;
      if (!this.activeAlerts.has(alertKey)) {
        alerts.push({
          serviceName,
          alertType: 'service_down',
          severity: 'critical',
          message: `Service ${serviceName} is unhealthy`,
          threshold: this.CONSECUTIVE_FAILURE_THRESHOLD,
          currentValue: status.consecutiveFailures
        });
      }
    }

    // Check for high error rate
    const errorRate = status.totalCalls > 0 ? status.failedCalls / status.totalCalls : 0;
    if (errorRate > this.ERROR_RATE_THRESHOLD) {
      const alertKey = `${serviceName}_high_error_rate`;
      if (!this.activeAlerts.has(alertKey)) {
        alerts.push({
          serviceName,
          alertType: 'high_error_rate',
          severity: 'high',
          message: `High error rate detected for ${serviceName}: ${(errorRate * 100).toFixed(1)}%`,
          threshold: this.ERROR_RATE_THRESHOLD,
          currentValue: errorRate
        });
      }
    }

    // Check for slow response times
    if (status.averageResponseTime > this.RESPONSE_TIME_THRESHOLD) {
      const alertKey = `${serviceName}_slow_response`;
      if (!this.activeAlerts.has(alertKey)) {
        alerts.push({
          serviceName,
          alertType: 'slow_response',
          severity: 'medium',
          message: `Slow response times for ${serviceName}: ${status.averageResponseTime}ms average`,
          threshold: this.RESPONSE_TIME_THRESHOLD,
          currentValue: status.averageResponseTime
        });
      }
    }

    // Create new alerts
    for (const alertData of alerts) {
      await this.createAlert(alertData as Omit<IntegrationAlert, 'id' | 'isActive' | 'createdAt'>);
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(alertData: Omit<IntegrationAlert, 'id' | 'isActive' | 'createdAt'>): Promise<void> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alertKey = `${alertData.serviceName}_${alertData.alertType}`;
    
    const alert: IntegrationAlert = {
      ...alertData,
      id: alertId,
      isActive: true,
      createdAt: new Date()
    };

    try {
      const client = await this.pool.connect();
      try {
        await client.query(`
          INSERT INTO integration_alerts (
            id, service_name, alert_type, severity, message, threshold,
            current_value, is_active, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          alert.id, alert.serviceName, alert.alertType, alert.severity,
          alert.message, alert.threshold, alert.currentValue, alert.isActive, alert.createdAt
        ]);

        this.activeAlerts.set(alertKey, alert);

        // Send notification
        await this.notificationService.sendNotification({
          templateId: 'integration_alert',
          recipientId: 'admin_team',
          templateVars: {
            serviceName: alert.serviceName,
            alertType: alert.alertType,
            severity: alert.severity,
            message: alert.message,
            threshold: alert.threshold.toString(),
            currentValue: alert.currentValue.toString()
          },
          priority: alert.severity === 'critical' ? 'urgent' : 'high',
          channels: ['email', 'inapp']
        });

        // Log alert creation
        await this.auditService.logAction({
          entidadeId: alertId,
          entidadeTipo: 'integration_alert',
          acao: 'alert_created',
          usuarioId: 'sistema',
          usuarioNome: 'Integration Monitoring',
          motivo: `Integration alert created: ${alert.alertType} for ${alert.serviceName}`,
          valoresDepois: { alert }
        });

      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  /**
   * Request manual reprocessing of a failed integration event
   * Requirements: 10.5 - Manual reprocessing capabilities
   */
  async requestReprocessing(
    eventId: string,
    requestedBy: string,
    maxAttempts: number = 3
  ): Promise<string> {
    try {
      const client = await this.pool.connect();
      try {
        // Get original event
        const eventResult = await client.query(`
          SELECT * FROM integration_events WHERE id = $1
        `, [eventId]);

        if (eventResult.rows.length === 0) {
          throw new Error(`Integration event not found: ${eventId}`);
        }

        const originalEvent = eventResult.rows[0];
        
        // Create reprocessing request
        const requestId = `reprocess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const request: ReprocessingRequest = {
          id: requestId,
          originalEventId: eventId,
          serviceName: originalEvent.service_name,
          payload: originalEvent.payload ? JSON.parse(originalEvent.payload) : null,
          status: 'pending',
          attempts: 0,
          maxAttempts,
          requestedBy,
          requestedAt: new Date()
        };

        await client.query(`
          INSERT INTO reprocessing_requests (
            id, original_event_id, service_name, payload, status,
            attempts, max_attempts, requested_by, requested_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          request.id, request.originalEventId, request.serviceName,
          request.payload ? JSON.stringify(request.payload) : null,
          request.status, request.attempts, request.maxAttempts,
          request.requestedBy, request.requestedAt
        ]);

        // Log reprocessing request
        await this.auditService.logAction({
          entidadeId: requestId,
          entidadeTipo: 'reprocessing_request',
          acao: 'reprocessing_requested',
          usuarioId: requestedBy,
          usuarioNome: 'User',
          motivo: `Manual reprocessing requested for event ${eventId}`,
          valoresDepois: { request, originalEvent }
        });

        return requestId;

      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error requesting reprocessing:', error);
      throw error;
    }
  }

  /**
   * Get integration status for all services
   */
  async getIntegrationStatuses(): Promise<IntegrationStatus[]> {
    return Array.from(this.integrationStatuses.values());
  }

  /**
   * Get integration status for a specific service
   */
  async getServiceStatus(serviceName: string): Promise<IntegrationStatus | null> {
    return this.integrationStatuses.get(serviceName) || null;
  }

  /**
   * Get recent integration events
   */
  async getRecentEvents(
    serviceName?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<IntegrationEvent[]> {
    try {
      const client = await this.pool.connect();
      try {
        let query = `
          SELECT * FROM integration_events
          ${serviceName ? 'WHERE service_name = $1' : ''}
          ORDER BY timestamp DESC
          LIMIT $${serviceName ? '2' : '1'} OFFSET $${serviceName ? '3' : '2'}
        `;

        const params = serviceName ? [serviceName, limit, offset] : [limit, offset];
        const result = await client.query(query, params);

        return result.rows.map(row => ({
          id: row.id,
          serviceName: row.service_name,
          eventType: row.event_type,
          status: row.status,
          payload: row.payload ? JSON.parse(row.payload) : null,
          responseTime: row.response_time,
          error: row.error,
          timestamp: row.timestamp,
          correlationId: row.correlation_id
        }));

      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting recent events:', error);
      return [];
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<IntegrationAlert[]> {
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(`
          SELECT * FROM integration_alerts
          WHERE is_active = true
          ORDER BY created_at DESC
        `);

        return result.rows.map(row => ({
          id: row.id,
          serviceName: row.service_name,
          alertType: row.alert_type,
          severity: row.severity,
          message: row.message,
          threshold: row.threshold,
          currentValue: row.current_value,
          isActive: row.is_active,
          createdAt: row.created_at,
          resolvedAt: row.resolved_at
        }));

      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    try {
      const client = await this.pool.connect();
      try {
        const now = new Date();
        
        await client.query(`
          UPDATE integration_alerts SET
            is_active = false,
            resolved_at = $2
          WHERE id = $1
        `, [alertId, now]);

        // Remove from active alerts map
        for (const [key, alert] of this.activeAlerts.entries()) {
          if (alert.id === alertId) {
            this.activeAlerts.delete(key);
            break;
          }
        }

        // Log alert resolution
        await this.auditService.logAction({
          entidadeId: alertId,
          entidadeTipo: 'integration_alert',
          acao: 'alert_resolved',
          usuarioId: resolvedBy,
          usuarioNome: 'User',
          motivo: 'Integration alert resolved manually',
          valoresDepois: { resolvedAt: now }
        });

      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Perform periodic health checks
   */
  private async performHealthChecks(): Promise<void> {
    // This would typically ping external services to check their health
    // For now, we'll just check if we've received recent events
    
    const now = new Date();
    const healthCheckThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [serviceName, status] of this.integrationStatuses.entries()) {
      const timeSinceLastCall = status.lastSuccessfulCall 
        ? now.getTime() - status.lastSuccessfulCall.getTime()
        : Infinity;

      if (timeSinceLastCall > healthCheckThreshold && status.status !== 'unhealthy') {
        // Mark as potentially unhealthy if no recent activity
        await this.recordIntegrationEvent(
          serviceName,
          'webhook_received',
          'failure',
          0,
          null,
          'No recent activity detected during health check'
        );
      }
    }
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(): Promise<{
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    activeAlerts: number;
    averageResponseTime: number;
  }> {
    const statuses = Array.from(this.integrationStatuses.values());
    
    const totalEvents = statuses.reduce((sum, s) => sum + s.totalCalls, 0);
    const successfulEvents = statuses.reduce((sum, s) => sum + s.successfulCalls, 0);
    const failedEvents = statuses.reduce((sum, s) => sum + s.failedCalls, 0);
    const totalResponseTime = statuses.reduce((sum, s) => sum + (s.averageResponseTime * s.totalCalls), 0);

    return {
      totalServices: statuses.length,
      healthyServices: statuses.filter(s => s.status === 'healthy').length,
      degradedServices: statuses.filter(s => s.status === 'degraded').length,
      unhealthyServices: statuses.filter(s => s.status === 'unhealthy').length,
      totalEvents,
      successfulEvents,
      failedEvents,
      activeAlerts: this.activeAlerts.size,
      averageResponseTime: totalEvents > 0 ? totalResponseTime / totalEvents : 0
    };
  }
}