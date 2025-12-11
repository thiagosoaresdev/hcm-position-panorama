#!/bin/bash

# Production deployment script for Sistema Quadro Lotação
# This script deploys the application to Kubernetes production environment

set -e

# Configuration
NAMESPACE="sistema-quadro-lotacao"
DOCKER_REGISTRY="your-registry.com"
IMAGE_TAG=${1:-"latest"}
KUBECTL_CONTEXT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check kubectl context
    if ! kubectl config get-contexts | grep -q "$KUBECTL_CONTEXT"; then
        log_error "Kubectl context '$KUBECTL_CONTEXT' not found"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -f Dockerfile.frontend -t "$DOCKER_REGISTRY/sistema-quadro-lotacao/frontend:$IMAGE_TAG" .
    docker push "$DOCKER_REGISTRY/sistema-quadro-lotacao/frontend:$IMAGE_TAG"
    
    # Build backend image
    log_info "Building backend image..."
    docker build -f Dockerfile.backend -t "$DOCKER_REGISTRY/sistema-quadro-lotacao/backend:$IMAGE_TAG" .
    docker push "$DOCKER_REGISTRY/sistema-quadro-lotacao/backend:$IMAGE_TAG"
    
    log_info "Docker images built and pushed successfully"
}

# Update Kubernetes manifests with new image tags
update_manifests() {
    log_info "Updating Kubernetes manifests..."
    
    # Update backend deployment
    sed -i "s|image: sistema-quadro-lotacao/backend:.*|image: $DOCKER_REGISTRY/sistema-quadro-lotacao/backend:$IMAGE_TAG|g" k8s/backend.yaml
    
    # Update frontend deployment
    sed -i "s|image: sistema-quadro-lotacao/frontend:.*|image: $DOCKER_REGISTRY/sistema-quadro-lotacao/frontend:$IMAGE_TAG|g" k8s/frontend.yaml
    
    log_info "Kubernetes manifests updated"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    # Set kubectl context
    kubectl config use-context "$KUBECTL_CONTEXT"
    
    # Create namespace if it doesn't exist
    kubectl apply -f k8s/namespace.yaml
    
    # Apply secrets (should be done manually in production)
    log_warn "Make sure secrets are properly configured in production"
    
    # Apply ConfigMaps
    kubectl apply -f k8s/configmap.yaml
    
    # Deploy PostgreSQL
    kubectl apply -f k8s/postgres.yaml
    
    # Deploy Redis
    kubectl apply -f k8s/redis.yaml
    
    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n "$NAMESPACE" --timeout=300s
    
    # Deploy backend
    kubectl apply -f k8s/backend.yaml
    
    # Wait for backend to be ready
    log_info "Waiting for backend to be ready..."
    kubectl wait --for=condition=ready pod -l app=backend -n "$NAMESPACE" --timeout=300s
    
    # Deploy frontend
    kubectl apply -f k8s/frontend.yaml
    
    # Wait for frontend to be ready
    log_info "Waiting for frontend to be ready..."
    kubectl wait --for=condition=ready pod -l app=frontend -n "$NAMESPACE" --timeout=300s
    
    # Apply ingress
    kubectl apply -f k8s/ingress.yaml
    
    # Apply security policies
    kubectl apply -f k8s/security-policies.yaml
    
    # Apply monitoring
    kubectl apply -f k8s/monitoring.yaml
    
    log_info "Deployment completed successfully"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pod status
    kubectl get pods -n "$NAMESPACE"
    
    # Check service status
    kubectl get services -n "$NAMESPACE"
    
    # Check ingress status
    kubectl get ingress -n "$NAMESPACE"
    
    # Run health checks
    log_info "Running health checks..."
    
    # Get ingress IP
    INGRESS_IP=$(kubectl get ingress sistema-quadro-lotacao-ingress -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -n "$INGRESS_IP" ]; then
        # Test frontend health
        if curl -f -s "http://$INGRESS_IP/health" > /dev/null; then
            log_info "Frontend health check passed"
        else
            log_error "Frontend health check failed"
        fi
        
        # Test backend health
        if curl -f -s "http://$INGRESS_IP/api/health" > /dev/null; then
            log_info "Backend health check passed"
        else
            log_error "Backend health check failed"
        fi
    else
        log_warn "Could not get ingress IP for health checks"
    fi
    
    log_info "Deployment verification completed"
}

# Rollback function
rollback() {
    log_warn "Rolling back deployment..."
    
    # Rollback backend
    kubectl rollout undo deployment/backend -n "$NAMESPACE"
    
    # Rollback frontend
    kubectl rollout undo deployment/frontend -n "$NAMESPACE"
    
    log_info "Rollback completed"
}

# Main deployment process
main() {
    log_info "Starting production deployment for Sistema Quadro Lotação"
    log_info "Image tag: $IMAGE_TAG"
    log_info "Namespace: $NAMESPACE"
    
    # Trap errors and rollback
    trap 'log_error "Deployment failed. Rolling back..."; rollback; exit 1' ERR
    
    check_prerequisites
    build_and_push_images
    update_manifests
    deploy_to_kubernetes
    verify_deployment
    
    log_info "Production deployment completed successfully!"
    log_info "Application should be available at: https://quadro-lotacao.senior.com.br"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "verify")
        verify_deployment
        ;;
    *)
        echo "Usage: $0 [deploy|rollback|verify] [image_tag]"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback to previous version"
        echo "  verify   - Verify current deployment"
        exit 1
        ;;
esac