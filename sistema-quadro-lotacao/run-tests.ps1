# PowerShell script to run tests
Write-Host "Starting Sistema Quadro Lotacao Test Suite..." -ForegroundColor Green

# Change to the correct directory
Set-Location $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Please run 'npm install' first." -ForegroundColor Red
    exit 1
}

# Run the tests
Write-Host "Running Vitest..." -ForegroundColor Yellow
try {
    & npm run test
    Write-Host "Tests completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Test execution failed: $_" -ForegroundColor Red
    exit 1
}