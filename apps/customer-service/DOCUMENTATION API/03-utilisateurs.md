# Gestion des Utilisateurs

## Structure des données utilisateur

Les utilisateurs dans le système Wanzo sont représentés par la structure suivante :

```json
{
  "id": "usr_12345abcde",
  "email": "user@example.com",
  "emailVerified": true,
  "name": "Jean Mutombo",
  "givenName": "Jean",
  "familyName": "Mutombo",
  "picture": "https://cdn.example.com/avatars/jean.jpg",
  "phone": "+243810987654",
  "phoneVerified": false,
  "address": "123, Avenue de la Libération, Kinshasa",
  "idNumber": "RDC123456789",
  "idType": "national_id",
  "idStatus": "verified",
  "role": "admin",
  "birthdate": "1985-06-15",
  "bio": "Entrepreneur et consultant en développement des affaires",
  "userType": "sme",
  "companyId": "comp-123",
  "financialInstitutionId": null,
  "isCompanyOwner": true,
  "createdAt": "2023-10-15T14:30:00Z",
  "updatedAt": "2023-11-20T09:45:00Z",
  "settings": {
    "notifications": {
      "email": true,
      "sms": true,
      "push": false
    },
    "security": {
      "twoFactorEnabled": false,
      "twoFactorMethod": null,
      "lastPasswordChange": "2023-10-15T14:30:00Z"
    },
    "preferences": {
      "theme": "light",
      "language": "fr",
      "currency": "USD"
    }
  },
  "language": "fr",
  "permissions": ["admin:company", "view:reports", "edit:profile"],
  "plan": "Business",
  "tokenBalance": 150,
  "tokenTotal": 500
}
```

## Endpoints API

### Récupérer le profil utilisateur courant

```
GET /land/api/v1/users/me
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "usr_12345abcde",
    "email": "user@example.com",
    "name": "Jean Mutombo",
    "userType": "sme",
    "companyId": "comp-123",
    // ... autres champs de l'utilisateur
  }
}
```

### Mettre à jour le profil utilisateur

```
PATCH /land/api/v1/users/me
```

#### Corps de la requête

```json
{
  "name": "Jean Luc Mutombo",
  "phone": "+243820123456",
  "address": "456, Boulevard du 30 Juin, Kinshasa",
  "language": "fr",
  "settings": {
    "notifications": {
      "sms": false
    },
    "preferences": {
      "theme": "dark"
    }
  }
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "usr_12345abcde",
    "email": "user@example.com",
    "name": "Jean Luc Mutombo",
    "phone": "+243820123456",
    "address": "456, Boulevard du 30 Juin, Kinshasa",
    "language": "fr",
    // ... autres champs mis à jour
  }
}
```

### Changer le type d'utilisateur

```
PATCH /land/api/v1/users/me/type
```

#### Corps de la requête

```json
{
  "userType": "financial_institution"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "usr_12345abcde",
    "userType": "financial_institution",
    "message": "Type d'utilisateur mis à jour avec succès"
  }
}
```

### Vérifier un numéro de téléphone

```
POST /land/api/v1/users/verify-phone
```

#### Corps de la requête

```json
{
  "phone": "+243820123456",
  "code": "123456"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "phoneVerified": true,
    "message": "Numéro de téléphone vérifié avec succès"
  }
}
```

### Télécharger une pièce d'identité

```
POST /land/api/v1/users/identity-document
Content-Type: multipart/form-data
```

#### Corps de la requête

```
idType: national_id
idDocument: [FILE]
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "idType": "national_id",
    "idStatus": "pending",
    "message": "Document d'identité téléchargé avec succès et en attente de vérification"
  }
}
```

## Permissions et rôles

Les utilisateurs peuvent avoir différentes permissions selon leur rôle :

### Rôles prédéfinis

- **admin** : Accès complet à toutes les fonctionnalités
- **user** : Accès limité aux fonctionnalités de base
- **viewer** : Accès en lecture seule

### Permissions

Les permissions sont plus granulaires et définissent ce qu'un utilisateur peut faire :

- `view:profile` : Voir son profil
- `edit:profile` : Modifier son profil
- `admin:company` : Administrer une entreprise
- `admin:financial_institution` : Administrer une institution financière
- `view:reports` : Voir les rapports
- `manage:users` : Gérer les utilisateurs
- `manage:subscriptions` : Gérer les abonnements

## Événements du cycle de vie

### Création d'un compte

Lorsqu'un utilisateur s'inscrit via Auth0, un profil utilisateur de base est automatiquement créé. L'utilisateur est ensuite invité à compléter son profil.

### Complétion du profil

La complétion du profil détermine si l'utilisateur est associé à une PME ou à une institution financière.

### Vérification de l'identité

La vérification de l'identité (email, téléphone, document d'identité) augmente le niveau de confiance de l'utilisateur et débloque certaines fonctionnalités.

### Suppression de compte

```
DELETE /land/api/v1/users/me
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Compte supprimé avec succès"
  }
}
```

## Notifications et préférences

Les utilisateurs peuvent configurer leurs préférences de notification via l'API :

```
PATCH /land/api/v1/users/me/preferences
```

#### Corps de la requête

```json
{
  "notifications": {
    "email": true,
    "sms": false,
    "push": true
  },
  "theme": "dark",
  "language": "fr"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Préférences mises à jour avec succès",
    "settings": {
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      },
      "preferences": {
        "theme": "dark",
        "language": "fr"
      }
    }
  }
}
```
