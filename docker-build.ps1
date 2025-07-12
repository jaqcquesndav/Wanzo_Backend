# PowerShell script for building Docker containers

# Function to display help message
function Show-Help {
    Write-Host "Usage: .\docker-build.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Help             Show this help message"
    Write-Host "  -Service NAME     Build only a specific service (e.g. accounting-service)"
    Write-Host "  -Clean            Clean Docker cache before building"
    Write-Host "  -Force            Force rebuild without using cache"
    Write-Host "  -Prune            Prune unused Docker images after building"
    Write-Host "  -Dev              Build development environment"
    Write-Host "  -Up               Start services after build"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\docker-build.ps1 -Service accounting-service -Up"
    Write-Host "  .\docker-build.ps1 -Clean -Force"
}

param (
    [switch]$Help,
    [string]$Service = "",
    [switch]$Clean,
    [switch]$Force,
    [switch]$Prune,
    [switch]$Dev,
    [switch]$Up
)

# Show help if requested
if ($Help) {
    Show-Help
    exit 0
}

# Clean Docker cache if requested
if ($Clean) {
    Write-Host "Cleaning Docker build cache..."
    docker builder prune -f
}

# Build command options
$BuildOpts = ""

if ($Force) {
    $BuildOpts = "$BuildOpts --no-cache"
}

if ($Dev) {
    $ComposeFile = "docker-compose.yml"
} else {
    $ComposeFile = "docker-compose.yml"
}

# Build the specified service or all services
Write-Host "Building Docker containers using $ComposeFile..."

if ($Service -ne "") {
    Write-Host "Building service: $Service"
    docker-compose -f $ComposeFile build $BuildOpts $Service
} else {
    Write-Host "Building all services"
    docker-compose -f $ComposeFile build $BuildOpts
}

# Start services if requested
if ($Up) {
    if ($Service -ne "") {
        Write-Host "Starting service: $Service"
        docker-compose -f $ComposeFile up -d $Service
    } else {
        Write-Host "Starting all services"
        docker-compose -f $ComposeFile up -d
    }
}

# Prune unused Docker images if requested
if ($Prune) {
    Write-Host "Pruning unused Docker images..."
    docker image prune -f
}

Write-Host "Docker build process completed!"
