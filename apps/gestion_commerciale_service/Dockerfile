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

# Copy turbo and package files
COPY package.json ./
COPY turbo.json ./

# Copy local package files first
COPY packages/shared/package.json ./packages/shared/
COPY packages/customer-sync/package.json ./packages/customer-sync/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Copy the TypeScript config files
COPY packages/tsconfig/*.json ./packages/tsconfig/

# Create mock modules for local packages
RUN mkdir -p ./packages/shared/src ./packages/customer-sync/src
RUN echo 'module.exports = {};' > ./packages/shared/src/index.js && \
    echo 'module.exports = {};' > ./packages/customer-sync/src/index.js

# Copy service files
COPY ./apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/
COPY ./apps/gestion_commerciale_service/tsconfig.json ./apps/gestion_commerciale_service/
COPY ./apps/gestion_commerciale_service/nest-cli.json ./apps/gestion_commerciale_service/
COPY ./apps/gestion_commerciale_service/src ./apps/gestion_commerciale_service/src/

# Create tsconfig.build.json if it doesn't exist
RUN echo '{"extends":"./tsconfig.json","exclude":["node_modules","test","dist","**/*spec.ts"]}' > ./apps/gestion_commerciale_service/tsconfig.build.json

# Install dependencies with file: references for local packages
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps --force

# Build the service
WORKDIR /app/apps/gestion_commerciale_service
RUN npm run build

# Copy Auth0 certificate
COPY ./apps/gestion_commerciale_service/auth0-certificate.pem ./auth0-certificate.pem

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
COPY --from=builder /app/apps/gestion_commerciale_service/auth0-certificate.pem ./apps/gestion_commerciale_service/auth0-certificate.pem

# Install minimal dependencies needed for the simplified mock service
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
