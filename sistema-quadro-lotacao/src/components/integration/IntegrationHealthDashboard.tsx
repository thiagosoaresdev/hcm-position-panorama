import React, { useState, useEffect } from 'react';
import './IntegrationHealthDashboard.css';

interface IntegrationStatus {
  id: string;
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastSuccessfulCall: string | null;
  lastFailedCall: string | null;
  consecutiveFailures: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  lastError?: string;
  updatedAt: string;
}

interface IntegrationEvent {
  id: string;
  serviceName: string;
  eventType: string;
  status: 'success' | 'failure' | 'timeout' | 'retry';
  responseTime: number;
  error?: string;
  timestamp: string;
  correlationId?: string;
}

interface IntegrationAlert {
  id: string;
  serviceName: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  createdAt: string;
}

interface IntegrationStats {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  activeAlerts: number;
  averageResponseTime: number;
}

interface DashboardData {
  statuses: IntegrationStatus[];
  stats: IntegrationStats;
  alerts: IntegrationAlert[];
  recentEvents: IntegrationEvent[];
  timestamp: string;
}

export const IntegrationHealthDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/integration/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/integration/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Refresh dashboard data
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  // Request reprocessing
  const requestReprocessing = async (eventId: string) => {
    try {
      const response = await fetch(`/api/integration/events/${eventId}/reprocess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ maxAttempts: 3 })
      });
      
      if (response.ok) {
        alert('Reprocessing request submitted successfully');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error requesting reprocessing:', err);
      alert('Failed to submit reprocessing request');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'degraded': return '#ffc107';
      case 'unhealthy': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="integration-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading integration dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="integration-dashboard">
        <div className="error-container">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="integration-dashboard">No data available</div>;
  }

  return (
    <div className="integration-dashboard">
      <div className="dashboard-header">
        <h2>Integration Health Dashboard</h2>
        <div className="dashboard-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (30s)
          </label>
          <button onClick={fetchDashboardData} className="btn btn-secondary">
            Refresh Now
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Services</h3>
          <div className="stat-value">{dashboardData.stats.totalServices}</div>
          <div className="stat-breakdown">
            <span className="healthy">{dashboardData.stats.healthyServices} healthy</span>
            <span className="degraded">{dashboardData.stats.degradedServices} degraded</span>
            <span className="unhealthy">{dashboardData.stats.unhealthyServices} unhealthy</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Events (24h)</h3>
          <div className="stat-value">{dashboardData.stats.totalEvents}</div>
          <div className="stat-breakdown">
            <span className="success">{dashboardData.stats.successfulEvents} success</span>
            <span className="failure">{dashboardData.stats.failedEvents} failed</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Active Alerts</h3>
          <div className="stat-value alert-count">{dashboardData.stats.activeAlerts}</div>
        </div>

        <div className="stat-card">
          <h3>Avg Response</h3>
          <div className="stat-value">{Math.round(dashboardData.stats.averageResponseTime)}ms</div>
        </div>
      </div>

      {/* Active Alerts */}
      {dashboardData.alerts.length > 0 && (
        <div className="alerts-section">
          <h3>Active Alerts</h3>
          <div className="alerts-list">
            {dashboardData.alerts.map(alert => (
              <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
                <div className="alert-header">
                  <span className="alert-service">{alert.serviceName}</span>
                  <span 
                    className="alert-severity"
                    style={{ backgroundColor: getSeverityColor(alert.severity) }}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-details">
                  <span>Threshold: {alert.threshold}</span>
                  <span>Current: {alert.currentValue}</span>
                  <span>Created: {formatDuration(alert.createdAt)}</span>
                </div>
                <div className="alert-actions">
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    className="btn btn-sm btn-success"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Status */}
      <div className="services-section">
        <h3>Service Status</h3>
        <div className="services-grid">
          {dashboardData.statuses.map(status => (
            <div 
              key={status.id} 
              className={`service-card ${selectedService === status.serviceName ? 'selected' : ''}`}
              onClick={() => setSelectedService(
                selectedService === status.serviceName ? null : status.serviceName
              )}
            >
              <div className="service-header">
                <h4>{status.serviceName}</h4>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(status.status) }}
                  title={status.status}
                ></div>
              </div>
              
              <div className="service-metrics">
                <div className="metric">
                  <span className="metric-label">Success Rate</span>
                  <span className="metric-value">
                    {status.totalCalls > 0 
                      ? Math.round((status.successfulCalls / status.totalCalls) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Avg Response</span>
                  <span className="metric-value">{Math.round(status.averageResponseTime)}ms</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Total Calls</span>
                  <span className="metric-value">{status.totalCalls}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Failures</span>
                  <span className="metric-value">{status.consecutiveFailures}</span>
                </div>
              </div>

              {status.lastSuccessfulCall && (
                <div className="service-timing">
                  <span>Last Success: {formatDuration(status.lastSuccessfulCall)}</span>
                </div>
              )}

              {status.lastError && (
                <div className="service-error">
                  <span>Last Error: {status.lastError}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="events-section">
        <h3>Recent Events</h3>
        <div className="events-table">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Event Type</th>
                <th>Status</th>
                <th>Response Time</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentEvents.map(event => (
                <tr key={event.id} className={`event-row status-${event.status}`}>
                  <td>{event.serviceName}</td>
                  <td>{event.eventType}</td>
                  <td>
                    <span className={`status-badge status-${event.status}`}>
                      {event.status}
                    </span>
                  </td>
                  <td>{event.responseTime}ms</td>
                  <td>{formatTimestamp(event.timestamp)}</td>
                  <td>
                    {event.status === 'failure' && (
                      <button 
                        onClick={() => requestReprocessing(event.id)}
                        className="btn btn-sm btn-warning"
                        title="Request manual reprocessing"
                      >
                        Reprocess
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-footer">
        <p>Last updated: {formatTimestamp(dashboardData.timestamp)}</p>
      </div>
    </div>
  );
};