# syntax=docker/dockerfile:1
FROM python:3.11-slim

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
        && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY apps/Adha-ai-service/requirements.txt ./
# Utiliser une méthode robuste pour installer les dépendances
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --timeout 300 --retries 10 -r requirements.txt

# Copy only necessary files (not the entire code)
COPY apps/Adha-ai-service/comptable_ia_api ./comptable_ia_api
COPY apps/Adha-ai-service/api ./api
COPY apps/Adha-ai-service/agents ./agents
COPY apps/Adha-ai-service/config ./config
COPY apps/Adha-ai-service/manage.py ./

# Expose the port (assume 8002, change if needed)
ENV PORT=8002
EXPOSE 8002

# Entrypoint for Django app (adapt if using another entrypoint)
CMD ["gunicorn", "comptable_ia_api.wsgi:application", "--bind", "0.0.0.0:8002", "--timeout", "120"]
