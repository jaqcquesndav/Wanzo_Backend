# PowerShell script for building and running the accounting-service

Write-Host "Building and running accounting-service..."

# Ensure we're in the right directory
$rootDir = $PSScriptRoot

# Build and run just the accounting-service and its dependencies
Write-Host "Building accounting-service and dependencies..."
docker-compose -f "$rootDir\docker-compose.yml" build accounting-service

# Check if the build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Exiting..." -ForegroundColor Red
    exit 1
}

Write-Host "Starting accounting-service and dependencies..."
docker-compose -f "$rootDir\docker-compose.yml" up -d postgres zookeeper kafka accounting-service

Write-Host "Services are starting. You can check logs with:"
Write-Host "docker-compose logs -f accounting-service" -ForegroundColor Green

# Display service URLs
Write-Host "`nService endpoints:"
Write-Host "- Accounting Service API: http://localhost:3003" -ForegroundColor Cyan
Write-Host "- Swagger UI: http://localhost:3003/api/docs" -ForegroundColor Cyan
