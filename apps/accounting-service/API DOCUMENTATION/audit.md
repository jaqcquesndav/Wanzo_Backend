# Audit API Documentation

This document describes the Audit API endpoints for the Wanzo Compta application.

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

### Get Audit Logs

Retrieves audit logs for the specified entity or for the entire system.

**URL:** `/audit`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `id` (optional) - Retrieve a specific audit log by its ID.
- `entityType` (optional) - Type of entity to filter logs (e.g., 'journal-entry', 'account', 'fiscal-year')
- `entityId` (optional) - ID of the specific entity to filter logs
- `startDate` (optional) - Start date for the period (format: YYYY-MM-DD)
- `endDate` (optional) - End date for the period (format: YYYY-MM-DD)
- `userId` (optional) - Filter logs by user ID
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Number of logs per page (default: 20)
- `export` (optional) - Export format ('csv', 'excel', 'pdf')

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "audit-1",
        "timestamp": "2024-06-15T10:30:45Z",
        "action": "create",
        "entityType": "journal-entry",
        "entityId": "je-123",
        "userId": "user-456",
        "userName": "John Doe",
        "userRole": "comptable",
        "details": {
          "description": "Created journal entry for Invoice #12345",
          "changes": {
            "status": ["draft", null],
            "description": ["Invoice #12345", null],
            "totalDebit": [1200.00, null]
          }
        }
      },
      {
        "id": "audit-2",
        "timestamp": "2024-06-15T14:20:15Z",
        "action": "update",
        "entityType": "journal-entry",
        "entityId": "je-123",
        "userId": "user-456",
        "userName": "John Doe",
        "userRole": "comptable",
        "details": {
          "description": "Updated journal entry status",
          "changes": {
            "status": ["approved", "draft"]
          }
        }
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

## Data Structures

### AuditLog

```typescript
interface AuditLog {
  id: string;
  timestamp: string; // ISO 8601 format
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  userRole: string;
  details: {
    description: string;
    changes: {
      [fieldName: string]: [any, any]; // [newValue, oldValue]
    };
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
  "error": "Invalid date range"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Audit log not found"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "Insufficient permissions to access audit logs"
}
```

**Other Errors:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
