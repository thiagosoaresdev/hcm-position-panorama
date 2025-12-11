@echo off
REM Development Environment Setup Script for Sistema Quadro Lotação
REM This script sets up the complete development environment on Windows

echo 🚀 Setting up Sistema Quadro Lotação development environment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo [INFO] Node.js version: 
node --version

REM Step 1: Create .env file if it doesn't exist
echo [INFO] Setting up environment configuration...
if not exist .env (
    copy .env.example .env
    echo [SUCCESS] Created .env file from .env.example
    echo [WARNING] Please review and update the .env file with your specific configuration
) else (
    echo [WARNING] .env file already exists, skipping creation
)

REM Step 2: Install Node.js dependencies
echo [INFO] Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Node.js dependencies installed

REM Step 3: Start Docker services
echo [INFO] Starting Docker services (PostgreSQL, Redis, pgAdmin, Redis Commander)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker services
    pause
    exit /b 1
)

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 15 /nobreak >nul

REM Step 4: Run database migrations
echo [INFO] Running database migrations...
call npm run db:migrate
if %errorlevel% neq 0 (
    echo [ERROR] Database migrations failed
    pause
    exit /b 1
)
echo [SUCCESS] Database migrations completed

REM Step 5: Seed development data
echo [INFO] Seeding development data...
call npm run db:seed
if %errorlevel% neq 0 (
    echo [ERROR] Database seeding failed
    pause
    exit /b 1
)
echo [SUCCESS] Development data seeded

REM Step 6: Run tests to verify setup
echo [INFO] Running tests to verify setup...
call npm test
if %errorlevel% neq 0 (
    echo [WARNING] Some tests failed, but setup may still be functional
)

REM Print setup summary
echo.
echo 🎉 Development environment setup completed successfully!
echo.
echo 📋 Services Information:
echo    • Application: http://localhost:3000
echo    • PostgreSQL: localhost:5432
echo      - Database: sistema_quadro_lotacao
echo      - Username: postgres
echo      - Password: postgres
echo    • Redis: localhost:6379
echo    • pgAdmin: http://localhost:5050
echo      - Email: admin@quadro-lotacao.com
echo      - Password: admin123
echo    • Redis Commander: http://localhost:8081
echo      - Username: admin
echo      - Password: admin123
echo.
echo 🚀 Next Steps:
echo    1. Review and update .env file if needed
echo    2. Start the development server: npm run dev
echo    3. Open http://localhost:3000 in your browser
echo.
echo 📚 Useful Commands:
echo    • npm run dev          - Start development server
echo    • npm run db:migrate   - Run database migrations
echo    • npm run db:seed      - Seed development data
echo    • npm run db:reset     - Reset database (migrate + seed)
echo    • npm test             - Run tests
echo    • docker-compose logs  - View service logs
echo    • docker-compose down  - Stop all services
echo.

pause