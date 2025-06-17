# API Documentation: System Management

This document outlines the API endpoints for system management, monitoring, and administration within the Wanzo Admin platform.

## Base URL

All API endpoints are relative to the base URL: `/api`

## Authentication

All endpoints require Bearer Token authentication. System administration endpoints require high-level admin permissions.

## System Data Models

### System Health

```typescript
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number; // in seconds
  services: {
    api: {
      status: 'operational' | 'degraded' | 'down';
      responseTime: number; // in ms
      errorRate: number; // percentage
    };
    database: {
      status: 'operational' | 'degraded' | 'down';
      connections: number;
      queryTime: number; // in ms
    };
    cache: {
      status: 'operational' | 'degraded' | 'down';
      hitRate: number; // percentage
      memoryUsage: number; // in MB
    };
    storage: {
      status: 'operational' | 'degraded' | 'down';
      capacity: number; // in GB
      used: number; // in GB
      available: number; // in GB
    };
    ai: {
      status: 'operational' | 'degraded' | 'down';
      responseTime: number; // in ms
      errorRate: number; // percentage
    };
  };
  memory: {
    total: number; // in MB
    used: number; // in MB
    free: number; // in MB
  };
  cpu: {
    usage: number; // percentage
    cores: number;
  };
}
```

### System Log

```typescript
interface SystemLog {
  id: string;
  timestamp: string; // ISO date string
  level: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  details?: Record<string, any>;
  correlationId?: string;
  userId?: string;
  ipAddress?: string;
}
```

### System Alert

```typescript
interface SystemAlert {
  id: string;
  timestamp: string; // ISO date string
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  service: string;
  isResolved: boolean;
  resolvedAt?: string; // ISO date string
  resolvedBy?: string;
  resolutionNotes?: string;
}
```

### API Performance Metric

```typescript
interface ApiPerformanceMetric {
  endpoint: string;
  method: string;
  averageResponseTime: number; // in ms
  p95ResponseTime: number; // in ms
  requestCount: number;
  errorCount: number;
  errorRate: number; // percentage
  timestamp: string; // ISO date string
}
```

### Database Metric

```typescript
interface DatabaseMetric {
  name: string;
  type: 'postgres' | 'mongodb' | 'redis' | 'other';
  status: 'operational' | 'degraded' | 'down';
  size: number; // in MB
  connections: number;
  queryCount: number;
  averageQueryTime: number; // in ms
  slowQueries: number;
}
```

### AI Configuration

```typescript
interface AiModelConfig {
  id: string;
  name: string;
  provider: string;
  type: 'text' | 'image' | 'voice' | 'embedding' | 'other';
  isActive: boolean;
  tokensPerRequest: number;
  costPerToken: number;
  maxTokens: number;
  temperature: number;
  apiEndpoint?: string;
  apiVersion?: string;
}
```

## System Administration Endpoints

### 1. Get System Health

