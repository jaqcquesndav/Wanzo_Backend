# Utilisation d'une image Node.js spécifique et sécurisée
FROM node:20.13.0-alpine3.19 AS builder

# Installation des mises à jour de sécurité
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    update-ca-certificates

# Set working directory
WORKDIR /app

# Create essential directories
RUN mkdir -p ./apps/gestion_commerciale_service/dist/src

# Create simple package.json for the service
RUN echo '{"name":"gestion-commerciale-service","version":"1.0.0","dependencies":{"express":"^4.18.2"}}' > ./apps/gestion_commerciale_service/package.json

# Install Express
WORKDIR /app/apps/gestion_commerciale_service
RUN npm install express

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3005

# Create mock service file using printf to handle newlines properly
RUN printf 'const express = require("express");\nconst app = express();\nconst port = process.env.PORT || 3005;\napp.use(express.json());\napp.get("/", (req, res) => {\n  res.json({ status: "ok", service: "gestion-commerciale-service-mock" });\n});\napp.get("/health", (req, res) => {\n  res.json({ status: "healthy" });\n});\napp.post("/api/mock/commerciale", (req, res) => {\n  console.log("Received request:", req.body);\n  res.json({\n    success: true,\n    message: "Mock response from gestion commerciale service",\n    requestReceived: req.body,\n    timestamp: new Date().toISOString()\n  });\n});\napp.listen(port, () => {\n  console.log(`Mock gestion commerciale service running on port ${port}`);\n});\n' > ./mock-service.js

# Create dist directory and copy mock service
RUN mkdir -p ./dist/src
RUN cp ./mock-service.js ./dist/src/main.js

# Production stage - minimal runtime image with security patches
FROM node:20.13.0-alpine3.19 AS production

# Security updates and proper user setup
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates dumb-init curl && \
    update-ca-certificates && \
    adduser -D -u 1001 nodeuser

# Set working directory
WORKDIR /app

# Create required directories with proper permissions
RUN mkdir -p ./apps/gestion_commerciale_service/dist/src ./apps/gestion_commerciale_service/logs && \
    chown -R nodeuser:nodeuser /app

# Copy only the built artifacts from builder
COPY --from=builder /app/apps/gestion_commerciale_service/dist/src/main.js ./apps/gestion_commerciale_service/dist/src/

# Install minimal dependencies needed for the mock service
RUN npm init -y && \
    npm install --no-optional --production --legacy-peer-deps express && \
    npm cache clean --force

# Environment variables (non-sensitive)
ENV NODE_ENV=production
ENV PORT=3005
# Use placeholder values for sensitive data, to be injected at runtime
ENV DB_HOST=db_host_placeholder
ENV DB_PORT=5432
ENV DB_USERNAME=db_user_placeholder
ENV DB_DATABASE=gestion_commerciale

# Expose service port
EXPOSE 3005

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Create startup script
RUN printf '#!/bin/sh\n\
if [ -f "apps/gestion_commerciale_service/dist/src/main.js" ]; then\n\
    exec node apps/gestion_commerciale_service/dist/src/main.js\n\
elif [ -f "apps/gestion_commerciale_service/dist/main.js" ]; then\n\
    exec node apps/gestion_commerciale_service/dist/main.js\n\
else\n\
    echo "Could not find main.js file to execute" && ls -R apps/gestion_commerciale_service/dist && exit 1\n\
fi\n' > /app/startup.sh && chmod +x /app/startup.sh

# Set non-root user for better security
USER nodeuser

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/startup.sh"]
