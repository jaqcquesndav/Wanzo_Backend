# ===========================================
# WANZOBE BACKEND - ANALYTICS SERVICE ULTRA-OPTIMISÉ
# Utilise la base commune - ÉLIMINE la duplication
# Build time: -80% | Image size: -60%
# ===========================================

# ======== STAGE 1: BUILD sur base optimisée ========
FROM wanzo-deps-base AS builder

LABEL service="analytics-service" version="2.0-optimized"

# Code source du service SEULEMENT
COPY apps/analytics-service/src ./apps/analytics-service/src/
COPY apps/analytics-service/tsconfig*.json ./apps/analytics-service/
COPY apps/analytics-service/nest-cli.json ./apps/analytics-service/

# Build du service (shared packages déjà buildés)
RUN yarn workspace @kiota-suit/analytics-service build

# ======== STAGE 2: PRODUCTION ultra-léger ========
FROM wanzo-production-base AS production

# Service-specific package.json
COPY --chown=nodeuser:nodeuser apps/analytics-service/package.json ./apps/analytics-service/

# Artefacts buildés du service uniquement
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/analytics-service/dist ./apps/analytics-service/dist

# Configuration service
ENV PORT=3002

# Health check standardisé
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

EXPOSE 3002

# Point d'entrée avec init process
WORKDIR /app/apps/analytics-service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

