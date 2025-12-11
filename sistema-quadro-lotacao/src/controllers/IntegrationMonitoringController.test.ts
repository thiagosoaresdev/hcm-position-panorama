import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { Pool } from 'pg';
import { IntegrationMonitoringController } from './IntegrationMonitoringController.js';

// Mock dependencies
vi.mock('../services/IntegrationMonitoringService.js');
vi.mock('../services/AuditService.js');

describe('IntegrationMonitoringController', () => {
  let controller: IntegrationMonitoringController;
  let mockPool: Pool;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockIntegrationService: any;

  beforeEach(() => {
    mockPool = {} as Pool;
    controller = new IntegrationMonitoringController(mockPool);
    
    // Mock the integration service
    mockIntegrationService = {
      getIntegrationStatuses: vi.fn(),
      getIntegrationStats: vi.fn(),
      getActiveAlerts: vi.fn(),
      getRecentEvents: vi.fn(),
      getServiceStatus: vi.fn(),
      resolveAlert: vi.fn(),
      requestReprocessing: vi.fn(),
      recordIntegrationEvent: vi.fn()
    };

    (controller as any).integrationService = mockIntegrationService;

    // Mock request and response
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user_123', name: 'Test User' }
    };

    mockRes = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return complete dashboard data', async () => {
      const mockStatuses = [{ id: 'status_1', serviceName: 'test_service', status: 'healthy' }];
      const mockStats = { totalServices: 1, healthyServices: 1, activeAlerts: 0 };
      const mockAlerts = [];
      const mockEvents = [{ id: 'event_1', serviceName: 'test_service', status: 'success' }];

      mockIntegrationService.getIntegrationStatuses.mockResolvedValue(mockStatuses);
      mockIntegrationService.getIntegrationStats.mockResolvedValue(mockStats);
      mockIntegrationService.getActiveAlerts.mockResolvedValue(mockAlerts);
      mockIntegrationService.getRecentEvents.mockResolvedValue(mockEvents);

      await controller.getDashboard(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        statuses: mockStatuses,
        stats: mockStats,
        alerts: mockAlerts,
        recentEvents: mockEvents,
        timestamp: expect.any(String)
      });
    });

    it('should handle errors gracefully', async () => {
      mockIntegrationService.getIntegrationStatuses.mockRejectedValue(new Error('Database error'));

      await controller.getDashboard(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to load integration dashboard'
      });
    });
  });

  describe('getServiceStatus', () => {
    it('should return status for existing service', async () => {
      const mockStatus = { id: 'status_1', serviceName: 'test_service', status: 'healthy' };
      mockReq.params = { serviceName: 'test_service' };
      mockIntegrationService.getServiceStatus.mockResolvedValue(mockStatus);

      await controller.getServiceStatus(mockReq as Request, mockRes as Response);

      expect(mockIntegrationService.getServiceStatus).toHaveBeenCalledWith('test_service');
      expect(mockRes.json).toHaveBeenCalledWith(mockStatus);
    });

    it('should return 404 for non-existent service', async () => {
      mockReq.params = { serviceName: 'non_existent' };
      mockIntegrationService.getServiceStatus.mockResolvedValue(null);

      await controller.getServiceStatus(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Service not found',
        message: 'No monitoring data found for service: non_existent'
      });
    });
  });

  describe('getEvents', () => {
    it('should return events with default parameters', async () => {
      const mockEvents = [{ id: 'event_1', serviceName: 'test_service' }];
      mockIntegrationService.getRecentEvents.mockResolvedValue(mockEvents);

      await controller.getEvents(mockReq as Request, mockRes as Response);

      expect(mockIntegrationService.getRecentEvents).toHaveBeenCalledWith(
        undefined,
        50,
        0
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        events: mockEvents,
        pagination: {
          limit: 50,
          offset: 0,
          total: 1
        }
      });
    });

    it('should apply query filters', async () => {
      mockReq.query = {
        serviceName: 'test_service',
        eventType: 'webhook_processed',
        status: 'success',
        limit: '10',
        offset: '5'
      };

      const mockEvents = [
        { id: 'event_1', serviceName: 'test_service', eventType: 'webhook_processed', status: 'success' }
      ];
      mockIntegrationService.getRecentEvents.mockResolvedValue(mockEvents);

      await controller.getEvents(mockReq as Request, mockRes as Response);

      expect(mockIntegrationService.getRecentEvents).toHaveBeenCalledWith(
        'test_service',
        10,
        5
      );
    });

    it('should limit maximum results to 200', async () => {
      mockReq.query = { limit: '500' };
      mockIntegrationService.getRecentEvents.mockResolvedValue([]);

      await controller.getEvents(mockReq as Request, mockRes as Response);

      expect(mockIntegrationService.getRecentEvents).toHaveBeenCalledWith(
        undefined,
        200, // Should be capped at 200
        0
      );
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert successfully', async () => {
      mockReq.params = { alertId: 'alert_123' };
      mockIntegrationService.resolveAlert.mockResolvedValue(undefined);

      await controller.resolveAlert(mockReq as Request, mockRes as Response);

      expect(mockIntegrationService.resolveAlert).toHaveBeenCalledWith('alert_123', 'user_123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Alert resolved successfully'
      });
    });

    it('should handle resolve errors', async () => {
      mockReq.params = { alertId: 'alert_123' };
      mockIntegrationService.resolveAlert.mockRejectedValue(new Error('Alert not found'));

      await controller.resolveAlert(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to resolve alert'
      });
    });
  });

  describe('requestReprocessing', () => {
    it('should create reprocessing request successfully', async () => {
      mockReq.params = { eventId: 'event_123' };
      mockReq.body = { maxAttempts: 3 };
      mockIntegrationService.requestReprocessing.mockResolvedValue('request_456');

      await controller.requestReprocessing(mockReq as Request, mockRes as Response);

      expect(mockIntegrationService.requestReprocessing).toHaveBeenCalledWith(
        'event_123',
        'user_123',
        3
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        requestId: 'request_456',
        message: 'Reprocessing request created successfully'
      });
    });

    it('should handle event not found error', async () => {
      mockReq.params = { eventId: 'non_existent' };
      mockIntegrationService.requestReprocessing.mockRejectedValue(
        new Error('Integration event not found: non_existent')
      );

      await controller.requestReprocessing(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Event not found',
        message: 'Integration event not found: non_existent'
      });
    });

    it('should use default maxAttempts when not provided', async () => {
      mockReq.params = { eventId: 'event_123' };
      mockReq.body = {}; // No maxAttempts
      mockIntegrationService.requestReprocessing.mockResolvedValue('request_456');

      await controller.requestReprocessing(mockReq as Request, mockRes as Response);

      expect(mockIntegrationService.requestReprocessing).toHaveBeenCalledWith(
        'event_123',
        'user_123',
        3 // Default value
      );
    });
  });

  describe('recordEvent', () => {
    it('should record event successfully', async () => {
      mockReq.body = {
        serviceName: 'test_service',
        eventType: 'webhook_processed',
        status: 'success',
        responseTime: 1000,
        payload: { test: 'data' }
      };
      mockIntegrationService.recordIntegrationEvent.mockResolvedValue('event_123');

      await controller.recordEvent(mockReq as Request, mockRes as Response);

      expect(mockIntegrationService.recordIntegrationEvent).toHaveBeenCalledWith(
        'test_service',
        'webhook_processed',
        'success',
        1000,
        { test: 'data' },
        undefined,
        undefined
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        eventId: 'event_123',
        message: 'Integration event recorded successfully'
      });
    });

    it('should validate required fields', async () => {
      mockReq.body = {
        serviceName: 'test_service'
        // Missing required fields
      };

      await controller.recordEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        required: ['serviceName', 'eventType', 'status', 'responseTime']
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const mockStats = {
        totalServices: 3,
        healthyServices: 2,
        activeAlerts: 1
      };
      mockIntegrationService.getIntegrationStats.mockResolvedValue(mockStats);

      await controller.healthCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        service: 'integration-monitoring',
        version: '1.0.0',
        stats: {
          totalServices: 3,
          healthyServices: 2,
          activeAlerts: 1
        }
      });
    });

    it('should return unhealthy status on error', async () => {
      mockIntegrationService.getIntegrationStats.mockRejectedValue(new Error('Database error'));

      await controller.healthCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'unhealthy',
        timestamp: expect.any(String),
        error: 'Database error'
      });
    });
  });

  describe('getStats', () => {
    it('should return integration statistics', async () => {
      const mockStats = {
        totalServices: 5,
        healthyServices: 4,
        degradedServices: 1,
        unhealthyServices: 0,
        totalEvents: 1000,
        successfulEvents: 950,
        failedEvents: 50,
        activeAlerts: 2,
        averageResponseTime: 750
      };
      mockIntegrationService.getIntegrationStats.mockResolvedValue(mockStats);

      await controller.getStats(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    });
  });

  describe('getAlerts', () => {
    it('should return active alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert_1',
          serviceName: 'test_service',
          alertType: 'high_error_rate',
          severity: 'high',
          message: 'High error rate detected'
        }
      ];
      mockIntegrationService.getActiveAlerts.mockResolvedValue(mockAlerts);

      await controller.getAlerts(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ alerts: mockAlerts });
    });
  });
});

describe('Integration Monitoring Controller Error Handling', () => {
  let controller: IntegrationMonitoringController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    const mockPool = {} as Pool;
    controller = new IntegrationMonitoringController(mockPool);
    
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user_123', name: 'Test User' }
    };

    mockRes = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    };
  });

  it('should handle missing user context gracefully', async () => {
    mockReq.user = undefined;
    mockReq.params = { alertId: 'alert_123' };

    const mockIntegrationService = {
      resolveAlert: vi.fn().mockResolvedValue(undefined)
    };
    (controller as any).integrationService = mockIntegrationService;

    await controller.resolveAlert(mockReq as Request, mockRes as Response);

    expect(mockIntegrationService.resolveAlert).toHaveBeenCalledWith('alert_123', 'unknown');
  });

  it('should handle service unavailable errors', async () => {
    const mockIntegrationService = {
      getIntegrationStats: vi.fn().mockRejectedValue(new Error('Service unavailable'))
    };
    (controller as any).integrationService = mockIntegrationService;

    await controller.getStats(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Failed to get integration statistics'
    });
  });
});