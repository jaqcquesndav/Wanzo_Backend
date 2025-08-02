# Ledger API Documentation

This document describes the Ledger API endpoints for the Wanzo Compta application, which provide access to the general ledger, trial balance, and account-specific movements.

## Base URL

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentication

All endpoints require authentication with a Bearer token.

**Headers:**
```
Authorization: Bearer <token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
```

## Endpoints

### Get Account Balance

Retrieves the current balance for a specific account with optional date and currency filters.

**URL:** `/ledger/accounts/{accountId}/balance`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `date` (optional) - Date for balance calculation (YYYY-MM-DD format)
- `currency` (optional) - Currency code for conversion (e.g., XOF, EUR, USD)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "accountId": "acc-411",
    "debit": 2500000.00,
    "credit": 1375000.50,
    "balance": 1124999.50,
    "currency": "XOF"
  }
}
```

### Get Account Movements

Retrieves all movements (transactions) for a specific account with comprehensive filtering and pagination.

**URL:** `/ledger/accounts/{accountId}/movements`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `startDate` (optional) - Start date for filtering (YYYY-MM-DD format)
- `endDate` (optional) - End date for filtering (YYYY-MM-DD format)
- `journalType` (optional) - Filter by journal type: `sales`, `purchases`, `bank`, `cash`, `general`, `all`
- `status` (optional) - Filter by status: `draft`, `pending`, `approved`, `posted`, `all`
- `currency` (optional) - Currency code for conversion
- `minAmount` (optional) - Minimum transaction amount filter
- `maxAmount` (optional) - Maximum transaction amount filter
- `sortBy` (optional) - Sort field: `date`, `amount`, `reference`
- `sortOrder` (optional) - Sort order: `asc`, `desc`
- `page` (optional) - Page number for pagination (default: 1)
- `pageSize` (optional) - Number of entries per page (default: 50, max: 200)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "je-123",
      "date": "2024-06-15",
      "journalType": "sales",
      "description": "Facture client ABC",
      "reference": "VTE-001",
      "totalDebit": 1200.00,
      "totalCredit": 1200.00,
      "totalVat": 200.00,
      "status": "posted",
      "lines": []
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 20,
  "totalPages": 2
}
```

### Get Trial Balance

Retrieves the trial balance with comprehensive filtering options, which lists all accounts and their debit/credit balances.

**URL:** `/ledger/trial-balance`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `date` (optional) - Date for trial balance calculation (YYYY-MM-DD format)
- `mode` (optional) - Accounting standard: `SYSCOHADA`, `IFRS` (default: SYSCOHADA)
- `currency` (optional) - Currency code for conversion
- `level` (optional) - Account detail level (number of digits to group by)
- `includeZeroBalances` (optional) - Include accounts with zero balance: `true`, `false`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "account": {
        "id": "acc-101",
        "code": "101000",
        "name": "Capital",
        "type": "equity"
      },
      "debit": 0,
      "credit": 500000.00,
      "balance": -500000.00
    },
    {
      "account": {
        "id": "acc-411",
        "code": "411000",
        "name": "Clients",
        "type": "asset"
      },
      "debit": 125000.00,
      "credit": 25000.00,
    "balance": 100000.00
  }
]
        "name": "Capital social",
        "type": "equity"
      },
      "debit": 0,
      "credit": 100000,
      "balance": -100000
    },
    {
      "account": {
        "id": "acc-411",
        "code": "411000",
        "name": "Clients",
        "type": "asset"
      },
      "debit": 50000,
      "credit": 20000,
      "balance": 30000
    }
  ]
}
```

### Get Account Movements (Ledger)

Retrieves all journal entries (movements) for a specific account.

**URL:** `/ledger/accounts/{accountId}`

**Method:** `GET`

**Authentication Required:** Yes

**URL Parameters:**
- `accountId` (required) - The ID of the account to retrieve movements for.

**Query Parameters:**
- `fiscalYearId` (required) - The ID of the fiscal year.
- `startDate` (optional) - Start date for filtering movements.
- `endDate` (optional) - End date for filtering movements.
- `page` (optional) - Page number for pagination.
- `pageSize` (optional) - Number of movements per page.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "account": {
      "id": "acc-411",
      "code": "411000",
      "name": "Clients",
      "type": "asset"
    },
    "openingBalance": 15000,
    "closingBalance": 30000,
    "movements": [
      {
        "id": "je-123",
        "date": "2024-06-15",
        "journalType": "sales",
        "reference": "INV12345",
        "description": "Facture de vente",
        "debit": 10000,
        "credit": 0
      },
      {
        "id": "je-128",
        "date": "2024-06-20",
        "journalType": "bank",
        "reference": "PAY-001",
        "description": "Paiement reçu",
        "debit": 0,
        "credit": 5000
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 10,
    "totalPages": 3
  }
}
```

### Export Ledger

Exports the trial balance or account movements to a file (CSV, Excel, PDF).

**URL:** `/ledger/export`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `format` (required) - Export format ('csv', 'excel', 'pdf').
- `fiscalYearId` (required) - The ID of the fiscal year.
- `exportType` (required) - Type of export ('trial-balance' or 'account-movements').
- `accountId` (optional) - Required if `exportType` is 'account-movements'.
- `startDate` (optional) - Start date for filtering.
- `endDate` (optional) - End date for filtering.

**Response:** File download with the appropriate content type.

## Data Structures

### TrialBalanceLine

```typescript
interface TrialBalanceLine {
  account: Account;
  debit: number;
  credit: number;
  balance: number;
}
```

### AccountMovements

```typescript
interface AccountMovements {
  account: Account;
  openingBalance: number;
  closingBalance: number;
  movements: LedgerMovement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### LedgerMovement

```typescript
interface LedgerMovement {
  id: string; // Journal Entry ID
  date: string;
  journalType: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
}
```

### Account (Shared Type)

```typescript
interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}
```

### Export Balance Sheet

Export trial balance or balance sheet in various formats.

**URL:** `/ledger/export-balance`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `format` (required) - Export format: `pdf`, `excel`, `csv`
- `mode` (optional) - Accounting standard: `SYSCOHADA`, `IFRS`
- `date` (optional) - Date for balance calculation (YYYY-MM-DD)
- `currency` (optional) - Currency code
- `includeDetails` (optional) - Include detailed account information: `true`, `false`

**Response:** File download (Content-Type varies by format)

### Alternative Account Movements Endpoint

Alternative endpoint for retrieving account movements with different URL structure.

**URL:** `/ledger/accounts/{accountId}`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:** Same as `/ledger/accounts/{accountId}/movements`

### Export General Ledger

Export comprehensive ledger data in various formats.

**URL:** `/ledger/export`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `format` (required) - Export format: `pdf`, `excel`, `csv`
- `accountIds` (optional) - Array of specific account IDs to export
- `startDate` (optional) - Start date for export
- `endDate` (optional) - End date for export
- `mode` (optional) - Accounting standard: `SYSCOHADA`, `IFRS`
- `currency` (optional) - Currency code
- `includeDetails` (optional) - Include detailed transaction information

### Search Ledger

Search across all ledger entries with comprehensive filtering.

**URL:** `/ledger/search`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `query` (required) - Search term for description, reference, or account
- `startDate` (optional) - Start date filter
- `endDate` (optional) - End date filter
- `accountType` (optional) - Filter by account type
- `journalType` (optional) - Filter by journal type
- `status` (optional) - Filter by entry status
- `page` (optional) - Page number for pagination
- `pageSize` (optional) - Number of entries per page

## Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Session expirée"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Account not found"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "error": "Invalid date range"
}
```
