FROM node:20.13.0-alpine3.19 AS builder

# Installation des mises à jour de sécurité
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    update-ca-certificates

# Set working directory
WORKDIR /app

# Create required directories
RUN mkdir -p ./dist/src

# Copy simplified mock service to the container
COPY ./apps/api-gateway/simplified-mock.js ./simplified-mock.js

# Copy to dist directory
RUN cp ./simplified-mock.js ./dist/src/main.js

# Production stage - minimal runtime image
FROM node:20.13.0-alpine3.19 AS production

# Installation des mises à jour de sécurité
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates dumb-init curl && \
    update-ca-certificates

# Create a non-root user and group
RUN addgroup -S nodeuser && adduser -S -G nodeuser nodeuser

# Set working directory
WORKDIR /app

# Create required directories
RUN mkdir -p ./dist/src ./logs && \
    chown -R nodeuser:nodeuser /app

# Copy only the built artifacts from builder
COPY --from=builder /app/dist/src/main.js ./dist/src/

# Install minimal dependencies needed for the mock service
RUN yarn init -y && \
    yarn add express http path-to-regexp --production && \
    yarn cache clean

# Environment variables - non-sensitive
ENV NODE_ENV=production
ENV PORT=8000

# Expose service port
EXPOSE 8000

# Mettre en place des healthchecks pour surveiller l'état du service
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Use dumb-init as PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Utiliser un utilisateur non-root pour une meilleure sécurité
USER nodeuser

# Start the service
CMD ["node", "dist/src/main.js"]

