import { Router } from 'express';
import { Pool } from 'pg';
import { IntegrationMonitoringController } from '../controllers/IntegrationMonitoringController.js';

export function createIntegrationRoutes(pool: Pool): Router {
  const router = Router();
  const controller = new IntegrationMonitoringController(pool);

  /**
   * Integration Health Dashboard
   * GET /api/integration/dashboard
   * Returns complete dashboard data including statuses, stats, alerts, and recent events
   */
  router.get('/dashboard', (req, res) => controller.getDashboard(req, res));

  /**
   * Service Status
   * GET /api/integration/services/:serviceName/status
   * Returns detailed status for a specific service
   */
  router.get('/services/:serviceName/status', (req, res) => controller.getServiceStatus(req, res));

  /**
   * Integration Events
   * GET /api/integration/events
   * Returns integration events with optional filtering
   * Query parameters:
   * - serviceName: Filter by service name
   * - eventType: Filter by event type
   * - status: Filter by status (success, failure, timeout, retry)
   * - limit: Number of events to return (max 200, default 50)
   * - offset: Pagination offset (default 0)
   * - startDate: Filter events after this date
   * - endDate: Filter events before this date
   */
  router.get('/events', (req, res) => controller.getEvents(req, res));

  /**
   * Request Event Reprocessing
   * POST /api/integration/events/:eventId/reprocess
   * Requests manual reprocessing of a failed integration event
   * Body: { maxAttempts?: number }
   */
  router.post('/events/:eventId/reprocess', (req, res) => controller.requestReprocessing(req, res));

  /**
   * Active Alerts
   * GET /api/integration/alerts
   * Returns all active integration alerts
   */
  router.get('/alerts', (req, res) => controller.getAlerts(req, res));

  /**
   * Resolve Alert
   * POST /api/integration/alerts/:alertId/resolve
   * Manually resolves an active alert
   */
  router.post('/alerts/:alertId/resolve', (req, res) => controller.resolveAlert(req, res));

  /**
   * Integration Statistics
   * GET /api/integration/stats
   * Returns aggregated integration statistics
   */
  router.get('/stats', (req, res) => controller.getStats(req, res));

  /**
   * Record Integration Event (for testing)
   * POST /api/integration/events
   * Manually records an integration event
   * Body: {
   *   serviceName: string,
   *   eventType: string,
   *   status: 'success' | 'failure' | 'timeout' | 'retry',
   *   responseTime: number,
   *   payload?: any,
   *   error?: string,
   *   correlationId?: string
   * }
   */
  router.post('/events', (req, res) => controller.recordEvent(req, res));

  /**
   * Health Check
   * GET /api/integration/health
   * Returns health status of the integration monitoring service
   */
  router.get('/health', (req, res) => controller.healthCheck(req, res));

  return router;
}