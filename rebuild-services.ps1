Write-Host "Rebuilding Services with Fixes..." -ForegroundColor Green

# Clean up Docker first to ensure a clean build
Write-Host "Cleaning up Docker environment..." -ForegroundColor Cyan
& .\cleanup-docker-environment.ps1

# Build services with fixed code
Write-Host "Building services with fixed code..." -ForegroundColor Cyan
docker-compose build analytics-service portfolio-institution-service portfolio-sme-service

# Report completion
Write-Host "Rebuild complete. You can now run 'docker-compose up' to start the services." -ForegroundColor Green
