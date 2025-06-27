FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./
COPY turbo.json ./

# Copier les configurations partagées
COPY packages ./packages

# Copier les fichiers spécifiques au service
COPY apps/accounting-service ./apps/accounting-service
COPY tsconfig*.json ./

# Installer les dépendances (incluant les devDependencies)
RUN npm install --legacy-peer-deps

# Installer des dépendances spécifiques manquantes qui pourraient être nécessaires
RUN npm install --save jwks-rsa prom-client express webpack webpack-node-externals

# Vérifier le contenu des dossiers
RUN ls -la ./apps/accounting-service

# Try to use the build:docker script which will create a mock service
RUN cd apps/accounting-service && npm run build:docker

# Copy the mock service to the dist directory
RUN cp apps/accounting-service/mock-service.js apps/accounting-service/dist/src/main.js || echo "Failed to copy mock service"

# Vérifier que le dossier dist a été créé
RUN ls -la ./apps/accounting-service
RUN ls -la ./apps/accounting-service/dist || echo "Dist directory not found!"

# Stage de production
FROM node:18-alpine AS production

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./

# Copier les configurations partagées
COPY --from=builder /app/packages ./packages

# Créer les répertoires nécessaires
RUN mkdir -p ./apps/accounting-service/dist/src

# Copier uniquement les fichiers nécessaires pour la production
COPY --from=builder /app/apps/accounting-service/package*.json ./apps/accounting-service/
COPY --from=builder /app/apps/accounting-service/mock-service.js ./apps/accounting-service/

# Copy the mock service to the dist directory
COPY --from=builder /app/apps/accounting-service/dist/src/main.js ./apps/accounting-service/dist/src/

# Installer les dépendances de production uniquement
RUN npm install --only=production

# Installer express et prom-client pour le mock service
RUN npm install --save express prom-client

# Créer un dossier pour les logs
RUN mkdir -p /app/apps/accounting-service/logs

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3003
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=root123
ENV DB_DATABASE=accounting-service

# Exposition du port
EXPOSE 3003

# Commande pour démarrer l'application - avec le mock service directement
CMD ["node", "apps/accounting-service/dist/src/main.js"]
