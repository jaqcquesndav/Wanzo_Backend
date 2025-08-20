# ===========================================
# WANZOBE BACKEND - DOCKERFILE WORKSPACE-OPTIMIZED
# Service: portfolio-institution-service
# ===========================================

# ======== STAGE 1: BUILD ========
FROM node:20-alpine AS builder

RUN apk add --no-cache ca-certificates python3 make g++ curl && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

# Copie des fichiers de configuration du monorepo
COPY package.json yarn.lock turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/customer-sync/package.json ./packages/customer-sync/
COPY apps/portfolio-institution-service/package.json ./apps/portfolio-institution-service/

# Installation des dépendances avec Yarn Workspaces
RUN yarn install --frozen-lockfile --ignore-engines

# Copie du code source
COPY packages/ ./packages/
COPY *.d.ts ./
COPY apps/portfolio-institution-service/src ./apps/portfolio-institution-service/src/
COPY apps/portfolio-institution-service/tsconfig*.json ./apps/portfolio-institution-service/
COPY apps/portfolio-institution-service/nest-cli.json ./apps/portfolio-institution-service/

# Build avec Yarn Workspaces
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build && \
    yarn workspace @kiota-suit/portfolio-institution-service build

# ======== STAGE 2: PRODUCTION (WORKSPACE-OPTIMIZED) ========
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init curl tini && \
    adduser -D -u 1001 nodeuser && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

COPY --chown=nodeuser:nodeuser package.json yarn.lock turbo.json ./
COPY --chown=nodeuser:nodeuser packages/shared/package.json ./packages/shared/
COPY --chown=nodeuser:nodeuser packages/types/package.json ./packages/types/
COPY --chown=nodeuser:nodeuser packages/tsconfig/package.json ./packages/tsconfig/
COPY --chown=nodeuser:nodeuser packages/customer-sync/package.json ./packages/customer-sync/
COPY --chown=nodeuser:nodeuser apps/portfolio-institution-service/package.json ./apps/portfolio-institution-service/

RUN yarn install --frozen-lockfile --production=true --ignore-engines && \
    yarn cache clean && \
    rm -rf /tmp/* /var/cache/* ~/.yarn

COPY --from=builder --chown=nodeuser:nodeuser /app/apps/portfolio-institution-service/dist ./apps/portfolio-institution-service/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodeuser:nodeuser /app/packages/customer-sync/dist ./packages/customer-sync/dist

WORKDIR /app
RUN mkdir -p node_modules/@wanzobe && \
    ln -sf /app/packages/shared node_modules/@wanzobe/shared

USER nodeuser

ENV NODE_ENV=production
ENV PORT=3005

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
    CMD curl -f http://localhost:3005/health || exit 1

EXPOSE 3005

WORKDIR /app/apps/portfolio-institution-service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

