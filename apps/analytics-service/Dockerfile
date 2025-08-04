FROM node:20.17.0-bookworm-slim AS builder

# Install security updates and required packages
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY apps/analytics-service/package.json ./apps/analytics-service/

# Install dependencies with security audit
RUN npm install --legacy-peer-deps && npm audit fix --force

# Copy the rest of the application
COPY . .

# Install type definitions needed for build
RUN npm install --save-dev --legacy-peer-deps @types/aws-sdk @types/luxon @types/ms @types/multer @types/nodemailer @types/nodemailer-direct-transport @types/nodemailer-ses-transport @types/nodemailer-smtp-transport @types/oracledb @types/semver @types/uuid
RUN npm install --save-dev --legacy-peer-deps jwks-rsa

# Clear TypeScript compilation cache to ensure fresh build
RUN rm -rf apps/analytics-service/tsconfig.tsbuildinfo || true

# Build the application
RUN npm run build --prefix apps/analytics-service

# Production stage - Using distroless for better security
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS production

# Set working directory
WORKDIR /app

# Copy built application and dependencies from builder
COPY --from=builder --chown=nonroot:nonroot /app/apps/analytics-service/dist /app/apps/analytics-service/dist
COPY --from=builder --chown=nonroot:nonroot /app/apps/analytics-service/package.json /app/apps/analytics-service/package.json
COPY --from=builder --chown=nonroot:nonroot /app/package.json /app/package.json
COPY --from=builder --chown=nonroot:nonroot /app/node_modules /app/node_modules

# Expose port
EXPOSE 3004

# Set environment
ENV NODE_ENV=production
ENV PORT=3004

# Start the application directly with Node.js
CMD ["node", "apps/analytics-service/dist/src/main.js"]
