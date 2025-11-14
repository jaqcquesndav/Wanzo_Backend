# API Documentation: Finance & Subscriptions

This document outlines the API endpoints, request/response structures, and functionalities related to finance, billing, and subscription management.

## Base URLs

- **Via API Gateway**: `http://localhost:8000/admin/api/v1`
- **Direct (admin-service)**: `http://localhost:3001`
- **Version**: 2.0

### Routing Architecture

The API Gateway detects the `admin/api/v1` prefix and **strips it** before routing to admin-service.

**Example:**
- Client calls: `http://localhost:8000/admin/api/v1/finance/subscriptions`
- Gateway strips: `/admin/api/v1`
- Admin-service receives: `/finance/subscriptions`
- Controller handles: `@Controller('finance')`

All endpoints below use the full Base URL via API Gateway. This includes **dynamic subscription plan management**, financial transactions, customer subscriptions, payment processing, invoicing, and revenue reporting.

## 🆕 New Features (v2.0)

- **Dynamic Plan Creation & Management**: Create, update, deploy, and archive subscription plans via API
- **Plan Versioning**: Automatic versioning when modifying deployed plans
- **Advanced Analytics**: Real-time plan performance metrics and customer insights
- **Granular Feature Control**: 24 predefined features with custom limits and configuration
- **Token Management**: Sophisticated token allocation, rollover, and rate configuration
- **Multi-Customer Types**: Support for SME and Financial Institution plans
- **Plan Lifecycle Management**: DRAFT → DEPLOYED → ARCHIVED → DELETED workflow
- **A/B Testing Support**: Plan duplication and comparison capabilities

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

## 1. Dynamic Subscription Plan Management

### 1.1. List Dynamic Plans (NEW)
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/plans`
*   **Description:** Retrieves a paginated list of subscription plans with advanced filtering and sorting capabilities.
*   **Query Parameters:**
    *   `search` (optional, string): Search by plan name, description, or tags.
    *   `status` (optional, string): Filter by plan status (`DRAFT`, `DEPLOYED`, `ARCHIVED`, `DELETED`).
    *   `customerType` (optional, string): Filter by customer type (`SME`, `FINANCIAL_INSTITUTION`).
    *   `isActive` (optional, boolean): Filter by active status.
    *   `isVisible` (optional, boolean): Filter by visibility status.
    *   `page` (optional, integer): Page number for pagination (default: 1).
    *   `limit` (optional, integer): Items per page (default: 10).
    *   `sortBy` (optional, string): Sort field (default: 'createdAt').
    *   `sortDirection` (optional, string): Sort direction (`ASC`, `DESC`, default: 'DESC').
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "items": [
            {
              "id": "plan_123e4567-e89b-12d3-a456-426614174000",
              "name": "PME Professional",
              "description": "Plan professionnel complet pour PME avec analyse de crédit avancée.",
              "customerType": "SME",
              "price": 99.99,
              "annualPrice": 999.99,
              "annualDiscount": 16.67,
              "currency": "USD",
              "billingCycle": "monthly",
              "status": "DEPLOYED",
              "version": 2,
              "tokenConfig": {
                "monthlyTokens": 5000,
                "rolloverAllowed": true,
                "maxRolloverMonths": 3,
                "tokenRates": {
                  "CREDIT_ANALYSIS": 2.0,
                  "RISK_ASSESSMENT": 1.5,
                  "FINANCIAL_REPORTS": 1.0,
                  "PORTFOLIO_ANALYSIS": 3.0
                },
                "discountTiers": [
                  {
                    "minTokens": 10000,
                    "discountPercentage": 10
                  },
                  {
                    "minTokens": 50000,
                    "discountPercentage": 20
                  }
                ]
              },
              "features": {
                "BASIC_REPORTS": {
                  "enabled": true,
                  "limit": 100,
                  "description": "Rapports financiers de base"
                },
                "CREDIT_ANALYSIS": {
                  "enabled": true,
                  "description": "Analyse de crédit complète"
                },
                "RISK_ASSESSMENT": {
                  "enabled": true,
                  "limit": 50,
                  "description": "Évaluation des risques"
                },
                "API_ACCESS": {
                  "enabled": true,
                  "description": "Accès API complet"
                },
                "PRIORITY_SUPPORT": {
                  "enabled": true,
                  "description": "Support prioritaire 24/7"
                }
              },
              "limits": {
                "maxUsers": 25,
                "maxAPICallsPerDay": 10000,
                "maxDataStorageGB": 100,
                "maxReportsPerMonth": 500,
                "maxConcurrentSessions": 10,
                "maxDashboards": 20,
                "maxCustomFields": 50
              },
              "isActive": true,
              "isVisible": true,
              "sortOrder": 1,
              "trialPeriodDays": 30,
              "tags": ["pme", "professionnel", "populaire"],
              "analytics": {
                "totalSubscriptions": 245,
                "activeSubscriptions": 198,
                "churnRate": 5.2,
                "averageLifetimeValue": 2400.00,
                "monthlyRecurringRevenue": 19800.00,
                "conversionRate": 85.5,
                "popularFeatures": [
                  {
                    "feature": "CREDIT_ANALYSIS",
                    "usagePercentage": 95.2
                  },
                  {
                    "feature": "FINANCIAL_REPORTS",
                    "usagePercentage": 87.3
                  }
                ],
                "customerSatisfactionScore": 4.7,
                "supportTicketsPerMonth": 12
              },
              "createdAt": "2024-01-15T10:30:00Z",
              "updatedAt": "2024-03-20T14:15:00Z",
              "deployedAt": "2024-01-20T09:00:00Z",
              "createdBy": "admin_user_123",
              "updatedBy": "admin_user_456",
              "deployedBy": "admin_user_123",
              "metadata": {
                "targetMarket": "PME France",
                "salesNotes": "Plan le plus populaire pour les PME",
                "featureHighlights": ["Analyse de crédit", "Support 24/7", "API complète"],
                "comparisonNotes": "20% plus de features que le plan Standard"
              }
            }
          ],
          "totalCount": 12,
          "page": 1,
          "totalPages": 2
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.2. Get Plan Details (NEW)
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/plans/{planId}`
*   **Description:** Retrieves detailed information for a specific subscription plan.
*   **Response:**
    *   `200 OK`: Same structure as plan object in list response above.
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Plan not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.3. Create Plan (NEW)
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/plans`
*   **Description:** Creates a new subscription plan in DRAFT status.
*   **Request Body:**
    ```json
    {
      "name": "PME Enterprise",
      "description": "Plan entreprise avec fonctionnalités avancées pour grandes PME.",
      "customerType": "SME",
      "price": 199.99,
      "annualPrice": 1999.99,
      "annualDiscount": 16.67,
      "currency": "USD",
      "billingCycle": "monthly",
      "tokenConfig": {
        "monthlyTokens": 10000,
        "rolloverAllowed": true,
        "maxRolloverMonths": 6,
        "tokenRates": {
          "CREDIT_ANALYSIS": 1.8,
          "RISK_ASSESSMENT": 1.2,
          "FINANCIAL_REPORTS": 0.8,
          "PORTFOLIO_ANALYSIS": 2.5,
          "AI_INSIGHTS": 5.0
        },
        "discountTiers": [
          {
            "minTokens": 20000,
            "discountPercentage": 15
          },
          {
            "minTokens": 100000,
            "discountPercentage": 30
          }
        ]
      },
      "features": {
        "BASIC_REPORTS": {
          "enabled": true,
          "limit": 500,
          "description": "Rapports illimités"
        },
        "CREDIT_ANALYSIS": {
          "enabled": true,
          "description": "Analyse de crédit avancée avec IA"
        },
        "RISK_ASSESSMENT": {
          "enabled": true,
          "description": "Évaluation des risques en temps réel"
        },
        "AI_INSIGHTS": {
          "enabled": true,
          "description": "Insights IA et prédictions"
        },
        "DEDICATED_ACCOUNT_MANAGER": {
          "enabled": true,
          "description": "Account manager dédié"
        },
        "WHITE_LABEL": {
          "enabled": true,
          "description": "Solution white-label personnalisable"
        }
      },
      "limits": {
        "maxUsers": 100,
        "maxAPICallsPerDay": 50000,
        "maxDataStorageGB": 500,
        "maxReportsPerMonth": 2000,
        "maxConcurrentSessions": 50,
        "maxDashboards": 100,
        "maxCustomFields": 200
      },
      "trialPeriodDays": 45,
      "tags": ["pme", "enterprise", "ia", "white-label"],
      "sortOrder": 0,
      "metadata": {
        "targetMarket": "Grandes PME internationales",
        "salesNotes": "Plan premium avec IA et white-label",
        "featureHighlights": ["IA avancée", "White-label", "Account manager"],
        "comparisonNotes": "3x plus de ressources que le plan Professional"
      }
    }
    ```
*   **Response:**
    *   `201 Created`: Returns the created plan with status `DRAFT` and version `1`.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body or validation errors.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `409 Conflict`: A plan with the same name already exists for this customer type.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.4. Update Plan (NEW)
*   **HTTP Method:** `PUT`
*   **URL:** `/admin/api/v1/finance/plans/{planId}`
*   **Description:** Updates an existing plan. If the plan is DEPLOYED, creates a new version in DRAFT status.
*   **Request Body:** Same structure as create, but all fields are optional.
*   **Response:**
    *   `200 OK`: Returns the updated plan or new version if plan was deployed.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Plan not found.
    *   `409 Conflict`: Cannot update a deleted plan.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.5. Deploy Plan (NEW)
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/plans/{planId}/deploy`
*   **Description:** Deploys a DRAFT plan to production, making it available to customers.
*   **Request Body:**
    ```json
    {
      "deploymentNotes": "Plan prêt pour production après validation équipe produit",
      "notifyCustomers": false
    }
    ```
