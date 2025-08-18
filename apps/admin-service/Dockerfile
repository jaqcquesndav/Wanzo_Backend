# Utilisation d'une image Node.js spécifique et sécurisée
FROM node:20.13.0-alpine3.19 AS builder

# Installation des mises à jour de sécurité
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    update-ca-certificates

# Set working directory
WORKDIR /app

# Create essential directories
RUN mkdir -p ./apps/admin-service/dist/src

# Copy the simplified mock service file
COPY ./apps/admin-service/simplified-mock.js ./apps/admin-service/mock-service.js

# Use the mock service directly
RUN mkdir -p ./apps/admin-service/dist/src
RUN cp ./apps/admin-service/mock-service.js ./apps/admin-service/dist/src/main.js

# Production stage
FROM node:20.13.0-alpine3.19 AS production

# Security updates and proper user setup
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates dumb-init curl && \
    update-ca-certificates && \
    adduser -D -u 1001 nodeuser

# Set working directory
WORKDIR /app

# Create required directories with proper permissions
RUN mkdir -p ./apps/admin-service/dist/src ./apps/admin-service/logs && \
    chown -R nodeuser:nodeuser /app

# Install only production dependencies with Yarn
RUN yarn init -y && \
    yarn add express prom-client

# Copy the built application
COPY --from=builder /app/apps/admin-service/dist ./apps/admin-service/dist

# Create empty certificate file if needed
RUN touch ./apps/admin-service/auth0-certificate.pem && \
    chown nodeuser:nodeuser ./apps/admin-service/auth0-certificate.pem

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Command to run the app with dumb-init as PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/apps/admin-service/dist/src/main.js"]
