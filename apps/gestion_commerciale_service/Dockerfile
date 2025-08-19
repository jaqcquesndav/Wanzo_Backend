# Multi-stage Dockerfile ultra-optimisé pour gestion_commerciale_service
FROM node:20.13.0-alpine3.19 AS builder

RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates python3 make g++ && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copie sélective pour optimiser le cache Docker
COPY package.json yarn.lock turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/

# Installation des dépendances seulement
RUN yarn install --frozen-lockfile --ignore-engines && \
    yarn cache clean --all

# Copie du code source après l'installation
COPY packages/ ./packages/
COPY apps/gestion_commerciale_service/ ./apps/gestion_commerciale_service/

# Build optimisé
WORKDIR /app/packages/shared
RUN yarn build && rm -rf node_modules

WORKDIR /app/apps/gestion_commerciale_service
RUN yarn build

FROM node:20.13.0-alpine3.19 AS production

RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates dumb-init curl && \
    adduser -D -u 1001 nodeuser && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Configuration minimaliste pour la production
COPY package.json yarn.lock ./
COPY apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/

# Création structure packages pour les imports
RUN mkdir -p packages/shared packages/types packages/tsconfig && \
    echo '{"name":"@wanzobe/shared","version":"0.0.1","main":"dist/index.js"}' > packages/shared/package.json && \
    echo '{"name":"@wanzobe/types","version":"1.0.0","main":"index.js"}' > packages/types/package.json && \
    echo '{"name":"@wanzobe/tsconfig","version":"1.0.0"}' > packages/tsconfig/package.json

# Installation PRODUCTION SEULEMENT - sans dev dependencies
RUN yarn install --frozen-lockfile --production=true --ignore-engines && \
    yarn cache clean --all && \
    rm -rf /tmp/* /var/tmp/* ~/.npm ~/.yarn

# Copie UNIQUEMENT des artefacts buildés (pas de sources)
COPY --from=builder /app/apps/gestion_commerciale_service/dist ./apps/gestion_commerciale_service/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Pas besoin de symlink, on va s'appuyer sur la résolution de Node.js
# RUN mkdir -p node_modules/@wanzobe && \
#     ln -sf /app/packages/shared node_modules/@wanzobe/shared && \
#     ln -sf /app/packages/types node_modules/@wanzobe/types

RUN chown -R nodeuser:nodeuser /app
USER nodeuser

ENV NODE_ENV=production
ENV PORT=3006

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3006/health || exit 1

EXPOSE 3006

WORKDIR /app/apps/gestion_commerciale_service
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/apps/gestion_commerciale_service/src/main.js"]
