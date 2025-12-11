@echo off
REM Production deployment script for Sistema Quadro Lotação (Windows version)
REM This script deploys the application to Kubernetes production environment

setlocal enabledelayedexpansion

REM Configuration
set NAMESPACE=sistema-quadro-lotacao
set DOCKER_REGISTRY=your-registry.com
set IMAGE_TAG=%1
if "%IMAGE_TAG%"=="" set IMAGE_TAG=latest
set KUBECTL_CONTEXT=production

echo [INFO] Starting production deployment for Sistema Quadro Lotacao
echo [INFO] Image tag: %IMAGE_TAG%
echo [INFO] Namespace: %NAMESPACE%

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check if kubectl is installed
kubectl version --client >nul 2>&1
if errorlevel 1 (
    echo [ERROR] kubectl is not installed or not in PATH
    exit /b 1
)

REM Check if docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker is not installed or not in PATH
    exit /b 1
)

echo [INFO] Prerequisites check passed

REM Build and push Docker images
echo [INFO] Building and pushing Docker images...

REM Build frontend image
echo [INFO] Building frontend image...
docker build -f Dockerfile.frontend -t "%DOCKER_REGISTRY%/sistema-quadro-lotacao/frontend:%IMAGE_TAG%" .
if errorlevel 1 (
    echo [ERROR] Failed to build frontend image
    exit /b 1
)

docker push "%DOCKER_REGISTRY%/sistema-quadro-lotacao/frontend:%IMAGE_TAG%"
if errorlevel 1 (
    echo [ERROR] Failed to push frontend image
    exit /b 1
)

REM Build backend image
echo [INFO] Building backend image...
docker build -f Dockerfile.backend -t "%DOCKER_REGISTRY%/sistema-quadro-lotacao/backend:%IMAGE_TAG%" .
if errorlevel 1 (
    echo [ERROR] Failed to build backend image
    exit /b 1
)

docker push "%DOCKER_REGISTRY%/sistema-quadro-lotacao/backend:%IMAGE_TAG%"
if errorlevel 1 (
    echo [ERROR] Failed to push backend image
    exit /b 1
)

echo [INFO] Docker images built and pushed successfully

REM Deploy to Kubernetes
echo [INFO] Deploying to Kubernetes...

REM Set kubectl context
kubectl config use-context "%KUBECTL_CONTEXT%"

REM Create namespace if it doesn't exist
kubectl apply -f k8s/namespace.yaml

REM Apply ConfigMaps
kubectl apply -f k8s/configmap.yaml

REM Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml

REM Deploy Redis
kubectl apply -f k8s/redis.yaml

REM Wait for databases to be ready
echo [INFO] Waiting for databases to be ready...
kubectl wait --for=condition=ready pod -l app=postgres -n "%NAMESPACE%" --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n "%NAMESPACE%" --timeout=300s

REM Deploy backend
kubectl apply -f k8s/backend.yaml

REM Wait for backend to be ready
echo [INFO] Waiting for backend to be ready...
kubectl wait --for=condition=ready pod -l app=backend -n "%NAMESPACE%" --timeout=300s

REM Deploy frontend
kubectl apply -f k8s/frontend.yaml

REM Wait for frontend to be ready
echo [INFO] Waiting for frontend to be ready...
kubectl wait --for=condition=ready pod -l app=frontend -n "%NAMESPACE%" --timeout=300s

REM Apply ingress
kubectl apply -f k8s/ingress.yaml

REM Apply security policies
kubectl apply -f k8s/security-policies.yaml

REM Apply monitoring
kubectl apply -f k8s/monitoring.yaml

echo [INFO] Deployment completed successfully

REM Verify deployment
echo [INFO] Verifying deployment...

REM Check pod status
kubectl get pods -n "%NAMESPACE%"

REM Check service status
kubectl get services -n "%NAMESPACE%"

REM Check ingress status
kubectl get ingress -n "%NAMESPACE%"

echo [INFO] Production deployment completed successfully!
echo [INFO] Application should be available at: https://quadro-lotacao.senior.com.br

endlocal