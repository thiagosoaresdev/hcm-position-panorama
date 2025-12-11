# Production Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the Sistema de Gestão de Quadro de Lotação to production environments using Docker containers and Kubernetes.

## Prerequisites

### Required Tools
- Docker 20.10+
- Kubernetes 1.24+
- kubectl configured with production cluster access
- Helm 3.0+ (optional, for package management)
- OpenSSL (for SSL certificate generation)

### Infrastructure Requirements
- Kubernetes cluster with at least 3 worker nodes
- Minimum 8 CPU cores and 16GB RAM available
- Persistent storage with SSD performance
- Load balancer with SSL termination support
- Container registry access

## Architecture Overview

```
Internet → Load Balancer → Ingress Controller → Services → Pods
                                              ↓
                                         PostgreSQL + Redis
```

### Components
- **Frontend**: React SPA served by Nginx
- **Backend**: Node.js API server
- **Database**: PostgreSQL 15 with persistent storage
- **Cache**: Redis 7 with persistence
- **Ingress**: Nginx Ingress Controller with SSL/TLS
- **Monitoring**: Prometheus + Grafana (optional)

## Environment Configuration

### 1. Environment Variables

The application uses environment-specific configuration files:

- `.env.production` - Production settings
- `.env.staging` - Staging settings
- `.env.example` - Template with all variables

### 2. Kubernetes Secrets

Create the following secrets before deployment:

```bash
# Database credentials
kubectl create secret generic sistema-quadro-lotacao-secrets \
  --from-literal=DATABASE_USER=postgres \
  --from-literal=DATABASE_PASSWORD=your_secure_password \
  --from-literal=REDIS_PASSWORD=your_redis_password \
  --from-literal=JWT_SECRET=your_jwt_secret \
  --from-literal=PLATFORM_CLIENT_SECRET=your_platform_secret \
  --from-literal=RH_LEGADO_WEBHOOK_SECRET=your_webhook_secret \
  -n sistema-quadro-lotacao
```

### 3. SSL/TLS Certificates

#### Option A: Let's Encrypt (Recommended)
The deployment includes cert-manager configuration for automatic SSL certificates:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# The ClusterIssuer is included in k8s/ingress.yaml
```

#### Option B: Custom Certificates
Generate certificates using the provided script:

```bash
# Linux/Mac
./scripts/generate-ssl-certs.sh quadro-lotacao.senior.com.br

# Windows
scripts\generate-ssl-certs.bat quadro-lotacao.senior.com.br
```

Then create the TLS secret:

```bash
kubectl create secret tls sistema-quadro-lotacao-tls \
  --cert=ssl-certs/cert.pem \
  --key=ssl-certs/key.pem \
  -n sistema-quadro-lotacao
```

## Deployment Process

### 1. Automated Deployment

Use the provided deployment script:

```bash
# Linux/Mac
./scripts/deploy-production.sh [image_tag]

# Windows
scripts\deploy-production.bat [image_tag]
```

### 2. Manual Deployment

#### Step 1: Build and Push Images

```bash
# Build frontend
docker build -f Dockerfile.frontend -t your-registry.com/sistema-quadro-lotacao/frontend:v1.0.0 .
docker push your-registry.com/sistema-quadro-lotacao/frontend:v1.0.0

# Build backend
docker build -f Dockerfile.backend -t your-registry.com/sistema-quadro-lotacao/backend:v1.0.0 .
docker push your-registry.com/sistema-quadro-lotacao/backend:v1.0.0
```

#### Step 2: Deploy Infrastructure

```bash
# Create namespace and apply resource quotas
kubectl apply -f k8s/namespace.yaml

# Apply configuration
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml  # After creating secrets manually

# Deploy databases
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n sistema-quadro-lotacao --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n sistema-quadro-lotacao --timeout=300s
```

#### Step 3: Deploy Application

```bash
# Deploy backend
kubectl apply -f k8s/backend.yaml

# Wait for backend to be ready
kubectl wait --for=condition=ready pod -l app=backend -n sistema-quadro-lotacao --timeout=300s

# Deploy frontend
kubectl apply -f k8s/frontend.yaml

