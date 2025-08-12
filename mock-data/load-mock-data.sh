#!/bin/bash
# Script pour charger les données mock dans les bases PostgreSQL via Docker
# Utilisation : ./load-mock-data.sh [service]

set -e

# Vérifier les arguments
SERVICE=$1
NETWORK="wanzo_backend_default" # Remplacer par votre réseau Docker si différent

# Fonction pour charger les données pour un service spécifique
load_service_data() {
  local service=$1
  local db_container=""
  local db_name=""
  local db_user="postgres"
  local db_password="postgres"
  
  echo "======================================================"
  echo "Chargement des données pour $service"
  echo "======================================================"
  
  # Déterminer le conteneur de base de données et les paramètres en fonction du service
  case $service in
    "customerService")
      db_container="kiota-customer-db"
      db_name="customer_service_db"
      ;;
    "accountingService")
      db_container="kiota-accounting-db"
      db_name="accounting_service_db"
      ;;
    "gestionCommercialeService")
      db_container="kiota-gestion-commerciale-db"
      db_name="gestion_commerciale_db"
      ;;
    *)
      echo "Service non reconnu : $service"
      exit 1
      ;;
  esac
  
  # Vérifier si le conteneur existe et est en cours d'exécution
  if ! docker ps | grep -q $db_container; then
    echo "Le conteneur $db_container n'est pas en cours d'exécution"
    exit 1
  fi
  
  # Générer le fichier SQL
  echo "Génération du fichier SQL pour $service..."
  docker run --rm -v "$(pwd)/mock-data:/app/mock-data" \
    --network $NETWORK \
    wanzo_backend-api-gateway \
    node /app/mock-data/db-loader.js generate $service
  
  # Copier le fichier SQL dans le conteneur
  echo "Copie du fichier SQL dans le conteneur..."
  docker cp "./mock-data/$service.sql" "$db_container:/tmp/$service.sql"
  
  # Exécuter le fichier SQL dans la base de données
  echo "Exécution du fichier SQL dans la base de données..."
  docker exec -it $db_container \
    psql -U $db_user -d $db_name -f "/tmp/$service.sql"
  
  echo "Données chargées avec succès pour $service"
}

# Fonction pour charger les données pour tous les services
load_all_data() {
  load_service_data "customerService"
  load_service_data "accountingService"
  load_service_data "gestionCommercialeService"
}

# Logique principale
if [ -z "$SERVICE" ]; then
  # Si aucun service n'est spécifié, charger toutes les données
  load_all_data
else
  # Sinon, charger seulement les données du service spécifié
  load_service_data "$SERVICE"
fi

echo "======================================================"
echo "Opération terminée avec succès"
echo "======================================================"
