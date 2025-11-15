# Wanzo Land - Documentation Endpoints Exacts

Cette documentation contient UNIQUEMENT les endpoints basés sur l'analyse exacte du code source.

## Configuration API

### Base URL
- **Production**: `https://api.wanzo-land.com/land/api/v1` *(à configurer via VITE_API_URL)*
- **Développement**: `http://localhost:8000/land/api/v1`

**Note**: L'URL est configurée via la variable d'environnement `VITE_API_URL`.

### Authentification Auth0 PKCE
```typescript
{
  domain: process.env.VITE_AUTH0_DOMAIN,
  clientId: process.env.VITE_AUTH0_CLIENT_ID,
  audience: 'https://api.wanzo.com',
  redirectUri: `${window.location.origin}/auth/callback`,
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
  useRefreshTokensFallback: true
}
```

**Note**: Les valeurs réelles sont configurées via les variables d'environnement pour la sécurité.

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

### 4. Catalogue des Plans (`/pricing`) - pricing.controller.ts

> **📋 AFFICHAGE DU CATALOGUE** : Ces endpoints permettent de consulter les plans disponibles AVANT de souscrire.
> Les plans sont créés dans Admin Service et synchronisés via Kafka.

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/pricing/plans` | Liste des plans disponibles (avec filtres) |
| `GET` | `/pricing/plans/{planId}` | Détails d'un plan avec savings annuels |
| `POST` | `/pricing/calculate` | Calculer prix avec réductions personnalisées |
| `GET` | `/pricing/tokens/packages` | Packages de tokens disponibles |
| `POST` | `/pricing/tokens/estimate` | Estimer coût achat tokens |
| `GET` | `/pricing/my-subscription` | Infos abonnement + usage tokens client |
| `GET` | `/pricing/features/check/{featureCode}` | Vérifier accès à une fonctionnalité |
| `GET` | `/pricing/comparison` | Comparer plans par type client |

### 5. Gestion des Abonnements (`/subscription`) - subscription.controller.ts

> **💳 GESTION DES ABONNEMENTS** : Ces endpoints permettent de créer et gérer l'abonnement actif d'un utilisateur.

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/subscription/plans` | Plans disponibles (alternatif, voir /pricing/plans) |
| `POST` | `/subscription` | Crée un abonnement |
| `GET` | `/subscription/current` | Abonnement actuel utilisateur connecté |
| `GET` | `/subscription/customer/{customerId}` | Abonnements d'un client |
| `GET` | `/subscription/expiring/soon` | Abonnements bientôt expirés |
| `GET` | `/subscription/expired` | Abonnements expirés |
| `GET` | `/subscription/{id}` | Détails d'un abonnement |
| `PUT` | `/subscription/{id}` | Mettre à jour un abonnement |
| `PUT` | `/subscription/{id}/cancel` | Annuler un abonnement |
| `PUT` | `/subscription/{id}/activate` | Activer un abonnement |
| `PUT` | `/subscription/{id}/renew` | Renouveler un abonnement |
| `POST` | `/subscription/cancel` | Annuler abonnement actuel |
| `POST` | `/subscriptions/change-plan` | Changer plan abonnement actuel |

### 6. Paiements d'Abonnements (`/subscriptions`) - subscription-payment.controller.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/subscriptions/purchase` | Acheter un plan via mobile money |
| `GET` | `/subscriptions/plans/available` | Plans disponibles pour l'utilisateur |
| `GET` | `/subscriptions/payment-status/{transactionId}` | Statut d'un paiement |
| `GET` | `/subscriptions/current/payment-history` | Historique paiements abonnement actuel |

### 7. Plans Spécialisés

#### Commercial (`/subscriptions/commercial`) - commercial.controller.ts
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/subscriptions/commercial/plans` | Plans PME spécialisés |

#### Financial Institution (`/subscriptions/financial`) - financial-institution.controller.ts
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/subscriptions/financial/plans` | Plans institutions financières |

### 8. Paiements Stripe (`/subscriptions/stripe`) - stripe-subscription-payment.controller.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/subscriptions/stripe/setup-payment` | Configuration paiement Stripe |
| `POST` | `/subscriptions/stripe/confirm-payment` | Confirmation paiement |
| `POST` | `/subscriptions/stripe/setup-recurring` | Configuration abonnement récurrent |
| `POST` | `/subscriptions/stripe/webhook` | Traitement webhooks Stripe |
| `GET` | `/subscriptions/stripe/payment-methods` | Méthodes de paiement client |

### 9. Tokens (Gestion intégrée)

**Note critique**: Les tokens sont maintenant **intégrés aux plans d'abonnement**. Plus d'endpoints dédiés tokens - tout se gère via les abonnements et le pricing.

### 10. Chat Adha (`/chat`) - chatApiService.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/health` | Vérifie la connexion avec le backend IA |
| `POST` | `/chat/message` | Envoie un message à l'IA avec historique |
| `GET` | `/chat/conversations/{id}` | Récupère l'historique d'une conversation |
| `POST` | `/chat/conversations` | Sauvegarde une conversation |
| `DELETE` | `/chat/conversations/{id}` | Supprime une conversation |

**Note**: Le service utilise `VITE_API_URL` (défaut: `http://localhost:8000/land/api/v1`) et inclut un mode dégradé avec réponses de fallback.

### 11. Paiements (`/payments`) - subscription-payment.controller.ts

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
  - `chatApiService.ts` - Chat IA Adha avec fallback mode

## Codes d'Erreur HTTP

- `200` - Succès
- `201` - Créé avec succès
- `400` - Requête incorrecte
- `401` - Non autorisé (token invalide/expiré)
- `403` - Accès interdit
- `404` - Ressource non trouvée
- `422` - Erreurs de validation
- `500` - Erreur interne du serveur
