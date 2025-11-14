# API Documentation: Dashboard

This document outlines the **Admin Service Dashboard** API endpoints for retrieving aggregated data, analytics, metrics, and user-specific dashboard configurations.

## Base URLs

- **Via API Gateway**: `http://localhost:8000/admin/api/v1`
- **Direct (admin-service)**: `http://localhost:3001`
- **Version**: 2.1

### Routing Architecture

The API Gateway detects the `admin/api/v1` prefix and **automatically strips it** before routing to admin-service.

**Request Flow:**
1. Client → `http://localhost:8000/admin/api/v1/dashboard`
2. Gateway strips → `/admin/api/v1`
3. Admin-service receives → `/dashboard`
4. Controller `@Controller('dashboard')` handles the request

All endpoints below use the complete Base URL via API Gateway. The dashboard provides comprehensive oversight for admin users managing the platform.

## 🏗️ **Architecture Overview**

### **Dashboard Data Sources**
- **Real-time metrics** from multiple services (customer, analytics, system)
- **Aggregated statistics** calculated from synchronized data
- **User-specific configurations** and widget preferences
- **System health monitoring** across all platform components

## Standard Response Types

### DashboardCompleteDataDto
```typescript
interface DashboardCompleteDataDto {
  userStatistics: UserStatisticsDto;
  systemMetrics: SystemMetricsDto;
  revenueStatistics: RevenueStatisticsDto;
  tokenStatistics: TokenStatisticsDto;
  adhaMetrics?: AdhaMetricsDto;
  recentActivities: RecentActivitiesDto[];
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

### WidgetResponseDto
```typescript
interface WidgetResponseDto {
  data: {
    widgetId: string;
    title: string;
    type: string;
    content: WidgetContentDto[] | Record<string, any>[];
  };
}
```

## 1. Dashboard Data Endpoints

### 1.1. Get Main Dashboard Data
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard`
*   **Controller:** `DashboardController`
*   **Description:** Retrieves aggregated data for the main dashboard view including KPIs, metrics, and analytics from all platform components.
*   **Authentication:** Bearer Token + Role Guard (Admin required)
*   **Query Parameters:**
    *   `userId` (optional, string): User ID for user-specific dashboard data
    *   `dateRange` (optional, string): Date range filter ("last7days", "last30days", "monthToDate", "yearToDate")
    *   `timeZone` (optional, string): IANA time zone name (e.g., "Africa/Kinshasa") for date calculations
    *   `startDate` (optional, ISO string): Custom start date for calculations
    *   `endDate` (optional, ISO string): Custom end date for calculations
    *   `period` (optional, enum): Grouping period ("daily", "weekly", "monthly", "quarterly", "yearly")
    *   `metricType` (optional, string): Specific metric type to retrieve
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
          { "date": "2024-11-01", "count": 1420 },
          { "date": "2024-11-02", "count": 1450 },
          { "date": "2024-11-03", "count": 1475 },
          { "date": "2024-11-04", "count": 1490 },
          { "date": "2024-11-05", "count": 1500 }
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
            "/admin/customer-profiles": 15420,
            "/dashboard": 8934,
            "/admin/users": 5672,
            "/settings": 3245
          }
        }
      },
      "revenueStatistics": {
        "currentMonthRevenue": 125000.00,
        "previousMonthRevenue": 118000.00,
        "yearToDateRevenue": 1340000.00,
        "projectedAnnualRevenue": 1620000.00,
        "revenueBySubscriptionTier": {
          "basic": 45000.00,
          "standard": 62000.00,
          "premium": 18000.00
        },
        "revenueByCountry": {
          "RDC": 78000.00,
          "Rwanda": 32000.00,
          "Kenya": 15000.00,
          "France": 0.00,
          "Other": 0.00
        },
        "monthlyTrend": [
          { "month": "2024-01", "amount": 98000.00 },
          { "month": "2024-02", "amount": 102000.00 },
          { "month": "2024-03", "amount": 115000.00 },
          { "month": "2024-04", "amount": 108000.00 },
          { "month": "2024-05", "amount": 125000.00 }
        ]
      },
      "tokenStatistics": {
        "totalTokensIssued": 5000000,
        "tokensInCirculation": 3456789,
        "averageMonthlyConsumption": 425000,
        "consumptionByService": {
          "chat": 156780,
          "document_analysis": 98456,
          "market_intelligence": 67234,
          "other": 102530
        },
        "consumptionTrend": [
          { "date": "2024-11-01", "count": 14250 },
          { "date": "2024-11-02", "count": 13890 },
          { "date": "2024-11-03", "count": 15670 },
          { "date": "2024-11-04", "count": 14320 },
          { "date": "2024-11-05", "count": 16540 }
        ]
      },
      "adhaMetrics": {
        "totalQueries": 45670,
        "averageResponseTime": 1.24,
        "successRate": 97.8,
        "topQueryTypes": {
          "financial_analysis": 18934,
          "market_research": 12456,
          "document_analysis": 8907,
          "general_inquiry": 5373
        }
      },
      "recentActivities": [
        {
          "id": "act_uuid_001",
          "userId": "user_uuid_123",
          "userName": "Admin User",
          "action": "customer_profile_validated",
          "timestamp": "2024-11-09T14:30:00Z",
          "details": {
            "customerId": "cust_uuid_456",
            "customerName": "Acme Financial Corp"
          }
        },
        {
          "id": "act_uuid_002",
          "userId": "user_uuid_789",
          "userName": "Support Manager",
          "action": "user_account_suspended",
          "timestamp": "2024-11-09T13:45:00Z",
          "details": {
            "targetUserId": "user_uuid_999",
            "reason": "policy_violation"
          }
        }
      ]
    }
    ```

### 1.2. Get Widget Data
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/widgets/{widgetId}`
*   **Description:** Get data for a specific dashboard widget
*   **Authentication:** Bearer Token + Role Guard (Admin or User)
*   **Path Parameters:**
    *   `widgetId` (required, string): The ID of the widget to fetch data for
