# fix-all-services.ps1
# Script to run all service fix scripts to prepare for Docker build

Write-Host "Starting fixes for all services..." -ForegroundColor Cyan

# Fix dependencies first
if (Test-Path -Path "fix-dependencies.ps1") {
    Write-Host "Running fix-dependencies.ps1..." -ForegroundColor Green
    & .\fix-dependencies.ps1
} else {
    Write-Host "fix-dependencies.ps1 not found. Skipping..." -ForegroundColor Yellow
}

# Fix portfolio-institution-service
if (Test-Path -Path "fix-institution-service.ps1") {
    Write-Host "Running fix-institution-service.ps1..." -ForegroundColor Green
    & .\fix-institution-service.ps1
} else {
    Write-Host "fix-institution-service.ps1 not found. Skipping..." -ForegroundColor Yellow
}

# Fix accounting-service
if (Test-Path -Path "fix-accounting-service.ps1") {
    Write-Host "Running fix-accounting-service.ps1..." -ForegroundColor Green
    & .\fix-accounting-service.ps1
} else {
    Write-Host "fix-accounting-service.ps1 not found. Skipping..." -ForegroundColor Yellow
}

# Fix analytics-service
if (Test-Path -Path "fix-analytics-service.ps1") {
    Write-Host "Running fix-analytics-service.ps1..." -ForegroundColor Green
    & .\fix-analytics-service.ps1
} else {
    Write-Host "fix-analytics-service.ps1 not found. Skipping..." -ForegroundColor Yellow
}

Write-Host "All service fixes completed!" -ForegroundColor Cyan
Write-Host "You can now run Docker build with 'docker-compose build'" -ForegroundColor Green
