# ===========================================
# WANZOBE BACKEND - DOCKERFILE STANDARDISÃ‰
# Service: customer-service
# OptimisÃ© pour Yarn Workspaces + Multi-stage
# ===========================================

# ======== STAGE 1: BUILD ========
FROM node:20.13.0-alpine3.19 AS builder

# MÃ©tadonnÃ©es
LABEL maintainer="Wanzobe DevOps Team"
LABEL service="customer-service"
LABEL stage="builder"

# Installation des dÃ©pendances systÃ¨me pour le build
RUN apk update && apk upgrade && \
    apk add --no-cache \
        ca-certificates \
        python3 \
        make \
        g++ \
        curl \
    && rm -rf /var/cache/apk/*

# Configuration du rÃ©pertoire de travail
WORKDIR /app

# Copie des fichiers de configuration du monorepo
COPY package.json yarn.lock ./
COPY turbo.json ./

# Copie des packages partagÃ©s (prioritÃ© pour workspace linking)
COPY packages/shared ./packages/shared/
COPY packages/types ./packages/types/
COPY packages/tsconfig ./packages/tsconfig/

# Copie du service spÃ©cifique
COPY apps/customer-service/package.json ./apps/customer-service/

# Installation des dÃ©pendances avec Yarn Workspaces
RUN yarn install --frozen-lockfile --ignore-engines

# Copie du code source du service
COPY apps/customer-service/src ./apps/customer-service/src/
COPY apps/customer-service/tsconfig*.json ./apps/customer-service/
COPY apps/customer-service/nest-cli.json ./apps/customer-service/

# Build des packages partagÃ©s d'abord
WORKDIR /app/packages/shared
RUN yarn build

# Retour au service et build
WORKDIR /app/apps/customer-service
RUN yarn build

# ======== STAGE 2: PRODUCTION ========
FROM node:20.13.0-alpine3.19 AS production

# MÃ©tadonnÃ©es
LABEL maintainer="Wanzobe DevOps Team"
LABEL service="customer-service"
LABEL stage="production"

# Installation des dÃ©pendances runtime + sÃ©curitÃ©
RUN apk update && apk upgrade && \
    apk add --no-cache \
        ca-certificates \
        dumb-init \
        curl \
        tini \
    && adduser -D -u 1001 nodeuser \
    && rm -rf /var/cache/apk/*

# Configuration du rÃ©pertoire de travail
WORKDIR /app

# Copie des fichiers de configuration
COPY package.json ./
COPY apps/customer-service/package.json ./apps/customer-service/

# Installation UNIQUEMENT des dÃ©pendances de production
RUN yarn install --frozen-lockfile --production=true --ignore-engines && \
    yarn cache clean

# Copie des artefacts buildÃ©s depuis le stage builder
COPY --from=builder /app/apps/customer-service/dist ./apps/customer-service/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Installation du package shared et crÃ©ation du lien workspace
WORKDIR /app/packages/shared
RUN yarn install --production --ignore-engines

WORKDIR /app
RUN mkdir -p node_modules/@wanzobe && \
    ln -sf /app/packages/shared node_modules/@wanzobe/shared

# Configuration des permissions et utilisateur
RUN chown -R nodeuser:nodeuser /app
USER nodeuser

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3011

# Health check standardisÃ©
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3011/health || exit 1

# Exposition du port
EXPOSE 3011

# Point d'entrÃ©e avec init process
WORKDIR /app/apps/customer-service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/customer-service/src/main.js"]

