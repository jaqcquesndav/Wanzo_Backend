// Simplified API Gateway mock service
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Try to load mock data
let adminMocks;
try {
  adminMocks = require('./mocks/admin-mocks');
  console.log('Successfully loaded admin mocks');
} catch (error) {
  console.log('Could not load admin mocks, will create inline mocks:', error.message);
  // Inline mocks will be defined later if needed
  adminMocks = null;
}

// Create Express app
const app = express();
const port = process.env.PORT || 8000;
const serviceName = 'api-gateway';

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-request-time, x-client-version');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS method for preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Service configurations
const services = {
  admin: process.env.ADMIN_SERVICE_URL || 'http://kiota-admin-service:3001',
  accounting: process.env.ACCOUNTING_SERVICE_URL || 'http://kiota-accounting-service:3003',
  portfolio: process.env.PORTFOLIO_INSTITUTION_SERVICE_URL || 'http://kiota-portfolio-institution-service:3005',
  gestionCommerciale: process.env.GESTION_COMMERCIALE_SERVICE_URL || 'http://kiota-gestion-commerciale-service:3006',
  customer: process.env.CUSTOMER_SERVICE_URL || 'http://kiota-customer-service:3011'
};

console.log('Starting API Gateway...');
console.log('Service configurations:');
Object.entries(services).forEach(([name, url]) => {
  console.log(`- ${name}: ${url}`);
});

// JSON parsing middleware
app.use(express.json());

// Root endpoint
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

// Simple proxy function without using path-to-regexp
function simpleProxy(targetBaseUrl) {
  return (req, res) => {
    try {
      // Extract path from original request
      const path = req.url;
      const fullUrl = `${targetBaseUrl}${path}`;
      
      console.log(`Proxying request to: ${fullUrl}`);
      
      // Parse URL to get components
      const targetUrl = new URL(fullUrl);
      
      const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: { 
          ...req.headers, 
          host: targetUrl.host 
        }
      };

      const proxyReq = http.request(options, (proxyRes) => {
        res.statusCode = proxyRes.statusCode;
        
        // Copy headers from proxied response
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });
        
        // Pipe the response data
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (error) => {
        console.error(`Proxy error: ${error.message}`);
        if (!res.headersSent) {
          res.status(502).json({
            error: 'Bad Gateway',
            message: 'Service Unavailable',
            service: targetBaseUrl
          });
        }
      });

      // If there's a request body, send it to the proxied endpoint
      if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
      }
      
      proxyReq.end();
    } catch (error) {
      console.error(`Proxy error for ${targetBaseUrl}: ${error.message}`);
      res.status(500).json({
        error: 'Internal Server Error', 
        message: 'Failed to proxy request',
        details: error.message
      });
    }
  };
}

// Admin Service routes - direct mapping for frontend compatibility
app.use('/admin/auth/validate-token', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      validateToken: (req, res) => {
        console.log('INLINE MOCK: Returning validate token response');
        res.json({
          valid: true,
          user: {
            id: 'mock-user-id',
            email: 'admin@example.com',
            role: 'admin',
            permissions: ['read:all', 'write:all', 'admin:all']
          }
        });
      }
    };
  }

  // Try to proxy to real service first
  const proxyReq = http.request({
    hostname: new URL(services.admin).hostname,
    port: new URL(services.admin).port,
    path: '/auth/validate-token',
    method: req.method,
    headers: { ...req.headers, host: new URL(services.admin).host }
  }, (proxyRes) => {
    // If we get a 404 or 5xx response, use mock data instead
    if (proxyRes.statusCode === 404 || proxyRes.statusCode >= 500) {
      if (adminMocks && adminMocks.validateToken) {
        adminMocks.validateToken(req, res);
      } else {
        res.status(500).json({ error: 'No mock available for this endpoint' });
      }
      return;
    }

    // Otherwise, forward the real response
    res.statusCode = proxyRes.statusCode;
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (error) => {
    console.error(`Proxy error: ${error.message}`);
    if (!res.headersSent) {
      // Use mock data on error
      if (adminMocks && adminMocks.validateToken) {
        adminMocks.validateToken(req, res);
      } else {
        res.status(500).json({ error: 'No mock available for this endpoint' });
      }
    }
  });
  
  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.end();
});

