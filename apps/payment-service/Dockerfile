FROM node:20.13.0-alpine3.19
RUN apk update && apk upgrade && apk add --no-cache ca-certificates dumb-init curl && update-ca-certificates && adduser -D -u 1001 nodeuser

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3007

# Copy prebuilt output and deps from local context (requires you to run `npm run build` in apps/payment-service first)
COPY apps/payment-service/package.json /app/package.json
COPY apps/payment-service/dist /app/dist
COPY apps/payment-service/node_modules /app/node_modules


RUN npm pkg delete scripts && \
	npm pkg set scripts.start='node dist/src/main.js' && \
	npm prune --omit=dev && \
	npm cache clean --force

EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=5 \
	CMD curl -f http://localhost:${PORT}/api/docs || curl -f http://localhost:${PORT}/health || exit 1

USER nodeuser
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "start"]
