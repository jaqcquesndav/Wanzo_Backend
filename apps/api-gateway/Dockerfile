FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./
COPY turbo.json ./

# Copier les configurations partagées
COPY packages ./packages

# Copier les fichiers spécifiques au service
COPY apps/api-gateway ./apps/api-gateway
COPY tsconfig*.json ./

# Installer les dépendances (incluant les devDependencies)
RUN npm install

# Installer des dépendances spécifiques manquantes qui pourraient être nécessaires
RUN npm install --save jwks-rsa prom-client

# Vérifier le contenu des dossiers
RUN ls -la ./apps/api-gateway

# Construire l'application directement si nécessaire
RUN cd apps/api-gateway && npm run build || echo "Using turbo build"

# Puis utiliser turbo pour s'assurer que toutes les dépendances sont construites
RUN npx turbo build --filter=api-gateway

# Vérifier que le dossier dist a été créé
RUN ls -la ./apps/api-gateway
RUN ls -la ./apps/api-gateway/dist || echo "Dist directory not found!"

# Stage de production
FROM node:18-alpine AS production

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./

# Copier les configurations partagées
COPY --from=builder /app/packages ./packages

# Créer les répertoires nécessaires
RUN mkdir -p ./apps/api-gateway/dist

# Copier uniquement les fichiers nécessaires pour la production
COPY --from=builder /app/apps/api-gateway/package*.json ./apps/api-gateway/

# Utiliser une commande shell pour copier les fichiers avec une gestion d'erreur
RUN if [ -d "/app/apps/api-gateway/dist" ]; then \
    cp -r /app/apps/api-gateway/dist/* ./apps/api-gateway/dist/ || echo "No dist files to copy"; \
    fi

# Copier le fichier .env.example s'il existe
RUN if [ -f "/app/apps/api-gateway/.env.example" ]; then \
    cp /app/apps/api-gateway/.env.example ./apps/api-gateway/.env.example || echo "Failed to copy .env.example"; \
    fi

# Installer les dépendances de production uniquement
RUN npm install --only=production

# Créer un dossier pour les logs
RUN mkdir -p /app/apps/api-gateway/logs

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000
ENV AUTH_SERVICE_URL=http://auth-service:3000
ENV ADMIN_SERVICE_URL=http://admin-service:3001
ENV ANALYTICS_SERVICE_URL=http://analytics-service:3002
ENV ACCOUNTING_SERVICE_URL=http://accounting-service:3003
ENV PORTFOLIO_SME_SERVICE_URL=http://portfolio-sme-service:3004
ENV PORTFOLIO_INSTITUTION_SERVICE_URL=http://portfolio-institution-service:3005
ENV APP_MOBILE_SERVICE_URL=http://app-mobile-service:3006

# Exposition du port
EXPOSE 3000

# Commande pour démarrer l'application - avec gestion d'erreur pour trouver le bon chemin
CMD ["sh", "-c", "if [ -f 'apps/api-gateway/dist/src/main.js' ]; then \
    node apps/api-gateway/dist/src/main.js; \
    elif [ -f 'apps/api-gateway/dist/main.js' ]; then \
    node apps/api-gateway/dist/main.js; \
    elif [ -f 'apps/api-gateway/dist/apps/api-gateway/src/main.js' ]; then \
    node apps/api-gateway/dist/apps/api-gateway/src/main.js; \
    else \
    echo 'Could not find main.js file to execute' && ls -R apps/api-gateway/dist && exit 1; \
    fi"]
