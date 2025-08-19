# ===========================================
# WANZOBE BACKEND - DOCKERFILE STANDARDISÃ‰
# Service: accounting-service
# OptimisÃ© pour Yarn Workspaces + Multi-stage
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
COPY apps/accounting-service/package.json ./apps/accounting-service/

# Installation des dÃ©pendances seulement
RUN yarn install --frozen-lockfile --ignore-engines && \
    yarn cache clean --all

# Copie du code source aprÃ¨s l'installation
COPY packages/ ./packages/
COPY apps/accounting-service/ ./apps/accounting-service/

# Build optimisÃ©
WORKDIR /app/packages/shared
RUN yarn build && rm -rf node_modules

WORKDIR /app/apps/accounting-service
RUN yarn build

# ======== STAGE 2: PRODUCTION ========
FROM node:20.13.0-alpine3.19 AS production

# MÃ©tadonnÃ©es
LABEL maintainer="Wanzobe DevOps Team"
LABEL service="accounting-service"
LABEL stage="production"

# Installation des dÃ©pendances runtime + sÃ©curitÃ©
RUN apk update && apk upgrade && \
    apk add --no-cache \
        ca-certificates \
        dumb-init \
        curl \
    && adduser -D -u 1001 nodeuser \
    && rm -rf /var/cache/apk/*

# Configuration du rÃ©pertoire de travail
WORKDIR /app

# Configuration minimaliste pour la production
COPY package.json yarn.lock ./
COPY apps/accounting-service/package.json ./apps/accounting-service/

# CrÃ©ation structure packages pour les imports
RUN mkdir -p packages/shared packages/types packages/tsconfig && \
    echo '{"name":"@wanzobe/shared","version":"0.0.1","main":"dist/index.js"}' > packages/shared/package.json && \
    echo '{"name":"@wanzobe/types","version":"1.0.0","main":"index.js"}' > packages/types/package.json && \
    echo '{"name":"@wanzobe/tsconfig","version":"1.0.0"}' > packages/tsconfig/package.json

# Installation PRODUCTION SEULEMENT - sans dev dependencies
RUN yarn install --frozen-lockfile --production=true --ignore-engines && \
    yarn cache clean --all && \
    rm -rf /tmp/* /var/tmp/* ~/.npm ~/.yarn

# Copie UNIQUEMENT des artefacts buildÃ©s (pas de sources)
COPY --from=builder /app/apps/accounting-service/dist ./apps/accounting-service/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

RUN chown -R nodeuser:nodeuser /app
USER nodeuser

ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

WORKDIR /app/apps/accounting-service
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]

