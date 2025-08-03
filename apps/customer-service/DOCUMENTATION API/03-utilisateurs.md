# Gestion des Utilisateurs

## Structure des données utilisateur

Basée sur l'interface `User` du code source (`src/types/user.ts`) et le service `UserService` (`src/services/user.ts`) :

```typescript
interface User {
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
  idType?: 'passport' | 'national_id' | 'driver_license' | 'other';
  idStatus?: 'pending' | 'verified' | 'rejected';
  role?: string;
  birthdate?: string;
  bio?: string;
  userType?: 'sme' | 'financial_institution';
  companyId?: string;
  financialInstitutionId?: string;
  isCompanyOwner?: boolean;
  createdAt: string;
  updatedAt?: string;
  settings?: UserSettings;
  language?: 'fr' | 'en';
  permissions?: string[];
  plan?: string;
  tokenBalance?: number;
  tokenTotal?: number;
}
```

## Endpoints API

### Récupérer le profil utilisateur courant

```
GET /users/me
```

**Implémentation** : `UserService.getProfile()`
- Combine les données Auth0 (localStorage) avec les données backend
- Fallback sur Auth0 si le backend n'est pas disponible
- Gestion automatique des timeouts (10s)

#### Réponse

```json
{
  "id": "usr_12345",
  "email": "user@example.com", 
  "name": "Jean Mutombo",
  "picture": "https://ui-avatars.com/api/?name=Jean%20Mutombo",
  "phone": "+243810987654",
  "address": "Kinshasa, RDC",
  "role": "admin",
  "idNumber": "RDC123456789",
  "idStatus": "verified",
  "createdAt": "2023-10-15T14:30:00Z"
}
```

### Mettre à jour le profil utilisateur  

```
PATCH /users/me
```

**Implémentation** : `UserService.updateProfile(data)`
- Sauvegarde locale dans localStorage
- Tentative de synchronisation avec le backend si connecté

#### Corps de la requête

```json
{
  "name": "Jean Luc Mutombo",
  "phone": "+243820123456", 
  "address": "456, Boulevard du 30 Juin, Kinshasa",
  "language": "fr"
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
