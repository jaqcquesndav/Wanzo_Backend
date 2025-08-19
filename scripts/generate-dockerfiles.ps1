#!/usr/bin/env pwsh
# Generateur de Dockerfiles standardises
# Wanzobe Backend - Optimisation Docker

param(
    [string]$Action = "generate"
)

# Configuration des services
$services = @{
    "accounting-service" = @{
        "port" = "3003"
        "description" = "Service de comptabilite et facturation"
    }
    "gestion_commerciale_service" = @{
        "port" = "3006" 
        "description" = "Service de gestion commerciale"
    }
    "admin-service" = @{
        "port" = "3001"
        "description" = "Service d'administration"
    }
    "customer-service" = @{
        "port" = "3011"
        "description" = "Service de gestion des clients"
    }
    "api-gateway" = @{
        "port" = "8000"
        "description" = "API Gateway principal"
    }
    "analytics-service" = @{
        "port" = "3002"
        "description" = "Service d'analytiques et metriques"
    }
    "portfolio-institution-service" = @{
        "port" = "3005"
        "description" = "Service de gestion des portfolios d'institutions"
    }
}

function Write-ColoredOutput {
    param([string]$Message, [string]$Color)
    switch($Color) {
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        default { Write-Host $Message }
    }
}

function Generate-Dockerfile {
    param([string]$ServiceName, [hashtable]$ServiceConfig)
    
    Write-ColoredOutput "Docker generation for: $ServiceName" "Blue"
    
    # Lecture du template
    $templatePath = "templates/Dockerfile.template"
    if (-not (Test-Path $templatePath)) {
        Write-ColoredOutput "Template Dockerfile not found: $templatePath" "Red"
        return $false
    }
    
    $template = Get-Content $templatePath -Raw
    
    # Remplacement des variables
    $dockerfile = $template -replace '{{SERVICE_NAME}}', $ServiceName
    $dockerfile = $dockerfile -replace '{{SERVICE_PORT}}', $ServiceConfig.port
    $dockerfile = $dockerfile -replace '{{SERVICE_DESCRIPTION}}', $ServiceConfig.description
    
    # Ecriture du Dockerfile
    $outputPath = "apps/$ServiceName/Dockerfile"
    $dockerfile | Set-Content -Path $outputPath -Encoding UTF8
    
    Write-ColoredOutput "Dockerfile generated: $outputPath" "Green"
    return $true
}

function Generate-AllDockerfiles {
    Write-ColoredOutput "GENERATION DES DOCKERFILES STANDARDISES - WANZOBE BACKEND" "Green"
    Write-ColoredOutput "==========================================================" "Green"
    
    # Generation des nouveaux Dockerfiles
    $successCount = 0
    foreach($serviceName in $services.Keys) {
        if (Generate-Dockerfile -ServiceName $serviceName -ServiceConfig $services[$serviceName]) {
            $successCount++
        }
    }
    
    Write-ColoredOutput "" ""
    Write-ColoredOutput "RESULTATS:" "Blue"
    Write-ColoredOutput "Dockerfiles generes avec succes: $successCount" "Green"
    Write-ColoredOutput "Total de services: $($services.Count)" "Blue"
    
    if ($successCount -eq $services.Count) {
        Write-ColoredOutput "Tous les Dockerfiles ont ete generes avec succes!" "Green"
        return $true
    } else {
        Write-ColoredOutput "Certains Dockerfiles n'ont pas pu etre generes." "Yellow"
        return $false
    }
}

function Show-ServicesInfo {
    Write-ColoredOutput "SERVICES CONFIGURES:" "Blue"
    Write-ColoredOutput "====================" "Blue"
    
    foreach($serviceName in $services.Keys) {
        $config = $services[$serviceName]
        Write-ColoredOutput "Service: $serviceName" "Green"
        Write-ColoredOutput "   Port: $($config.port)" "Yellow"
        Write-ColoredOutput "   Description: $($config.description)" "Yellow"
        Write-ColoredOutput "" ""
    }
}

# Execution principale
switch($Action.ToLower()) {
    "generate" {
        Generate-AllDockerfiles
    }
    "info" {
        Show-ServicesInfo
    }
    "help" {
        Write-ColoredOutput "AIDE - Generateur Dockerfiles Wanzobe" "Blue"
        Write-ColoredOutput "=====================================" "Blue"
        Write-ColoredOutput "Usage: .\generate-dockerfiles.ps1 [ACTION]" "Yellow"
        Write-ColoredOutput "" ""
        Write-ColoredOutput "Actions disponibles:" "Green"
        Write-ColoredOutput "  generate    Genere tous les Dockerfiles (defaut)" "Yellow"
        Write-ColoredOutput "  info        Affiche les informations des services" "Yellow"
        Write-ColoredOutput "  help        Affiche cette aide" "Yellow"
    }
    default {
        Write-ColoredOutput "Action inconnue: $Action" "Red"
        Write-ColoredOutput "Utilisez 'help' pour voir les actions disponibles." "Yellow"
    }
}
