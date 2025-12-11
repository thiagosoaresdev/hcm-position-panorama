/**
 * Integration Monitoring System Example
 * 
 * This example demonstrates how to use the Integration Monitoring Service
 * to track webhook processing, handle failures, and manage alerts.
 * 
 * Requirements: 10.3, 10.4, 10.5 - Integration monitoring, error logging, and reprocessing
 */

import { Pool } from 'pg';
import { IntegrationMonitoringService } from '../services/IntegrationMonitoringService.js';

// Example usage of the Integration Monitoring Service
export class IntegrationMonitoringExample {
  private integrationService: IntegrationMonitoringService;

  constructor(pool: Pool) {
    this.integrationService = new IntegrationMonitoringService(pool);
  }

  /**
   * Example: Recording successful webhook processing
   */
  async recordSuccessfulWebhook(): Promise<void> {
    console.log('Recording successful webhook processing...');
    
    const eventId = await this.integrationService.recordIntegrationEvent(
      'rh_legado_webhook',
      'webhook_processed',
      'success',
      1250, // 1.25 seconds response time
      {
        eventType: 'colaborador.admitido',
        colaboradorId: 'col_001',
        nome: 'João Silva'
      },
      undefined,
      'webhook_12345'
    );

    console.log(`Successful webhook event recorded: ${eventId}`);
  }

  /**
   * Example: Recording failed webhook processing
   */
  async recordFailedWebhook(): Promise<void> {
    console.log('Recording failed webhook processing...');
    
    const eventId = await this.integrationService.recordIntegrationEvent(
      'rh_legado_webhook',
      'webhook_processed',
      'failure',
      5000, // 5 seconds timeout
      {
        eventType: 'colaborador.admitido',
        colaboradorId: 'col_002'
      },
      'Database connection timeout',
      'webhook_12346'
    );

    console.log(`Failed webhook event recorded: ${eventId}`);
  }

  /**
   * Example: Simulating multiple events to trigger alerts
   */
  async simulateHighErrorRate(): Promise<void> {
    console.log('Simulating high error rate to trigger alerts...');
    
    // Record multiple failed events
    for (let i = 0; i < 10; i++) {
      await this.integrationService.recordIntegrationEvent(
        'platform_auth',
        'webhook_processed',
        'failure',
        3000,
        { attempt: i + 1 },
        'Authentication service unavailable',
        `sim_${i}`
      );
    }

    // Record a few successful events
    for (let i = 0; i < 3; i++) {
      await this.integrationService.recordIntegrationEvent(
        'platform_auth',
        'webhook_processed',
        'success',
        800,
        { attempt: i + 1 },
        undefined,
        `sim_success_${i}`
      );
    }

    console.log('High error rate simulation completed');
  }

  /**
   * Example: Requesting manual reprocessing
   */
  async requestManualReprocessing(): Promise<void> {
    console.log('Requesting manual reprocessing...');
    
    // First, create a failed event
    const eventId = await this.integrationService.recordIntegrationEvent(
      'rh_legado_webhook',
      'webhook_processed',
      'failure',
      2000,
      {
        eventType: 'colaborador.transferido',
        colaboradorId: 'col_003',
        centroCustoAnterior: 'cc_rh',
        centroCustoNovo: 'cc_ti'
      },
      'Temporary network error',
      'reprocess_example'
    );

    // Request reprocessing
    const requestId = await this.integrationService.requestReprocessing(
      eventId,
      'admin_user',
      3 // max attempts
    );

    console.log(`Reprocessing request created: ${requestId} for event: ${eventId}`);
  }

  /**
   * Example: Getting integration dashboard data
   */
  async getDashboardData(): Promise<void> {
    console.log('Fetching integration dashboard data...');
    
    const [statuses, stats, alerts, events] = await Promise.all([
      this.integrationService.getIntegrationStatuses(),
      this.integrationService.getIntegrationStats(),
      this.integrationService.getActiveAlerts(),
      this.integrationService.getRecentEvents(undefined, 10)
    ]);

    console.log('Integration Statuses:');
    statuses.forEach(status => {
      console.log(`  ${status.serviceName}: ${status.status} (${status.successfulCalls}/${status.totalCalls} success)`);
    });

    console.log('\nIntegration Statistics:');
    console.log(`  Total Services: ${stats.totalServices}`);
    console.log(`  Healthy Services: ${stats.healthyServices}`);
    console.log(`  Active Alerts: ${stats.activeAlerts}`);
    console.log(`  Success Rate: ${stats.totalEvents > 0 ? Math.round((stats.successfulEvents / stats.totalEvents) * 100) : 0}%`);
    console.log(`  Average Response Time: ${Math.round(stats.averageResponseTime)}ms`);

    console.log('\nActive Alerts:');
    alerts.forEach(alert => {
      console.log(`  ${alert.serviceName}: ${alert.alertType} (${alert.severity}) - ${alert.message}`);
    });

    console.log('\nRecent Events:');
    events.forEach(event => {
      console.log(`  ${event.timestamp}: ${event.serviceName} ${event.eventType} - ${event.status} (${event.responseTime}ms)`);
    });
  }

  /**
   * Example: Resolving alerts
   */
  async resolveAlerts(): Promise<void> {
    console.log('Resolving active alerts...');
    
    const alerts = await this.integrationService.getActiveAlerts();
    
    for (const alert of alerts) {
      console.log(`Resolving alert: ${alert.id} - ${alert.message}`);
      await this.integrationService.resolveAlert(alert.id, 'admin_user');
    }

    console.log(`Resolved ${alerts.length} alerts`);
  }

