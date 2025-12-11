# Kubernetes Deployment Configuration

This directory contains all Kubernetes manifests for deploying the Sistema de Gestão de Quadro de Lotação to production environments.

## File Structure

```
k8s/
├── namespace.yaml           # Namespace, ResourceQuota, and LimitRange
├── configmap.yaml          # Application configuration
├── secrets.yaml            # Sensitive configuration (template)
├── postgres.yaml           # PostgreSQL database deployment
├── redis.yaml              # Redis cache deployment
├── backend.yaml            # Backend API deployment
├── frontend.yaml           # Frontend (Nginx + React) deployment
├── ingress.yaml            # Ingress controller and SSL configuration
├── security-policies.yaml  # NetworkPolicy, PodSecurityPolicy, RBAC
├── monitoring.yaml         # Prometheus monitoring configuration
└── README.md               # This file
```

## Deployment Order

Deploy the manifests in the following order:

1. **Infrastructure Setup**
   ```bash
   kubectl apply -f namespace.yaml
   kubectl apply -f configmap.yaml
   kubectl apply -f secrets.yaml  # After creating actual secrets
   ```

2. **Database Layer**
   ```bash
   kubectl apply -f postgres.yaml
   kubectl apply -f redis.yaml
   ```

3. **Application Layer**
   ```bash
   kubectl apply -f backend.yaml
   kubectl apply -f frontend.yaml
   ```

4. **Network and Security**
   ```bash
   kubectl apply -f ingress.yaml
   kubectl apply -f security-policies.yaml
   ```

5. **Monitoring (Optional)**
   ```bash
   kubectl apply -f monitoring.yaml
   ```

## Configuration Details

### Namespace Configuration
- **Namespace**: `sistema-quadro-lotacao`
- **Resource Quota**: 4 CPU cores, 8GB RAM (requests), 8 CPU cores, 16GB RAM (limits)
- **Limit Range**: Default container limits to prevent resource abuse

### Database Configuration
- **PostgreSQL 15**: Primary database with persistent storage
- **Redis 7**: Cache and session storage
- **Persistent Volumes**: 20GB for PostgreSQL, 5GB for Redis
- **Health Checks**: Liveness and readiness probes
- **Backup**: Automated daily backups (separate CronJob)

### Application Configuration
- **Backend**: Node.js API with 3-10 replicas (HPA)
- **Frontend**: Nginx serving React SPA with 2-5 replicas (HPA)
- **Init Containers**: Database migrations run before backend startup
- **Health Checks**: HTTP endpoints for liveness/readiness

### Security Configuration
- **Network Policies**: Restrict traffic between pods
- **Pod Security Policies**: Non-root users, read-only filesystems
- **RBAC**: Minimal service account permissions
- **TLS**: End-to-end encryption with Let's Encrypt certificates

### Monitoring Configuration
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards
- **ServiceMonitor**: Automatic service discovery
- **Alert Rules**: Pre-configured alerts for common issues

## Environment Variables

### Required Secrets
Create these secrets before deployment:

```bash
# Database credentials
DATABASE_USER=postgres
DATABASE_PASSWORD=<secure_password>

# Redis password
REDIS_PASSWORD=<redis_password>

# JWT secrets
JWT_SECRET=<jwt_secret>

# Platform API credentials
PLATFORM_CLIENT_SECRET=<platform_secret>

# Webhook secrets
RH_LEGADO_WEBHOOK_SECRET=<webhook_secret>
```

### ConfigMap Variables
The following variables are configured via ConfigMap:

- Database connection settings
- Redis connection settings
- Application configuration
- Senior Platform API URLs
- Logging configuration
- Security settings

## Resource Requirements

### Minimum Cluster Requirements
- **Nodes**: 3 worker nodes
- **CPU**: 8 cores total
- **Memory**: 16GB total
- **Storage**: 50GB persistent storage
- **Network**: Load balancer support

### Per-Component Resources

| Component  | Requests      | Limits        | Replicas |
|------------|---------------|---------------|----------|
| Frontend   | 128Mi, 100m   | 512Mi, 500m   | 2-5      |
| Backend    | 512Mi, 250m   | 2Gi, 1000m    | 3-10     |
| PostgreSQL | 512Mi, 250m   | 2Gi, 1000m    | 1        |
| Redis      | 256Mi, 100m   | 1Gi, 500m     | 1        |

## Scaling Configuration

### Horizontal Pod Autoscaler (HPA)
- **Backend**: Scales 3-10 replicas based on CPU (70%) and memory (80%)
- **Frontend**: Scales 2-5 replicas based on CPU (70%) and memory (80%)

