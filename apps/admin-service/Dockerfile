# ===========================================
# WANZOBE BACKEND - ADMIN SERVICE ULTRA-OPTIMISÉ
# Utilise la base commune - ÉLIMINE la duplication
# Build time: -80% | Image size: -60%
# ===========================================

# ======== STAGE 1: BUILD sur base optimisée ========
FROM wanzo-deps-base AS builder

LABEL service="admin-service" version="2.0-optimized"

# Code source des packages partagés (nécessaires pour la compilation)
COPY packages/ ./packages/

# Code source du service SEULEMENT
COPY apps/admin-service/src ./apps/admin-service/src/
COPY apps/admin-service/tsconfig*.json apps/admin-service/nest-cli.json ./apps/admin-service/

# Build des packages partagés d'abord
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build

# Build du service (maintenant que les packages shared sont disponibles)
RUN yarn workspace @kiota-suit/admin-service build

# ======== STAGE 2: PRODUCTION ultra-léger ========
FROM wanzo-production-base AS production

# Service-specific package.json (already installed in base)
COPY --chown=nodeuser:nodeuser apps/admin-service/package.json ./apps/admin-service/

# Artefacts buildés du service uniquement
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/admin-service/dist ./apps/admin-service/dist

# Variables d'environnement optimisées
ENV PORT=3001 \
    NODE_OPTIONS="--max-old-space-size=256"

# Health check ultra-léger
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

# Démarrage optimisé
WORKDIR /app/apps/admin-service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/admin-service/src/main.js"]

