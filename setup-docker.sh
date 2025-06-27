#!/bin/bash

# Ce script initialise l'environnement Docker pour le projet Kiota-Suit

# Assurez-vous que le script est exécutable
# chmod +x setup-docker.sh

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Initialisation de l'environnement Docker pour Kiota-Suit...${NC}"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null
then
    echo -e "${RED}Docker n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null
then
    echo -e "${RED}Docker Compose n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Créer les fichiers .env à partir des exemples
echo -e "${YELLOW}Création des fichiers .env à partir des exemples...${NC}"

# Fonction pour copier les fichiers .env.example en .env
create_env_file() {
    local service=$1
    if [ -f "apps/$service/.env.example" ]; then
        if [ ! -f "apps/$service/.env" ]; then
            cp "apps/$service/.env.example" "apps/$service/.env"
            echo -e "${GREEN}Fichier .env créé pour $service${NC}"
        else
            echo -e "${YELLOW}Le fichier .env existe déjà pour $service${NC}"
        fi
    else
        echo -e "${RED}Fichier .env.example non trouvé pour $service${NC}"
    fi
}

# Créer les fichiers .env pour chaque service
create_env_file "admin-service"
create_env_file "accounting-service"
create_env_file "analytics-service"
create_env_file "api-gateway"
create_env_file "app_mobile_service"
create_env_file "portfolio-institution-service"
create_env_file "portfolio-sme-service"

# Rendre le script d'initialisation de base de données exécutable
echo -e "${YELLOW}Attribution des permissions d'exécution au script d'initialisation de BDD...${NC}"
chmod +x docker-entrypoint-initdb.d/create-multiple-dbs.sh

# Construction des images Docker
echo -e "${YELLOW}Construction des images Docker...${NC}"
echo -e "${YELLOW}Note: La construction peut prendre plusieurs minutes.${NC}"
echo -e "${YELLOW}Si vous rencontrez des erreurs liées aux dossiers 'dist' manquants ou des erreurs TypeScript, vérifiez que le build est correctement configuré dans chaque service.${NC}"

# Demander à l'utilisateur s'il souhaite construire tous les services ou un service spécifique
read -p "Voulez-vous construire tous les services? (O/n): " build_all

if [[ "$build_all" == "" || "$build_all" == "O" || "$build_all" == "o" ]]; then
    read -p "Voulez-vous ignorer la vérification des types TypeScript pour accélérer la construction? (o/N): " skip_typecheck
    
    if [[ "$skip_typecheck" == "o" || "$skip_typecheck" == "O" ]]; then
        echo -e "${YELLOW}Construction de tous les services sans vérification des types...${NC}"
        export DOCKER_BUILDKIT=1
        export TS_SKIP_TYPECHECK=1
        export NPM_CONFIG_LEGACY_PEER_DEPS=true
        docker-compose build
        unset TS_SKIP_TYPECHECK
        unset DOCKER_BUILDKIT
        unset NPM_CONFIG_LEGACY_PEER_DEPS
    else
        echo -e "${YELLOW}Construction de tous les services avec vérification des types...${NC}"
        docker-compose build
    fi
else
    services=("api-gateway" "admin-service" "accounting-service" "analytics-service" "portfolio-sme-service" "portfolio-institution-service" "app-mobile-service")
    
    echo -e "${YELLOW}Services disponibles:${NC}"
    for i in "${!services[@]}"; do
        echo -e "$(($i+1)). ${YELLOW}${services[$i]}${NC}"
    done
    
    read -p "Entrez le numéro du service à construire (1-7) ou 'q' pour quitter: " service_choice
    
    if [[ "$service_choice" == "q" ]]; then
        echo -e "${YELLOW}Construction annulée.${NC}"
        exit 0
    fi
    
    service_index=$(($service_choice-1))
    if [[ $service_index -ge 0 && $service_index -lt ${#services[@]} ]]; then
        selected_service="${services[$service_index]}"
        
        read -p "Voulez-vous ignorer la vérification des types TypeScript pour accélérer la construction? (o/N): " skip_typecheck
        
        if [[ "$skip_typecheck" == "o" || "$skip_typecheck" == "O" ]]; then
            echo -e "${YELLOW}Construction du service: $selected_service sans vérification des types...${NC}"
            export DOCKER_BUILDKIT=1
            export TS_SKIP_TYPECHECK=1
            export NPM_CONFIG_LEGACY_PEER_DEPS=true
            docker-compose build "$selected_service"
            unset TS_SKIP_TYPECHECK
            unset DOCKER_BUILDKIT
            unset NPM_CONFIG_LEGACY_PEER_DEPS
        else
            echo -e "${YELLOW}Construction du service: $selected_service avec vérification des types...${NC}"
            docker-compose build "$selected_service"
        fi
    else
        echo -e "${RED}Choix invalide. Construction annulée.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Initialisation terminée. Vous pouvez maintenant démarrer les services avec:${NC}"
echo -e "${YELLOW}docker-compose up -d${NC}"
echo -e "${GREEN}Pour visualiser les logs, utilisez:${NC}"
echo -e "${YELLOW}docker-compose logs -f${NC}"
