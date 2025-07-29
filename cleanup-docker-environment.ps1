#!/usr/bin/env pwsh
# Docker Project Cleanup Script
# This script cleans up Docker resources and prepares the environment for a fresh build

Write-Host "Starting Docker cleanup and environment preparation..." -ForegroundColor Cyan

# 1. Stop all running containers
Write-Host "Stopping all running Docker containers..." -ForegroundColor Yellow
docker stop $(docker ps -q) 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  No running containers to stop" -ForegroundColor Gray
} else {
    Write-Host "  All containers stopped" -ForegroundColor Green
}

# 2. Remove all stopped containers
Write-Host "Removing stopped containers..." -ForegroundColor Yellow
docker container prune -f
Write-Host "  Containers removed" -ForegroundColor Green

# 3. Remove unused images
Write-Host "Removing unused Docker images..." -ForegroundColor Yellow
docker image prune -f
Write-Host "  Unused images removed" -ForegroundColor Green

# 4. Remove unused volumes
Write-Host "Removing unused Docker volumes..." -ForegroundColor Yellow
docker volume prune -f
Write-Host "  Unused volumes removed" -ForegroundColor Green

# 5. Remove unused networks
Write-Host "Removing unused Docker networks..." -ForegroundColor Yellow
docker network prune -f
Write-Host "  Unused networks removed" -ForegroundColor Green

# 6. Remove all Wanzo service images to force rebuild
Write-Host "Removing Wanzo service images..." -ForegroundColor Yellow
$services = @(
    "accounting-service",
    "admin-service",
    "analytics-service",
    "api-gateway",
    "app_mobile_service",
    "customer-service",
    "portfolio-institution-service"
)

foreach ($service in $services) {
    docker rmi -f "wanzo/$service" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  No image found for wanzo/$service" -ForegroundColor Gray
    } else {
        Write-Host "  Removed image wanzo/$service" -ForegroundColor Green
    }
}

# 7. Clean node_modules if requested
$cleanNodeModules = Read-Host "Do you want to clean node_modules directories? (y/N)"
if ($cleanNodeModules -eq "y" -or $cleanNodeModules -eq "Y") {
    Write-Host "Cleaning node_modules directories..." -ForegroundColor Yellow
    Get-ChildItem -Path . -Filter "node_modules" -Directory -Recurse | ForEach-Object {
        Write-Host "  Removing $($_.FullName)" -ForegroundColor Gray
        Remove-Item -Path $_.FullName -Recurse -Force
    }
    Write-Host "  All node_modules directories removed" -ForegroundColor Green
}

# 8. Run Docker system prune as final cleanup
$deepClean = Read-Host "Do you want to perform a deep system cleanup? This will remove all unused data (y/N)"
if ($deepClean -eq "y" -or $deepClean -eq "Y") {
    Write-Host "Running Docker system prune..." -ForegroundColor Yellow
    docker system prune -a -f
    Write-Host "  Deep cleanup completed" -ForegroundColor Green
}

Write-Host "`nDocker cleanup complete!" -ForegroundColor Cyan
Write-Host "You can now run '.\optimize-docker-builds.ps1' followed by '.\build-services-sequentially.ps1' to rebuild all services." -ForegroundColor Cyan
