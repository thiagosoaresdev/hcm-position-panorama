# Integration Monitoring System

## Overview

The Integration Monitoring System provides comprehensive monitoring, error logging, and manual reprocessing capabilities for all external integrations, particularly the RH Legado webhook system. This system addresses requirements 10.3, 10.4, and 10.5 from the specification.

## Requirements Addressed

- **10.3**: Integration status monitoring - Track transfer events and system health
- **10.4**: Error logging and alerting system - Comprehensive error tracking with notifications
- **10.5**: Manual reprocessing capabilities - Retry failed events with exponential backoff

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Integration Monitoring System                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Event Recording │  │ Status Tracking │  │ Alert Management│ │
│  │                 │  │                 │  │                 │ │
│  │ • Webhook Events│  │ • Service Health│  │ • Threshold     │ │
│  │ • API Calls     │  │ • Response Times│  │   Monitoring    │ │
│  │ • Failures      │  │ • Success Rates │  │ • Notifications │ │
│  │ • Retries       │  │ • Error Counts  │  │ • Resolution    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Reprocessing    │  │ Health Dashboard│  │ Audit Trail     │ │
│  │                 │  │                 │  │                 │ │
│  │ • Manual Retry  │  │ • Real-time     │  │ • Complete      │ │
│  │ • Queue Mgmt    │  │   Status        │  │   History       │ │
│  │ • Backoff Logic │  │ • Statistics    │  │ • Traceability  │ │
│  │ • User Requests │  │ • Visual Alerts │  │ • Compliance    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. IntegrationMonitoringService

**Purpose**: Central service for tracking integration health and events

**Key Features**:
- Real-time event recording
- Service status tracking
- Alert generation and management
- Manual reprocessing requests
- Health statistics calculation

**Methods**:
```typescript
// Record integration events
recordIntegrationEvent(serviceName, eventType, status, responseTime, payload?, error?, correlationId?)

// Request manual reprocessing
requestReprocessing(eventId, requestedBy, maxAttempts)

// Get service status and statistics
getIntegrationStatuses()
getIntegrationStats()
getActiveAlerts()
getRecentEvents()

// Alert management
resolveAlert(alertId, resolvedBy)
```

### 2. IntegrationMonitoringController

**Purpose**: REST API endpoints for integration monitoring dashboard

**Endpoints**:
- `GET /api/integration/dashboard` - Complete dashboard data
- `GET /api/integration/services/:serviceName/status` - Service-specific status
- `GET /api/integration/events` - Event history with filtering
- `POST /api/integration/events/:eventId/reprocess` - Manual reprocessing
- `GET /api/integration/alerts` - Active alerts
- `POST /api/integration/alerts/:alertId/resolve` - Resolve alerts
- `GET /api/integration/stats` - Integration statistics
- `GET /api/integration/health` - Service health check

### 3. IntegrationHealthDashboard (React Component)

**Purpose**: Real-time dashboard for monitoring integration health

**Features**:
- Service status overview
- Real-time statistics
- Active alerts management
- Recent events timeline
- Manual reprocessing interface
- Auto-refresh capabilities

### 4. Enhanced WebhookController

**Purpose**: Webhook processing with integrated monitoring

**Enhancements**:
- Automatic event recording
- Response time tracking
- Error logging with correlation IDs
- Integration with monitoring service

## Database Schema

### integration_status
Tracks overall health status of each integrated service.

```sql
CREATE TABLE integration_status (
  id VARCHAR(50) PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL, -- healthy, degraded, unhealthy, unknown
  last_successful_call TIMESTAMP,
  last_failed_call TIMESTAMP,
  consecutive_failures INTEGER DEFAULT 0,
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  average_response_time NUMERIC(10,2) DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### integration_events
Logs all integration events with complete details.

```sql
CREATE TABLE integration_events (
  id VARCHAR(50) PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- webhook_received, webhook_processed, etc.
  status VARCHAR(20) NOT NULL, -- success, failure, timeout, retry
  payload JSONB,
  response_time INTEGER NOT NULL,
  error TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  correlation_id VARCHAR(100)
);
```

### integration_alerts
Tracks alerts for integration issues.

```sql
CREATE TABLE integration_alerts (
  id VARCHAR(50) PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- service_down, high_error_rate, etc.
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  message TEXT NOT NULL,
  threshold NUMERIC(10,2) NOT NULL,
  current_value NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);