### Vertical Scaling
- Database and Redis use persistent volumes that can be expanded
- Resource limits can be adjusted in deployment manifests

## SSL/TLS Configuration

### Let's Encrypt (Recommended)
The ingress configuration includes cert-manager annotations for automatic SSL certificates:

```yaml
cert-manager.io/cluster-issuer: "letsencrypt-prod"
```

### Custom Certificates
To use custom certificates:

1. Create TLS secret:
   ```bash
   kubectl create secret tls sistema-quadro-lotacao-tls \
     --cert=path/to/cert.pem \
     --key=path/to/key.pem \
     -n sistema-quadro-lotacao
   ```

2. Update ingress.yaml to reference the secret

## Health Checks

### Liveness Probes
- **Backend**: `GET /api/health` every 10s
- **Frontend**: `GET /health` every 10s
- **PostgreSQL**: `pg_isready` command every 10s
- **Redis**: `redis-cli ping` command every 10s

### Readiness Probes
- Similar to liveness probes but with shorter intervals (5s)
- Used to determine when pods are ready to receive traffic

## Troubleshooting

### Common Issues

1. **Pod Startup Failures**
   ```bash
   kubectl describe pod <pod-name> -n sistema-quadro-lotacao
   kubectl logs <pod-name> -n sistema-quadro-lotacao
   ```

2. **Database Connection Issues**
   ```bash
   kubectl exec -it deployment/backend -n sistema-quadro-lotacao -- env | grep DATABASE
   ```

3. **Certificate Issues**
   ```bash
   kubectl describe certificate -n sistema-quadro-lotacao
   kubectl describe ingress -n sistema-quadro-lotacao
   ```

4. **Resource Issues**
   ```bash
   kubectl top pods -n sistema-quadro-lotacao
   kubectl describe hpa -n sistema-quadro-lotacao
   ```

### Useful Commands

```bash
# Check all resources
kubectl get all -n sistema-quadro-lotacao

# Check pod logs
kubectl logs -f deployment/backend -n sistema-quadro-lotacao

# Port forward for debugging
kubectl port-forward service/backend-service 8000:8000 -n sistema-quadro-lotacao

# Scale deployment
kubectl scale deployment backend --replicas=5 -n sistema-quadro-lotacao

# Rollback deployment
kubectl rollout undo deployment/backend -n sistema-quadro-lotacao

# Check resource usage
kubectl top pods -n sistema-quadro-lotacao
kubectl top nodes
```

## Backup and Recovery

### Database Backups
Automated backups are configured via CronJob:

```bash
# Manual backup
kubectl create job --from=cronjob/postgres-backup postgres-backup-manual -n sistema-quadro-lotacao

# List backups
kubectl exec -it postgres-pod -n sistema-quadro-lotacao -- ls -la /backups/

# Restore from backup
kubectl exec -it postgres-pod -n sistema-quadro-lotacao -- pg_restore -U postgres -d sistema_quadro_lotacao /backups/backup.sql
```

### Configuration Backup
```bash
# Backup all configurations
kubectl get all,configmap,secret,pvc -n sistema-quadro-lotacao -o yaml > backup-$(date +%Y%m%d).yaml
```

## Security Considerations

1. **Secrets Management**: Use external secret management systems in production
2. **Network Policies**: Restrict inter-pod communication
3. **RBAC**: Implement least-privilege access
4. **Image Security**: Scan images for vulnerabilities
5. **Pod Security**: Use security contexts and policies
6. **TLS**: Encrypt all communications

## Monitoring and Alerting

### Metrics Collected
- Application performance metrics
- Infrastructure metrics (CPU, memory, disk)
- Business metrics (user activity, API usage)
- Error rates and response times

### Alert Rules
- High error rates (>5% for 5 minutes)
- High response times (>3s 95th percentile)
- Database connection issues
- Pod crash loops
- Resource exhaustion

### Dashboards
- Application overview
- Infrastructure monitoring
- Business metrics
- Error tracking

## Maintenance

### Regular Tasks
- Update container images
- Rotate secrets and certificates
- Review and update resource limits
- Monitor and optimize database performance
- Review security policies and access controls

### Upgrade Procedures
1. Test in staging environment
2. Create backup of current state
3. Update container images
4. Apply new configurations
5. Verify deployment health
6. Monitor for issues

## Support

For deployment issues or questions:
- Check the troubleshooting section above
- Review application logs
- Contact the development team
- Escalate to infrastructure team if needed