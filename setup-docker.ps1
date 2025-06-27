# Ce script initialise l'environnement Docker pour le projet Kiota-Suit

Write-Host "Initialisation de l'environnement Docker pour Kiota-Suit..." -ForegroundColor Green

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

# Créer les fichiers .env à partir des exemples
Write-Host "Création des fichiers .env à partir des exemples..." -ForegroundColor Yellow

# Fonction pour copier les fichiers .env.example en .env
function Create-EnvFile {
    param (
        [string]$service
    )
    $examplePath = "apps\$service\.env.example"
    $envPath = "apps\$service\.env"
    
    if (Test-Path $examplePath) {
        if (-not (Test-Path $envPath)) {
            Copy-Item $examplePath $envPath
            Write-Host "Fichier .env créé pour $service" -ForegroundColor Green
        } else {
            Write-Host "Le fichier .env existe déjà pour $service" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Fichier .env.example non trouvé pour $service" -ForegroundColor Red
    }
}

# Créer les fichiers .env pour chaque service
Create-EnvFile -service "admin-service"
Create-EnvFile -service "accounting-service"
Create-EnvFile -service "analytics-service"
Create-EnvFile -service "api-gateway"
Create-EnvFile -service "app_mobile_service"
Create-EnvFile -service "portfolio-institution-service"
Create-EnvFile -service "portfolio-sme-service"

# Construction des images Docker
Write-Host "Construction des images Docker..." -ForegroundColor Yellow
Write-Host "Note: La construction peut prendre plusieurs minutes." -ForegroundColor Yellow
Write-Host "Si vous rencontrez des erreurs liées aux dossiers 'dist' manquants ou des erreurs TypeScript, vérifiez que le build est correctement configuré dans chaque service." -ForegroundColor Yellow

# Demander à l'utilisateur s'il souhaite construire tous les services ou un service spécifique
$buildAll = Read-Host "Voulez-vous construire tous les services? (O/n)"

if ($buildAll -eq "" -or $buildAll -eq "o" -or $buildAll -eq "O") {
    $skipTypeCheck = Read-Host "Voulez-vous ignorer la vérification des types TypeScript pour accélérer la construction? (o/N)"
    
    if ($skipTypeCheck -eq "o" -or $skipTypeCheck -eq "O") {
        Write-Host "Construction de tous les services sans vérification des types..." -ForegroundColor Yellow
        $env:DOCKER_BUILDKIT=1
        $env:TS_SKIP_TYPECHECK=1
        $env:NPM_CONFIG_LEGACY_PEER_DEPS=true
        docker-compose build
        Remove-Item Env:\TS_SKIP_TYPECHECK -ErrorAction SilentlyContinue
        Remove-Item Env:\DOCKER_BUILDKIT -ErrorAction SilentlyContinue
        Remove-Item Env:\NPM_CONFIG_LEGACY_PEER_DEPS -ErrorAction SilentlyContinue
    } else {
        Write-Host "Construction de tous les services avec vérification des types..." -ForegroundColor Yellow
        docker-compose build
    }
}
else {
    $services = @("api-gateway", "admin-service", "accounting-service", "analytics-service", "portfolio-sme-service", "portfolio-institution-service", "app-mobile-service")
    Write-Host "Services disponibles:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $services.Length; $i++) {
        Write-Host "$($i+1). $($services[$i])" -ForegroundColor Cyan
    }
    
    $serviceChoice = Read-Host "Entrez le numéro du service à construire (1-7) ou 'q' pour quitter"
    
    if ($serviceChoice -eq "q") {
        Write-Host "Construction annulée." -ForegroundColor Yellow
        Exit 0
    }
    
    $serviceIndex = [int]$serviceChoice - 1
    if ($serviceIndex -ge 0 -and $serviceIndex -lt $services.Length) {
        $selectedService = $services[$serviceIndex]
        $skipTypeCheck = Read-Host "Voulez-vous ignorer la vérification des types TypeScript pour accélérer la construction? (o/N)"
        
        if ($skipTypeCheck -eq "o" -or $skipTypeCheck -eq "O") {
            Write-Host "Construction du service: $selectedService sans vérification des types..." -ForegroundColor Yellow
            $env:DOCKER_BUILDKIT=1
            $env:TS_SKIP_TYPECHECK=1
            $env:NPM_CONFIG_LEGACY_PEER_DEPS=true
            docker-compose build $selectedService
            Remove-Item Env:\TS_SKIP_TYPECHECK -ErrorAction SilentlyContinue
            Remove-Item Env:\DOCKER_BUILDKIT -ErrorAction SilentlyContinue
            Remove-Item Env:\NPM_CONFIG_LEGACY_PEER_DEPS -ErrorAction SilentlyContinue
        } else {
            Write-Host "Construction du service: $selectedService avec vérification des types..." -ForegroundColor Yellow
            docker-compose build $selectedService
        }
    }
    else {
        Write-Host "Choix invalide. Construction annulée." -ForegroundColor Red
        Exit 1
    }
}

Write-Host "Initialisation terminée. Vous pouvez maintenant démarrer les services avec:" -ForegroundColor Green
Write-Host "docker-compose up -d" -ForegroundColor Yellow
Write-Host "Pour visualiser les logs, utilisez:" -ForegroundColor Green
Write-Host "docker-compose logs -f" -ForegroundColor Yellow
