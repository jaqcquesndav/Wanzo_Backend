// mock-service.js
const express = require('express');
const promClient = require('prom-client');

const app = express();
const port = process.env.PORT || 3003;

// Setup Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'accounting-service',
    version: '1.0.0-mock'
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'accounting-service',
    status: 'running mock version',
    message: 'This is a temporary mock service until TypeScript errors are resolved'
  });
});

// Basic API stub for accounting routes
app.get('/api/accounting/*', (req, res) => {
  res.status(200).json({
    message: 'Mock accounting service response',
    path: req.path,
    status: 'success',
    data: { mock: true }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Mock accounting-service running on port ${port}`);
});
