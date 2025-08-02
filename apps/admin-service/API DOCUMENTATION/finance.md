# API Documentation: Finance & Subscriptions

This document outlines the API endpoints, request/response structures, and functionalities related to finance, billing, and subscription management. This includes handling financial transactions, managing subscription plans, customer subscriptions, payment processing, invoicing, and revenue reporting.

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

## 1. Subscription Plan Endpoints

### 1.1. List Subscription Plans
*   **HTTP Method:** `GET`
*   **URL:** `/api/finance/subscriptions/plans`
*   **Description:** Retrieves a list of all available subscription plans.
*   **Response:**
    *   `200 OK`:
        ```json
        [
          {
            "id": "plan_pro_monthly",
            "name": "Professional Plan - Monthly",
            "description": "Full-featured plan for professionals, billed monthly.",
            "price": 49.99,
            "currency": "USD",
            "billingCycle": "monthly",
            "features": ["Feature A", "Feature B", "1000 API Calls"],
            "isActive": true,
            "trialPeriodDays": 14,
            "metadata": {
              "maxUsers": 5,
              "storageLimit": "50GB"
            }
          },
          {
            "id": "plan_pro_annually",
            "name": "Professional Plan - Annual",
            "description": "Full-featured plan for professionals, billed annually.",
            "price": 499.99,
            "currency": "USD",
            "billingCycle": "annually",
            "features": ["Feature A", "Feature B", "1000 API Calls"],
            "isActive": true,
            "trialPeriodDays": 14,
            "metadata": {
              "maxUsers": 5,
              "storageLimit": "50GB"
            }
          }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to list subscription plans.
    *   `500 Internal Server Error`: Unexpected server error.

## 1.2. Standardized Finance Service Endpoints

### 1.2.1. Get Financial Transactions
*   **HTTP Method:** `GET`
*   **URL:** `/api/finance/transactions`
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
*   **URL:** `/api/finance/payments`
*   **Description:** Retrieves paginated payments with filtering options.
*   **Query Parameters:** Same as transactions
*   **Response:** `PaginatedResponse<Payment>`

### 1.2.3. Get Invoices
*   **HTTP Method:** `GET`
*   **URL:** `/api/finance/invoices`
*   **Description:** Retrieves paginated invoices with filtering options.
*   **Query Parameters:** Same as transactions
*   **Response:** `PaginatedResponse<Invoice>`

### 1.2.4. Get Subscriptions
*   **HTTP Method:** `GET`
*   **URL:** `/api/finance/subscriptions`
*   **Description:** Retrieves paginated subscriptions with filtering options.
*   **Query Parameters:** Same as transactions
*   **Response:** `PaginatedResponse<Subscription>`

### 1.2.5. Get Token Transactions
*   **HTTP Method:** `GET`
*   **URL:** `/api/finance/tokens/transactions`
*   **Description:** Retrieves paginated token transactions with filtering options.
*   **Query Parameters:** Same as transactions
*   **Response:** `PaginatedResponse<TokenTransaction>`

## 2. Subscription Endpoints

### 2.1. List Subscriptions
*   **HTTP Method:** `GET`
*   **URL:** `/api/finance/subscriptions`
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
*   **URL:** `/api/finance/subscriptions/{subscriptionId}`
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
*   **URL:** `/api/finance/subscriptions`
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
*   **URL:** `/api/finance/subscriptions/{subscriptionId}`
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
*   **URL:** `/api/finance/subscriptions/{subscriptionId}/cancel`
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
*   **URL:** `/api/finance/invoices`
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
*   **URL:** `/api/finance/invoices/{invoiceId}`
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
*   **URL:** `/api/finance/invoices`
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
*   **URL:** `/api/finance/invoices/{invoiceId}`
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
*   **URL:** `/api/finance/invoices/{invoiceId}`
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
*   **URL:** `/api/finance/invoices/{invoiceId}/send-reminder`
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
*   **URL:** `/api/finance/payments`
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
*   **URL:** `/api/finance/payments/{paymentId}`
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
*   **URL:** `/api/finance/payments/manual`
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
*   **URL:** `/api/finance/payments/verify`
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
*   **URL:** `/api/finance/transactions`
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
*   **URL:** `/api/finance/transactions/{transactionId}`
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
*   **URL:** `/api/finance/transactions`
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
*   **URL:** `/api/finance/tokens/packages`
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
*   **URL:** `/api/finance/tokens/transactions`
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
*   **URL:** `/api/finance/tokens/balance/{customerId}`
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
*   **URL:** `/api/finance/summary`
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

### 8.4. Subscription
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'annually' | 'quarterly' | 'biennially' | 'one_time';
  features: string[];
  isActive: boolean;
  trialPeriodDays?: number;
  metadata?: Record<string, unknown>;
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
  metadata?: Record<string, unknown>;
}
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
