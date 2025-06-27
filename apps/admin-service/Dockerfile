FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./
COPY turbo.json ./

# Copier les configurations partagées
COPY packages ./packages

# Copier les fichiers spécifiques au service
COPY apps/admin-service ./apps/admin-service
COPY tsconfig*.json ./

# Installer les dépendances (incluant les devDependencies)
RUN npm install

# Installer des dépendances spécifiques manquantes qui pourraient être nécessaires
RUN npm install --save jwks-rsa prom-client --legacy-peer-deps

# Vérifier le contenu des dossiers
RUN ls -la ./apps/admin-service

# Construire l'application - exécuter d'abord nest build directement
RUN cd apps/admin-service && npx nest build

# Puis utiliser turbo pour s'assurer que toutes les dépendances sont construites
RUN npx turbo build --filter=admin-service

# Vérifier que le dossier dist a été créé
RUN ls -la ./apps/admin-service
RUN ls -la ./apps/admin-service/dist || echo "Dist directory not found!"

# Stage de production
FROM node:18-alpine AS production

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./

# Copier les configurations partagées
COPY --from=builder /app/packages ./packages

# Créer les répertoires nécessaires
RUN mkdir -p ./apps/admin-service/dist

# Copier uniquement les fichiers nécessaires pour la production
COPY --from=builder /app/apps/admin-service/package*.json ./apps/admin-service/

# Utiliser une commande shell pour copier les fichiers avec une gestion d'erreur
RUN if [ -d "/app/apps/admin-service/dist" ]; then \
    cp -r /app/apps/admin-service/dist/* ./apps/admin-service/dist/ || echo "No dist files to copy"; \
    fi

# Copier les fichiers de configuration
RUN if [ -f "/app/apps/admin-service/nest-cli.json" ]; then \
    cp /app/apps/admin-service/nest-cli.json ./apps/admin-service/nest-cli.json || echo "Failed to copy nest-cli.json"; \
    fi

RUN if [ -f "/app/apps/admin-service/.env.example" ]; then \
    cp /app/apps/admin-service/.env.example ./apps/admin-service/.env.example || echo "Failed to copy .env.example"; \
    fi

# Installer les dépendances de production uniquement
RUN npm install --only=production

# Créer un dossier pour les logs
RUN mkdir -p /app/apps/admin-service/logs

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=root123
ENV DB_DATABASE=admin-service

# Exposition du port
EXPOSE 3001

# Commande pour démarrer l'application - avec gestion d'erreur pour trouver le bon chemin
CMD ["sh", "-c", "if [ -f 'apps/admin-service/dist/src/main.js' ]; then \
    node apps/admin-service/dist/src/main.js; \
    elif [ -f 'apps/admin-service/dist/main.js' ]; then \
    node apps/admin-service/dist/main.js; \
    elif [ -f 'apps/admin-service/dist/apps/admin-service/src/main.js' ]; then \
    node apps/admin-service/dist/apps/admin-service/src/main.js; \
    else \
    echo 'Could not find main.js file to execute' && ls -R apps/admin-service/dist && exit 1; \
    fi"]
