# syntax=docker/dockerfile:1
# Utiliser l'image PyTorch officielle CPU-only comme base pour accélérer le build
FROM pytorch/pytorch:2.2.0-cpu

# Set workdir
WORKDIR /app

# Install system dependencies
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
        && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY apps/Adha-ai-service/requirements.txt ./
# Modifier requirements.txt pour enlever torch qui est déjà installé
RUN grep -v "^torch" requirements.txt > requirements_no_torch.txt && \
    pip install --upgrade pip && \
    pip install --no-cache-dir --timeout 300 --retries 10 -r requirements_no_torch.txt

# Copy only necessary files (not the entire code)
COPY apps/Adha-ai-service/adha_ai_service ./adha_ai_service
COPY apps/Adha-ai-service/api ./api
COPY apps/Adha-ai-service/agents ./agents
COPY apps/Adha-ai-service/config ./config
COPY apps/Adha-ai-service/manage.py ./

# Expose the port
ENV PORT=8002
EXPOSE 8002

# Script de démarrage pour attendre PostgreSQL et exécuter les migrations
COPY apps/Adha-ai-service/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["gunicorn", "adha_ai_service.wsgi:application", "--bind", "0.0.0.0:8002", "--timeout", "120"]
