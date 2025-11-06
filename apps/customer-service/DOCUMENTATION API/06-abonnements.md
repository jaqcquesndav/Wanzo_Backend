# Abonnements Modernes - Version 2.0

## 🎯 Vue d'Ensemble

Le système d'abonnements a été complètement refondu pour une **approche moderne avec tokens intégrés**. 

### ❌ SUPPRIMÉ : Achat de Tokens Indépendants
- Plus d'endpoints `/tokens/purchase`
- Plus de packages de tokens séparés
- Plus de `TokenPurchasePackage`

### ✅ NOUVEAU : Tokens Intégrés aux Plans
- Allocation mensuelle de tokens par plan
- Système de rollover intelligent
- Gestion automatique des limites

## 🏗️ Architecture des Données

### Base URL
```
http://localhost:8000/land/api/v1/subscriptions
```

### Types de Clients
```typescript
enum CustomerType {
  SME = 'sme',                          // Petites et Moyennes Entreprises
  FINANCIAL_INSTITUTION = 'financial'   // Institutions Financières
}
```

### Périodes de Facturation
```typescript
enum BillingPeriod {
  MONTHLY = 'monthly',
  ANNUAL = 'annual'     // Avec réductions automatiques
}
```

### Statuts d'Abonnement
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

## 📋 Structure des Plans Modernes

### Interface SubscriptionPlan
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  customerType: CustomerType;
  
  // Tarification
  monthlyPriceUSD: number;
  annualPriceUSD: number;        // Avec réduction automatique
  currency: 'USD';
  
  // 🆕 Allocation de Tokens Intégrée
  tokenAllocation: {
    monthlyTokens: number;       // Tokens inclus par mois
    rolloverLimit: number;       // Limite de report (tokens)
    rolloverPeriods: number;     // Nombre de périodes de report
  };
  
  // Fonctionnalités incluses
  features: Record<FeatureCode, PlanFeature>;
  
  // Métadonnées
  isVisible: boolean;
  isPopular: boolean;
  sortOrder: number;
  tags: string[];
}
```

### Fonctionnalités Granulaires
```typescript
interface PlanFeature {
  enabled: boolean;
  description?: string;
  limit?: number;           // Limite numérique si applicable
  metadata?: Record<string, any>;
}

enum FeatureCode {
  // 🏢 Gestion d'Entreprise
  COMMERCIAL_MANAGEMENT = 'commercial_management',
  CUSTOMER_MANAGEMENT = 'customer_management',
  SALES_TRACKING = 'sales_tracking',
  INVENTORY_MANAGEMENT = 'inventory_management',
  
  // 💰 Comptabilité et Finance
  ACCOUNTING_BASIC = 'accounting_basic',
  ACCOUNTING_ADVANCED = 'accounting_advanced',
  FINANCIAL_REPORTS = 'financial_reports',
  TAX_MANAGEMENT = 'tax_management',
  BUDGET_MANAGEMENT = 'budget_management',
  
  // 🤖 Intelligence Artificielle
  AI_CHAT_ASSISTANCE = 'ai_chat_assistance',
  DOCUMENT_ANALYSIS = 'document_analysis',
  PREDICTIVE_ANALYTICS = 'predictive_analytics',
  RISK_ANALYSIS = 'risk_analysis',
  
  // 👥 Ressources Humaines
  HR_MANAGEMENT = 'hr_management',
  PAYROLL_MANAGEMENT = 'payroll_management',
  EMPLOYEE_TRACKING = 'employee_tracking',
  
  // 🏦 Spécifique Institutions Financières
  LOAN_MANAGEMENT = 'loan_management',
  CREDIT_SCORING = 'credit_scoring',
  PORTFOLIO_MANAGEMENT = 'portfolio_management',
  REGULATORY_REPORTING = 'regulatory_reporting',
  RISK_MANAGEMENT = 'risk_management',
  
