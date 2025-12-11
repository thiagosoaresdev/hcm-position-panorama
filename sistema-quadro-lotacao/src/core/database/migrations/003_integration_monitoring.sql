-- Integration Monitoring Tables
-- Requirements: 10.3, 10.4, 10.5 - Integration monitoring, error logging, and reprocessing

-- Integration Status Table
-- Tracks the health status of each integrated service
CREATE TABLE integration_status (
  id VARCHAR(50) PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
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

-- Integration Events Table
-- Logs all integration events (webhooks, API calls, etc.)
CREATE TABLE integration_events (
  id VARCHAR(50) PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'timeout', 'retry')),
  payload JSONB,
  response_time INTEGER NOT NULL, -- in milliseconds
  error TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  correlation_id VARCHAR(100),
  
  -- Foreign key to integration_status
  CONSTRAINT fk_integration_events_service 
    FOREIGN KEY (service_name) 
    REFERENCES integration_status(service_name)
    ON DELETE CASCADE
);

-- Integration Alerts Table
-- Tracks alerts for integration issues
CREATE TABLE integration_alerts (
  id VARCHAR(50) PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('service_down', 'high_error_rate', 'slow_response', 'consecutive_failures')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  threshold NUMERIC(10,2) NOT NULL,
  current_value NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  
  -- Foreign key to integration_status
  CONSTRAINT fk_integration_alerts_service 
    FOREIGN KEY (service_name) 
    REFERENCES integration_status(service_name)
    ON DELETE CASCADE
);

-- Reprocessing Requests Table
-- Tracks manual reprocessing requests for failed events
CREATE TABLE reprocessing_requests (
  id VARCHAR(50) PRIMARY KEY,
  original_event_id VARCHAR(50) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  payload JSONB,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  requested_by VARCHAR(100) NOT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  error TEXT,
  
  -- Foreign keys
  CONSTRAINT fk_reprocessing_original_event 
    FOREIGN KEY (original_event_id) 
    REFERENCES integration_events(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reprocessing_service 
    FOREIGN KEY (service_name) 
    REFERENCES integration_status(service_name)
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_integration_events_service_timestamp ON integration_events(service_name, timestamp DESC);
CREATE INDEX idx_integration_events_status ON integration_events(status);
CREATE INDEX idx_integration_events_correlation ON integration_events(correlation_id);
CREATE INDEX idx_integration_events_timestamp ON integration_events(timestamp DESC);

CREATE INDEX idx_integration_alerts_service ON integration_alerts(service_name);
CREATE INDEX idx_integration_alerts_active ON integration_alerts(is_active);
CREATE INDEX idx_integration_alerts_severity ON integration_alerts(severity);
CREATE INDEX idx_integration_alerts_created ON integration_alerts(created_at DESC);

CREATE INDEX idx_reprocessing_status ON reprocessing_requests(status);
CREATE INDEX idx_reprocessing_service ON reprocessing_requests(service_name);
CREATE INDEX idx_reprocessing_requested ON reprocessing_requests(requested_at DESC);

-- Insert initial service statuses
INSERT INTO integration_status (id, service_name, status) VALUES
('status_rh_legado', 'rh_legado_webhook', 'unknown'),
('status_platform_auth', 'platform_auth', 'unknown'),
('status_platform_authz', 'platform_authz', 'unknown'),
('status_platform_notifications', 'platform_notifications', 'unknown');

-- Update trigger for integration_status
CREATE OR REPLACE FUNCTION update_integration_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integration_status_timestamp
  BEFORE UPDATE ON integration_status
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_status_timestamp();