*   **Response:**
    *   `200 OK`: Returns the plan with status `DEPLOYED` and `deployedAt` timestamp.
*   **Error Responses:**
    *   `400 Bad Request`: Plan cannot be deployed (not in DRAFT status or inactive).
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Plan not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.6. Archive Plan (NEW)
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/plans/{planId}/archive`
*   **Description:** Archives a DEPLOYED plan, making it unavailable for new subscriptions.
*   **Request Body:**
    ```json
    {
      "reason": "Plan remplacé par la nouvelle version Enterprise v2",
      "replacementPlanId": "plan_789e4567-e89b-12d3-a456-426614174000"
    }
    ```
*   **Response:**
    *   `200 OK`: Returns the plan with status `ARCHIVED` and `archivedAt` timestamp.
*   **Error Responses:**
    *   `400 Bad Request`: Plan cannot be archived or has active subscriptions without replacement.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Plan not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.7. Delete Plan (NEW)
*   **HTTP Method:** `DELETE`
*   **URL:** `/admin/api/v1/finance/plans/{planId}`
*   **Description:** Soft-deletes a plan (only DRAFT or ARCHIVED plans with no subscriptions).
*   **Response:**
    *   `204 No Content`: Plan successfully deleted.
*   **Error Responses:**
    *   `400 Bad Request`: Plan cannot be deleted (has subscriptions or wrong status).
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Plan not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.8. Duplicate Plan (NEW)
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/plans/{planId}/duplicate`
*   **Description:** Creates a copy of an existing plan with a new name for A/B testing.
*   **Request Body:**
    ```json
    {
      "name": "PME Professional v2 (Test)"
    }
    ```
