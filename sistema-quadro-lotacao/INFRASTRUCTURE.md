# Infrastructure Setup - Sistema Quadro Lotação

This document describes the database and core infrastructure setup for the Sistema de Gestão de Quadro de Lotação.

## Overview

The infrastructure consists of:
- **PostgreSQL 15** - Primary database with connection pooling
- **Redis 7** - Caching and session management
- **Database Migration System** - Version-controlled schema management
- **Environment Configuration** - Centralized configuration management
- **Health Monitoring** - System health checks and monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone and navigate to project:**
   ```bash
   cd sistema-quadro-lotacao
   ```

2. **Run setup script:**
   ```bash
   # Linux/macOS
   ./scripts/setup-dev.sh
   
   # Windows
   scripts\setup-dev.bat
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Manual Setup

If you prefer to set up manually:

### 1. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, pgAdmin, Redis Commander
docker-compose up -d

# Check service status
docker-compose ps
```

### 4. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Or reset everything
npm run db:reset
```

### 5. Verify Setup

```bash
# Run tests
npm test

# Check health
npm run health-check
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DATABASE_HOST` | Database host | localhost |
| `DATABASE_PORT` | Database port | 5432 |
| `DATABASE_NAME` | Database name | sistema_quadro_lotacao |
| `DATABASE_USER` | Database user | postgres |
| `DATABASE_PASSWORD` | Database password | - |
| `REDIS_URL` | Redis connection string | - |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `NODE_ENV` | Environment | development |
| `PORT` | Application port | 3000 |

### Platform APIs

| Variable | Description | Required |
|----------|-------------|----------|
| `PLATFORM_AUTH_URL` | Senior Platform Authentication API | ✅ |
| `PLATFORM_AUTHZ_URL` | Senior Platform Authorization API | ✅ |
| `PLATFORM_NOTIFICATIONS_URL` | Senior Platform Notifications API | ✅ |
| `PLATFORM_CLIENT_ID` | OAuth client ID | ✅ |
| `PLATFORM_CLIENT_SECRET` | OAuth client secret | ✅ |

## Database

### Connection Management

- **Connection Pooling**: 2-10 connections (configurable)
- **Connection Timeout**: 2 seconds
- **Idle Timeout**: 30 seconds
- **SSL Support**: Configurable via `DATABASE_SSL`

### Migration System

```bash
# Run pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate status

# Create new migration
# Add SQL file to src/core/database/migrations/
# Format: XXX_description.sql
```

### Schema Structure

- **Core Tables**: empresas, planos_vagas, centros_custo, postos_trabalho, cargos, quadro_lotacao, colaboradores
- **Workflow Tables**: propostas, aprovacoes
- **Audit Tables**: audit_logs, normalizacao_history, webhook_logs, notification_logs
- **Monitoring**: system_health

### Seeding

```bash
# Seed development data
npm run db:seed

# Clear all data
npm run db:seed clear

# Reset (clear + seed)
npm run db:seed reset

# Show statistics
npm run db:seed stats
```

## Redis

### Configuration

- **Memory Limit**: 256MB (configurable)
- **Eviction Policy**: allkeys-lru
- **Persistence**: AOF + RDB
- **Databases**: 16 (default Redis)

### Usage

```typescript
import { cacheService, sessionService } from './src/core/cache/redis.js';

// Cache data
await cacheService.set('key', data, 3600); // 1 hour TTL
const data = await cacheService.get('key');

// Session management
await sessionService.createSession('session-id', userData);
const userData = await sessionService.getSession('session-id');
```

## Health Monitoring

### Health Check Endpoints

The system includes comprehensive health monitoring:

```typescript
import { healthCheckService } from './src/core/health/health-check.js';

// Check all systems
const health = await healthCheckService.checkSystemHealth();

// Individual checks
const dbHealth = await healthCheckService.checkDatabase();
const redisHealth = await healthCheckService.checkRedis();
const envHealth = await healthCheckService.checkEnvironment();
const memHealth = await healthCheckService.checkMemory();
```

### Health Status

- **healthy**: All systems operational
- **warning**: Non-critical issues detected
- **error**: Critical issues requiring attention

## Services Access

### Development Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3000 | - |
| PostgreSQL | localhost:5432 | postgres/postgres |
| Redis | localhost:6379 | - |
| pgAdmin | http://localhost:5050 | admin@quadro-lotacao.com/admin123 |
| Redis Commander | http://localhost:8081 | admin/admin123 |

### Production Considerations

- Use managed database services (AWS RDS, Google Cloud SQL)
- Implement Redis clustering for high availability
- Set up proper monitoring and alerting
- Configure SSL/TLS for all connections
- Use secrets management for sensitive configuration

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   
   # Restart service
   docker-compose restart postgres
   ```

2. **Redis Connection Failed**
   ```bash
   # Check if Redis is running
   docker-compose ps redis
   
   # Test connection
   docker-compose exec redis redis-cli ping
   
   # Restart service
   docker-compose restart redis
   ```

3. **Migration Errors**
   ```bash
   # Check migration status
   npm run db:migrate status
   
   # Validate migrations
   npm run db:migrate validate
   
   # Reset if needed (CAUTION: destroys data)
   npm run db:reset
   ```

4. **Port Conflicts**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :5432
   
   # Change ports in docker-compose.yml
   # Update .env accordingly
   ```

### Logs

```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs postgres
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f
```

### Performance Monitoring

```bash
# Database statistics
docker-compose exec postgres psql -U postgres -d sistema_quadro_lotacao -c "SELECT * FROM pg_stat_database;"

# Redis statistics
docker-compose exec redis redis-cli info memory
```

## Development Workflow

1. **Start Development Environment**
   ```bash
   docker-compose up -d
   npm run dev
   ```

2. **Make Database Changes**
   ```bash
   # Create migration file
   # Add to src/core/database/migrations/
   
   # Run migration
   npm run db:migrate
   ```

3. **Update Seed Data**
   ```bash
   # Edit src/core/database/seeds/
   
   # Re-seed
   npm run db:seed reset
   ```

4. **Test Changes**
   ```bash
   npm test
   ```

5. **Stop Environment**
   ```bash
   docker-compose down
   ```

## Security

- Database connections use connection pooling with limits
- Redis is configured with memory limits and eviction policies
- Environment variables are validated on startup
- Audit logging is enabled for all data changes
- Health checks monitor system security status

## Backup & Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres sistema_quadro_lotacao > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres sistema_quadro_lotacao < backup.sql
```

### Redis Backup

```bash
# Redis automatically creates RDB snapshots
# AOF file provides point-in-time recovery
# Backup files are in docker volume: redis_data
```

## Monitoring

The infrastructure includes built-in monitoring:

- Database connection pool statistics
- Redis memory usage and performance
- Application memory usage
- Environment configuration validation
- System health status

For production, integrate with:
- Prometheus + Grafana
- New Relic / DataDog
- AWS CloudWatch
- Custom alerting systems