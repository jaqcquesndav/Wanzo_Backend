// Simplified API Gateway mock service
const express = require('express');
const http = require('http');

// Create Express app
const app = express();
const port = process.env.PORT || 8000;
const serviceName = 'api-gateway';

// Service configurations
const services = {
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3001',
  accounting: process.env.ACCOUNTING_SERVICE_URL || 'http://localhost:3003',
  portfolio: process.env.PORTFOLIO_INSTITUTION_SERVICE_URL || 'http://localhost:3005',
  gestionCommerciale: process.env.GESTION_COMMERCIALE_SERVICE_URL || 'http://localhost:3006',
  customer: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3011',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007'
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

// API Documentation endpoint (Swagger)
app.get('/api', (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "Wanzo API Gateway",
      version: "1.0.0",
      description: "API Gateway pour tous les microservices Wanzo"
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "API Gateway"
      }
    ],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "Service healthy"
            }
          }
        }
      },
      "/api/admin/*": {
        get: {
          summary: "Admin Service endpoints",
          description: "Proxied to Admin Service (port 3001)"
        }
      },
      "/api/accounting/*": {
        get: {
          summary: "Accounting Service endpoints", 
          description: "Proxied to Accounting Service (port 3003)"
        }
      },
      "/api/portfolio/*": {
        get: {
          summary: "Portfolio Institution Service endpoints",
          description: "Proxied to Portfolio Service (port 3005)"
        }
      },
      "/api/commercial/*": {
        get: {
          summary: "Gestion Commerciale Service endpoints",
          description: "Proxied to Commercial Service (port 3006)"
        }
      },
      "/api/customers/*": {
        get: {
          summary: "Customer Service endpoints",
          description: "Proxied to Customer Service (port 3011)"
        }
      }
    }
  });
});

// Swagger UI redirect
app.get('/api-docs', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wanzo API Gateway - Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.19.1/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@4.19.1/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.19.1/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      // Configuration Swagger UI
      const ui = SwaggerUIBundle({
        url: '/api',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch']
      });
    };
  </script>
</body>
</html>
  `);
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

// Proxy helper that strips a fixed prefix from the incoming request path
function simpleProxyStripPrefix(prefix, targetBaseUrl) {
  return (req, res) => {
    try {
      const originalPath = req.url;
      const stripped = originalPath.startsWith(prefix)
        ? originalPath.slice(prefix.length)
        : originalPath;
      const path = stripped || '/';
      const fullUrl = `${targetBaseUrl}${path}`;

      console.log(`Proxying (strip '${prefix}') to: ${fullUrl}`);

      const targetUrl = new URL(fullUrl);
      const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
          'content-type': req.headers['content-type'] || 'application/json'
        }
      };

      const proxyReq = http.request(options, (proxyRes) => {
        res.statusCode = proxyRes.statusCode;
        Object.keys(proxyRes.headers).forEach((key) => {
          res.setHeader(key, proxyRes.headers[key]);
        });
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (error) => {
        console.error(`Proxy error: ${error.message}`);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Bad Gateway', message: 'Service Unavailable', service: targetBaseUrl });
        }
      });

      if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
      }
      proxyReq.end();
    } catch (error) {
      console.error(`Proxy error for ${targetBaseUrl}: ${error.message}`);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to proxy request', details: error.message });
    }
  };
}

// Admin Service routes
app.use('/api/admin', simpleProxy(services.admin));

// Accounting Service routes
app.use('/api/accounting', simpleProxy(services.accounting));

// Portfolio Service routes
app.use('/api/portfolio', simpleProxy(services.portfolio));

// Commercial Service routes
app.use('/api/commercial', simpleProxy(services.gestionCommerciale));

// Customer Service routes
app.use('/api/customers', simpleProxy(services.customer));
app.use('/api/subscriptions', simpleProxy(services.customer));

// Payment Service routes
app.use('/payments', simpleProxyStripPrefix('/payments', services.payment));

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
  console.log('  - /api/accounting/* -> Accounting Service');
  console.log('  - /api/portfolio/* -> Portfolio Institution Service');
  console.log('  - /api/commercial/* -> Gestion Commerciale Service');
  console.log('  - /api/customers/* -> Customer Service');
  console.log('  - /api/subscriptions/* -> Customer Service');
  console.log('  - /payments/* -> Payment Service');
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