```

### reprocessing_requests
Tracks manual reprocessing requests.

```sql
CREATE TABLE reprocessing_requests (
  id VARCHAR(50) PRIMARY KEY,
  original_event_id VARCHAR(50) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  payload JSONB,
  status VARCHAR(20) NOT NULL, -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  requested_by VARCHAR(100) NOT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  error TEXT
);
```

## Monitoring Thresholds

### Service Health Indicators

**Healthy**:
- Error rate < 10%
- Average response time < 5 seconds
- No consecutive failures
- Recent successful calls

**Degraded**:
- Error rate 10-25%
- Average response time 5-10 seconds
- Some consecutive failures
- Intermittent issues

**Unhealthy**:
- Error rate > 25%
- Average response time > 10 seconds
- 5+ consecutive failures
- No successful calls in 5+ minutes

### Alert Thresholds

**Service Down**: 5+ consecutive failures OR no successful calls in 5 minutes
**High Error Rate**: Error rate > 10% over recent events
**Slow Response**: Average response time > 5 seconds
**Consecutive Failures**: 5+ consecutive failures

## Alert Management

### Alert Types

1. **Service Down** (Critical)
   - Service completely unavailable
   - Immediate notification required
   - Escalation to on-call team

2. **High Error Rate** (High)
   - Error rate exceeds threshold
   - Indicates service degradation
   - Requires investigation

3. **Slow Response** (Medium)
   - Response times above threshold
   - Performance degradation
   - Monitor for escalation

4. **Consecutive Failures** (High)
   - Multiple failures in sequence
   - Potential service instability
   - Requires attention

### Alert Resolution

Alerts can be resolved:
- **Automatically**: When conditions improve
- **Manually**: By administrators through dashboard
- **Time-based**: After configured duration

## Manual Reprocessing

### Process Flow

1. **Request Creation**
   - User identifies failed event
   - Submits reprocessing request
   - System validates event exists

2. **Queue Management**
   - Request added to processing queue
   - Exponential backoff applied
   - Maximum attempts configured

3. **Execution**
   - Background service processes request
   - Original payload resubmitted
   - Results tracked and logged

4. **Completion**
   - Success/failure recorded
   - User notified of outcome
   - Audit trail updated

### Exponential Backoff

```typescript
const delay = Math.min(
  baseDelay * Math.pow(2, attempt - 1),
  maxDelay
);
```

**Default Configuration**:
- Base delay: 1 second
- Maximum delay: 10 seconds
- Maximum attempts: 3

## Dashboard Features

### Real-time Statistics
- Total services monitored
- Health distribution (healthy/degraded/unhealthy)
- Event counts (success/failure)
- Average response times
- Active alert count

### Service Status Grid
- Visual health indicators
- Key metrics per service
- Last success/failure times
- Error details

### Event Timeline
- Recent integration events
- Filterable by service/status
- Response time tracking
- Reprocessing actions

### Alert Management
- Active alerts display
- Severity-based coloring
- One-click resolution
- Alert history

### Auto-refresh
- Configurable refresh intervals
- Real-time updates
- Manual refresh option
- Connection status indicator

## Integration with Existing Systems

### Webhook Controller Enhancement

The existing WebhookController has been enhanced to automatically record integration events:

```typescript
// Before processing
await this.integrationMonitoring.recordIntegrationEvent(
  'rh_legado_webhook',
  'webhook_received',
  'success',
  0,
  payload,
  undefined,
  correlationId
);

// After processing (success)
await this.integrationMonitoring.recordIntegrationEvent(
  'rh_legado_webhook',
  'webhook_processed',
  'success',
  responseTime,
  payload,
  undefined,
  correlationId
);

// After processing (failure)
await this.integrationMonitoring.recordIntegrationEvent(
  'rh_legado_webhook',
  'webhook_processed',
  'failure',
  responseTime,
  payload,
  errorMessage,
  correlationId
);
```

### Audit Service Integration

All monitoring events are logged to the audit trail:

```typescript
await this.auditService.logAction(
  eventId,
  'integration_event',
  `integration_${eventType}`,
  'sistema',
  'Integration Monitoring',
  `Integration event recorded: ${eventType} - ${status}`,
  undefined,
  { event }
);
```

### Notification Service Integration

Alerts trigger notifications through the existing notification system:

```typescript
await this.notificationService.sendNotification({
  templateId: 'integration_alert',
  recipientId: 'admin_team',
  templateVars: {
    serviceName: alert.serviceName,
    alertType: alert.alertType,
    severity: alert.severity,
    message: alert.message
  },
  priority: alert.severity === 'critical' ? 'urgent' : 'high',
  channels: ['email', 'inapp']
});
```

## Usage Examples

### Recording Events

```typescript
// Record successful webhook processing
await integrationService.recordIntegrationEvent(
  'rh_legado_webhook',
  'webhook_processed',
  'success',
  1250, // 1.25 seconds
  { colaboradorId: 'col_001' },
  undefined,
  'webhook_12345'
);

