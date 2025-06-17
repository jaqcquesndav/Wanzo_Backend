# API Documentation: Token Management

This document outlines the API endpoints for managing tokens within the Wanzo Admin system. Tokens are digital credits that customers use to access various AI features and services.

## Base URL

All API endpoints are relative to the base URL: `/api`

## Authentication

All endpoints require Bearer Token authentication. Refer to the [Auth API Documentation](./auth.md) for details on authentication.

## Tokens Data Models

### TokenPackage

```typescript
interface TokenPackage {
  id: string;
  name: string;
  description?: string;
  tokenAmount: number;
  priceUSD: number;
  priceLocal?: number;
  localCurrency?: string;
  isPopular?: boolean;
  validityDays: number;
  targetCustomerTypes: CustomerType[];
  customerTypeSpecific: CustomerTypeSpecificMetadata[];
  minimumPurchase?: number;
  discountPercentages?: {
    tier1: {
      minAmount: number;
      percentage: number;
    };
    tier2: {
      minAmount: number;
      percentage: number;
    };
    tier3: {
      minAmount: number;
      percentage: number;
    };
  };
}
```

### TokenBalance

```typescript
interface TokenBalance {
  customerId: string;
  tokenType: TokenType;
  balance: number;
  lastUpdatedAt: string; // ISO date string
}
```

### TokenTransaction

```typescript
interface TokenTransaction {
  id: string;
  customerId: string;
  subscriptionId?: string;
  packageId?: string;
  type: TokenTransactionType; // 'purchase' | 'usage' | 'refund' | 'adjustment' | 'expiry' | 'bonus'
  amount: number;
  balance: number;
  description?: string;
  timestamp: string;
  expiryDate?: string;
  metadata?: {
    operation?: string;
    apiEndpoint?: string;
    sessionId?: string;
    paymentId?: string;
  };
}
```

### TokenUsage

```typescript
interface TokenUsage {
  id: string;
  customerId: string;
  userId: string;
  appType: AppType;
  tokensUsed: number;
  date: string;
  feature: string;
  prompt?: string;
  responseTokens: number;
  requestTokens: number;
  cost: number;
}
```

### TokenStatistics

```typescript
interface TokenStatistics {
  totalTokensAllocated: number;
  totalTokensUsed: number;
  totalTokensPurchased: number;
  totalTokenCost?: number;
  tokenUsageGrowth?: number;
  tokenUsageByPeriod: Array<{
    period: string;
    tokensUsed: number;
  }>;
  tokenUsageByCustomerType: {
    pme: number;
    financial: number;
  };
  averageTokensPerCustomer: number;
  top10TokenConsumers: Array<{
    customerId: string;
    customerName: string;
    tokensConsumed: number;
  }>;
  tokenUsageTrend: Array<{
    date: string;
    used: number;
    cost: number;
    revenue: number;
  }>;
}
```

## Endpoints

### 1. Get Token Balance

