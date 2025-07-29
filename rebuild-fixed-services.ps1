#!/usr/bin/env pwsh

Write-Host "Rebuilding services after fixing TypeScript errors..." -ForegroundColor Green

# Navigate to the project root directory
$rootDir = "c:\Users\DevSpace\Wanzobe\Wanzo_Backend"
Set-Location $rootDir

# Clean up any previous build artifacts
Write-Host "Cleaning up build artifacts..." -ForegroundColor Yellow
npm run clean --if-present

# Install or update dependencies if needed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
npm install

# Build each service individually
$services = @(
    "analytics-service",
    "portfolio-institution-service"
)

foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Cyan
    npm run build --prefix apps/$service

    # Check if build was successful
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error building $service. Please check the logs above for details." -ForegroundColor Red
    } else {
        Write-Host "$service built successfully!" -ForegroundColor Green
    }
}

Write-Host "Build process completed!" -ForegroundColor Green
