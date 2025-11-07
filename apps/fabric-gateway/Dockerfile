FROM node:18-alpine
WORKDIR /app

# Optional build args for corporate registries/proxies
ARG NPM_REGISTRY
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV npm_config_loglevel=warn \
	NODE_ENV=production \
	HTTP_PROXY=${HTTP_PROXY} \
	HTTPS_PROXY=${HTTPS_PROXY} \
	NO_PROXY=${NO_PROXY}

COPY package.json ./

# Configure npm registry/proxy if provided
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
 && if [ -n "$HTTP_PROXY" ]; then npm config set proxy "$HTTP_PROXY"; fi \
 && if [ -n "$HTTPS_PROXY" ]; then npm config set https-proxy "$HTTPS_PROXY"; fi \
 && npm ci --omit=dev || npm install --omit=dev

COPY src ./src
EXPOSE 4000
CMD ["npm","start"]
