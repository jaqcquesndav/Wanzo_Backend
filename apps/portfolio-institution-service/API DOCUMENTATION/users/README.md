# Gestion des utilisateurs

Ce document décrit les endpoints pour la gestion des utilisateurs dans l'API Wanzo Portfolio Institution.

## Types de données

Les types principaux utilisés dans les API d'utilisateurs sont les suivants:

```typescript
export interface UserSettings {
  notifications?: {
    email?: boolean;
    sms?: boolean;
    app?: boolean;
  };
  theme?: 'light' | 'dark' | 'system';
  dashboard?: {
    defaultView?: string;
    widgets?: string[];
  };
}

export type UserType = 'sme' | 'financial_institution';
export type UserRole = 'Admin' | 'Portfolio_Manager' | 'Auditor' | 'User';
export type IdType = 'passport' | 'national_id' | 'driver_license' | 'other';
export type IdStatus = 'pending' | 'verified' | 'rejected';
export type Language = 'fr' | 'en';

// Utilisateur de base
export interface User {
  id: string;
  email: string;
  emailVerified?: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  phone?: string;
  phoneVerified?: boolean;
  address?: string;
  idNumber?: string;
  idType?: IdType;
  idStatus?: IdStatus;
  role?: UserRole;
  birthdate?: string;
  bio?: string;
  userType?: UserType;
  companyId?: string; 
  financialInstitutionId?: string;
  isCompanyOwner?: boolean;
  createdAt: string;
  updatedAt?: string;
  settings?: UserSettings;
  language?: Language;
  permissions?: string[];
  plan?: string;
  tokenBalance?: number;
  tokenTotal?: number;
}

// Détails complets d'un utilisateur
export interface UserDetails extends User {
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  directReports: Array<{
    id: string;
    name: string;
    position: string;
  }>;
  portfolioAssignments: Array<{
    id: string;
    name: string;
    type: 'traditional' | 'investment' | 'leasing';
  }>;
  activityLog: Array<{
    action: string;
    timestamp: string;
    details?: string;
  }>;
}

// Activité utilisateur
export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

// Rôle utilisateur
export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permission
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}
```

## Liste des utilisateurs

Récupère la liste des utilisateurs avec pagination et filtrage.

**Endpoint** : `GET /users`

**Paramètres de requête** :
- `page` (optionnel) : Numéro de la page
- `limit` (optionnel) : Nombre d'utilisateurs par page
- `role` (optionnel) : Filtre par rôle (ex: Admin, Portfolio_Manager)
- `status` (optionnel) : Filtre par statut (active, inactive, pending)
- `department` (optionnel) : Filtre par département
- `search` (optionnel) : Recherche textuelle (nom, prénom, email)

**Réponse** :

```json
{
  "data": [
    {
      "id": "user123",
      "email": "jean.dupont@exemple.com",
      "name": "Jean Dupont",
      "givenName": "Jean",
      "familyName": "Dupont",
      "picture": "https://example.com/profiles/jean.jpg",
      "phone": "+243810123456",
      "role": "Portfolio_Manager",
      "status": "active",
      "createdAt": "2025-01-15T08:00:00.000Z",
      "updatedAt": "2025-07-20T10:30:00.000Z"
    },
    // ... autres utilisateurs
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

## Détails d'un utilisateur

Récupère les détails complets d'un utilisateur spécifique.

**Endpoint** : `GET /users/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Réponse** :

```json
{
  "id": "user123",
  "email": "jean.dupont@exemple.com",
  "name": "Jean Dupont",
  "givenName": "Jean",
  "familyName": "Dupont",
  "picture": "https://example.com/profiles/jean.jpg",
  "phone": "+243810123456",
  "phoneVerified": true,
  "address": "123 Rue de la Paix, Kinshasa",
  "role": "Portfolio_Manager",
  "permissions": ["read:users", "write:portfolios", "read:reports"],
  "language": "fr",
  "userType": "financial_institution",
  "manager": {
    "id": "user456",
    "name": "Marie Martin",
    "email": "marie.martin@exemple.com"
  },
  "directReports": [
    {
      "id": "user789",
      "name": "Paul Petit",
      "position": "Analyste crédit"
    }
  ],
  "portfolioAssignments": [
    {
      "id": "portfolio123",
      "name": "Portefeuille PME",
      "type": "traditional"
    }
  ],
  "activityLog": [
    {
      "action": "login",
      "timestamp": "2025-07-23T09:15:00.000Z",
      "details": "Connexion depuis 192.168.1.100"
    }
  ],
  "createdAt": "2025-01-15T08:00:00.000Z",
  "updatedAt": "2025-07-20T10:30:00.000Z"
}
```

