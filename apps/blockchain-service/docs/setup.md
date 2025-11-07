# Setup & Configuration

## Environment
- IPFS_API_URL: e.g., http://ipfs:5001/api/v0 (Docker) or http://localhost:5001/api/v0
- AUTH0_ENABLED: true|false; AUTH0_SKIP_SCOPES for dev
- FABRIC_GATEWAY_URL: e.g., http://fabric-gateway:4000 (Docker) or http://localhost:4010

## Docker
- docker compose up -d ipfs blockchain-service
- For fabric: docker compose up -d fabric-gateway blockchain-service

## Fabric gateway
- Provide `fabric/ccp/connection.json` and wallet identities under `fabric/wallet/`
- Set MSPID, IDENTITY, (optional) CA_URL, CA_NAME, CA_ADMIN_IDENTITY in docker-compose
- Verify gateway: http://localhost:4010/status and /readiness

## Tests
- npm run test:ipfs:real:report — IPFS Kubo e2e report
- npm run test:fabric:report — Fabric mode e2e report (tolerant if not configured)

## Swagger
- http://localhost:3015/docs (requires service running)
