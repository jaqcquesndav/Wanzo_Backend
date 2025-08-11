// Simplified mock service without prom-client dependency
const express = require('express');

console.log('Starting Gestion Commerciale Service...');

// Create Express app
const app = express();
const port = process.env.PORT || 3006;
const serviceName = 'gestion-commerciale-service';

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

// Commercial management mock API endpoints
app.post('/api/commercial/leads', (req, res) => {
  res.json({
    success: true,
    message: "Lead created successfully",
    leadId: Math.floor(Math.random() * 10000),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/commercial/stats', (req, res) => {
  res.json({
    totalLeads: 156,
    convertedLeads: 42,
    pendingLeads: 87,
    rejectedLeads: 27,
    conversionRate: "26.9%",
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`${serviceName} mock service running on port ${port}`);
  console.log('Available endpoints:');
  console.log('- GET / - Root endpoint');
  console.log('- GET /health - Health check endpoint');
  console.log('- GET /metrics - Metrics endpoint');
  console.log('- POST /api/commercial/leads - Create new lead');
  console.log('- GET /api/commercial/stats - Get commercial statistics');
});
