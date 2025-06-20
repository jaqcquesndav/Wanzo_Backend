# Events API Documentation

This document describes the Events API endpoints for the Wanzo Compta application. These endpoints handle business events and notifications.

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

### Get Events

Retrieves business events and notifications.

**URL:** `/events`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional) - Filter by event type ('deadline', 'reminder', 'alert', 'notification')
- `category` (optional) - Filter by category ('tax', 'audit', 'accounting', 'system')
- `status` (optional) - Filter by status ('pending', 'acknowledged', 'completed', 'expired')
- `priority` (optional) - Filter by priority ('low', 'medium', 'high', 'critical')
- `startDate` (optional) - Start date for filter (format: YYYY-MM-DD)
- `endDate` (optional) - End date for filter (format: YYYY-MM-DD)
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Number of events per page (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "evt-123",
        "type": "deadline",
        "category": "tax",
        "title": "Déclaration TVA à échéance",
        "description": "La déclaration de TVA pour Mai 2024 doit être soumise avant le 30/06/2024.",
        "dueDate": "2024-06-30T23:59:59Z",
        "priority": "high",
        "status": "pending",
        "createdAt": "2024-06-01T08:00:00Z",
        "actions": [
          {
            "type": "link",
            "label": "Préparer la déclaration",
            "url": "/declarations/vat/new"
          }
        ]
      },
      {
        "id": "evt-124",
        "type": "reminder",
        "category": "accounting",
        "title": "Rapprochement bancaire",
        "description": "Le rapprochement bancaire pour le mois de Mai 2024 est à effectuer.",
        "dueDate": "2024-06-15T23:59:59Z",
        "priority": "medium",
        "status": "completed",
        "completedAt": "2024-06-14T16:30:00Z",
        "createdAt": "2024-06-01T08:00:00Z",
        "actions": []
      },
      {
        "id": "evt-125",
        "type": "alert",
        "category": "accounting",
        "title": "Solde client dépassant le seuil",
        "description": "Le solde du client XYZ (125,000 €) dépasse le seuil de crédit (100,000 €).",
        "priority": "high",
        "status": "acknowledged",
        "acknowledgedAt": "2024-06-19T09:30:00Z",
        "createdAt": "2024-06-18T14:25:00Z",
        "entityType": "customer",
        "entityId": "cust-456",
        "actions": [
          {
            "type": "link",
            "label": "Voir le client",
            "url": "/customers/cust-456"
          }
        ]
      }
    ],
    "total": 18,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "summary": {
      "pending": 12,
      "critical": 2,
      "high": 5,
      "overdue": 3
    }
  }
}
```

### Get Event by ID

Retrieves a specific event by its ID.

**URL:** `/events/:id`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the event to retrieve

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "evt-123",
    "type": "deadline",
    "category": "tax",
    "title": "Déclaration TVA à échéance",
    "description": "La déclaration de TVA pour Mai 2024 doit être soumise avant le 30/06/2024.",
    "dueDate": "2024-06-30T23:59:59Z",
    "priority": "high",
    "status": "pending",
    "createdAt": "2024-06-01T08:00:00Z",
    "createdBy": {
      "id": "user-789",
      "name": "System"
    },
    "reminders": [
      {
        "date": "2024-06-23T08:00:00Z",
        "sent": true
      },
      {
        "date": "2024-06-29T08:00:00Z",
        "sent": false
      }
    ],
    "actions": [
      {
        "type": "link",
        "label": "Préparer la déclaration",
        "url": "/declarations/vat/new"
      },
      {
        "type": "button",
        "label": "Marquer comme complété",
        "action": "complete"
      }
    ],
    "relatedEntities": [
      {
        "type": "fiscal-year",
        "id": "fy-123",
        "name": "Exercice 2024"
      }
    ],
    "attachments": []
  }
}
```

### Create Event

Creates a new event.