app.use('/admin/auth/me', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      userProfile: (req, res) => {
        console.log('INLINE MOCK: Returning user profile response');
        res.json({
          id: 'mock-user-id',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          role: 'admin',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-08-01T00:00:00.000Z',
          permissions: ['read:all', 'write:all', 'admin:all']
        });
      }
    };
  }

  // Use mock directly - route likely not implemented in service
  console.log('Using mock data for /admin/auth/me');
  if (adminMocks && adminMocks.userProfile) {
    adminMocks.userProfile(req, res);
  } else {
    res.json({
      id: 'mock-user-id',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['read:all', 'write:all', 'admin:all']
    });
  }
});

app.use('/admin/customers', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      customers: (req, res) => {
        console.log('INLINE MOCK: Returning customers response');
        res.json({
          items: [],
          totalCount: 0,
          page: 1,
          totalPages: 0
        });
      }
    };
  }

  // Use mock directly - route likely not implemented in service
  console.log('Using mock data for /admin/customers');
  if (adminMocks && adminMocks.customers) {
    adminMocks.customers(req, res);
  } else {
    res.json({
      items: [],
      totalCount: 0,
      page: 1,
      totalPages: 0
    });
  }
});

app.use('/admin/users', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      users: (req, res) => {
        console.log('INLINE MOCK: Returning users response');
        res.json([]);
      }
    };
  }

  // Use mock directly - route likely not implemented in service
  console.log('Using mock data for /admin/users');
  if (adminMocks && adminMocks.users) {
    adminMocks.users(req, res);
  } else {
    res.json([]);
  }
});

// Specific route for /admin/api/users (frontend compatibility)
app.use('/admin/api/users', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      users: (req, res) => {
        console.log('INLINE MOCK: Returning users with pagination response');
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        res.json({
          items: Array.from({ length: Math.min(limit, 3) }).map((_, i) => ({
            id: `user-${(page-1)*limit + i + 1}`,
            firstName: `Admin${(page-1)*limit + i + 1}`,
            lastName: `User${(page-1)*limit + i + 1}`,
            email: `admin${(page-1)*limit + i + 1}@example.com`,
            role: ['admin', 'manager', 'staff'][i % 3],
            status: 'active',
            createdAt: '2025-01-01T00:00:00.000Z'
          })),
          totalCount: 3,
          page,
          totalPages: Math.ceil(3 / limit)
        });
      }
    };
  }

  // Use mock directly - route likely not implemented in service
  console.log('Using mock data for /admin/api/users');
  if (adminMocks && adminMocks.users) {
    adminMocks.users(req, res);
  } else {
    // Default response if mock function not available
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    res.json({
      items: Array.from({ length: Math.min(limit, 3) }).map((_, i) => ({
        id: `user-${(page-1)*limit + i + 1}`,
        firstName: `Admin${(page-1)*limit + i + 1}`,
        lastName: `User${(page-1)*limit + i + 1}`,
        email: `admin${(page-1)*limit + i + 1}@example.com`,
        role: ['admin', 'manager', 'staff'][i % 3],
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z'
      })),
      totalCount: 3,
      page,
      totalPages: Math.ceil(3 / limit)
    });
  }
});

app.use('/admin/finance', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      financeSummary: (req, res) => {
        console.log('INLINE MOCK: Returning finance summary response');
        res.json({
          totalRevenue: 0,
          monthlyRevenue: 0,
          activeSubscriptions: 0,
          revenueByMonth: []
        });
      }
    };
  }

  // Use mock directly - route likely not implemented in service
  console.log('Using mock data for /admin/finance');
  if (adminMocks && adminMocks.financeSummary) {
    adminMocks.financeSummary(req, res);
  } else {
    res.json({
      totalRevenue: 0,
      monthlyRevenue: 0,
      activeSubscriptions: 0,
      revenueByMonth: []
    });
  }
});

// Specific routes for finance endpoints
app.use('/admin/api/finance/subscriptions', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      subscriptions: (req, res) => {
        console.log('INLINE MOCK: Returning subscriptions data');
        res.json({
          items: [],
          totalCount: 0,
          page: 1,
          totalPages: 0
        });
      }
    };
  }

  // Use mock directly - route likely not implemented in service
  console.log('Using mock data for /admin/api/finance/subscriptions');
  if (adminMocks && adminMocks.subscriptions) {
    adminMocks.subscriptions(req, res);
  } else {
    res.json({
      items: [],
      totalCount: 0,
      page: 1,
      totalPages: 0
    });
  }
});

