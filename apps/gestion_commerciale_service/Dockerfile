# Multi-stage Dockerfile optimisé pour gestion_commerciale_service
FROM node:20.13.0-alpine3.19 AS builder

RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates python3 make g++ curl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json yarn.lock ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/gestion_commerciale_service/ ./apps/gestion_commerciale_service/

RUN yarn install --frozen-lockfile --ignore-engines

WORKDIR /app/packages/shared
RUN yarn build

WORKDIR /app/apps/gestion_commerciale_service
RUN yarn build

FROM node:20.13.0-alpine3.19 AS production

RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates dumb-init curl tini && \
    adduser -D -u 1001 nodeuser && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/
RUN mkdir -p ./packages/shared/ ./packages/types/ ./packages/tsconfig/
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN yarn install --frozen-lockfile --production=true --ignore-engines && \
    yarn cache clean

COPY --from=builder /app/apps/gestion_commerciale_service/dist ./apps/gestion_commerciale_service/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/types/ ./packages/types/
COPY --from=builder /app/packages/tsconfig/ ./packages/tsconfig/

# Installer les packages shared comme workspace dans la production
WORKDIR /app
RUN yarn install --production --ignore-engines

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
