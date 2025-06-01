# API Documentation: Finance & Subscriptions

This document outlines the API endpoints, request/response structures, and functionalities related to finance, billing, and subscription management. This includes handling financial transactions, managing subscription plans, customer subscriptions, payment processing, invoicing, and revenue reporting.

## 1. Subscription Plan Endpoints

### 1.1. List Subscription Plans
*   **Endpoint:** `GET /api/subscription-plans`
*   **Description:** Retrieves a list of all available subscription plans.
*   **Request:**
    *   Query Parameters:
        *   `customerType` (optional, string): Filter plans by target customer type (e.g., `pme`, `financial`, `individual`).
        *   `status` (optional, string): Filter by plan status (e.g., `active`, `archived`).
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "data": [
            {
              "id": "plan_pro_monthly",
              "name": "Professional Plan - Monthly",
              "description": "Full-featured plan for professionals, billed monthly.",
              "basePriceUSD": 49.99,
              "billingCycles": ["monthly", "yearly"],
              "features": ["Feature A", "Feature B", "1000 API Calls"],
              "tokenAllocation": 5000,
              "maxUsers": 5,
              "targetCustomerTypes": ["pme", "individual"],
              "status": "active",
              "createdAt": "2023-01-01T10:00:00Z",
              "updatedAt": "2023-01-01T10:00:00Z"
            }
          ]
        }
        ```

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters.
    ```json
    {
      "error": "Invalid status provided. Allowed values: active, archived."
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to list subscription plans.
*   **500 Internal Server Error:** Unexpected server error.

### 1.2. Get Subscription Plan Details
*   **Endpoint:** `GET /api/subscription-plans/{planId}`
*   **Description:** Retrieves details for a specific subscription plan.
*   **Request:**
    *   Path Parameter: `planId` (string, required).
*   **Response:**
    *   `200 OK`: (Similar structure to an item in the list response)
    *   `404 Not Found`: If the plan with the given ID does not exist.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view this plan.
*   **500 Internal Server Error:** Unexpected server error.

### 1.3. Create Subscription Plan (Admin)
*   **Endpoint:** `POST /api/subscription-plans`
*   **Description:** Creates a new subscription plan.
*   **Request Body:**
    ```json
    {
      "name": "Enterprise Plan",
      "description": "Comprehensive plan for large businesses.",
      "basePriceUSD": 199.99,
      "billingCycles": ["monthly", "yearly"],
      "features": ["All Professional Features", "Dedicated Support", "Unlimited API Calls"],
      "tokenAllocation": 50000,
      "maxUsers": 0, // 0 for unlimited
      "targetCustomerTypes": ["corporate", "financial"],
      "discountPercentage": {
        "yearly": 15 // 15% discount for annual billing
      }
    }
    ```
*   **Response:**
    *   `201 Created`: The created subscription plan object.
    *   `400 Bad Request`: Validation errors.
    *   `401 Unauthorized` / `403 Forbidden`.

**Error Responses (General):**

*   **409 Conflict:** If a plan with the same name already exists.
    ```json
    {
      "error": "Subscription plan with this name already exists."
    }
    ```
*   **422 Unprocessable Entity:** For more detailed validation errors if not covered by 400 (e.g., invalid feature list, inconsistent pricing data).
*   **500 Internal Server Error:** Unexpected server error.

### 1.4. Update Subscription Plan (Admin)
*   **Endpoint:** `PUT /api/subscription-plans/{planId}`
*   **Description:** Updates an existing subscription plan.
*   **Request Body:** Fields to update (similar to create).
*   **Response:**
    *   `200 OK`: The updated subscription plan object.
    *   `400 Bad Request` / `401 Unauthorized` / `403 Forbidden` / `404 Not Found`.

**Error Responses (General):**

*   **409 Conflict:** If renaming to a name that already exists for another plan.
*   **422 Unprocessable Entity:** For detailed validation errors.
*   **500 Internal Server Error:** Unexpected server error.

### 1.5. Delete Subscription Plan (Admin)
*   **Endpoint:** `DELETE /api/subscription-plans/{planId}`
*   **Description:** Deletes a subscription plan (consider soft delete or archiving if active subscriptions exist).
*   **Response:**
    *   `204 No Content`.
    *   `400 Bad Request` (e.g., if plan has active subscriptions and hard delete is not allowed).
    *   `401 Unauthorized` / `403 Forbidden` / `404 Not Found`.

**Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error.

## 2. Customer Subscription Endpoints

### 2.1. List Customer Subscriptions
*   **Endpoint:** `GET /api/customers/{customerId}/subscriptions` or `GET /api/subscriptions` (admin view)
*   **Description:** Retrieves subscriptions for a specific customer or all subscriptions (admin).
*   **Request:**
    *   Path Parameter: `customerId` (string, required for customer-specific view).
    *   Query Parameters (for admin view):
        *   `planId` (optional, string)
        *   `status` (optional, string: `active`, `pending_payment`, `expired`, `cancelled`, `payment_failed`)
        *   `page`, `limit`, `sortBy`, `sortOrder`
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "data": [
            {
              "id": "sub_abc123",
              "customerId": "cust_xyz789",
              "planId": "plan_pro_monthly",
              "planName": "Professional Plan - Monthly",
              "status": "active",
              "startDate": "2023-03-01T00:00:00Z",
              "endDate": "2023-04-01T00:00:00Z", // Current billing period end
              "nextBillingDate": "2023-04-01T00:00:00Z",
              "billingCycle": "monthly", // "monthly", "yearly", etc.
              "price": 49.99,
              "currency": "USD",
              "autoRenew": true,
              "createdAt": "2023-03-01T10:00:00Z"
            }
          ],
          "pagination": { /* ... */ }
        }
        ```

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to list these subscriptions.
*   **404 Not Found:** If `customerId` is provided and the customer does not exist.
*   **500 Internal Server Error:** Unexpected server error.

### 2.2. Create Customer Subscription
*   **Endpoint:** `POST /api/customers/{customerId}/subscriptions`
*   **Description:** Subscribes a customer to a plan.
*   **Request Body:**
    ```json
    {
      "planId": "plan_pro_yearly",
      "billingCycle": "yearly", // Must be one of the plan's supported billingCycles
      "paymentMethodId": "pm_card_123abc", // Optional, if immediate payment is required
      "couponCode": "SUMMER20" // Optional
    }
    ```
*   **Response:**
    *   `201 Created`: The new customer subscription object. May include initial payment transaction details.
    *   `400 Bad Request`: Invalid plan, payment issues.
    *   `401 Unauthorized` / `403 Forbidden` / `404 Not Found` (customer or plan).

**Error Responses (General):**

*   **402 Payment Required:** If immediate payment is attempted and fails.
    ```json
    {
      "error": "Payment failed: Card declined.",
      "gatewayResponse": { /* ...gateway specific error details... */ }
    }
    ```
*   **422 Unprocessable Entity:** Invalid combination of plan and billing cycle, or customer not eligible for the plan.
*   **500 Internal Server Error:** Unexpected server error.

### 2.3. Get Customer Subscription Details
*   **Endpoint:** `GET /api/customers/{customerId}/subscriptions/{subscriptionId}` or `GET /api/subscriptions/{subscriptionId}` (admin)
*   **Description:** Retrieves details for a specific customer subscription.
*   **Response:**
    *   `200 OK`: (Similar structure to an item in the list response, potentially with more details like payment history link).
    *   `401 Unauthorized` / `403 Forbidden` / `404 Not Found`.

**Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error.

### 2.4. Update Customer Subscription (e.g., Change Plan, Auto-Renew)
*   **Endpoint:** `PUT /api/customers/{customerId}/subscriptions/{subscriptionId}` or `PUT /api/subscriptions/{subscriptionId}` (admin)
*   **Description:** Updates a subscription (e.g., upgrade/downgrade plan, toggle auto-renewal).
*   **Request Body:**
    ```json
    {
      "newPlanId": "plan_enterprise_monthly", // Optional: for plan change
      "billingCycle": "monthly", // Required if newPlanId is provided
      "autoRenew": false, // Optional: to change auto-renewal status
      "prorate": true // Optional: if plan change, whether to prorate charges
    }
    ```
*   **Response:**
    *   `200 OK`: The updated customer subscription object. May include proration details or new payment transaction if applicable.
    *   `400 Bad Request`.
    *   `401 Unauthorized` / `403 Forbidden` / `404 Not Found`.

**Error Responses (General):**

*   **402 Payment Required:** If plan upgrade requires immediate payment and it fails.
*   **422 Unprocessable Entity:** Invalid plan change (e.g., downgrading with proration issues not handled, changing to an invalid plan type for the customer).
*   **500 Internal Server Error:** Unexpected server error.

### 2.5. Cancel Customer Subscription
*   **Endpoint:** `POST /api/customers/{customerId}/subscriptions/{subscriptionId}/cancel` or `POST /api/subscriptions/{subscriptionId}/cancel` (admin)
*   **Description:** Cancels a subscription, usually at the end of the current billing period.
*   **Request Body:**
    ```json
    {
      "reason": "Customer request", // Optional
      "cancelImmediately": false // Optional, defaults to false (cancel at period end)
    }
    ```
*   **Response:**
    *   `200 OK`: The updated customer subscription object with status `cancelled` and updated `endDate`.
    *   `400 Bad Request`.
    *   `401 Unauthorized` / `403 Forbidden` / `404 Not Found`.

**Error Responses (General):**

*   **409 Conflict:** If the subscription is already cancelled or in a state that doesn't allow cancellation.
*   **500 Internal Server Error:** Unexpected server error.

### 2.6. Reactivate Customer Subscription
*   **Endpoint:** `POST /api/customers/{customerId}/subscriptions/{subscriptionId}/reactivate` or `POST /api/subscriptions/{subscriptionId}/reactivate` (admin)
*   **Description:** Reactivates a previously cancelled (but not yet ended) or expired subscription.
*   **Response:**
    *   `200 OK`: The updated customer subscription object with status `active`.
    *   `400 Bad Request`: If subscription cannot be reactivated.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Subscription or customer not found.
*   **409 Conflict:** If the subscription is not in a state that allows reactivation (e.g., already active, or permanently terminated).
    ```json
    {
      "error": "Subscription cannot be reactivated in its current state."
    }
    ```
*   **500 Internal Server Error:** Unexpected server error.

## 3. Payment & Transaction Endpoints

### 3.1. List Payments/Transactions
*   **Endpoint:** `GET /api/finance/payments` or `GET /api/finance/transactions`
*   **Description:** Retrieves a list of payments or financial transactions.
*   **Request:**
    *   Query Parameters:
        *   `customerId` (optional, string)
        *   `subscriptionId` (optional, string)
        *   `invoiceId` (optional, string)
        *   `status` (optional, string: `pending`, `completed`, `failed`, `refunded`, `verified`, `rejected`)
        *   `method` (optional, string: `card`, `bank_transfer`, `paypal`, `manual`)
        *   `dateFrom`, `dateTo` (optional, date strings)
        *   `page`, `limit`, `sortBy`, `sortOrder`
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "data": [
            {
              "id": "txn_123",
              "type": "payment", // "payment", "refund", "adjustment"
              "customerId": "cust_xyz789",
              "subscriptionId": "sub_abc123",
              "invoiceId": "inv_def456",
              "amount": 49.99,
              "currency": "USD",
              "status": "completed",
              "method": "card",
              "gatewayReference": "ch_1KGnZv2eZvKYlo2CiHqXGqX0",
              "transactionDate": "2023-03-01T10:05:00Z",
              "description": "Payment for Professional Plan - March",
              "createdAt": "2023-03-01T10:05:00Z"
            }
          ],
          "pagination": { /* ... */ }
        }
        ```

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **500 Internal Server Error:** Unexpected server error.

