# API Documentation: Dashboard

This document outlines the API endpoints, request/response structures, and functionalities related to the main dashboard. This includes fetching aggregated data, statistics, analytics, and user-specific dashboard configurations.

## Standard Response Types

### PaginatedResponse<T>
```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  totalPages: number;
}
```

### APIResponse<T>
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: APIError;
}
```

## 1. Dashboard Data Endpoints

### 1.1. Get Main Dashboard Data
*   **Endpoint:** `GET /api/dashboard`
*   **Description:** Retrieves aggregated data for the main dashboard view. This typically includes key performance indicators (KPIs), recent activities, and summaries from various modules.
*   **Request:**
    *   Query Parameters:
        *   `userId` (optional, string): If the dashboard is user-specific.
        *   `dateRange` (optional, string): e.g., "last7days", "last30days", "monthToDate".
        *   `timeZone` (optional, string): IANA time zone name (e.g., "America/New_York") for date calculations.
*   **Response:** `200 OK`
    ```json
    {
      "userStatistics": {
        "totalUsers": 1500,
        "activeUsers": 1250,
        "newUsersToday": 12,
        "usersByRole": {
          "super_admin": 5,
          "cto": 2,
          "growth_finance": 8,
          "customer_support": 15,
          "content_manager": 10,
          "company_admin": 120,
          "company_user": 1340
        },
        "usersByCountry": {
          "RDC": 850,
          "Rwanda": 240,
          "Kenya": 150,
          "France": 120,
          "Other": 140
        },
        "userGrowth": [
          { "date": "2025-05-01", "count": 1420 },
          { "date": "2025-05-08", "count": 1450 },
          { "date": "2025-05-15", "count": 1475 },
          { "date": "2025-05-22", "count": 1490 },
          { "date": "2025-05-29", "count": 1500 }
        ]
      },
      "systemMetrics": {
        "serverHealth": {
          "cpuUsage": 32.5,
          "memoryUsage": 60.2,
          "diskUsage": 45.0,
          "uptime": 1209600,
          "activeConnections": 85,
          "responseTime": 120
        },
        "databaseMetrics": {
          "postgresql": {
            "connectionPoolSize": 20,
            "activeConnections": 12,
            "queryPerformance": 15.3,
            "storageUsage": 25.4
          },
          "neo4j": {
            "activeConnections": 5,
            "queryPerformance": 32.1,
            "storageUsage": 18.6
          },
          "timescale": {
            "activeConnections": 8,
            "compressionRatio": 4.2,
            "retentionPeriod": 90,
            "storageUsage": 35.7
          }
        },
        "apiMetrics": {
          "totalRequests": 125000,
          "requestsPerMinute": 86.4,
          "averageResponseTime": 156.2,
          "errorRate": 0.24,
          "requestsByEndpoint": {
            "/api/users": 12500,
            "/api/auth": 15000,
            "/api/dashboard": 8500
          }
        }
      },
      "revenueStatistics": {
        "currentMonthRevenue": 25000,
        "previousMonthRevenue": 23500,
        "yearToDateRevenue": 145000,
        "projectedAnnualRevenue": 300000,
        "revenueBySubscriptionTier": {
          "basic": 5000,
          "standard": 12000,
          "premium": 8000
        },
        "revenueByCountry": {
          "RDC": 12500,
          "Rwanda": 5000,
          "Kenya": 3500,
          "France": 2500,
          "Other": 1500
        },
        "monthlyTrend": [
          { "month": "2025-01", "amount": 18500 },
          { "month": "2025-02", "amount": 19200 },
          { "month": "2025-03", "amount": 20500 },
          { "month": "2025-04", "amount": 22000 },
          { "month": "2025-05", "amount": 23500 },
          { "month": "2025-06", "amount": 25000 }
        ]
      },
      "tokenStatistics": {
        "totalTokensIssued": 500000,
        "tokensInCirculation": 350000,
        "averageMonthlyConsumption": 75000,
        "consumptionByService": {
          "chat": 45000,
          "document_analysis": 15000,
          "market_intelligence": 10000,
          "other": 5000
        },
        "consumptionTrend": [
          { "date": "2025-05-01", "count": 2500 },
          { "date": "2025-05-08", "count": 2600 },
          { "date": "2025-05-15", "count": 2450 },
          { "date": "2025-05-22", "count": 2700 },
          { "date": "2025-05-29", "count": 2800 }
        ]
      },
      "recentActivities": [
        {
          "id": "act-123456",
          "userId": "user-123",
          "userName": "John Doe",
          "action": "login",
          "timestamp": "2025-06-17T08:30:00Z",
          "details": {
            "ip": "192.168.1.1",
            "userAgent": "Mozilla/5.0..."
          }
        },
        {
          "id": "act-123457",
          "userId": "user-456",
          "userName": "Jane Smith",
          "action": "subscription_purchase",
          "timestamp": "2025-06-17T09:15:00Z",
          "details": {
            "plan": "premium",
            "amount": 99.99
          }
        }
      ]
    }
    ```

*   **Error Responses (General):**
    *   `400 Bad Request`: Invalid query parameters (e.g., malformed dateRange, invalid timeZone).
        ```json
        {
          "error": "InvalidParameterValue",
          "message": "The value provided for 'dateRange' is not supported."
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: User does not have permission to access dashboard data (if applicable, e.g., for specific user dashboards).
    *   `404 Not Found`: If a specific resource tied to the dashboard (e.g., a user for `userId`) is not found.
    *   `500 Internal Server Error`: Unexpected server error while fetching dashboard data.
        ```json
        {
          "error": "InternalServerError",
          "message": "An unexpected error occurred while processing your request."
        }
        ```

### 1.2. Get User-Specific Widget Data
*   **Endpoint:** `GET /api/dashboard/widgets/{widgetId}`
*   **Description:** Retrieves data for a specific widget on the user's dashboard.
*   **Request:**
    *   Path Parameter: `widgetId` (string, required).
    *   Query Parameters:
        *   `userId` (optional, string): If widgets are user-specific.
        *   `params` (optional, object): Widget-specific parameters.
*   **Response:** `200 OK`
    ```json
    {
      "data": {
        "widgetId": "userActivityFeed",
        "title": "My Recent Activity",
        "type": "feed", // "chart", "kpi", "table", "feed"
        "content": [
          { "message": "You updated your profile.", "timestamp": "2023-06-01T09:00:00Z" },
          { "message": "New chat message from Admin.", "timestamp": "2023-06-01T08:30:00Z" }
        ]
      }
    }
    ```

*   **Error Responses (General):**
    *   `400 Bad Request`: Invalid `widgetId` format or missing required parameters.
        ```json
        {
          "error": "InvalidParameterValue",
          "message": "Widget ID is invalid or missing."
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: User does not have permission to access this widget.
    *   `404 Not Found`: The specified `widgetId` or associated `userId` does not exist.
        ```json
        {
          "error": "ResourceNotFound",
          "message": "Widget with ID 'userActivityFeed' not found."
        }
        ```
    *   `500 Internal Server Error`: Unexpected server error.

## 2. Dashboard Configuration Endpoints

### 2.1. Get User Dashboard Configuration
*   **Endpoint:** `GET /api/dashboard/configuration`
*   **Description:** Retrieves the current user's dashboard layout and widget configuration.
*   **Request:**
    *   Query Parameters:
        *   `userId` (optional, string): Typically inferred from the authenticated session.
*   **Response:** `200 OK`
    ```json
    {
      "data": {
        "userId": "user_abc123",
        "layout": [
          { "widgetId": "kpiSummary", "x": 0, "y": 0, "w": 12, "h": 2 },
          { "widgetId": "userSignupsChart", "x": 0, "y": 2, "w": 6, "h": 4 },
          { "widgetId": "revenueTrendChart", "x": 6, "y": 2, "w": 6, "h": 4 }
        ],
        "widgets": [
          { "id": "kpiSummary", "type": "kpi", "settings": {} },
          { "id": "userSignupsChart", "type": "chart", "settings": { "chartType": "line", "dataSource": "/api/stats/user-signups" } }
        ]
      }
    }
    ```

*   **Error Responses (General):**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: User is not authorized to view their own or another user's configuration.
    *   `404 Not Found`: User configuration not found (e.g., for a new user who hasn't saved one yet, though often a default is returned).
    *   `500 Internal Server Error`: Unexpected server error.

### 2.2. Update User Dashboard Configuration
*   **Endpoint:** `PUT /api/dashboard/configuration`
*   **Description:** Saves the user's dashboard layout and widget configuration.
*   **Request Body:**
    ```json
    {
      "layout": [
        { "widgetId": "kpiSummary", "x": 0, "y": 0, "w": 12, "h": 2 },
        { "widgetId": "revenueTrendChart", "x": 0, "y": 2, "w": 12, "h": 4 }
      ],
      "widgets": [
        // Updated list of widgets and their settings
      ]
    }
    ```
*   **Response:** `200 OK`
    ```json
    {
      "message": "Dashboard configuration updated successfully.",
      "data": {
        // The updated configuration object
      }
    }
    ```

*   **Error Responses (General):**
    *   `400 Bad Request`: Invalid request body (e.g., malformed layout, invalid widget IDs or settings).
        ```json
        {
          "error": "InvalidRequestBody",
          "message": "The layout structure is invalid or contains unrecognized widget IDs."
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: User is not authorized to update their own or another user's configuration.
    *   `422 Unprocessable Entity`: The request was well-formed but contains semantic errors (e.g., widget conflicts, invalid settings values).
        ```json
        {
          "error": "SemanticValidationError",
          "message": "Widget 'revenueTrendChart' settings are incompatible with its type."
        }
        ```
    *   `500 Internal Server Error`: Unexpected server error.

## 3. Dashboard Analytics & Statistics Endpoints (Examples)
These might be more specific and could also live under a dedicated `/api/statistics` or `/api/analytics` module, but are often surfaced on dashboards.

### 3.1. Get Sales Statistics
*   **Endpoint:** `GET /api/dashboard/statistics/sales`
*   **Description:** Retrieves sales statistics for a specified period.
*   **Request:**
    *   Query Parameters: `period` (e.g., "daily", "weekly", "monthly"), `startDate`, `endDate`.
*   **Response:** `200 OK`
    ```json
    {
      "data": {
        "totalSales": 50000,
        "averageOrderValue": 120,
        "salesByRegion": [
          { "region": "North America", "amount": 25000 },
          { "region": "Europe", "amount": 15000 }
        ]
      }
    }
    ```

*   **Error Responses (General):**
    *   `400 Bad Request`: Invalid query parameters (e.g., unrecognized `period`, malformed dates).
        ```json
        {
          "error": "InvalidParameterValue",
          "message": "The 'period' parameter must be one of 'daily', 'weekly', 'monthly'."
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: User does not have permission to access sales statistics.
    *   `500 Internal Server Error`: Unexpected server error.

### 3.2. Get User Engagement Statistics
*   **Endpoint:** `GET /api/dashboard/statistics/user-engagement`
*   **Description:** Retrieves user engagement metrics.
*   **Request:**
    *   Query Parameters: `metricType` (e.g., "dau", "mau", "sessionDuration"), `dateRange`.
*   **Response:** `200 OK`
    ```json
    {
      "data": {
        "dailyActiveUsers": 1200,
        "monthlyActiveUsers": 8000,
        "averageSessionDurationMinutes": 15
      }
    }
    ```

*   **Error Responses (General):**
    *   `400 Bad Request`: Invalid query parameters (e.g., unrecognized `metricType`).
        ```json
        {
          "error": "InvalidParameterValue",
          "message": "The 'metricType' parameter is not supported."
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: User does not have permission to access user engagement statistics.
    *   `500 Internal Server Error`: Unexpected server error.
