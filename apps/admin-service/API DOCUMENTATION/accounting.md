# API Documentation: Accounting Service Integration

This document outlines the Admin Service integration with the Accounting Service for advanced financial operations, including accounting entries, manual adjustments, financial reports, payment reconciliation, and audit trails.

## Overview

The Admin Service communicates with the Accounting Service via HTTP REST API using service-to-service authentication. All accounting operations are restricted to admin users with `SUPER_ADMIN`, `FINANCIAL_ADMIN`, or `CTO` roles.

**Base URL:** `/api/admin/accounting`
**Authentication:** JWT token with required roles
**Service Communication:** HTTP with service authentication headers

---

## 1. Accounting Entries

### 1.1. Get Accounting Entries
*   **HTTP Method:** `GET`
*   **URL:** `/api/admin/accounting/entries`
*   **Description:** Retrieves paginated accounting entries with filtering options
*   **Query Parameters:**
    *   `startDate` (optional, string): Filter entries from date (ISO format)
    *   `endDate` (optional, string): Filter entries to date (ISO format)
    *   `accountType` (optional, string): Filter by account type
    *   `customerId` (optional, string): Filter by customer ID
    *   `page` (optional, integer): Page number (default: 1)
    *   `limit` (optional, integer): Items per page (default: 20)
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "items": [
            {
              "id": "entry_123",
              "date": "2024-01-15T10:30:00Z",
              "accountType": "revenue",
              "debit": 0,
              "credit": 1500.00,
              "balance": 125000.00,
              "description": "Subscription payment - Premium Plan",
              "customerId": "cust_abc",
              "referenceType": "invoice",
              "referenceId": "inv_456",
              "createdBy": "system",
              "createdAt": "2024-01-15T10:30:00Z"
            }
          ],
          "totalCount": 150,
          "page": 1,
          "totalPages": 8
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `FINANCIAL_ADMIN`, `CTO`
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters
    *   `401 Unauthorized`: Authentication required
    *   `403 Forbidden`: Insufficient permissions
    *   `500 Internal Server Error`: Accounting Service unavailable

---

## 2. Manual Adjustments

### 2.1. Create Manual Adjustment
*   **HTTP Method:** `POST`
*   **URL:** `/api/admin/accounting/adjustments`
*   **Description:** Creates a manual accounting adjustment entry
*   **Request Body:**
    ```json
    {
      "customerId": "cust_abc",
      "amount": 250.00,
      "type": "credit",
      "reason": "Service credit for downtime",
      "accountType": "customer_balance",
      "notes": "Compensation approved by management"
    }
    ```
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "id": "adj_789",
          "customerId": "cust_abc",
          "amount": 250.00,
          "type": "credit",
          "reason": "Service credit for downtime",
          "accountType": "customer_balance",
          "status": "completed",
          "createdBy": "admin_user_123",
          "createdAt": "2024-01-15T11:00:00Z",
          "notes": "Compensation approved by management",
          "balanceAfter": 250.00
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `FINANCIAL_ADMIN`
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body
    *   `401 Unauthorized`: Authentication required
    *   `403 Forbidden`: Insufficient permissions
    *   `404 Not Found`: Customer not found
    *   `500 Internal Server Error`: Adjustment failed

---

## 3. Financial Reports

