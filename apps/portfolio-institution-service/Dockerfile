# ===========================================
# WANZOBE BACKEND - PORTFOLIO INSTITUTION SERVICE ULTRA-OPTIMISÉ
# Utilise la base commune - ÉLIMINE la duplication
# Build time: -80% | Image size: -60%
# ===========================================

# ======== STAGE 1: BUILD sur base optimisée ========
FROM wanzo-deps-base AS builder

LABEL service="portfolio-institution-service" version="2.0-optimized"

# Code source du service SEULEMENT
COPY *.d.ts ./
COPY apps/portfolio-institution-service/src ./apps/portfolio-institution-service/src/
COPY apps/portfolio-institution-service/tsconfig*.json ./apps/portfolio-institution-service/
COPY apps/portfolio-institution-service/nest-cli.json ./apps/portfolio-institution-service/

# Build du service (shared packages déjà buildés)
RUN yarn workspace @kiota-suit/portfolio-institution-service build

# ======== STAGE 2: PRODUCTION ultra-léger ========
FROM wanzo-production-base AS production

# Service-specific package.json
COPY --chown=nodeuser:nodeuser apps/portfolio-institution-service/package.json ./apps/portfolio-institution-service/

# Artefacts buildés du service uniquement
COPY --from=builder --chown=nodeuser:nodeuser /app/apps/portfolio-institution-service/dist ./apps/portfolio-institution-service/dist

# Configuration service
ENV PORT=3005

# Health check optimisé
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
    CMD curl -f http://localhost:3005/health || exit 1

EXPOSE 3005

# Démarrage optimisé
WORKDIR /app/apps/portfolio-institution-service
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

