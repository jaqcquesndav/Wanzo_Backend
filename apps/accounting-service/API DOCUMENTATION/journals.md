# Journal Entries API Documentation

This document describes the Journal Entries API endpoints for the Wanzo Compta application.

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

### Get All Journal Entries

Retrieves all journal entries with pagination.

**URL:** `/journal-entries`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Number of entries per page (default: 20)
- `search` (optional) - Search term for description, reference, etc.
- `journalType` (optional) - Filter by journal type (e.g., 'sales', 'purchases').
- `startDate` (optional) - Start date for filtering (format: YYYY-MM-DD).
- `endDate` (optional) - End date for filtering (format: YYYY-MM-DD).
- `status` (optional) - Filter by status ('draft', 'pending', 'approved', 'posted').
- `source` (optional) - Filter by source ('manual', 'agent').

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "je-123",
        "date": "2024-06-15",
        "journalType": "sales",
        "description": "Invoice #12345",
        "reference": "INV12345",
        "totalDebit": 1200.00,
        "totalCredit": 1200.00,
        "totalVat": 200.00,
        "status": "posted",
        "source": "manual",
        "lines": [
          {
            "id": "jl-1",
            "accountId": "acc-411",
            "accountCode": "411000",
            "accountName": "Client",
            "debit": 1200.00,
            "credit": 0,
            "description": "Invoice #12345",
            "vatCode": "TVA20",
            "vatAmount": 200.00
          },
          {
            "id": "jl-2",
            "accountId": "acc-707",
            "accountCode": "707000",
            "accountName": "Sales of Services",
            "debit": 0,
            "credit": 1000.00,
            "description": "Invoice #12345"
          },
          {
            "id": "jl-3",
            "accountId": "acc-445",
            "accountCode": "445710",
            "accountName": "TVA collected",
            "debit": 0,
            "credit": 200.00,
            "description": "VAT on Invoice #12345"
          }
        ],
        "attachments": [
          {
            "id": "att-1",
            "name": "invoice-12345.pdf",
            "url": "https://example.com/attachments/invoice-12345.pdf",
            "status": "uploaded"
          }
        ]
      },
      {
        "id": "je-124",
        "date": "2024-06-16",
        "journalType": "purchases",
        "description": "Achat de fournitures",
        "reference": "FOURN-001",
        "totalDebit": 500.00,
        "totalCredit": 500.00,
        "totalVat": 80.00,
        "status": "pending",
        "source": "agent",
        "agentId": "agent-xyz",
        "validationStatus": "pending",
        "lines": [
          {
            "id": "jl-4",
            "accountId": "acc-601",
            "accountCode": "601000",
            "accountName": "Achats de marchandises",
            "debit": 500.00,
            "credit": 0,
            "description": "Achat de fournitures",
            "vatCode": "TVA10",
            "vatAmount": 50.00
          },
          {
            "id": "jl-5",
            "accountId": "acc-445",
            "accountCode": "445710",
            "accountName": "TVA collectée",
            "debit": 0,
            "credit": 80.00,
            "description": "TVA sur achat de fournitures"
          }
        ],
        "attachments": []
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

### Get Journal Entry by ID

Retrieves a specific journal entry by its ID.

**URL:** `/journal-entries/:id`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the journal entry to retrieve

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "je-123",
    "date": "2024-06-15",
    "journalType": "sales",
    "description": "Invoice #12345",
    "reference": "INV12345",
    "totalDebit": 1200.00,
    "totalCredit": 1200.00,
    "totalVat": 200.00,
    "status": "posted",
    "source": "manual",
    "lines": [
      {
        "id": "jl-1",
        "accountId": "acc-411",
        "accountCode": "411000",
        "accountName": "Client",
        "debit": 1200.00,
        "credit": 0,
        "description": "Invoice #12345",
        "vatCode": "TVA20",
        "vatAmount": 200.00
      },
      {
        "id": "jl-2",
        "accountId": "acc-707",
        "accountCode": "707000",
        "accountName": "Sales of Services",
        "debit": 0,
        "credit": 1000.00,
        "description": "Invoice #12345"
      },
      {
        "id": "jl-3",
        "accountId": "acc-445",
        "accountCode": "445710",
        "accountName": "TVA collected",
        "debit": 0,
        "credit": 200.00,
        "description": "VAT on Invoice #12345"
      }
    ],
    "attachments": [
      {
        "id": "att-1",
        "name": "invoice-12345.pdf",
        "url": "https://example.com/attachments/invoice-12345.pdf",
        "status": "uploaded"
      }
    ]
  }
}
```

### Create Journal Entry

Creates a new journal entry.

**URL:** `/journal-entries`

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
  "date": "2024-06-15",
  "journalType": "sales",
  "description": "Invoice #12345",
  "reference": "INV12345",
  "status": "draft",
  "lines": [
    {
      "accountId": "acc-411",
      "accountCode": "411000",
      "accountName": "Client",
      "debit": 1200.00,
      "credit": 0,
      "description": "Invoice #12345",
      "vatCode": "TVA20",
      "vatAmount": 200.00
    },
    {
      "accountId": "acc-707",
      "accountCode": "707000",
      "accountName": "Sales of Services",
      "debit": 0,
      "credit": 1000.00,
      "description": "Invoice #12345"
    },
    {
      "accountId": "acc-445",
      "accountCode": "445710",
      "accountName": "TVA collected",
      "debit": 0,
      "credit": 200.00,
      "description": "VAT on Invoice #12345"
    }
  ],
  "attachments": [
    {
      "id": "att-1",
      "name": "invoice-12345.pdf",
      "localUrl": "blob:http://localhost:3000/ab123456-7890",
      "status": "pending"
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "je-123",
    "date": "2024-06-15",
    "journalType": "sales",
    "description": "Invoice #12345",
    "reference": "INV12345",
    "totalDebit": 1200.00,
    "totalCredit": 1200.00,
    "totalVat": 200.00,
    "status": "draft",
    "source": "manual",
    "lines": [
      {
        "id": "jl-1",
        "accountId": "acc-411",
        "accountCode": "411000",
        "accountName": "Client",
        "debit": 1200.00,
        "credit": 0,
        "description": "Invoice #12345",
        "vatCode": "TVA20",
        "vatAmount": 200.00
      },
      {
        "id": "jl-2",
        "accountId": "acc-707",
        "accountCode": "707000",
        "accountName": "Sales of Services",
        "debit": 0,
        "credit": 1000.00,
        "description": "Invoice #12345"
      },
      {
        "id": "jl-3",
        "accountId": "acc-445",
        "accountCode": "445710",
        "accountName": "TVA collected",
        "debit": 0,
        "credit": 200.00,
        "description": "VAT on Invoice #12345"
      }
    ],
    "attachments": [
      {
        "id": "att-1",
        "name": "invoice-12345.pdf",
        "status": "uploading"
      }
    ]
  }
}
```

