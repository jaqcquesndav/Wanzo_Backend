#!/bin/bash
# Script d'optimisation de l'architecture Yarn Workspaces
# Ce script configure une architecture robuste pour le monorepo Wanzobe

echo "🚀 OPTIMISATION ARCHITECTURE YARN WORKSPACES - WANZOBE BACKEND"
echo "=============================================================="

# 1. Nettoyage des node_modules pour reset complet
echo "📦 Nettoyage des dépendances existantes..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "yarn.lock" -type f -delete 2>/dev/null || true

# 2. Structure des packages optimisée
echo "📂 Vérification de la structure des packages..."
PACKAGES=(
    "packages/shared"
    "packages/types" 
    "packages/tsconfig"
    "packages/customer-sync"
)

for package in "${PACKAGES[@]}"; do
    if [ -d "$package" ]; then
        echo "✅ Package existant: $package"
    else
        echo "❌ Package manquant: $package"
    fi
done

# 3. Services disponibles
echo "🏗️  Services détectés:"
SERVICES=(
    "apps/accounting-service"
    "apps/gestion_commerciale_service" 
    "apps/admin-service"
    "apps/customer-service"
    "apps/api-gateway"
    "apps/analytics-service"
    "apps/portfolio-institution-service"
)

for service in "${SERVICES[@]}"; do
    if [ -d "$service" ]; then
        echo "✅ Service: $service"
    else
        echo "❌ Service manquant: $service"
    fi
done

# 4. Installation optimisée avec Yarn workspaces
echo "⚡ Installation avec Yarn Workspaces optimisée..."
yarn install --immutable --inline-builds

# 5. Build des packages partagés en premier
echo "🔨 Build des packages partagés..."
yarn workspace @wanzobe/shared build
yarn workspace @wanzobe/types build

# 6. Vérification des liens de workspace
echo "🔗 Vérification des liens Yarn workspace..."
yarn workspaces info

echo "✅ Optimisation terminée!"
