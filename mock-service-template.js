const express = require('express');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;
const serviceName = process.env.SERVICE_NAME || 'generic-service';

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: serviceName });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: serviceName,
    message: `${serviceName} is running in mock mode`
  });
});

// Generic API endpoint for testing
app.all('/api/*', (req, res) => {
  const path = req.params[0];
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${serviceName} at path ${path}`);
  
  res.json({
    mock: true,
    service: serviceName,
    path: path,
    method: req.method,
    query: req.query,
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(port, () => {
  console.log(`Mock ${serviceName} running on port ${port}`);
  console.log('Available endpoints:');
  console.log('- GET /health - Health check endpoint');
  console.log('- GET / - Root endpoint');
  console.log('- ALL /api/* - Generic API endpoint');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
