# Alternative: Run services individually without Docker
# This script helps you run your Node.js services directly for development

Write-Host "=== Alternative Development Setup (No Docker Required) ===" -ForegroundColor Green

# Check if Node.js is available
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "Node.js is available: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Node.js is not available" -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version 2>$null
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not available" -ForegroundColor Red
    exit 1
}

Write-Host "`nSetting up local development environment..." -ForegroundColor Yellow

# Create a script to run services individually
$runScript = @'
@echo off
echo === Starting Kiota Services Locally ===

echo Setting up environment variables...
set NODE_ENV=development
set DB_HOST=localhost
set DB_PORT=5432
set DB_USERNAME=postgres
set DB_PASSWORD=root123
set KAFKA_BROKERS=localhost:9092

echo Starting services in separate terminals...

echo Starting Admin Service...
start "Admin Service" cmd /k "cd apps\admin-service && npm install && npm run start:dev"

timeout /t 5

echo Starting Analytics Service...
start "Analytics Service" cmd /k "cd apps\analytics-service && npm install && npm run start:dev"

timeout /t 5

echo Starting Accounting Service...
start "Accounting Service" cmd /k "cd apps\accounting-service && npm install && npm run start:dev"

timeout /t 5

echo Starting Portfolio Institution Service...
start "Portfolio Institution Service" cmd /k "cd apps\portfolio-institution-service && npm install && npm run start:dev"

timeout /t 5

echo Starting Mobile Service...
start "Mobile Service" cmd /k "cd apps\app_mobile_service && npm install && npm run start:dev"

timeout /t 5

echo Starting API Gateway...
start "API Gateway" cmd /k "cd apps\api-gateway && npm install && npm run start:dev"

echo All services are starting in separate windows!
echo Check each terminal for any errors.
echo.
echo Services will be available at:
echo - API Gateway: http://localhost:3000
echo - Admin Service: http://localhost:3001
echo - Analytics Service: http://localhost:3002
echo - Accounting Service: http://localhost:3003
echo - Portfolio SME Service: http://localhost:3004
echo - Portfolio Institution Service: http://localhost:3005
echo - Mobile Service: http://localhost:3006
echo.
echo Note: You'll need to set up PostgreSQL and Kafka separately
echo or use cloud services for development.
pause
'@

$runScript | Out-File -FilePath "run-services-local.bat" -Encoding ASCII -Force
Write-Host "Created run-services-local.bat" -ForegroundColor Green

# Create a PowerShell version
$runScriptPS = @'
# Run all services locally in development mode
Write-Host "=== Starting Kiota Services Locally ===" -ForegroundColor Green

# Set environment variables for development
$env:NODE_ENV = "development"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "root123"
$env:KAFKA_BROKERS = "localhost:9092"

$services = @(
    @{Name="Admin Service"; Path="apps\admin-service"; Port=3001},
    @{Name="Analytics Service"; Path="apps\analytics-service"; Port=3002},
    @{Name="Accounting Service"; Path="apps\accounting-service"; Port=3003},
    @{Name="Portfolio Institution Service"; Path="apps\portfolio-institution-service"; Port=3005},
    @{Name="Mobile Service"; Path="apps\app_mobile_service"; Port=3006},
    @{Name="API Gateway"; Path="apps\api-gateway"; Port=3000}
)

foreach ($service in $services) {
    Write-Host "Starting $($service.Name)..." -ForegroundColor Yellow
    
    # Check if service directory exists
    if (Test-Path $service.Path) {
        # Install dependencies if needed
        Push-Location $service.Path
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installing dependencies for $($service.Name)..." -ForegroundColor Cyan
            npm install
        }
        
        # Start service in new PowerShell window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run start:dev" -WindowStyle Normal
        Pop-Location
        
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Warning: $($service.Path) not found" -ForegroundColor Red
    }
}

Write-Host "`nAll services are starting!" -ForegroundColor Green
Write-Host "Services will be available at:" -ForegroundColor Cyan
foreach ($service in $services) {
    Write-Host "- $($service.Name): http://localhost:$($service.Port)" -ForegroundColor White
}

Write-Host "`nNote: Make sure you have PostgreSQL and Kafka running locally," -ForegroundColor Yellow
Write-Host "or update the environment variables to point to cloud services." -ForegroundColor Yellow
'@

$runScriptPS | Out-File -FilePath "run-services-local.ps1" -Encoding UTF8 -Force
Write-Host "Created run-services-local.ps1" -ForegroundColor Green

# Create a simplified docker-compose for just the infrastructure
$infraCompose = @'
# Infrastructure only - PostgreSQL and Kafka
services:
  postgres:
    image: postgres:15-alpine
    container_name: kiota-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=root123
      - POSTGRES_MULTIPLE_DATABASES=admin-service,accounting-service,analytics-service,portfolio-institution-service,app_mobile_service
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d
    restart: unless-stopped

  zookeeper:
    image: confluentinc/cp-zookeeper:7.0.1
    container_name: kiota-zookeeper
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    restart: unless-stopped

  kafka:
    image: confluentinc/cp-kafka:7.0.1
    container_name: kiota-kafka
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_CONFLUENT_LICENSE_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_CONFLUENT_BALANCER_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
    restart: unless-stopped

volumes:
  postgres-data:
'@

$infraCompose | Out-File -FilePath "docker-compose.infra.yml" -Encoding UTF8 -Force
Write-Host "Created docker-compose.infra.yml (just PostgreSQL and Kafka)" -ForegroundColor Green

Write-Host "`n=== Next Steps ===" -ForegroundColor Magenta
Write-Host "Option 1 - Hybrid approach (Recommended):" -ForegroundColor Yellow
Write-Host "1. Run: docker-compose -f docker-compose.infra.yml up -d" -ForegroundColor White
Write-Host "2. Run: .\run-services-local.ps1" -ForegroundColor White
Write-Host "`nOption 2 - Full local development:" -ForegroundColor Yellow
Write-Host "1. Install PostgreSQL and Kafka locally" -ForegroundColor White
Write-Host "2. Run: .\run-services-local.ps1" -ForegroundColor White
Write-Host "`nOption 3 - Wait for Docker fix:" -ForegroundColor Yellow
Write-Host "1. Restart your computer" -ForegroundColor White
Write-Host "2. Try: docker-compose up -d" -ForegroundColor White
