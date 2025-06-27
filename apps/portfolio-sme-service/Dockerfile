FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./
COPY turbo.json ./

# Copier les configurations partagées
COPY packages ./packages

# Copier les fichiers spécifiques au service
COPY apps/portfolio-sme-service ./apps/portfolio-sme-service
COPY tsconfig*.json ./

# Installer les dépendances (incluant les devDependencies)
RUN npm install

# Installer des dépendances spécifiques manquantes qui pourraient être nécessaires
RUN npm install --save jwks-rsa prom-client kafkajs --legacy-peer-deps
RUN npm install --save @nestjs/microservices@^10.3.0 --legacy-peer-deps

# Vérifier le contenu des dossiers
RUN ls -la ./apps/portfolio-sme-service

# Construire l'application - exécuter d'abord nest build directement
RUN if [ "$TS_SKIP_TYPECHECK" = "1" ]; then \
    echo "Building with type checking skipped..." && \
    cd apps/portfolio-sme-service && npm run build:docker; \
    else \
    cd apps/portfolio-sme-service && npm run build; \
    fi

# Puis utiliser turbo pour s'assurer que toutes les dépendances sont construites
RUN npx turbo build --filter=portfolio-sme-service

# Vérifier que le dossier dist a été créé
RUN ls -la ./apps/portfolio-sme-service
RUN ls -la ./apps/portfolio-sme-service/dist || echo "Dist directory not found!"

# Stage de production
FROM node:18-alpine AS production

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./

# Copier les configurations partagées
COPY --from=builder /app/packages ./packages

# Créer les répertoires nécessaires
RUN mkdir -p ./apps/portfolio-sme-service/dist

# Copier uniquement les fichiers nécessaires pour la production
COPY --from=builder /app/apps/portfolio-sme-service/package*.json ./apps/portfolio-sme-service/

# Utiliser une commande shell pour copier les fichiers avec une gestion d'erreur
RUN if [ -d "/app/apps/portfolio-sme-service/dist" ]; then \
    cp -r /app/apps/portfolio-sme-service/dist/* ./apps/portfolio-sme-service/dist/ || echo "No dist files to copy"; \
    fi

# Copier les fichiers de configuration
RUN if [ -f "/app/apps/portfolio-sme-service/nest-cli.json" ]; then \
    cp /app/apps/portfolio-sme-service/nest-cli.json ./apps/portfolio-sme-service/nest-cli.json || echo "Failed to copy nest-cli.json"; \
    fi

RUN if [ -f "/app/apps/portfolio-sme-service/.env.example" ]; then \
    cp /app/apps/portfolio-sme-service/.env.example ./apps/portfolio-sme-service/.env.example || echo "Failed to copy .env.example"; \
    fi

# Installer les dépendances de production uniquement
RUN npm install --only=production

# Créer un dossier pour les logs
RUN mkdir -p /app/apps/portfolio-sme-service/logs

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3004
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=root123
ENV DB_DATABASE=portfolio-sme-service

# Exposition du port
EXPOSE 3004

# Commande pour démarrer l'application - avec gestion d'erreur pour trouver le bon chemin
CMD ["sh", "-c", "if [ -f 'apps/portfolio-sme-service/dist/src/main.js' ]; then \
    node apps/portfolio-sme-service/dist/src/main.js; \
    elif [ -f 'apps/portfolio-sme-service/dist/main.js' ]; then \
    node apps/portfolio-sme-service/dist/main.js; \
    elif [ -f 'apps/portfolio-sme-service/dist/apps/portfolio-sme-service/src/main.js' ]; then \
    node apps/portfolio-sme-service/dist/apps/portfolio-sme-service/src/main.js; \
    else \
    echo 'Could not find main.js file to execute' && ls -R apps/portfolio-sme-service/dist && exit 1; \
    fi"]
