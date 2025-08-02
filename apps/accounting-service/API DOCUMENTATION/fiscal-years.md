# Fiscal Years API Documentation

## Overview
The Fiscal Years API manages accounting periods within the Wanzo Compta system. It provides endpoints for creating, managing, and auditing fiscal years.

## Base URL
```
/api/fiscal-years
```

## Endpoints

### Get All Fiscal Years
```http
GET /api/fiscal-years
```

**Response:**
```json
[
  {
    "id": "fy_2024_001",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "status": "open",
    "code": "FY2024",
    "auditStatus": {
      "isAudited": false,
      "auditor": null,
      "auditedAt": null
    }
  }
]
```

### Get Fiscal Year by ID
```http
GET /api/fiscal-years/:id
```

**Parameters:**
- `id` (string, required): The fiscal year ID

**Response:**
```json
{
  "id": "fy_2024_001",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "status": "open",
  "code": "FY2024",
  "auditStatus": {
    "isAudited": false,
    "auditor": null,
    "auditedAt": null
  }
}
```

### Create Fiscal Year
```http
POST /api/fiscal-years
```

**Request Body:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "code": "FY2024"
}
```

**Response:**
```json
{
  "id": "fy_2024_001",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "status": "open",
  "code": "FY2024",
  "auditStatus": {
    "isAudited": false,
    "auditor": null,
    "auditedAt": null
  }
}
```

### Close Fiscal Year
```http
POST /api/fiscal-years/:id/close
```

**Parameters:**
- `id` (string, required): The fiscal year ID

**Description:**
Closes a fiscal year, making it read-only for journal entries.

**Response:**
```json
{
  "id": "fy_2024_001",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "status": "closed",
  "code": "FY2024",
  "auditStatus": {
    "isAudited": false,
    "auditor": null,
    "auditedAt": null
  }
}
```

### Reopen Fiscal Year
```http
POST /api/fiscal-years/:id/reopen
```

**Parameters:**
- `id` (string, required): The fiscal year ID

**Description:**
Reopens a closed fiscal year, allowing journal entries to be modified again.

**Response:**
```json
{
  "id": "fy_2024_001",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "status": "open",
  "code": "FY2024",
  "auditStatus": {
    "isAudited": false,
    "auditor": null,
    "auditedAt": null
  }
}
```

### Audit Fiscal Year
```http
POST /api/fiscal-years/:id/audit
```

**Parameters:**
- `id` (string, required): The fiscal year ID

**Request Body:**
```json
{
  "name": "Jean Dupont",
  "registrationNumber": "12345-CAC",
  "token": "audit_token_xyz"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fiscal year audited successfully",
  "errors": []
}
```

### Import Fiscal Years
```http
POST /api/fiscal-years/import
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: File upload (CSV, Excel, or JSON format)

**Response:**
```json
{
  "imported": 3
}
```

## Data Models

### FiscalYear
```typescript
interface FiscalYear {
  id: string;
  startDate: string;           // ISO date format
  endDate: string;             // ISO date format
  status: 'open' | 'closed';
  code: string;                // Human-readable identifier
  auditStatus?: {
    isAudited: boolean;
    auditor: {
      name: string;
      registrationNumber: string;
    };
    auditedAt: string;         // ISO date format
  };
}
```

### AuditorCredentials
```typescript
interface AuditorCredentials {
  name: string;
  registrationNumber: string;
  token?: string;              // Optional audit token
}
```

### AuditValidation
```typescript
interface AuditValidation {
  success: boolean;
  message: string;
  errors?: string[];           // Array of validation errors
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden (e.g., trying to modify closed fiscal year) |
| 404  | Fiscal Year not found |
| 409  | Conflict (e.g., overlapping fiscal years) |
| 500  | Internal Server Error |

## Business Rules

### Fiscal Year Creation
- Start date must be before end date
- Fiscal years cannot overlap
- Code must be unique within the organization

### Fiscal Year Closure
- Only open fiscal years can be closed
- All journal entries must be balanced before closure
- Closed fiscal years become read-only

### Fiscal Year Audit
- Only closed fiscal years can be audited
- Auditor must have valid credentials
- Audit process validates all journal entries and balances

### Import Rules
- Imported fiscal years must not conflict with existing ones
- File format must be valid (CSV, Excel, or JSON)
- All required fields must be present

## Examples

### Creating a New Fiscal Year
```javascript
const newFiscalYear = await fiscalYearsApi.create({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  code: 'FY2024'
});
```

### Closing a Fiscal Year
```javascript
const closedFiscalYear = await fiscalYearsApi.close('fy_2024_001');
```

### Auditing a Fiscal Year
```javascript
const auditResult = await fiscalYearsApi.audit('fy_2024_001', {
  name: 'Jean Dupont',
  registrationNumber: '12345-CAC'
});
```

## Related Documentation
- [Audit API](./audit.md)
- [Journals API](./journals.md)
- [Ledger API](./ledger.md)
- [Accounts API](./accounts.md)
