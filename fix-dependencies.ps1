# fix-dependencies.ps1 - Script pour résoudre les conflits de dépendances NestJS
# Usage: .\fix-dependencies.ps1 [service-name]

param (
    [string]$serviceName
)

if ($serviceName -eq "") {
    Write-Host "Utilisation: .\fix-dependencies.ps1 [service-name]" -ForegroundColor Yellow
    Write-Host "Services disponibles: admin-service, accounting-service, analytics-service, api-gateway, app_mobile_service, portfolio-institution-service, portfolio-sme-service" -ForegroundColor Yellow
    Exit 1
}

Write-Host "Résolution des conflits de dépendances pour $serviceName..." -ForegroundColor Green

# Vérifier si le service existe
if (-not (Test-Path "apps\$serviceName")) {
    Write-Host "Service '$serviceName' introuvable. Vérifiez le nom et réessayez." -ForegroundColor Red
    Exit 1
}

Set-Location "apps\$serviceName"

Write-Host "Installation des dépendances avec --legacy-peer-deps..." -ForegroundColor Yellow
npm install --legacy-peer-deps

Write-Host "Installation des dépendances NestJS spécifiques..." -ForegroundColor Yellow
npm install --save @nestjs/microservices@^10.3.0 --legacy-peer-deps

Write-Host "Installation des autres dépendances communes..." -ForegroundColor Yellow
npm install --save jwks-rsa prom-client kafkajs --legacy-peer-deps

Write-Host "Dépendances installées avec succès pour $serviceName." -ForegroundColor Green
Write-Host "Vous pouvez maintenant réessayer de construire le service avec Docker:" -ForegroundColor Yellow
Write-Host "  docker-compose build $serviceName" -ForegroundColor Yellow

Set-Location "..\..\"
