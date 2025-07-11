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
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose the port (assume 8002, change if needed)
ENV PORT=8002
EXPOSE 8002

# Entrypoint for Django app (adapt if using another entrypoint)
CMD ["gunicorn", "comptable_ia_api.wsgi:application", "--bind", "0.0.0.0:8002", "--timeout", "120"]
