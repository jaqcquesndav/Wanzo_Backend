# Abonnements et Paiements

## Structure des données

Basée sur la configuration centralisée (`src/config/subscription-pricing.config.ts`) :

### Types de clients

```typescript
enum CustomerType {
  SME = 'sme',
  FINANCIAL_INSTITUTION = 'financial_institution'
}
```

### Périodes de facturation

```typescript
enum BillingPeriod {
  MONTHLY = 'monthly',
  ANNUAL = 'annual'
}
```

### Codes des fonctionnalités

```typescript
enum FeatureCode {
  // Gestion commerciale
  COMMERCIAL_MANAGEMENT = 'commercial_management',
  CUSTOMER_MANAGEMENT = 'customer_management',
  SALES_TRACKING = 'sales_tracking',
  INVENTORY_MANAGEMENT = 'inventory_management',
  
  // Comptabilité
  ACCOUNTING_BASIC = 'accounting_basic',
  ACCOUNTING_ADVANCED = 'accounting_advanced',
  FINANCIAL_REPORTS = 'financial_reports',
  TAX_MANAGEMENT = 'tax_management',
  
  // IA et tokens
  AI_CHAT_ASSISTANCE = 'ai_chat_assistance',
  DOCUMENT_ANALYSIS = 'document_analysis',
  PREDICTIVE_ANALYTICS = 'predictive_analytics',
  
  // ... autres fonctionnalités
}
```

### Plans d'abonnement

```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  customerType: CustomerType;
  billingPeriod: BillingPeriod;
  
  // Tarification
  monthlyPriceUSD: number;
  annualPriceUSD: number;
  annualDiscountPercentage: number; // Réduction appliquée sur le prix annuel
  
  // Allocation de tokens
  tokenAllocation: TokenAllocation;
  
  // Fonctionnalités incluses
  features: PlanFeatures;
  
  // Métadonnées
  isPopular: boolean;
  isVisible: boolean; // Pour désactiver temporairement un plan
  sortOrder: number;
  tags: string[];
}
```

### Packages d'achat de tokens

```typescript
interface TokenPurchasePackage {
  id: string;
  name: string;
  description: string;
  tokenAmount: number;
  priceUSD: number;
  pricePerMillionTokens: number; // Calculé automatiquement
  bonusPercentage: number; // Tokens bonus offerts
  customerTypes: CustomerType[]; // Quels types de clients peuvent acheter ce package
  isVisible: boolean;
  sortOrder: number;
}
```

### États des abonnements

```typescript
enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
  PAST_DUE = 'past_due'
}
```

## Endpoints API

### Pricing

#### Récupérer tous les plans d'abonnement

```
GET /pricing/plans
```

**Paramètres de requête (optionnels)**:
- `customerType` : 'sme' | 'financial_institution'
- `billingPeriod` : 'monthly' | 'annual'

**Implémentation** : `PricingController.getSubscriptionPlans()`

#### Réponse

```json
{
  "plans": [
    {
      "id": "sme-freemium",
      "name": "PME Freemium",
      "description": "Accès gratuit avec limitations pour découvrir la plateforme",
      "customerType": "sme",
      "billingPeriod": "monthly",
      "monthlyPriceUSD": 0,
      "annualPriceUSD": 0,
      "annualDiscountPercentage": 0,
      "tokenAllocation": {
        "monthlyTokens": 100000,
        "tokenRollover": false,
        "maxRolloverMonths": 0
      },
      "features": {
        "commercial_management": {
          "enabled": true,
          "limit": 50,
          "description": "50 clients max"
        },
        // ... autres fonctionnalités
      },
      "isPopular": false,
      "isVisible": true,
      "sortOrder": 1,
      "tags": ["gratuit", "débutant", "limitation"]
    },
    {
      "id": "sme-standard",
      "name": "PME Standard",
      "description": "Plan complet pour PME avec accès aux demandes de financement",
      "customerType": "sme",
      "billingPeriod": "monthly",
      "monthlyPriceUSD": 20,
      "annualPriceUSD": 200,
      "annualDiscountPercentage": 16.67,
      "isPopular": true,
      // ... autres détails
    }
  ]
}
```