*   **Query Parameters:**
    *   `userId` (optional, string): Optional user ID if widget data is user-specific
*   **Response:** `200 OK`
    ```json
    {
      "data": {
        "widgetId": "customer_stats_widget",
        "title": "Customer Statistics",
        "type": "stats_card",
        "content": [
          {
            "message": "Total active customers: 1,250",
            "timestamp": "2024-11-09T14:30:00Z"
          },
          {
            "message": "New customers this month: 45",
            "timestamp": "2024-11-09T14:30:00Z"
          }
        ]
      }
    }
    ```

## 2. Dashboard Configuration

### 2.1. Get Dashboard Configuration
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/configuration`
*   **Description:** Get user dashboard configuration including widget layout and settings
*   **Authentication:** Bearer Token + Role Guard (Admin or User)
*   **Response:** `200 OK`
    ```json
    {
      "userId": "user_uuid_123",
      "layout": [
        {
          "widgetId": "customer_stats",
          "x": 0,
          "y": 0,
          "w": 4,
          "h": 2
        },
        {
          "widgetId": "revenue_chart",
          "x": 4,
          "y": 0,
          "w": 8,
          "h": 4
        }
      ],
      "widgets": [
        {
          "id": "customer_stats",
          "type": "stats_card",
          "settings": {
            "showGrowthRate": true,
            "compareWithLastMonth": true
          }
        },
        {
          "id": "revenue_chart",
          "type": "line_chart",
          "settings": {
            "timeRange": "last_30_days",
            "showProjections": true
          }
        }
      ]
    }
    ```

### 2.2. Update Dashboard Configuration
*   **HTTP Method:** `PUT`
*   **URL:** `/dashboard/configuration`
*   **Description:** Update user dashboard configuration
*   **Authentication:** Bearer Token + Role Guard (Admin or User)
*   **Request Body:**
    ```json
    {
      "layout": [
        {
          "widgetId": "customer_stats",
          "x": 0,
          "y": 0,
          "w": 6,
          "h": 3
        }
      ],
      "widgets": [
        {
          "id": "customer_stats",
          "type": "stats_card",
          "settings": {
            "showGrowthRate": true,
            "compareWithLastMonth": false
          }
        }
      ]
    }
    ```
*   **Response:** `200 OK`
    ```json
    {
      "success": true,
      "data": {
        "userId": "user_uuid_123",
        "layout": [...],
        "widgets": [...]
      },
      "message": "Dashboard configuration updated successfully."
    }
    ```

## 3. Legacy Dashboard Endpoints

### 3.1. Get KPIs
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/kpis`
*   **Description:** Get Key Performance Indicators
*   **Authentication:** Bearer Token + Role Guard (Admin)
*   **Response:** `200 OK`
    ```json
    {
      "customerGrowth": 12.5,
      "revenueGrowth": 8.3,
      "satisfactionRate": 94.2,
      "averageResponseTime": 2.1
    }
    ```

