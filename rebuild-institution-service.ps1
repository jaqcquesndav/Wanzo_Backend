# rebuild-institution-service.ps1 - Script pour reconstruire uniquement le service portfolio-institution-service avec l'implémentation mock

Write-Host "Reconstruction du service portfolio-institution-service avec l'implémentation temporaire..." -ForegroundColor Green

# Vérifier si Docker est installé
try {
    docker --version | Out-Null
} catch {
    Write-Host "Docker n'est pas installé. Veuillez l'installer avant de continuer." -ForegroundColor Red
    Exit 1
}

# Vérifier si Docker Compose est installé
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "Docker Compose n'est pas installé. Veuillez l'installer avant de continuer." -ForegroundColor Red
    Exit 1
}

# Vérifier si le mock-service.js existe
if (-not (Test-Path "apps\portfolio-institution-service\mock-service.js")) {
    Write-Host "Le fichier mock-service.js est manquant. Veuillez le créer d'abord." -ForegroundColor Red
    Exit 1
}

Write-Host "Construction du service portfolio-institution-service..." -ForegroundColor Yellow
docker-compose build portfolio-institution-service

Write-Host "Service portfolio-institution-service reconstruit avec succès!" -ForegroundColor Green
Write-Host "Pour démarrer uniquement ce service:" -ForegroundColor Yellow
Write-Host "  docker-compose up -d portfolio-institution-service" -ForegroundColor Yellow
Write-Host "Pour vérifier les logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f portfolio-institution-service" -ForegroundColor Yellow
