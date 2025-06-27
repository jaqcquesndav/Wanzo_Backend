#!/bin/bash
# fix-dependencies.sh - Script pour résoudre les conflits de dépendances NestJS
# Usage: ./fix-dependencies.sh [service-name]

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ "$1" == "" ]; then
  echo -e "${YELLOW}Utilisation: ./fix-dependencies.sh [service-name]${NC}"
  echo -e "${YELLOW}Services disponibles: admin-service, accounting-service, analytics-service, api-gateway, app_mobile_service, portfolio-institution-service, portfolio-sme-service${NC}"
  exit 1
fi

SERVICE_NAME=$1

echo -e "${GREEN}Résolution des conflits de dépendances pour $SERVICE_NAME...${NC}"

# Vérifier si le service existe
if [ ! -d "apps/$SERVICE_NAME" ]; then
  echo -e "${RED}Service '$SERVICE_NAME' introuvable. Vérifiez le nom et réessayez.${NC}"
  exit 1
fi

cd "apps/$SERVICE_NAME"

echo -e "${YELLOW}Installation des dépendances avec --legacy-peer-deps...${NC}"
npm install --legacy-peer-deps

echo -e "${YELLOW}Installation des dépendances NestJS spécifiques...${NC}"
npm install --save @nestjs/microservices@^10.3.0 --legacy-peer-deps

echo -e "${YELLOW}Installation des autres dépendances communes...${NC}"
npm install --save jwks-rsa prom-client kafkajs --legacy-peer-deps

echo -e "${GREEN}Dépendances installées avec succès pour $SERVICE_NAME.${NC}"
echo -e "${YELLOW}Vous pouvez maintenant réessayer de construire le service avec Docker:${NC}"
echo -e "${YELLOW}  docker-compose build $SERVICE_NAME${NC}"