## Création d'un utilisateur

Crée un nouvel utilisateur dans le système.

**Endpoint** : `POST /users`

**Corps de la requête** :

```json
{
  "email": "thomas.dubois@exemple.com",
  "name": "Thomas Dubois",
  "givenName": "Thomas",
  "familyName": "Dubois",
  "phone": "+243810789012",
  "role": "Auditor",
  "userType": "financial_institution",
  "permissions": ["read:portfolios", "read:reports", "write:risk"],
  "sendInvitation": true
}
```

**Réponse** :

```json
{
  "id": "user456",
  "email": "thomas.dubois@exemple.com",
  "name": "Thomas Dubois",
  "givenName": "Thomas",
  "familyName": "Dubois",
  "phone": "+243810789012",
  "role": "Auditor",
  "userType": "financial_institution",
  "invitationSent": true,
  "createdAt": "2025-07-24T15:30:00.000Z",
  "updatedAt": "2025-07-24T15:30:00.000Z"
}
```

## Mise à jour d'un utilisateur

Met à jour les informations d'un utilisateur existant.

**Endpoint** : `PUT /users/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Corps de la requête** :

```json
{
  "name": "Thomas Dubois-Martin",
  "role": "Portfolio_Manager",
  "permissions": ["read:portfolios", "write:portfolios", "read:reports"]
}
```

**Réponse** :

```json
{
  "id": "user456",
  "email": "thomas.dubois@exemple.com",
  "name": "Thomas Dubois-Martin",
  "givenName": "Thomas",
  "familyName": "Dubois-Martin",
  "phone": "+243810789012",
  "role": "Portfolio_Manager",
  "userType": "financial_institution",
  "createdAt": "2025-07-24T15:30:00.000Z",
  "updatedAt": "2025-07-24T16:45:00.000Z"
}
```

## Suppression d'un utilisateur

Supprime un utilisateur du système.

**Endpoint** : `DELETE /users/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Réponse** : 204 No Content

## Réinitialisation du mot de passe

Réinitialise le mot de passe d'un utilisateur et envoie un email avec les instructions.

**Endpoint** : `POST /users/{id}/reset-password`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'utilisateur

**Réponse** :

```json
{
  "success": true,
  "message": "Instructions de réinitialisation envoyées par email"
}
```

## Assignation de portefeuille

Assigne un portefeuille à un utilisateur avec un rôle spécifique.

**Endpoint** : `POST /users/{userId}/portfolios`

**Paramètres de chemin** :
- `userId` : Identifiant unique de l'utilisateur

**Corps de la requête** :

```json
{
  "portfolioId": "portfolio123",
  "role": "manager"
}
```

**Réponse** :

```json
{
  "userId": "user456",
  "portfolioId": "portfolio123",
  "role": "manager",
  "assignedAt": "2025-07-24T17:00:00.000Z"
}
```

## Suppression d'assignation de portefeuille

Supprime l'assignation d'un portefeuille à un utilisateur.

**Endpoint** : `DELETE /users/{userId}/portfolios/{portfolioId}`

**Paramètres de chemin** :
- `userId` : Identifiant unique de l'utilisateur
- `portfolioId` : Identifiant unique du portefeuille

**Réponse** : 204 No Content

## Utilisateur courant

Récupère les informations sur l'utilisateur actuellement authentifié.

**Endpoint** : `GET /users/me`

**Réponse** :

```json
{
  "id": "user123",
  "email": "jean.dupont@exemple.com",
  "name": "Jean Dupont",
  "givenName": "Jean",
  "familyName": "Dupont",
  "picture": "https://example.com/profiles/jean.jpg",
  "phone": "+243810123456",
  "role": "Portfolio_Manager",
  "permissions": ["read:users", "write:portfolios", "read:reports"],
  "settings": {
    "notifications": {
      "email": true,
      "sms": true,
      "app": false
    },
    "theme": "dark",
    "dashboard": {
      "widgets": ["performance", "risk", "payments"]
    }
  },
  "language": "fr",
  "createdAt": "2025-01-15T08:00:00.000Z",
  "updatedAt": "2025-07-24T09:00:00.000Z"
}
```

