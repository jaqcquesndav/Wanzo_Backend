const express = require('express');
const http = require('http');

// Create Express app
const app = express();
const port = process.env.PORT || 8000;
const serviceName = 'api-gateway';

// Configuration des services
const services = {
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3001',
  accounting: process.env.ACCOUNTING_SERVICE_URL || 'http://localhost:3003',
  portfolio: process.env.PORTFOLIO_INSTITUTION_SERVICE_URL || 'http://localhost:3004',
  gestionCommerciale: process.env.GESTION_COMMERCIALE_SERVICE_URL || 'http://localhost:3005',
  customer: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3011'
};

console.log('Starting API Gateway...');
console.log('Service configurations:');
Object.entries(services).forEach(([name, url]) => {
  console.log(`- ${name}: ${url}`);
});

// Middleware pour parser le JSON
app.use(express.json());

// Fonction de proxy générique
const proxyRequest = (targetUrl, req, res) => {
  // Construire l'URL correctement
  let baseUrl;
  try {
    baseUrl = new URL(targetUrl);
  } catch (error) {
    console.error(`Invalid target URL: ${targetUrl}`);
    res.status(500).json({ error: 'Internal Server Error', message: 'Invalid target URL configuration' });
    return;
  }
  
  // Utiliser le chemin de la requête d'origine
  const fullUrl = new URL(req.path, baseUrl);
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      fullUrl.searchParams.append(key, req.query[key]);
    });
  }
  
  console.log(`Proxying request to: ${fullUrl.toString()}`);
  
  const options = {
    hostname: fullUrl.hostname,
    port: fullUrl.port,
    path: fullUrl.pathname + fullUrl.search,
    method: req.method,
    headers: { ...req.headers, host: fullUrl.host }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.statusCode = proxyRes.statusCode;
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error(`Proxy error: ${error.message}`);
    res.statusCode = 502;
    res.end(`{"error": "Bad Gateway", "message": "Service Unavailable"}`);
  });

  if (req.body) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.end();
};

// Routes de base
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: serviceName,
    message: `${serviceName} is running`,
    timestamp: new Date().toISOString(),
    services: Object.fromEntries(
      Object.entries(services).map(([name, url]) => [name, { url, status: 'configured' }])
    )
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

// Routes pour l'admin service
app.all('/api/admin*', (req, res) => {
  proxyRequest(services.admin, req, res);
});

// Routes pour l'accounting service
app.all('/api/accounting*', (req, res) => {
  proxyRequest(services.accounting, req, res);
});

// Routes pour le portfolio service
app.all('/api/portfolio*', (req, res) => {
  proxyRequest(services.portfolio, req, res);
});

// Routes pour le service de gestion commerciale
app.all('/api/commercial*', (req, res) => {
  proxyRequest(services.gestionCommerciale, req, res);
});

// Routes pour le service client
app.all('/api/customers*', (req, res) => {
  proxyRequest(services.customer, req, res);
});

app.all('/api/subscriptions*', (req, res) => {
  proxyRequest(services.customer, req, res);
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
  console.log('  - /api/admin/* -> Admin Service');
  console.log('  - /api/accounting/* -> Accounting Service');
  console.log('  - /api/portfolio/* -> Portfolio Institution Service');
  console.log('  - /api/commercial/* -> Gestion Commerciale Service');
  console.log('  - /api/customers/* -> Customer Service');
  console.log('  - /api/subscriptions/* -> Customer Service');
  console.log('Health check available at: /health');
  console.log('Metrics available at: /metrics');
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down gracefully');
  process.exit(0);
});
