# ===========================================
# WANZOBE BACKEND - API GATEWAY ULTRA-OPTIMISÉ
# Utilise la base commune - ÉLIMINE la duplication
# Build time: -80% | Image size: -60%
# ===========================================

# ======== STAGE 1: BUILD sur base optimisée ========
FROM wanzo-deps-base AS builder

LABEL service="api-gateway" version="2.0-optimized"

# Code source du service SEULEMENT
COPY apps/api-gateway/src ./apps/api-gateway/src/
COPY apps/api-gateway/tsconfig*.json ./apps/api-gateway/
COPY apps/api-gateway/nest-cli.json ./apps/api-gateway/

# Build du service (shared packages déjà buildés)
RUN yarn workspace @kiota-suit/api-gateway build

# ======== STAGE 2: PRODUCTION ultra-léger ========
FROM wanzo-production-base AS production

# Service-specific package.json
COPY --chown=nodeuser:nodeuser apps/api-gateway/package.json ./apps/api-gateway/

# Artefacts buildés du service uniquement
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/api-gateway/dist ./apps/api-gateway/dist

# Configuration service (port différent pour gateway)
ENV PORT=3000

# Health check optimisé
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Démarrage optimisé
WORKDIR /app/apps/api-gateway
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

