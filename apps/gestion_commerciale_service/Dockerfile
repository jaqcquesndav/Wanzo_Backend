# Multi-stage Dockerfile workspace-optimisé pour gestion_commerciale_service
FROM node:20-alpine AS builder

RUN apk add --no-cache ca-certificates python3 make g++ && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

# Copie sélective pour optimiser le cache Docker
COPY package.json yarn.lock turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/

# Installation des dépendances avec workspace resolution
RUN yarn install --frozen-lockfile --ignore-engines && \
    yarn cache clean

# Copie du code source après l'installation
COPY packages/ ./packages/
COPY apps/gestion_commerciale_service/ ./apps/gestion_commerciale_service/

# Build optimisé avec Yarn Workspaces
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build && \
    yarn workspace @wanzobe/gestion-commerciale-service build

# ======== STAGE 2: PRODUCTION (WORKSPACE-OPTIMIZED) ========
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init curl && \
    adduser -D -u 1001 nodeuser && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

# ÉTAPE 1: Recréer la structure workspace pour production
COPY --chown=nodeuser:nodeuser package.json yarn.lock turbo.json ./
COPY --chown=nodeuser:nodeuser packages/shared/package.json ./packages/shared/
COPY --chown=nodeuser:nodeuser packages/types/package.json ./packages/types/
COPY --chown=nodeuser:nodeuser packages/tsconfig/package.json ./packages/tsconfig/
COPY --chown=nodeuser:nodeuser apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/

# ÉTAPE 2: Installation production avec workspace resolution
RUN yarn install --frozen-lockfile --production=true --ignore-engines && \
    yarn cache clean && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/* ~/.yarn ~/.npm

# ÉTAPE 3: Copie des artefacts buildés avec structure workspace
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/gestion_commerciale_service/dist ./apps/gestion_commerciale_service/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/types/dist ./packages/types/dist

USER nodeuser

ENV NODE_ENV=production
ENV PORT=3006

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3006/health || exit 1

EXPOSE 3006

WORKDIR /app/apps/gestion_commerciale_service
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
