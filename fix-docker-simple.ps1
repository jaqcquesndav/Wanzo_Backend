# Quick Docker Fix Without Admin Rights
# This script tries to fix Docker issues without requiring administrator privileges

Write-Host "=== Docker Desktop Quick Fix ===" -ForegroundColor Green

Write-Host "Step 1: Checking current Docker status..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "Docker CLI is available: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "Docker CLI is not available or not in PATH" -ForegroundColor Red
    }
} catch {
    Write-Host "Docker CLI is not available" -ForegroundColor Red
}

Write-Host "Step 2: Attempting to restart Docker Desktop (user level)..." -ForegroundColor Yellow
try {
    # Try to find and restart Docker Desktop
    $dockerProcesses = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    if ($dockerProcesses) {
        Write-Host "Stopping Docker Desktop..." -ForegroundColor Yellow
        $dockerProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 5
    }
    
    # Try to start Docker Desktop
    $dockerPath = @(
        "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "${env:LOCALAPPDATA}\Programs\Docker\Docker\Docker Desktop.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if ($dockerPath) {
        Write-Host "Starting Docker Desktop from: $dockerPath" -ForegroundColor Green
        Start-Process $dockerPath -WindowStyle Hidden
        Write-Host "Docker Desktop is starting... Please wait 60-90 seconds." -ForegroundColor Yellow
    } else {
        Write-Host "Could not find Docker Desktop executable" -ForegroundColor Red
    }
} catch {
    Write-Host "Error managing Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Step 3: Creating test environment..." -ForegroundColor Yellow
# Create the test docker-compose
$testCompose = @'
services:
  postgres:
    image: postgres:15-alpine
    container_name: kiota-postgres-test
    ports:
      - "5433:5432"  # Use different port to avoid conflicts
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=root123
      - POSTGRES_DB=testdb
    volumes:
      - postgres-test-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-test-data:
'@

$testCompose | Out-File -FilePath "docker-compose.test.yml" -Encoding UTF8 -Force
Write-Host "Created docker-compose.test.yml" -ForegroundColor Green

Write-Host "Step 4: Waiting for Docker to be ready..." -ForegroundColor Yellow
$maxWait = 90
$waited = 0
$dockerReady = $false

do {
    Start-Sleep -Seconds 2
    $waited += 2
    try {
        $result = docker version --format "{{.Client.Version}}" 2>$null
        if ($result) {
            Write-Host "Docker client is ready!" -ForegroundColor Green
            # Test server connection
            $serverResult = docker version --format "{{.Server.Version}}" 2>$null
            if ($serverResult) {
                Write-Host "Docker server is ready! Version: $serverResult" -ForegroundColor Green
                $dockerReady = $true
                break
            } else {
                Write-Host "Docker client ready, waiting for server... ($waited/$maxWait seconds)" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "Waiting for Docker... ($waited/$maxWait seconds)" -ForegroundColor Yellow
    }
} while ($waited -lt $maxWait)

if ($dockerReady) {
    Write-Host "`n=== Docker is Ready! ===" -ForegroundColor Green
    Write-Host "Testing with minimal setup:" -ForegroundColor Cyan
    Write-Host "docker-compose -f docker-compose.test.yml up -d" -ForegroundColor White
    
    Write-Host "`nOnce that works, try your full setup:" -ForegroundColor Cyan
    Write-Host "docker-compose up -d" -ForegroundColor White
} else {
    Write-Host "`n=== Docker is not responding ===" -ForegroundColor Red
    Write-Host "Please try the following manual steps:" -ForegroundColor Yellow
    Write-Host "1. Close Docker Desktop completely" -ForegroundColor White
    Write-Host "2. Open Task Manager and end all Docker-related processes" -ForegroundColor White
    Write-Host "3. Restart Docker Desktop from Start Menu" -ForegroundColor White
    Write-Host "4. Wait 2-3 minutes for full initialization" -ForegroundColor White
    Write-Host "5. If still not working, restart your computer" -ForegroundColor White
}

Write-Host "`n=== Alternative Solutions ===" -ForegroundColor Magenta
Write-Host "If Docker Desktop continues to have issues:" -ForegroundColor White
Write-Host "1. Try Docker Desktop with Hyper-V backend instead of WSL2" -ForegroundColor White
Write-Host "2. Use individual docker run commands instead of docker-compose" -ForegroundColor White
Write-Host "3. Consider using a VM with Docker installed" -ForegroundColor White
