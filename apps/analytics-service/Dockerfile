FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY apps/analytics-service/package.json ./apps/analytics-service/

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Install type definitions needed for build
RUN npm install --save-dev --legacy-peer-deps @types/aws-sdk @types/luxon @types/ms @types/multer @types/nodemailer @types/nodemailer-direct-transport @types/nodemailer-ses-transport @types/nodemailer-smtp-transport @types/oracledb @types/semver @types/uuid
RUN npm install --save-dev --legacy-peer-deps jwks-rsa

# Build the application
RUN npm run build --prefix apps/analytics-service

# Set non-root user for better security
USER node

# Start the service with conditional check
CMD ["sh", "-c", "if [ -f 'apps/analytics-service/dist/src/main.js' ]; then \
    node apps/analytics-service/dist/src/main.js; \
    elif [ -f 'apps/analytics-service/dist/main.js' ]; then \
    node apps/analytics-service/dist/main.js; \
    elif [ -f 'apps/analytics-service/dist/apps/analytics-service/src/main.js' ]; then \
    node apps/analytics-service/dist/apps/analytics-service/src/main.js; \
    else \
    echo 'Could not find main.js file to execute' && ls -R apps/analytics-service/dist && exit 1; \
    fi"]
