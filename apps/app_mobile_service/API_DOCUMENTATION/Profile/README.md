# API Profil

Cette documentation détaille les endpoints disponibles pour la gestion du profil utilisateur dans l'application Wanzo.

## Structure du modèle Profil Utilisateur

```json
{
  "id": "string",                        // Identifiant unique de l'utilisateur
  "email": "user@example.com",           // Adresse email
  "name": "John Doe",                    // Nom complet
  "phoneNumber": "+243123456789",        // Numéro de téléphone
  "pictureUrl": "string",                // URL de la photo de profil
  "jobTitle": "string",                  // Titre du poste
  "physicalAddress": "string",           // Adresse physique
  "idCard": "string",                    // Numéro de carte d'identité
  "businessId": "string",                // ID de l'entreprise associée
  "role": "owner",                       // Rôle dans l'application (owner, admin, user)
  "permissions": [                       // Permissions spécifiques
    "sales.create",
    "inventory.read"
  ],
  "preferences": {                       // Préférences utilisateur
    "language": "fr",
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    }
  },
  "lastLoginAt": "2023-08-01T12:30:00.000Z", // Date de dernière connexion
  "createdAt": "2023-07-01T12:30:00.000Z",   // Date de création
  "updatedAt": "2023-08-01T12:30:00.000Z"    // Date de mise à jour
}
```

## Endpoints

### 1. Récupérer le profil utilisateur courant

**Endpoint**: `GET /api/v1/profile`

**Description**: Récupère les informations de profil de l'utilisateur actuellement authentifié.

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    // Structure complète du modèle Profil Utilisateur
  }
}
```

### 2. Mettre à jour le profil utilisateur

**Endpoint**: `PUT /api/v1/profile`

**Description**: Met à jour les informations de profil de l'utilisateur actuellement authentifié.

**Corps de la requête (multipart/form-data)**:
- `name` (optionnel): Nom complet
- `phoneNumber` (optionnel): Numéro de téléphone
- `jobTitle` (optionnel): Titre du poste
- `physicalAddress` (optionnel): Adresse physique
- `idCard` (optionnel): Numéro de carte d'identité
- `picture` (optionnel): Fichier image pour la photo de profil

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "message": "Profil mis à jour avec succès",
    // Structure mise à jour du modèle Profil Utilisateur
  }
}
```

### 3. Changer l'adresse email

**Endpoint**: `POST /api/v1/profile/change-email`

**Description**: Initie le processus de changement d'adresse email de l'utilisateur.

**Corps de la requête**:
```json
{
  "newEmail": "new.email@example.com",
  "password": "currentPassword"
}
```

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "message": "Un email de vérification a été envoyé à votre nouvelle adresse email",
    "verificationExpiresAt": "2023-08-01T13:30:00.000Z"
  }
}
```

### 4. Vérifier la nouvelle adresse email

**Endpoint**: `POST /api/v1/profile/verify-email`

**Description**: Vérifie et confirme le changement d'adresse email avec un code de vérification.

**Corps de la requête**:
```json
{
  "verificationCode": "123456"
}
```

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "message": "Adresse email mise à jour avec succès",
    "email": "new.email@example.com"
  }
}
```

### 5. Mettre à jour les préférences utilisateur

**Endpoint**: `PUT /api/v1/profile/preferences`

**Description**: Met à jour les préférences de l'utilisateur.

**Corps de la requête**:
```json
{
  "language": "fr",
  "theme": "dark",
  "notifications": {
    "email": true,
    "push": true,
    "sms": false
  }
}
```

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "message": "Préférences mises à jour avec succès",
    "preferences": {
      "language": "fr",
      "theme": "dark",
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      }
    }
  }
}
```

### 6. Supprimer la photo de profil

**Endpoint**: `DELETE /api/v1/profile/picture`

**Description**: Supprime la photo de profil actuelle de l'utilisateur.

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "message": "Photo de profil supprimée avec succès",
    "pictureUrl": null
  }
}
```

### 7. Obtenir l'historique d'activité du profil

**Endpoint**: `GET /api/v1/profile/activity`

**Description**: Récupère l'historique d'activité récente de l'utilisateur dans l'application.

**Paramètres de requête (Query Params)**:
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "string",
        "action": "login",
        "description": "Connexion depuis l'application mobile",
        "ipAddress": "192.168.1.1",
        "deviceInfo": "iPhone 13, iOS 15.4",
        "timestamp": "2023-08-01T12:30:00.000Z"
      },
      {
        "id": "string",
        "action": "profile_update",
        "description": "Mise à jour des informations de profil",
        "changedFields": ["name", "phoneNumber"],
        "timestamp": "2023-07-28T15:45:00.000Z"
      }
    ],
    "totalItems": 25,
    "totalPages": 3,
    "currentPage": 1
  }
}
```
