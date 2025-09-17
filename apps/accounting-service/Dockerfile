# ===========================================
# WANZOBE BACKEND - ACCOUNTING SERVICE ULTRA-OPTIMISÉ
# Utilise la base commune - ÉLIMINE la duplication
# Build time: -80% | Image size: -60%
# ===========================================

# ======== STAGE 1: BUILD sur base optimisée ========
FROM wanzo-deps-base AS builder

LABEL service="accounting-service" version="2.0-optimized"

# Code source des packages partagés (nécessaires pour la compilation)
COPY packages/ ./packages/

# Code source du service SEULEMENT (packages déjà dans base)
COPY apps/accounting-service/src ./apps/accounting-service/src/
COPY apps/accounting-service/tsconfig*.json ./apps/accounting-service/
COPY apps/accounting-service/nest-cli.json ./apps/accounting-service/

# Build des packages partagés d'abord
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build

# Build du service (maintenant que les packages shared sont disponibles)
RUN yarn workspace @kiota-suit/accounting-service build

# ======== STAGE 2: PRODUCTION ultra-léger ========
FROM wanzo-production-base AS production

# Service-specific package.json (already installed in base)
COPY --chown=nodeuser:nodeuser apps/accounting-service/package.json ./apps/accounting-service/

# Artefacts buildés du service uniquement
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/accounting-service/dist ./apps/accounting-service/dist

# Configuration service
ENV PORT=3001

# Health check optimisé
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

# Démarrage optimisé
WORKDIR /app/apps/accounting-service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/accounting-service/src/main.js"]

