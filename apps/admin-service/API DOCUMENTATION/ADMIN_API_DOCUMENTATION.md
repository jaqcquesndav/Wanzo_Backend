# Documentation de l'API du microservice Admin

Cette documentation décrit la structure des URLs et les endpoints disponibles pour communiquer avec le microservice Admin via l'API Gateway.

## Informations générales

- **Base URL (via API Gateway)**: `http://localhost:8000/admin/api/v1`
- **Base URL (directe)**: `http://localhost:3001`
- **Version API**: v1
- **Port API Gateway**: 8000
- **Port Microservice Admin**: 3001 (interne)

## Authentification

Toutes les requêtes nécessitent une authentification via un token JWT Auth0.

**Headers requis**:
```
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

## Structure des URLs

Tous les endpoints du microservice sont accessibles via l'API Gateway :

**Pattern** : `http://localhost:8000/admin/api/v1/<endpoint>`

**Exemple** : 
- Frontend demande : `http://localhost:8000/admin/api/v1/users`
- Gateway retire : `/admin/api/v1`
- Service admin reçoit : `/users`

## Endpoints disponibles

### 1. Authentification (Auth)

**Préfixe** : `/auth`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/auth/verify` | Vérifier le token JWT Auth0 et récupérer l'utilisateur |
| GET | `/auth/me` | Récupérer le profil utilisateur authentifié |
| PUT | `/auth/me` | Mettre à jour le profil utilisateur |

**Exemple via API Gateway** :
```
GET  http://localhost:8000/admin/api/v1/auth/verify
GET  http://localhost:8000/admin/api/v1/auth/me
PUT  http://localhost:8000/admin/api/v1/auth/me
```

**Structure UserProfileDto enrichie** :

```json
{
  "id": "google-oauth2|113531686121267070489",
  "name": "Jacques Ndavaro",
  "email": "jacquesndav@gmail.com",
  "role": "super_admin",
  "userType": "internal",
  "picture": "https://lh3.googleusercontent.com/...",
  "customerAccountId": null,
  "phoneNumber": "+243123456789",
  "organizationId": "org-123456",
  "idAgent": "IKH12345",
  "validityEnd": "2026-06-17T00:00:00.000Z",
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2025-06-15T14:30:00Z",
  "lastLogin": "2025-06-17T14:29:09.437Z",
  "permissions": ["users:read", "users:write", "settings:read"],
  "kyc": {
    "status": "verified",
    "verifiedAt": "2025-01-15T10:30:00Z",
    "documents": [
      {
        "type": "id_card",
        "verified": true,
        "uploadedAt": "2025-01-10T14:20:00Z"
      }
    ]
  },
  "language": "fr",
  "timezone": "Africa/Kinshasa"
}
```

**Nouvelles propriétés ajoutées** :
- `organizationId` : ID de l'organisation Auth0
- `idAgent` : Identifiant unique de l'agent
- `validityEnd` : Date d'expiration du compte
- `language` : Langue préférée
- `timezone` : Fuseau horaire
- `kyc` : Informations de vérification KYC complètes

**Note importante sur l'authentification** :
- Le service Admin implémente une vérification Auth0 complète avec JWKS
- **Pas de blacklist locale** : Ce service est destiné aux admins Wanzo (équipe interne)
- La révocation des tokens admin se fait directement au niveau Auth0, pas via blacklist
- Nouveau utilisateur = synchronisation automatique avec Customer Service via Kafka
- Format de réponse uniforme : `{ success: true, data: {...} }`
- Support complet KYC avec documents et statuts de vérification

---

### 2. Utilisateurs (Users)

#### Structure de données utilisateur mise à jour

**UserDto (Structure complète)** :

```json
{
  "id": "user-id-string",
  "name": "User Name",
  "email": "user@example.com",
  "role": "company_user",
  "userType": "internal",
  "customerAccountId": "pme-123",
  "customerName": "Customer Company Name",
  "customerType": "pme",
  "status": "active",
  "avatar": "url_to_avatar_image.png",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-18T11:00:00Z",
  "lastLogin": "2025-01-20T14:45:00Z",
  "permissions": [
    {
      "applicationId": "default",
      "permissions": ["view_own_profile", "edit_own_profile"]
    }
  ],
  "departement": "Sales",
  "phoneNumber": "+243123456789",
  "position": "Senior Manager",
  "idAgent": "IKH12345",
  "validityEnd": "2026-06-17T00:00:00.000Z",
  "language": "fr",
  "timezone": "Africa/Kinshasa",
  "kyc": {
    "status": "verified",
    "verifiedAt": "2025-01-15T10:30:00Z",
    "documents": [
      {
        "type": "id_card",
        "verified": true,
        "uploadedAt": "2025-01-10T14:20:00Z"
      }
    ]
  }
}
```

**Nouvelles propriétés ajoutées** :
- `idAgent` : Identifiant agent unique (ex: "IKH12345")
- `validityEnd` : Date de fin de validité du compte
- `language` : Langue préférée de l'utilisateur
- `timezone` : Fuseau horaire de l'utilisateur
- `kyc` : Informations complètes de vérification KYC

**Structure des permissions mise à jour** :
- **ANCIEN** : `permissions: string[]`
- **NOUVEAU** : `permissions: [{ applicationId: string, permissions: string[] }]`

#### 2.1 Profil utilisateur

**Préfixe** : `/users`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/users/profile` | Récupérer le profil de l'utilisateur connecté |
| PUT | `/users/profile` | Mettre à jour le profil de l'utilisateur connecté |
| POST | `/users/change-password` | Changer le mot de passe de l'utilisateur connecté |

**Exemple via API Gateway** :
```
GET http://localhost:8000/admin/api/v1/users/profile
PUT http://localhost:8000/admin/api/v1/users/profile
```

