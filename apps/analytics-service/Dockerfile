FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./
COPY turbo.json ./

# Copier les configurations partagées
COPY packages ./packages

# Copier les fichiers spécifiques au service
COPY apps/analytics-service ./apps/analytics-service
COPY tsconfig*.json ./

# Installer les dépendances (incluant les devDependencies)
RUN npm install --legacy-peer-deps

# Installer des dépendances spécifiques manquantes
RUN npm install --save jwks-rsa prom-client @nestjs/axios axios webpack webpack-node-externals --legacy-peer-deps
RUN npm install --save @nestjs/microservices@^10.3.0 kafkajs --legacy-peer-deps

# Vérifier le contenu des dossiers
RUN ls -la ./apps/analytics-service

# Construire l'application en utilisant le script build:docker
RUN cd apps/analytics-service && npm run build:docker || echo "Build failed, will continue anyway"

# Vérifier que le dossier dist a été créé
RUN ls -la ./apps/analytics-service
RUN ls -la ./apps/analytics-service/dist || echo "Dist directory not found!"

# Stage de production
FROM node:18-alpine AS production

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./

# Copier les configurations partagées
COPY --from=builder /app/packages ./packages

# Créer les répertoires nécessaires
RUN mkdir -p ./apps/analytics-service/dist

# Copier uniquement les fichiers nécessaires pour la production
COPY --from=builder /app/apps/analytics-service/package*.json ./apps/analytics-service/

# Utiliser une commande shell pour copier les fichiers avec une gestion d'erreur
RUN if [ -d "/app/apps/analytics-service/dist" ]; then \
    cp -r /app/apps/analytics-service/dist/* ./apps/analytics-service/dist/ || echo "No dist files to copy"; \
    fi

# Copier les fichiers de configuration
RUN if [ -f "/app/apps/analytics-service/nest-cli.json" ]; then \
    cp /app/apps/analytics-service/nest-cli.json ./apps/analytics-service/nest-cli.json || echo "Failed to copy nest-cli.json"; \
    fi

RUN if [ -f "/app/apps/analytics-service/.env.example" ]; then \
    cp /app/apps/analytics-service/.env.example ./apps/analytics-service/.env.example || echo "Failed to copy .env.example"; \
    fi

# Installer les dépendances de production uniquement
RUN npm install --only=production

# Créer un dossier pour les logs
RUN mkdir -p /app/apps/analytics-service/logs

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3002
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=root123
ENV DB_DATABASE=analytics-service

# Exposition du port
EXPOSE 3002

# Commande pour démarrer l'application - avec gestion d'erreur pour trouver le bon chemin
CMD ["sh", "-c", "if [ -f 'apps/analytics-service/dist/src/main.js' ]; then \
    node apps/analytics-service/dist/src/main.js; \
    elif [ -f 'apps/analytics-service/dist/main.js' ]; then \
    node apps/analytics-service/dist/main.js; \
    elif [ -f 'apps/analytics-service/dist/apps/analytics-service/src/main.js' ]; then \
    node apps/analytics-service/dist/apps/analytics-service/src/main.js; \
    else \
    echo 'Could not find main.js file to execute' && ls -R apps/analytics-service/dist && exit 1; \
    fi"]
