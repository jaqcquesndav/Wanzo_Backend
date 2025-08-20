# ===========================================
# WANZOBE BACKEND - DOCKERFILE STANDARDISÉ
# Service: accounting-service
# Optimisé pour Yarn Workspaces + Multi-stage
# ===========================================

# ======== STAGE 1: BUILD ========
FROM node:20.13.0-alpine3.19 AS builder

# MÃ©tadonnÃ©es
LABEL maintainer="Wanzobe DevOps Team"
LABEL service="accounting-service"
LABEL stage="builder"

# Installation des dÃ©pendances systÃ¨me pour le build
RUN apk update && apk upgrade && \
    apk add --no-cache \
        ca-certificates \
        python3 \
        make \
        g++ \
    && rm -rf /var/cache/apk/*

# Configuration du rÃ©pertoire de travail
WORKDIR /app

# Copie des fichiers de configuration du monorepo
COPY package.json yarn.lock turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/customer-sync/package.json ./packages/customer-sync/
COPY apps/accounting-service/package.json ./apps/accounting-service/

# Installation des dépendances seulement
RUN yarn config set network-timeout 600000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile --ignore-engines --network-timeout 600000 && \
    yarn cache clean --all

# Copie du code source aprÃ¨s l'installation
COPY packages/ ./packages/
COPY apps/accounting-service/ ./apps/accounting-service/

# Build optimisé avec Yarn Workspaces
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build && \
    yarn workspace @kiota-suit/accounting-service build

# ======== STAGE 2: PRODUCTION (WORKSPACE-OPTIMIZED) ========
FROM node:20-alpine AS production

# Installation runtime minimal + sécurité
RUN apk add --no-cache dumb-init curl && \
    adduser -D -u 1001 nodeuser && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

# ÉTAPE 1: Recréer la structure workspace pour production
COPY --chown=nodeuser:nodeuser package.json yarn.lock turbo.json ./
COPY --chown=nodeuser:nodeuser packages/shared/package.json ./packages/shared/
COPY --chown=nodeuser:nodeuser packages/types/package.json ./packages/types/
COPY --chown=nodeuser:nodeuser packages/tsconfig/package.json ./packages/tsconfig/
COPY --chown=nodeuser:nodeuser packages/customer-sync/package.json ./packages/customer-sync/
COPY --chown=nodeuser:nodeuser apps/accounting-service/package.json ./apps/accounting-service/

# ÉTAPE 2: Installation production avec workspace resolution
RUN yarn config set network-timeout 600000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile --production=true --ignore-engines --network-timeout 600000 && \
    yarn cache clean && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/* ~/.yarn ~/.npm

# ÉTAPE 3: Copie des artefacts buildés avec structure workspace
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/accounting-service/dist ./apps/accounting-service/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/customer-sync/dist ./packages/customer-sync/dist

USER nodeuser

ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

WORKDIR /app/apps/accounting-service
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]

