# Quick Docker Desktop Restart Script
# This script provides immediate Docker Desktop restart steps

Write-Host "=== Quick Docker Desktop Fix ===" -ForegroundColor Green

# Stop all Docker processes
Write-Host "Stopping Docker Desktop..." -ForegroundColor Yellow
Get-Process "*docker*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait
Start-Sleep -Seconds 5

# Try to shutdown WSL (this might fail due to the timeout issue, but let's try)
Write-Host "Attempting to shutdown WSL..." -ForegroundColor Yellow
try {
    Start-Process "wsl" -ArgumentList "--shutdown" -Wait -WindowStyle Hidden -ErrorAction Stop
    Write-Host "WSL shutdown successful" -ForegroundColor Green
} catch {
    Write-Host "WSL shutdown had issues (expected due to timeout problem)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 3

# Restart Docker Desktop
Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

Write-Host ""
Write-Host "Docker Desktop is starting..." -ForegroundColor Cyan
Write-Host "Please wait 2-3 minutes, then test with: docker version" -ForegroundColor Yellow
Write-Host ""
Write-Host "If this doesn't work, try these alternatives:" -ForegroundColor Cyan
Write-Host "1. Run fix-wsl-docker.ps1 as Administrator" -ForegroundColor White
Write-Host "2. Use the local development setup: .\setup-local-dev.ps1" -ForegroundColor White
Write-Host "3. Restart your computer and try again" -ForegroundColor White
