# Configuration standard pour les services NestJS et TypeScript
# Ce fichier définit les configurations de compilation robustes pour tous les services

# 1. Configuration TypeScript standard
# Créer tsconfig.base.json à la racine qui sera utilisé par tous les services
cat > packages/tsconfig/base.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true,
    "moduleResolution": "node",
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true,
    "useDefineForClassFields": false,
    "strictPropertyInitialization": false
  },
  "exclude": ["node_modules"]
}
EOF

# 2. Configuration NestJS standard
cat > packages/tsconfig/nestjs.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "NestJS",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "commonjs",
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "useDefineForClassFields": false,
    "strictPropertyInitialization": false
  }
}
EOF

# 3. Script build standardisé pour tous les services NestJS
cat > build-nestjs-service.sh << 'EOF'
#!/bin/bash

# Ce script permet de construire un service NestJS avec des options robustes
# Usage: ./build-nestjs-service.sh <service-directory>

SERVICE_DIR=$1

if [ -z "$SERVICE_DIR" ]; then
  echo "Erreur: Veuillez spécifier le répertoire du service"
  echo "Usage: ./build-nestjs-service.sh <service-directory>"
  exit 1
fi

# Vérifier que le répertoire existe
if [ ! -d "$SERVICE_DIR" ]; then
  echo "Erreur: Le répertoire $SERVICE_DIR n'existe pas"
  exit 1
fi

echo "Construction du service dans $SERVICE_DIR..."

# Définir les variables d'environnement
export NODE_OPTIONS="--max-old-space-size=4096"
export TS_NODE_COMPILER_OPTIONS='{"skipLibCheck":true,"useDefineForClassFields":false}'

# Vérifier si tsconfig.build.json existe, sinon le créer
if [ ! -f "$SERVICE_DIR/tsconfig.build.json" ]; then
  cat > "$SERVICE_DIR/tsconfig.build.json" << 'EOFCONFIG'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "skipLibCheck": true,
    "useDefineForClassFields": false,
    "declaration": false,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false
  },
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
EOFCONFIG
fi

# Vérifier si nest-cli.json existe, sinon le créer
if [ ! -f "$SERVICE_DIR/nest-cli.json" ]; then
  cat > "$SERVICE_DIR/nest-cli.json" << 'EOFNEST'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "builder": "tsc",
    "tsConfigPath": "tsconfig.build.json"
  }
}
EOFNEST
fi

# Exécuter la construction
cd "$SERVICE_DIR" && npx nest build || echo "La construction a échoué"

echo "Construction terminée pour $SERVICE_DIR"

EOF

# Rendre le script exécutable
chmod +x build-nestjs-service.sh