*   **Response:**
    *   `201 Created`: Returns the duplicated plan in DRAFT status with version 1.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Source plan not found.
    *   `409 Conflict`: Plan name already exists.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.9. Get Plan Analytics (NEW)
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/plans/{planId}/analytics`
*   **Description:** Retrieves detailed analytics and performance metrics for a specific plan.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "totalSubscriptions": 245,
          "activeSubscriptions": 198,
          "churnRate": 5.2,
          "averageLifetimeValue": 2400.00,
          "monthlyRecurringRevenue": 19800.00,
          "conversionRate": 85.5,
          "popularFeatures": [
            {
              "feature": "CREDIT_ANALYSIS",
              "usagePercentage": 95.2
            },
            {
              "feature": "FINANCIAL_REPORTS",
              "usagePercentage": 87.3
            },
            {
              "feature": "RISK_ASSESSMENT",
              "usagePercentage": 76.8
            }
          ],
          "customerSatisfactionScore": 4.7,
          "supportTicketsPerMonth": 12
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Plan not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.10. List Legacy Plans (DEPRECATED)
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/subscriptions/plans`
*   **Description:** ⚠️ **DEPRECATED** - Use `/admin/api/v1/finance/plans` instead. Retrieves a simplified list of active plans for backward compatibility.
*   **Response:**
    *   `200 OK`:
        ```json
        [
          {
            "id": "plan_123e4567-e89b-12d3-a456-426614174000",
            "name": "PME Professional",
            "description": "Plan professionnel complet pour PME.",
            "price": 99.99,
            "currency": "USD",
            "billingCycle": "monthly",
            "features": ["CREDIT_ANALYSIS", "RISK_ASSESSMENT", "FINANCIAL_REPORTS"],
            "isActive": true,
            "trialPeriodDays": 30,
            "metadata": {
              "maxUsers": 25,
              "storageLimit": "100GB"
            }
          }
        ]
        ```
*   **Error Responses:** Same as new endpoint.

## 1.2. Standardized Finance Service Endpoints

### 1.2.1. Get Financial Transactions
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/transactions`
*   **Description:** Retrieves paginated financial transactions with filtering options.
*   **Query Parameters:**
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 10)
    - `startDate` (optional): Filter transactions from date (ISO string)
    - `endDate` (optional): Filter transactions to date (ISO string)
    - `type` (optional): Transaction type filter
    - `status` (optional): Transaction status filter
*   **Response:** `PaginatedResponse<Transaction>`

### 1.2.2. Get Payments
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/payments`
*   **Description:** Retrieves paginated payments with filtering options.
*   **Query Parameters:** Same as transactions
*   **Response:** `PaginatedResponse<Payment>`

### 1.2.3. Get Invoices
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/invoices`
*   **Description:** Retrieves paginated invoices with filtering options.
*   **Query Parameters:** Same as transactions
*   **Response:** `PaginatedResponse<Invoice>`

### 1.2.4. Get Subscriptions
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/subscriptions`
*   **Description:** Retrieves paginated subscriptions with filtering options.
*   **Query Parameters:** Same as transactions
*   **Response:** `PaginatedResponse<Subscription>`

### 1.2.5. Get Token Transactions
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/tokens/transactions`
*   **Description:** Retrieves paginated token transactions with filtering options.
*   **Query Parameters:** Same as transactions
*   **Response:** `PaginatedResponse<TokenTransaction>`

## 2. Subscription Endpoints

### 2.1. List Subscriptions
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/subscriptions`
*   **Description:** Retrieves a list of all subscriptions with pagination and filtering options.
*   **Query Parameters:**
    *   `search` (optional, string): Search by customer name, plan name, etc.
    *   `status` (optional, string): Filter by subscription status (`active`, `pending_activation`, `canceled`, `expired`, `paused`, `trial`, `payment_failed`).
    *   `planId` (optional, string): Filter by plan ID.
    *   `customerId` (optional, string): Filter by customer ID.
    *   `billingCycle` (optional, string): Filter by billing cycle (`monthly`, `annually`, `quarterly`, `biennially`, `one_time`).
    *   `startDateBefore`, `startDateAfter`, `endDateBefore`, `endDateAfter` (optional, string): Date filters in ISO format.
    *   `page` (optional, integer): Page number for pagination.
    *   `limit` (optional, integer): Number of items per page.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "items": [
            {
              "id": "sub_123",
              "customerId": "cust_abc",
              "customerName": "Acme Corp",
              "planId": "plan_pro_monthly",
              "planName": "Professional Plan - Monthly",
              "status": "active",
              "startDate": "2023-01-01T00:00:00Z",
              "endDate": "2023-12-31T23:59:59Z",
              "currentPeriodStart": "2023-06-01T00:00:00Z",
              "currentPeriodEnd": "2023-06-30T23:59:59Z",
              "nextBillingDate": "2023-07-01T00:00:00Z",
              "amount": 49.99,
              "currency": "USD",
              "billingCycle": "monthly",
              "autoRenew": true,
              "createdAt": "2023-01-01T00:00:00Z",
              "updatedAt": "2023-06-01T00:00:00Z"
            }
          ],
          "totalCount": 50,
          "page": 1,
          "totalPages": 5
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

