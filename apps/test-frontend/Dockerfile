# syntax=docker/dockerfile:1

FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci || npm install
COPY . .
# Build-time Auth0 settings for Vite
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 5173
CMD ["npm","run","preview","--","--host","0.0.0.0","--port","5173"]
