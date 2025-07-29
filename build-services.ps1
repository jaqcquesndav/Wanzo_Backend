# Build services in order with reduced context and improved error handling

$ErrorActionPreference = 'Stop'
$startTime = Get-Date

# Create a function to build a service
function Start-ServiceBuild {
    param (
        [string]$ServiceName
    )
    
    Write-Host "`n=========================================" -ForegroundColor Cyan
    Write-Host "Building $ServiceName..." -ForegroundColor Cyan
    Write-Host "=========================================`n" -ForegroundColor Cyan
    
    # First try to build just this service with its dependencies
    try {
        docker-compose build --no-cache $ServiceName
        if ($LASTEXITCODE -ne 0) { throw "Docker build failed for $ServiceName" }
        
        Write-Host "`n✅ Successfully built $ServiceName" -ForegroundColor Green
        return $true
    }
    catch {
        $errorMessage = $_.Exception.Message
        Write-Host "`n❌ Failed to build $ServiceName" -NoNewline -ForegroundColor Red
        Write-Host ": $errorMessage" -ForegroundColor Red
        
        # Ask if user wants to retry
        $retry = Read-Host "Do you want to retry building $ServiceName? (y/n)"
        if ($retry -eq 'y') {
            return Start-ServiceBuild -ServiceName $ServiceName
        }
        
        # Ask if user wants to skip this service
        $skip = Read-Host "Do you want to skip $ServiceName and continue with other services? (y/n)"
        if ($skip -eq 'y') {
            return $false
        }
        
        # If not skipping, exit the script
        Write-Host "Exiting build process." -ForegroundColor Red
        exit 1
    }
}

# Display initial message
Write-Host "`n===================================================" -ForegroundColor Yellow
Write-Host "Starting phased build of Wanzo Backend services" -ForegroundColor Yellow
Write-Host "===================================================`n" -ForegroundColor Yellow

# Clean up any old containers and volumes that might interfere
Write-Host "Cleaning up environment before build..."
docker-compose down --remove-orphans
# Uncomment the next line if you want to clean volumes too (will delete database data)
# docker-compose down --volumes

# List of services to build in order
$services = @(
    "postgres", 
    "zookeeper", 
    "kafka", 
    "api-gateway", 
    "admin-service",
    "accounting-service",
    "analytics-service",
    "portfolio-institution-service",
    "customer-service",
    "app-mobile-service",
    "adha-ai-service"
)

# Build each service in order
$succeededServices = @()
$failedServices = @()

foreach ($service in $services) {
    $result = Start-ServiceBuild -ServiceName $service
    
    if ($result) {
        $succeededServices += $service
    } else {
        $failedServices += $service
    }
}

# Summary report
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n===================================================" -ForegroundColor Yellow
Write-Host "Build process completed in $($duration.TotalMinutes.ToString('0.0')) minutes" -ForegroundColor Yellow
Write-Host "===================================================`n" -ForegroundColor Yellow

if ($succeededServices.Count -gt 0) {
    Write-Host "✅ Successfully built services:" -ForegroundColor Green
    foreach ($service in $succeededServices) {
        Write-Host "  - $service" -ForegroundColor Green
    }
}

if ($failedServices.Count -gt 0) {
    Write-Host "`n❌ Failed to build services:" -ForegroundColor Red
    foreach ($service in $failedServices) {
        Write-Host "  - $service" -ForegroundColor Red
    }
}

# Ask if user wants to start the successfully built services
if ($succeededServices.Count -gt 0) {
    $startServices = Read-Host "`nDo you want to start the successfully built services? (y/n)"
    if ($startServices -eq 'y') {
        $servicesToStart = $succeededServices -join " "
        Write-Host "Starting services: $servicesToStart" -ForegroundColor Cyan
        docker-compose up -d $servicesToStart
    }
}
