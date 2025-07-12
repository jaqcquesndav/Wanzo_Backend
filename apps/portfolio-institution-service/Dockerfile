FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY apps/portfolio-institution-service/package.json ./apps/portfolio-institution-service/

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Install type definitions needed for build
RUN npm install --save-dev --legacy-peer-deps @types/aws-sdk @types/luxon @types/ms @types/multer @types/nodemailer @types/nodemailer-direct-transport @types/nodemailer-ses-transport @types/nodemailer-smtp-transport @types/oracledb @types/semver @types/uuid
RUN npm install --save-dev --legacy-peer-deps jwks-rsa

# Build the application
RUN npm run build --prefix apps/portfolio-institution-service

# Set non-root user for better security
USER node

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