### 2.2. Get Subscription by ID
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/subscriptions/{subscriptionId}`
*   **Description:** Retrieves details for a specific subscription.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "sub_123",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "planId": "plan_pro_monthly",
          "planName": "Professional Plan - Monthly",
          "status": "active",
          "startDate": "2023-01-01T00:00:00Z",
          "endDate": "2023-12-31T23:59:59Z",
          "currentPeriodStart": "2023-06-01T00:00:00Z",
          "currentPeriodEnd": "2023-06-30T23:59:59Z",
          "nextBillingDate": "2023-07-01T00:00:00Z",
          "amount": 49.99,
          "currency": "USD",
          "billingCycle": "monthly",
          "autoRenew": true,
          "paymentMethodId": "pm_456",
          "createdAt": "2023-01-01T00:00:00Z",
          "updatedAt": "2023-06-01T00:00:00Z",
          "trialEndsAt": null,
          "canceledAt": null,
          "cancellationReason": null,
          "metadata": {
            "previousPlanId": "plan_basic_monthly"
          }
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Subscription not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 2.3. Create Subscription
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/subscriptions`
*   **Description:** Creates a new subscription for a customer.
*   **Request Body:**
    ```json
    {
      "customerId": "cust_abc",
      "planId": "plan_pro_monthly",
      "startDate": "2023-07-01T00:00:00Z",
      "autoRenew": true,
      "paymentMethodId": "pm_456",
      "trialPeriodDays": 14,
      "couponCode": "WELCOME20",
      "metadata": {
        "referredBy": "partner_123"
      }
    }
    ```
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "id": "sub_789",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "planId": "plan_pro_monthly",
          "planName": "Professional Plan - Monthly",
          "status": "active",
          "startDate": "2023-07-01T00:00:00Z",
          "currentPeriodStart": "2023-07-01T00:00:00Z",
          "currentPeriodEnd": "2023-07-31T23:59:59Z",
          "nextBillingDate": "2023-08-01T00:00:00Z",
          "amount": 49.99,
          "currency": "USD",
          "billingCycle": "monthly",
          "autoRenew": true,
          "paymentMethodId": "pm_456",
          "createdAt": "2023-06-15T12:30:00Z",
          "updatedAt": "2023-06-15T12:30:00Z",
          "trialEndsAt": "2023-07-15T00:00:00Z",
          "metadata": {
            "referredBy": "partner_123"
          }
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Customer or plan not found.
    *   `409 Conflict`: Customer already has an active subscription to this plan.
    *   `500 Internal Server Error`: Unexpected server error.

### 2.4. Update Subscription
*   **HTTP Method:** `PUT`
*   **URL:** `/admin/api/v1/finance/subscriptions/{subscriptionId}`
*   **Description:** Updates an existing subscription.
*   **Request Body:**
    ```json
    {
      "planId": "plan_pro_annually",
      "autoRenew": false,
      "paymentMethodId": "pm_789",
      "metadata": {
        "notes": "Customer upgraded to annual plan"
      }
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "sub_123",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "planId": "plan_pro_annually",
          "planName": "Professional Plan - Annual",
          "status": "active",
          "startDate": "2023-01-01T00:00:00Z",
          "currentPeriodStart": "2023-06-01T00:00:00Z",
          "currentPeriodEnd": "2024-05-31T23:59:59Z",
          "nextBillingDate": null,
          "amount": 499.99,
          "currency": "USD",
          "billingCycle": "annually",
          "autoRenew": false,
          "paymentMethodId": "pm_789",
          "createdAt": "2023-01-01T00:00:00Z",
          "updatedAt": "2023-06-15T14:45:00Z",
          "metadata": {
            "notes": "Customer upgraded to annual plan"
          }
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Subscription not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 2.5. Cancel Subscription
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/subscriptions/{subscriptionId}/cancel`
*   **Description:** Cancels an active subscription.
*   **Request Body:**
    ```json
    {
      "reason": "Customer is switching to a different service."
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "sub_123",
          "status": "canceled",
          "canceledAt": "2023-06-15T15:00:00Z",
          "cancellationReason": "Customer is switching to a different service.",
          "endDate": "2023-06-30T23:59:59Z"
          // Other subscription fields...
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Subscription not found.
    *   `409 Conflict`: Subscription is already canceled.
    *   `500 Internal Server Error`: Unexpected server error.

## 3. Invoice Endpoints

### 3.1. List Invoices
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/invoices`
*   **Description:** Retrieves a list of invoices with pagination and filtering options.
*   **Query Parameters:**
    *   `search` (optional, string): Search by invoice number, customer name, etc.
    *   `status` (optional, string): Filter by invoice status (`paid`, `pending`, `overdue`, `canceled`).
    *   `customerId` (optional, string): Filter by customer ID.
    *   `startDate`, `endDate` (optional, string): Date filters in ISO format.
    *   `page` (optional, integer): Page number for pagination.
    *   `limit` (optional, integer): Number of items per page.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "items": [
            {
              "id": "inv_123",
              "invoiceNumber": "INV-2023-001",
              "customerId": "cust_abc",
              "customerName": "Acme Corp",
              "amount": 49.99,
              "currency": "USD",
              "status": "paid",
              "issueDate": "2023-06-01T00:00:00Z",
              "dueDate": "2023-06-15T00:00:00Z",
              "paidDate": "2023-06-10T14:30:00Z",
              "items": [
                {
                  "id": "item_1",
                  "description": "Professional Plan - Monthly Subscription",
                  "quantity": 1,
                  "unitPrice": 49.99,
                  "subtotal": 49.99
                }
              ],
              "subtotal": 49.99,
              "taxAmount": 0,
              "discountAmount": 0,
              "totalAmount": 49.99
            }
          ],
          "totalCount": 50,
          "page": 1,
          "totalPages": 5
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

