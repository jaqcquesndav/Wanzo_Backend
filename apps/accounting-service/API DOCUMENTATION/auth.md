# Documentation de l'API d'Authentification

Ce document décrit les points de terminaison de l'API d'authentification pour l'application Wanzo Compta, qui s'appuie sur **Auth0** pour la gestion des identités et une **API Gateway** pour le routage des requêtes.

## Flux d'Authentification Général

1.  **Connexion Côté Client** : L'utilisateur est redirigé vers la page de connexion hébergée par Auth0.
2.  **Émission du Jeton** : Après une authentification réussie, Auth0 émet un jeton JWT à l'application cliente.
3.  **Appel à l'API Gateway** : L'application cliente envoie ce jeton JWT à l'API Gateway, qui route la requête vers le microservice d'authentification.
4.  **Vérification du Jeton** : Le backend valide le jeton JWT avec Auth0 et autorise l'accès aux ressources protégées.

## Base URL

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentification

Toutes les requêtes vers les points de terminaison protégés doivent inclure le jeton JWT émis par Auth0 dans l'en-tête `Authorization` et un en-tête client personnalisé.

**En-têtes :**
```
Authorization: Bearer <auth0_jwt_token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
```

## Points de terminaison

### Vérifier le Jeton et Récupérer l'Utilisateur

Ce point de terminaison est appelé après que le client a obtenu un jeton d'Auth0. Il vérifie la validité du jeton et, en cas de succès, renvoie les informations de l'utilisateur correspondant dans la base de données de l'application. Si l'utilisateur n'existe pas, il peut être créé à la volée (JIT Provisioning).

**URL :** `/auth/verify`

**Méthode :** `GET`

**Authentification Requise :** Oui (Jeton Bearer Auth0)

**Réponse :**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "comptable",
      "registrationNumber": "12345" // Seulement pour les auditeurs
    }
  }
}
```

### Déconnexion

Invalide la session de l'utilisateur côté backend. La déconnexion côté client (suppression du jeton local et déconnexion d'Auth0) est gérée par le SDK Auth0.

**URL :** `/auth/logout`

**Méthode :** `POST`

**Authentification Requise :** Oui

**Corps de la requête :**
```json
{}
```

**Réponse :**

```json
{
  "success": true
}
```

### Connexion avec KS Auth (SSO)

Ce point de terminaison initie une connexion via le système SSO interne (KS Auth). Il est conçu pour les employés internes et ne nécessite pas de redirection vers Auth0.

**URL :** `/auth/sso`

**Méthode :** `POST`

**Authentification Requise :** Non (généralement basé sur des cookies de session ou d'autres mécanismes internes)

**Corps de la requête :**
```json
{}
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-sso-456",
      "email": "employee@wanzo.com",
      "name": "Jane Doe",
      "role": "admin"
    },
    "token": "<jwt_token_pour_session>"
  }
}
```

## Erreurs

**Jeton invalide (401):**
```json
{
  "success": false,
  "error": "Jeton invalide ou expiré"
}
```

**Autres Erreurs:**
```json
{
  "success": false,
  "error": "Description de l'erreur"
}
```

## Gestion des Utilisateurs

### Récupérer Tous les Utilisateurs

Récupère la liste de tous les utilisateurs de l'organisation.

**URL :** `/users`

**Méthode :** `GET`

**Authentification Requise :** Oui (Rôle Admin requis)

**Réponse :** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "admin@kiota.com",
      "name": "Super Administrateur",
      "role": "superadmin",
      "department": "Direction",
      "lastLogin": "2024-03-01T15:30:00Z",
      "status": "active",
      "avatar": "https://..."
    },
    {
      "id": "user-124",
      "email": "comptable@kiota.com",
      "name": "Jean Dupont",
      "role": "user",
      "department": "Comptabilité",
      "lastLogin": "2024-03-01T14:45:00Z",
      "status": "active",
      "avatar": "https://..."
    }
  ]
}
```

### Créer un Utilisateur

Crée un nouvel utilisateur dans l'organisation.

**URL :** `/users`

**Méthode :** `POST`

**Authentification Requise :** Oui (Rôle Admin requis)

**Corps de la requête**:
```json
{
  "email": "new.user@example.com",
  "name": "Jane Doe",
  "role": "user",
  "department": "Ventes"
}
```

**Réponse :** `201 Created`


### Mettre à Jour un Utilisateur

Met à jour les informations d'un utilisateur existant.

**URL :** `/users/{id}`

**Méthode :** `PUT`

**Authentification Requise :** Oui (Rôle Admin requis)

**Corps de la requête**:
```json
{
  "name": "Jane Smith",
  "role": "admin",
  "department": "Marketing"
}
```

**Réponse :** `200 OK`

### Supprimer un Utilisateur

Supprime un compte utilisateur.

**URL :** `/users/{id}`

**Méthode :** `DELETE`

**Authentification Requise :** Oui (Rôle Admin requis)

**Réponse :** `204 No Content`

### Activer/Désactiver un Utilisateur

Active ou désactive un compte utilisateur.

**URL :** `/users/{id}/status`

**Méthode :** `PATCH`

**Authentification Requise :** Oui (Rôle Admin requis)

**Corps de la requête**:
```json
{
  "active": false
}
```

**Réponse :** `200 OK`

## Structures de Données

### Utilisateur

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  role: 'superadmin' | 'admin' | 'user' | 'auditor' | 'comptable' | 'gérant' | 'portfoliomanager';
  registrationNumber?: string; // Pour les auditeurs
  department?: string;
  lastLogin?: string;
  status?: 'active' | 'inactive';
  avatar?: string;
}
```
