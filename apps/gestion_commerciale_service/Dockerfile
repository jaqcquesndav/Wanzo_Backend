# ===========================================
# WANZOBE BACKEND - DOCKERFILE STANDARDISÉ
# Service: gestion_commerciale_service
# Optimisé pour Yarn Workspaces + Multi-stage
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
COPY apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/

# Installation des dépendances avec Yarn Workspaces
RUN yarn install --frozen-lockfile --ignore-engines

# Copie du code source des packages partagés
COPY packages/ ./packages/

# Copie du code source du service
COPY apps/gestion_commerciale_service/src ./apps/gestion_commerciale_service/src/
COPY apps/gestion_commerciale_service/tsconfig*.json ./apps/gestion_commerciale_service/
COPY apps/gestion_commerciale_service/nest-cli.json ./apps/gestion_commerciale_service/

# Build des packages partagés puis du service avec workspace-aware commands
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build && \
    yarn workspace @wanzobe/gestion-commerciale-service build

# ======== STAGE 2: PRODUCTION ========
FROM node:20-alpine AS production

# Installation des outils de sécurité et utilisateur non-root
RUN apk add --no-cache dumb-init curl tini && \
    adduser -D -u 1001 nodeuser && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

# Copie des fichiers de configuration du monorepo
COPY --chown=nodeuser:nodeuser package.json yarn.lock turbo.json ./

# Copie des packages partagés (package.json uniquement pour workspace linking)
COPY --chown=nodeuser:nodeuser packages/shared/package.json ./packages/shared/
COPY --chown=nodeuser:nodeuser packages/types/package.json ./packages/types/
COPY --chown=nodeuser:nodeuser packages/tsconfig/package.json ./packages/tsconfig/
COPY --chown=nodeuser:nodeuser packages/customer-sync/package.json ./packages/customer-sync/

# Copie du service spécifique
COPY --chown=nodeuser:nodeuser apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/

# Installation des dépendances de production uniquement
RUN yarn install --frozen-lockfile --production=true --ignore-engines && \
    yarn cache clean && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copie des artifacts buildés depuis le stage builder
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/gestion_commerciale_service/dist ./apps/gestion_commerciale_service/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/customer-sync/dist ./packages/customer-sync/dist

WORKDIR /app
RUN mkdir -p node_modules/@wanzobe && \
    ln -sf /app/packages/shared node_modules/@wanzobe/shared

USER nodeuser

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3006

# Configuration du répertoire de travail final
WORKDIR /app/apps/gestion_commerciale_service

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3006/health || exit 1

# Point d'entrée avec dumb-init pour la gestion des signaux
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Exposition du port
EXPOSE 3006