### 3.1. Generate Financial Report
*   **HTTP Method:** `GET`
*   **URL:** `/api/admin/accounting/reports`
*   **Description:** Generates financial reports with various parameters
*   **Query Parameters:**
    *   `type` (required, string): Report type (`profit-loss`, `balance-sheet`, `cash-flow`, `revenue`, `expenses`)
    *   `period` (required, string): Period (`daily`, `weekly`, `monthly`, `quarterly`, `yearly`)
    *   `startDate` (required, string): Report start date (ISO format)
    *   `endDate` (required, string): Report end date (ISO format)
    *   `customerId` (optional, string): Filter by specific customer
    *   `format` (optional, string): Output format (`json`, `csv`, `pdf`) - default: `json`
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "reportType": "profit-loss",
          "period": "monthly",
          "startDate": "2024-01-01T00:00:00Z",
          "endDate": "2024-01-31T23:59:59Z",
          "generatedAt": "2024-02-01T09:00:00Z",
          "generatedBy": "admin_user_123",
          "data": {
            "revenue": {
              "subscriptions": 125000.00,
              "tokens": 15000.00,
              "services": 8500.00,
              "total": 148500.00
            },
            "expenses": {
              "infrastructure": 25000.00,
              "personnel": 60000.00,
              "operations": 12000.00,
              "total": 97000.00
            },
            "netProfit": 51500.00,
            "profitMargin": 34.68
          }
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `FINANCIAL_ADMIN`, `CTO`
*   **Error Responses:**
    *   `400 Bad Request`: Invalid parameters
    *   `401 Unauthorized`: Authentication required
    *   `403 Forbidden`: Insufficient permissions
    *   `500 Internal Server Error`: Report generation failed

---

## 4. Payment Reconciliation

