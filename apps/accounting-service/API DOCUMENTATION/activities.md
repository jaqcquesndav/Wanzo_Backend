# Activities API Documentation

This document describes the Activities API endpoints for the Wanzo Compta application. These endpoints handle activity logs and user action tracking.

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

### Get Activities

Retrieves activities and action logs.

**URL:** `/activities`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `entityType` (optional) - Filter by entity type ('journal-entry', 'account', 'fiscal-year', etc.)
- `entityId` (optional) - Filter by entity ID
- `userId` (optional) - Filter by user ID
- `actionType` (optional) - Filter by action type ('create', 'update', 'delete', 'view', 'login', 'logout', etc.)
- `startDate` (optional) - Start date for filter (format: YYYY-MM-DD)
- `endDate` (optional) - End date for filter (format: YYYY-MM-DD)
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Number of activities per page (default: 20)
- `export` (optional) - Export format ('csv', 'excel', 'pdf')

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "act-123",
        "timestamp": "2024-06-19T15:30:45Z",
        "actionType": "create",
        "entityType": "journal-entry",
        "entityId": "je-456",
        "description": "Created journal entry for Invoice #12345",
        "user": {
          "id": "user-789",
          "name": "John Doe",
          "email": "john.doe@example.com",
          "role": "comptable"
        },
        "details": {
          "reference": "INV12345",
          "amount": 1200.00,
          "journalType": "sales"
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      {
        "id": "act-124",
        "timestamp": "2024-06-19T14:20:15Z",
        "actionType": "login",
        "entityType": "user",
        "entityId": "user-789",
        "description": "User logged in",
        "user": {
          "id": "user-789",
          "name": "John Doe",
          "email": "john.doe@example.com",
          "role": "comptable"
        },
        "details": {
          "method": "sso"
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      {
        "id": "act-125",
        "timestamp": "2024-06-19T13:45:30Z",
        "actionType": "update",
        "entityType": "account",
        "entityId": "acc-456",
        "description": "Updated account information",
        "user": {
          "id": "user-789",
          "name": "John Doe",
          "email": "john.doe@example.com",
          "role": "comptable"
        },
        "details": {
          "changes": {
            "name": ["Fournisseurs divers", "Fournisseurs généraux"]
          }
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    ],
    "total": 125,
    "page": 1,
    "pageSize": 20,
    "totalPages": 7
  }
}
```

## Data Structures

### Activity

```typescript
interface Activity {
  id: string;
  timestamp: string; // ISO 8601 format
  actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'ia_generation';
  entityType: 'journal-entry' | 'account' | 'fiscal-year' | 'user' | 'report' | 'settings';
  entityId: string;
  description: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  details?: any; // Additional details about the activity
  ipAddress?: string;
  userAgent?: string;
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
  "error": "Activity log not found"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "You don't have permission to access these activity logs"
}
```

**Other Errors:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
