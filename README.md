# Kiota Microservices Suite

## Description
Kiota Suit is a comprehensive financial management platform built with a microservices architecture. It provides various services for accounting, portfolio management, and financial analytics.

## Services Architecture

### Admin Service (Port 3001)
- System administration
- Company management
- User management
- Document management

### Analytics Service (Port 3002)
- Financial analytics
- Market analysis
- Risk assessment
- Performance metrics

### Accounting Service (Port 3003)
- General ledger
- Journal entries
- Financial statements
- Tax management

### Portfolio SME Service (Port 3004)
- SME portfolio management
- Credit operations
- Leasing operations
- Asset management

### Portfolio Institution Service (Port 3005)
- Institutional portfolio management
- Investment operations
- Risk management
- Performance tracking

## Prerequisites
- Node.js >= 18
- PostgreSQL >= 13
- Docker (optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/KS_Backend_All.git
cd kiota-suit
```

2. Install dependencies:
```bash
npm install
```

3. Create environment files:
```bash
cp apps/admin-service/.env.example apps/admin-service/.env
cp apps/analytics-service/.env.example apps/analytics-service/.env
cp apps/accounting-service/.env.example apps/accounting-service/.env
cp apps/portfolio-institution-service/.env.example apps/portfolio-institution-service/.env
```

4. Update environment variables in each .env file

5. Start all services:
```bash
npm run dev
```

Or start individual services:
```bash
npm run dev --filter=admin-service
npm run dev --filter=analytics-service
npm run dev --filter=accounting-service
npm run dev --filter=portfolio-institution-service
```

## API Documentation
Each service exposes its own Swagger documentation at `/api`:

## Testing

### Hyperledger Fabric

- A production-oriented fabric-gateway fronts your Fabric network.
- Gateway URL: host http://localhost:4010 (container http://fabric-gateway:4000)
- Setup steps:
	1. Place your connection profiles and wallets:
	   - Org1 CCP at `./fabric/org-kiota/ccp/connection.json`, wallet at `./fabric/org-kiota/wallet/`.
	   - Org2 CCP at `./fabric/org-bank/ccp/connection.json`, wallet at `./fabric/org-bank/wallet/` (if multi‑org).
	2. Ensure the wallet has an application identity label (e.g. `pme1`).
	3. Start/refresh services: `docker compose up -d --build fabric-gateway blockchain-service`.
	4. Verify config: `GET http://localhost:4010/status` should return `configured: true`.

Notes:
- The blockchain-service now calls the real Fabric via the gateway only (no mock mode).
- The gateway invokes chaincode with exact parameter counts (Anchor(refId, sha256), AnchorCID(refId, cid), Verify(refId)).
## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
