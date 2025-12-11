-- PostgreSQL initialization script for Sistema Quadro Lotação
-- This script runs when the PostgreSQL container starts for the first time

-- Create additional databases for testing
CREATE DATABASE sistema_quadro_lotacao_test;

-- Create extensions
\c sistema_quadro_lotacao;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

\c sistema_quadro_lotacao_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create application user with limited privileges
CREATE USER quadro_app WITH PASSWORD 'quadro_app_password';

-- Grant privileges to application user
\c sistema_quadro_lotacao;
GRANT CONNECT ON DATABASE sistema_quadro_lotacao TO quadro_app;
GRANT USAGE ON SCHEMA public TO quadro_app;
GRANT CREATE ON SCHEMA public TO quadro_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO quadro_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO quadro_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO quadro_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO quadro_app;

\c sistema_quadro_lotacao_test;
GRANT CONNECT ON DATABASE sistema_quadro_lotacao_test TO quadro_app;
GRANT USAGE ON SCHEMA public TO quadro_app;
GRANT CREATE ON SCHEMA public TO quadro_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO quadro_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO quadro_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO quadro_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO quadro_app;

-- Configure PostgreSQL settings for better performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();