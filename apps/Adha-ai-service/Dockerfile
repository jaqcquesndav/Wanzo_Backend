# Dockerfile optimisé pour Adha AI Service
# Utilise l'image PyTorch officielle CPU-only pour éviter la compilation des packages lourds

# === ÉTAPE 1: IMAGE DE BASE OPTIMISÉE ===
FROM pytorch/pytorch:1.13.1-cpu-py3.10-ubuntu20.04 AS base

# Variables d'environnement pour optimisation Python et PyTorch
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128 \
    OMP_NUM_THREADS=1 \
    NUMBA_CACHE_DIR=/tmp

WORKDIR /app

# === ÉTAPE 2: INSTALLATION DES DÉPENDANCES SYSTÈME ===
# Installation en une seule couche avec nettoyage optimisé
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libglib2.0-0 \
        libsm6 \
        libxrender1 \
        libxext6 \
        tesseract-ocr \
        poppler-utils \
        postgresql-client \
        curl \
        && apt-get clean \
        && rm -rf /var/lib/apt/lists/* \
        && rm -rf /tmp/* \
        && rm -rf /var/tmp/*

# === ÉTAPE 3: OPTIMISATION DES DÉPENDANCES PYTHON ===
# Copier les requirements
COPY apps/Adha-ai-service/requirements.txt ./

# Installation optimisée des packages Python
RUN pip install --upgrade pip && \
    # Exclure les packages déjà présents dans l'image PyTorch
    grep -v -E "^(torch|torchvision|torchaudio)" requirements.txt > requirements_optimized.txt && \
    # Installation avec optimisations mémoire et performance
    pip install --no-cache-dir \
                --timeout 600 \
                --retries 3 \
                --prefer-binary \
                --no-compile \
                -r requirements_optimized.txt && \
    # Nettoyage agressif des caches et fichiers temporaires
    pip cache purge && \
    find /opt/conda -name "*.pyc" -delete && \
    find /opt/conda -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true && \
    # Supprimer les fichiers temporaires de build
    rm -rf /tmp/* /var/tmp/* && \
    # Nettoyer les fichiers requirements temporaires
    rm -f requirements_optimized.txt requirements.txt

# === ÉTAPE 4: COPIE DU CODE APPLICATION ===
# Copier uniquement les fichiers nécessaires (structure optimisée)
COPY apps/Adha-ai-service/adha_ai_service ./adha_ai_service
COPY apps/Adha-ai-service/api ./api
COPY apps/Adha-ai-service/agents ./agents
COPY apps/Adha-ai-service/config ./config
COPY apps/Adha-ai-service/manage.py ./

# Copier et configurer le script de démarrage
COPY apps/Adha-ai-service/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# === ÉTAPE 5: CONFIGURATION SÉCURITÉ ET UTILISATEUR ===
# Créer un utilisateur non-root pour la sécurité
RUN groupadd -r appgroup && \
    useradd -r -g appgroup -d /app -s /bin/bash appuser && \
    # Créer les répertoires nécessaires avec les bonnes permissions
    mkdir -p /app/logs /app/data /app/static /app/media && \
    chown -R appuser:appgroup /app && \
    chmod -R 755 /app

# === ÉTAPE 6: CONFIGURATION RUNTIME ===
# Port d'exposition
ENV PORT=8002
EXPOSE 8002

# Healthcheck pour monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/health/ || exit 1

# Basculer vers l'utilisateur non-root
USER appuser

# === ÉTAPE 7: COMMANDE DE DÉMARRAGE ===
# Point d'entrée avec script optimisé
ENTRYPOINT ["docker-entrypoint.sh"]
CMD []

# === MÉTADONNÉES DE L'IMAGE ===
LABEL maintainer="Wanzo Backend Team"
LABEL version="1.0"
LABEL description="Adha AI Service - Optimisé pour production"
LABEL pytorch.version="1.13.1"
LABEL optimization.level="high"
