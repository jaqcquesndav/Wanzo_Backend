const express = require('express');
const http = require('http');

// Create Express app
const app = express();
const port = process.env.PORT || 8000;
const serviceName = 'api-gateway';

// Configuration des services
const services = {
  admin: process.env.ADMIN_SERVICE_URL || 'http://host.docker.internal:3001',
  accounting: process.env.ACCOUNTING_SERVICE_URL || 'http://host.docker.internal:3003',
  portfolio: process.env.PORTFOLIO_INSTITUTION_SERVICE_URL || 'http://host.docker.internal:3004',
  gestionCommerciale: process.env.GESTION_COMMERCIALE_SERVICE_URL || 'http://host.docker.internal:3005',
  customer: process.env.CUSTOMER_SERVICE_URL || 'http://host.docker.internal:3011'
};

console.log('Starting API Gateway...');
console.log('Service configurations:');
Object.entries(services).forEach(([name, url]) => {
  console.log(`- ${name}: ${url}`);
});

// Middleware pour parser le JSON
app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: serviceName,
    message: `${serviceName} is running`,
    timestamp: new Date().toISOString(),
    services: Object.entries(services).reduce((acc, [key, value]) => {
      acc[key] = { url: value, status: 'configured' };
      return acc;
    }, {})
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: serviceName,
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.status(200).send(`# HELP api_gateway_status API Gateway status\n# TYPE api_gateway_status gauge\napi_gateway_status{service="${serviceName}"} 1`);
});

// Customer service routes
app.get('/api/customers', (req, res) => {
  const url = `${services.customer}/api/customers`;
  console.log(`Proxying request to: ${url}`);
  
  http.get(url, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).send(data);
    });
  }).on('error', (err) => {
    console.error(`Error proxying to ${url}: ${err.message}`);
    res.status(502).json({ error: 'Bad Gateway', message: err.message });
  });
});

app.get('/api/customers/:id', (req, res) => {
  const customerId = req.params.id;
  const url = `${services.customer}/api/customers/${customerId}`;
  console.log(`Proxying request to: ${url}`);
  
  http.get(url, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).send(data);
    });
  }).on('error', (err) => {
    console.error(`Error proxying to ${url}: ${err.message}`);
    res.status(502).json({ error: 'Bad Gateway', message: err.message });
  });
});

app.get('/api/subscriptions', (req, res) => {
  const url = `${services.customer}/api/subscriptions`;
  console.log(`Proxying request to: ${url}`);
  
  http.get(url, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).send(data);
    });
  }).on('error', (err) => {
    console.error(`Error proxying to ${url}: ${err.message}`);
    res.status(502).json({ error: 'Bad Gateway', message: err.message });
  });
});

// Route 404 pour les endpoints non définis
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found in API Gateway`,
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(`Error processing request: ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`API Gateway is running on port ${port}`);
  console.log('Available routes:');
  console.log('  - /api/customers -> Customer Service');
  console.log('  - /api/customers/:id -> Customer Service');
  console.log('  - /api/subscriptions -> Customer Service');
  console.log('Health check available at: /health');
  console.log('Metrics available at: /metrics');
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down gracefully');
  process.exit(0);
});
