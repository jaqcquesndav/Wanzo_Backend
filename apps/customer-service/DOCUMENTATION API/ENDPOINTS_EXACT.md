# Wanzo Land - Documentation Endpoints Exacts

Cette documentation contient UNIQUEMENT les endpoints basés sur l'analyse exacte du code source.

## Configuration API

### Base URL
- **Production**: `https://api.wanzo-land.com/land/api/v1`
- **Développement**: `http://localhost:8000/land/api/v1`

### Authentification Auth0 PKCE
```typescript
{
  domain: 'wanzo-land.us.auth0.com',
  clientId: 'RXTxVgIKY8HjQ6MHs3c80a2kbIWgRPxg',
  redirectUri: `${window.location.origin}/auth/callback`,
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
  useRefreshTokensFallback: true
}
```

### Headers Standards
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {access_token}',
  'Accept': 'application/json'
}
```

## Endpoints du Code Source

### 1. Utilisateurs (`/users`) - userApi.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/users/me` | Récupère le profil utilisateur |
| `POST` | `/users` | Crée un premier utilisateur (signup Auth0) |
| `PATCH` | `/users/me` | Met à jour le profil |
| `PATCH` | `/users/me/type` | Change le type d'utilisateur |
| `POST` | `/users/me/verify-phone` | Vérifie le téléphone |
| `POST` | `/users/me/identity-document` | Upload document d'identité |
| `POST` | `/users/me/avatar` | Upload photo de profil |

### 2. Entreprises (`/companies`) - companyApi.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/companies` | Crée une entreprise |
| `GET` | `/companies/{id}` | Récupère une entreprise |
| `PATCH` | `/companies/{id}` | Met à jour une entreprise |
| `DELETE` | `/companies/{id}` | Supprime une entreprise |
| `POST` | `/companies/{id}/logo` | Upload logo |
| `POST` | `/companies/{id}/owner/cv` | Upload CV propriétaire |
| `POST` | `/companies/{id}/locations` | Ajoute une localisation |
| `DELETE` | `/companies/{id}/locations/{locationId}` | Supprime une localisation |
| `POST` | `/companies/{id}/partners` | Ajoute un partenaire |
| `DELETE` | `/companies/{id}/partners/{partnerId}` | Supprime un partenaire |
| `GET` | `/companies` | Liste avec filtres et pagination |

### 3. Institutions Financières (`/financial-institutions`) - financialInstitutionApi.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/financial-institutions` | Crée une institution |
| `GET` | `/financial-institutions/{id}` | Récupère une institution |
| `PATCH` | `/financial-institutions/{id}` | Met à jour une institution |
| `POST` | `/financial-institutions/{id}/logo` | Upload logo |
| `POST` | `/financial-institutions/{id}/ceo-photo` | Upload photo CEO |
| `POST` | `/financial-institutions/{id}/branches` | Ajoute une succursale |
| `DELETE` | `/financial-institutions/{id}/branches/{branchId}` | Supprime une succursale |
| `POST` | `/financial-institutions/{id}/team` | Ajoute un membre d'équipe |
| `DELETE` | `/financial-institutions/{id}/team/{memberId}` | Supprime un membre d'équipe |
| `POST` | `/financial-institutions/{id}/team/{memberId}/photo` | Upload photo membre |
| `GET` | `/financial-institutions` | Liste avec filtres et pagination |

### 4. Abonnements (`/subscription`) - subscriptionApi.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/subscription/plans` | Récupère les plans |
| `POST` | `/subscription` | Crée un abonnement |
| `GET` | `/subscription/current` | Récupère l'abonnement actuel |
| `POST` | `/subscription/cancel` | Annule l'abonnement |
| `POST` | `/subscription/change-plan` | Change le plan |

### 5. Tokens (`/tokens`) - subscriptionApi.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/tokens/balance` | Récupère le solde de tokens |
| `POST` | `/tokens/purchase` | Achète des tokens |
| `GET` | `/tokens/transactions` | Historique des transactions |

### 6. Paiements (`/payments`) - subscriptionApi.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/payments` | Historique des paiements |
| `GET` | `/payments/{paymentId}/receipt` | Télécharge un reçu (PDF) |
| `POST` | `/payments/manual` | Upload preuve de paiement manuel |

## Format de Réponse Standard

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}
```

## Format d'Erreur Standard

```typescript
interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}
```

## Notes Importantes

- **Authentification**: Tous les endpoints requièrent un Bearer token Auth0
- **Pagination**: Endpoints de liste supportent `page` et `limit`
- **Upload**: Endpoints de fichiers utilisent `multipart/form-data`
- **Types**: Voir `src/types/api.ts` pour les définitions TypeScript complètes
- **Services**: 
  - `userApi.ts` - Gestion utilisateurs
  - `companyApi.ts` - Gestion entreprises
  - `financialInstitutionApi.ts` - Gestion institutions financières
  - `subscriptionApi.ts` - Gestion abonnements, tokens et paiements

## Codes d'Erreur HTTP

- `200` - Succès
- `201` - Créé avec succès
- `400` - Requête incorrecte
- `401` - Non autorisé (token invalide/expiré)
- `403` - Accès interdit
- `404` - Ressource non trouvée
- `422` - Erreurs de validation
- `500` - Erreur interne du serveur
