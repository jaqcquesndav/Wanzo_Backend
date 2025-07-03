# Wanzo Backend - Safe Docker Startup Script
# This script starts services in a controlled manner to avoid resource conflicts

Write-Host "Starting Wanzo Backend services safely..." -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "Docker is running ✓" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "Veuillez démarrer Docker Desktop et réessayer." -ForegroundColor Yellow
    exit 1
}

# Start core infrastructure first (Database, Monitoring)
Write-Host "Starting core infrastructure..." -ForegroundColor Yellow
docker-compose up -d postgres prometheus grafana

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start infrastructure services" -ForegroundColor Red
    exit 1
}

# Wait for database to be ready
Write-Host "Waiting for database to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Start main services
Write-Host "Starting main services..." -ForegroundColor Yellow
docker-compose up -d admin-service analytics-service accounting-service

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start main services" -ForegroundColor Red
    exit 1
}

# Wait for services to initialize
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start portfolio services
Write-Host "Starting portfolio services..." -ForegroundColor Yellow
docker-compose up -d portfolio-sme-service portfolio-institution-service

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start portfolio services" -ForegroundColor Red
    exit 1
}

# Wait a bit more
Start-Sleep -Seconds 5

# Start mobile service and API gateway
Write-Host "Starting mobile service and API gateway..." -ForegroundColor Yellow
docker-compose up -d app-mobile-service api-gateway

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start mobile service and API gateway" -ForegroundColor Red
    exit 1
}

Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host "Checking service status..." -ForegroundColor Yellow

# Show running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`nServices are available at:" -ForegroundColor Cyan
Write-Host "- API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "- Admin Service: http://localhost:3001" -ForegroundColor White
Write-Host "- Analytics Service: http://localhost:3002" -ForegroundColor White
Write-Host "- Accounting Service: http://localhost:3003" -ForegroundColor White
Write-Host "- Portfolio SME: http://localhost:3004" -ForegroundColor White
Write-Host "- Portfolio Institution: http://localhost:3005" -ForegroundColor White
Write-Host "- Mobile Service: http://localhost:3006" -ForegroundColor White
Write-Host "- Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "- Grafana: http://localhost:3001 (admin/kiota-secret)" -ForegroundColor White