### 4.1. Reconcile Payment
*   **HTTP Method:** `POST`
*   **URL:** `/api/admin/accounting/reconcile`
*   **Description:** Reconciles a payment with one or more invoices
*   **Request Body:**
    ```json
    {
      "paymentId": "pay_123",
      "invoiceIds": ["inv_456", "inv_457"],
      "allocations": [
        {
          "invoiceId": "inv_456",
          "amount": 500.00
        },
        {
          "invoiceId": "inv_457",
          "amount": 300.00
        }
      ],
      "notes": "Manual reconciliation - payment split between two invoices"
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "reconciliationId": "recon_789",
          "paymentId": "pay_123",
          "totalAmount": 800.00,
          "reconciledAmount": 800.00,
          "remainingAmount": 0.00,
          "invoices": [
            {
              "invoiceId": "inv_456",
              "allocatedAmount": 500.00,
              "status": "paid"
            },
            {
              "invoiceId": "inv_457",
              "allocatedAmount": 300.00,
              "status": "paid"
            }
          ],
          "reconciledAt": "2024-01-15T12:00:00Z",
          "reconciledBy": "admin_user_123",
          "notes": "Manual reconciliation - payment split between two invoices"
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `FINANCIAL_ADMIN`
*   **Error Responses:**
    *   `400 Bad Request`: Invalid reconciliation data or amount mismatch
    *   `401 Unauthorized`: Authentication required
    *   `403 Forbidden`: Insufficient permissions
    *   `404 Not Found`: Payment or invoice not found
    *   `409 Conflict`: Payment already reconciled
    *   `500 Internal Server Error`: Reconciliation failed

---

## 5. Customer Balance

### 5.1. Get Customer Balance
*   **HTTP Method:** `GET`
*   **URL:** `/api/admin/accounting/balance/{customerId}`
*   **Description:** Retrieves the current balance for a customer
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "customerId": "cust_abc",
          "customerName": "Acme Corp",
          "balance": 1250.00,
          "currency": "USD",
          "lastUpdated": "2024-01-15T14:30:00Z",
          "details": {
            "totalInvoiced": 25000.00,
            "totalPaid": 23500.00,
            "totalCredits": 250.00,
            "outstandingBalance": 1250.00,
            "overdueAmount": 0.00
          },
          "recentTransactions": [
            {
              "date": "2024-01-15T10:30:00Z",
              "type": "payment",
              "amount": -500.00,
              "description": "Payment received",
              "balanceAfter": 1250.00
            }
          ]
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `FINANCIAL_ADMIN`
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication required
    *   `403 Forbidden`: Insufficient permissions
    *   `404 Not Found`: Customer not found
    *   `500 Internal Server Error`: Balance retrieval failed

---

## 6. Data Export

### 6.1. Export Accounting Data
*   **HTTP Method:** `GET`
*   **URL:** `/api/admin/accounting/export`
*   **Description:** Exports accounting data in various formats
*   **Query Parameters:**
    *   `startDate` (required, string): Export start date (ISO format)
    *   `endDate` (required, string): Export end date (ISO format)
    *   `format` (required, string): Export format (`csv`, `excel`, `json`, `pdf`)
    *   `dataType` (required, string): Data type (`entries`, `invoices`, `payments`, `balances`, `all`)
    *   `customerId` (optional, string): Filter by customer
*   **Response:**
    *   `200 OK`: File download with appropriate Content-Type header
        - CSV: `text/csv`
        - Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
        - JSON: `application/json`
        - PDF: `application/pdf`
*   **Required Roles:** `SUPER_ADMIN`, `FINANCIAL_ADMIN`
*   **Error Responses:**
    *   `400 Bad Request`: Invalid parameters
    *   `401 Unauthorized`: Authentication required
    *   `403 Forbidden`: Insufficient permissions
    *   `500 Internal Server Error`: Export failed

---

## 7. Invoice Validation

### 7.1. Validate Invoice
*   **HTTP Method:** `PUT`
*   **URL:** `/api/admin/accounting/invoices/{invoiceId}/validate`
*   **Description:** Validates an invoice for accounting purposes
*   **Request Body:**
    ```json
    {
      "validatedBy": "admin_user_123",
      "notes": "Invoice reviewed and approved for accounting"
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "invoiceId": "inv_456",
          "status": "validated",
          "validatedAt": "2024-01-15T15:00:00Z",
          "validatedBy": "admin_user_123",
          "notes": "Invoice reviewed and approved for accounting"
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `FINANCIAL_ADMIN`
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body
    *   `401 Unauthorized`: Authentication required
    *   `403 Forbidden`: Insufficient permissions
    *   `404 Not Found`: Invoice not found
    *   `409 Conflict`: Invoice already validated
    *   `500 Internal Server Error`: Validation failed

---

## 8. Aging Reports

### 8.1. Get Aging Report
*   **HTTP Method:** `GET`
*   **URL:** `/api/admin/accounting/aging-report`
*   **Description:** Generates accounts receivable aging report
*   **Query Parameters:**
    *   `asOfDate` (optional, string): Report date (default: today, ISO format)
    *   `customerId` (optional, string): Filter by customer
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "asOfDate": "2024-01-15T00:00:00Z",
          "generatedAt": "2024-01-15T16:00:00Z",
          "summary": {
            "current": 5000.00,
            "days1to30": 2500.00,
            "days31to60": 1200.00,
            "days61to90": 800.00,
            "over90Days": 500.00,
            "totalOutstanding": 10000.00
          },
          "customers": [
            {
              "customerId": "cust_abc",
              "customerName": "Acme Corp",
              "current": 1500.00,
              "days1to30": 500.00,
              "days31to60": 0.00,
              "days61to90": 0.00,
              "over90Days": 0.00,
              "totalOutstanding": 2000.00
            }
          ]
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `FINANCIAL_ADMIN`
*   **Error Responses:**
    *   `400 Bad Request`: Invalid parameters
    *   `401 Unauthorized`: Authentication required
    *   `403 Forbidden`: Insufficient permissions
    *   `500 Internal Server Error`: Report generation failed

---

## 9. Audit Trail

### 9.1. Get Audit Trail
*   **HTTP Method:** `GET`
*   **URL:** `/api/admin/accounting/audit-trail`
*   **Description:** Retrieves audit trail of accounting operations
*   **Query Parameters:**
    *   `startDate` (optional, string): Filter from date (ISO format)
    *   `endDate` (optional, string): Filter to date (ISO format)
    *   `userId` (optional, string): Filter by user who performed action
    *   `entityType` (optional, string): Filter by entity type (`invoice`, `payment`, `adjustment`, `entry`)
    *   `entityId` (optional, string): Filter by specific entity ID
    *   `action` (optional, string): Filter by action type (`create`, `update`, `delete`, `validate`)
    *   `page` (optional, integer): Page number
    *   `limit` (optional, integer): Items per page
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "items": [
            {
              "id": "audit_123",
              "timestamp": "2024-01-15T15:00:00Z",
              "userId": "admin_user_123",
              "userName": "John Admin",
              "action": "validate",
              "entityType": "invoice",
              "entityId": "inv_456",
              "changes": {
                "status": {
                  "old": "pending",
                  "new": "validated"
                }
              },
              "ipAddress": "192.168.1.100",
              "userAgent": "Mozilla/5.0...",
              "notes": "Invoice reviewed and approved for accounting"
            }
          ],
          "totalCount": 500,
          "page": 1,
          "totalPages": 25
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `CTO`
*   **Error Responses:**
    *   `400 Bad Request`: Invalid parameters
    *   `401 Unauthorized`: Authentication required
    *   `403 Forbidden`: Insufficient permissions
    *   `500 Internal Server Error`: Audit trail retrieval failed

---

## 10. Service Communication

### HTTP Service Authentication

All requests from Admin Service to Accounting Service include the following headers:

```typescript
{
  'Authorization': 'Bearer <JWT_TOKEN>',
  'X-Service-Name': 'admin-service',
  'X-Service-Version': '1.0.0',
  'Content-Type': 'application/json'
}
```

### Error Handling

The Admin Service wraps all Accounting Service errors with proper context:

```typescript
try {
  const response = await this.accountingService.getEntries(params);
  return response.data;
} catch (error) {
  if (error.response?.status === 503) {
    throw new ServiceUnavailableException('Accounting Service is temporarily unavailable');
  }
  throw new InternalServerErrorException('Failed to retrieve accounting entries');
}
```

### Retry Strategy

- **Max retries:** 3
- **Retry delay:** Exponential backoff (1s, 2s, 4s)
- **Retry on:** 503 Service Unavailable, Network errors
- **No retry on:** 4xx client errors (except 429 Rate Limit)

---

## 11. Type Definitions

### AccountingEntry
```typescript
interface AccountingEntry {
  id: string;
  date: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  customerId?: string;
  referenceType?: string;
  referenceId?: string;
  createdBy: string;
  createdAt: string;
}
```

### ManualAdjustment
```typescript
interface ManualAdjustment {
  id: string;
  customerId: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  accountType: string;
  status: 'pending' | 'completed' | 'failed';
  createdBy: string;
  createdAt: string;
  notes?: string;
  balanceAfter: number;
}
```

### FinancialReport
```typescript
interface FinancialReport {
  reportType: 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'revenue' | 'expenses';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string;
  data: Record<string, any>;
}
```

### PaymentReconciliation
```typescript
interface PaymentReconciliation {
  reconciliationId: string;
  paymentId: string;
  totalAmount: number;
  reconciledAmount: number;
  remainingAmount: number;
  invoices: Array<{
    invoiceId: string;
    allocatedAmount: number;
    status: string;
  }>;
  reconciledAt: string;
  reconciledBy: string;
  notes?: string;
}
```

### CustomerBalance
```typescript
interface CustomerBalance {
  customerId: string;
  customerName: string;
  balance: number;
  currency: string;
  lastUpdated: string;
  details: {
    totalInvoiced: number;
    totalPaid: number;
    totalCredits: number;
    outstandingBalance: number;
    overdueAmount: number;
  };
  recentTransactions: Array<{
    date: string;
    type: string;
    amount: number;
    description: string;
    balanceAfter: number;
  }>;
}
```

---

## 12. Best Practices

1. **Always validate customer existence** before creating accounting entries
2. **Use manual adjustments sparingly** and always provide detailed notes
3. **Reconcile payments promptly** to maintain accurate customer balances
4. **Generate regular financial reports** for audit and compliance purposes
5. **Monitor the audit trail** for unusual accounting activities
6. **Export data regularly** for backup and external accounting systems
7. **Validate invoices** before processing payments to ensure accuracy

---

## 13. Compliance Notes

- All accounting operations are logged in the audit trail
- Financial reports are retained for 7 years per regulatory requirements
- Manual adjustments require dual authorization for amounts > $1000
- Payment reconciliations must be completed within 30 days
- Aging reports should be reviewed weekly for collections management
