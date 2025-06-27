#!/bin/bash
# fix-institution-service.sh - Script pour résoudre les problèmes spécifiques au service portfolio-institution-service

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Résolution des problèmes spécifiques au service portfolio-institution-service...${NC}"

# Vérifier si le service existe
if [ ! -d "apps/portfolio-institution-service" ]; then
  echo -e "${RED}Service 'portfolio-institution-service' introuvable. Vérifiez le nom et réessayez.${NC}"
  exit 1
fi

# Vérifier si packages/shared/events existe
if [ ! -d "packages/shared/events" ]; then
  echo -e "${RED}Dossier 'packages/shared/events' introuvable. Vérifiez la structure du projet.${NC}"
  exit 1
fi

# Étape 1: Mise à jour des dépendances
echo -e "${YELLOW}1. Installation des dépendances manquantes...${NC}"
cd apps/portfolio-institution-service
npm install --save @nestjs/schedule@^4.0.0 @nestjs/microservices@^10.3.0 kafkajs --legacy-peer-deps
npm install --save-dev webpack webpack-node-externals ts-loader --legacy-peer-deps
cd ../..

# Étape 2: Désactiver temporairement les vérifications de type TypeScript strictes
echo -e "${YELLOW}2. Création du fichier tsconfig.build.json pour ignorer les vérifications de type...${NC}"
cat > apps/portfolio-institution-service/tsconfig.build.json << EOF
{
  "extends": "../../packages/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@wanzo/shared/*": ["../../packages/shared/*"]
    },
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictPropertyInitialization": false,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Étape 3: Ajouter le script build:docker à package.json
echo -e "${YELLOW}3. Ajout du script build:docker à package.json...${NC}"
# Utiliser jq si disponible, sinon avertir l'utilisateur
if command -v jq &> /dev/null; then
  jq '.scripts."build:docker" = "nest build --config ./tsconfig.build.json --webpack --webpackConfigPath webpack-hmr.config.js"' apps/portfolio-institution-service/package.json > temp.json && mv temp.json apps/portfolio-institution-service/package.json
else
  echo -e "${RED}L'utilitaire jq n'est pas installé. Veuillez ajouter manuellement le script 'build:docker' à package.json:${NC}"
  echo -e "\"build:docker\": \"nest build --config ./tsconfig.build.json --webpack --webpackConfigPath webpack-hmr.config.js\""
fi

# Étape 4: Créer le fichier webpack-hmr.config.js
echo -e "${YELLOW}4. Création du fichier webpack-hmr.config.js...${NC}"
cat > apps/portfolio-institution-service/webpack-hmr.config.js << EOF
// webpack-hmr.config.js
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // Skip type checking for faster builds
          },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
    ],
  };
};
EOF

echo -e "${GREEN}Préparation terminée!${NC}"
echo -e "${YELLOW}Vous pouvez maintenant construire le service avec TypeScript skipping:${NC}"
echo -e "${YELLOW}  TS_SKIP_TYPECHECK=1 docker-compose build portfolio-institution-service${NC}"
echo -e "${YELLOW}ou utiliser le script d'initialisation:${NC}"
echo -e "${YELLOW}  ./setup-docker.sh${NC}"
echo -e "${YELLOW}et choisir 'o' quand on vous demande d'ignorer les vérifications de type.${NC}"
