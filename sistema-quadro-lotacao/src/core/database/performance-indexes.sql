-- Performance Optimization Indexes for Sistema Quadro de Lotação
-- These indexes are designed to optimize the most common queries and improve response times

-- ============================================================================
-- QUADRO LOTAÇÃO INDEXES
-- ============================================================================

-- Primary lookup indexes for quadro_lotacao table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quadro_lotacao_plano_vagas 
ON quadro_lotacao (plano_vagas_id) WHERE ativo = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quadro_lotacao_posto_trabalho 
ON quadro_lotacao (posto_trabalho_id) WHERE ativo = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quadro_lotacao_cargo 
ON quadro_lotacao (cargo_id) WHERE ativo = true;

-- Composite index for uniqueness validation (most frequent query)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_quadro_lotacao_unique_combo 
ON quadro_lotacao (plano_vagas_id, posto_trabalho_id, cargo_id) 
WHERE ativo = true;

-- Performance index for occupancy calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quadro_lotacao_occupancy 
ON quadro_lotacao (plano_vagas_id, vagas_previstas, vagas_efetivas, vagas_reservadas) 
WHERE ativo = true;

-- Index for deficit queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quadro_lotacao_deficit 
ON quadro_lotacao (plano_vagas_id, vagas_efetivas, vagas_previstas) 
WHERE ativo = true AND vagas_efetivas > vagas_previstas;

-- Index for available positions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quadro_lotacao_available 
ON quadro_lotacao (plano_vagas_id) 
WHERE ativo = true AND (vagas_previstas - vagas_efetivas - vagas_reservadas) > 0;

-- ============================================================================
-- COLABORADOR INDEXES
-- ============================================================================

-- Primary lookup indexes for colaboradores
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaborador_empresa 
ON colaboradores (empresa_id) WHERE status = 'ativo';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaborador_centro_custo 
ON colaboradores (centro_custo_id) WHERE status = 'ativo';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaborador_cargo 
ON colaboradores (cargo_id) WHERE status = 'ativo';