### 3.2. Get Payment/Transaction Details
*   **Endpoint:** `GET /api/finance/payments/{transactionId}` or `GET /api/finance/transactions/{transactionId}`
*   **Response:**
    *   `200 OK`: (Similar structure to an item in the list response).
    *   `404 Not Found`.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **500 Internal Server Error:** Unexpected server error.

### 3.3. Process Payment (e.g., for Invoice or Subscription Renewal)
*   **Endpoint:** `POST /api/finance/payments`
*   **Description:** Initiates a payment process. This could be for an invoice, a new subscription, or a renewal.
*   **Request Body:**
    ```json
    {
      "customerId": "cust_xyz789",
      "amount": 49.99,
      "currency": "USD",
      "paymentMethodId": "pm_card_123abc", // ID of a stored payment method or new card details
      "description": "Manual payment for INV-001",
      "invoiceId": "inv_def456", // Optional
      "subscriptionId": "sub_abc123" // Optional, for renewal
    }
    ```
*   **Response:**
    *   `201 Created`: The created payment transaction object, status might be `pending` or `completed` depending on gateway.
    *   `400 Bad Request`: Payment failed, invalid details.
    *   `402 Payment Required`: If payment fails due to card decline etc. (more specific error from gateway).

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Customer, invoice, or subscription not found.
*   **422 Unprocessable Entity:** Invalid payment method ID or other data inconsistencies.
*   **500 Internal Server Error:** Unexpected server error (e.g., payment gateway communication failure).