  // 🔧 Fonctionnalités Système
  MULTI_USER = 'multi_user',
  DATA_EXPORT = 'data_export',
  API_ACCESS = 'api_access',
  CUSTOM_REPORTS = 'custom_reports',
  PRIORITY_SUPPORT = 'priority_support'
}
```

## 📊 Plans Disponibles

### Plans PME (Small and Medium Enterprises)

#### 1. SME Freemium
```typescript
{
  id: 'sme-freemium',
  name: 'PME Freemium',
  description: 'Plan gratuit pour découvrir la plateforme',
  customerType: CustomerType.SME,
  monthlyPriceUSD: 0,
  annualPriceUSD: 0,
  tokenAllocation: {
    monthlyTokens: 100000,      // 100K tokens/mois
    rolloverLimit: 50000,       // 50K tokens max de report
    rolloverPeriods: 1          // 1 mois de report
  },
  features: {
    [FeatureCode.COMMERCIAL_MANAGEMENT]: { enabled: true, limit: 10 },
    [FeatureCode.ACCOUNTING_BASIC]: { enabled: true },
    [FeatureCode.AI_CHAT_ASSISTANCE]: { enabled: true, limit: 50 },
    [FeatureCode.MULTI_USER]: { enabled: false }
  }
}
```

#### 2. SME Standard  
```typescript
{
  id: 'sme-standard',
  name: 'PME Standard',
  description: 'ERP complet avec accès aux financements',
  customerType: CustomerType.SME,
  monthlyPriceUSD: 20,
  annualPriceUSD: 204,          // 15% de réduction
  tokenAllocation: {
    monthlyTokens: 2000000,     // 2M tokens/mois
    rolloverLimit: 1000000,     // 1M tokens max de report
    rolloverPeriods: 2          // 2 mois de report
  },
  features: {
    [FeatureCode.COMMERCIAL_MANAGEMENT]: { enabled: true },
    [FeatureCode.ACCOUNTING_ADVANCED]: { enabled: true },
    [FeatureCode.AI_CHAT_ASSISTANCE]: { enabled: true },
    [FeatureCode.DOCUMENT_ANALYSIS]: { enabled: true },
    [FeatureCode.HR_MANAGEMENT]: { enabled: true },
    [FeatureCode.MULTI_USER]: { enabled: true, limit: 5 }
  }
}
```

### Plans Institutions Financières

#### 1. Financial Freemium
```typescript
{
  id: 'financial-freemium',
  name: 'Institution Freemium',
  description: 'Découverte outils de base pour institutions',
  customerType: CustomerType.FINANCIAL_INSTITUTION,
  monthlyPriceUSD: 0,
  annualPriceUSD: 0,
  tokenAllocation: {
    monthlyTokens: 500000,      // 500K tokens/mois
    rolloverLimit: 250000,      // 250K tokens max de report
    rolloverPeriods: 1          // 1 mois de report
  },
  features: {
    [FeatureCode.LOAN_MANAGEMENT]: { enabled: true, limit: 10 },
    [FeatureCode.CREDIT_SCORING]: { enabled: true, limit: 50 },
    [FeatureCode.AI_CHAT_ASSISTANCE]: { enabled: true }
  }
}
```

#### 2. Financial Professional
```typescript
{
  id: 'financial-professional',
  name: 'Institution Professional',
  description: 'Plateforme complète de gestion de portefeuille',
  customerType: CustomerType.FINANCIAL_INSTITUTION,
  monthlyPriceUSD: 100,
  annualPriceUSD: 1020,        // 15% de réduction
  tokenAllocation: {
    monthlyTokens: 10000000,   // 10M tokens/mois
    rolloverLimit: 5000000,    // 5M tokens max de report
    rolloverPeriods: 3         // 3 mois de report
  },
  features: {
    [FeatureCode.LOAN_MANAGEMENT]: { enabled: true },
    [FeatureCode.PORTFOLIO_MANAGEMENT]: { enabled: true },
    [FeatureCode.RISK_MANAGEMENT]: { enabled: true },
    [FeatureCode.REGULATORY_REPORTING]: { enabled: true },
    [FeatureCode.PREDICTIVE_ANALYTICS]: { enabled: true },
    [FeatureCode.MULTI_USER]: { enabled: true, limit: 20 }
  }
}
```

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

}
```

