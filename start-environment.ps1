#!/usr/bin/env pwsh
# start-environment.ps1 - Script to start the Wanzobe environment

param (
    [Parameter(Position=0)]
    [ValidateSet("dev", "prod")]
    [string]$EnvProfile = "dev",

    [switch]$BuildImages,
    
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Write-Host "Usage: ./start-environment.ps1 [EnvProfile] [Options]"
    Write-Host ""
    Write-Host "Arguments:"
    Write-Host "  EnvProfile     Either 'dev' or 'prod' (default: dev)"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -BuildImages   Build or rebuild images before starting containers"
    Write-Host "  -Help          Show this help message"
    exit 0
}

# Base command
$dockerComposeCmd = "docker-compose --profile $EnvProfile"

# Add build flag if requested
if ($BuildImages) {
    Write-Host "🔨 Building images for profile: $EnvProfile"
    $buildCmd = "$dockerComposeCmd build"
    Write-Host "Executing: $buildCmd"
    Invoke-Expression $buildCmd
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# Start containers
Write-Host "🚀 Starting environment with profile: $EnvProfile"
$upCmd = "$dockerComposeCmd up -d"
Write-Host "Executing: $upCmd"
Invoke-Expression $upCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start environment with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Show running containers
Write-Host "✅ Environment started successfully with profile: $EnvProfile" -ForegroundColor Green
Write-Host "📋 Running containers:"
docker-compose ps

Write-Host ""
Write-Host "💡 To stop the environment, run: docker-compose --profile $EnvProfile down" -ForegroundColor Cyan
Write-Host "💡 To view logs from all services, run: docker-compose --profile $EnvProfile logs -f" -ForegroundColor Cyan
Write-Host "💡 To view logs from a specific service, run: docker-compose --profile $EnvProfile logs -f SERVICE_NAME" -ForegroundColor Cyan