### Update Journal Entry

Updates an existing journal entry.

**URL:** `/journal-entries/:id`

**Method:** `PUT`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - ID of the journal entry to update

**Request Body:**
```json
{
  "date": "2024-06-16",
  "description": "Updated Invoice #12345",
  "status": "approved",
  "lines": [
    {
      "id": "jl-1",
      "accountId": "acc-411",
      "accountCode": "411000",
      "accountName": "Client",
      "debit": 1200.00,
      "credit": 0,
      "description": "Updated Invoice #12345",
      "vatCode": "TVA20",
      "vatAmount": 200.00
    },
    {
      "id": "jl-2",
      "accountId": "acc-707",
      "accountCode": "707000",
      "accountName": "Sales of Services",
      "debit": 0,
      "credit": 1000.00,
      "description": "Updated Invoice #12345"
    },
    {
      "id": "jl-3",
      "accountId": "acc-445",
      "accountCode": "445710",
      "accountName": "TVA collected",
      "debit": 0,
      "credit": 200.00,
      "description": "VAT on Updated Invoice #12345"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "je-123",
    "date": "2024-06-16",
    "journalType": "sales",
    "description": "Updated Invoice #12345",
    "reference": "INV12345",
    "totalDebit": 1200.00,
    "totalCredit": 1200.00,
    "totalVat": 200.00,
    "status": "approved",
    "source": "manual",
    "lines": [
      {
        "id": "jl-1",
        "accountId": "acc-411",
        "accountCode": "411000",
        "accountName": "Client",
        "debit": 1200.00,
        "credit": 0,
        "description": "Updated Invoice #12345",
        "vatCode": "TVA20",
        "vatAmount": 200.00
      },
      {
        "id": "jl-2",
        "accountId": "acc-707",
        "accountCode": "707000",
        "accountName": "Sales of Services",
        "debit": 0,
        "credit": 1000.00,
        "description": "Updated Invoice #12345"
      },
      {
        "id": "jl-3",
        "accountId": "acc-445",
        "accountCode": "445710",
        "accountName": "TVA collected",
        "debit": 0,
        "credit": 200.00,
        "description": "VAT on Updated Invoice #12345"
      }
    ],
    "attachments": [
      {
        "id": "att-1",
        "name": "invoice-12345.pdf",
        "url": "https://example.com/attachments/invoice-12345.pdf",
        "status": "uploaded"
      }
    ]
  }
}
```

### Delete Journal Entry

Deletes a journal entry.

**URL:** `/journal-entries/:id`

**Method:** `DELETE`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the journal entry to delete

**Response:** `204 No Content`

```json
{
  "success": true
}
```

### Validate AI-Generated Entry

Validates or rejects a journal entry created by the accounting agent.

**URL:** `/journal-entries/:id/validate`

**Method:** `PATCH`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "validationStatus": "validated" // or "rejected"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "je-124",
    "status": "pending", // Status might change to 'pending' or stay 'draft'
    "validationStatus": "validated",
    "validatedBy": "user-abc",
    "validatedAt": "2025-06-19T10:00:00Z"
  }
}
```

## Data Structures

### JournalEntry

```typescript
interface JournalEntry {
  id: string;
  date: string; // Format: YYYY-MM-DD
  journalType: 'sales' | 'purchases' | 'bank' | 'cash' | 'general';
  description: string;
  reference: string;
  totalDebit: number;
  totalCredit: number;
  totalVat: number;
  status: 'draft' | 'pending' | 'approved' | 'posted';
  source?: 'manual' | 'agent';
  agentId?: string;
  validationStatus?: 'pending' | 'validated' | 'rejected';
  validatedBy?: string; // User ID
  validatedAt?: string; // ISO 8601 format
  lines: JournalLine[];
  attachments?: {
    id: string;
    name: string;
    url?: string;
    localUrl?: string;
    status: 'pending' | 'uploading' | 'uploaded' | 'error';
  }[];
}
```

### JournalLine

```typescript
interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  vatCode?: string;
  vatAmount?: number;
  analyticCode?: string;
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
  "error": "Journal entry is not balanced"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Journal entry not found"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "Cannot delete a posted journal entry"
}
```

**Other Errors:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
