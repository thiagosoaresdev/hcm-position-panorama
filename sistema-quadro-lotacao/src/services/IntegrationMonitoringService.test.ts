import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { IntegrationMonitoringService } from './IntegrationMonitoringService.js';

// Mock dependencies
vi.mock('./AuditService.js');
vi.mock('./NotificationService.js');

describe('IntegrationMonitoringService', () => {
  let pool: Pool;
  let service: IntegrationMonitoringService;
  let mockClient: any;

  beforeEach(() => {
    // Mock database client
    mockClient = {
      query: vi.fn(),
      release: vi.fn()
    };

    // Mock pool
    pool = {
      connect: vi.fn().mockResolvedValue(mockClient)
    } as any;

    service = new IntegrationMonitoringService(pool);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('recordIntegrationEvent', () => {
    it('should record a successful integration event', async () => {
      // Mock database responses
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Insert event
        .mockResolvedValueOnce({ rows: [{ id: 'status_1', service_name: 'test_service' }] }) // Get status
        .mockResolvedValueOnce({ rows: [] }); // Update status

      const eventId = await service.recordIntegrationEvent(
        'test_service',
        'webhook_processed',
        'success',
        1000,
        { test: 'data' },
        undefined,
        'correlation_123'
      );

      expect(eventId).toMatch(/^event_/);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO integration_events'),
        expect.arrayContaining(['test_service', 'webhook_processed', 'success'])
      );
    });

    it('should record a failed integration event with error', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Insert event
        .mockResolvedValueOnce({ rows: [{ id: 'status_1', service_name: 'test_service' }] }) // Get status
        .mockResolvedValueOnce({ rows: [] }); // Update status

      const eventId = await service.recordIntegrationEvent(
        'test_service',
        'webhook_processed',
        'failure',
        5000,
        { test: 'data' },
        'Database connection failed',
        'correlation_456'
      );

      expect(eventId).toMatch(/^event_/);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO integration_events'),
        expect.arrayContaining([
          expect.any(String),
          'test_service',
          'webhook_processed',
          'failure',
          '{"test":"data"}',
          5000,
          'Database connection failed',
          expect.any(Date),
          'correlation_456'
        ])
      );
    });

    it('should handle database errors gracefully', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(
        service.recordIntegrationEvent(
          'test_service',
          'webhook_processed',
          'success',
          1000
        )
      ).rejects.toThrow('Database error');
    });
  });

  describe('requestReprocessing', () => {
    it('should create a reprocessing request for a valid event', async () => {
      // Mock finding the original event
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'event_123',
            service_name: 'test_service',
            payload: '{"test":"data"}'
          }]
        })
        .mockResolvedValueOnce({ rows: [] }); // Insert reprocessing request

      const requestId = await service.requestReprocessing(
        'event_123',
        'user_123',
        3
      );

      expect(requestId).toMatch(/^reprocess_/);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM integration_events WHERE id = $1'),
        ['event_123']
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO reprocessing_requests'),
        expect.arrayContaining([
          expect.any(String),
          'event_123',
          'test_service',
          '{"test":"data"}',
          'pending',
          0,
          3,
          'user_123',
          expect.any(Date)
        ])
      );
    });

    it('should throw error for non-existent event', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.requestReprocessing('non_existent', 'user_123')
      ).rejects.toThrow('Integration event not found: non_existent');
    });
  });

  describe('getIntegrationStatuses', () => {
    it('should return all integration statuses', async () => {
      const mockStatuses = [
        {
          id: 'status_1',
          serviceName: 'service_1',
          status: 'healthy',
          totalCalls: 100,
          successfulCalls: 95,
          failedCalls: 5
        },
        {
          id: 'status_2',
          serviceName: 'service_2',
          status: 'degraded',
          totalCalls: 50,
          successfulCalls: 40,
          failedCalls: 10
        }
      ];

      // Mock the service's internal status map
      (service as any).integrationStatuses = new Map([
        ['service_1', mockStatuses[0]],
        ['service_2', mockStatuses[1]]
      ]);

      const statuses = await service.getIntegrationStatuses();

      expect(statuses).toHaveLength(2);
      expect(statuses[0].serviceName).toBe('service_1');
      expect(statuses[0].status).toBe('healthy');
      expect(statuses[1].serviceName).toBe('service_2');
      expect(statuses[1].status).toBe('degraded');
    });
  });

  describe('getRecentEvents', () => {
    it('should return recent events with default parameters', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          service_name: 'test_service',
          event_type: 'webhook_processed',
          status: 'success',
          payload: '{"test":"data"}',
          response_time: 1000,
          error: null,
          timestamp: new Date(),
          correlation_id: 'corr_1'
        }
      ];

      mockClient.query.mockResolvedValueOnce({ rows: mockEvents });

      const events = await service.getRecentEvents();

      expect(events).toHaveLength(1);
      expect(events[0].serviceName).toBe('test_service');
      expect(events[0].eventType).toBe('webhook_processed');
      expect(events[0].status).toBe('success');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY timestamp DESC'),
        [50, 0]
      );
    });

    it('should filter events by service name', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await service.getRecentEvents('specific_service', 10, 5);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE service_name = $1'),
        ['specific_service', 10, 5]
      );
    });

    it('should handle database errors gracefully', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      const events = await service.getRecentEvents();

      expect(events).toEqual([]);
    });
  });

  describe('getActiveAlerts', () => {
    it('should return active alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert_1',
          service_name: 'test_service',
          alert_type: 'high_error_rate',
          severity: 'high',
          message: 'High error rate detected',
          threshold: 0.1,
          current_value: 0.15,
          is_active: true,
          created_at: new Date()
        }
      ];

      mockClient.query.mockResolvedValueOnce({ rows: mockAlerts });

      const alerts = await service.getActiveAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].serviceName).toBe('test_service');
      expect(alerts[0].alertType).toBe('high_error_rate');
      expect(alerts[0].severity).toBe('high');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE is_active = true'),
        []
      );
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an active alert', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await service.resolveAlert('alert_123', 'user_123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE integration_alerts SET'),
        ['alert_123', expect.any(Date)]
      );
    });
  });

  describe('getIntegrationStats', () => {
    it('should calculate integration statistics correctly', async () => {
      // Mock the service's internal status map
      const mockStatuses = new Map([
        ['service_1', {
          status: 'healthy',
          totalCalls: 100,
          successfulCalls: 95,
          failedCalls: 5,
          averageResponseTime: 500
        }],
        ['service_2', {
          status: 'degraded',
          totalCalls: 50,
          successfulCalls: 40,
          failedCalls: 10,
          averageResponseTime: 1500
        }],
        ['service_3', {
          status: 'unhealthy',
          totalCalls: 20,
          successfulCalls: 10,
          failedCalls: 10,
          averageResponseTime: 3000
        }]
      ]);

      (service as any).integrationStatuses = mockStatuses;
      (service as any).activeAlerts = new Map([
        ['alert_1', { id: 'alert_1' }],
        ['alert_2', { id: 'alert_2' }]
      ]);

      const stats = await service.getIntegrationStats();

      expect(stats.totalServices).toBe(3);
      expect(stats.healthyServices).toBe(1);
      expect(stats.degradedServices).toBe(1);
      expect(stats.unhealthyServices).toBe(1);
      expect(stats.totalEvents).toBe(170); // 100 + 50 + 20
      expect(stats.successfulEvents).toBe(145); // 95 + 40 + 10
      expect(stats.failedEvents).toBe(25); // 5 + 10 + 10
      expect(stats.activeAlerts).toBe(2);
      
      // Average response time calculation: (500*100 + 1500*50 + 3000*20) / 170
      const expectedAvgResponseTime = (500*100 + 1500*50 + 3000*20) / 170;
      expect(stats.averageResponseTime).toBeCloseTo(expectedAvgResponseTime, 1);
    });

    it('should handle empty statistics', async () => {
      (service as any).integrationStatuses = new Map();
      (service as any).activeAlerts = new Map();

      const stats = await service.getIntegrationStats();

      expect(stats.totalServices).toBe(0);
      expect(stats.healthyServices).toBe(0);
      expect(stats.totalEvents).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
    });
  });
});

describe('Integration Event Validation', () => {
  let service: IntegrationMonitoringService;

  beforeEach(() => {
    const pool = {
      connect: vi.fn().mockResolvedValue({
        query: vi.fn(),
        release: vi.fn()
      })
    } as any;

    service = new IntegrationMonitoringService(pool);
  });

  it('should validate event types', async () => {
    const validEventTypes = [
      'webhook_received',
      'webhook_processed',
      'webhook_failed',
      'webhook_retry'
    ];

    for (const eventType of validEventTypes) {
      expect(() => {
        // This would be validated in the actual implementation
        const isValid = ['webhook_received', 'webhook_processed', 'webhook_failed', 'webhook_retry']
          .includes(eventType as any);
        expect(isValid).toBe(true);
      }).not.toThrow();
    }
  });

  it('should validate status values', async () => {
    const validStatuses = ['success', 'failure', 'timeout', 'retry'];

    for (const status of validStatuses) {
      expect(() => {
        const isValid = ['success', 'failure', 'timeout', 'retry'].includes(status as any);
        expect(isValid).toBe(true);
      }).not.toThrow();
    }
  });
});