### 3.4. Record Manual Payment (Admin)
*   **Endpoint:** `POST /api/finance/payments/manual`
*   **Description:** Allows an admin to record an offline payment (e.g., bank transfer, check).
*   **Request Body:**
    ```json
    {
      "customerId": "cust_abc001",
      "amount": 100.00,
      "currency": "USD",
      "method": "bank_transfer",
      "transactionReference": "BT_REF_00123",
      "paidAt": "2023-07-15T10:00:00Z",
      "invoiceId": "inv_xyz789", // Optional
      "description": "Received via wire transfer.",
      "proofType": "bank_transfer_receipt",
      "proofUrl": "https://example.com/proofs/bt001.pdf" // Optional
    }
    ```
*   **Response:**
    *   `201 Created`: The created payment transaction with status `pending` (awaiting verification) or `completed`.
    *   `400 Bad Request`.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Customer or invoice not found.
*   **422 Unprocessable Entity:** Invalid data (e.g., amount, currency, date format).
*   **500 Internal Server Error:** Unexpected server error.

### 3.5. Verify/Update Manual Payment (Admin)
*   **Endpoint:** `PUT /api/finance/payments/manual/{transactionId}/status`
*   **Description:** Allows an admin to verify or update the status of a manual payment.
*   **Request Body:**
    ```json
    {
      "status": "verified", // "verified", "rejected"
      "notes": "Bank statement confirmed.", // Optional
      "verifiedBy": "admin_user_id" // Automatically logged or passed
    }
    ```
