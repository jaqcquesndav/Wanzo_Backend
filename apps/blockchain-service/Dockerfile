FROM node:18-alpine AS builder
WORKDIR /app

ARG NPM_REGISTRY
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV npm_config_loglevel=warn \
	HTTP_PROXY=${HTTP_PROXY} \
	HTTPS_PROXY=${HTTPS_PROXY} \
	NO_PROXY=${NO_PROXY}

COPY package.json ./
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
 && npm install
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY package.json ./package.json
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
 && npm install --omit=dev --silent
EXPOSE 3015
CMD ["node", "dist/main.js"]
