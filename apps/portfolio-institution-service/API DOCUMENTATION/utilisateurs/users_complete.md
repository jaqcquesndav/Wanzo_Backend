# Gestion des utilisateurs - Documentation complète

Ce document décrit tous les endpoints pour la gestion des utilisateurs dans l'API Wanzo Portfolio Institution basés sur le UserController réellement implémenté.

## Endpoints de gestion des utilisateurs

### Liste des utilisateurs

Récupère tous les utilisateurs de l'institution.

**Endpoint** : `GET /users`

**Permissions requises** : `admin`, `manager`

**Paramètres de requête** :
- `role` (optionnel) : Filtre par rôle
- `status` (optionnel) : Filtre par statut  
- `department` (optionnel) : Filtre par département
- `search` (optionnel) : Recherche dans nom/email

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "Jean Dupont",
      "email": "jean.dupont@exemple.com",
      "role": "portfolio_manager",
      "status": "active",
      "institutionId": "inst-456",
      "createdAt": "2025-01-15T08:00:00.000Z",
      "updatedAt": "2025-11-10T10:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

### Profil utilisateur courant

Récupère le profil de l'utilisateur actuellement authentifié.

**Endpoint** : `GET /users/profile`

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "Jean Dupont",
    "email": "jean.dupont@exemple.com",
    "role": "portfolio_manager",
    "status": "active",
    "institutionId": "inst-456",
    "permissions": ["read:portfolios", "write:portfolios"],
    "preferences": {
      "theme": "dark",
      "language": "fr",
      "notifications": {
        "email": true,
        "sms": false
      }
    },
    "createdAt": "2025-01-15T08:00:00.000Z",
    "updatedAt": "2025-11-10T10:30:00.000Z"
  }
}
```

### Détails d'un utilisateur

Récupère les détails complets d'un utilisateur spécifique.

**Endpoint** : `GET /users/{id}`

**Permissions requises** : `admin`, `manager`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "Jean Dupont",
    "email": "jean.dupont@exemple.com",
    "phone": "+243810123456",
    "role": "portfolio_manager",
    "status": "active",
    "department": "Credit",
    "institutionId": "inst-456",
    "permissions": ["read:portfolios", "write:portfolios", "read:contracts"],
    "createdAt": "2025-01-15T08:00:00.000Z",
    "updatedAt": "2025-11-10T10:30:00.000Z"
  }
}
```

### Création d'un utilisateur

Crée un nouvel utilisateur dans l'institution.

**Endpoint** : `POST /users`

**Permissions requises** : `admin`

**Corps de la requête** :

```json
{
  "name": "Marie Martin",
  "email": "marie.martin@exemple.com",
  "phone": "+243810987654",
  "role": "analyst",
  "department": "Risk Management",
  "permissions": ["read:portfolios", "read:reports"]
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "user-789",
    "name": "Marie Martin",
    "email": "marie.martin@exemple.com",
    "phone": "+243810987654",
    "role": "analyst",
    "status": "active",
    "department": "Risk Management",
    "institutionId": "inst-456",
    "permissions": ["read:portfolios", "read:reports"],
    "createdAt": "2025-11-10T15:30:00.000Z",
    "updatedAt": "2025-11-10T15:30:00.000Z"
  }
}
```

### Mise à jour d'un utilisateur

Met à jour les informations d'un utilisateur existant.

**Endpoint** : `PUT /users/{id}`

**Permissions requises** : `admin`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Corps de la requête** :

```json
{
  "name": "Marie Martin-Dubois",
  "phone": "+243810987655",
  "role": "manager",
  "department": "Risk Management",
  "permissions": ["read:portfolios", "write:portfolios", "read:reports", "manage:users"]
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "user-789",
    "name": "Marie Martin-Dubois",
    "email": "marie.martin@exemple.com",
    "phone": "+243810987655",
    "role": "manager",
    "status": "active",
    "department": "Risk Management",
    "institutionId": "inst-456",
    "permissions": ["read:portfolios", "write:portfolios", "read:reports", "manage:users"],
    "updatedAt": "2025-11-10T16:00:00.000Z"
  }
}
```

