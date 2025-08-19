# ===========================================
# WANZOBE BACKEND - DOCKERFILE STANDARDISÃ‰
# Service: api-gateway
# OptimisÃ© pour Yarn Workspaces + Multi-stage
# ===========================================

# ======== STAGE 1: BUILD ========
FROM node:20-alpine AS builder

# Installation des dépendances système pour le build
RUN apk add --no-cache ca-certificates python3 make g++ curl && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

# Copie des fichiers de configuration du monorepo
COPY package.json yarn.lock turbo.json ./

# Copie des packages partagés (priorité pour workspace linking)
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/customer-sync/package.json ./packages/customer-sync/

# Copie du service spécifique
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Installation des dépendances avec Yarn Workspaces
RUN yarn install --frozen-lockfile --ignore-engines

# Copie du code source
COPY packages/ ./packages/
COPY apps/api-gateway/src ./apps/api-gateway/src/
COPY apps/api-gateway/tsconfig*.json ./apps/api-gateway/
COPY apps/api-gateway/nest-cli.json ./apps/api-gateway/

# Build avec Yarn Workspaces
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build && \
    yarn workspace @kiota-suit/api-gateway build

# Retour au service et build
WORKDIR /app/apps/api-gateway
RUN yarn build

# ======== STAGE 2: PRODUCTION (WORKSPACE-OPTIMIZED) ========
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init curl tini && \
    adduser -D -u 1001 nodeuser && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

# Recréer la structure workspace pour production
COPY --chown=nodeuser:nodeuser package.json yarn.lock turbo.json ./
COPY --chown=nodeuser:nodeuser packages/shared/package.json ./packages/shared/
COPY --chown=nodeuser:nodeuser packages/types/package.json ./packages/types/
COPY --chown=nodeuser:nodeuser packages/tsconfig/package.json ./packages/tsconfig/
COPY --chown=nodeuser:nodeuser packages/customer-sync/package.json ./packages/customer-sync/
COPY --chown=nodeuser:nodeuser apps/api-gateway/package.json ./apps/api-gateway/

# Installation production avec workspace resolution
RUN yarn install --frozen-lockfile --production=true --ignore-engines && \
    yarn cache clean && npm cache clean --force && \
    rm -rf /tmp/* /var/cache/* ~/.yarn ~/.npm

# Copie des artefacts buildés avec structure workspace
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/customer-sync/dist ./packages/customer-sync/dist

USER nodeuser

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
ENV PORT=8000

# Health check standardisÃ©
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Exposition du port
EXPOSE 8000

# Point d'entrÃ©e avec init process
WORKDIR /app/apps/api-gateway
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/api-gateway/src/main.js"]

