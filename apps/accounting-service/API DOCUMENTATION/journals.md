# Journal Entries API Documentation

This document describes the Journal Entries API endpoints for the Wanzo Compta application.

## Base URL

```
http://localhost:8000/accounting
```

## Authentication

All endpoints require authentication with a Bearer token.

**Required Headers:**
```
Authorization: Bearer <jwt_token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
Content-Type: application/json
```

## Data Structures

### JournalEntry

```typescript
interface JournalEntry {
  id: string;
  kiotaId?: string; // External reference ID for integration
  date: string; // ISO date format
  journalType: 'sales' | 'purchases' | 'bank' | 'cash' | 'general';
  description: string;
  reference?: string;
  totalDebit: number;
  totalCredit: number;
  totalVat: number;
  status: 'draft' | 'pending' | 'approved' | 'posted' | 'rejected' | 'cancelled';
  source: 'manual' | 'agent' | 'import'; // Source de l'entrée
  agentId?: string; // ID de l'agent comptable qui a généré cette entrée
  validationStatus?: 'pending' | 'validated' | 'rejected'; // Statut de validation pour les entrées provenant de l'agent
  validatedBy?: string; // Utilisateur qui a validé l'entrée
  validatedAt?: string; // Date de validation (ISO format)
  postedBy?: string; // Utilisateur qui a comptabilisé l'entrée
  postedAt?: string; // Date de comptabilisation (ISO format)
  rejectionReason?: string; // Raison du rejet si status = 'rejected'
  fiscalYearId: string; // ID de l'exercice fiscal
  companyId?: string; // ID de l'entreprise
  createdBy?: string; // Utilisateur créateur
  createdAt: string; // Date de création (ISO format)
  updatedAt: string; // Date de mise à jour (ISO format)
  lines: JournalLine[];
  attachments?: JournalAttachment[];
}

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

interface JournalAttachment {
  id: string;
  name: string;
  url?: string;
  localUrl?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
}
```

## Endpoints

### Get All Journal Entries

Retrieves all journal entries with pagination and filtering.

**URL:** `/journal-entries`

**Method:** `GET`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Number of entries per page (default: 20, max: 100)
- `journalType` (optional) - Filter by journal type
- `status` (optional) - Filter by status
- `source` (optional) - Filter by source ('manual' | 'agent')
- `startDate` (optional) - Filter by start date (ISO format)
- `endDate` (optional) - Filter by end date (ISO format)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "je-123",
        "date": "2024-03-01T00:00:00Z",
        "journalType": "sales",
        "description": "Facture client ABC SARL",
        "reference": "FAC2024-001",
        "totalDebit": 1180000,
        "totalCredit": 1180000,
        "totalVat": 180000,
        "status": "posted",
        "source": "manual",
        "lines": [
          {
            "id": "jl-1",
            "accountId": "411000",
            "accountCode": "411000",
            "accountName": "Clients",
            "debit": 1180000,
            "credit": 0,
            "description": "Client ABC SARL",
            "vatCode": "",
            "vatAmount": 0
          },
          {
            "id": "jl-2",
            "accountId": "707000",
            "accountCode": "707000",
            "accountName": "Ventes de marchandises",
            "debit": 0,
            "credit": 1000000,
            "description": "Ventes de marchandises",
            "vatCode": "",
            "vatAmount": 0
          },
          {
            "id": "jl-3",
            "accountId": "445700",
            "accountCode": "445700",
            "accountName": "État, TVA collectée",
            "debit": 0,
            "credit": 180000,
            "description": "TVA sur ventes",
            "vatCode": "TVA16",
            "vatAmount": 180000
          }
        ],
        "attachments": [
          {
            "id": "att-1",
            "name": "facture_abc_001.pdf",
            "url": "/files/facture_abc_001.pdf",
            "status": "uploaded"
          }
        ]
      }
    ],
    "total": 145,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```
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
  "validationStatus": "validated", // or "rejected"
  "rejectionReason": "Reason for rejection (required if status is rejected)"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "je-124",
    "status": "pending",
    "validationStatus": "validated",
    "validatedBy": "user-abc",
    "validatedAt": "2025-06-19T10:00:00Z",
    "rejectionReason": null
  }
}
```

### Update Journal Entry Status

Updates the status of a journal entry (draft, pending, approved, posted, etc.).

**URL:** `/journal-entries/:id/status`

**Method:** `PATCH`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "status": "posted", // 'draft' | 'pending' | 'approved' | 'posted' | 'rejected' | 'cancelled'
  "rejectionReason": "Optional rejection reason if status is rejected"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "je-124",
    "status": "posted",
    "postedBy": "user-abc",
    "postedAt": "2025-06-19T10:30:00Z"
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
  accountCode?: string; // Generated from account relationship
  accountName?: string; // Generated from account relationship
  debit: number; // Amount in default currency (CDF)
  credit: number; // Amount in default currency (CDF)
  originalDebit?: number; // Original amount in transaction currency
  originalCredit?: number; // Original amount in transaction currency
  currency?: string; // Transaction currency (default: CDF)
  exchangeRate?: number; // Exchange rate to CDF
  description: string;
  vatCode?: string;
  vatAmount?: number;
  analyticCode?: string;
  metadata?: Record<string, any>; // Additional metadata
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
