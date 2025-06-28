# WSL and Docker Desktop Fix Script
# Run as Administrator

Write-Host "=== WSL and Docker Desktop Troubleshooting Script ===" -ForegroundColor Green

# Function to check if running as admin
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host "This script needs to be run as Administrator. Please restart PowerShell as Administrator." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Stopping Docker Desktop..." -ForegroundColor Yellow
try {
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    Write-Host "Docker Desktop stopped." -ForegroundColor Green
} catch {
    Write-Host "Docker Desktop was not running or could not be stopped." -ForegroundColor Yellow
}

Write-Host "Step 2: Terminating WSL..." -ForegroundColor Yellow
try {
    wsl --shutdown
    Start-Sleep -Seconds 5
    Write-Host "WSL terminated." -ForegroundColor Green
} catch {
    Write-Host "Error terminating WSL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Step 3: Restarting WSL service..." -ForegroundColor Yellow
try {
    Restart-Service -Name "LxssManager" -Force
    Start-Sleep -Seconds 5
    Write-Host "WSL service restarted." -ForegroundColor Green
} catch {
    Write-Host "Error restarting WSL service: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Step 4: Checking WSL status..." -ForegroundColor Yellow
try {
    $wslStatus = wsl --status
    Write-Host "WSL Status: $wslStatus" -ForegroundColor Green
} catch {
    Write-Host "Error checking WSL status: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Step 5: Listing WSL distributions..." -ForegroundColor Yellow
try {
    $wslList = wsl -l -v
    Write-Host "WSL Distributions:" -ForegroundColor Green
    Write-Host $wslList -ForegroundColor White
} catch {
    Write-Host "Error listing WSL distributions: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Step 6: Starting Docker Desktop..." -ForegroundColor Yellow
try {
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
    Write-Host "Docker Desktop starting... Please wait 30-60 seconds for it to fully initialize." -ForegroundColor Green
} catch {
    Write-Host "Error starting Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please start Docker Desktop manually from the Start menu." -ForegroundColor Yellow
}

Write-Host "Step 7: Waiting for Docker to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        $dockerStatus = docker version --format "{{.Server.Version}}" 2>$null
        if ($dockerStatus) {
            Write-Host "Docker is ready! Version: $dockerStatus" -ForegroundColor Green
            break
        }
    } catch {
        # Continue waiting
    }
    Write-Host "Waiting for Docker... Attempt $attempt/$maxAttempts" -ForegroundColor Yellow
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "Docker did not start within the expected time. Please check Docker Desktop manually." -ForegroundColor Red
} else {
    Write-Host "All services are now ready!" -ForegroundColor Green
    Write-Host "You can now run: docker-compose up -d" -ForegroundColor Cyan
}

Write-Host "`n=== Additional Troubleshooting Tips ===" -ForegroundColor Magenta
Write-Host "If the problem persists:" -ForegroundColor White
Write-Host "1. Restart your computer" -ForegroundColor White
Write-Host "2. Update Docker Desktop to the latest version" -ForegroundColor White
Write-Host "3. Update WSL2 kernel: wsl --update" -ForegroundColor White
Write-Host "4. Check Windows Features: Enable 'Windows Subsystem for Linux' and 'Virtual Machine Platform'" -ForegroundColor White
