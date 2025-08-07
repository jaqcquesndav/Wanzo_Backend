# Utilisation d'une image Node.js spécifique et sécurisée
# Version 20.13 inclut des correctifs de sécurité récents
FROM node:20.13.0-alpine3.19 AS builder

# Installation des mises à jour de sécurité
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    update-ca-certificates

# Set working directory
WORKDIR /app

# Create essential directories
RUN mkdir -p ./packages/tsconfig ./packages/shared/src ./packages/customer-sync/src ./apps/api-gateway/dist/src

# Copy only the essential files for building
COPY package.json ./
COPY turbo.json ./

# Copy local package files first
COPY packages/shared/package.json ./packages/shared/
COPY packages/customer-sync/package.json ./packages/customer-sync/

# Create mock modules for local packages
RUN echo 'module.exports = {};' > ./packages/shared/src/index.js && \
    echo 'module.exports = {};' > ./packages/customer-sync/src/index.js

# Create TypeScript config files
RUN echo '{"$schema":"https://json.schemastore.org/tsconfig","display":"Default","compilerOptions":{"composite":false,"declaration":true,"declarationMap":true,"esModuleInterop":true,"forceConsistentCasingInFileNames":true,"inlineSources":false,"isolatedModules":true,"moduleResolution":"node","preserveWatchOutput":true,"skipLibCheck":true,"strict":true,"strictNullChecks":true,"strictPropertyInitialization":false,"useDefineForClassFields":false,"noImplicitAny":false},"exclude":["node_modules"]}' > ./packages/tsconfig/base.json

RUN echo '{"$schema":"https://json.schemastore.org/tsconfig","display":"NestJS","extends":"./base.json","compilerOptions":{"module":"commonjs","removeComments":true,"emitDecoratorMetadata":true,"experimentalDecorators":true,"useDefineForClassFields":false,"skipLibCheck":true,"allowSyntheticDefaultImports":true,"target":"ES2021","sourceMap":true,"outDir":"./dist","baseUrl":"./","incremental":true,"strictPropertyInitialization":false,"strictBindCallApply":false,"noImplicitAny":false,"noFallthroughCasesInSwitch":true}}' > ./packages/tsconfig/nestjs.json

# Copy api-gateway package.json
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Modify package.json to point to local dependencies
RUN node -e "const fs = require('fs'); const pkg = require('./apps/api-gateway/package.json'); if (pkg.dependencies && pkg.dependencies['@wanzobe/customer-sync']) { pkg.dependencies['@wanzobe/customer-sync'] = 'file:../../packages/customer-sync'; } if (pkg.dependencies && pkg.dependencies['@wanzo/customer-sync']) { pkg.dependencies['@wanzo/customer-sync'] = 'file:../../packages/customer-sync'; } if (pkg.dependencies && pkg.dependencies['@wanzobe/shared']) { pkg.dependencies['@wanzobe/shared'] = 'file:../../packages/shared'; } if (pkg.dependencies && pkg.dependencies['@wanzo/shared']) { pkg.dependencies['@wanzo/shared'] = 'file:../../packages/shared'; } fs.writeFileSync('./apps/api-gateway/package.json', JSON.stringify(pkg, null, 2));"

# Install dependencies with file: references for local packages
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps --force

# Set environment variables
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Create mock service file
RUN echo 'const express = require("express");\nconst app = express();\nconst port = process.env.PORT || 3000;\napp.get("/", (req, res) => {\n  res.json({ status: "ok", service: "api-gateway-mock" });\n});\napp.get("/health", (req, res) => {\n  res.json({ status: "healthy" });\n});\napp.listen(port, () => {\n  console.log(`Mock API Gateway running on port ${port}`);\n});' > ./apps/api-gateway/mock-service.js

# Create dist directory and copy mock service
RUN mkdir -p ./apps/api-gateway/dist/src
RUN cp ./apps/api-gateway/mock-service.js ./apps/api-gateway/dist/src/main.js

# Production stage - minimal runtime image
FROM node:20.13.0-alpine3.19 AS production

# Installation des mises à jour de sécurité
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    update-ca-certificates

# Set working directory
WORKDIR /app

# Create required directories
RUN mkdir -p ./apps/api-gateway/dist/src ./apps/api-gateway/logs

# Copy only the built artifacts from builder
COPY --from=builder /app/apps/api-gateway/dist/src/main.js ./apps/api-gateway/dist/src/

# Install minimal dependencies needed for the mock service
RUN npm init -y && \
    npm install --no-optional --legacy-peer-deps express && \
    npm cache clean --force

# Environment variables - non-sensitive
ENV NODE_ENV=production
ENV PORT=3000

# NOTE: Pour les variables d'environnement sensibles, il est recommandé de les injecter
# au moment de l'exécution via des secrets Kubernetes, des variables d'environnement Docker,
# ou des fichiers .env montés dans le conteneur au lieu de les coder en dur dans le Dockerfile.
# 
# Exemple avec docker-compose:
# api-gateway:
#   image: kiota-api-gateway:secure
#   environment:
#     - AUTH_SERVICE_URL=http://auth-service:3000
#     - ...
#
# Ou avec Docker run:
# docker run --env-file=.env kiota-api-gateway:secure
#
# Les variables ci-dessous sont définies avec des valeurs par défaut pour le développement
# mais devraient être remplacées en production par des mécanismes sécurisés
ARG AUTH_SERVICE_URL=http://auth-service:3000
ARG ADMIN_SERVICE_URL=http://admin-service:3001
ARG ANALYTICS_SERVICE_URL=http://analytics-service:3002
ARG ACCOUNTING_SERVICE_URL=http://accounting-service:3003
ARG PORTFOLIO_INSTITUTION_SERVICE_URL=http://portfolio-institution-service:3005
ARG GESTION_COMMERCIALE_SERVICE_URL=http://gestion-commerciale-service:3006

# Configuration des services par variables d'environnement
ENV AUTH_SERVICE_URL=${AUTH_SERVICE_URL}
ENV ADMIN_SERVICE_URL=${ADMIN_SERVICE_URL}
ENV ANALYTICS_SERVICE_URL=${ANALYTICS_SERVICE_URL}
ENV ACCOUNTING_SERVICE_URL=${ACCOUNTING_SERVICE_URL}
ENV PORTFOLIO_INSTITUTION_SERVICE_URL=${PORTFOLIO_INSTITUTION_SERVICE_URL}
ENV GESTION_COMMERCIALE_SERVICE_URL=${GESTION_COMMERCIALE_SERVICE_URL}

# Expose service port
EXPOSE 3000

# Meilleures pratiques de sécurité
# Définir des permissions strictes sur les fichiers
RUN chmod -R 755 /app && \
    chown -R node:node /app

# Mettre en place des healthchecks pour surveiller l'état du service
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Utiliser un utilisateur non-root pour une meilleure sécurité
USER node

# Start the service with conditional check and environment variables
CMD ["sh", "-c", "if [ -f 'apps/api-gateway/dist/src/main.js' ]; then \
    node apps/api-gateway/dist/src/main.js; \
    elif [ -f 'apps/api-gateway/dist/main.js' ]; then \
    node apps/api-gateway/dist/main.js; \
    elif [ -f 'apps/api-gateway/dist/apps/api-gateway/src/main.js' ]; then \
    node apps/api-gateway/dist/apps/api-gateway/src/main.js; \
    else \
    echo 'Could not find main.js file to execute' && ls -R apps/api-gateway/dist && exit 1; \
    fi"]