*   **Endpoint:** `GET /tokens/balance`
*   **Description:** Retrieves the current token balance for the authenticated user or company.
*   **Permissions Required:** `tokens:read`
*   **Successful Response (200 OK):**
    ```json
    {
      "available": 1500,
      "allocated": 2000,
      "used": 500,
      "lastUpdated": "2024-05-28T10:30:00Z"
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2. Get Available Token Packages

*   **Endpoint:** `GET /tokens/packages`
*   **Description:** Retrieves a list of available token packages for purchase.
*   **Permissions Required:** `tokens:read`
*   **Successful Response (200 OK):**
    ```json
    {
      "packages": [
        {
          "id": "pkg_small_1000",
          "name": "Small Pack",
          "description": "1,000 Tokens",
          "tokenAmount": 1000,
          "priceUSD": 10.00,
          "priceLocal": 9.00,
          "localCurrency": "EUR",
          "isPopular": false,
          "validityDays": 365,
          "targetCustomerTypes": ["pme", "financial"],
          "customerTypeSpecific": [
            {
              "type": "financial",
              "minimumPurchase": 5000
            }
          ],
          "discountPercentages": {
            "tier1": {
              "minAmount": 10000,
              "percentage": 5
            },
            "tier2": {
              "minAmount": 50000,
              "percentage": 10
            },
            "tier3": {
              "minAmount": 100000,
              "percentage": 15
            }
          }
        }
        // ... more packages
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 3. Purchase Tokens

*   **Endpoint:** `POST /tokens/purchase`
*   **Description:** Initiates a token purchase. If `proofDocument` is provided, it's uploaded to Cloudinary first, and its URL is sent to the backend.
*   **Permissions Required:** `tokens:purchase`
*   **Request Body (application/json or multipart/form-data if `proofDocument` is included):**
    ```json
    {
      "packageId": "pkg_medium_5000",
      "paymentMethod": "credit_card", // e.g., "credit_card", "bank_transfer", "paypal"
      "transactionReference": "txn_123abc456def", // Optional, for bank transfers etc.
      // "proofDocument": (File object if using multipart/form-data)
    }
    ```
*   **Successful Response (201 Created):**
    ```json
    {
      "transaction": {
        "id": "trans_789xyz",
        "customerId": "cust_123",
        "packageId": "pkg_medium_5000",
        "type": "purchase",
        "amount": 5250,
        "balance": 6750,
        "description": "Purchase of Medium Pack",
        "timestamp": "2024-06-01T16:00:00Z",
        "expiryDate": "2025-06-01T16:00:00Z",
        "metadata": {
          "paymentId": "pay_abc123"
        }
      },
      "newBalance": {
        "available": 6750,
        "allocated": 7250,
        "used": 500,
        "lastUpdated": "2024-06-01T16:00:00Z"
      }
    }
    ```
*   **Error Responses:**
    - `400 Bad Request`: Invalid request parameters
    - `402 Payment Required`: Payment failed
    - `404 Not Found`: Package not found
    - See also [Standard Error Responses](#standard-error-responses).

### 4. Get Token Usage History

*   **Endpoint:** `GET /tokens/usage`
*   **Description:** Retrieves the token usage history for the authenticated user or company.
*   **Permissions Required:** `tokens:read`
*   **Query Parameters:**
    - `startDate` (optional): Filter by start date (ISO format)
    - `endDate` (optional): Filter by end date (ISO format)
    - `appType` (optional): Filter by application type
    - `feature` (optional): Filter by feature
    - `page` (optional): Page number for pagination (default: 1)
    - `limit` (optional): Items per page (default: 20)
*   **Successful Response (200 OK):**
    ```json
    {
      "usages": [
        {
          "id": "usage_123",
          "customerId": "cust_123",
          "userId": "user_456",
          "appType": "text-generation",
          "tokensUsed": 250,
          "date": "2024-05-28T15:45:00Z",
          "feature": "content-generation",
          "prompt": "Generate a blog post about...",
          "responseTokens": 200,
          "requestTokens": 50,
          "cost": 0.0075
        }
        // ... more usage records
      ],
      "totalCount": 150,
      "totalTokensUsed": 37500
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 5. Get Token Transaction History

*   **Endpoint:** `GET /tokens/history`
*   **Description:** Retrieves the token transaction history for the authenticated user or company.
*   **Permissions Required:** `tokens:read`
*   **Query Parameters:**
    - `startDate` (optional): Filter by start date (ISO format)
    - `endDate` (optional): Filter by end date (ISO format)
    - `status` (optional): Filter by transaction status
    - `page` (optional): Page number for pagination (default: 1)
    - `limit` (optional): Items per page (default: 20)
*   **Successful Response (200 OK):**
    ```json
    {
      "transactions": [
        {
          "id": "trans_789xyz",
          "customerId": "cust_123",
          "customerName": "Acme Corp",
          "type": "purchase",
          "amount": 5250,
          "balance": 6750,
          "description": "Purchase of Medium Pack",
          "timestamp": "2024-06-01T16:00:00Z",
          "expiryDate": "2025-06-01T16:00:00Z",
          "metadata": {
            "paymentId": "pay_abc123"
          }
        },
        {
          "id": "trans_456def",
          "customerId": "cust_123",
          "customerName": "Acme Corp",
          "type": "usage",
          "amount": -250,
          "balance": 6500,
          "description": "API usage - text generation",
          "timestamp": "2024-06-02T10:15:00Z",
          "metadata": {
            "operation": "text-generation",
            "apiEndpoint": "/api/text/generate",
            "sessionId": "sess_xyz789"
          }
        }
        // ... more transactions
      ],
      "totalCount": 75
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 6. Get Token Usage Statistics by Period

*   **Endpoint:** `GET /tokens/usage/stats`
*   **Description:** Retrieves token usage statistics for different time periods.
*   **Permissions Required:** `tokens:read`
*   **Query Parameters:**
    - `period` (optional): Time period ('daily', 'weekly', 'monthly', 'yearly'). Default: 'monthly'
*   **Successful Response (200 OK):**
    ```json
    {
      "2024-05": 12500,
      "2024-04": 10750,
      "2024-03": 8900,
      "2024-02": 7650,
      "2024-01": 6200
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 7. Get Token Usage Statistics by Feature

*   **Endpoint:** `GET /tokens/usage/features`
*   **Description:** Retrieves token usage statistics grouped by feature.
*   **Permissions Required:** `tokens:read`
*   **Successful Response (200 OK):**
    ```json
    {
      "text-generation": 18500,
      "image-generation": 12000,
      "chat-completion": 9750,
      "embeddings": 5600,
      "text-to-speech": 4150
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 8. Get Token Usage Statistics by App

*   **Endpoint:** `GET /tokens/usage/apps`
*   **Description:** Retrieves token usage statistics grouped by application.
*   **Permissions Required:** `tokens:read`
*   **Successful Response (200 OK):**
    ```json
    {
      "web-dashboard": 15200,
      "mobile-app": 12800,
      "api-direct": 22000
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 9. Get All Token Statistics (Admin Only)

*   **Endpoint:** `GET /admin/tokens/statistics`
*   **Description:** Retrieves comprehensive token statistics for admin dashboard.
*   **Permissions Required:** `admin:tokens:read`
*   **Query Parameters:**
    - `period` (optional): Time period ('daily', 'weekly', 'monthly', 'yearly'). Default: 'monthly'
*   **Successful Response (200 OK):**
    ```json
    {
      "totalTokensAllocated": 5000000,
      "totalTokensUsed": 1727300,
      "totalTokensPurchased": 2500000,
      "totalTokenCost": 52.49,
      "tokenUsageGrowth": 15.3,
      "tokenUsageByPeriod": [
        {
          "period": "2024-05",
          "tokensUsed": 527000
        },
        {
          "period": "2024-04",
          "tokensUsed": 456000
        }
      ],
      "tokenUsageByCustomerType": {
        "pme": 650000,
        "financial": 1077300
      },
      "averageTokensPerCustomer": 86365,
      "top10TokenConsumers": [
        {
          "customerId": "cust-2",
          "customerName": "Crédit Maritime",
          "tokensConsumed": 829650
        },
        {
          "customerId": "cust-5",
          "customerName": "MicroFinance SA",
          "tokensConsumed": 318750
        }
      ],
      "tokenUsageTrend": [
        {
          "date": "2024-05-28",
          "used": 58750,
          "cost": 1.76,
          "revenue": 4.70
        },
        {
          "date": "2024-05-27",
          "used": 52000,
          "cost": 1.56,
          "revenue": 4.16
        }
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 10. Allocate Tokens to Customer (Admin Only)

*   **Endpoint:** `POST /admin/tokens/allocate`
*   **Description:** Allocates tokens to a specific customer (admin function).
*   **Permissions Required:** `admin:tokens:write`
*   **Request Body:**
    ```json
    {
      "customerId": "cust_123",
      "amount": 1000,
      "reason": "Compensation for service outage"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "success": true,
      "newBalance": {
        "available": 7750,
        "allocated": 8250,
        "used": 500,
        "lastUpdated": "2024-06-05T11:20:00Z"
      }
    }
    ```
*   **Error Responses:**
    - `400 Bad Request`: Invalid request parameters
    - `404 Not Found`: Customer not found
    - See also [Standard Error Responses](#standard-error-responses).

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

1. Token purchases may require approval depending on the payment method and amount.
2. Token usage is tracked in real-time and deducted from the available balance.
3. Tokens may have an expiration date based on the package purchased.
4. Different features may consume different amounts of tokens based on complexity and resource usage.
5. The API supports both direct purchase and invoicing for token acquisition.