### 3.2. Get Invoice by ID
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/invoices/{invoiceId}`
*   **Description:** Retrieves details for a specific invoice.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "inv_123",
          "invoiceNumber": "INV-2023-001",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "amount": 49.99,
          "currency": "USD",
          "status": "paid",
          "issueDate": "2023-06-01T00:00:00Z",
          "dueDate": "2023-06-15T00:00:00Z",
          "paidDate": "2023-06-10T14:30:00Z",
          "items": [
            {
              "id": "item_1",
              "description": "Professional Plan - Monthly Subscription",
              "quantity": 1,
              "unitPrice": 49.99,
              "subtotal": 49.99,
              "taxRate": 0,
              "taxAmount": 0
            }
          ],
          "subtotal": 49.99,
          "taxAmount": 0,
          "discountAmount": 0,
          "totalAmount": 49.99,
          "notes": "Thank you for your business!"
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Invoice not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 3.3. Create Invoice
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/invoices`
*   **Description:** Creates a new invoice.
*   **Request Body:**
    ```json
    {
      "customerId": "cust_abc",
      "items": [
        {
          "description": "Professional Plan - Monthly Subscription",
          "quantity": 1,
          "unitPrice": 49.99,
          "subtotal": 49.99
        },
        {
          "description": "Additional User Seats (5)",
          "quantity": 5,
          "unitPrice": 10,
          "subtotal": 50
        }
      ],
      "dueDate": "2023-07-15T00:00:00Z",
      "notes": "Monthly subscription invoice",
      "currency": "USD"
    }
    ```
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "id": "inv_456",
          "invoiceNumber": "INV-2023-002",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "amount": 99.99,
          "currency": "USD",
          "status": "pending",
          "issueDate": "2023-06-15T16:00:00Z",
          "dueDate": "2023-07-15T00:00:00Z",
          "items": [
            {
              "id": "item_2",
              "description": "Professional Plan - Monthly Subscription",
              "quantity": 1,
              "unitPrice": 49.99,
              "subtotal": 49.99
            },
            {
              "id": "item_3",
              "description": "Additional User Seats (5)",
              "quantity": 5,
              "unitPrice": 10,
              "subtotal": 50
            }
          ],
          "subtotal": 99.99,
          "taxAmount": 0,
          "discountAmount": 0,
          "totalAmount": 99.99,
          "notes": "Monthly subscription invoice"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Customer not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 3.4. Update Invoice
*   **HTTP Method:** `PUT`
*   **URL:** `/admin/api/v1/finance/invoices/{invoiceId}`
*   **Description:** Updates an existing invoice.
*   **Request Body:**
    ```json
    {
      "dueDate": "2023-07-30T00:00:00Z",
      "notes": "Extended payment terms as agreed with customer"
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "inv_456",
          "invoiceNumber": "INV-2023-002",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "amount": 99.99,
          "currency": "USD",
          "status": "pending",
          "issueDate": "2023-06-15T16:00:00Z",
          "dueDate": "2023-07-30T00:00:00Z",
          // Other fields remain the same
          "notes": "Extended payment terms as agreed with customer"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Invoice not found.
    *   `409 Conflict`: Cannot update a paid or canceled invoice.
    *   `500 Internal Server Error`: Unexpected server error.

### 3.5. Delete Invoice
*   **HTTP Method:** `DELETE`
*   **URL:** `/admin/api/v1/finance/invoices/{invoiceId}`
*   **Description:** Deletes an invoice.
*   **Response:**
    *   `204 No Content`: Invoice successfully deleted.
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Invoice not found.
    *   `409 Conflict`: Cannot delete a paid invoice.
    *   `500 Internal Server Error`: Unexpected server error.

### 3.6. Send Invoice Reminder
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/invoices/{invoiceId}/send-reminder`
*   **Description:** Sends a reminder email for an unpaid invoice.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "message": "Reminder sent successfully."
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Invoice not found.
    *   `409 Conflict`: Invoice is not in a pending or overdue state.
    *   `500 Internal Server Error`: Unexpected server error.

## 4. Payment Endpoints