#### 2.2 Gestion administrative des utilisateurs

**Préfixe** : `/admin/users`

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| GET | `/admin/users` | Lister tous les utilisateurs avec filtrage | SUPER_ADMIN, COMPANY_ADMIN |
| POST | `/admin/users` | Créer un nouvel utilisateur | SUPER_ADMIN, COMPANY_ADMIN |
| GET | `/admin/users/:id` | Récupérer un utilisateur par ID | SUPER_ADMIN, COMPANY_ADMIN |
| PUT | `/admin/users/:id` | Mettre à jour un utilisateur | SUPER_ADMIN, COMPANY_ADMIN |
| DELETE | `/admin/users/:id` | Supprimer un utilisateur | SUPER_ADMIN, COMPANY_ADMIN |
| POST | `/admin/users/:userId/reset-password` | Réinitialiser le mot de passe d'un utilisateur | SUPER_ADMIN |
| POST | `/admin/users/:userId/toggle-status` | Activer/désactiver un utilisateur | SUPER_ADMIN, COMPANY_ADMIN |
| GET | `/admin/users/:id/activities` | Récupérer l'historique d'activités | SUPER_ADMIN, COMPANY_ADMIN |
| GET | `/admin/users/:id/sessions` | Récupérer les sessions actives | SUPER_ADMIN, COMPANY_ADMIN |

**Exemple via API Gateway** :
```
GET    http://localhost:8000/admin/api/v1/admin/users
POST   http://localhost:8000/admin/api/v1/admin/users
GET    http://localhost:8000/admin/api/v1/admin/users/123
PUT    http://localhost:8000/admin/api/v1/admin/users/123
DELETE http://localhost:8000/admin/api/v1/admin/users/123
```

---

### 3. Entreprise (Company)

**Préfixe** : `/company`

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| GET | `/company/profile` | Récupérer le profil de l'entreprise | SUPER_ADMIN, CTO, COMPANY_ADMIN |
| PUT | `/company/profile` | Mettre à jour le profil de l'entreprise | SUPER_ADMIN, CTO |
| POST | `/company/logo` | Télécharger le logo de l'entreprise | SUPER_ADMIN, CTO |
| DELETE | `/company/logo` | Supprimer le logo de l'entreprise | SUPER_ADMIN, CTO |
| GET | `/company/documents` | Récupérer tous les documents | SUPER_ADMIN, CTO, COMPANY_ADMIN |
| POST | `/company/documents` | Télécharger un document | SUPER_ADMIN, CTO |
| DELETE | `/company/documents/:id` | Supprimer un document | SUPER_ADMIN, CTO |
| GET | `/company/locations` | Récupérer toutes les localisations | SUPER_ADMIN, CTO, COMPANY_ADMIN |
| POST | `/company/locations` | Ajouter une localisation | SUPER_ADMIN, CTO |
| GET | `/company/locations/:id` | Récupérer une localisation | SUPER_ADMIN, CTO, COMPANY_ADMIN |
| PUT | `/company/locations/:id` | Mettre à jour une localisation | SUPER_ADMIN, CTO |
| DELETE | `/company/locations/:id` | Supprimer une localisation | SUPER_ADMIN, CTO |
| GET | `/company/stats` | Récupérer les statistiques de l'entreprise | SUPER_ADMIN, CTO, GROWTH_FINANCE |

**Structure des localisations mise à jour** :

```json
{
  "id": "location-id",
  "address": "123 Main Street, City",
  "coordinates": {
    "lat": -4.3833,
    "lng": 15.2833
  },
  "type": "headquarters",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-18T11:00:00Z"
}
```

**Types de localisation** :
- `headquarters` : Siège social
- `branch` : Succursale
- `warehouse` : Entrepôt
- `office` : Bureau

**Exemple via API Gateway** :
```
GET  http://localhost:8000/admin/api/v1/company/profile
PUT  http://localhost:8000/admin/api/v1/company/profile
POST http://localhost:8000/admin/api/v1/company/logo
GET  http://localhost:8000/admin/api/v1/company/stats
```

---

### 4. Clients (Customers)

**Préfixe** : `/customers`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/customers` | Récupérer tous les clients avec filtrage |
| POST | `/customers` | Créer un nouveau client |
| GET | `/customers/:customerId` | Récupérer un client par ID |
| PUT | `/customers/:customerId` | Mettre à jour un client |
| PUT | `/customers/:customerId/validate` | Valider un client |
| PUT | `/customers/:customerId/suspend` | Suspendre un client |
| PUT | `/customers/:customerId/reactivate` | Réactiver un client |
| DELETE | `/customers/:customerId` | Supprimer un client |
| POST | `/customers/:customerId/documents` | Télécharger un document pour un client |
| GET | `/customers/:customerId/documents` | Récupérer les documents d'un client |
| PUT | `/customers/:customerId/documents/:documentId/approve` | Approuver un document |
| PUT | `/customers/:customerId/documents/:documentId/reject` | Rejeter un document |
| GET | `/customers/:customerId/activities` | Récupérer l'historique d'activités |
| GET | `/customers/statistics` | Récupérer les statistiques des clients |

**Validation des clients** :

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/customers/:customerId/validation` | Récupérer le statut de validation |
| POST | `/customers/:customerId/validation/initiate` | Initier le processus de validation |
| PUT | `/customers/:customerId/validation/steps/:stepId` | Mettre à jour une étape de validation |
| GET | `/customers/:customerId/validation/extended` | Récupérer les détails étendus de validation |

