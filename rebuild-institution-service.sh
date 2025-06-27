#!/bin/bash
# rebuild-institution-service.sh - Script pour reconstruire uniquement le service portfolio-institution-service avec l'implémentation mock

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Reconstruction du service portfolio-institution-service avec l'implémentation temporaire...${NC}"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si le mock-service.js existe
if [ ! -f "apps/portfolio-institution-service/mock-service.js" ]; then
    echo -e "${RED}Le fichier mock-service.js est manquant. Veuillez le créer d'abord.${NC}"
    exit 1
fi

echo -e "${YELLOW}Construction du service portfolio-institution-service...${NC}"
docker-compose build portfolio-institution-service

echo -e "${GREEN}Service portfolio-institution-service reconstruit avec succès!${NC}"
echo -e "${YELLOW}Pour démarrer uniquement ce service:${NC}"
echo -e "${YELLOW}  docker-compose up -d portfolio-institution-service${NC}"
echo -e "${YELLOW}Pour vérifier les logs:${NC}"
echo -e "${YELLOW}  docker-compose logs -f portfolio-institution-service${NC}"
