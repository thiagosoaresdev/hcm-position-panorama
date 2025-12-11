-- V002: Audit Tables - Sistema de Gestão de Quadro de Lotação
-- Created: 2025-01-01
-- Description: Create audit tables for complete traceability

-- Create audit_logs table for complete audit trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidade_id VARCHAR(50) NOT NULL,
  entidade_tipo VARCHAR(50) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  usuario_id VARCHAR(50) NOT NULL,
  usuario_nome VARCHAR(200),
  motivo TEXT,
  valores_antes JSONB,
  valores_depois JSONB,
  aprovador_id VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  request_id VARCHAR(100)
);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_logs_entidade ON audit_logs(entidade_id, entidade_tipo);
CREATE INDEX idx_audit_logs_usuario ON audit_logs(usuario_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_acao ON audit_logs(acao);
CREATE INDEX idx_audit_logs_aprovador ON audit_logs(aprovador_id);
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id);

-- Create normalizacao_history table for tracking normalization processes
CREATE TABLE normalizacao_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plano_vagas_id VARCHAR(50) NOT NULL REFERENCES planos_vagas(id) ON DELETE CASCADE,
  usuario_id VARCHAR(50) NOT NULL,
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP,
  status VARCHAR(20) DEFAULT 'executando' CHECK (status IN ('executando', 'concluida', 'erro')),
  postos_processados INTEGER DEFAULT 0,
  alteracoes_realizadas INTEGER DEFAULT 0,
  erros_encontrados INTEGER DEFAULT 0,
  detalhes_erros JSONB,
  resumo_alteracoes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for normalizacao_history
CREATE INDEX idx_normalizacao_history_plano ON normalizacao_history(plano_vagas_id);
CREATE INDEX idx_normalizacao_history_usuario ON normalizacao_history(usuario_id);
CREATE INDEX idx_normalizacao_history_status ON normalizacao_history(status);
CREATE INDEX idx_normalizacao_history_data ON normalizacao_history(data_inicio);

-- Create webhook_logs table for tracking RH Legado integrations
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  signature VARCHAR(500),
  status VARCHAR(20) DEFAULT 'recebido' CHECK (status IN ('recebido', 'processado', 'erro', 'rejeitado')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for webhook_logs
CREATE INDEX idx_webhook_logs_type ON webhook_logs(webhook_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed_at);

-- Create notification_logs table for tracking sent notifications
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'inapp')),
  recipient VARCHAR(200) NOT NULL,
  template VARCHAR(100),
  template_vars JSONB,
  status VARCHAR(20) DEFAULT 'enviando' CHECK (status IN ('enviando', 'enviado', 'erro', 'rejeitado')),
  error_message TEXT,
  external_id VARCHAR(100),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification_logs
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at);

-- Create system_health table for monitoring
CREATE TABLE system_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'error')),
  message TEXT,
  metrics JSONB,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for system_health
CREATE INDEX idx_system_health_component ON system_health(component);
CREATE INDEX idx_system_health_status ON system_health(status);
CREATE INDEX idx_system_health_checked ON system_health(checked_at);

-- Create function to automatically log audit entries
CREATE OR REPLACE FUNCTION log_audit_entry()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id VARCHAR(50);
    audit_user_name VARCHAR(200);
    audit_motivo TEXT;
    audit_aprovador VARCHAR(50);
BEGIN
    -- Get audit context from session variables (set by application)
    audit_user_id := current_setting('audit.user_id', true);
    audit_user_name := current_setting('audit.user_name', true);
    audit_motivo := current_setting('audit.motivo', true);
    audit_aprovador := current_setting('audit.aprovador_id', true);
    
    -- Skip if no audit context is set
    IF audit_user_id IS NULL OR audit_user_id = '' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Insert audit log entry
    INSERT INTO audit_logs (
        entidade_id,
        entidade_tipo,
        acao,
        usuario_id,
        usuario_nome,
        motivo,
        valores_antes,
        valores_depois,
        aprovador_id
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
        END,
        audit_user_id,
        audit_user_name,
        audit_motivo,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE to_jsonb(NEW) END,
        audit_aprovador
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for main tables
CREATE TRIGGER audit_empresas AFTER INSERT OR UPDATE OR DELETE ON empresas FOR EACH ROW EXECUTE FUNCTION log_audit_entry();
CREATE TRIGGER audit_planos_vagas AFTER INSERT OR UPDATE OR DELETE ON planos_vagas FOR EACH ROW EXECUTE FUNCTION log_audit_entry();
CREATE TRIGGER audit_centros_custo AFTER INSERT OR UPDATE OR DELETE ON centros_custo FOR EACH ROW EXECUTE FUNCTION log_audit_entry();
CREATE TRIGGER audit_postos_trabalho AFTER INSERT OR UPDATE OR DELETE ON postos_trabalho FOR EACH ROW EXECUTE FUNCTION log_audit_entry();
CREATE TRIGGER audit_cargos AFTER INSERT OR UPDATE OR DELETE ON cargos FOR EACH ROW EXECUTE FUNCTION log_audit_entry();
CREATE TRIGGER audit_quadro_lotacao AFTER INSERT OR UPDATE OR DELETE ON quadro_lotacao FOR EACH ROW EXECUTE FUNCTION log_audit_entry();
CREATE TRIGGER audit_colaboradores AFTER INSERT OR UPDATE OR DELETE ON colaboradores FOR EACH ROW EXECUTE FUNCTION log_audit_entry();
CREATE TRIGGER audit_propostas AFTER INSERT OR UPDATE OR DELETE ON propostas FOR EACH ROW EXECUTE FUNCTION log_audit_entry();
CREATE TRIGGER audit_aprovacoes AFTER INSERT OR UPDATE OR DELETE ON aprovacoes FOR EACH ROW EXECUTE FUNCTION log_audit_entry();