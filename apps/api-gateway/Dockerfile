FROM node:20.13.0-alpine3.19 AS builder

RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates python3 make g++ && \
    update-ca-certificates

WORKDIR /app

# Define the npm registry
ARG NPM_REGISTRY=https://registry.npmmirror.com
# Copy only the api-gateway app to avoid workspace coupling
COPY apps/api-gateway /app

WORKDIR /app
ENV npm_config_registry=${NPM_REGISTRY} \
    npm_config_loglevel=warn \
    npm_config_fetch_timeout=600000 \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_maxtimeout=120000
RUN npm install --legacy-peer-deps --no-audit --no-fund
RUN npm run build

FROM node:20.13.0-alpine3.19 AS production
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates dumb-init curl && \
    update-ca-certificates && \
    adduser -D -u 1001 nodeuser

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

# Copy built artifacts and deps from builder to avoid network during production image creation
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules

RUN npm pkg delete scripts && \
    npm pkg set scripts.start='node dist/main.js' && \
    npm prune --omit=dev && \
    npm cache clean --force

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

USER nodeuser
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "start"]

