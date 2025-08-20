# ===========================================
# WANZOBE BACKEND - DOCKERFILE OPTIMISÉ
# Service: admin-service
# Image ultra-légère avec Alpine + Multi-stage
# ===========================================

# ======== STAGE 1: BUILD (WORKSPACE-AWARE) ========
FROM node:20-alpine AS builder

# Installation minimale des outils de build
RUN apk add --no-cache python3 make g++ && \
    npm install -g npm@latest && \
    rm -rf /var/cache/apk/*

# Configuration du répertoire de travail
WORKDIR /app

# ÉTAPE 1: Copie de la structure workspace complète
COPY package.json yarn.lock turbo.json ./

# ÉTAPE 2: Copie de TOUS les package.json pour workspace resolution
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/customer-sync/package.json ./packages/customer-sync/
COPY apps/admin-service/package.json ./apps/admin-service/

# ÉTAPE 3: Installation avec workspace resolution
RUN yarn config set network-timeout 600000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile --ignore-engines --network-timeout 600000 && \
    yarn cache clean

# ÉTAPE 4: Copie du code source (après installation pour cache optimal)
COPY packages/ ./packages/
COPY apps/admin-service/src ./apps/admin-service/src/
COPY apps/admin-service/tsconfig*.json apps/admin-service/nest-cli.json ./apps/admin-service/

# ÉTAPE 5: Build avec ordre de dépendances respecté
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build && \
    yarn workspace @kiota-suit/admin-service build

# ======== STAGE 2: PRODUCTION (WORKSPACE-OPTIMIZED) ========
FROM node:20-alpine AS production

# Installation runtime minimal
RUN apk add --no-cache dumb-init curl && \
    adduser -D -u 1001 nodeuser && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

# ÉTAPE 1: Recréer la structure workspace pour production
COPY --chown=nodeuser:nodeuser package.json yarn.lock turbo.json ./
COPY --chown=nodeuser:nodeuser packages/shared/package.json ./packages/shared/
COPY --chown=nodeuser:nodeuser packages/customer-sync/package.json ./packages/customer-sync/
COPY --chown=nodeuser:nodeuser apps/admin-service/package.json ./apps/admin-service/

# ÉTAPE 2: Installation production avec workspace resolution
RUN yarn config set network-timeout 600000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile --production=true --ignore-engines --network-timeout 600000 && \
    yarn cache clean && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/* ~/.yarn ~/.npm

# ÉTAPE 3: Copie des artefacts buildés avec structure workspace
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/admin-service/dist ./apps/admin-service/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/customer-sync/dist ./packages/customer-sync/dist

USER nodeuser

# Variables d'environnement optimisées pour performance
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=256" \
    PORT=3001

# Health check ultra-léger
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

# Point d'entrée optimisé
WORKDIR /app/apps/admin-service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/admin-service/src/main.js"]

