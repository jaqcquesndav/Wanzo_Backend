# Script to build Docker services one by one and validate each step
# This helps isolate and fix build issues

# Define colors for output
Write-Host "Build and Validate Docker Services" -ForegroundColor Cyan

# Array of services in the order they should be built
$services = @(
    "accounting-service",
    "customer-service",
    "admin-service", 
    "analytics-service",
    "api-gateway",
    "app-mobile-service",
    "portfolio-sme-service",
    "portfolio-institution-service"
)

# First run the Docker optimization script
Write-Host "`nStep 1: Running optimization script..." -ForegroundColor Yellow
.\optimize-docker-builds.ps1

# Function to build and test a service
function Test-ServiceBuild {
    param(
        [string]$ServiceName
    )
    
    Write-Host "`nBuilding $ServiceName..." -ForegroundColor Green
    
    # Clean up any previous containers for this service
    docker-compose rm -sf $ServiceName
    
    # Build the service
    Write-Host "Running: docker-compose build $ServiceName" -ForegroundColor Yellow
    docker-compose build $ServiceName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error building $ServiceName. Fix the issue before continuing." -ForegroundColor Red
        return $false
    }
    
    # Start the service
    Write-Host "Starting: docker-compose up -d $ServiceName" -ForegroundColor Yellow
    docker-compose up -d $ServiceName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error starting $ServiceName. Fix the issue before continuing." -ForegroundColor Red
        return $false
    }
    
    # Check the container status
    $containerStatus = docker-compose ps $ServiceName
    Write-Host "Container status for ${ServiceName}:" -ForegroundColor Cyan
    Write-Host $containerStatus
    
    # Wait a moment to see if it crashes immediately
    Start-Sleep -Seconds 5
    
    # Check logs
    Write-Host "Logs for ${ServiceName}:" -ForegroundColor Cyan
    docker-compose logs --tail=20 $ServiceName
    
    return $true
}

# Build and test each service one by one
foreach ($service in $services) {
    $success = Test-ServiceBuild -ServiceName $service
    
    if (-not $success) {
        $answer = Read-Host -Prompt "Continue to next service? (y/n)"
        if ($answer -ne 'y') {
            Write-Host "Build process stopped at $service. Fix the issue and run this script again." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "`nAll services built and started successfully!" -ForegroundColor Green
