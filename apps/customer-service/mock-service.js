const express = require('express');

console.log('Starting Customer Service...');

// Create Express app
const app = express();
const port = process.env.PORT || 3011;
const serviceName = 'customer-service';

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

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.status(200).send(`# HELP service_status Service status\n# TYPE service_status gauge\nservice_status{service="${serviceName}"} 1`);
});

// API Mock endpoints for customer service
app.get('/api/customers', (req, res) => {
  res.json({
    customers: [
      { 
        id: 1, 
        firstName: 'Jean', 
        lastName: 'Dupont', 
        email: 'jean.dupont@example.com',
        phone: '+33612345678',
        status: 'active',
        createdAt: '2025-01-15T09:30:00Z'
      },
      { 
        id: 2, 
        firstName: 'Marie', 
        lastName: 'Martin', 
        email: 'marie.martin@example.com',
        phone: '+33623456789',
        status: 'active',
        createdAt: '2025-02-20T14:15:00Z'
      },
      { 
        id: 3, 
        firstName: 'Pierre', 
        lastName: 'Bernard', 
        email: 'pierre.bernard@example.com',
        phone: '+33634567890',
        status: 'inactive',
        createdAt: '2025-03-10T11:45:00Z'
      }
    ],
    total: 3,
    page: 1,
    limit: 10
  });
});

app.get('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  
  if (customerId === 1) {
    res.json({ 
      id: 1, 
      firstName: 'Jean', 
      lastName: 'Dupont', 
      email: 'jean.dupont@example.com',
      phone: '+33612345678',
      address: {
        street: '15 Rue de Paris',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      },
      status: 'active',
      createdAt: '2025-01-15T09:30:00Z',
      subscriptions: [
        { id: 101, plan: 'premium', startDate: '2025-01-20T00:00:00Z', endDate: '2026-01-19T23:59:59Z' }
      ]
    });
  } else if (customerId === 2) {
    res.json({ 
      id: 2, 
      firstName: 'Marie', 
      lastName: 'Martin', 
      email: 'marie.martin@example.com',
      phone: '+33623456789',
      address: {
        street: '27 Avenue Victor Hugo',
        city: 'Lyon',
        postalCode: '69002',
        country: 'France'
      },
      status: 'active',
      createdAt: '2025-02-20T14:15:00Z',
      subscriptions: [
        { id: 102, plan: 'basic', startDate: '2025-02-25T00:00:00Z', endDate: '2026-02-24T23:59:59Z' }
      ]
    });
  } else {
    res.status(404).json({ 
      error: 'Customer not found',
      message: `No customer with ID ${customerId} exists`
    });
  }
});

app.get('/api/subscriptions', (req, res) => {
  res.json({
    subscriptions: [
      { 
        id: 101, 
        customerId: 1, 
        plan: 'premium', 
        status: 'active',
        startDate: '2025-01-20T00:00:00Z', 
        endDate: '2026-01-19T23:59:59Z'
      },
      { 
        id: 102, 
        customerId: 2, 
        plan: 'basic', 
        status: 'active',
        startDate: '2025-02-25T00:00:00Z', 
        endDate: '2026-02-24T23:59:59Z'
      }
    ]
  });
});

// Support for frontend routes (add route for /v1/users/me)
app.get('/v1/users/me', (req, res) => {
  // Mock authenticated user data
  res.json({
    id: "auth0|123456789",
    firstName: "Jacques",
    lastName: "Ndavaro",
    email: "jacquesndav@gmail.com",
    profilePicture: "https://lh3.googleusercontent.com/a/ACg8ocIL0yfuobxXVunH5BCpbWnpdLSHUsVuD7jtucw_o7UFsafLpyCj=s96-c",
    role: "admin",
    permissions: ["read:profile", "update:profile"],
    createdAt: "2025-01-15T09:30:00Z",
    updatedAt: "2025-08-01T14:20:00Z",
    lastLogin: "2025-08-11T10:45:00Z",
    isActive: true
  });
});

// Support for frontend routes (add route for /v1/users/me)
app.get('/v1/users/me', (req, res) => {
  // Mock authenticated user data
  res.json({
    id: "auth0|123456789",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@example.com",
    profilePicture: "https://example.com/avatar.jpg",
    role: "customer",
    permissions: ["read:profile", "update:profile"],
    createdAt: "2025-01-15T09:30:00Z",
    updatedAt: "2025-08-01T14:20:00Z",
    lastLogin: "2025-08-11T10:45:00Z",
    isActive: true
  });
});

// Mock database connection simulation
console.log('Connecting to database...');
setTimeout(() => {
  console.log('Database connected successfully');
  
  // Start the server
  app.listen(port, () => {
    console.log(`${serviceName} is running on port ${port}`);
    console.log(`API endpoints available at:`);
    console.log(`  - /api/customers`);
    console.log(`  - /api/customers/:id`);
    console.log(`  - /api/subscriptions`);
    console.log(`  - /v1/users/me (for frontend compatibility)`);
    console.log(`Health check available at: /health`);
    console.log(`Metrics available at: /metrics`);
  });
}, 1500);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down gracefully');
  process.exit(0);
});
