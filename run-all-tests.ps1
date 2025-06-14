# Script pour exécuter tous les tests du projet Wanzo Backend
# Ce script exécute les tests unitaires et d'intégration pour tous les microservices

$ErrorActionPreference = "Stop"
$services = @(
    "admin-service",
    "accounting-service",
    "analytics-service",
    "api-gateway",
    "app_mobile_service",
    "auth-service",
    "portfolio-institution-service",
    "portfolio-sme-service"
)

# Fonction pour exécuter les tests d'un service
function Test-Service {
    param (
        [string]$serviceName
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Exécution des tests pour $serviceName" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    $servicePath = Join-Path -Path (Get-Location) -ChildPath "apps/$serviceName"
    
    if (Test-Path -Path $servicePath) {
        Push-Location -Path $servicePath
        
        # Vérifier si le service a des tests
        $hasTests = (Test-Path -Path "test") -or ((Get-ChildItem -Path "src" -Filter "*.spec.ts" -Recurse).Count -gt 0)
        
        if ($hasTests) {
            # Exécuter les tests avec Jest
            npm test
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ Les tests pour $serviceName ont échoué." -ForegroundColor Red
                $global:failedServices += $serviceName
            } else {
                Write-Host "✅ Les tests pour $serviceName ont réussi." -ForegroundColor Green
                $global:successServices += $serviceName
            }
        } else {
            Write-Host "⚠️ Aucun test trouvé pour $serviceName." -ForegroundColor Yellow
            $global:noTestServices += $serviceName
        }
        
        Pop-Location
    } else {
        Write-Host "⚠️ Le service $serviceName n'existe pas." -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# Variables pour suivre les résultats
$global:successServices = @()
$global:failedServices = @()
$global:noTestServices = @()

# Exécuter les tests pour chaque service
foreach ($service in $services) {
    Test-Service -serviceName $service
}

# Afficher le résumé
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Résumé des tests" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "Services avec tests réussis ($($global:successServices.Count)):" -ForegroundColor Green
if ($global:successServices.Count -gt 0) {
    foreach ($service in $global:successServices) {
        Write-Host "  - $service" -ForegroundColor Green
    }
} else {
    Write-Host "  Aucun" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Services avec tests échoués ($($global:failedServices.Count)):" -ForegroundColor Red
if ($global:failedServices.Count -gt 0) {
    foreach ($service in $global:failedServices) {
        Write-Host "  - $service" -ForegroundColor Red
    }
} else {
    Write-Host "  Aucun" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Services sans tests ($($global:noTestServices.Count)):" -ForegroundColor Yellow
if ($global:noTestServices.Count -gt 0) {
    foreach ($service in $global:noTestServices) {
        Write-Host "  - $service" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Aucun" -ForegroundColor Gray
}

# Déterminer le code de sortie en fonction des résultats
if ($global:failedServices.Count -gt 0) {
    exit 1
} else {
    exit 0
}
