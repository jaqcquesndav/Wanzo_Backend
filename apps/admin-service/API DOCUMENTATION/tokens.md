# API Documentation: Token Management

This document outlines the API endpoints for managing tokens within the AdminKS system. Tokens are used to access various features and services.

## Base URL

All API endpoints are relative to the base URL: `/api`

## Authentication

All endpoints require Bearer Token authentication.

## Endpoints

### 1. Get Token Balance

*   **Endpoint:** `GET /tokens/balance`
*   **Description:** Retrieves the current token balance for the authenticated user (or company).
*   **Permissions Required:** `tokens:read` (or user-specific access)
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
*   **Permissions Required:** `tokens:read` (or public access)
*   **Successful Response (200 OK):**
    ```json
    {
      "packages": [
        {
          "id": "pkg_small_1000",
          "name": "Small Pack",
          "description": "1,000 Tokens",
          "tokens": 1000,
          "price": 10.00,
          "currency": "USD",
          "features": ["Basic API Access", "Limited AI Usage"],
          "isPopular": false
        },
        {
          "id": "pkg_medium_5000",
          "name": "Medium Pack",
          "description": "5,000 Tokens + 5% Bonus",
          "tokens": 5250,
          "price": 45.00,
          "currency": "USD",
          "features": ["Standard API Access", "Moderate AI Usage", "Priority Support"],
          "isPopular": true
        }
        // ... more packages
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 3. Purchase Tokens

*   **Endpoint:** `POST /tokens/purchase`
*   **Description:** Initiates a token purchase. If `proofDocument` is provided, it's uploaded to a storage service (e.g., Cloudinary) first, and its URL is sent to the backend.
*   **Permissions Required:** `tokens:purchase` (or user-specific access)
*   **Request Body (application/json or multipart/form-data if `proofDocument` is included):**
    ```json
    {
      "packageId": "pkg_medium_5000",
      "paymentMethod": "credit_card", // e.g., "credit_card", "bank_transfer", "paypal"
      "transactionReference": "txn_123abc456def", // Optional, for bank transfers etc.
      // "proofDocument": (File object if using multipart/form-data)
      // If proofDocument was uploaded, backend expects:
      // "proofDocumentUrl": "https://res.cloudinary.com/.../image.jpg",
      // "proofDocumentPublicId": "payment-proofs/..."
    }
    ```
*   **Successful Response (200 OK or 201 Created):**
    ```json
    {
      "transaction": {
        "id": "trans_789xyz",
        "packageId": "pkg_medium_5000",
        "tokensPurchased": 5250,
        "amountPaid": 45.00,
        "currency": "USD",
        "paymentMethod": "credit_card",
        "status": "completed", // or "pending_verification" if proof is required
        "transactionDate": "2024-06-01T16:00:00Z",
        "proofDocumentUrl": null // or URL if provided
      },
      "newBalance": {
        "available": 6750, // old balance + purchased tokens
        "allocated": 7250,
        "used": 500,
        "lastUpdated": "2024-06-01T16:00:00Z"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid package ID, payment method, or missing required fields.
    *   `402 Payment Required`: If payment fails.
    *   See [Standard Error Responses](#standard-error-responses).

### 4. Get Token Usage History

*   **Endpoint:** `GET /tokens/usage`
*   **Description:** Retrieves the history of token usage for the authenticated user/company, with optional filtering.
*   **Permissions Required:** `tokens:read_usage` (or user-specific access)
*   **Query Parameters:**
    *   `startDate` (string, optional): ISO 8601 date (e.g., "2024-01-01").
    *   `endDate` (string, optional): ISO 8601 date.
    *   `appType` (string, optional): Filter by application type (e.g., "ai_assistant", "data_analysis").
    *   `feature` (string, optional): Filter by specific feature used (e.g., "text_generation", "report_generation").
    *   `page` (number, optional, default: 1).
    *   `limit` (number, optional, default: 20).
*   **Successful Response (200 OK):**
    ```json
    {
      "usages": [
        {
          "id": "usage_abc123",
          "timestamp": "2024-05-30T10:00:00Z",
          "tokensUsed": 50,
          "appType": "ai_assistant",
          "feature": "text_generation",
          "description": "Generated marketing copy for product X.",
          "userId": "user_def456"
        },
        {
          "id": "usage_def456",
          "timestamp": "2024-05-29T15:20:00Z",
          "tokensUsed": 120,
          "appType": "data_analysis",
          "feature": "trend_prediction",
          "description": "Analyzed sales data for Q1 2024.",
          "userId": "user_def456"
        }
        // ... more usage records
      ],
      "totalCount": 57,
      "totalTokensUsed": 2350
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 5. Get Token Transaction History

*   **Endpoint:** `GET /tokens/history`
*   **Description:** Retrieves the history of token transactions (purchases, allocations) for the authenticated user/company.
*   **Permissions Required:** `tokens:read_transactions` (or user-specific access)
*   **Query Parameters:**
    *   `startDate` (string, optional): ISO 8601 date.
    *   `endDate` (string, optional): ISO 8601 date.
    *   `status` (string, optional): Filter by transaction status (e.g., "completed", "pending", "failed").
    *   `page` (number, optional, default: 1).
    *   `limit` (number, optional, default: 20).
*   **Successful Response (200 OK):**
    ```json
    {
      "transactions": [
        {
          "id": "trans_789xyz",
          "packageId": "pkg_medium_5000",
          "tokensPurchased": 5250,
          "amountPaid": 45.00,
          "currency": "USD",
          "paymentMethod": "credit_card",
          "status": "completed",
          "transactionDate": "2024-06-01T16:00:00Z",
          "proofDocumentUrl": null
        },
        {
          "id": "trans_alloc_001",
          "packageId": null,
          "tokensPurchased": 100, // or tokensAllocated
          "amountPaid": 0.00,
          "currency": "USD",
          "paymentMethod": "allocation",
          "status": "completed",
          "transactionDate": "2024-05-15T09:00:00Z",
          "notes": "Promotional bonus"
        }
        // ... more transaction records
      ],
      "totalCount": 12
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 6. Get Token Usage Statistics by Period

*   **Endpoint:** `GET /tokens/usage/stats`
*   **Description:** Retrieves token usage statistics grouped by a specified period.
*   **Permissions Required:** `tokens:read_stats`
*   **Query Parameters:**
    *   `period` (string, optional, default: 'monthly'): Time period to group stats by. Values: 'daily', 'weekly', 'monthly', 'yearly'.
*   **Successful Response (200 OK):**
    ```json
    // Example for period = 'monthly'
    {
      "2024-03": 1200,
      "2024-04": 1500,
      "2024-05": 2350
    }
    // Example for period = 'daily'
    {
      "2024-05-29": 300,
      "2024-05-30": 250,
      "2024-06-01": 180
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 7. Get Token Usage Statistics by Feature

*   **Endpoint:** `GET /tokens/usage/features`
*   **Description:** Retrieves token usage statistics grouped by feature.
*   **Permissions Required:** `tokens:read_stats`
*   **Successful Response (200 OK):**
    ```json
    {
      "text_generation": 5500,
      "image_analysis": 3200,
      "data_export": 1200,
      "report_generation": 4500
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 8. Get Token Usage Statistics by Application

*   **Endpoint:** `GET /tokens/usage/apps`
*   **Description:** Retrieves token usage statistics grouped by application.
*   **Permissions Required:** `tokens:read_stats`
*   **Successful Response (200 OK):**
    ```json
    {
      "ai_assistant_v1": 8000,
      "customer_support_bot": 4200,
      "internal_reporting_tool": 2200
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 9. Get All Token Statistics (Admin Only)

*   **Endpoint:** `GET /admin/tokens/statistics`
*   **Description:** Retrieves comprehensive token statistics. (Admin access required)
*   **Permissions Required:** `admin:tokens:read_all_stats`
*   **Query Parameters:**
    *   `period` (string, optional, default: 'monthly'): Time period for some stats. Values: 'daily', 'weekly', 'monthly', 'yearly'.
*   **Successful Response (200 OK):**
    ```json
    {
      "totalTokensPurchased": 100000,
      "totalTokensUsed": 65000,
      "totalTokensAvailable": 35000,
      "totalRevenue": 4500.00,
      "currency": "USD",
      "activeSubscriptionsWithTokens": 150,
      "averageTokensUsedPerUser": {
        "daily": 25,
        "weekly": 150,
        "monthly": 600
      },
      "usageByPeriod": {
        "2024-03": 12000,
        "2024-04": 25000,
        "2024-05": 28000
      },
      "topFeaturesByUsage": {
        "text_generation": 30000,
        "report_generation": 20000
      },
      "topAppsByUsage": {
        "ai_assistant_v1": 40000,
        "customer_support_bot": 15000
      }
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 10. Allocate Tokens to Customer (Admin Only)

*   **Endpoint:** `POST /admin/tokens/allocate`
*   **Description:** Allows an administrator to allocate tokens directly to a customer.
*   **Permissions Required:** `admin:tokens:allocate`
*   **Request Body (application/json):**
    ```json
    {
      "customerId": "cust_abc123",
      "amount": 500, // Number of tokens to allocate
      "reason": "Customer loyalty bonus for Q1 2024"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "success": true,
      "newBalance": {
        "customerId": "cust_abc123", // Or could be the general balance if not customer-specific
        "available": 2000, // Customer's new available balance
        "allocated": 2500,
        "used": 500,
        "lastUpdated": "2024-06-01T17:00:00Z"
      },
      "message": "Successfully allocated 500 tokens to cust_abc123."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid customer ID, amount, or missing reason.
    *   `404 Not Found`: If the customer ID does not exist.
    *   See [Standard Error Responses](#standard-error-responses).

## Data Models

### TokenPackage

| Field         | Type     | Description                                      | Example                                                              |
|---------------|----------|--------------------------------------------------|----------------------------------------------------------------------|
| `id`          | string   | Unique identifier for the package.               | `"pkg_medium_5000"`                                                  |
| `name`        | string   | Name of the package.                             | `"Medium Pack"`                                                      |
| `description` | string   | Description of the package.                      | `"5,000 Tokens + 5% Bonus"`                                          |
| `tokens`      | number   | Number of tokens included.                       | `5250`                                                               |
| `price`       | number   | Price of the package.                            | `45.00`                                                              |
| `currency`    | string   | Currency code (e.g., USD, EUR).                  | `"USD"`                                                              |
| `features`    | string[] | List of features or benefits included.           | `["Standard API Access", "Moderate AI Usage", "Priority Support"]` |
| `isPopular`   | boolean  | Whether this package is marked as popular.       | `true`                                                               |

### TokenTransaction

| Field                | Type   | Description                                                              | Example                               |
|----------------------|--------|--------------------------------------------------------------------------|---------------------------------------|
| `id`                 | string | Unique identifier for the transaction.                                   | `"trans_789xyz"`                      |
| `packageId`          | string | ID of the package purchased (if applicable).                             | `"pkg_medium_5000"`                   |
| `tokensPurchased`    | number | Number of tokens acquired in this transaction.                           | `5250`                                |
| `amountPaid`         | number | Amount paid for the tokens.                                              | `45.00`                               |
| `currency`           | string | Currency of the transaction.                                             | `"USD"`                               |
| `paymentMethod`      | string | Method of payment (e.g., "credit_card", "bank_transfer", "allocation"). | `"credit_card"`                       |
| `status`             | string | Status of the transaction (e.g., "completed", "pending", "failed").      | `"completed"`                         |
| `transactionDate`    | string | ISO 8601 timestamp of the transaction.                                   | `"2024-06-01T16:00:00Z"`              |
| `proofDocumentUrl`   | string | URL of the payment proof document (if applicable).                       | `null` or `"https://.../proof.pdf"` |
| `notes`              | string | Additional notes for the transaction (e.g., reason for allocation).      | `"Promotional bonus"`                 |

### TokenUsage

| Field         | Type   | Description                                                     | Example                                       |
|---------------|--------|-----------------------------------------------------------------|-----------------------------------------------|
| `id`          | string | Unique identifier for the usage record.                         | `"usage_abc123"`                              |
| `timestamp`   | string | ISO 8601 timestamp of when the tokens were used.                | `"2024-05-30T10:00:00Z"`                      |
| `tokensUsed`  | number | Number of tokens consumed in this instance.                     | `50`                                          |
| `appType`     | string | Type of application that consumed the tokens.                   | `"ai_assistant"`                              |
| `feature`     | string | Specific feature that consumed the tokens.                      | `"text_generation"`                           |
| `description` | string | Optional description of the usage.                              | `"Generated marketing copy for product X."`   |
| `userId`      | string | ID of the user who performed the action consuming the tokens.   | `"user_def456"`                               |

### TokenBalanceResponse

| Field         | Type   | Description                               | Example                 |
|---------------|--------|-------------------------------------------|-------------------------|
| `available`   | number | Number of tokens currently available.     | `1500`                  |
| `allocated`   | number | Total tokens allocated (purchased/given). | `2000`                  |
| `used`        | number | Total tokens used so far.                 | `500`                   |
| `lastUpdated` | string | ISO 8601 timestamp of last balance update. | `"2024-05-28T10:30:00Z"` |

### TokenStatistics (Admin)

| Field                           | Type            | Description                                                                 | Example (values illustrative)                                     |
|---------------------------------|-----------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------|
| `totalTokensPurchased`          | number          | Total tokens ever purchased across the system.                              | `100000`                                                          |
| `totalTokensUsed`               | number          | Total tokens ever used across the system.                                   | `65000`                                                           |
| `totalTokensAvailable`          | number          | Total tokens currently available across all users/companies.                | `35000`                                                           |
| `totalRevenue`                  | number          | Total revenue generated from token sales.                                   | `4500.00`                                                         |
| `currency`                      | string          | Currency for the total revenue.                                             | `"USD"`                                                           |
| `activeSubscriptionsWithTokens` | number          | Number of active subscriptions that utilize tokens.                         | `150`                                                             |
| `averageTokensUsedPerUser`      | object          | Average token usage per user for different periods.                         | `{"daily": 25, "weekly": 150, "monthly": 600}`                  |
| `usageByPeriod`                 | object          | Token usage grouped by the specified period (e.g., month: count).           | `{"2024-03": 12000, "2024-04": 25000, "2024-05": 28000}`         |
| `topFeaturesByUsage`            | object          | Top features by token consumption (feature: count).                         | `{"text_generation": 30000, "report_generation": 20000}`        |
| `topAppsByUsage`                | object          | Top applications by token consumption (app: count).                         | `{"ai_assistant_v1": 40000, "customer_support_bot": 15000}` |

## Standard Error Responses

### 400 Bad Request

*   **Description:** The server could not understand the request due to invalid syntax or missing parameters.
*   **Response Body:**
    ```json
    {
      "error": "Bad Request",
      "message": "Invalid input data: [Details about the error]",
      "statusCode": 400
    }
    ```

### 401 Unauthorized

*   **Description:** The request requires user authentication, but the authentication credentials were missing or invalid.
*   **Response Body:**
    ```json
    {
      "error": "Unauthorized",
      "message": "Authentication token is missing or invalid.",
      "statusCode": 401
    }
    ```

### 402 Payment Required

*   **Description:** Payment is required to proceed with the request (e.g., token purchase failed).
*   **Response Body:**
    ```json
    {
      "error": "Payment Required",
      "message": "Payment processing failed. Please check your payment details or try another method.",
      "statusCode": 402
    }
    ```

### 403 Forbidden

*   **Description:** The authenticated user does not have the necessary permissions to perform the requested action.
*   **Response Body:**
    ```json
    {
      "error": "Forbidden",
      "message": "You do not have permission to access this resource.",
      "statusCode": 403
    }
    ```

### 404 Not Found

*   **Description:** The requested resource (e.g., package, customer) could not be found.
*   **Response Body:**
    ```json
    {
      "error": "Not Found",
      "message": "The requested resource was not found.",
      "statusCode": 404
    }
    ```

### 500 Internal Server Error

*   **Description:** An unexpected error occurred on the server.
*   **Response Body:**
    ```json
    {
      "error": "Internal Server Error",
      "message": "An unexpected error occurred. Please try again later.",
      "statusCode": 500
    }
    ```