app.use('/admin/api/finance/payments', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      payments: (req, res) => {
        console.log('INLINE MOCK: Returning payments data');
        res.json({
          items: [],
          totalCount: 0,
          page: 1,
          totalPages: 0
        });
      }
    };
  }

  // Use mock directly - route likely not implemented in service
  console.log('Using mock data for /admin/api/finance/payments');
  if (adminMocks && adminMocks.payments) {
    adminMocks.payments(req, res);
  } else {
    res.json({
      items: [],
      totalCount: 0,
      page: 1,
      totalPages: 0
    });
  }
});

app.use('/admin/tokens', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      tokenPackages: (req, res) => {
        console.log('INLINE MOCK: Returning token packages data');
        res.json([]);
      }
    };
  }

  // Use mock directly - route likely not implemented in service
  console.log('Using mock data for /admin/tokens');
  if (adminMocks && adminMocks.tokenPackages) {
    adminMocks.tokenPackages(req, res);
  } else {
    res.json([]);
  }
});

app.use('/admin/dashboard', (req, res) => {
  if (!adminMocks) {
    // Create inline mock if admin-mocks.js wasn't loaded
    adminMocks = {
      dashboard: (req, res) => {
        console.log('INLINE MOCK: Returning dashboard data');
        res.json({
          userStats: {
            total: 0,
            active: 0,
            newThisMonth: 0
          },
          subscriptionStats: {
            total: 0,
            active: 0,
            newThisMonth: 0
          },
          revenueStats: {
            totalRevenue: 0,
            monthlyRevenue: 0,
            growthRate: 0
          }
        });
      }
    };
  }

  // Use mock directly - route likely not implemented in service
  console.log('Using mock data for /admin/dashboard');
  if (adminMocks && adminMocks.dashboard) {
    adminMocks.dashboard(req, res);
  } else {
    res.json({
      userStats: {
        total: 0,
        active: 0,
        newThisMonth: 0
      },
      subscriptionStats: {
        total: 0,
        active: 0,
        newThisMonth: 0
      },
      revenueStats: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        growthRate: 0
      }
    });
  }
});

// General route handling - use these as fallbacks for routes not explicitly defined above
app.use('/api/admin', simpleProxy(services.admin));
app.use('/admin', simpleProxy(services.admin));
app.use('/api/accounting', simpleProxy(services.accounting));
app.use('/accounting', simpleProxy(services.accounting));
app.use('/api/portfolio', simpleProxy(services.portfolio));
app.use('/portfolio', simpleProxy(services.portfolio));
app.use('/api/commercial', simpleProxy(services.gestionCommerciale));
app.use('/commerce', simpleProxy(services.gestionCommerciale));
app.use('/api/customers', simpleProxy(services.customer));
app.use('/customers', simpleProxy(services.customer));
app.use('/api/subscriptions', simpleProxy(services.customer));
app.use('/subscriptions', simpleProxy(services.customer));
app.use('/customer/land/api', simpleProxy(services.customer));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found in API Gateway`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`Error processing request: ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`API Gateway is running on port ${port}`);
  console.log('Available routes:');
  console.log('  - /api/admin/* -> Admin Service');
  console.log('  - /admin/* -> Admin Service (direct access)');
  console.log('  - /api/accounting/* -> Accounting Service');
  console.log('  - /accounting/* -> Accounting Service (direct access)');
  console.log('  - /api/portfolio/* -> Portfolio Institution Service');
  console.log('  - /portfolio/* -> Portfolio Institution Service (direct access)');
  console.log('  - /api/commercial/* -> Gestion Commerciale Service');
  console.log('  - /commerce/* -> Gestion Commerciale Service (direct access)');
  console.log('  - /api/customers/* -> Customer Service');
  console.log('  - /customers/* -> Customer Service (direct access)');
  console.log('  - /api/subscriptions/* -> Customer Service');
  console.log('  - /subscriptions/* -> Customer Service (direct access)');
  console.log('  - /customer/land/api/* -> Customer Service (for frontend compatibility)');
  console.log('Health check available at: /health');
  console.log('Metrics available at: /metrics');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received, shutting down gracefully');
  process.exit(0);
});