## Mise à jour des préférences utilisateur

Met à jour les préférences de l'utilisateur actuellement authentifié.

**Endpoint** : `PUT /users/me/preferences`

**Corps de la requête** :

```json
{
  "theme": "light",
  "notifications": {
    "sms": true,
    "app": true
  },
  "dashboard": {
    "widgets": ["performance", "risk", "payments", "alerts"]
  }
}
```

**Réponse** :

```json
{
  "id": "user123",
  "settings": {
    "notifications": {
      "email": true,
      "sms": true,
      "app": true
    },
    "theme": "light",
    "dashboard": {
      "widgets": ["performance", "risk", "payments", "alerts"]
    }
  },
  "updatedAt": "2025-07-24T10:15:00.000Z"
}
```

## Rôles utilisateur

Récupère la liste des rôles disponibles dans le système.

**Endpoint** : `GET /users/roles`

**Réponse** :

```json
[
  {
    "id": "role1",
    "name": "Admin",
    "description": "Administrateur système avec tous les droits",
    "permissions": ["*"],
    "isSystem": true,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "role2",
    "name": "Portfolio_Manager",
    "description": "Gestionnaire de portefeuilles",
    "permissions": ["read:users", "write:portfolios", "read:reports", "write:reports"],
    "isSystem": true,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

## Permissions

Récupère la liste des permissions disponibles dans le système.

**Endpoint** : `GET /users/permissions`

**Réponse** :

```json
[
  {
    "id": "perm1",
    "name": "read:users",
    "description": "Voir les utilisateurs",
    "category": "users"
  },
  {
    "id": "perm2",
    "name": "write:portfolios",
    "description": "Créer et modifier des portefeuilles",
    "category": "portfolios"
  }
]
```

## Activité utilisateur

Récupère les logs d'activité des utilisateurs avec filtrage.

**Endpoint** : `GET /users/activity`

**Paramètres de requête** :
- `userId` (optionnel) : Filtre par utilisateur
- `action` (optionnel) : Filtre par type d'action
- `startDate` (optionnel) : Date de début (format ISO)
- `endDate` (optionnel) : Date de fin (format ISO)
- `page` (optionnel) : Numéro de la page
- `limit` (optionnel) : Nombre d'entrées par page

**Réponse** :

```json
{
  "data": [
    {
      "id": "act1",
      "userId": "user123",
      "userName": "Jean Dupont",
      "action": "login",
      "entity": "auth",
      "details": "Connexion réussie",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-07-24T09:00:00.000Z"
    },
    {
      "id": "act2",
      "userId": "user123",
      "userName": "Jean Dupont",
      "action": "view",
      "entity": "portfolio",
      "entityId": "portfolio123",
      "details": "Consultation du portefeuille PME",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-07-24T09:05:00.000Z"
    }
  ],
  "meta": {
    "total": 145,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

## Erreurs spécifiques

| Code HTTP | Code d'erreur         | Description                                  |
|-----------|------------------------|----------------------------------------------|
| 400       | INVALID_USER_DATA      | Données utilisateur invalides                |
| 404       | USER_NOT_FOUND         | Utilisateur non trouvé                       |
| 409       | EMAIL_ALREADY_EXISTS   | Email déjà utilisé par un autre utilisateur  |
| 403       | INSUFFICIENT_PERMISSIONS | Permissions insuffisantes                    |
  }
}
```









## Erreurs spécifiques

| Code HTTP | Code d'erreur         | Description                                  |
|-----------|------------------------|----------------------------------------------|
| 400       | INVALID_USER_DATA      | Données utilisateur invalides                |
| 404       | USER_NOT_FOUND         | Utilisateur non trouvé                       |
| 409       | EMAIL_ALREADY_EXISTS   | Email déjà utilisé par un autre utilisateur  |
| 403       | INSUFFICIENT_PERMISSIONS | Permissions insuffisantes                    |
