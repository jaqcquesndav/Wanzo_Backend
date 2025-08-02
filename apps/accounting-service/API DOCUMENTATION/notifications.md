# Notifications API Documentation

Ce document décrit les endpoints API de gestion des notifications pour l'application Wanzo Compta.

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

## État de l'Implémentation

> **⚠️ STATUT**: Ces endpoints sont nouvellement créés pour la production. Le frontend utilise actuellement un fallback vers localStorage et données mockées en cas d'indisponibilité de l'API.

## Endpoints

### Obtenir toutes les Notifications

Récupère la liste des notifications de l'utilisateur authentifié.

**URL:** `/notifications`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `page` (optional) - Numéro de page (défaut: 1)
- `pageSize` (optional) - Nombre de notifications par page (défaut: 20)
- `unreadOnly` (optional) - Afficher seulement les non lues (true/false)
- `type` (optional) - Filtrer par type ('info', 'success', 'warning', 'error')
- `from` (optional) - Date de début (ISO 8601)
- `to` (optional) - Date de fin (ISO 8601)

**Response:** `200 OK`

```json
{
  "notifications": [
    {
      "id": "notif-123",
      "type": "info",
      "title": "Nouvelle écriture journal",
      "message": "Une nouvelle écriture a été ajoutée au journal OD",
      "timestamp": "2024-03-01T15:30:00Z",
      "read": false,
      "link": "/journals/entries/456"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  },
  "unreadCount": 12
}
```

### Obtenir une Notification

Récupère une notification spécifique par son ID.

**URL:** `/notifications/{notificationId}`

**Method:** `GET`

**Authentication Required:** Yes

**Path Parameters:**
- `notificationId` - ID de la notification

**Response:** `200 OK`

```json
{
  "id": "notif-123",
  "type": "info",
  "title": "Nouvelle écriture journal",
  "message": "Une nouvelle écriture a été ajoutée au journal OD",
  "timestamp": "2024-03-01T15:30:00Z",
  "read": false,
  "link": "/journals/entries/456"
}
```

### Créer une Notification

Crée une nouvelle notification pour l'utilisateur spécifié ou l'utilisateur authentifié.

**URL:** `/notifications`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "type": "success",
  "title": "Rapport généré",
  "message": "Le rapport financier mensuel a été généré avec succès",
  "link": "/reports/monthly/march-2024",
  "userId": "user-456"
}
```

**Response:** `201 Created`

```json
{
  "id": "notif-789",
  "type": "success",
  "title": "Rapport généré",
  "message": "Le rapport financier mensuel a été généré avec succès",
  "timestamp": "2024-03-01T16:00:00Z",
  "read": false,
  "link": "/reports/monthly/march-2024"
}
```

### Marquer comme Lue

Marque une notification comme lue.

**URL:** `/notifications/{notificationId}/read`

**Method:** `PATCH`

**Authentication Required:** Yes

**Path Parameters:**
- `notificationId` - ID de la notification

**Response:** `200 OK`

```json
{
  "id": "notif-123",
  "type": "info",
  "title": "Nouvelle écriture journal",
  "message": "Une nouvelle écriture a été ajoutée au journal OD",
  "timestamp": "2024-03-01T15:30:00Z",
  "read": true,
  "link": "/journals/entries/456"
}
```

### Marquer comme Non Lue

Marque une notification comme non lue.

**URL:** `/notifications/{notificationId}/unread`

**Method:** `PATCH`

**Authentication Required:** Yes

**Response:** `200 OK`

### Supprimer une Notification

Supprime une notification spécifique.

**URL:** `/notifications/{notificationId}`

**Method:** `DELETE`

**Authentication Required:** Yes

**Response:** `204 No Content`

### Marquer Toutes comme Lues

Marque toutes les notifications de l'utilisateur comme lues.

**URL:** `/notifications/mark-all-read`

**Method:** `POST`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "updated": 12
}
```

### Supprimer Toutes les Notifications

Supprime toutes les notifications de l'utilisateur.

**URL:** `/notifications/all`

**Method:** `DELETE`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "deleted": 45
}
```

### Actions Groupées

Effectue des actions groupées sur plusieurs notifications.

**URL:** `/notifications/bulk-action`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "notificationIds": ["notif-123", "notif-456", "notif-789"],
  "action": "read"
}
```

**Response:** `200 OK`

```json
{
  "updated": 3
}
```

### Nombre de Non Lues

Récupère le nombre de notifications non lues.

**URL:** `/notifications/unread-count`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "count": 12
}
```

### Préférences de Notifications

Récupère les préférences de notifications de l'utilisateur.

**URL:** `/notifications/preferences`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "email": {
    "journal_validation": true,
    "report_generation": false,
    "user_mention": true,
    "system_alerts": true,
    "fiscal_year_closing": true
  },
  "browser": {
    "journal_validation": true,
    "report_generation": true,
    "user_mention": true,
    "system_alerts": true,
    "fiscal_year_closing": true
  }
}
```

### Mettre à jour les Préférences

Met à jour les préférences de notifications.

**URL:** `/notifications/preferences`

**Method:** `PUT`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "email": {
    "report_generation": true
  },
  "browser": {
    "system_alerts": false
  }
}
```

**Response:** `200 OK`

### Types de Notifications

Récupère la liste des types de notifications disponibles.

**URL:** `/notifications/types`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "types": [
    {
      "key": "journal_validation",
      "name": "Validation d'écriture",
      "description": "Notifications lors de la validation des écritures comptables",
      "defaultEnabled": {
        "email": true,
        "browser": true
      }
    },
    {
      "key": "report_generation",
      "name": "Génération de rapport",
      "description": "Notifications lors de la génération des rapports",
      "defaultEnabled": {
        "email": false,
        "browser": true
      }
    }
  ]
}
```

### Notification de Test

Envoie une notification de test.

**URL:** `/notifications/test`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "type": "journal_validation"
}
```

**Response:** `200 OK`

```json
{
  "id": "notif-test-123",
  "type": "info",
  "title": "Test de notification",
  "message": "Ceci est une notification de test pour 'Validation d'écriture'",
  "timestamp": "2024-03-01T16:30:00Z",
  "read": false
}
```

## Frontend Integration

Le hook `useNotifications()` est configuré avec un système de fallback :

1. **Tentative API** : Appel vers les endpoints décrits ci-dessus
2. **Fallback localStorage** : En cas d'échec API, utilisation des données locales
3. **Données mockées** : Si aucune donnée disponible, utilisation des données de démonstration

```typescript
const { 
  notifications, 
  loading, 
  error, 
  unreadCount,
  addNotification, 
  markAsRead,
  deleteNotification,
  markAllAsRead
} = useNotifications();
```

## Error Handling

| Status Code | Description |
|-------------|-------------|
| `200 OK` | The request was successful. |
| `201 Created` | The notification was created successfully. |
| `204 No Content` | The notification was deleted successfully. |
| `400 Bad Request` | The request was malformed or contained invalid parameters. |
| `401 Unauthorized` | The request requires user authentication. |
| `403 Forbidden` | The authenticated user does not have permission to access the resource. |
| `404 Not Found` | The requested notification could not be found. |
| `500 Internal Server Error` | An unexpected error occurred on the server. |
