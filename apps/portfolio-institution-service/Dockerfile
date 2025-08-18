# Utilisation d'une image Node.js spécifique et sécurisée
FROM node:20.13.0-alpine3.19 AS builder

# Installation des mises à jour de sécurité
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    update-ca-certificates

# Set working directory
WORKDIR /app

# Create essential directories
RUN mkdir -p ./apps/portfolio-institution-service/dist/src

# Create simple package.json for the service
RUN echo '{"name":"portfolio-institution-service","version":"1.0.0","dependencies":{"express":"^4.18.2"}}' > ./apps/portfolio-institution-service/package.json

# Install Express with Yarn
WORKDIR /app/apps/portfolio-institution-service
RUN yarn add express

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3004

# Create mock service file using the provided mock-service.js
COPY ./apps/portfolio-institution-service/mock-service.js ./mock-service.js

# Create dist directory and copy mock service
RUN mkdir -p ./dist/src
RUN cp ./mock-service.js ./dist/src/main.js

# Copy Auth0 certificate
COPY ./apps/portfolio-institution-service/auth0-certificate.pem ./auth0-certificate.pem

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
RUN mkdir -p ./apps/portfolio-institution-service/dist/src ./apps/portfolio-institution-service/logs && \
    chown -R nodeuser:nodeuser /app

# Copy only the built artifacts from builder
COPY --from=builder /app/apps/portfolio-institution-service/dist/src/main.js ./apps/portfolio-institution-service/dist/src/
COPY --from=builder /app/apps/portfolio-institution-service/auth0-certificate.pem ./apps/portfolio-institution-service/auth0-certificate.pem

# Install minimal dependencies needed for the mock service
RUN yarn init -y && \
    yarn add express --production && \
    yarn cache clean

# Environment variables (non-sensitive)
ENV NODE_ENV=production
ENV PORT=3004
# Use placeholder values for sensitive data, to be injected at runtime
ENV DB_HOST=db_host_placeholder
ENV DB_PORT=5432
ENV DB_USERNAME=db_user_placeholder
ENV DB_DATABASE=portfolio_institution

# Expose service port
EXPOSE 3004

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Create startup script
RUN printf '#!/bin/sh\n\
if [ -f "apps/portfolio-institution-service/dist/src/main.js" ]; then\n\
    exec node apps/portfolio-institution-service/dist/src/main.js\n\
elif [ -f "apps/portfolio-institution-service/dist/main.js" ]; then\n\
    exec node apps/portfolio-institution-service/dist/main.js\n\
else\n\
    echo "Could not find main.js file to execute" && ls -R apps/portfolio-institution-service/dist && exit 1\n\
fi\n' > /app/startup.sh && chmod +x /app/startup.sh

# Set non-root user for better security
USER nodeuser

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/startup.sh"]