### Changement de statut utilisateur

Change le statut d'un utilisateur (active, inactive, suspended).

**Endpoint** : `PATCH /users/{id}/status`

**Permissions requises** : `admin`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Corps de la requête** :

```json
{
  "status": "inactive",
  "reason": "Fin de contrat"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "user-789",
    "name": "Marie Martin-Dubois",
    "status": "inactive",
    "statusReason": "Fin de contrat",
    "updatedAt": "2025-11-10T16:15:00.000Z"
  }
}
```

### Suppression d'un utilisateur

Supprime définitivement un utilisateur du système.

**Endpoint** : `DELETE /users/{id}`

**Permissions requises** : `admin`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Endpoints d'activité utilisateur

### Activités d'un utilisateur

Récupère l'historique des activités d'un utilisateur spécifique.

**Endpoint** : `GET /users/{id}/activities`

**Permissions requises** : `admin`, `manager`, `analyst`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "activity-123",
      "userId": "user-789",
      "action": "LOGIN",
      "entity": "authentication",
      "description": "User logged in successfully",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-11-10T09:00:00.000Z"
    },
    {
      "id": "activity-124", 
      "userId": "user-789",
      "action": "VIEW_PORTFOLIO",
      "entity": "portfolio",
      "entityId": "portfolio-456",
      "description": "Viewed portfolio PME Nord-Kivu",
      "timestamp": "2025-11-10T09:15:00.000Z"
    }
  ]
}
```

## Endpoints de préférences utilisateur

### Récupération des préférences

Récupère les préférences d'un utilisateur, optionnellement filtrées par catégorie.

**Endpoint** : `GET /users/{id}/preferences`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Paramètres de requête** :
- `category` (optionnel) : Catégorie de préférences (GENERAL, NOTIFICATIONS, DASHBOARD, SECURITY)

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "pref-123",
      "userId": "user-789",
      "category": "GENERAL",
      "key": "theme",
      "value": "dark",
      "createdAt": "2025-11-10T08:00:00.000Z",
      "updatedAt": "2025-11-10T16:30:00.000Z"
    },
    {
      "id": "pref-124",
      "userId": "user-789", 
      "category": "NOTIFICATIONS",
      "key": "email_enabled",
      "value": "true",
      "createdAt": "2025-11-10T08:30:00.000Z",
      "updatedAt": "2025-11-10T08:30:00.000Z"
    }
  ]
}
```

### Définition d'une préférence

Définit ou met à jour une préférence utilisateur.

**Endpoint** : `POST /users/{id}/preferences`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Corps de la requête** :

```json
{
  "category": "DASHBOARD",
  "key": "default_view",
  "value": "portfolio_overview"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "pref-125",
    "userId": "user-789",
    "category": "DASHBOARD",
    "key": "default_view", 
    "value": "portfolio_overview",
    "createdAt": "2025-11-10T16:45:00.000Z",
    "updatedAt": "2025-11-10T16:45:00.000Z"
  }
}
```

### Suppression d'une préférence

Supprime une préférence utilisateur spécifique.

**Endpoint** : `DELETE /users/{id}/preferences/{preferenceId}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur  
- `preferenceId` : Identifiant unique de la préférence

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "Preference deleted successfully"
}
```

## Endpoints de sessions utilisateur

### Sessions actives d'un utilisateur

Récupère toutes les sessions actives d'un utilisateur.

