#!/bin/bash

# Development Environment Setup Script for Sistema Quadro Lotação
# This script sets up the complete development environment

set -e

echo "🚀 Setting up Sistema Quadro Lotação development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v) ✅"

# Step 1: Create .env file if it doesn't exist
print_status "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created .env file from .env.example"
    print_warning "Please review and update the .env file with your specific configuration"
else
    print_warning ".env file already exists, skipping creation"
fi

# Step 2: Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

# Step 3: Start Docker services
print_status "Starting Docker services (PostgreSQL, Redis, pgAdmin, Redis Commander)..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is ready
print_status "Checking PostgreSQL connection..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres -d sistema_quadro_lotacao &> /dev/null; then
        print_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL failed to start after 30 attempts"
        exit 1
    fi
    sleep 2
done

# Check if Redis is ready
print_status "Checking Redis connection..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping &> /dev/null; then
        print_success "Redis is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Redis failed to start after 30 attempts"
        exit 1
    fi
    sleep 2
done

# Step 4: Run database migrations
print_status "Running database migrations..."
npm run db:migrate
print_success "Database migrations completed"

# Step 5: Seed development data
print_status "Seeding development data..."
npm run db:seed
print_success "Development data seeded"

# Step 6: Run tests to verify setup
print_status "Running tests to verify setup..."
npm test
print_success "All tests passed"

# Print setup summary
echo ""
echo "🎉 Development environment setup completed successfully!"
echo ""
echo "📋 Services Information:"
echo "   • Application: http://localhost:3000"
echo "   • PostgreSQL: localhost:5432"
echo "     - Database: sistema_quadro_lotacao"
echo "     - Username: postgres"
echo "     - Password: postgres"
echo "   • Redis: localhost:6379"
echo "   • pgAdmin: http://localhost:5050"
echo "     - Email: admin@quadro-lotacao.com"
echo "     - Password: admin123"
echo "   • Redis Commander: http://localhost:8081"
echo "     - Username: admin"
echo "     - Password: admin123"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review and update .env file if needed"
echo "   2. Start the development server: npm run dev"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Useful Commands:"
echo "   • npm run dev          - Start development server"
echo "   • npm run db:migrate   - Run database migrations"
echo "   • npm run db:seed      - Seed development data"
echo "   • npm run db:reset     - Reset database (migrate + seed)"
echo "   • npm test             - Run tests"
echo "   • docker-compose logs  - View service logs"
echo "   • docker-compose down  - Stop all services"
echo ""