  /**
   * Example: Monitoring service health over time
   */
  async monitorServiceHealth(): Promise<void> {
    console.log('Starting service health monitoring...');
    
    // Simulate monitoring for 30 seconds
    const monitoringDuration = 30000; // 30 seconds
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();

    const monitor = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= monitoringDuration) {
        clearInterval(monitor);
        console.log('Service health monitoring completed');
        return;
      }

      const stats = await this.integrationService.getIntegrationStats();
      const alerts = await this.integrationService.getActiveAlerts();
      
      console.log(`[${new Date().toISOString()}] Health Check:`);
      console.log(`  Services: ${stats.healthyServices}/${stats.totalServices} healthy`);
      console.log(`  Active Alerts: ${stats.activeAlerts}`);
      console.log(`  Avg Response Time: ${Math.round(stats.averageResponseTime)}ms`);
      
      if (alerts.length > 0) {
        console.log('  🚨 Active Alerts:');
        alerts.forEach(alert => {
          console.log(`    - ${alert.serviceName}: ${alert.alertType} (${alert.severity})`);
        });
      }
    }, checkInterval);
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    console.log('=== Integration Monitoring Service Examples ===\n');

    try {
      // Record events
      await this.recordSuccessfulWebhook();
      await this.recordFailedWebhook();
      
      // Simulate high error rate
      await this.simulateHighErrorRate();
      
      // Request reprocessing
      await this.requestManualReprocessing();
      
      // Get dashboard data
      await this.getDashboardData();
      
      // Resolve alerts
      await this.resolveAlerts();
      
      // Monitor health (this will run for 30 seconds)
      await this.monitorServiceHealth();
      
      console.log('\n=== All examples completed successfully ===');
      
    } catch (error) {
      console.error('Error running examples:', error);
    }
  }
}

/**
 * Example webhook simulation for testing
 */
export class WebhookSimulator {
  private integrationService: IntegrationMonitoringService;

  constructor(pool: Pool) {
    this.integrationService = new IntegrationMonitoringService(pool);
  }

  /**
   * Simulate realistic webhook traffic patterns
   */
  async simulateWebhookTraffic(durationMinutes: number = 5): Promise<void> {
    console.log(`Starting webhook traffic simulation for ${durationMinutes} minutes...`);
    
    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    let eventCount = 0;

    while (Date.now() < endTime) {
      // Random delay between webhooks (1-10 seconds)
      const delay = Math.random() * 9000 + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Random event type
      const eventTypes = ['colaborador.admitido', 'colaborador.transferido', 'colaborador.desligado'];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      // Random success/failure (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      // Random response time (100ms - 3000ms)
      const responseTime = Math.random() * 2900 + 100;

      const correlationId = `sim_${Date.now()}_${eventCount}`;
      
      try {
        await this.integrationService.recordIntegrationEvent(
          'rh_legado_webhook',
          'webhook_processed',
          isSuccess ? 'success' : 'failure',
          responseTime,
          {
            eventType,
            colaboradorId: `col_sim_${eventCount}`,
            simulation: true
          },
          isSuccess ? undefined : 'Simulated error for testing',
          correlationId
        );

        eventCount++;
        
        if (eventCount % 10 === 0) {
          console.log(`Processed ${eventCount} simulated webhook events...`);
        }

      } catch (error) {
        console.error('Error in webhook simulation:', error);
      }
    }

    console.log(`Webhook simulation completed. Processed ${eventCount} events.`);
  }

  /**
   * Simulate service degradation and recovery
   */
  async simulateServiceDegradation(): Promise<void> {
    console.log('Simulating service degradation and recovery...');

    // Phase 1: Normal operation (30 seconds)
    console.log('Phase 1: Normal operation');
    for (let i = 0; i < 10; i++) {
      await this.integrationService.recordIntegrationEvent(
        'platform_notifications',
        'webhook_processed',
        'success',
        Math.random() * 500 + 200, // 200-700ms
        { phase: 'normal', event: i },
        undefined,
        `normal_${i}`
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Phase 2: Service degradation (60 seconds)
    console.log('Phase 2: Service degradation');
    for (let i = 0; i < 20; i++) {
      const isSuccess = Math.random() > 0.3; // 70% success rate
      await this.integrationService.recordIntegrationEvent(
        'platform_notifications',
        'webhook_processed',
        isSuccess ? 'success' : 'failure',
        Math.random() * 3000 + 1000, // 1-4 seconds
        { phase: 'degraded', event: i },
        isSuccess ? undefined : 'Service degradation - high latency',
        `degraded_${i}`
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Phase 3: Service recovery (30 seconds)
    console.log('Phase 3: Service recovery');
    for (let i = 0; i < 10; i++) {
      await this.integrationService.recordIntegrationEvent(
        'platform_notifications',
        'webhook_processed',
        'success',
        Math.random() * 400 + 150, // 150-550ms
        { phase: 'recovery', event: i },
        undefined,
        `recovery_${i}`
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Service degradation simulation completed');
  }
}

// Usage example:
// const pool = new Pool({ /* database config */ });
// const example = new IntegrationMonitoringExample(pool);
// await example.runAllExamples();
//
// const simulator = new WebhookSimulator(pool);
// await simulator.simulateWebhookTraffic(5); // 5 minutes of traffic
// await simulator.simulateServiceDegradation();