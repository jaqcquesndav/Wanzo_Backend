// Simplified mock service without prom-client dependency
const express = require('express');

console.log('Starting Accounting Service...');

// Create Express app
const app = express();
const port = process.env.PORT || 3007;
const serviceName = 'accounting-service';

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

// Accounting mock API endpoints
app.get('/api/accounting/transactions', (req, res) => {
  res.json({
    transactions: [
      { id: '1001', amount: 5000, type: 'credit', date: '2023-10-01T10:30:00Z' },
      { id: '1002', amount: 2500, type: 'debit', date: '2023-10-02T14:15:00Z' },
      { id: '1003', amount: 7500, type: 'credit', date: '2023-10-03T09:45:00Z' }
    ],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/accounting/journal', (req, res) => {
  res.json({
    success: true,
    message: "Journal entry created successfully",
    entryId: Math.floor(Math.random() * 10000),
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
  console.log('- GET /api/accounting/transactions - Get transactions');
  console.log('- POST /api/accounting/journal - Create journal entry');
});