**Endpoint** : `GET /users/{id}/sessions`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "session-123",
      "userId": "user-789",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "deviceType": "desktop",
      "deviceName": "Windows PC",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "location": "Kinshasa, DRC",
      "isActive": true,
      "lastActivity": "2025-11-10T16:30:00.000Z",
      "createdAt": "2025-11-10T09:00:00.000Z",
      "expiresAt": "2025-11-11T09:00:00.000Z"
    }
  ]
}
```

### Terminer une session spécifique

Termine une session utilisateur spécifique.

**Endpoint** : `DELETE /users/{id}/sessions/{sessionId}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur
- `sessionId` : Identifiant unique de la session

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "Session terminated successfully"
}
```

### Terminer toutes les sessions

Termine toutes les sessions d'un utilisateur, avec option d'exclure la session courante.

**Endpoint** : `DELETE /users/{id}/sessions`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Paramètres de requête** :
- `exceptCurrent` (optionnel, booléen) : Exclure la session courante de la terminaison

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "All sessions terminated successfully"
}
```

## Structures de données

### UserSearchFilterDto

```typescript
interface UserSearchFilterDto {
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
  department?: string;
  search?: string;
}
```

### CreateUserDto

```typescript
interface CreateUserDto {
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  permissions?: string[];
  institutionId?: string; // Automatiquement assigné depuis l'utilisateur authentifié
}
```

### UpdateUserDto

```typescript
interface UpdateUserDto {
  name?: string;
  phone?: string;
  role?: string;
  department?: string;
  permissions?: string[];
}
```

### ChangeUserStatusDto

```typescript
interface ChangeUserStatusDto {
  status: 'active' | 'inactive' | 'suspended';
  reason?: string;
}
```

### UserPreferenceDto

```typescript
interface UserPreferenceDto {
  category: 'GENERAL' | 'NOTIFICATIONS' | 'DASHBOARD' | 'SECURITY';
  key: string;
  value: string;
}
```

### PreferenceCategory

```typescript
enum PreferenceCategory {
  GENERAL = 'GENERAL',
  NOTIFICATIONS = 'NOTIFICATIONS', 
  DASHBOARD = 'DASHBOARD',
  SECURITY = 'SECURITY'
}
```

## Codes d'erreur spécifiques

| Code HTTP | Code d'erreur | Description |
|-----------|---------------|-------------|
| 400 | INVALID_USER_DATA | Données utilisateur invalides |
| 401 | UNAUTHORIZED | Token d'authentification manquant ou invalide |
| 403 | INSUFFICIENT_PERMISSIONS | Permissions insuffisantes pour cette action |
| 404 | USER_NOT_FOUND | Utilisateur non trouvé |
| 409 | EMAIL_ALREADY_EXISTS | Email déjà utilisé par un autre utilisateur |
| 409 | USER_ALREADY_EXISTS | Utilisateur déjà existant |

## Permissions requises

### Rôles et permissions

- **admin** : Accès complet à tous les endpoints utilisateur
- **manager** : Lecture des utilisateurs, gestion des activités
- **analyst** : Lecture des activités utilisateur uniquement
- **user** : Accès uniquement à son propre profil et préférences

### Matrice des permissions

| Endpoint | Admin | Manager | Analyst | User |
|----------|-------|---------|---------|------|
| GET /users | ✅ | ✅ | ❌ | ❌ |
| GET /users/profile | ✅ | ✅ | ✅ | ✅ |
| GET /users/{id} | ✅ | ✅ | ❌ | ❌* |
| POST /users | ✅ | ❌ | ❌ | ❌ |
| PUT /users/{id} | ✅ | ❌ | ❌ | ❌* |
| DELETE /users/{id} | ✅ | ❌ | ❌ | ❌ |
| GET /users/{id}/activities | ✅ | ✅ | ✅ | ❌* |
| GET /users/{id}/preferences | ✅ | ✅ | ❌ | ✅* |
| POST /users/{id}/preferences | ✅ | ✅ | ❌ | ✅* |
| GET /users/{id}/sessions | ✅ | ❌ | ❌ | ✅* |
| DELETE /users/{id}/sessions/{sessionId} | ✅ | ❌ | ❌ | ✅* |

*\* Uniquement pour ses propres données*

---

*Documentation mise à jour le 10 novembre 2025 basée sur le UserController réellement implémenté dans le portfolio-institution-service.*