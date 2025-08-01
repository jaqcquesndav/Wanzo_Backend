const express = require('express');
const { Registry, Counter, Gauge } = require('prom-client');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;
const serviceName = process.env.SERVICE_NAME || 'mock-service';

// Setup Prometheus registry
const register = new Registry();
const requestCounter = new Counter({
  name: ${serviceName}_requests_total,
  help: 'Total number of requests',
  registers: [register]
});

const healthGauge = new Gauge({
  name: ${serviceName}_health_status,
  help: 'Health status of the service (1 = healthy, 0 = unhealthy)',
  registers: [register]
});
healthGauge.set(1); // Service is healthy by default

// Basic routes
app.get('/', (req, res) => {
  requestCounter.inc();
  res.json({ 
    status: 'ok', 
    message: ${serviceName} mock is running,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  requestCounter.inc();
  res.json({ status: 'healthy' });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Start the server
app.listen(port, () => {
  console.log(${serviceName} mock service running on port );
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down gracefully');
  process.exit(0);
});