**URL:** `/events`

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
  "type": "reminder",
  "category": "accounting",
  "title": "Clôture mensuelle",
  "description": "Effectuer la clôture mensuelle pour Juin 2024",
  "dueDate": "2024-07-10T23:59:59Z",
  "priority": "medium",
  "reminders": [
    {
      "date": "2024-07-08T08:00:00Z"
    },
    {
      "date": "2024-07-09T08:00:00Z"
    }
  ],
  "actions": [
    {
      "type": "link",
      "label": "Voir la procédure",
      "url": "/procedures/monthly-close"
    }
  ],
  "relatedEntities": [
    {
      "type": "fiscal-year",
      "id": "fy-123"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "evt-126",
    "type": "reminder",
    "category": "accounting",
    "title": "Clôture mensuelle",
    "description": "Effectuer la clôture mensuelle pour Juin 2024",
    "dueDate": "2024-07-10T23:59:59Z",
    "priority": "medium",
    "status": "pending",
    "createdAt": "2024-06-19T10:30:00Z",
    "createdBy": {
      "id": "user-456",
      "name": "John Doe"
    },
    "reminders": [
      {
        "date": "2024-07-08T08:00:00Z",
        "sent": false
      },
      {
        "date": "2024-07-09T08:00:00Z",
        "sent": false
      }
    ],
    "actions": [
      {
        "type": "link",
        "label": "Voir la procédure",
        "url": "/procedures/monthly-close"
      }
    ],
    "relatedEntities": [
      {
        "type": "fiscal-year",
        "id": "fy-123",
        "name": "Exercice 2024"
      }
    ]
  }
}
```

### Update Event

Updates an existing event.

**URL:** `/events/:id`

**Method:** `PUT`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - ID of the event to update

**Request Body:**
```json
{
  "title": "Clôture mensuelle - Juin 2024",
  "description": "Effectuer la clôture mensuelle pour Juin 2024 et préparer le rapport",
  "priority": "high",
  "dueDate": "2024-07-12T23:59:59Z",
  "reminders": [
    {
      "date": "2024-07-10T08:00:00Z"
    },
    {
      "date": "2024-07-11T08:00:00Z"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "evt-126",
    "type": "reminder",
    "category": "accounting",
    "title": "Clôture mensuelle - Juin 2024",
    "description": "Effectuer la clôture mensuelle pour Juin 2024 et préparer le rapport",
    "dueDate": "2024-07-12T23:59:59Z",
    "priority": "high",
    "status": "pending",
    "createdAt": "2024-06-19T10:30:00Z",
    "updatedAt": "2024-06-19T11:15:00Z",
    "createdBy": {
      "id": "user-456",
      "name": "John Doe"
    },
    "reminders": [
      {
        "date": "2024-07-10T08:00:00Z",
        "sent": false
      },
      {
        "date": "2024-07-11T08:00:00Z",
        "sent": false
      }
    ],
    "actions": [
      {
        "type": "link",
        "label": "Voir la procédure",
        "url": "/procedures/monthly-close"
      }
    ],
    "relatedEntities": [
      {
        "type": "fiscal-year",
        "id": "fy-123",
        "name": "Exercice 2024"
      }
    ]
  }
}
```

### Delete Event

Deletes an event.

**URL:** `/events/:id`

**Method:** `DELETE`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the event to delete

**Response:**

```json
{
  "success": true
}
```

### Update Event Status

Updates the status of an event.

**URL:** `/events/:id/status`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - ID of the event to update

**Request Body:**
```json
{
  "status": "completed",
  "comment": "Clôture effectuée et rapport soumis"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "evt-126",
    "status": "completed",
    "completedAt": "2024-06-19T14:30:00Z",
    "completedBy": {
      "id": "user-456",
      "name": "John Doe"
    },
    "comment": "Clôture effectuée et rapport soumis"
  }
}
```

### Get Event Calendar

Retrieves events in a calendar format.

**URL:** `/events/calendar`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (required) - Start date for the calendar (format: YYYY-MM-DD)
- `endDate` (required) - End date for the calendar (format: YYYY-MM-DD)
- `types` (optional) - Comma-separated list of event types to include
- `categories` (optional) - Comma-separated list of categories to include

**Response:**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "evt-123",
        "type": "deadline",
        "category": "tax",
        "title": "Déclaration TVA à échéance",
        "description": "La déclaration de TVA pour Mai 2024 doit être soumise avant le 30/06/2024.",
        "dueDate": "2024-06-30T23:59:59Z",
        "priority": "high",
        "status": "pending"
      },
      {
        "id": "evt-124",
        "type": "reminder",
        "category": "accounting",
        "title": "Rapprochement bancaire",
        "description": "Le rapprochement bancaire pour le mois de Mai 2024 est à effectuer.",
        "dueDate": "2024-06-15T23:59:59Z",
        "priority": "medium",
        "status": "completed",
        "completedAt": "2024-06-14T16:30:00Z"
      },
      {
        "id": "evt-126",
        "type": "reminder",
        "category": "accounting",
        "title": "Clôture mensuelle - Juin 2024",
        "description": "Effectuer la clôture mensuelle pour Juin 2024 et préparer le rapport",
        "dueDate": "2024-07-12T23:59:59Z",
        "priority": "high",
        "status": "pending"
      }
    ],
    "summary": {
      "2024-06-15": {
        "total": 1,
        "completed": 1,
        "pending": 0
      },
      "2024-06-30": {
        "total": 1,
        "completed": 0,
        "pending": 1
      },
      "2024-07-12": {
        "total": 1,
        "completed": 0,
        "pending": 1
      }
    }
  }
}
```

### Generate Tax Calendar

Generates a calendar of tax deadlines.

**URL:** `/events/generate-tax-calendar`

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
  "fiscalYearId": "fy-123",
  "taxTypes": ["vat", "corporate-income", "payroll"],
  "reminderDays": [7, 1]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "generated": 24,
    "events": [
      {
        "id": "evt-127",
        "type": "deadline",
        "category": "tax",
        "title": "Déclaration TVA - Juin 2024",
        "description": "La déclaration de TVA pour Juin 2024 doit être soumise avant le 31/07/2024.",
        "dueDate": "2024-07-31T23:59:59Z",
        "priority": "high",
        "status": "pending"
      },
      {
        "id": "evt-128",
        "type": "deadline",
        "category": "tax",
        "title": "Acompte impôt sur les sociétés - Q2 2024",
        "description": "L'acompte d'impôt sur les sociétés pour le deuxième trimestre 2024 doit être payé avant le 15/07/2024.",
        "dueDate": "2024-07-15T23:59:59Z",
        "priority": "high",
        "status": "pending"
      }
    ]
  }
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
  "error": "Invalid event status"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Event not found"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "You don't have permission to modify this event"
}
```

**Other Errors:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
