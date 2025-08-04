# NOTE: Updated to Node.js 20-alpine to address security vulnerabilities.
# This version provides better security and performance compared to Node.js 18.
# For production, consider using a custom hardened image or additional security measures.
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY apps/gestion_commerciale_service/package.json ./apps/gestion_commerciale_service/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Install type definitions needed for build
RUN npm install --save-dev --legacy-peer-deps @types/aws-sdk @types/luxon @types/ms @types/multer @types/nodemailer @types/nodemailer-direct-transport @types/nodemailer-ses-transport @types/nodemailer-smtp-transport @types/oracledb @types/semver @types/uuid
RUN npm install --save-dev --legacy-peer-deps jwks-rsa

# Build the application
RUN npm run build --prefix apps/gestion_commerciale_service

# Set non-root user for better security
USER node

# Start the service with conditional check
CMD ["sh", "-c", "if [ -f 'apps/gestion_commerciale_service/dist/src/main.js' ]; then \
    node apps/gestion_commerciale_service/dist/src/main.js; \
    elif [ -f 'apps/gestion_commerciale_service/dist/main.js' ]; then \
    node apps/gestion_commerciale_service/dist/main.js; \
    elif [ -f 'apps/gestion_commerciale_service/dist/apps/gestion_commerciale_service/src/main.js' ]; then \
    node apps/gestion_commerciale_service/dist/apps/gestion_commerciale_service/src/main.js; \
    else \
    echo 'Could not find main.js file to execute' && ls -R apps/gestion_commerciale_service/dist && exit 1; \
    fi"]