// Record failed API call
await integrationService.recordIntegrationEvent(
  'platform_auth',
  'api_call',
  'failure',
  5000, // 5 seconds timeout
  { endpoint: '/oauth/token' },
  'Connection timeout',
  'api_67890'
);
```

### Manual Reprocessing

```typescript
// Request reprocessing of failed event
const requestId = await integrationService.requestReprocessing(
  'event_123',
  'admin_user',
  3 // max attempts
);

console.log(`Reprocessing request created: ${requestId}`);
```

### Dashboard Data

```typescript
// Get complete dashboard data
const dashboardData = await fetch('/api/integration/dashboard');
const { statuses, stats, alerts, recentEvents } = await dashboardData.json();

// Display service health
statuses.forEach(status => {
  console.log(`${status.serviceName}: ${status.status}`);
});
```

## Monitoring Best Practices

### Event Recording
- Record all integration attempts
- Include correlation IDs for tracing
- Capture response times accurately
- Log meaningful error messages

### Alert Management
- Set appropriate thresholds
- Avoid alert fatigue
- Provide actionable information
- Implement escalation procedures

### Dashboard Usage
- Monitor regularly during business hours
- Set up automated notifications
- Review trends and patterns
- Act on alerts promptly

### Reprocessing
- Investigate root cause before reprocessing
- Use appropriate retry limits
- Monitor reprocessing success rates
- Document recurring issues

## Performance Considerations

### Database Optimization
- Indexed queries for fast lookups
- Partitioned tables for large datasets
- Regular cleanup of old events
- Connection pooling

### Memory Management
- Limited in-memory caching
- Periodic cleanup of completed jobs
- Efficient data structures
- Garbage collection optimization

### Network Efficiency
- Batch operations where possible
- Compression for large payloads
- Connection reuse
- Timeout configurations

## Security Considerations

### Access Control
- Role-based dashboard access
- API endpoint authentication
- Audit trail for all actions
- Secure credential storage

### Data Protection
- Sensitive data masking
- Encrypted storage
- Secure transmission
- Retention policies

### Monitoring Security
- Failed authentication tracking
- Suspicious activity detection
- Rate limiting
- Security event logging

## Deployment

### Environment Variables
```bash
# Integration monitoring configuration
INTEGRATION_MONITORING_ENABLED=true
INTEGRATION_HEALTH_CHECK_INTERVAL=30000
INTEGRATION_CONSECUTIVE_FAILURE_THRESHOLD=5
INTEGRATION_ERROR_RATE_THRESHOLD=0.1
INTEGRATION_RESPONSE_TIME_THRESHOLD=5000
INTEGRATION_SERVICE_DOWN_THRESHOLD=300000

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quadro_lotacao
DB_USER=postgres
DB_PASSWORD=postgres
```

### Database Migration
```bash
# Run the integration monitoring migration
npm run db:migrate
```

### Service Startup
```typescript
// Initialize monitoring service
const integrationMonitoring = new IntegrationMonitoringService(pool);

// Start health checks
integrationMonitoring.start();
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check event cleanup configuration
   - Monitor in-memory cache size
   - Review retention policies

2. **Slow Dashboard Loading**
   - Optimize database queries
   - Implement pagination
   - Add appropriate indexes

3. **Missing Events**
   - Verify service integration
   - Check error logs
   - Validate database connectivity

4. **False Alerts**
   - Review threshold configuration
   - Analyze alert patterns
   - Adjust sensitivity settings

### Debug Mode

Enable debug logging:
```bash
DEBUG=integration:* npm start
```

### Health Checks

Monitor service health:
```bash
curl http://localhost:3000/api/integration/health
```

## Future Enhancements

### Planned Features
- Advanced analytics and reporting
- Machine learning for anomaly detection
- Integration with external monitoring tools
- Mobile dashboard application
- Automated remediation actions

### Scalability Improvements
- Distributed monitoring architecture
- Event streaming with Kafka
- Microservices decomposition
- Cloud-native deployment options

This comprehensive integration monitoring system provides the foundation for reliable, observable, and maintainable external integrations while meeting all specified requirements for monitoring, error handling, and manual reprocessing capabilities.