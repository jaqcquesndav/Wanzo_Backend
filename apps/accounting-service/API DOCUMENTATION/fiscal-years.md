# Fiscal Years API Documentation

This document describes the Fiscal Years API endpoints for the Wanzo Compta application.

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

### Get All Fiscal Years

Retrieves all fiscal years for the organization.

**URL:** `/fiscal-years`

**Method:** `GET`

**Query Parameters:**
- `status` (optional) - Filter by status (`open`, `closed`, `audited`).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "fy-123",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "status": "open",
      "code": "FY2024",
      "auditStatus": {
        "isAudited": false,
        "auditor": {
          "name": "",
          "registrationNumber": ""
        },
        "auditedAt": ""
      }
    },
    {
      "id": "fy-124",
      "startDate": "2023-01-01",
      "endDate": "2023-12-31",
      "status": "closed",
      "code": "FY2023",
      "auditStatus": {
        "isAudited": true,
        "auditor": {
          "name": "John Auditor",
          "registrationNumber": "AUD12345"
        },
        "auditedAt": "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

### Import Fiscal Year

For details on importing a fiscal year, please see the [Data Import API Documentation](./data-import.md).

### Get Fiscal Year by ID

Retrieves a specific fiscal year by its ID.

**URL:** `/fiscal-years/:id`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the fiscal year to retrieve

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "fy-123",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "status": "open",
    "code": "FY2024",
    "auditStatus": {
      "isAudited": false,
      "auditor": {
        "name": "",
        "registrationNumber": ""
      },
      "auditedAt": ""
    }
  }
}
```

### Create Fiscal Year

Creates a new fiscal year.

**URL:** `/fiscal-years`

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
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "code": "FY2025"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "fy-125",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "status": "open",
    "code": "FY2025",
    "auditStatus": {
      "isAudited": false,
      "auditor": {
        "name": "",
        "registrationNumber": ""
      },
      "auditedAt": ""
    }
  }
}
```

### Update Fiscal Year

Updates a fiscal year's properties (e.g., code).

**URL:** `/fiscal-years/{id}`

**Method:** `PUT`

**Request Body:**
```json
{
  "code": "EX2024-NEW"
}
```

**Response:** `200 OK`

### Close Fiscal Year

Closes an open fiscal year.

**URL:** `/fiscal-years/:id/close`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - ID of the fiscal year to close

**Request Body:**
```json
{
  "force": false // Optional: set to true to bypass closing checks
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "checks": [
      { "name": "balance", "passed": true, "message": "Balance équilibrée" },
      { "name": "journals", "passed": true, "message": "Journaux validés" },
      { "name": "reconciliation", "passed": true, "message": "Rapprochements effectués" }
    ],
    "message": "Exercice clôturé avec succès"
  }
}
```

### Reopen Fiscal Year

Reopens a closed fiscal year.

**URL:** `/fiscal-years/:id/reopen`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - ID of the fiscal year to reopen

**Request Body:**
```json
{}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "fy-123",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "status": "open",
    "code": "FY2024",
    "auditStatus": {
      "isAudited": false,
      "auditor": {
        "name": "",
        "registrationNumber": ""
      },
      "auditedAt": ""
    }
  }
}
```

### Audit Fiscal Year

Marks a fiscal year as audited by a certified auditor.

**URL:** `/fiscal-years/:id/audit`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - ID of the fiscal year to audit

**Request Body:**
```json
{
  "auditorToken": "123456"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Audit validé avec succès"
}
```

## Data Structures

### FiscalYear

```typescript
interface FiscalYear {
  id: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  status: 'open' | 'closed' | 'audited';
  code: string;
  auditStatus: {
    isAudited: boolean;
    auditor?: {
      name: string;
      registrationNumber: string;
    };
    auditedAt?: string; // ISO 8601 format
  };
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

**Bad Request (400):**
```json
{
  "success": false,
  "error": "Invalid fiscal year date range"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Fiscal year not found"
}
```

**Other Errors:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