-- PcD compliance index (critical for dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaborador_pcd 
ON colaboradores (empresa_id, pcd) WHERE status = 'ativo';

-- Composite index for PcD calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaborador_pcd_stats 
ON colaboradores (empresa_id, pcd, status, data_admissao);

-- Index for retention calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaborador_retention 
ON colaboradores (data_admissao, data_desligamento, status);

-- ============================================================================
-- PROPOSTA INDEXES
-- ============================================================================

-- Status-based indexes for workflow queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposta_status 
ON propostas (status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposta_solicitante 
ON propostas (solicitante_id, status, created_at DESC);

-- Index for pending proposals (dashboard alerts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposta_pending 
ON propostas (created_at) 
WHERE status IN ('nivel_1', 'nivel_2', 'nivel_3', 'rh');

-- Index for proposal analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposta_analytics 
ON propostas (tipo, status, created_at, updated_at);

-- ============================================================================
-- APROVACAO INDEXES
-- ============================================================================

-- Approval workflow indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aprovacao_proposta 
ON aprovacoes (proposta_id, nivel, acao);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aprovacao_aprovador 
ON aprovacoes (aprovador_id, acao, data_acao DESC);

-- ============================================================================
-- AUDIT LOG INDEXES
-- ============================================================================

-- Primary audit queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_entidade 
ON audit_logs (entidade_id, entidade_tipo, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_usuario 
ON audit_logs (usuario_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_timestamp 
ON audit_logs (timestamp DESC);

-- Recent activities index (dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_recent 
ON audit_logs (timestamp DESC, acao) 
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- ============================================================================
-- CENTRO CUSTO INDEXES
-- ============================================================================

-- Hierarchical queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_centro_custo_empresa 
ON centros_custo (empresa_id, hierarquia) WHERE ativo = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_centro_custo_codigo 
ON centros_custo (codigo, empresa_id) WHERE ativo = true;

-- ============================================================================
-- POSTO TRABALHO INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posto_trabalho_centro 
ON postos_trabalho (centro_custo_id) WHERE ativo = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posto_trabalho_codigo 
ON postos_trabalho (codigo, centro_custo_id) WHERE ativo = true;

-- ============================================================================
-- CARGO INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cargo_estrutura 
ON cargos (estrutura, classe, nivel) WHERE ativo = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cargo_nome 
ON cargos (nome) WHERE ativo = true;

-- ============================================================================
-- PLANO VAGAS INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plano_vagas_empresa 
ON planos_vagas (empresa_id, status, data_inicio DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plano_vagas_periodo 
ON planos_vagas (data_inicio, data_fim) WHERE status = 'ativo';

-- ============================================================================
-- PERFORMANCE STATISTICS AND MONITORING
-- ============================================================================

-- Create a view for monitoring index usage
CREATE OR REPLACE VIEW v_index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Create a view for monitoring table statistics
CREATE OR REPLACE VIEW v_table_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    CASE 
        WHEN n_live_tup = 0 THEN 0
        ELSE ROUND((n_dead_tup::float / n_live_tup::float) * 100, 2)
    END as dead_tuple_percentage,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY dead_tuple_percentage DESC;

-- ============================================================================
-- QUERY OPTIMIZATION HINTS
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE quadro_lotacao;
ANALYZE colaboradores;
ANALYZE propostas;
ANALYZE aprovacoes;
ANALYZE audit_logs;
ANALYZE centros_custo;
ANALYZE postos_trabalho;
ANALYZE cargos;
ANALYZE planos_vagas;

-- Set optimal PostgreSQL configuration parameters for performance
-- These should be added to postgresql.conf:

/*
# Memory Configuration
shared_buffers = 256MB                    # 25% of RAM for dedicated server
effective_cache_size = 1GB                # 75% of RAM
work_mem = 4MB                            # Per-operation memory
maintenance_work_mem = 64MB               # For maintenance operations

# Query Planner Configuration
random_page_cost = 1.1                    # SSD optimization
effective_io_concurrency = 200            # SSD optimization
default_statistics_target = 100           # Better statistics

# Connection and Performance
max_connections = 100                     # Adjust based on load
checkpoint_completion_target = 0.9        # Smooth checkpoints
wal_buffers = 16MB                        # WAL buffer size
checkpoint_timeout = 10min                # Checkpoint frequency

# Logging for Performance Monitoring
log_min_duration_statement = 1000         # Log slow queries (>1s)
log_checkpoints = on                      # Log checkpoint activity
log_connections = on                      # Log connections
log_disconnections = on                   # Log disconnections
log_lock_waits = on                       # Log lock waits
*/

-- ============================================================================
-- MAINTENANCE PROCEDURES
-- ============================================================================

-- Create a function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE quadro_lotacao;
    ANALYZE colaboradores;
    ANALYZE propostas;
    ANALYZE aprovacoes;
    ANALYZE audit_logs;
    ANALYZE centros_custo;
    ANALYZE postos_trabalho;
    ANALYZE cargos;
    ANALYZE planos_vagas;
    
    RAISE NOTICE 'Table statistics updated successfully';
END;
$$ LANGUAGE plpgsql;

-- Create a function to check index usage
CREATE OR REPLACE FUNCTION check_unused_indexes()
RETURNS TABLE(
    schema_name text,
    table_name text,
    index_name text,
    scans bigint,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::text,
        tablename::text,
        indexname::text,
        idx_scan,
        CASE 
            WHEN idx_scan = 0 THEN 'Consider dropping - never used'
            WHEN idx_scan < 10 THEN 'Low usage - monitor'
            ELSE 'Active index'
        END::text
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public'
    ORDER BY idx_scan ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to identify slow queries
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE(
    query text,
    calls bigint,
    total_time double precision,
    mean_time double precision,
    rows bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg_stat_statements.query,
        pg_stat_statements.calls,
        pg_stat_statements.total_time,
        pg_stat_statements.mean_time,
        pg_stat_statements.rows
    FROM pg_stat_statements 
    WHERE pg_stat_statements.mean_time > 100  -- Queries taking more than 100ms on average
    ORDER BY pg_stat_statements.mean_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Schedule regular maintenance (to be run by cron or application scheduler)
-- This should be called weekly:
-- SELECT update_table_statistics();
-- SELECT * FROM check_unused_indexes();
-- SELECT * FROM get_slow_queries();