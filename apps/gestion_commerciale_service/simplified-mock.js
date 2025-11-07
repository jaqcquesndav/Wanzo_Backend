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

// API Documentation endpoint (Swagger)
app.get('/api', (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "Gestion Commerciale Service API",
      version: "1.0.0",
      description: "API pour la gestion commerciale et des leads"
    },
    servers: [
      {
        url: "http://localhost:3006",
        description: "Gestion Commerciale Service"
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
      "/api/commercial/leads": {
        post: {
          summary: "Créer un nouveau lead",
          description: "Ajoute un nouveau lead commercial",
          responses: {
            "200": {
              description: "Lead créé avec succès",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      leadId: { type: "integer" },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/commercial/stats": {
        get: {
          summary: "Obtenir les statistiques commerciales",
          description: "Récupère les statistiques des leads et conversions",
          responses: {
            "200": {
              description: "Statistiques commerciales",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      totalLeads: { type: "integer" },
                      convertedLeads: { type: "integer" },
                      pendingLeads: { type: "integer" },
                      rejectedLeads: { type: "integer" }
                    }
                  }
                }
              }
            }
          }
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
  <title>Gestion Commerciale Service - Swagger UI</title>
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