### 3.2. Get Financial Summary
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/financial-summary`
*   **Description:** Get financial summary data
*   **Authentication:** Bearer Token + Role Guard (Admin)
*   **Response:** `200 OK`
    ```json
    {
      "totalRevenue": 1340000.00,
      "totalExpenses": 890000.00,
      "netProfit": 450000.00,
      "lastTransactions": [
        {
          "id": "txn_uuid_001",
          "date": "2024-11-09T14:30:00Z",
          "description": "Monthly subscription payment",
          "amount": 2500.00
        }
      ]
    }
    ```

### 3.3. Get Recent Activities
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/recent-activities`
*   **Description:** Get recent platform activities
*   **Authentication:** Bearer Token + Role Guard (Admin or User)
*   **Response:** `200 OK`
    ```json
    [
      {
        "id": "act_uuid_001",
        "date": "2024-11-09T14:30:00Z",
        "user": "Admin User",
        "action": "Customer profile validated"
      },
      {
        "id": "act_uuid_002",
        "date": "2024-11-09T13:45:00Z",
        "user": "Support Manager",
        "action": "User account suspended"
      }
    ]
    ```

### 3.4. Get User Statistics
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/user-statistics`
*   **Description:** Get user statistics summary
*   **Authentication:** Bearer Token + Role Guard (Admin)
*   **Response:** `200 OK`
    ```json
    {
      "totalUsers": 1500,
      "activeUsers": 1250,
      "inactiveUsers": 250,
      "userRolesDistribution": {
        "admins": 25,
        "managers": 150,
        "operators": 1325
      }
    }
    ```

### 3.5. Get System Health
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/system-health`
*   **Description:** Get system health status
*   **Authentication:** Bearer Token + Role Guard (Admin)
*   **Response:** `200 OK`
    ```json
    {
      "cpuUsage": 32.5,
      "memoryUsage": 60.2,
      "databaseStatus": "healthy",
      "apiResponseTime": 156.2
    }
    ```

### 3.6. Get Notifications
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/notifications`
*   **Description:** Get user notifications
*   **Authentication:** Bearer Token + Role Guard (Admin or User)
*   **Response:** `200 OK`
    ```json
    [
      {
        "id": "notif_uuid_001",
        "message": "New customer registration requires approval",
        "date": "2024-11-09T14:30:00Z",
        "read": false
      },
      {
        "id": "notif_uuid_002",
        "message": "System maintenance scheduled for tonight",
        "date": "2024-11-09T10:00:00Z",
        "read": true
      }
    ]
    ```

## 4. Analytics Endpoints

### 4.1. Get Sales Statistics
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/statistics/sales`
*   **Description:** Get sales statistics with filters
*   **Authentication:** Bearer Token + Role Guard (Admin)
*   **Query Parameters:**
    *   `period` (optional, string): Time period for analysis
    *   `startDate` (optional, ISO string): Start date for custom range
    *   `endDate` (optional, ISO string): End date for custom range
*   **Response:** `200 OK` - Returns sales analytics data

### 4.2. Get User Engagement Statistics
*   **HTTP Method:** `GET`
*   **URL:** `/dashboard/statistics/user-engagement`
*   **Description:** Get user engagement statistics
*   **Authentication:** Bearer Token + Role Guard (Admin)
*   **Query Parameters:**
    *   `metricType` (optional, string): Specific engagement metric
    *   `dateRange` (optional, string): Date range for analysis
*   **Response:** `200 OK` - Returns user engagement analytics

## 5. Data Sources & Architecture

### **Real-time Data Integration**
- **Customer Data**: Synchronized from customer-service via Kafka
- **Financial Data**: Integrated from finance and payment services
- **System Metrics**: Collected from monitoring systems
- **User Activities**: Tracked across all platform interactions

### **Widget System**
- **Configurable Layout**: Drag-and-drop dashboard customization
- **Real-time Updates**: WebSocket connections for live data
- **Role-based Widgets**: Different widgets based on user permissions
- **Responsive Design**: Adaptive layout for different screen sizes

### **Performance Considerations**
- **Caching Strategy**: Redis caching for frequently accessed metrics
- **Aggregation Pipeline**: Pre-calculated statistics for fast retrieval
- **Lazy Loading**: On-demand widget data loading
- **Rate Limiting**: Protection against excessive API calls

## 6. Security & Access Control

### **Authentication Requirements**
- Bearer Token authentication for all endpoints
- JWT validation and blacklist checking
- Role-based access control (RBAC)

### **Authorization Levels**
- **Admin**: Full access to all dashboard data and configurations
- **User**: Limited access to user-specific data and basic metrics
- **Company User**: Access restricted to company-related data only

### **Data Protection**
- Sensitive financial data requires elevated permissions
- Personal user data is anonymized in aggregated views
- Audit logging for all dashboard data access
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
