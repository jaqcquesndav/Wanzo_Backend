// Simplified analytics mock service without prom-client dependency
const express = require('express');

console.log('Starting Analytics Service...');

// Create Express app
const app = express();
const port = process.env.PORT || 3002;
const serviceName = 'analytics-service';

// Middleware
app.use(express.json());

// Basic routes
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        service: serviceName,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        service: serviceName,
        timestamp: new Date().toISOString()
    });
});

app.get('/analytics/dashboard', (req, res) => {
    res.json({
        dashboard: 'Analytics Dashboard',
        metrics: {
            totalUsers: Math.floor(Math.random() * 1000) + 100,
            activeUsers: Math.floor(Math.random() * 500) + 50,
            revenue: Math.floor(Math.random() * 100000) + 10000
        }
    });
});

app.get('/analytics/reports', (req, res) => {
    res.json({
        reports: [
            { id: 1, name: 'Monthly Sales', status: 'completed' },
            { id: 2, name: 'User Engagement', status: 'pending' },
            { id: 3, name: 'Revenue Analysis', status: 'completed' }
        ]
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        service: serviceName,
        path: req.originalUrl
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`${serviceName} running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
});
