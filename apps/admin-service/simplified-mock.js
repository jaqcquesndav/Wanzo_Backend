// Simplified mock service without prom-client dependency
const express = require('express');

console.log('Starting Admin Service...');

// Create Express app
const app = express();
const port = process.env.PORT || 3001;
const serviceName = 'admin-service';

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: serviceName,
    message: `${serviceName} mock is running`,
    timestamp: new Date().toISOString()
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

// Simplified metrics endpoint without prom-client
app.get('/metrics', (req, res) => {
  res.status(200).send(`# HELP service_status Service status\n# TYPE service_status gauge\nservice_status{service="${serviceName}"} 1\n# HELP service_requests_total Total number of requests\n# TYPE service_requests_total counter\nservice_requests_total{service="${serviceName}"} 0`);
});

// Start server
app.listen(port, () => {
  console.log(`${serviceName} mock service running on port ${port}`);
  console.log('Available endpoints:');
  console.log('- GET / - Root endpoint');
  console.log('- GET /health - Health check endpoint');
  console.log('- GET /metrics - Metrics endpoint');
});