### 4.1. List Payments
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/payments`
*   **Description:** Retrieves a list of payments with pagination and filtering options.
*   **Query Parameters:**
    *   Similar to transaction filters: search, status, payment method, date range, etc.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "items": [
            {
              "id": "pay_123",
              "invoiceId": "inv_123",
              "customerId": "cust_abc",
              "customerName": "Acme Corp",
              "amount": 49.99,
              "currency": "USD",
              "method": "bank_transfer",
              "proofType": "bank_transfer",
              "proofUrl": "https://storage.wanzo.com/payment-proofs/proof_123.pdf",
              "status": "verified",
              "transactionReference": "BT123456789",
              "paidAt": "2023-06-10T14:30:00Z",
              "createdAt": "2023-06-10T14:25:00Z",
              "description": "Payment for invoice INV-2023-001",
              "verifiedBy": "admin_user_456",
              "verifiedAt": "2023-06-11T09:15:00Z",
              "metadata": {
                "approvalNotes": "Bank transfer confirmed."
              }
            }
          ],
          "totalCount": 25,
          "page": 1,
          "totalPages": 3
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

### 4.2. Get Payment by ID
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/payments/{paymentId}`
*   **Description:** Retrieves details for a specific payment.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "pay_123",
          "invoiceId": "inv_123",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "amount": 49.99,
          "currency": "USD",
          "method": "bank_transfer",
          "proofType": "bank_transfer",
          "proofUrl": "https://storage.wanzo.com/payment-proofs/proof_123.pdf",
          "status": "verified",
          "transactionReference": "BT123456789",
          "paidAt": "2023-06-10T14:30:00Z",
          "createdAt": "2023-06-10T14:25:00Z",
          "description": "Payment for invoice INV-2023-001",
          "verifiedBy": "admin_user_456",
          "verifiedAt": "2023-06-11T09:15:00Z",
          "metadata": {
            "approvalNotes": "Bank transfer confirmed."
          }
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Payment not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 4.3. Record Manual Payment
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/payments/manual`
*   **Description:** Records a manual payment.
*   **Request Body:**
    ```json
    {
      "customerId": "cust_abc",
      "amount": 99.99,
      "currency": "USD",
      "method": "bank_transfer",
      "transactionReference": "BT987654321",
      "paidAt": "2023-06-16T10:00:00Z",
      "description": "Payment for invoice INV-2023-002",
      "proofType": "bank_transfer",
      "proofUrl": "https://storage.wanzo.com/payment-proofs/proof_456.pdf"
    }
    ```
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "id": "pay_456",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "amount": 99.99,
          "currency": "USD",
          "method": "bank_transfer",
          "proofType": "bank_transfer",
          "proofUrl": "https://storage.wanzo.com/payment-proofs/proof_456.pdf",
          "status": "pending",
          "transactionReference": "BT987654321",
          "paidAt": "2023-06-16T10:00:00Z",
          "createdAt": "2023-06-16T13:45:00Z",
          "description": "Payment for invoice INV-2023-002"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Customer not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 4.4. Verify Payment
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/payments/verify`
*   **Description:** Verifies or rejects a pending payment.
*   **Request Body:**
    ```json
    {
      "paymentId": "pay_456",
      "status": "verified",
      "adminNotes": "Payment confirmed by bank statement check."
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "pay_456",
          "status": "verified",
          "verifiedBy": "admin_user_456",
          "verifiedAt": "2023-06-16T14:30:00Z",
          "metadata": {
            "approvalNotes": "Payment confirmed by bank statement check."
          }
          // Other payment fields...
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Payment not found.
    *   `409 Conflict`: Payment is not in a pending state.
    *   `500 Internal Server Error`: Unexpected server error.

## 5. Transaction Endpoints

### 5.1. List Transactions
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/transactions`
*   **Description:** Retrieves a list of financial transactions with pagination and filtering options.
*   **Query Parameters:**
    *   `search` (optional, string): Search by reference, description, etc.
    *   `type` (optional, string): Filter by transaction type (`payment`, `invoice`, `refund`, `credit`, `debit`).
    *   `status` (optional, string): Filter by status (`completed`, `pending`, `failed`, `canceled`, `verified`, `rejected`).
    *   `paymentMethod` (optional, string): Filter by payment method.
    *   `startDate`, `endDate` (optional, string): Date filters in ISO format.
    *   `customerId` (optional, string): Filter by customer ID.
    *   `page` (optional, integer): Page number for pagination.
    *   `limit` (optional, integer): Number of items per page.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "items": [
            {
              "id": "txn_123",
              "reference": "PAY-123456",
              "amount": 49.99,
              "currency": "USD",
              "type": "payment",
              "status": "completed",
              "createdAt": "2023-06-10T14:30:00Z",
              "updatedAt": "2023-06-10T14:35:00Z",
              "description": "Payment for invoice INV-2023-001",
              "customerId": "cust_abc",
              "customerName": "Acme Corp",
              "paymentMethod": "bank_transfer"
            }
          ],
          "totalCount": 75,
          "page": 1,
          "totalPages": 8
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

### 5.2. Get Transaction by ID
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/transactions/{transactionId}`
*   **Description:** Retrieves details for a specific transaction.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "txn_123",
          "reference": "PAY-123456",
          "amount": 49.99,
          "currency": "USD",
          "type": "payment",
          "status": "completed",
          "createdAt": "2023-06-10T14:30:00Z",
          "updatedAt": "2023-06-10T14:35:00Z",
          "description": "Payment for invoice INV-2023-001",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "paymentMethod": "bank_transfer",
          "metadata": {
            "invoiceId": "inv_123",
            "paymentId": "pay_123"
          }
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Transaction not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 5.3. Create Transaction
*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/finance/transactions`
*   **Description:** Creates a new transaction record.
*   **Request Body:**
    ```json
    {
      "customerId": "cust_abc",
      "amount": 25.00,
      "currency": "USD",
      "type": "credit",
      "description": "Account credit for service issue",
      "paymentMethod": "manual",
      "metadata": {
        "approvedBy": "admin_user_456",
        "reason": "Compensation for downtime"
      }
    }
    ```
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "id": "txn_789",
          "reference": "CREDIT-123456",
          "amount": 25.00,
          "currency": "USD",
          "type": "credit",
          "status": "completed",
          "createdAt": "2023-06-16T15:00:00Z",
          "updatedAt": "2023-06-16T15:00:00Z",
          "description": "Account credit for service issue",
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "paymentMethod": "manual",
          "metadata": {
            "approvedBy": "admin_user_456",
            "reason": "Compensation for downtime"
          }
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Customer not found.
    *   `500 Internal Server Error`: Unexpected server error.

## 6. Token Endpoints