*   **Response:**
    *   `200 OK`: The updated payment transaction.
    *   `400 Bad Request` / `404 Not Found`.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **422 Unprocessable Entity:** Invalid status transition or missing required fields for verification.
*   **500 Internal Server Error:** Unexpected server error.

### 3.6. Issue Refund
*   **Endpoint:** `POST /api/finance/payments/{transactionId}/refund`
*   **Description:** Issues a full or partial refund for a completed payment.
*   **Request Body:**
    ```json
    {
      "amount": 20.00, // Optional, for partial refund. If absent, full refund.
      "reason": "Customer dissatisfaction", // Optional
      "notes": "Refund processed by admin X." // Optional
    }
    ```
*   **Response:**
    *   `201 Created`: A new refund transaction object, and the original payment transaction might be updated.
    *   `400 Bad Request`: Cannot refund, invalid amount.
    *   `402 Payment Required`: If refund fails at gateway.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Original transaction not found.
*   **422 Unprocessable Entity:** Refund amount exceeds original payment, or transaction not in a refundable state.
    ```json
    {
      "error": "Refund amount cannot exceed the original transaction amount."
    }
    ```
*   **500 Internal Server Error:** Unexpected server error (e.g., payment gateway communication failure).

## 4. Invoice Endpoints

### 4.1. List Invoices
*   **Endpoint:** `GET /api/finance/invoices`
*   **Description:** Retrieves a list of invoices.
*   **Request:**
    *   Query Parameters: `customerId`, `subscriptionId`, `status` (`draft`, `sent`, `paid`, `overdue`, `void`, `uncollectible`), `dateFrom`, `dateTo`, `page`, `limit`, etc.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "data": [
            {
              "id": "inv_def456",
              "invoiceNumber": "INV-2023-0078",
              "customerId": "cust_xyz789",
              "subscriptionId": "sub_abc123",
              "status": "paid",
              "issueDate": "2023-03-01",
              "dueDate": "2023-03-15",
              "paidDate": "2023-03-05",
              "amountDue": 49.99,
              "amountPaid": 49.99,
              "currency": "USD",
              "createdAt": "2023-03-01T09:00:00Z"
            }
          ],
          "pagination": { /* ... */ }
        }
        ```

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **500 Internal Server Error:** Unexpected server error.

### 4.2. Get Invoice Details
*   **Endpoint:** `GET /api/finance/invoices/{invoiceId}`
*   **Response:**
    *   `200 OK`: Detailed invoice object including line items.
        ```json
        {
          "id": "inv_def456",
          "invoiceNumber": "INV-2023-0078",
          // ... other fields from list
          "lineItems": [
            {
              "id": "li_1",
              "description": "Professional Plan - Monthly (March 2023)",
              "quantity": 1,
              "unitPrice": 49.99,
              "amount": 49.99
            }
          ],
          "subtotal": 49.99,
          "taxAmount": 0.00,
          "totalAmount": 49.99,
          "notes": "Thank you for your business!",
          "downloadUrl": "/api/finance/invoices/inv_def456/pdf"
        }
        ```
    *   `404 Not Found`.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **500 Internal Server Error:** Unexpected server error.

### 4.3. Create Invoice (Manual or for Off-Cycle Charges)
*   **Endpoint:** `POST /api/finance/invoices`
*   **Description:** Creates a new invoice.
*   **Request Body:**
    ```json
    {
      "customerId": "cust_xyz789",
      "currency": "USD",
      "dueDate": "2023-08-15",
      "lineItems": [
        { "description": "Consulting Services", "quantity": 5, "unitPrice": 100.00 },
        { "description": "Setup Fee", "quantity": 1, "unitPrice": 50.00 }
      ],
      "notes": "Payment due upon receipt.",
      "status": "draft" // Optional, defaults to draft or sent based on system settings
    }
    ```
*   **Response:**
    *   `201 Created`: The newly created invoice object.
    *   `400 Bad Request`.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Customer not found.
*   **422 Unprocessable Entity:** Invalid line items or other data inconsistencies.
*   **500 Internal Server Error:** Unexpected server error.

### 4.4. Update Invoice (e.g., Add Line Item to Draft, Change Status)
*   **Endpoint:** `PUT /api/finance/invoices/{invoiceId}`
*   **Description:** Updates an invoice (typically only drafts or specific fields on other statuses).
*   **Response:**
    *   `200 OK`: The updated invoice object.

**Error Responses (General):**

*   **400 Bad Request:** Invalid data for update.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Invoice not found.
*   **409 Conflict:** If trying to update an invoice that is not in a modifiable state (e.g., already paid or voided).
*   **422 Unprocessable Entity:** Invalid line items or status transition.
*   **500 Internal Server Error:** Unexpected server error.

### 4.5. Send Invoice
*   **Endpoint:** `POST /api/finance/invoices/{invoiceId}/send`
*   **Description:** Marks an invoice as sent and typically emails it to the customer.
*   **Response:**
    *   `200 OK`: Invoice object with status `sent`.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Invoice not found.
*   **409 Conflict:** Invoice not in a state that can be sent (e.g., already sent, paid, voided).
*   **500 Internal Server Error:** Unexpected server error (e.g., email sending failure).

### 4.6. Mark Invoice as Paid (Manual)
*   **Endpoint:** `POST /api/finance/invoices/{invoiceId}/pay`
*   **Description:** Manually marks an invoice as paid.
*   **Request Body:**
    ```json
    {
      "paymentDate": "2023-07-20",
      "paymentMethod": "bank_transfer",
      "transactionReference": "MANUAL_PAY_REF_001"
    }
    ```
*   **Response:**
    *   `200 OK`: Invoice object with status `paid`.

**Error Responses (General):**

*   **400 Bad Request:** Invalid request body data.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Invoice not found.
*   **409 Conflict:** Invoice not in a state that can be marked as paid (e.g., already paid, voided).
*   **500 Internal Server Error:** Unexpected server error.

### 4.7. Void Invoice
*   **Endpoint:** `POST /api/finance/invoices/{invoiceId}/void`
*   **Description:** Voids an invoice.
*   **Response:**
    *   `200 OK`: Invoice object with status `void`.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Invoice not found.
*   **409 Conflict:** Invoice not in a state that can be voided (e.g., already paid and refund required, or already voided).
*   **500 Internal Server Error:** Unexpected server error.

## 5. Token Management Endpoints (If applicable)

### 5.1. List Token Packages
*   **Endpoint:** `GET /api/tokens/packages`
*   **Response:** `200 OK` with list of purchasable token packages.

**Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error.

### 5.2. Purchase Tokens
*   **Endpoint:** `POST /api/tokens/purchase`
*   **Request Body:** `{ "packageId": "pkg_10k_tokens", "customerId": "cust_xyz789", "paymentMethodId": "pm_card_123" }`
*   **Response:** `201 Created` with token transaction details.

**Error Responses (General):**

*   **400 Bad Request:** Invalid package ID or payment method.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **402 Payment Required:** Payment failed.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Customer or package not found.
*   **500 Internal Server Error:** Unexpected server error.

### 5.3. Get Customer Token Balance
*   **Endpoint:** `GET /api/customers/{customerId}/tokens/balance`
*   **Response:** `200 OK` with current token balance.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Customer not found.
*   **500 Internal Server Error:** Unexpected server error.

### 5.4. List Token Transactions
*   **Endpoint:** `GET /api/customers/{customerId}/tokens/transactions`
*   **Response:** `200 OK` with paginated list of token transactions (purchases, usage).

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Customer not found.
*   **500 Internal Server Error:** Unexpected server error.

### 5.5. Add/Adjust Tokens (Admin)
*   **Endpoint:** `POST /api/admin/customers/{customerId}/tokens/adjust`
*   **Request Body:** `{ "amount": 1000, "reason": "Manual adjustment by admin", "type": "credit" }` (`credit` or `debit`)
*   **Response:** `200 OK` with new token balance and transaction log.

**Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., non-numeric amount, invalid type).
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **404 Not Found:** Customer not found.
*   **422 Unprocessable Entity:** Adjustment would result in a negative balance if not allowed.
*   **500 Internal Server Error:** Unexpected server error.

## 6. Financial Reporting & Settings

### 6.1. Get Revenue Statistics
*   **Endpoint:** `GET /api/admin/statistics/revenue`
*   **Request:** Query parameters: `period` (`daily`, `weekly`, `monthly`, `yearly`), `startDate`, `endDate`.
*   **Response:** `200 OK` with revenue data (e.g., total revenue, revenue by plan, MRR, ARR).

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters (e.g., invalid period).
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **500 Internal Server Error:** Unexpected server error.

### 6.2. Get Billing Settings (Admin)
*   **Endpoint:** `GET /api/settings/billing`
*   **Response:** `200 OK` with current billing settings (default currency, tax rates, invoice notes, payment gateways configured).

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **500 Internal Server Error:** Unexpected server error.

### 6.3. Update Billing Settings (Admin)
*   **Endpoint:** `PUT /api/settings/billing`
*   **Request Body:** Billing settings object.
*   **Response:** `200 OK` with updated settings.

**Error Responses (General):**

*   **400 Bad Request:** Invalid settings data.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission.
*   **422 Unprocessable Entity:** Inconsistent or invalid settings values.
*   **500 Internal Server Error:** Unexpected server error.

## 7. Key Data Structures

*   **SubscriptionPlan:** As defined in 1.1.
*   **CustomerSubscription:** As defined in 2.1.
*   **PaymentTransaction:** As defined in 3.1.
*   **Invoice:** As defined in 4.1 and 4.2 (with line items).
*   **TokenPackage:** `{ "id", "name", "description", "tokenAmount", "priceUSD", "currency" }`
*   **TokenTransaction:** `{ "id", "customerId", "type" ("purchase", "usage", "adjustment"), "amount" (positive for purchase/credit, negative for usage/debit), "balanceAfter", "relatedPackageId", "relatedUsageRecordId", "transactionDate", "notes" }`
*   **BillingSettings:** `{ "defaultCurrency", "enabledPaymentGateways" (e.g., ["stripe", "paypal"]), "taxSettings" ({ type, rate, region }), "invoiceTemplateConfig", "dunningRules" }`

This documentation covers the core aspects of finance, billing, and subscription management. Robust error handling, clear status transitions, and comprehensive logging are crucial for these systems.
