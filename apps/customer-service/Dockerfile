FROM node:18-alpine AS development

WORKDIR /usr/src/app

# Copie uniquement les fichiers nécessaires pour installer les dépendances
COPY apps/customer-service/package*.json ./
COPY apps/customer-service/tsconfig*.json ./

# Copie le code source (hors dossiers ignorés par .dockerignore)
COPY apps/customer-service/src ./src

# Si besoin de tests unitaires, décommentez la ligne suivante
# COPY test ./test

# Copie les fichiers de configuration utiles
COPY apps/customer-service/.env* ./

RUN npm install

RUN npm run build

FROM node:18-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY apps/customer-service/package*.json ./

RUN npm install --only=production

COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3011
EXPOSE 9071

CMD ["node", "dist/main"]