*   **Endpoint:** `GET /admin/system/health`
*   **Description:** Retrieves the current health status of the system and its components.
*   **Permissions Required:** `admin:system:read`
*   **Successful Response (200 OK):**
    ```json
    {
      "status": "healthy",
      "uptime": 1209600,
      "services": {
        "api": {
          "status": "operational",
          "responseTime": 45,
          "errorRate": 0.02
        },
        "database": {
          "status": "operational",
          "connections": 12,
          "queryTime": 5
        },
        "cache": {
          "status": "operational",
          "hitRate": 89.5,
          "memoryUsage": 512
        },
        "storage": {
          "status": "operational",
          "capacity": 1000,
          "used": 350,
          "available": 650
        },
        "ai": {
          "status": "operational",
          "responseTime": 250,
          "errorRate": 0.5
        }
      },
      "memory": {
        "total": 16384,
        "used": 8192,
        "free": 8192
      },
      "cpu": {
        "usage": 35,
        "cores": 8
      }
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2. Get System Logs

*   **Endpoint:** `GET /admin/system/logs`
*   **Description:** Retrieves system logs with optional filtering and pagination.
*   **Permissions Required:** `admin:system:read`
*   **Query Parameters:**
    - `startDate` (optional): Filter logs from this date (ISO format)
    - `endDate` (optional): Filter logs until this date (ISO format)
    - `level` (optional): Filter by log level ('info', 'warning', 'error', 'critical')
    - `service` (optional): Filter by service name
    - `search` (optional): Search in log messages
    - `page` (optional): Page number for pagination (default: 1)
    - `limit` (optional): Items per page (default: 50)
*   **Successful Response (200 OK):**
    ```json
    {
      "logs": [
        {
          "id": "log_123",
          "timestamp": "2024-06-05T10:15:20Z",
          "level": "error",
          "service": "api",
          "message": "Database connection failed",
          "details": {
            "errorCode": "ECONNREFUSED",
            "database": "main"
          },
          "correlationId": "req_abc123",
          "userId": null,
          "ipAddress": "10.0.0.2"
        },
        {
          "id": "log_122",
          "timestamp": "2024-06-05T10:14:30Z",
          "level": "warning",
          "service": "auth",
          "message": "Failed login attempt",
          "details": {
            "reason": "Invalid password"
          },
          "correlationId": "req_def456",
          "userId": null,
          "ipAddress": "41.243.11.22"
        }
      ],
      "totalCount": 1532,
      "page": 1,
      "totalPages": 31
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 3. Get System Alerts

*   **Endpoint:** `GET /admin/system/alerts`
*   **Description:** Retrieves active and/or resolved system alerts.
*   **Permissions Required:** `admin:system:read`
*   **Query Parameters:**
    - `status` (optional): Filter by status ('active', 'resolved', 'all') (default: 'active')
    - `level` (optional): Filter by alert level ('info', 'warning', 'error', 'critical')
    - `service` (optional): Filter by service name
    - `startDate` (optional): Filter alerts from this date (ISO format)
    - `endDate` (optional): Filter alerts until this date (ISO format)
    - `page` (optional): Page number for pagination (default: 1)
    - `limit` (optional): Items per page (default: 20)
*   **Successful Response (200 OK):**
    ```json
    {
      "alerts": [
        {
          "id": "alert_456",
          "timestamp": "2024-06-05T08:00:00Z",
          "level": "warning",
          "title": "High CPU Usage",
          "message": "Server CPU usage exceeded 80% for more than 10 minutes",
          "service": "system",
          "isResolved": false,
          "resolvedAt": null,
          "resolvedBy": null,
          "resolutionNotes": null
        },
        {
          "id": "alert_455",
          "timestamp": "2024-06-04T22:15:10Z",
          "level": "critical",
          "title": "Database Connection Failure",
          "message": "Multiple failed attempts to connect to primary database",
          "service": "database",
          "isResolved": true,
          "resolvedAt": "2024-06-04T23:45:20Z",
          "resolvedBy": "admin_123",
          "resolutionNotes": "Restarted database service and verified connections"
        }
      ],
      "totalCount": 18,
      "page": 1,
      "totalPages": 1
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 4. Resolve System Alert

*   **Endpoint:** `PUT /admin/system/alerts/{alertId}/resolve`
*   **Description:** Marks a system alert as resolved.
*   **Parameters:**
    - `alertId` (path, required): The ID of the alert to resolve.
*   **Permissions Required:** `admin:system:write`
*   **Request Body (application/json):**
    ```json
    {
      "resolutionNotes": "Fixed by restarting the affected service"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "id": "alert_456",
      "timestamp": "2024-06-05T08:00:00Z",
      "level": "warning",
      "title": "High CPU Usage",
      "message": "Server CPU usage exceeded 80% for more than 10 minutes",
      "service": "system",
      "isResolved": true,
      "resolvedAt": "2024-06-05T14:30:15Z",
      "resolvedBy": "admin_123",
      "resolutionNotes": "Fixed by restarting the affected service"
    }
    ```
*   **Error Responses:**
    - `400 Bad Request`: If the alert is already resolved
    - `404 Not Found`: If the alert doesn't exist
    - See also [Standard Error Responses](#standard-error-responses).

### 5. Get API Performance Metrics

*   **Endpoint:** `GET /admin/system/api/performance`
*   **Description:** Retrieves performance metrics for API endpoints.
*   **Permissions Required:** `admin:system:read`
*   **Query Parameters:**
    - `period` (optional): Time period ('hour', 'day', 'week', 'month') (default: 'day')
    - `startDate` (optional): Filter metrics from this date (ISO format)
    - `endDate` (optional): Filter metrics until this date (ISO format)
    - `endpoint` (optional): Filter by specific endpoint
    - `method` (optional): Filter by HTTP method
*   **Successful Response (200 OK):**
    ```json
    {
      "metrics": [
        {
          "endpoint": "/api/users",
          "method": "GET",
          "averageResponseTime": 45,
          "p95ResponseTime": 120,
          "requestCount": 1250,
          "errorCount": 5,
          "errorRate": 0.4,
          "timestamp": "2024-06-05T00:00:00Z"
        },
        {
          "endpoint": "/api/auth/login",
          "method": "POST",
          "averageResponseTime": 180,
          "p95ResponseTime": 350,
          "requestCount": 560,
          "errorCount": 12,
          "errorRate": 2.14,
          "timestamp": "2024-06-05T00:00:00Z"
        }
      ],
      "summary": {
        "totalRequests": 15240,
        "totalErrors": 87,
        "overallErrorRate": 0.57,
        "averageResponseTime": 75
      }
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 6. Get Database Metrics

*   **Endpoint:** `GET /admin/system/databases`
*   **Description:** Retrieves performance metrics for system databases.
*   **Permissions Required:** `admin:system:read`
*   **Successful Response (200 OK):**
    ```json
    {
      "databases": [
        {
          "name": "main-postgres",
          "type": "postgres",
          "status": "operational",
          "size": 1240,
          "connections": 15,
          "queryCount": 58720,
          "averageQueryTime": 4.2,
          "slowQueries": 12
        },
        {
          "name": "redis-cache",
          "type": "redis",
          "status": "operational",
          "size": 512,
          "connections": 35,
          "queryCount": 245600,
          "averageQueryTime": 0.8,
          "slowQueries": 0
        }
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 7. Get AI Model Configurations

*   **Endpoint:** `GET /admin/system/ai/models`
*   **Description:** Retrieves the configuration for AI models used in the system.
*   **Permissions Required:** `admin:system:read`
*   **Successful Response (200 OK):**
    ```json
    {
      "models": [
        {
          "id": "model_text_gpt4",
          "name": "GPT-4 Turbo",
          "provider": "OpenAI",
          "type": "text",
          "isActive": true,
          "tokensPerRequest": 4000,
          "costPerToken": 0.00001,
          "maxTokens": 8000,
          "temperature": 0.7,
          "apiEndpoint": "https://api.openai.com/v1/chat/completions",
          "apiVersion": "2023-05-15"
        },
        {
          "id": "model_image_dalle3",
          "name": "DALL-E 3",
          "provider": "OpenAI",
          "type": "image",
          "isActive": true,
          "tokensPerRequest": 0,
          "costPerToken": 0,
          "maxTokens": 0,
          "temperature": 0,
          "apiEndpoint": "https://api.openai.com/v1/images/generations",
          "apiVersion": "2023-05-15"
        }
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 8. Update AI Model Configuration

*   **Endpoint:** `PUT /admin/system/ai/models/{modelId}`
*   **Description:** Updates the configuration for a specific AI model.
*   **Parameters:**
    - `modelId` (path, required): The ID of the AI model to update.
*   **Permissions Required:** `admin:system:write`
*   **Request Body (application/json):**
    ```json
    {
      "isActive": true,
      "tokensPerRequest": 4000,
      "maxTokens": 8000,
      "temperature": 0.8,
      "apiEndpoint": "https://api.openai.com/v1/chat/completions",
      "apiVersion": "2023-05-15"
    }
    ```
    *Only include fields to be updated.*
*   **Successful Response (200 OK):**
    ```json
    {
      "id": "model_text_gpt4",
      "name": "GPT-4 Turbo",
      "provider": "OpenAI",
      "type": "text",
      "isActive": true,
      "tokensPerRequest": 4000,
      "costPerToken": 0.00001,
      "maxTokens": 8000,
      "temperature": 0.8,
      "apiEndpoint": "https://api.openai.com/v1/chat/completions",
      "apiVersion": "2023-05-15"
    }
    ```
*   **Error Responses:**
    - `400 Bad Request`: If input data is invalid
    - `404 Not Found`: If the model doesn't exist
    - See also [Standard Error Responses](#standard-error-responses).

## System Monitoring Endpoints

### 1. Get System Status

*   **Endpoint:** `GET /system/status`
*   **Description:** Retrieves a simplified status of the system for health checks and monitoring.
*   **Permissions Required:** Basic authentication or API key.
*   **Successful Response (200 OK):**
    ```json
    {
      "status": "operational",
      "version": "1.5.2",
      "uptime": 1209600,
      "timestamp": "2024-06-05T15:00:00Z",
      "services": {
        "api": "operational",
        "database": "operational",
        "ai": "operational",
        "payments": "operational"
      }
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2. Get Public Maintenance Status

*   **Endpoint:** `GET /system/maintenance`
*   **Description:** Checks if the system is in maintenance mode. This endpoint is public and does not require authentication.
*   **Successful Response (200 OK):**
    ```json
    {
      "inMaintenance": false,
      "estimatedEndTime": null,
      "message": null
    }
    ```
    Or if in maintenance:
    ```json
    {
      "inMaintenance": true,
      "estimatedEndTime": "2024-06-05T18:00:00Z",
      "message": "Scheduled database upgrade in progress. Services will be restored shortly."
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 3. Set Maintenance Mode

*   **Endpoint:** `PUT /admin/system/maintenance`
*   **Description:** Enables or disables maintenance mode for the system.
*   **Permissions Required:** `admin:system:write`
*   **Request Body (application/json):**
    ```json
    {
      "enable": true,
      "estimatedEndTime": "2024-06-05T18:00:00Z",
      "message": "Scheduled database upgrade in progress. Services will be restored shortly."
    }
    ```
    Or to disable:
    ```json
    {
      "enable": false
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "inMaintenance": true,
      "estimatedEndTime": "2024-06-05T18:00:00Z",
      "message": "Scheduled database upgrade in progress. Services will be restored shortly.",
      "enabledBy": "admin_123",
      "enabledAt": "2024-06-05T16:30:00Z"
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

## Standard Error Responses

*   **401 Unauthorized:**
    ```json
    {
      "error": "unauthorized",
      "message": "Authentication token is missing or invalid"
    }
    ```

*   **403 Forbidden:**
    ```json
    {
      "error": "forbidden",
      "message": "You do not have permission to access this resource"
    }
    ```

*   **404 Not Found:**
    ```json
    {
      "error": "not_found",
      "message": "The requested resource was not found"
    }
    ```

*   **429 Too Many Requests:**
    ```json
    {
      "error": "rate_limit_exceeded",
      "message": "Rate limit exceeded. Try again in X seconds",
      "retryAfter": 30
    }
    ```

*   **500 Internal Server Error:**
    ```json
    {
      "error": "server_error",
      "message": "An unexpected error occurred",
      "requestId": "req_abc123"
    }
    ```

## Additional Notes

1. System administration endpoints are restricted to users with the appropriate admin permissions.
2. System logs may be filtered by various criteria to help troubleshoot issues.
3. API performance metrics can help identify bottlenecks and optimize system performance.
4. Database metrics provide insights into database health and performance.
5. AI model configurations allow administrators to adjust parameters for different AI models used in the system.
