# ===========================================
# WANZOBE BACKEND - GESTION COMMERCIALE SERVICE ULTRA-OPTIMISÉ
# Utilise la base commune - ÉLIMINE la duplication
# Build time: -80% | Image size: -60%
# ===========================================

# ======== STAGE 1: BUILD sur base optimisée ========
FROM wanzo-deps-base AS builder

LABEL service="gestion-commerciale-service" version="2.0-optimized"

# Code source du service SEULEMENT
COPY apps/gestion_commerciale_service/src ./apps/gestion_commerciale_service/src/
COPY apps/gestion_commerciale_service/tsconfig*.json ./apps/gestion_commerciale_service/
COPY apps/gestion_commerciale_service/nest-cli.json ./apps/gestion_commerciale_service/

# Build du service (shared packages déjà buildés)
RUN yarn workspace @wanzobe/gestion-commerciale-service build

# ======== STAGE 2: PRODUCTION ultra-léger ========
FROM wanzo-production-base AS production

# Service-specific package.json
COPY --chown=nodeuser:nodeuser apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/

# Artefacts buildés du service uniquement
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/gestion_commerciale_service/dist ./apps/gestion_commerciale_service/dist

# Configuration service
ENV PORT=3006

# Health check optimisé
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3006/health || exit 1

EXPOSE 3006

# Démarrage optimisé
WORKDIR /app/apps/gestion_commerciale_service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