# Apply ingress and security policies
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/security-policies.yaml
```

#### Step 4: Apply Monitoring (Optional)

```bash
kubectl apply -f k8s/monitoring.yaml
```

## Security Configuration

### 1. Network Policies
The deployment includes network policies that:
- Restrict ingress to necessary ports only
- Allow internal communication between pods
- Block unauthorized external access

### 2. Pod Security Policies
- Run containers as non-root users
- Disable privilege escalation
- Use read-only root filesystems
- Drop all capabilities except necessary ones

### 3. RBAC
- Minimal service account permissions
- Role-based access control for Kubernetes resources

### 4. Security Headers
The Nginx configuration includes comprehensive security headers:
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection

## Performance Optimization

### 1. Resource Limits
Each component has defined resource requests and limits:

- **Frontend**: 128Mi-512Mi RAM, 100m-500m CPU
- **Backend**: 512Mi-2Gi RAM, 250m-1 CPU
- **PostgreSQL**: 512Mi-2Gi RAM, 250m-1 CPU
- **Redis**: 256Mi-1Gi RAM, 100m-500m CPU

### 2. Horizontal Pod Autoscaling
- Backend: 3-10 replicas based on CPU/memory usage
- Frontend: 2-5 replicas based on CPU/memory usage

### 3. Caching Strategy
- Redis for session storage and API caching
- Nginx static file caching with proper headers
- Database connection pooling

## Monitoring and Observability

### 1. Health Checks
All components include:
- Liveness probes for automatic restart
- Readiness probes for traffic routing
- Startup probes for slow-starting containers

### 2. Metrics Collection
- Application metrics via Prometheus
- Infrastructure metrics via node-exporter
- Custom business metrics

### 3. Logging
- Structured JSON logging
- Centralized log aggregation
- Log retention policies

### 4. Alerting Rules
Pre-configured alerts for:
- High error rates
- High response times
- Database connection issues
- Pod crash loops

## Backup and Recovery

### 1. Database Backups
```bash
# Create backup job
kubectl create job --from=cronjob/postgres-backup postgres-backup-manual -n sistema-quadro-lotacao

# Restore from backup
kubectl exec -it postgres-pod -n sistema-quadro-lotacao -- pg_restore -U postgres -d sistema_quadro_lotacao /backups/backup.sql
```

### 2. Configuration Backups
```bash
# Backup all configurations
kubectl get all,configmap,secret,pvc -n sistema-quadro-lotacao -o yaml > backup-$(date +%Y%m%d).yaml
```

## Troubleshooting

### Common Issues

#### 1. Pod Startup Failures
```bash
# Check pod logs
kubectl logs -f deployment/backend -n sistema-quadro-lotacao

# Check events
kubectl get events -n sistema-quadro-lotacao --sort-by='.lastTimestamp'
```

#### 2. Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it deployment/backend -n sistema-quadro-lotacao -- node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
"
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
kubectl describe certificate sistema-quadro-lotacao-tls-cert -n sistema-quadro-lotacao

# Check cert-manager logs
kubectl logs -f deployment/cert-manager -n cert-manager
```

### Performance Issues

#### 1. High Memory Usage
```bash
# Check memory usage
kubectl top pods -n sistema-quadro-lotacao

# Scale up if needed
kubectl scale deployment backend --replicas=5 -n sistema-quadro-lotacao
```

#### 2. Database Performance
```bash
# Check database performance
kubectl exec -it postgres-pod -n sistema-quadro-lotacao -- psql -U postgres -d sistema_quadro_lotacao -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
"
```

## Rollback Procedures

### 1. Application Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/backend -n sistema-quadro-lotacao
kubectl rollout undo deployment/frontend -n sistema-quadro-lotacao

# Check rollout status
kubectl rollout status deployment/backend -n sistema-quadro-lotacao
```

### 2. Database Rollback
```bash
# Restore from backup (if needed)
kubectl exec -it postgres-pod -n sistema-quadro-lotacao -- pg_restore -U postgres -d sistema_quadro_lotacao /backups/pre-deployment-backup.sql
```

## Maintenance

### 1. Regular Updates
- Update base images monthly
- Apply security patches immediately
- Update dependencies quarterly

### 2. Certificate Renewal
- Let's Encrypt certificates auto-renew
- Monitor certificate expiration dates
- Test certificate renewal process

### 3. Database Maintenance
- Regular VACUUM and ANALYZE operations
- Monitor disk usage and performance
- Update statistics and optimize queries

## Support Contacts

- **Technical Lead**: [email]
- **DevOps Engineer**: [email]
- **Database Administrator**: [email]
- **Security Team**: [email]

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Senior Platform APIs](https://api.senior.com.br/docs)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)