### Créer un abonnement

```
POST /subscriptions
```

**Implémentation** : `SubscriptionApiService.createSubscription(data)`

#### Corps de la requête

```json
{
  "planId": "plan-business",
  "paymentMethod": {
    "type": "mobile",
    "mobileMoneyProvider": "M-Pesa",
    "mobileMoneyNumber": "+243820123456"
  },
  "billingDetails": {
    "name": "Jean Mutombo",
    "email": "jean@example.com",
    "address": {
      "line1": "123 Ave Libération", 
      "city": "Kinshasa",
      "postalCode": "12345",
      "country": "CD"
    }
  }
}
```

### Récupérer l'abonnement actuel

```
GET /subscriptions/current
```

**Implémentation** : `SubscriptionApiService.getCurrentSubscription()`

### Annuler l'abonnement

```
POST /subscriptions/cancel
```

**Implémentation** : `SubscriptionApiService.cancelSubscription()`

### Changer de plan

```
POST /subscriptions/change-plan
```

**Implémentation** : `SubscriptionApiService.changeSubscriptionPlan(data)`

#### Corps de la requête

```json
{
  "planId": "plan-premium",
  "effectiveDate": "2024-01-01T00:00:00Z"
}
```

## Gestion des tokens

### Récupérer le solde de tokens

```
GET /tokens/balance
```

**Implémentation** : `SubscriptionApiService.getTokenBalance()`

### Acheter des tokens

```
POST /tokens/purchase
```

**Implémentation** : `SubscriptionApiService.purchaseTokens(data)`

#### Corps de la requête

```json
{
  "amount": 100,
  "paymentMethod": {
    "type": "mobile",
    "mobileMoneyProvider": "Orange Money",
    "mobileMoneyNumber": "+243990123456"
  }
}
```

### Historique des transactions de tokens

```
GET /tokens/transactions?page=1&limit=10
```

**Implémentation** : `SubscriptionApiService.getTokenTransactions(params)`

## Gestion des paiements

### Historique des paiements

```
GET /payments?page=1&limit=10
```

**Implémentation** : `SubscriptionApiService.getPaymentHistory(params)`

### Télécharger un reçu

```
GET /payments/{paymentId}/receipt
```

**Implémentation** : `SubscriptionApiService.downloadReceipt(paymentId)`
- Retourne un fichier PDF
- Headers : `Accept: application/pdf`

### Upload de preuve de paiement manuel

```
POST /payments/manual-proof
```

**Implémentation** : `SubscriptionApiService.uploadManualPaymentProof(data)`

#### Corps de la requête (multipart/form-data)

