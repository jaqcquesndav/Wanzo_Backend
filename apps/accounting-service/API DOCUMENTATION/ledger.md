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

### Get Trial Balance

Retrieves the trial balance, which lists all accounts and their debit/credit balances.

**URL:** `/ledger/trial-balance`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `fiscalYearId` (required) - The ID of the fiscal year.
- `startDate` (optional) - Start date for a specific period.
- `endDate` (optional) - End date for a specific period.
- `includeEmptyAccounts` (optional, boolean) - Whether to include accounts with no movements.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "account": {
        "id": "acc-101",
        "code": "101000",
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
