# ===========================================
# WANZOBE BACKEND - DOCKERFILE STANDARDISÃ‰
# Service: customer-service
# OptimisÃ© pour Yarn Workspaces + Multi-stage
# ===========================================

# ======== STAGE 1: BUILD ========
FROM node:20-alpine AS builder

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
COPY packages/customer-sync ./packages/customer-sync/

# Copie du service spÃ©cifique
COPY apps/customer-service/package.json ./apps/customer-service/

# Installation des dÃ©pendances avec Yarn Workspaces (TOUTES pour le build)
RUN yarn install --frozen-lockfile

# Copie du code source du service
COPY apps/customer-service/src ./apps/customer-service/src/
COPY apps/customer-service/tsconfig*.json ./apps/customer-service/
COPY apps/customer-service/nest-cli.json ./apps/customer-service/

# Build des packages partagés ET du service avec Yarn Workspaces
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build && \
    yarn workspace @wanzobe/customer-service build

# ======== STAGE 2: PRODUCTION (WORKSPACE-OPTIMIZED) ========
FROM node:20-alpine AS production

# Installation runtime minimal + sécurité
RUN apk add --no-cache dumb-init curl tini && \
    adduser -D -u 1001 nodeuser && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

# ÉTAPE 1: Recréer la structure workspace pour production
COPY --chown=nodeuser:nodeuser package.json yarn.lock turbo.json ./
COPY --chown=nodeuser:nodeuser packages/shared/package.json ./packages/shared/
COPY --chown=nodeuser:nodeuser packages/types/package.json ./packages/types/
COPY --chown=nodeuser:nodeuser packages/tsconfig/package.json ./packages/tsconfig/
COPY --chown=nodeuser:nodeuser apps/customer-service/package.json ./apps/customer-service/

# ÉTAPE 2: Installation production avec workspace resolution
RUN yarn install --frozen-lockfile --production=true --ignore-engines && \
    yarn cache clean && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/* ~/.yarn ~/.npm

# ÉTAPE 3: Copie des artefacts buildés avec structure workspace
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/customer-service/dist ./apps/customer-service/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/types/dist ./packages/types/dist

USER nodeuser

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3011

# Health check standardisé
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3011/health || exit 1

# Exposition du port
EXPOSE 3011

# Point d'entrée avec init process
WORKDIR /app/apps/customer-service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

