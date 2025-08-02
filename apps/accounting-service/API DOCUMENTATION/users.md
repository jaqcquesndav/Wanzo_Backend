# Users API Documentation

Ce document décrit les endpoints API de gestion des utilisateurs pour l'application Wanzo Compta. Note: Entreprise = Organisation = Company dans le contexte de cette API.

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

> **⚠️ STATUT**: Ces endpoints sont nouvellement créés pour la production. Le frontend utilise actuellement un fallback vers des données mockées en cas d'indisponibilité de l'API.

## Endpoints

### Obtenir tous les Utilisateurs

Récupère la liste de tous les utilisateurs de l'organisation.

**URL:** `/users`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Number of users per page (default: 20)
- `role` (optional) - Filter by role ('admin', 'accountant', 'viewer')
- `status` (optional) - Filter by status ('active', 'inactive', 'pending')

**Response:** `200 OK`

```json
{
  "users": [
    {
      "id": "user-123",
      "email": "jean.dupont@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "role": "accountant",
      "status": "active",
      "permissions": [
        "view_journals",
        "create_entries",
        "validate_entries"
      ],
      "organizationId": "org-456",
      "createdAt": "2024-01-15T10:30:45Z",
      "lastLoginAt": "2024-03-15T14:20:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Obtenir un Utilisateur

Récupère les détails d'un utilisateur spécifique.

**URL:** `/users/{userId}`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "id": "user-123",
  "email": "jean.dupont@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "accountant",
  "status": "active",
  "permissions": [
    "view_journals",
    "create_entries",
    "validate_entries"
  ],
  "preferences": {
    "language": "fr",
    "dateFormat": "DD/MM/YYYY",
    "theme": "light"
  },
  "organizationId": "org-456",
  "createdAt": "2024-01-15T10:30:45Z",
  "lastLoginAt": "2024-03-15T14:20:30Z"
}
```

### Créer un Utilisateur

Crée un nouvel utilisateur dans l'organisation.

**URL:** `/users`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "email": "marie.martin@example.com",
  "firstName": "Marie",
  "lastName": "Martin",
  "role": "accountant",
  "permissions": [
    "view_journals",
    "create_entries"
  ]
}
```

**Response:** `201 Created`

```json
{
  "id": "user-789",
  "email": "marie.martin@example.com",
  "firstName": "Marie",
  "lastName": "Martin",
  "role": "accountant",
  "status": "pending",
  "permissions": [
    "view_journals",
    "create_entries"
  ],
  "organizationId": "org-456",
  "createdAt": "2024-03-20T09:15:22Z",
  "invitationSent": true
}
```

### Mettre à jour un Utilisateur

Met à jour les informations d'un utilisateur.

**URL:** `/users/{userId}`

**Method:** `PUT`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "firstName": "Jean-Pierre",
  "lastName": "Dupont",
  "role": "admin",
  "permissions": [
    "view_journals",
    "create_entries",
    "validate_entries",
    "manage_users"
  ],
  "status": "active"
}
```

**Response:** `200 OK`

```json
{
  "id": "user-123",
  "email": "jean.dupont@example.com",
  "firstName": "Jean-Pierre",
  "lastName": "Dupont",
  "role": "admin",
  "status": "active",
  "permissions": [
    "view_journals",
    "create_entries",
    "validate_entries",
    "manage_users"
  ],
  "organizationId": "org-456",
  "updatedAt": "2024-03-20T10:45:33Z"
}
```

### Désactiver un Utilisateur

Désactive un utilisateur (soft delete).

**URL:** `/users/{userId}/deactivate`

**Method:** `PUT`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Utilisateur désactivé avec succès"
}
```

### Réinviter un Utilisateur

Renvoie une invitation à un utilisateur en statut pending.

**URL:** `/users/{userId}/reinvite`

**Method:** `POST`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Invitation renvoyée avec succès"
}
```

### Obtenir les Permissions Disponibles

Récupère la liste des permissions disponibles dans le système.

**URL:** `/users/permissions`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "permissions": [
    {
      "code": "view_journals",
      "name": "Consulter les journaux",
      "category": "journals"
    },
    {
      "code": "create_entries",
      "name": "Créer des écritures",
      "category": "journals"
    },
    {
      "code": "validate_entries",
      "name": "Valider des écritures",
      "category": "journals"
    },
    {
      "code": "manage_users",
      "name": "Gérer les utilisateurs",
      "category": "administration"
    },
    {
      "code": "view_reports",
      "name": "Consulter les rapports",
      "category": "reports"
    },
    {
      "code": "export_data",
      "name": "Exporter les données",
      "category": "data"
    }
  ]
}
```

## Structures de Données

### Utilisateur

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'accountant' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  permissions: string[];
  preferences?: {
    language: string;
    dateFormat: string;
    theme: string;
  };
  organizationId: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  invitationSent?: boolean;
}
```

### Rôles Prédéfinis

- **admin**: Accès complet à toutes les fonctionnalités
- **accountant**: Accès aux opérations comptables et aux rapports
- **viewer**: Accès en lecture seule aux données

### Statuts Utilisateur

- **active**: Utilisateur actif et opérationnel
- **inactive**: Utilisateur désactivé
- **pending**: Invitation envoyée, en attente d'acceptation

## Gestion des Erreurs

Toutes les erreurs suivent la même structure de réponse:

**Response:** `400 Bad Request` / `401 Unauthorized` / `403 Forbidden` / `404 Not Found` / `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": {
    "field_name": ["Erreur spécifique pour ce champ"]
  }
}
```