**Documents clients** :

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/customers/:customerId/documents/:documentId/validate` | Valider un document |
| POST | `/customers/:customerId/documents/:documentId/reject` | Rejeter un document |

**Structure CustomerDetailsResponseDto** :

```json
{
  "customer": {
    "id": "customer-uuid",
    "name": "Customer Company",
    "email": "contact@customer.com",
    "status": "active",
    "type": "pme",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "documents": [
    {
      "id": "doc-uuid",
      "type": "rccm",
      "fileName": "rccm-document.pdf",
      "status": "approved",
      "uploadedAt": "2025-01-16T09:00:00Z"
    }
  ],
  "activities": [
    {
      "id": "activity-uuid",
      "action": "document_uploaded",
      "timestamp": "2025-01-16T09:00:00Z",
      "details": "RCCM document uploaded"
    }
  ],
  "statistics": {
    "totalDocuments": 5,
    "approvedDocuments": 3,
    "pendingDocuments": 2
  }
}
```

**Upload de documents avec multipart** :

```bash
# Exemple de upload de document
curl -X POST \
  http://localhost:8000/admin/api/v1/customers/customer-id/documents \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "type=rccm"
```

**Formats de fichiers supportés** :
- PDF, JPG, JPEG, PNG, DOC, DOCX
- Taille maximale : 5MB
- Stockage : `./uploads/customer-documents/`

**Exemple via API Gateway** :
```
GET    http://localhost:8000/admin/api/v1/customers
POST   http://localhost:8000/admin/api/v1/customers
GET    http://localhost:8000/admin/api/v1/customers/123
PUT    http://localhost:8000/admin/api/v1/customers/123/validate
GET    http://localhost:8000/admin/api/v1/customers/statistics
POST   http://localhost:8000/admin/api/v1/customers/123/documents
```

---

### 5. Finance

**Préfixe** : `/finance`

#### 5.1 Abonnements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/finance/subscriptions/plans` | Récupérer tous les plans d'abonnement |
| GET | `/finance/subscriptions` | Récupérer tous les abonnements |
| GET | `/finance/subscriptions/:subscriptionId` | Récupérer un abonnement par ID |
| POST | `/finance/subscriptions` | Créer un nouvel abonnement |
| PUT | `/finance/subscriptions/:subscriptionId` | Mettre à jour un abonnement |
| POST | `/finance/subscriptions/:subscriptionId/cancel` | Annuler un abonnement |

#### 5.2 Factures

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/finance/invoices` | Récupérer toutes les factures |
| GET | `/finance/invoices/:invoiceId` | Récupérer une facture par ID |
| POST | `/finance/invoices` | Créer une nouvelle facture |
| PUT | `/finance/invoices/:invoiceId` | Mettre à jour une facture |
| DELETE | `/finance/invoices/:invoiceId` | Supprimer une facture |
| POST | `/finance/invoices/:invoiceId/send-reminder` | Envoyer un rappel de paiement |

#### 5.3 Paiements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/finance/payments` | Récupérer tous les paiements |
| GET | `/finance/payments/:paymentId` | Récupérer un paiement par ID |
| POST | `/finance/payments/manual` | Enregistrer un paiement manuel |
| POST | `/finance/payments/verify` | Vérifier un paiement |

#### 5.4 Transactions

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/finance/transactions` | Récupérer toutes les transactions |
| GET | `/finance/transactions/:transactionId` | Récupérer une transaction par ID |
| POST | `/finance/transactions` | Créer une nouvelle transaction |

#### 5.5 Tokens

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/finance/tokens/packages` | Récupérer les packages de tokens |
| GET | `/finance/tokens/transactions` | Récupérer les transactions de tokens |
| GET | `/finance/tokens/balance/:customerId` | Récupérer le solde de tokens d'un client |

#### 5.6 Résumé financier

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/finance/summary` | Récupérer le résumé financier global |

**Exemple via API Gateway** :
```
GET  http://localhost:8000/admin/api/v1/finance/subscriptions
POST http://localhost:8000/admin/api/v1/finance/invoices
GET  http://localhost:8000/admin/api/v1/finance/payments
GET  http://localhost:8000/admin/api/v1/finance/summary
```

---

### 6. Tokens (Gestion des tokens)

**Préfixe** : `/tokens`

**Note importante** : Les tokens sont maintenant intégrés directement dans les plans d'abonnement. Les plans contiennent un `tokenConfig` avec les allocations mensuelles, les règles de rollover et les taux de tokens. Les achats de tokens indépendants ne sont plus nécessaires.

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/tokens/balance` | Récupérer le solde de tokens de l'utilisateur connecté |
| GET | `/tokens/packages` | Récupérer les packages de tokens disponibles |
| POST | `/tokens/purchase` | Acheter un package de tokens (déprécié - utilisez les plans) |
| GET | `/tokens/usage` | Récupérer l'utilisation des tokens |
| GET | `/tokens/history` | Récupérer l'historique des transactions de tokens |
| GET | `/tokens/usage/stats` | Récupérer les statistiques d'utilisation |
| GET | `/tokens/usage/features` | Récupérer l'utilisation par fonctionnalité |
| GET | `/tokens/usage/apps` | Récupérer l'utilisation par application |
| GET | `/tokens/admin/tokens/statistics` | Récupérer les statistiques globales (admin) |
| POST | `/tokens/admin/tokens/allocate` | Allouer des tokens à un utilisateur (admin) |

**Exemple via API Gateway** :
```
GET  http://localhost:8000/admin/api/v1/tokens/balance
POST http://localhost:8000/admin/api/v1/tokens/purchase
GET  http://localhost:8000/admin/api/v1/tokens/usage/stats
```

---

### 7. Paramètres (Settings)

**Préfixe** : `/settings`

#### 7.1 Paramètres système

| Méthode | URL | Description | Permissions requises |
|---------|-----|-------------|---------------------|
| GET | `/settings` | Récupérer tous les paramètres | admin:settings:read |
| GET | `/settings/general` | Récupérer les paramètres généraux | admin:settings:read |
| GET | `/settings/security` | Récupérer les paramètres de sécurité | admin:settings:read |
| GET | `/settings/notifications` | Récupérer les paramètres de notifications | admin:settings:read |
| GET | `/settings/billing` | Récupérer les paramètres de facturation | admin:settings:read |
| GET | `/settings/appearance` | Récupérer les paramètres d'apparence | admin:settings:read |
| PUT | `/settings/:section` | Mettre à jour une section de paramètres | admin:settings:write |

#### 7.2 Paramètres d'application

| Méthode | URL | Description | Permissions requises |
|---------|-----|-------------|---------------------|
| GET | `/settings/app` | Récupérer les paramètres d'application | admin:settings:read |
| PUT | `/settings/app/:id` | Mettre à jour un paramètre d'application | admin:settings:write |

**Note importante** : Le module Settings utilise un système de permissions granulaire basé sur des chaînes :
- `admin:settings:read` : Lecture des paramètres
- `admin:settings:write` : Écriture des paramètres

**Structure des paramètres d'application** :

```json
{
  "data": [
    {
      "id": "app-setting-id",
      "name": "maintenance_mode",
      "value": "false",
      "description": "Enable/disable maintenance mode",
      "category": "system"
    }
  ]
}
```

#### 7.2 Paramètres admin personnels

**Préfixe** : `/admin` (pour les paramètres personnels de l'admin)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/admin/profile` | Récupérer le profil admin |
| PUT | `/admin/profile` | Mettre à jour le profil admin |
| POST | `/admin/profile/avatar` | Télécharger un avatar |
| GET | `/admin/security/settings` | Récupérer les paramètres de sécurité |
| PUT | `/admin/security/settings/2fa` | Configurer l'authentification à deux facteurs |
| PUT | `/admin/security/password` | Changer le mot de passe |
| GET | `/admin/security/sessions` | Récupérer les sessions actives |
| DELETE | `/admin/security/sessions/:id` | Terminer une session spécifique |
| DELETE | `/admin/security/sessions/all-other` | Terminer toutes les autres sessions |
| GET | `/admin/security/login-history` | Récupérer l'historique des connexions |
| GET | `/admin/settings/notifications` | Récupérer les préférences de notifications |
| PUT | `/admin/settings/notifications/:id` | Mettre à jour une préférence de notification |
| PUT | `/admin/settings/notifications` | Mettre à jour toutes les notifications |

**Exemple via API Gateway** :
```
GET http://localhost:8000/admin/api/v1/settings/general
PUT http://localhost:8000/admin/api/v1/settings/security
GET http://localhost:8000/admin/api/v1/admin/profile
PUT http://localhost:8000/admin/api/v1/admin/security/password
```

---

### 8. Système (System)

**Préfixe** : `/admin/system`

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| GET | `/admin/system/health` | Vérifier la santé du système | SUPER_ADMIN, CTO |
| GET | `/admin/system/logs` | Récupérer les logs système | SUPER_ADMIN, CTO |
| GET | `/admin/system/alerts` | Récupérer les alertes système | SUPER_ADMIN, CTO |
| PUT | `/admin/system/alerts/:alertId/resolve` | Résoudre une alerte | SUPER_ADMIN, CTO |
| GET | `/admin/system/api/performance` | Récupérer les métriques de performance API | SUPER_ADMIN, CTO |
| GET | `/admin/system/databases` | Récupérer l'état des bases de données | SUPER_ADMIN, CTO |
| GET | `/admin/system/ai/models` | Récupérer les modèles IA disponibles | SUPER_ADMIN, CTO |
| PUT | `/admin/system/ai/models/:modelId` | Mettre à jour un modèle IA | SUPER_ADMIN, CTO |
| GET | `/admin/system/status` | Récupérer le statut global du système | SUPER_ADMIN, CTO |
| GET | `/admin/system/maintenance` | Récupérer le statut de maintenance | SUPER_ADMIN, CTO |
| PUT | `/admin/system/maintenance` | Activer/désactiver le mode maintenance | SUPER_ADMIN, CTO |

**Exemple via API Gateway** :
```
GET http://localhost:8000/admin/api/v1/admin/system/health
GET http://localhost:8000/admin/api/v1/admin/system/logs
GET http://localhost:8000/admin/api/v1/admin/system/databases
PUT http://localhost:8000/admin/api/v1/admin/system/maintenance
```

---

### 9. Comptabilité (Accounting Service Integration)

**Préfixe** : `/admin/accounting`

Le service admin communique avec le service de comptabilité pour gérer les opérations financières avancées.

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| GET | `/admin/accounting/entries` | Récupérer les écritures comptables avec filtres | SUPER_ADMIN, FINANCIAL_ADMIN |
| POST | `/admin/accounting/adjustments` | Créer un ajustement manuel | SUPER_ADMIN, FINANCIAL_ADMIN |
| GET | `/admin/accounting/reports` | Générer un rapport financier | SUPER_ADMIN, FINANCIAL_ADMIN, CTO |
| POST | `/admin/accounting/reconcile` | Réconcilier un paiement avec des factures | SUPER_ADMIN, FINANCIAL_ADMIN |
| GET | `/admin/accounting/balance/:customerId` | Récupérer le solde d'un client | SUPER_ADMIN, FINANCIAL_ADMIN |
| GET | `/admin/accounting/export` | Exporter les données comptables | SUPER_ADMIN, FINANCIAL_ADMIN |
| PUT | `/admin/accounting/invoices/:id/validate` | Valider une facture | SUPER_ADMIN, FINANCIAL_ADMIN |
| GET | `/admin/accounting/aging-report` | Générer un rapport de vieillissement | SUPER_ADMIN, FINANCIAL_ADMIN |
| GET | `/admin/accounting/audit-trail` | Récupérer la piste d'audit | SUPER_ADMIN, CTO |

**Exemple via API Gateway** :
```
GET  http://localhost:8000/admin/api/v1/admin/accounting/entries?startDate=2024-01-01&endDate=2024-12-31
POST http://localhost:8000/admin/api/v1/admin/accounting/adjustments
GET  http://localhost:8000/admin/api/v1/admin/accounting/reports?type=profit-loss&period=monthly
POST http://localhost:8000/admin/api/v1/admin/accounting/reconcile
GET  http://localhost:8000/admin/api/v1/admin/accounting/balance/cust_123
```

---

### 10. Gestion avancée des clients (Advanced Customer Management)

**Préfixe** : `/admin/customers`

Extensions du service client permettant la modification des abonnements, l'allocation de tokens et la gestion des utilisateurs.

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| PUT | `/admin/customers/:customerId/subscriptions/:subscriptionId` | Mettre à jour l'abonnement d'un client | SUPER_ADMIN, CUSTOMER_MANAGER |
| POST | `/admin/customers/:customerId/subscriptions/:subscriptionId/cancel` | Annuler l'abonnement d'un client | SUPER_ADMIN, CUSTOMER_MANAGER |
| POST | `/admin/customers/:customerId/tokens/allocate` | Allouer des tokens à un client | SUPER_ADMIN, CUSTOMER_MANAGER |
| POST | `/admin/customers/:customerId/users/:userId/suspend` | Suspendre un utilisateur | SUPER_ADMIN, CUSTOMER_MANAGER |
| POST | `/admin/customers/:customerId/users/:userId/reactivate` | Réactiver un utilisateur | SUPER_ADMIN, CUSTOMER_MANAGER |
| POST | `/admin/customers/:customerId/subscriptions` | Créer un abonnement pour un client | SUPER_ADMIN, CUSTOMER_MANAGER |

**Exemple via API Gateway** :
```
PUT  http://localhost:8000/admin/api/v1/admin/customers/cust_123/subscriptions/sub_456
POST http://localhost:8000/admin/api/v1/admin/customers/cust_123/subscriptions/sub_456/cancel
POST http://localhost:8000/admin/api/v1/admin/customers/cust_123/tokens/allocate
POST http://localhost:8000/admin/api/v1/admin/customers/cust_123/users/user_789/suspend
```

---

### 11. Gestion des institutions financières (Financial Institutions Management)

**Préfixe** : `/admin/institutions`

Gestion complète des institutions financières qui utilisent le service Portfolio Institution. Les institutions ont accès au portfolio management, prospection, virements et centrale des risques.

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| GET | `/admin/institutions` | Lister toutes les institutions | SUPER_ADMIN, CTO, CUSTOMER_MANAGER, FINANCIAL_ADMIN |
| GET | `/admin/institutions/:id` | Obtenir les détails d'une institution | SUPER_ADMIN, CTO, CUSTOMER_MANAGER, FINANCIAL_ADMIN |
| GET | `/admin/institutions/:id/users` | Récupérer les utilisateurs d'une institution | SUPER_ADMIN, CTO, CUSTOMER_MANAGER, FINANCIAL_ADMIN |
| GET | `/admin/institutions/:id/portfolios` | Récupérer les portfolios d'une institution | SUPER_ADMIN, CTO, FINANCIAL_ADMIN |
| GET | `/admin/institutions/:id/statistics` | Obtenir les statistiques d'une institution | SUPER_ADMIN, CTO, FINANCIAL_ADMIN |
| PUT | `/admin/institutions/:id` | Mettre à jour une institution | SUPER_ADMIN, CTO, FINANCIAL_ADMIN |
| POST | `/admin/institutions/:id/suspend` | Suspendre une institution | SUPER_ADMIN, CTO |
| POST | `/admin/institutions/:id/reactivate` | Réactiver une institution | SUPER_ADMIN, CTO |
| POST | `/admin/institutions/:id/users/:userId/suspend` | Suspendre un utilisateur d'institution | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| POST | `/admin/institutions/:id/users/:userId/reactivate` | Réactiver un utilisateur d'institution | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| POST | `/admin/institutions/:id/tokens/allocate` | Allouer des tokens à une institution | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/institutions/:id/subscription` | Récupérer l'abonnement d'une institution | SUPER_ADMIN, CTO, CUSTOMER_MANAGER, FINANCIAL_ADMIN |
| PUT | `/admin/institutions/:id/subscriptions/:subscriptionId` | Mettre à jour l'abonnement | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| POST | `/admin/institutions/:id/subscriptions/:subscriptionId/cancel` | Annuler l'abonnement | SUPER_ADMIN, CTO |
| POST | `/admin/institutions/:id/subscriptions` | Créer un abonnement | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |

**Exemple via API Gateway** :
```
GET  http://localhost:8000/admin/api/v1/admin/institutions?page=1&limit=20
GET  http://localhost:8000/admin/api/v1/admin/institutions/inst_123
GET  http://localhost:8000/admin/api/v1/admin/institutions/inst_123/portfolios
GET  http://localhost:8000/admin/api/v1/admin/institutions/inst_123/statistics
POST http://localhost:8000/admin/api/v1/admin/institutions/inst_123/suspend
POST http://localhost:8000/admin/api/v1/admin/institutions/inst_123/tokens/allocate
```

**Opérations spécifiques aux institutions** :
- Accès aux portfolios de crédit gérés par l'institution
- Suivi des opérations de prospection et meetings
- Gestion des virements/disbursements
- Consultation de la centrale des risques
- Statistiques financières et performance

---

### 12. Gestion des entreprises SME (SME/Company Management)

**Préfixe** : `/admin/companies`

Gestion complète des entreprises (SME/PME) qui utilisent le service Gestion Commerciale. Les entreprises ont accès aux ventes, dépenses, inventaire, clients d'affaires et fournisseurs.

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| GET | `/admin/companies` | Lister toutes les entreprises | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/companies/:id` | Obtenir les détails d'une entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/companies/:id/users` | Récupérer les utilisateurs d'une entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/companies/:id/sales` | Récupérer les ventes d'une entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/companies/:id/expenses` | Récupérer les dépenses d'une entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/companies/:id/inventory` | Récupérer l'inventaire d'une entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/companies/:id/customers` | Récupérer les clients d'affaires | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/companies/:id/suppliers` | Récupérer les fournisseurs | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/companies/:id/financial-stats` | Obtenir les statistiques financières | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| PUT | `/admin/companies/:id` | Mettre à jour une entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| POST | `/admin/companies/:id/suspend` | Suspendre une entreprise | SUPER_ADMIN, CTO |
| POST | `/admin/companies/:id/reactivate` | Réactiver une entreprise | SUPER_ADMIN, CTO |
| POST | `/admin/companies/:id/users/:userId/suspend` | Suspendre un utilisateur d'entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| POST | `/admin/companies/:id/users/:userId/reactivate` | Réactiver un utilisateur d'entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| POST | `/admin/companies/:id/tokens/allocate` | Allouer des tokens à une entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| GET | `/admin/companies/:id/subscription` | Récupérer l'abonnement d'une entreprise | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| PUT | `/admin/companies/:id/subscriptions/:subscriptionId` | Mettre à jour l'abonnement | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |
| POST | `/admin/companies/:id/subscriptions/:subscriptionId/cancel` | Annuler l'abonnement | SUPER_ADMIN, CTO, CUSTOMER_MANAGER |

**Exemple via API Gateway** :
```
GET  http://localhost:8000/admin/api/v1/admin/companies?page=1&limit=20
GET  http://localhost:8000/admin/api/v1/admin/companies/comp_123
GET  http://localhost:8000/admin/api/v1/admin/companies/comp_123/sales?startDate=2024-01-01
GET  http://localhost:8000/admin/api/v1/admin/companies/comp_123/expenses?period=monthly
GET  http://localhost:8000/admin/api/v1/admin/companies/comp_123/inventory
GET  http://localhost:8000/admin/api/v1/admin/companies/comp_123/customers
POST http://localhost:8000/admin/api/v1/admin/companies/comp_123/suspend
POST http://localhost:8000/admin/api/v1/admin/companies/comp_123/tokens/allocate
```

**Opérations spécifiques aux entreprises** :
- Suivi des ventes et chiffre d'affaires
- Gestion des dépenses et comptabilité
- Contrôle de l'inventaire et stocks
- Gestion des clients d'affaires (business customers)
- Gestion des fournisseurs
- Statistiques financières complètes (revenue, expenses, profit)

---

### 13. Tableau de bord (Dashboard)

**Préfixe** : `/dashboard`

#### 13.1 Endpoints principaux

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| GET | `/dashboard` | Récupérer les données complètes du tableau de bord | Admin |
| GET | `/dashboard/widgets/:widgetId` | Récupérer les données d'un widget spécifique | Admin, User |
| GET | `/dashboard/configuration` | Récupérer la configuration du tableau de bord | Admin, User |
| PUT | `/dashboard/configuration` | Mettre à jour la configuration du tableau de bord | Admin, User |

#### 13.2 Statistiques avancées

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| GET | `/dashboard/statistics/sales` | Récupérer les statistiques de ventes | Admin |
| GET | `/dashboard/statistics/user-engagement` | Récupérer les statistiques d'engagement utilisateur | Admin |

#### 13.3 Endpoints legacy (rétrocompatibilité)

| Méthode | URL | Description | Rôles requis |
|---------|-----|-------------|--------------|
| GET | `/dashboard/kpis` | Récupérer les KPIs | Admin |
| GET | `/dashboard/financial-summary` | Récupérer le résumé financier | Admin |
| GET | `/dashboard/recent-activities` | Récupérer les activités récentes | Admin, User |
| GET | `/dashboard/user-statistics` | Récupérer les statistiques utilisateur | Admin |
| GET | `/dashboard/system-health` | Récupérer l'état de santé du système | Admin |
| GET | `/dashboard/notifications` | Récupérer les notifications | Admin, User |

**Paramètres de requête** :

Pour `/dashboard` :
- `userId` (string, optionnel) : ID utilisateur spécifique
- `dateRange` (string, optionnel) : Plage de dates
- `timeZone` (string, optionnel) : Fuseau horaire

Pour `/dashboard/statistics/sales` :
- `period` (string, optionnel) : Période (daily, weekly, monthly)
- `startDate` (string, optionnel) : Date de début
- `endDate` (string, optionnel) : Date de fin

Pour `/dashboard/statistics/user-engagement` :
- `metricType` (string, optionnel) : Type de métrique
- `dateRange` (string, optionnel) : Plage de dates

**Exemple via API Gateway** :
```
GET http://localhost:8000/admin/api/v1/dashboard?dateRange=last30days
GET http://localhost:8000/admin/api/v1/dashboard/widgets/revenue-chart
GET http://localhost:8000/admin/api/v1/dashboard/configuration
PUT http://localhost:8000/admin/api/v1/dashboard/configuration
GET http://localhost:8000/admin/api/v1/dashboard/statistics/sales?period=monthly
GET http://localhost:8000/admin/api/v1/dashboard/statistics/user-engagement?metricType=logins
```

---

### 14. Documents (Documents administratifs)

**Préfixe** : `/documents` (pas de contrôleur spécifique trouvé dans l'analyse)

---

### 15. Chat / Support

**Préfixe** : `/chat` (module présent mais pas de contrôleur analysé)

---

### 16. Événements Kafka (Kafka Event System)

Le service admin écoute et émet des événements Kafka pour assurer la communication bidirectionnelle avec les autres microservices.

#### Événements émis par Admin Service

| Événement | Description | Payload |
|-----------|-------------|---------|
| `subscription.created` | Émis lors de la création d'un abonnement | `{ subscriptionId, customerId, planId, startDate, amount, currency }` |
| `subscription.updated` | Émis lors de la mise à jour d'un abonnement | `{ subscriptionId, customerId, changes, updatedBy }` |
| `subscription.cancelled` | Émis lors de l'annulation d'un abonnement | `{ subscriptionId, customerId, reason, cancelledAt }` |
| `subscription.expired` | Émis lorsqu'un abonnement expire | `{ subscriptionId, customerId, expiredAt }` |
| `subscription.renewed` | Émis lors du renouvellement d'un abonnement | `{ subscriptionId, customerId, newPeriodStart, newPeriodEnd }` |
| `subscription.plan_changed` | Émis lors du changement de plan | `{ subscriptionId, customerId, oldPlanId, newPlanId }` |
| `subscription.status_changed` | Émis lors du changement de statut | `{ subscriptionId, customerId, oldStatus, newStatus }` |

#### Événements écoutés par Admin Service

| Pattern | Description | Action |
|---------|-------------|--------|
| `customer.validation.requested` | Demande de validation d'un client | Traite la validation automatique ou manuelle |
| `accounting.invoice.generation.requested` | Demande de génération de facture | Crée automatiquement une facture |
| `token.low.alert` | Alerte de tokens faibles | Notifie l'admin et peut déclencher une allocation |
| `subscription.payment.failed` | Échec de paiement d'abonnement | Gère la suspension ou les relances |
| `subscription.renewal.due` | Renouvellement d'abonnement à venir | Génère une facture et traite le renouvellement |
| `user.activity.suspicious` | Activité suspecte détectée | Peut suspendre automatiquement l'utilisateur |
| `system.health.critical` | Santé système critique | Alerte les super admins |
| `compliance.check.required` | Vérification de conformité requise | Lance une vérification automatique |

**Configuration Kafka** :
- Bootstrap servers : `localhost:9092`
- Client ID : `admin-service`
- Group ID : `admin-service-group`
- Auto-commit : `true`

---

## Format des réponses

### Réponse de succès

```json
{
  "success": true,
  "data": {
    // Les données spécifiques à l'endpoint
  }
}
```

### Réponse avec message

```json
{
  "success": true,
  "message": "Opération réussie",
  "data": {
    // Les données
  }
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "error": "Message d'erreur spécifique",
  "statusCode": 400
}
```

### Pagination

Les endpoints qui retournent des listes utilisent ce format :

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

## Exemples d'utilisation

### 1. Authentification et récupération du profil

```javascript
// Vérifier le token Auth0
const verifyToken = async (token) => {
  const response = await fetch('http://localhost:8000/admin/api/v1/auth/verify', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data.user;
  } else {
    throw new Error('Token invalide');
  }
};

// Récupérer le profil utilisateur
const getProfile = async (token) => {
  const response = await fetch('http://localhost:8000/admin/api/v1/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data.success ? data.data.user : null;
};
```

### 2. Gestion des utilisateurs

```javascript
// Lister tous les utilisateurs
const listUsers = async (token, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:8000/admin/api/v1/admin/users?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Créer un nouvel utilisateur
const createUser = async (token, userData) => {
  const response = await fetch('http://localhost:8000/admin/api/v1/admin/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Désactiver un utilisateur
const toggleUserStatus = async (token, userId, isActive) => {
  const response = await fetch(`http://localhost:8000/admin/api/v1/admin/users/${userId}/toggle-status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isActive })
  });
  return response.json();
};
```

### 3. Gestion des clients

```javascript
// Récupérer les statistiques des clients
const getCustomerStats = async (token) => {
  const response = await fetch('http://localhost:8000/admin/api/v1/customers/statistics', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Valider un client
const validateCustomer = async (token, customerId) => {
  const response = await fetch(`http://localhost:8000/admin/api/v1/customers/${customerId}/validate`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### 4. Gestion financière

```javascript
// Récupérer le résumé financier
const getFinancialSummary = async (token) => {
  const response = await fetch('http://localhost:8000/admin/api/v1/finance/summary', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Créer une facture
const createInvoice = async (token, invoiceData) => {
  const response = await fetch('http://localhost:8000/admin/api/v1/finance/invoices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(invoiceData)
  });
  return response.json();
};
```

### 5. Système et monitoring

```javascript
// Vérifier la santé du système
const checkSystemHealth = async (token) => {
  const response = await fetch('http://localhost:8000/admin/api/v1/admin/system/health', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Récupérer les logs système
const getSystemLogs = async (token, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:8000/admin/api/v1/admin/system/logs?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

---

## Notes importantes

### Rôles utilisateur

Le système utilise plusieurs rôles avec différents niveaux d'accès :

- **SUPER_ADMIN** : Accès complet à toutes les fonctionnalités
- **CTO** : Accès technique et configuration système
- **CUSTOMER_MANAGER** : Gestion des clients (SME et Institutions) - **NOUVEAU RÔLE**
- **FINANCIAL_ADMIN** : Administration financière et comptable - **NOUVEAU RÔLE**
- **COMPANY_ADMIN** : Gestion de l'entreprise et des utilisateurs
- **GROWTH_FINANCE** : Finance et croissance
- **CUSTOMER_SUPPORT** : Support client
- **CONTENT_MANAGER** : Gestion du contenu
- **COMPANY_USER** : Utilisateur d'entreprise de base

**Note importante** : Les rôles CUSTOMER_MANAGER et FINANCIAL_ADMIN ont été récemment ajoutés pour une gestion plus granulaire des permissions.

### Sécurité

#### Guards de sécurité utilisés

Le service utilise différents guards selon les modules :

1. **JwtAuthGuard** + **RolesGuard** (Modules : Users, Company, Settings)
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
   ```

2. **JwtBlacklistGuard** (Module : Customers)
   ```typescript
   @UseGuards(JwtBlacklistGuard)
   ```

3. **AuthGuard('jwt')** + **RolesGuard** (Module : Dashboard)
   ```typescript
   @UseGuards(AuthGuard('jwt'), RolesGuard)
   @Roles(Role.Admin)
   ```

#### Systèmes de permissions

**Permissions par rôles (Users, Company)** :
```typescript
UserRole.SUPER_ADMIN
UserRole.CTO
UserRole.CUSTOMER_MANAGER
UserRole.FINANCIAL_ADMIN
```

**Permissions par chaînes (Settings)** :
```typescript
'admin:settings:read'
'admin:settings:write'
```

**Permissions par énums (Dashboard)** :
```typescript
Role.Admin
Role.User
```

#### Vérification des tokens

- Tous les endpoints nécessitent une authentification via token JWT Auth0
- Le service Admin vérifie les tokens avec Auth0 JWKS (vérification RS256)
- **Pas de blacklist locale** : Ce service est destiné aux admins Wanzo (équipe interne de la plateforme)
- La révocation des accès admin se fait directement au niveau Auth0, pas via une blacklist locale
- Synchronisation automatique avec Customer Service via Kafka pour nouveaux utilisateurs
- Les rôles sont vérifiés via des guards NestJS spécialisés par module

### Synchronisation avec Customer Service

**Nouveauté** : Le service Admin synchronise automatiquement les utilisateurs avec le Customer Service :
- Lors de la première connexion, un événement Kafka `user.sync.request` est émis
- Les utilisateurs existants déclenchent un événement `user.login.notification`
- Si la synchronisation échoue, l'utilisateur est créé localement en fallback
- L'`organizationId` est extrait du token Auth0 et associé à l'utilisateur

### Pagination

Les endpoints de liste supportent généralement ces paramètres :
- `page` : Numéro de page (défaut: 1)
- `pageSize` : Nombre d'éléments par page (défaut: 20)
- `sortBy` : Champ de tri
- `sortOrder` : Ordre de tri (`asc` ou `desc`)

### Filtrage

Les endpoints de liste peuvent accepter des paramètres de filtrage spécifiques selon le contexte (status, date, type, etc.)

---

## Changements majeurs et impact frontend

### Structures de données modifiées

#### 1. Permissions utilisateur
**AVANT** :
```json
{
  "permissions": ["view_users", "edit_users"]
}
```

**MAINTENANT** :
```json
{
  "permissions": [
    {
      "applicationId": "default",
      "permissions": ["view_users", "edit_users"]
    }
  ]
}
```

#### 2. Nouveaux champs utilisateur
Les frontends doivent maintenant gérer :
- `idAgent` : ID unique de l'agent
- `validityEnd` : Date d'expiration
- `language` : Langue préférée
- `timezone` : Fuseau horaire
- `kyc` : Informations KYC complètes

#### 3. Nouveaux rôles
- `CUSTOMER_MANAGER` : Gestion des clients
- `FINANCIAL_ADMIN` : Administration financière

### Nouveaux endpoints disponibles

#### Dashboard enrichi
- `/dashboard/widgets/:widgetId` : Données de widgets spécifiques
- `/dashboard/configuration` : Configuration personnalisable
- `/dashboard/statistics/sales` : Statistiques de ventes
- `/dashboard/statistics/user-engagement` : Engagement utilisateur

#### Company
- `/company/stats` : Statistiques d'entreprise

#### Settings avancés
- `/settings/app` : Paramètres d'application
- `/settings/app/:id` : Mise à jour de paramètres spécifiques

### Compatibilité et migration

#### Pour les équipes frontend
1. **Mettre à jour les interfaces TypeScript** avec les nouveaux champs
2. **Adapter la gestion des permissions** au nouveau format objet
3. **Intégrer les nouveaux endpoints Dashboard** pour de meilleures fonctionnalités
4. **Gérer les nouveaux rôles** dans les interfaces d'administration

#### Exemples de migration

**Interface utilisateur (TypeScript)** :
```typescript
// AVANT
interface User {
  permissions: string[];
}

// MAINTENANT
interface User {
  permissions: {
    applicationId: string;
    permissions: string[];
  }[];
  idAgent?: string;
  validityEnd?: string;
  language?: string;
  timezone?: string;
  kyc?: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    documents?: KycDocument[];
  };
}
```

**Gestion des permissions** :
```typescript
// AVANT
const hasPermission = (user: User, permission: string) => 
  user.permissions.includes(permission);

// MAINTENANT
const hasPermission = (user: User, permission: string, appId = 'default') => 
  user.permissions
    ?.find(p => p.applicationId === appId)
    ?.permissions.includes(permission) || false;
```

---

## Support et documentation

- **Swagger UI** : `http://localhost:3001/api-docs` (accès direct au service)
- **Code source** : `apps/admin-service/src/`
- **Tests** : `apps/admin-service/test/`
- **Rapport d'analyse des écarts** : `API DOCUMENTATION/DATA_STRUCTURE_GAPS_ANALYSIS.md`

---

**Documentation mise à jour le** : 8 novembre 2025  
**Version** : 1.2.0 - Structures de données actualisées  
**Modules analysés** : Auth, Users, Company, Customers, Dashboard, Settings  
**Statut** : ✅ Synchronisé avec le code source
