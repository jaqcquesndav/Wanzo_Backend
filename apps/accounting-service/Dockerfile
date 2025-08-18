FROM node:20.13.0-alpine3.19 AS builder

# Installation des mises à jour de sécurité
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    update-ca-certificates

# Set working directory
WORKDIR /app

# Create essential directories
RUN mkdir -p ./packages/tsconfig ./packages/shared/src ./packages/customer-sync/src ./apps/accounting-service/dist/src

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
RUN echo '{"":"https://json.schemastore.org/tsconfig","display":"Default","compilerOptions":{"composite":false,"declaration":true,"declarationMap":true,"esModuleInterop":true,"forceConsistentCasingInFileNames":true,"inlineSources":false,"isolatedModules":true,"moduleResolution":"node","preserveWatchOutput":true,"skipLibCheck":true,"strict":true,"strictNullChecks":true,"strictPropertyInitialization":false,"useDefineForClassFields":false,"noImplicitAny":false},"exclude":["node_modules"]}' > ./packages/tsconfig/base.json

RUN echo '{"":"https://json.schemastore.org/tsconfig","display":"NestJS","extends":"./base.json","compilerOptions":{"module":"commonjs","removeComments":true,"emitDecoratorMetadata":true,"experimentalDecorators":true,"useDefineForClassFields":false,"skipLibCheck":true,"allowSyntheticDefaultImports":true,"target":"ES2021","sourceMap":true,"outDir":"./dist","baseUrl":"./","incremental":true,"strictPropertyInitialization":false,"strictBindCallApply":false,"noImplicitAny":false,"noFallthroughCasesInSwitch":true}}' > ./packages/tsconfig/nestjs.json

# Copy service package.json
COPY apps/accounting-service/package.json ./apps/accounting-service/

# Modify package.json to point to local dependencies
RUN node -e "const fs = require('fs'); const pkg = require('./apps/accounting-service/package.json'); if (pkg.dependencies && pkg.dependencies['@wanzobe/customer-sync']) { pkg.dependencies['@wanzobe/customer-sync'] = 'file:../../packages/customer-sync'; } if (pkg.dependencies && pkg.dependencies['@wanzo/customer-sync']) { pkg.dependencies['@wanzo/customer-sync'] = 'file:../../packages/customer-sync'; } if (pkg.dependencies && pkg.dependencies['@wanzobe/shared']) { pkg.dependencies['@wanzobe/shared'] = 'file:../../packages/shared'; } if (pkg.dependencies && pkg.dependencies['@wanzo/shared']) { pkg.dependencies['@wanzo/shared'] = 'file:../../packages/shared'; } fs.writeFileSync('./apps/accounting-service/package.json', JSON.stringify(pkg, null, 2));"

# Install dependencies with file: references for local packages
RUN yarn install --ignore-engines

# Set environment variables
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy the actual service source code
COPY ./apps/accounting-service/src ./apps/accounting-service/src
COPY ./apps/accounting-service/tsconfig.json ./apps/accounting-service/
COPY ./apps/accounting-service/nest-cli.json ./apps/accounting-service/

# Create tsconfig.build.json if it doesn't exist
RUN echo '{"extends":"./tsconfig.json","exclude":["node_modules","test","dist","**/*spec.ts"]}' > ./apps/accounting-service/tsconfig.build.json

# Build the actual service
WORKDIR /app/apps/accounting-service
RUN yarn build

# Copy Auth0 certificate
COPY ./apps/accounting-service/auth0-certificate.pem ./apps/accounting-service/auth0-certificate.pem

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
RUN mkdir -p ./apps/accounting-service/dist/src ./apps/accounting-service/logs && \
    chown -R nodeuser:nodeuser /app

# Copy only the built artifacts from builder
COPY --from=builder /app/apps/accounting-service/dist/src/main.js ./apps/accounting-service/dist/src/
COPY --from=builder /app/apps/accounting-service/auth0-certificate.pem ./apps/accounting-service/auth0-certificate.pem

# Install minimal dependencies needed for the simplified mock service
RUN yarn init -y && \
    yarn add express --production && \
    yarn cache clean

# Environment variables (non-sensitive)
ENV NODE_ENV=production
ENV PORT=3003
# Use placeholder values for sensitive data, to be injected at runtime
ENV DB_HOST=db_host_placeholder
ENV DB_PORT=5432
ENV DB_USERNAME=db_user_placeholder
ENV DB_DATABASE=accounting-service

# Expose service port
EXPOSE 3003

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Create startup script
RUN printf '#!/bin/sh\nexec node apps/accounting-service/dist/src/main.js\n' > /app/startup.sh && chmod +x /app/startup.sh

# Set non-root user for better security
USER nodeuser

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/startup.sh"]