```
proofFile: [File]
referenceNumber: "TX123456789"
amount: 99.99
paymentDate: "2024-01-15"
planId: "plan-business" (optionnel)
tokenAmount: 100 (optionnel)
```
  "currency": "USD",
  "status": "paid",
  "paymentMethod": {
    "type": "card",
    "lastFour": "4242",
    "brand": "visa"
  },
  "paymentGateway": "stripe",
  "gatewayPaymentId": "pi_12345678",
  "description": "Abonnement Business - Octobre 2023",
  "billingDetails": {
    "name": "Jean Mutombo",
    "email": "j.mutombo@example.com",
    "address": {
      "line1": "123 Rue de la Paix",
      "city": "Kinshasa",
      "postalCode": "00000",
      "country": "CD"
    }
  },
  "metadata": {},
  "createdAt": "2023-10-15T14:30:00Z",
  "updatedAt": "2023-10-15T14:35:00Z"
}
```

## Endpoints API

### Plans d'abonnement

#### Lister les plans disponibles

```
GET /land/api/v1/subscription/plans
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": [
    {
      "id": "plan-starter",
      "name": "Starter",
      "description": "Pour les petites entreprises",
      "price": 49.99,
      "currency": "USD",
      "billingFrequency": "monthly",
      "features": [
        "Accès de base à la plateforme",
        "Support par email",
        "Rapports basiques"
      ]
    },
    {
      "id": "plan-business",
      "name": "Business",
      "description": "Pour les PME en croissance",
      "price": 99.99,
      "currency": "USD",
      "billingFrequency": "monthly",
      "features": [
        "Accès complet à la plateforme",
        "Support prioritaire",
        "Rapports avancés",
        "Intégration API"
      ]
    },
    {
      "id": "plan-enterprise",
      "name": "Enterprise",
      "description": "Pour les grandes entreprises",
      "price": 199.99,
      "currency": "USD",
      "billingFrequency": "monthly",
      "features": [
        "Accès complet à la plateforme",
        "Support dédié 24/7",
        "Rapports personnalisés",
        "Intégration API avancée",
        "Formation personnalisée"
      ]
    }
  ]
}
```

### Abonnements

#### S'abonner à un plan

```
POST /land/api/v1/subscriptions
```

##### Corps de la requête

```json
{
  "planId": "plan-business",
  "paymentMethod": {
    "type": "card",
    "cardNumber": "4242424242424242",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "cvc": "123",
    "name": "Jean Mutombo"
  },
  "billingDetails": {
    "name": "Jean Mutombo",
    "email": "j.mutombo@example.com",
    "address": {
      "line1": "123 Rue de la Paix",
      "city": "Kinshasa",
      "postalCode": "00000",
      "country": "CD"
    }
  }
}
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "sub-123",
    "plan": {
      "id": "plan-business",
      "name": "Business"
    },
    "status": "active",
    "currentPeriodEnd": "2023-12-15T14:30:00Z",
    "paymentMethod": {
      "type": "card",
      "lastFour": "4242",
      "brand": "visa"
    }
  }
}
```

#### S'abonner avec un paiement mobile

```
POST /land/api/v1/subscriptions
```

##### Corps de la requête

```json
{
  "planId": "plan-business",
  "paymentMethod": {
    "type": "mobile",
    "mobileMoneyProvider": "M-Pesa",
    "mobileMoneyNumber": "+243820123456"
  }
}
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "sub-123",
    "plan": {
      "id": "plan-business",
      "name": "Business"
    },
    "status": "pending",
    "message": "Veuillez confirmer le paiement sur votre téléphone mobile."
  }
}
```

#### Récupérer l'abonnement actuel

```
GET /land/api/v1/subscriptions/current
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "sub-123",
    "plan": {
      "id": "plan-business",
      "name": "Business",
      "description": "Pour les PME en croissance",
      "price": 99.99,
      "currency": "USD",
      "billingFrequency": "monthly",
      "features": [
        "Accès complet à la plateforme",
        "Support prioritaire",
        "Rapports avancés",
        "Intégration API"
      ]
    },
    "status": "active",
    "startDate": "2023-10-15T14:30:00Z",
    "currentPeriodStart": "2023-11-15T14:30:00Z",
    "currentPeriodEnd": "2023-12-15T14:30:00Z",
    "cancelAtPeriodEnd": false,
    "paymentMethod": {
      "type": "card",
      "lastFour": "4242",
      "brand": "visa"
    }
  }
}
```

#### Annuler un abonnement

```
POST /land/api/v1/subscriptions/current/cancel
```

##### Corps de la requête

```json
{
  "cancelAtPeriodEnd": true,
  "reason": "trop_cher"
}
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "sub-123",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2023-12-15T14:30:00Z",
    "message": "Votre abonnement sera annulé à la fin de la période en cours."
  }
}
```

#### Changer de plan d'abonnement

```
POST /land/api/v1/subscriptions/current/change-plan
```

##### Corps de la requête

```json
{
  "planId": "plan-enterprise"
}
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "sub-123",
    "plan": {
      "id": "plan-enterprise",
      "name": "Enterprise"
    },
    "status": "active",
    "currentPeriodEnd": "2023-12-15T14:30:00Z",
    "message": "Votre plan a été mis à jour avec succès."
  }
}
```

### Tokens

#### Acheter des tokens

```
POST /land/api/v1/tokens/purchase
```

##### Corps de la requête

```json
{
  "amount": 100,
  "paymentMethod": {
    "type": "mobile",
    "mobileMoneyProvider": "M-Pesa",
    "mobileMoneyNumber": "+243820123456"
  }
}
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "trx-123",
      "type": "purchase",
      "amount": 100,
      "price": 25.00,
      "currency": "USD",
      "status": "pending",
      "paymentMethod": "mobile",
      "mobileMoneyProvider": "M-Pesa",
      "mobileMoneyNumber": "+243820123456",
      "createdAt": "2023-10-20T10:15:00Z"
    },
    "message": "Veuillez confirmer le paiement sur votre téléphone mobile."
  }
}
```

#### Récupérer le solde de tokens

```
GET /land/api/v1/tokens/balance
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "balance": 150,
    "totalPurchased": 500
  }
}
```

#### Récupérer l'historique des transactions de tokens

```
GET /land/api/v1/tokens/transactions?page=1&limit=10
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": [
    {
      "id": "trx-123",
      "type": "purchase",
      "amount": 100,
      "price": 25.00,
      "currency": "USD",
      "status": "completed",
      "paymentMethod": "mobile",
      "mobileMoneyProvider": "M-Pesa",
      "mobileMoneyNumber": "+243820123456",
      "createdAt": "2023-10-20T10:15:00Z"
    },
    {
      "id": "trx-124",
      "type": "usage",
      "amount": -10,
      "feature": "ai_analysis",
      "resourceId": "report-567",
      "createdAt": "2023-10-25T16:30:00Z"
    },
    {
      "id": "trx-125",
      "type": "bonus",
      "amount": 50,
      "reason": "promotional",
      "promotionId": "promo-summer2023",
      "createdAt": "2023-11-01T09:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "pages": 1
    }
  }
}
```

### Paiements

#### Récupérer l'historique des paiements

```
GET /land/api/v1/payments?page=1&limit=10
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": [
    {
      "id": "pay-123",
      "date": "2023-10-15T14:30:00Z",
      "amount": 99.99,
      "currency": "USD",
      "method": "Carte Visa ****4242",
      "plan": "Business",
      "status": "Payé",
      "receiptUrl": "https://api.kiota.tech/land/api/v1/payments/pay-123/receipt"
    },
    {
      "id": "pay-124",
      "date": "2023-10-20T10:15:00Z",
      "amount": 25.00,
      "currency": "USD",
      "method": "M-Pesa +243820******56",
      "plan": "Achat de tokens",
      "status": "Payé",
      "receiptUrl": "https://api.kiota.tech/land/api/v1/payments/pay-124/receipt"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "pages": 1
    }
  }
}
```

#### Télécharger un reçu de paiement

```
GET /land/api/v1/payments/{paymentId}/receipt
```

Retourne un fichier PDF contenant le reçu du paiement.

#### Effectuer un paiement manuel (preuve de transfert)

```
POST /land/api/v1/payments/manual
Content-Type: multipart/form-data
```

##### Corps de la requête

```
planId: plan-business
amount: 99.99
transactionId: TR123456
proofScreenshot: [FILE]
```

##### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "pay-125",
    "status": "pending",
    "message": "Votre preuve de paiement a été soumise avec succès et est en cours de vérification."
  }
}
```

## Logique métier

### Plans et tarification

Les plans d'abonnement sont définis avec différents niveaux d'accès et de fonctionnalités. Les prix peuvent être affichés en différentes devises (USD, CDF, EUR) mais sont stockés en USD.

### Processus d'abonnement

1. L'utilisateur choisit un plan d'abonnement
2. Il fournit les informations de paiement (carte, mobile money, preuve de transfert)
3. Le paiement est traité
4. L'abonnement est activé
5. Des rappels sont envoyés avant l'expiration de l'abonnement

### Gestion des tokens

Les tokens sont utilisés pour des fonctionnalités spécifiques comme l'analyse AI ou les rapports avancés. Les utilisateurs peuvent acheter des tokens supplémentaires ou en recevoir via des promotions.

### Méthodes de paiement

Le système supporte plusieurs méthodes de paiement :
- Carte bancaire (via Stripe ou autre processeur)
- Mobile money (M-Pesa, Orange Money, etc.)
- Paiement manuel (transfert bancaire avec preuve)

### Factures et reçus

Des factures et reçus sont générés automatiquement pour chaque transaction et peuvent être téléchargés par l'utilisateur.
