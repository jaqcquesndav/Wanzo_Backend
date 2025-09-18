# 🚀 WANZO BACKEND - SCRIPT DE BUILD AUTOMATISÉ
# Utilisation: .\build-wanzo.ps1 [clean|quick|service] [nom-service]

param(
    [string]$Action = "quick",
    [string]$ServiceName = ""
)

$ErrorActionPreference = "Stop"

# Couleurs pour l'affichage
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "🔵 $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Header
Write-Host @"

🚀 ==========================================
   WANZO BACKEND - BUILD AUTOMATION
🚀 ==========================================

"@ -ForegroundColor Magenta

function Show-Help {
    Write-Host @"
📖 UTILISATION:
    .\build-wanzo.ps1 [ACTION] [SERVICE]

📋 ACTIONS DISPONIBLES:
    clean      - Nettoyage complet + rebuild images de base + services
    quick      - Build rapide des services (défaut)
    service    - Rebuild d'un service spécifique
    status     - Affichage du statut des services
    logs       - Affichage des logs
    stop       - Arrêt de tous les services
    help       - Affichage de cette aide

📝 EXEMPLES:
    .\build-wanzo.ps1 clean                    # Nettoyage complet
    .\build-wanzo.ps1 quick                    # Build rapide
    .\build-wanzo.ps1 service accounting      # Rebuild accounting-service
    .\build-wanzo.ps1 status                  # Statut des services
    .\build-wanzo.ps1 logs accounting         # Logs du service

"@ -ForegroundColor White
}

function Start-CleanBuild {
    Write-Info "🧹 NETTOYAGE COMPLET EN COURS..."
    
    # Arrêt des services
    Write-Info "Arrêt des services..."
    docker-compose --profile prod down 2>$null
    
    # Nettoyage Docker
    Write-Info "Nettoyage système Docker..."
    docker system prune -af --volumes 2>$null
    Write-Success "Nettoyage terminé"
    
    # Build images de base
    Write-Info "🔧 Construction image de base des dépendances..."
    $deps_start = Get-Date
    docker build -f Dockerfile.base --target wanzo-deps-base -t wanzo-deps-base .
    $deps_time = (Get-Date) - $deps_start
    Write-Success "Image wanzo-deps-base construite en $($deps_time.TotalMinutes.ToString('F1')) minutes"
    
    Write-Info "🚀 Construction image de base de production..."
    $prod_start = Get-Date
    docker build -f Dockerfile.base --target wanzo-production-base -t wanzo-production-base .
    $prod_time = (Get-Date) - $prod_start
    Write-Success "Image wanzo-production-base construite en $($prod_time.TotalMinutes.ToString('F1')) minutes"
    
    # Build services
    Start-QuickBuild
}

function Start-QuickBuild {
    Write-Info "⚡ BUILD RAPIDE DES SERVICES..."
    
    $build_start = Get-Date
    docker-compose --profile prod build
    $build_time = (Get-Date) - $build_start
    Write-Success "Services construits en $($build_time.TotalMinutes.ToString('F1')) minutes"
    
    # Déploiement
    Write-Info "🚀 Déploiement de l'écosystème..."
    docker-compose --profile prod up -d
    
    Start-Sleep 5
    Show-Status
}

function Start-ServiceBuild {
    param($Service)
    
    if (-not $Service) {
        Write-Error "Nom du service requis pour cette action"
        Write-Info "Services disponibles: accounting-service, admin-service, analytics-service, api-gateway, customer-service, gestion-commerciale-service, portfolio-institution-service"
        return
    }
    
    Write-Info "🔧 Rebuild du service: $Service"
    
    # Ajout du suffixe -service si nécessaire
    $ServiceFullName = $Service
    if (-not $Service.EndsWith("-service") -and $Service -ne "api-gateway") {
        $ServiceFullName = "$Service-service"
    }
    
    Write-Info "Construction de $ServiceFullName..."
    docker-compose --profile prod build $ServiceFullName
    
    Write-Info "Redémarrage de $ServiceFullName..."
    docker-compose --profile prod up -d --force-recreate $ServiceFullName
    
    Start-Sleep 3
    Write-Info "Logs du service $ServiceFullName:"
    docker-compose --profile prod logs --tail 10 $ServiceFullName
}

function Show-Status {
    Write-Info "📊 STATUT DES SERVICES:"
    docker-compose --profile prod ps
    
    Write-Host ""
    Write-Info "🔗 ENDPOINTS DISPONIBLES:"
    Write-Host "  • API Gateway:      http://localhost:8000" -ForegroundColor White
    Write-Host "  • Accounting:       http://localhost:3003" -ForegroundColor White
    Write-Host "  • Admin:            http://localhost:3001" -ForegroundColor White
    Write-Host "  • Analytics:        http://localhost:3002" -ForegroundColor White
    Write-Host "  • Customer:         http://localhost:3011" -ForegroundColor White
    Write-Host "  • Gestion Comm.:    http://localhost:3006" -ForegroundColor White
    Write-Host "  • Portfolio:        http://localhost:3005" -ForegroundColor White
    Write-Host "  • Prometheus:       http://localhost:9090" -ForegroundColor White
    Write-Host "  • Grafana:          http://localhost:4000" -ForegroundColor White
    Write-Host "  • PostgreSQL:       localhost:5432" -ForegroundColor White
}

function Show-Logs {
    param($Service)
    
    if ($Service) {
        $ServiceFullName = $Service
        if (-not $Service.EndsWith("-service") -and $Service -ne "api-gateway") {
            $ServiceFullName = "$Service-service"
        }
        Write-Info "📋 Logs de $ServiceFullName:"
        docker-compose --profile prod logs -f --tail 50 $ServiceFullName
    } else {
        Write-Info "📋 Logs de tous les services:"
        docker-compose --profile prod logs -f --tail 20
    }
}

function Stop-Services {
    Write-Info "🛑 Arrêt de tous les services..."
    docker-compose --profile prod down
    Write-Success "Services arrêtés"
}

# Vérification que Docker est disponible
try {
    docker --version | Out-Null
} catch {
    Write-Error "Docker n'est pas installé ou non accessible"
    exit 1
}

# Vérification que nous sommes dans le bon répertoire
if (-not (Test-Path "docker-compose.yml")) {
    Write-Error "Fichier docker-compose.yml non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
}

# Exécution de l'action
switch ($Action.ToLower()) {
    "clean" { Start-CleanBuild }
    "quick" { Start-QuickBuild }
    "service" { Start-ServiceBuild -Service $ServiceName }
    "status" { Show-Status }
    "logs" { Show-Logs -Service $ServiceName }
    "stop" { Stop-Services }
    "help" { Show-Help }
    default { 
        Write-Warning "Action inconnue: $Action"
        Show-Help 
    }
}

Write-Host ""
Write-Success "🎉 Opération terminée!"
Write-Info "Pour plus d'aide: .\build-wanzo.ps1 help"
