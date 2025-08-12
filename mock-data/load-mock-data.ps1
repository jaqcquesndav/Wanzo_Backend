# Script PowerShell pour charger les données mock dans les bases PostgreSQL via Docker
# Utilisation : .\load-mock-data.ps1 [service]

param (
    [Parameter(Mandatory=$false)]
    [string]$Service
)

# Réseau Docker par défaut (à modifier selon votre configuration)
$NETWORK = "wanzo_backend_default"

# Fonction pour charger les données pour un service spécifique
function Load-ServiceData {
    param (
        [string]$ServiceName
    )
    
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host "Chargement des données pour $ServiceName" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
    
    $dbContainer = ""
    $dbName = ""
    $dbUser = "postgres"
    $dbPassword = "postgres"
    
    # Déterminer le conteneur de base de données et les paramètres en fonction du service
    switch ($ServiceName) {
        "customerService" {
            $dbContainer = "kiota-customer-db"
            $dbName = "customer_service_db"
        }
        "accountingService" {
            $dbContainer = "kiota-accounting-db"
            $dbName = "accounting_service_db"
        }
        "gestionCommercialeService" {
            $dbContainer = "kiota-gestion-commerciale-db"
            $dbName = "gestion_commerciale_db"
        }
        default {
            Write-Host "Service non reconnu : $ServiceName" -ForegroundColor Red
            exit 1
        }
    }
    
    # Vérifier si le conteneur existe et est en cours d'exécution
    $containerRunning = docker ps | Select-String -Pattern $dbContainer
    if (-not $containerRunning) {
        Write-Host "Le conteneur $dbContainer n'est pas en cours d'exécution" -ForegroundColor Red
        exit 1
    }
    
    # Générer le fichier SQL
    Write-Host "Génération du fichier SQL pour $ServiceName..." -ForegroundColor Cyan
    docker run --rm -v "${PWD}/mock-data:/app/mock-data" `
        --network $NETWORK `
        wanzo_backend-api-gateway `
        node /app/mock-data/db-loader.js generate $ServiceName
    
    # Copier le fichier SQL dans le conteneur
    Write-Host "Copie du fichier SQL dans le conteneur..." -ForegroundColor Cyan
    docker cp "./mock-data/$ServiceName.sql" "$dbContainer:/tmp/$ServiceName.sql"
    
    # Exécuter le fichier SQL dans la base de données
    Write-Host "Exécution du fichier SQL dans la base de données..." -ForegroundColor Cyan
    docker exec -it $dbContainer `
        psql -U $dbUser -d $dbName -f "/tmp/$ServiceName.sql"
    
    Write-Host "Données chargées avec succès pour $ServiceName" -ForegroundColor Green
}

# Fonction pour charger les données pour tous les services
function Load-AllData {
    Load-ServiceData -ServiceName "customerService"
    Load-ServiceData -ServiceName "accountingService"
    Load-ServiceData -ServiceName "gestionCommercialeService"
}

# Logique principale
if (-not $Service) {
    # Si aucun service n'est spécifié, charger toutes les données
    Load-AllData
} else {
    # Sinon, charger seulement les données du service spécifié
    Load-ServiceData -ServiceName $Service
}

Write-Host "======================================================" -ForegroundColor Green
Write-Host "Opération terminée avec succès" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
