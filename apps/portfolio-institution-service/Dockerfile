FROM node:20-alpine AS builder

# Update Alpine packages and install security updates
RUN apk update && apk upgrade && \
    # Install common security related packages
    apk add --no-cache ca-certificates dumb-init

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY apps/portfolio-institution-service/package.json ./apps/portfolio-institution-service/

# Install dependencies with security audit
RUN npm install --legacy-peer-deps && npm audit fix --force

# Copy the rest of the application
COPY . .

# Install type definitions needed for build
RUN npm install --save-dev --legacy-peer-deps @types/aws-sdk @types/luxon @types/ms @types/multer @types/nodemailer @types/nodemailer-direct-transport @types/nodemailer-ses-transport @types/nodemailer-smtp-transport @types/oracledb @types/semver @types/uuid
RUN npm install --save-dev --legacy-peer-deps jwks-rsa

# Clear TypeScript compilation cache to ensure fresh build
RUN rm -rf apps/portfolio-institution-service/tsconfig.tsbuildinfo || true

# Build the application
RUN npm run build --prefix apps/portfolio-institution-service

# Production stage
FROM node:20-alpine AS production

# Install security packages
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates dumb-init

# Set working directory
WORKDIR /app

# Copy only the built application from the builder stage
COPY --from=builder /app/apps/portfolio-institution-service/dist /app/apps/portfolio-institution-service/dist
COPY --from=builder /app/apps/portfolio-institution-service/package.json /app/apps/portfolio-institution-service/package.json
COPY --from=builder /app/apps/portfolio-institution-service/package-lock.json /app/apps/portfolio-institution-service/package-lock.json
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

# Install only production dependencies (fallback to npm install if npm ci fails)
RUN npm ci --omit=dev --legacy-peer-deps --prefix apps/portfolio-institution-service || npm install --omit=dev --legacy-peer-deps --prefix apps/portfolio-institution-service

# Set non-root user for better security
USER node

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the service with conditional check
CMD ["sh", "-c", "if [ -f 'apps/portfolio-institution-service/dist/src/main.js' ]; then \
    node apps/portfolio-institution-service/dist/src/main.js; \
    elif [ -f 'apps/portfolio-institution-service/dist/main.js' ]; then \
    node apps/portfolio-institution-service/dist/main.js; \
    elif [ -f 'apps/portfolio-institution-service/dist/apps/portfolio-institution-service/src/main.js' ]; then \
    node apps/portfolio-institution-service/dist/apps/portfolio-institution-service/src/main.js; \
    else \
    echo 'Could not find main.js file to execute' && ls -R apps/portfolio-institution-service/dist && exit 1; \
    fi"]
