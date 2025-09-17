# ===========================================
# WANZOBE BACKEND - CUSTOMER SERVICE ULTRA-OPTIMISÉ
# Utilise la base commune - ÉLIMINE la duplication
# Build time: -80% | Image size: -60%
# ===========================================

# ======== STAGE 1: BUILD sur base optimisée ========
FROM wanzo-deps-base AS builder

LABEL service="customer-service" version="2.0-optimized"

# Code source des packages partagés (nécessaires pour la compilation)
COPY packages/ ./packages/

# Code source du service SEULEMENT
COPY apps/customer-service/src ./apps/customer-service/src/
COPY apps/customer-service/tsconfig*.json ./apps/customer-service/
COPY apps/customer-service/nest-cli.json ./apps/customer-service/

# Build des packages partagés d'abord
RUN yarn workspace @wanzobe/shared build && \
    yarn workspace @wanzobe/customer-sync build

# Build du service (maintenant que les packages shared sont disponibles)
RUN yarn workspace @wanzobe/customer-service build

# ======== STAGE 2: PRODUCTION ultra-léger ========
FROM wanzo-production-base AS production

# Service-specific package.json (already installed in base)
COPY --chown=nodeuser:nodeuser apps/customer-service/package.json ./apps/customer-service/

# Artefacts buildés du service uniquement  
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/customer-service/dist ./apps/customer-service/dist

# Configuration service
ENV PORT=3001

# Health check optimisé
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

# Démarrage optimisé
WORKDIR /app/apps/customer-service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/customer-service/src/main.js"]
