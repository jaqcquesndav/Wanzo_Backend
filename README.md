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
- Admin Service: http://localhost:3001/api
- Analytics Service: http://localhost:3002/api
- Accounting Service: http://localhost:3003/api
- Portfolio SME Service: http://localhost:3004/api
- Portfolio Institution Service: http://localhost:3005/api

## Testing
```bash
npm test
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
