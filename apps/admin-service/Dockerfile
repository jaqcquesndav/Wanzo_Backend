# Utilisation d'une image Node.js spécifique et sécurisée
FROM node:20.13.0-alpine3.19 AS builder

# Installation des mises à jour de sécurité
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    update-ca-certificates

# Set working directory
WORKDIR /app

# Create essential directories
RUN mkdir -p ./packages/tsconfig ./packages/shared/src ./packages/customer-sync/src ./apps/admin-service/dist/src

# Copy only the essential files for building
COPY package.json ./
COPY turbo.json ./

# Copy local package files first
COPY packages/shared/package.json ./packages/shared/
COPY packages/customer-sync/package.json ./packages/customer-sync/

# Create mock modules for local packages
RUN echo 'module.exports = {};' > ./packages/shared/src/index.js && \
    echo 'module.exports = {};' > ./packages/customer-sync/src/index.js

# Create TypeScript config files
RUN echo '{"$schema":"https://json.schemastore.org/tsconfig","display":"Default","compilerOptions":{"composite":false,"declaration":true,"declarationMap":true,"esModuleInterop":true,"forceConsistentCasingInFileNames":true,"inlineSources":false,"isolatedModules":true,"moduleResolution":"node","preserveWatchOutput":true,"skipLibCheck":true,"strict":true,"strictNullChecks":true,"strictPropertyInitialization":false,"useDefineForClassFields":false,"noImplicitAny":false},"exclude":["node_modules"]}' > ./packages/tsconfig/base.json

RUN echo '{"$schema":"https://json.schemastore.org/tsconfig","display":"NestJS","extends":"./base.json","compilerOptions":{"module":"commonjs","removeComments":true,"emitDecoratorMetadata":true,"experimentalDecorators":true,"useDefineForClassFields":false,"skipLibCheck":true,"allowSyntheticDefaultImports":true,"target":"ES2021","sourceMap":true,"outDir":"./dist","baseUrl":"./","incremental":true,"strictPropertyInitialization":false,"strictBindCallApply":false,"noImplicitAny":false,"noFallthroughCasesInSwitch":true}}' > ./packages/tsconfig/nestjs.json

# Copy admin service package.json
COPY apps/admin-service/package.json ./apps/admin-service/

# Modify package.json to point to local dependencies
RUN node -e "const fs = require('fs'); const pkg = require('./apps/admin-service/package.json'); if (pkg.dependencies && pkg.dependencies['@wanzobe/customer-sync']) { pkg.dependencies['@wanzobe/customer-sync'] = 'file:../../packages/customer-sync'; } if (pkg.dependencies && pkg.dependencies['@wanzo/customer-sync']) { pkg.dependencies['@wanzo/customer-sync'] = 'file:../../packages/customer-sync'; } if (pkg.dependencies && pkg.dependencies['@wanzobe/shared']) { pkg.dependencies['@wanzobe/shared'] = 'file:../../packages/shared'; } if (pkg.dependencies && pkg.dependencies['@wanzo/shared']) { pkg.dependencies['@wanzo/shared'] = 'file:../../packages/shared'; } fs.writeFileSync('./apps/admin-service/package.json', JSON.stringify(pkg, null, 2));"

# Install dependencies with file: references for local packages
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps --force

# Set environment variables
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy the existing mock service file
COPY ./apps/admin-service/mock-service.js ./apps/admin-service/mock-service.js

# Create dist directory and copy mock service
RUN mkdir -p ./apps/admin-service/dist/src
RUN cp ./apps/admin-service/mock-service.js ./apps/admin-service/dist/src/main.js

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
RUN mkdir -p ./apps/admin-service/dist/src ./apps/admin-service/logs && \
    chown -R nodeuser:nodeuser /app

# Copy only the built artifacts from builder
COPY --from=builder /app/apps/admin-service/dist/src/main.js ./apps/admin-service/dist/src/

# Install minimal dependencies needed for the mock service
RUN npm init -y && \
    npm install --no-optional --production --legacy-peer-deps express prom-client && \
    npm cache clean --force

# Environment variables (non-sensitive)
ENV NODE_ENV=production
ENV PORT=3001
# Use placeholder values for sensitive data, to be injected at runtime
ENV DB_HOST=db_host_placeholder
ENV DB_PORT=5432
ENV DB_USERNAME=db_user_placeholder
ENV DB_DATABASE=admin-service

# Expose service port
EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1





# Create startup script
RUN printf '#!/bin/sh\n\
if [ -f "apps/admin-service/dist/src/main.js" ]; then\n\
    exec node apps/admin-service/dist/src/main.js\n\
elif [ -f "apps/admin-service/dist/main.js" ]; then\n\
    exec node apps/admin-service/dist/main.js\n\
elif [ -f "apps/admin-service/dist/apps/admin-service/src/main.js" ]; then\n\
    exec node apps/admin-service/dist/apps/admin-service/src/main.js\n\
else\n\
    echo "Could not find main.js file to execute" && ls -R apps/admin-service/dist && exit 1\n\
fi\n' > /app/startup.sh && chmod +x /app/startup.sh

# Set non-root user for better security
USER nodeuser

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/startup.sh"]