### 6.1. Get Token Packages
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/tokens/packages`
*   **Description:** Retrieves a list of available token packages.
*   **Response:**
    *   `200 OK`:
        ```json
        [
          {
            "id": "tok_pkg_123",
            "name": "Starter Pack",
            "description": "500 API tokens",
            "price": 9.99,
            "currency": "USD",
            "tokensIncluded": 500,
            "tokenType": "api_call",
            "isActive": true
          },
          {
            "id": "tok_pkg_456",
            "name": "Pro Pack",
            "description": "5000 API tokens",
            "price": 79.99,
            "currency": "USD",
            "tokensIncluded": 5000,
            "tokenType": "api_call",
            "isActive": true
          }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

### 6.2. Get Token Transactions
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/tokens/transactions`
*   **Description:** Retrieves a list of token transactions with pagination and filtering options.
*   **Query Parameters:**
    *   `search` (optional, string): Search by customer name, description, etc.
    *   `customerId` (optional, string): Filter by customer ID.
    *   `type` (optional, string): Filter by transaction type (`purchase`, `usage`, `refund`, `adjustment`, `expiry`, `bonus`).
    *   `tokenType` (optional, string): Filter by token type (`wanzo_credit`, `api_call`, `storage_gb`, `processing_unit`, `generic`).
    *   `startDate`, `endDate` (optional, string): Date filters in ISO format.
    *   `page`, `limit`, `sortBy`, `sortDirection` (optional): Pagination and sorting options.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "items": [
            {
              "id": "tok_txn_123",
              "customerId": "cust_abc",
              "customerName": "Acme Corp",
              "type": "purchase",
              "tokenType": "api_call",
              "amount": 5000,
              "balanceAfterTransaction": 5000,
              "transactionDate": "2023-06-01T10:00:00Z",
              "description": "Purchase of Pro Pack",
              "relatedPurchaseId": "tok_pkg_456",
              "relatedInvoiceId": "inv_123"
            },
            {
              "id": "tok_txn_124",
              "customerId": "cust_abc",
              "customerName": "Acme Corp",
              "type": "usage",
              "tokenType": "api_call",
              "amount": -100,
              "balanceAfterTransaction": 4900,
              "transactionDate": "2023-06-02T14:30:00Z",
              "description": "API usage"
            }
          ],
          "totalCount": 15,
          "page": 1,
          "totalPages": 2
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

### 6.3. Get Customer Token Balance
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/tokens/balance/{customerId}`
*   **Description:** Retrieves token balance for a customer.
*   **Query Parameters:**
    *   `tokenType` (optional, string): Filter by specific token type.
*   **Response:**
    *   `200 OK`:
        ```json
        // For specific token type:
        {
          "customerId": "cust_abc",
          "tokenType": "api_call",
          "balance": 4900,
          "lastUpdatedAt": "2023-06-02T14:30:00Z"
        }
        
        // For all token types (without tokenType parameter):
        [
          {
            "customerId": "cust_abc",
            "tokenType": "api_call",
            "balance": 4900,
            "lastUpdatedAt": "2023-06-02T14:30:00Z"
          },
          {
            "customerId": "cust_abc",
            "tokenType": "storage_gb",
            "balance": 10,
            "lastUpdatedAt": "2023-06-01T10:00:00Z"
          }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Customer not found.
    *   `500 Internal Server Error`: Unexpected server error.

## 7. Financial Summary Endpoint

### 7.1. Get Financial Summary
*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/finance/summary`
*   **Description:** Retrieves financial summary statistics.
*   **Query Parameters:**
    *   `period` (optional, string): Time period for the summary (`daily`, `weekly`, `monthly`, `yearly`).
    *   `customerId` (optional, string): Filter summary for a specific customer.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "totalRevenue": 25000,
          "pendingInvoices": 15,
          "pendingAmount": 2500,
          "overdueAmount": 1000,
          "paidInvoices": 85,
          "revenueByMonth": {
            "2023-01": 1500,
            "2023-02": 1800,
            "2023-03": 2100,
            "2023-04": 2300,
            "2023-05": 2800,
            "2023-06": 1500
          },
          "topCustomers": [
            {
              "customerId": "cust_abc",
              "customerName": "Acme Corp",
              "totalSpent": 5000
            },
            {
              "customerId": "cust_def",
              "customerName": "Beta Inc",
              "totalSpent": 3500
            }
          ]
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

## 8. Data Models

### 8.1. Transaction
```typescript
interface Transaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  type: 'payment' | 'invoice' | 'refund' | 'credit' | 'debit';
  status: 'completed' | 'pending' | 'failed' | 'canceled' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
  description: string;
  customerId?: string;
  customerName?: string;
  paymentMethod?: 'bank_transfer' | 'card' | 'mobile_money' | 'crypto' | 'cash' | 'check' | 'other';
  metadata?: Record<string, unknown>;
}
```

### 8.2. Invoice
```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'canceled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
}
```

### 8.3. Payment
```typescript
interface Payment {
  id: string;
  invoiceId?: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'card' | 'mobile_money' | 'crypto' | 'cash' | 'check' | 'other';
  proofType?: 'bank_transfer' | 'check' | 'other';
  proofUrl?: string;
  status: 'pending' | 'verified' | 'rejected' | 'completed' | 'failed' | 'canceled';
  transactionReference: string;
  paidAt: string;
  createdAt?: string;
  description?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  metadata?: Record<string, unknown>;
}
```

### 8.4. Subscription Plans (Updated Models)

```typescript
// Enums
enum PlanStatus {
  DRAFT = 'DRAFT',
  DEPLOYED = 'DEPLOYED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

enum CustomerType {
  SME = 'SME',
  FINANCIAL_INSTITUTION = 'FINANCIAL_INSTITUTION'
}

enum FeatureCode {
  // Features de base
  BASIC_REPORTS = 'BASIC_REPORTS',
  CUSTOMER_MANAGEMENT = 'CUSTOMER_MANAGEMENT',
  TRANSACTION_HISTORY = 'TRANSACTION_HISTORY',
  
  // Features avancées
  FINANCIAL_REPORTS = 'FINANCIAL_REPORTS',
  CREDIT_ANALYSIS = 'CREDIT_ANALYSIS',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  PORTFOLIO_ANALYSIS = 'PORTFOLIO_ANALYSIS',
  
  // Features premium
  AI_INSIGHTS = 'AI_INSIGHTS',
  PREDICTIVE_ANALYTICS = 'PREDICTIVE_ANALYTICS',
  CUSTOM_DASHBOARDS = 'CUSTOM_DASHBOARDS',
  WHITE_LABEL = 'WHITE_LABEL',
  
  // API et intégrations
  API_ACCESS = 'API_ACCESS',
  WEBHOOK_SUPPORT = 'WEBHOOK_SUPPORT',
  THIRD_PARTY_INTEGRATIONS = 'THIRD_PARTY_INTEGRATIONS',
  
  // Support et formation
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  DEDICATED_ACCOUNT_MANAGER = 'DEDICATED_ACCOUNT_MANAGER',
  TRAINING_SESSIONS = 'TRAINING_SESSIONS',
  
  // Features techniques
  DATA_EXPORT = 'DATA_EXPORT',
  BULK_OPERATIONS = 'BULK_OPERATIONS',
  ADVANCED_FILTERS = 'ADVANCED_FILTERS',
  MULTI_CURRENCY = 'MULTI_CURRENCY',
  AUDIT_LOGS = 'AUDIT_LOGS',
  
  // Fonctionnalités mobiles
  MOBILE_APP_ACCESS = 'MOBILE_APP_ACCESS',
  OFFLINE_MODE = 'OFFLINE_MODE'
}

// Interfaces principales
interface FeatureConfig {
  enabled: boolean;
  limit?: number;
  description?: string;
  customConfig?: Record<string, any>;
}

interface TokenConfig {
  monthlyTokens: number;
  rolloverAllowed: boolean;
  maxRolloverMonths: number;
  tokenRates: Record<FeatureCode, number>;
  discountTiers: Array<{
    minTokens: number;
    discountPercentage: number;
  }>;
}

interface PlanLimits {
  maxUsers: number;
  maxAPICallsPerDay: number;
  maxDataStorageGB: number;
  maxReportsPerMonth: number;
  maxConcurrentSessions: number;
  maxDashboards: number;
  maxCustomFields: number;
}

interface PlanAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  churnRate: number;
  averageLifetimeValue: number;
  monthlyRecurringRevenue: number;
  conversionRate: number;
  popularFeatures: Array<{
    feature: FeatureCode;
    usagePercentage: number;
  }>;
  customerSatisfactionScore: number;
  supportTicketsPerMonth: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  customerType: CustomerType;
  price: number;
  annualPrice?: number;
  annualDiscount: number;
  currency: string;
  billingCycle: 'monthly' | 'annually' | 'quarterly' | 'biennially' | 'one_time';
  status: PlanStatus;
  version: number;
  tokenConfig: TokenConfig;
  features: Record<FeatureCode, FeatureConfig>;
  limits: PlanLimits;
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  trialPeriodDays?: number;
  tags: string[];
  analytics?: PlanAnalytics;
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
  archivedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deployedBy?: string;
  archivedBy?: string;
  metadata: {
    targetMarket?: string;
    salesNotes?: string;
    migrationInstructions?: string;
    featureHighlights?: string[];
    comparisonNotes?: string;
    [key: string]: any;
  };
}

interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  planId: string;
  planName: string;
  status: 'active' | 'pending_activation' | 'canceled' | 'expired' | 'paused' | 'trial' | 'payment_failed';
  startDate: string;
  endDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annually' | 'quarterly' | 'biennially' | 'one_time';
  autoRenew: boolean;
  paymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
  trialEndsAt?: string;
  canceledAt?: string;
  cancellationReason?: string;
  // Nouveaux champs pour les tokens (compatibles avec Customer Service)
  tokensIncluded: number;
  tokensUsed: number;
  tokensRemaining: number;
  tokensRolledOver?: number;
  metadata?: Record<string, unknown>;
}

// DTOs de requête et réponse
interface CreatePlanDto {
  name: string;
  description: string;
  customerType: CustomerType;
  price: number;
  annualPrice?: number;
  annualDiscount?: number;
  currency: string;
  billingCycle: 'monthly' | 'annually' | 'quarterly' | 'biennially' | 'one_time';
  tokenConfig: TokenConfig;
  features: Record<FeatureCode, FeatureConfig>;
  limits: PlanLimits;
  trialPeriodDays?: number;
  tags?: string[];
  sortOrder?: number;
  metadata?: Record<string, any>;
}

interface UpdatePlanDto {
  name?: string;
  description?: string;
  price?: number;
  annualPrice?: number;
  annualDiscount?: number;
  currency?: string;
  billingCycle?: 'monthly' | 'annually' | 'quarterly' | 'biennially' | 'one_time';
  tokenConfig?: TokenConfig;
  features?: Record<FeatureCode, FeatureConfig>;
  limits?: PlanLimits;
  trialPeriodDays?: number;
  tags?: string[];
  sortOrder?: number;
  isActive?: boolean;
  isVisible?: boolean;
  metadata?: Record<string, any>;
}

interface DeployPlanDto {
  deploymentNotes?: string;
  notifyCustomers?: boolean;
}

interface ArchivePlanDto {
  reason: string;
  replacementPlanId?: string;
}

interface ListPlansQueryDto extends PaginationQuery {
  search?: string;
  status?: PlanStatus;
  customerType?: CustomerType;
  isActive?: boolean;
  isVisible?: boolean;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

interface PaginatedPlansResponse extends PaginatedResponse<SubscriptionPlan> {}
```

### 8.5. Token
```typescript
interface TokenPackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  tokensIncluded: number;
  tokenType: 'wanzo_credit' | 'api_call' | 'storage_gb' | 'processing_unit' | 'generic';
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

interface TokenBalance {
  customerId: string;
  tokenType: 'wanzo_credit' | 'api_call' | 'storage_gb' | 'processing_unit' | 'generic';
  balance: number;
  lastUpdatedAt: string;
}

interface TokenTransaction {
  id: string;
  customerId: string;
  customerName?: string;
  type: 'purchase' | 'usage' | 'refund' | 'adjustment' | 'expiry' | 'bonus';
  tokenType: 'wanzo_credit' | 'api_call' | 'storage_gb' | 'processing_unit' | 'generic';
  amount: number;
  balanceAfterTransaction?: number;
  transactionDate: string;
  description?: string;
  relatedPurchaseId?: string;
  relatedInvoiceId?: string;
  issuedBy?: string;
  metadata?: Record<string, unknown>;
}
```

### 8.6. FinancialSummary
```typescript
interface FinancialSummary {
  totalRevenue: number;
  pendingInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
  paidInvoices: number;
  revenueByMonth: Record<string, number>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
  }>;
}
```
