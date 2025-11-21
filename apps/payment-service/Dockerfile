# ======== STAGE 1: BUILD avec toutes les dépendances ========
FROM wanzo-deps-base:latest AS builder

# Copier les packages shared (déjà buildés dans la base)
COPY packages/ ./packages/

# Copier le package.json du service pour le workspace
COPY apps/payment-service/package.json ./apps/payment-service/

# Copier le code source du service
COPY apps/payment-service/src ./apps/payment-service/src
COPY apps/payment-service/tsconfig*.json ./apps/payment-service/
COPY apps/payment-service/nest-cli.json ./apps/payment-service/

# Build du service (maintenant que les packages shared sont disponibles)
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzo/payment-service build

# ======== STAGE 2: PRODUCTION ultra-léger ========
FROM wanzo-production-base:latest AS production

# Copier le package.json du service
COPY --chown=nodeuser:nodeuser apps/payment-service/package.json ./apps/payment-service/

# Copier le build et les node_modules depuis le stage builder
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/payment-service/dist ./apps/payment-service/dist

WORKDIR /app/apps/payment-service

ENV NODE_ENV=production
ENV PORT=3007

EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=5 \
	CMD curl -f http://localhost:${PORT}/api/docs || curl -f http://localhost:${PORT}/health || exit 1

USER nodeuser
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