## 🔗 Endpoints API Modernes

### Authentification
Tous les endpoints nécessitent un token Auth0 Bearer :
```http
Authorization: Bearer <access_token>
```

### 1. Récupérer les Plans Disponibles
```http
GET /subscriptions/plans?customerType=sme&billingPeriod=monthly
```

**Paramètres de requête** :
- `customerType` : `sme` | `financial` (optionnel)
- `billingPeriod` : `monthly` | `annual` (optionnel)
- `isVisible` : `true` | `false` (optionnel)

**Réponse** :
```json
{
  "data": [
    {
      "id": "sme-freemium",
      "name": "PME Freemium", 
      "description": "Plan gratuit pour découvrir la plateforme",
      "customerType": "sme",
      "monthlyPriceUSD": 0,
      "annualPriceUSD": 0,
      "tokenAllocation": {
        "monthlyTokens": 100000,
        "rolloverLimit": 50000,
        "rolloverPeriods": 1
      },
      "features": {
        "commercial_management": {
          "enabled": true,
          "limit": 10,
          "description": "Gestion de 10 clients maximum"
        },
        "accounting_basic": {
          "enabled": true,
          "description": "Comptabilité de base"
        },
        "ai_chat_assistance": {
          "enabled": true,
          "limit": 50,
          "description": "50 interactions IA par mois"
        }
      },
      "isPopular": false,
      "isVisible": true,
      "tags": ["gratuit", "découverte"]
    },
    {
      "id": "sme-standard",
      "name": "PME Standard",
      "description": "ERP complet avec financements",
      "customerType": "sme", 
      "monthlyPriceUSD": 20,
      "annualPriceUSD": 204,          // 15% de réduction
      "tokenAllocation": {
        "monthlyTokens": 2000000,
        "rolloverLimit": 1000000,
        "rolloverPeriods": 2
      },
      "features": {
        "commercial_management": { "enabled": true },
        "accounting_advanced": { "enabled": true },
        "ai_chat_assistance": { "enabled": true },
        "document_analysis": { "enabled": true },
        "hr_management": { "enabled": true },
        "multi_user": { 
          "enabled": true, 
          "limit": 5,
          "description": "Jusqu'à 5 utilisateurs"
        }
      },
      "isPopular": true,
      "isVisible": true,
      "tags": ["recommandé", "populaire"]
    }
  ],
  "meta": {
    "total": 2,
    "customerTypes": ["sme", "financial"],
    "billingPeriods": ["monthly", "annual"]
  }
}
```

### 2. Créer un Abonnement
```http
POST /subscriptions
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "planId": "sme-standard",
  "billingPeriod": "monthly",
  "paymentMethod": {
    "type": "mobile",
    "provider": "mpesa",
    "phoneNumber": "+243820123456",
    "pin": "1234"
  },
  "billingDetails": {
    "name": "Jean Mutombo",
    "email": "jean@kiota-tech.com",
    "companyName": "KIOTA TECH SARL",
    "address": {
      "street": "Avenue Roi Baudouin 123",
      "city": "Kinshasa",
      "province": "Kinshasa", 
      "country": "RDC"
    }
  }
}
```

**Réponse** :
```json
{
  "data": {
    "id": "sub_123456",
    "planId": "sme-standard",
    "status": "active",
    "billingPeriod": "monthly",
    "currentPeriodStart": "2025-11-05T10:00:00Z",
    "currentPeriodEnd": "2025-12-05T10:00:00Z",
    "tokenBalance": {
      "monthlyAllocation": 2000000,
      "usedTokens": 0,
      "remainingTokens": 2000000,
      "rolledOverTokens": 0
    },
    "nextBillingDate": "2025-12-05T10:00:00Z",
    "totalAmount": 20.00,
    "currency": "USD"
  }
}
```

### 3. Récupérer l'Abonnement Actuel
```http
GET /subscriptions/current
```

