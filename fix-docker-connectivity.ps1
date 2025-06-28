# Fix Docker Desktop connectivity issues on Windows
# This script addresses common Docker daemon connectivity problems

Write-Host "Fixing Docker Desktop connectivity issues..." -ForegroundColor Green

# Stop Docker processes
Write-Host "Stopping Docker processes..." -ForegroundColor Yellow
Get-Process "*docker*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 5

# Restart Docker Desktop
Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue

# Wait for Docker to start
Write-Host "Waiting for Docker to initialize..." -ForegroundColor Yellow
$maxAttempts = 12
$attempt = 0

do {
    Start-Sleep -Seconds 10
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts - Checking Docker status..." -ForegroundColor Cyan
    
    try {
        $dockerVersion = docker version 2>&1
        if ($dockerVersion -notmatch "error" -and $dockerVersion -notmatch "500 Internal Server Error") {
            Write-Host "Docker is running successfully!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "Docker not ready yet..." -ForegroundColor Yellow
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "Docker Desktop failed to start properly. Try these manual steps:" -ForegroundColor Red
    Write-Host "1. Open Docker Desktop manually" -ForegroundColor White
    Write-Host "2. Check if WSL2 is enabled" -ForegroundColor White
    Write-Host "3. Try restarting your computer" -ForegroundColor White
    Write-Host "4. Or try: docker context use default" -ForegroundColor White
    exit 1
}

# Test Docker with a simple command
Write-Host "Testing Docker functionality..." -ForegroundColor Yellow
try {
    docker ps
    Write-Host "Docker is working correctly!" -ForegroundColor Green
} catch {
    Write-Host "Docker is running but may have issues. Try the alternative approaches below." -ForegroundColor Yellow
}

Write-Host "Docker setup complete. You can now run: docker-compose up -d" -ForegroundColor Green
