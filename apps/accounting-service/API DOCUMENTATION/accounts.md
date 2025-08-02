# Accounts API Documentation

This document describes the Accounts API endpoints for the Wanzo Compta application.

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

### Get All Accounts

Retrieves all accounts for the company with filtering, search, and pagination support.

**URL:** `/accounts`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional) - Search term for code or name
- `type` (optional) - Filter by account type: `asset`, `liability`, `equity`, `revenue`, `expense`, `all`
- `standard` (optional) - Filter by accounting standard: `SYSCOHADA`, `IFRS`, `all`
- `isAnalytic` (optional) - Filter by analytic accounts: `true`, `false`
- `sortBy` (optional) - Sort field: `code`, `name`, `type`
- `sortOrder` (optional) - Sort order: `asc`, `desc`
- `page` (optional) - Page number for pagination (default: 1)
- `pageSize` (optional) - Number of accounts per page (default: 20, max: 100)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "acc-101",
      "code": "101000",
      "name": "Capital",
      "type": "equity",
      "standard": "SYSCOHADA",
      "isAnalytic": false
    },
    {
      "id": "acc-411",
      "code": "411000",
      "name": "Clients",
      "type": "asset",
      "standard": "SYSCOHADA",
      "isAnalytic": false
    },
    {
      "id": "acc-512",
      "code": "512000",
      "name": "Banque",
      "type": "asset",
      "standard": "SYSCOHADA",
      "isAnalytic": false
    },
    {
      "id": "acc-6",
      "code": "6XXXXX",
      "name": "Charges d'exploitation",
      "type": "expense",
      "standard": "SYSCOHADA",
      "isAnalytic": true
    }
  ],
  "total": 4,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

### Get Account by ID

Retrieves a specific account by its ID.

**URL:** `/accounts/:id`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the account to retrieve

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "acc-411",
    "code": "411000",
    "name": "Clients",
    "type": "asset",
    "standard": "SYSCOHADA",
    "isAnalytic": false
  }
}
```

### Create Account

Creates a new account.

**URL:** `/accounts`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "602100",
  "name": "Achats stockés - Matières premières",
  "type": "expense",
  "standard": "SYSCOHADA",
  "isAnalytic": true
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "acc-602100",
    "code": "602100",
    "name": "Achats stockés - Matières premières",
    "type": "expense",
    "standard": "SYSCOHADA",
    "isAnalytic": true
  }
}
```

### Update Account

Updates an existing account.

**URL:** `/accounts/:id`

**Method:** `PUT`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - ID of the account to update

**Request Body:**
```json
{
  "name": "Achats stockés - Matières premières A",
  "isAnalytic": false
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "acc-602100",
    "code": "602100",
    "name": "Achats stockés - Matières premières A",
    "type": "expense",
    "standard": "SYSCOHADA",
    "isAnalytic": false
  }
}
```

### Delete Account

Deletes an account.

**URL:** `/accounts/:id`

**Method:** `DELETE`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the account to delete

**Response:** `204 No Content`

```json
{
  "success": true
}
```

### Import & Export Accounts

Imports or exports accounts using a file (CSV, Excel).

**URL:** `/accounts/batch`

**Method:** `POST`

**Query Parameters:**
- `action` (required) - The action to perform: `import` or `export`.
- `format` (required for export) - The export format: `csv` or `excel`.

**Request Body (for import):** `multipart/form-data` with a `file` field.

**Response (Import):** `200 OK`
```json
{
  "success": true,
  "data": {
    "imported": 125,
    "errors": []
  }
}
```

**Response (Export):** File download with the appropriate content type.

## Data Structures

### Account

```typescript
interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  standard?: 'SYSCOHADA' | 'IFRS';
  isAnalytic?: boolean;
}
```

### Create Multiple Accounts (Batch)

Creates multiple accounts in a single request.

**URL:** `/accounts/batch`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accounts": [
    {
      "code": "602100",
      "name": "Achats stockés - Matières premières",
      "type": "expense",
      "standard": "SYSCOHADA",
      "isAnalytic": false
    },
    {
      "code": "602200",
      "name": "Achats stockés - Fournitures",
      "type": "expense",
      "standard": "SYSCOHADA",
      "isAnalytic": false
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": [
    {
      "id": "acc-602100",
      "code": "602100",
      "name": "Achats stockés - Matières premières",
      "type": "expense",
      "standard": "SYSCOHADA",
      "isAnalytic": false
    },
    {
      "id": "acc-602200",
      "code": "602200",
      "name": "Achats stockés - Fournitures",
      "type": "expense",
      "standard": "SYSCOHADA",
      "isAnalytic": false
    }
  ]
}
```

### Search Accounts

Search accounts by query string with optional filters.

**URL:** `/accounts/search`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `query` (required) - Search term for code or name
- `limit` (optional) - Maximum number of results (default: 10, max: 50)
- `types` (optional) - Array of account types to filter by

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "acc-411",
      "code": "411000",
      "name": "Clients",
      "type": "asset",
      "standard": "SYSCOHADA",
      "isAnalytic": false
    }
  ]
}
```

## Error Responses

**Unauthorized (401):**
```json
{
  "error": "Unauthorized",
  "message": "Session expirée"
}
```

**Bad Request (400):**
```json
{
  "error": "Bad Request",
  "message": "Account code already exists"
}
```

**Not Found (404):**
```json
{
  "error": "Not Found",
  "message": "Account not found"
}
```

**Forbidden (403):**
```json
{
  "error": "Forbidden",
  "message": "Cannot delete an account with transactions"
}
```