**Réponse** :
```json
{
  "data": {
    "id": "sub_123456",
    "plan": {
      "id": "sme-standard",
      "name": "PME Standard",
      "monthlyPriceUSD": 20,
      "tokenAllocation": {
        "monthlyTokens": 2000000,
        "rolloverLimit": 1000000,
        "rolloverPeriods": 2
      },
      "features": {
        "commercial_management": { "enabled": true },
        "accounting_advanced": { "enabled": true }
      }
    },
    "status": "active",
    "billingPeriod": "monthly",
    "currentPeriodStart": "2025-11-05T10:00:00Z",
    "currentPeriodEnd": "2025-12-05T10:00:00Z",
    "tokenBalance": {
      "totalTokens": 2500000,      // Inclut rollover
      "monthlyAllocation": 2000000,
      "usedTokens": 150000,
      "remainingTokens": 2350000,
      "rolledOverTokens": 500000,
      "currentPeriod": "2025-11",
      "rolloverHistory": [
        {
          "period": "2025-10",
          "rolledAmount": 500000,
          "date": "2025-11-01T00:00:00Z"
        }
      ]
    },
    "nextBillingDate": "2025-12-05T10:00:00Z",
    "autoRenew": true
  }
}
```

### 4. Modifier un Abonnement
```http
PUT /subscriptions/{id}
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "planId": "sme-premium",        // Upgrade/downgrade
  "billingPeriod": "annual",      // Changement période
  "autoRenew": false              // Modifier renouvellement
}
```

### 5. Annuler un Abonnement
```http
DELETE /subscriptions/{id}
```

**Paramètres de requête** :
- `cancelAtPeriodEnd` : `true` | `false` (défaut: true)
- `reason` : Raison de l'annulation (optionnel)

**Réponse** :
```json
{
  "data": {
    "id": "sub_123456",
    "status": "canceled",
    "canceledAt": "2025-11-05T10:00:00Z",
    "serviceEndDate": "2025-12-05T10:00:00Z",
    "refundAmount": 0,
    "reason": "Plan no longer needed"
  }
}
```

## 🪙 Gestion des Tokens Intégrés

### 1. Solde de Tokens Actuel
```http
GET /tokens/balance
```

**Réponse** :
```json
{
  "data": {
    "customerId": "user_123",
    "totalTokens": 2350000,
    "monthlyAllocation": 2000000,
    "usedTokens": 150000,
    "remainingTokens": 2350000,
    "rolledOverTokens": 500000,
    "bonusTokens": 100000,
    "currentPeriod": "2025-11",
    "periodStartDate": "2025-11-01T00:00:00Z",
    "periodEndDate": "2025-11-30T23:59:59Z",
    "rolloverHistory": [
      {
        "period": "2025-10",
        "rolledAmount": 500000,
        "date": "2025-11-01T00:00:00Z",
        "expiryDate": "2025-12-31T23:59:59Z"
      }
    ]
  }
}
```

### 2. Historique des Transactions de Tokens
```http
GET /tokens/transactions?page=1&limit=20&type=usage&feature=ai_chat_assistance
```

**Paramètres de requête** :
- `page` : Page (défaut: 1)
- `limit` : Limite par page (défaut: 20, max: 100)
- `type` : Type de transaction (`usage`, `allocation`, `bonus`, `expiry`)
- `feature` : Code de fonctionnalité spécifique
- `startDate` : Date de début (ISO 8601)
- `endDate` : Date de fin (ISO 8601)

**Réponse** :
```json
{
  "data": [
    {
      "id": "tx_789012",
      "customerId": "user_123",
      "transactionType": "usage",
      "tokenAmount": -5000,
      "balanceBefore": 2355000,
      "balanceAfter": 2350000,
      "featureCode": "ai_chat_assistance",
      "description": "Conversation IA - Analyse financière",
      "metadata": {
        "sessionId": "chat_456",
        "duration": 180,
        "messageCount": 12
      },
      "createdAt": "2025-11-05T09:30:00Z"
    },
    {
      "id": "tx_789011",
      "customerId": "user_123", 
      "transactionType": "allocation",
      "tokenAmount": 2000000,
      "balanceBefore": 500000,
      "balanceAfter": 2500000,
      "description": "Allocation mensuelle - Plan SME Standard",
      "createdAt": "2025-11-01T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8
    },
    "summary": {
      "totalUsage": 1200000,
      "totalAllocated": 4000000,
      "periodStart": "2025-11-01T00:00:00Z",
      "periodEnd": "2025-11-30T23:59:59Z"
    }
  }
}
```

### 3. Enregistrer Utilisation de Tokens
```http
POST /tokens/usage
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "featureCode": "document_analysis",
  "tokenAmount": 15000,
  "description": "Analyse contrat de prêt",
  "metadata": {
    "documentType": "loan_contract",
    "pages": 8,
    "complexity": "high",
    "processingTime": 45
  }
}
```

**Réponse** :
```json
{
  "data": {
    "transactionId": "tx_789013",
    "tokenAmount": 15000,
    "newBalance": 2335000,
    "featureCode": "document_analysis",
    "success": true
  }
}
```

## 💳 Gestion des Paiements

### 1. Historique des Paiements
```http
GET /payments?page=1&limit=10&status=completed
```

**Réponse** :
```json
{
  "data": [
    {
      "id": "pay_345678",
      "subscriptionId": "sub_123456",
      "amount": 20.00,
      "currency": "USD",
      "status": "completed",
      "paymentMethod": {
        "type": "mobile",
        "provider": "mpesa",
        "lastFour": "3456"
      },
      "billingPeriod": "2025-11-05 to 2025-12-05",
      "paidAt": "2025-11-05T10:05:00Z",
      "receiptUrl": "https://api.wanzo.land/receipts/pay_345678"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 12,
      "pages": 2
    }
  }
}
```

### 2. Télécharger Reçu
```http
GET /payments/{paymentId}/receipt
```

**Réponse** : PDF du reçu ou redirection vers URL de téléchargement

## 🔒 Sécurité et Permissions

### Contrôle d'Accès par Fonctionnalité
Chaque utilisation de fonctionnalité vérifie automatiquement :
1. **Plan actif** : L'utilisateur a un abonnement valide
2. **Fonctionnalité incluse** : La fonctionnalité est dans le plan
3. **Limites respectées** : Les limites du plan ne sont pas dépassées
4. **Solde de tokens** : Tokens suffisants pour l'opération

### Middleware de Vérification
```typescript
@UseGuards(FeatureAccessGuard)
@RequireFeature(FeatureCode.AI_CHAT_ASSISTANCE)
async chatWithAI(@Body() data: ChatRequest) {
  // La logique de vérification est automatique
  // Les tokens sont déduits automatiquement
}
```

## 📊 Métriques et Analytics

### Utilisation des Tokens par Fonctionnalité
```http
GET /analytics/token-usage?period=month&groupBy=feature
```

### Statistiques d'Abonnement
```http
GET /analytics/subscription-stats?period=quarter
```

## ⚡ Logique Métier

### Allocation Automatique de Tokens
- **Début de période** : Allocation automatique selon le plan
- **Rollover intelligent** : Report des tokens non utilisés selon les limites
- **Expiration gérée** : Nettoyage automatique des tokens expirés

### Gestion des Upgrades/Downgrades
- **Upgrade immédiat** : Accès immédiat aux nouvelles fonctionnalités
- **Downgrade en fin de période** : Maintien du service jusqu'à la fin
- **Prorata automatique** : Calcul automatique des ajustements

### Système de Facturation
- **Facturation récurrente** : Automatique selon la période choisie
- **Échecs de paiement** : Workflow de récupération automatique
- **Notifications** : Alertes avant échéance et en cas de problème
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

---

*Documentation mise à jour le 5 novembre 2025 pour refléter l'architecture moderne avec système de tokens intégré aux plans d'abonnement et suppression de l'achat indépendant de tokens.*
