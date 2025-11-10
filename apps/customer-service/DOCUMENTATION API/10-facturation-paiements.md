# Facturation et Paiements - Customer Service API

## 🎯 Vue d'Ensemble

Le module de facturation du **customer-service** gère la création, le suivi et la gestion des factures et paiements pour les clients. Il s'intègre avec le système d'abonnements et le service Stripe pour offrir une solution complète de facturation.

### Architecture
- **Factures automatiques** : Générées automatiquement pour les abonnements
- **Factures manuelles** : Créées manuellement par les administrateurs
- **Paiements multiples** : Support de plusieurs méthodes de paiement
- **Reçus PDF** : Génération automatique de reçus (en développement)
- **Intégration Stripe** : Pour les paiements par cartes bancaires

## 🏗️ Structures de Données

### Base URL
```
http://localhost:8000/land/api/v1/billing
```

### Statuts des Factures

```typescript
enum InvoiceStatus {
  DRAFT = 'draft',           // Brouillon (non envoyée)
  ISSUED = 'issued',         // Émise (envoyée au client)
  PAID = 'paid',            // Payée intégralement
  PARTIALLY_PAID = 'partially_paid', // Payée partiellement
  OVERDUE = 'overdue',      // En retard de paiement
  CANCELLED = 'cancelled',   // Annulée
  REFUNDED = 'refunded'     // Remboursée
}
```

### Méthodes de Paiement

```typescript
enum PaymentMethod {
  CREDIT_CARD = 'credit_card',    // Carte bancaire (via Stripe)
  BANK_TRANSFER = 'bank_transfer', // Virement bancaire
  PAYPAL = 'paypal',              // PayPal
  MOBILE_MONEY = 'mobile_money',   // Mobile Money (M-Pesa, Orange Money, etc.)
  CRYPTO = 'crypto',              // Cryptomonnaies
  MANUAL = 'manual',              // Paiement manuel (avec preuve)
  OTHER = 'other'                 // Autre méthode
}
```

### Statuts des Paiements

```typescript
enum PaymentStatus {
  PENDING = 'pending',     // En attente
  COMPLETED = 'completed', // Complété
  FAILED = 'failed',       // Échoué
  REFUNDED = 'refunded',   // Remboursé
  CANCELLED = 'cancelled'  // Annulé
}
```

### Structure d'une Facture

```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;        // Numéro unique (format: INV-YYMM-0001)
  customerId: string;
  subscriptionId?: string;      // Lié à un abonnement si applicable
  
  // Montants
  amount: number;
  currency: string;
  amountPaid: number;
  
  // Statut et dates
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  
  // Détails
  notes?: string;
  billingAddress?: string;
  
  // Articles facturés
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  
  // Relations
  customer: Customer;
  subscription?: Subscription;
  payments: Payment[];
  
  // Métadonnées
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Structure d'un Paiement

```typescript
interface Payment {
  id: string;
  customerId: string;
  invoiceId?: string;           // Peut être null pour paiements indépendants
  
  // Montant et devise
  amount: number;
  currency: string;
  
  // Méthode et statut
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  
  // Détails de transaction
  transactionId?: string;       // ID de transaction externe
  paymentGateway?: string;      // Gateway utilisé (stripe, paypal, etc.)
  stripePaymentIntentId?: string; // ID Stripe si applicable
  paymentDate?: Date;
  
  // Informations additionnelles
  notes?: string;
  gatewayResponse?: Record<string, any>; // Réponse du gateway (cryptée)
  metadata?: Record<string, any>;        // Métadonnées (cryptées)
  
  // Relations
  customer: Customer;
  invoice?: Invoice;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔗 Endpoints API

### Authentification
Tous les endpoints nécessitent un token Auth0 Bearer :
```http
Authorization: Bearer <access_token>
```

## 📋 Gestion des Factures

### 1. Créer une Facture

```http
POST /billing/invoices
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "customerId": "customer-uuid",
  "subscriptionId": "sub-uuid", // Optionnel
  "amount": 99.99,
  "currency": "USD",
  "issueDate": "2025-11-05T00:00:00Z",
  "dueDate": "2025-12-05T00:00:00Z",
  "notes": "Abonnement Premium - Novembre 2025",
  "billingAddress": "123 Rue de la Paix, Kinshasa, RDC",
  "items": [
    {
      "description": "Abonnement Premium - Novembre 2025",
      "quantity": 1,
      "unitPrice": 99.99,
      "amount": 99.99
    }
  ],
  "metadata": {
    "subscriptionPeriod": "2025-11"
  }
}
```

**Réponse** :
```json
{
  "id": "inv-uuid",
  "invoiceNumber": "INV-2511-0001",
  "customerId": "customer-uuid",
  "subscriptionId": "sub-uuid",
  "amount": 99.99,
  "currency": "USD",
  "amountPaid": 0,
  "status": "draft",
  "issueDate": "2025-11-05T00:00:00Z",
  "dueDate": "2025-12-05T00:00:00Z",
  "items": [
    {
      "description": "Abonnement Premium - Novembre 2025",
      "quantity": 1,
      "unitPrice": 99.99,
      "amount": 99.99
    }
  ],
  "createdAt": "2025-11-05T10:00:00Z",
  "updatedAt": "2025-11-05T10:00:00Z"
}
```

### 2. Publier une Facture (DRAFT → ISSUED)

```http
PUT /billing/invoices/{invoiceId}/issue
```

**Réponse** :
```json
{
  "id": "inv-uuid",
  "status": "issued",
  "issueDate": "2025-11-05T10:00:00Z",
  "message": "Facture publiée avec succès"
}
```

### 3. Récupérer une Facture

```http
GET /billing/invoices/{invoiceId}
```

**Réponse** :
```json
{
  "id": "inv-uuid",
  "invoiceNumber": "INV-2511-0001",
  "customer": {
    "id": "customer-uuid",
    "name": "KIOTA TECH SARL",
    "email": "contact@kiota-tech.com"
  },
  "subscription": {
    "id": "sub-uuid",
    "plan": {
      "name": "Premium",
      "description": "Plan Premium avec IA avancée"
    }
  },
  "amount": 99.99,
  "currency": "USD",
  "amountPaid": 0,
  "status": "issued",
  "issueDate": "2025-11-05T00:00:00Z",
  "dueDate": "2025-12-05T00:00:00Z",
  "payments": [],
  "items": [
    {
      "description": "Abonnement Premium - Novembre 2025",
      "quantity": 1,
      "unitPrice": 99.99,
      "amount": 99.99
    }
  ]
}
```

### 4. Lister les Factures d'un Client

```http
GET /billing/invoices/customer/{customerId}?page=1&limit=10&status=issued
```

**Paramètres de requête** :
- `page` : Page (défaut: 1)
- `limit` : Limite par page (défaut: 10)
- `status` : Filtrer par statut (optionnel)

**Réponse** :
```json
{
  "invoices": [
    {
      "id": "inv-uuid-1",
      "invoiceNumber": "INV-2511-0001",
      "amount": 99.99,
      "currency": "USD",
      "status": "paid",
      "issueDate": "2025-11-05T00:00:00Z",
      "dueDate": "2025-12-05T00:00:00Z",
      "paidDate": "2025-11-10T14:30:00Z"
    },
    {
      "id": "inv-uuid-2",
      "invoiceNumber": "INV-2510-0005",
      "amount": 99.99,
      "currency": "USD",
      "status": "overdue",
      "issueDate": "2025-10-05T00:00:00Z",
      "dueDate": "2025-11-05T00:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### 5. Factures en Retard

```http
GET /billing/invoices/overdue
```

**Réponse** :
```json
[
  {
    "id": "inv-uuid",
    "invoiceNumber": "INV-2510-0005",
    "customer": {
      "id": "customer-uuid",
      "name": "KIOTA TECH SARL",
      "email": "contact@kiota-tech.com"
    },
    "amount": 99.99,
    "currency": "USD",
    "status": "overdue",
    "dueDate": "2025-11-05T00:00:00Z",
    "daysPastDue": 5
  }
]
```

### 6. Marquer les Factures en Retard

```http
POST /billing/invoices/mark-overdue
```

**Réponse** :
```json
{
  "affected": 12,
  "message": "12 factures marquées comme en retard"
}
```

## 💳 Gestion des Paiements

### 1. Enregistrer un Paiement

```http
POST /billing/payments
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "customerId": "customer-uuid",
  "invoiceId": "inv-uuid", // Optionnel
  "amount": 99.99,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "transactionId": "txn_stripe_12345",
  "paymentGateway": "stripe",
  "paymentDate": "2025-11-10T14:30:00Z",
  "notes": "Paiement par carte bancaire",
  "gatewayResponse": {
    "stripe_payment_intent_id": "pi_12345",
    "status": "succeeded"
  },
  "metadata": {
    "subscription_period": "2025-11",
    "auto_payment": true
  }
}
```

**Réponse** :
```json
{
  "id": "pay-uuid",
  "customerId": "customer-uuid",
  "invoiceId": "inv-uuid",
  "amount": 99.99,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "status": "completed",
  "transactionId": "txn_stripe_12345",
  "paymentGateway": "stripe",
  "paymentDate": "2025-11-10T14:30:00Z",
  "createdAt": "2025-11-10T14:30:00Z"
}
```

### 2. Historique des Paiements Utilisateur Connecté

```http
GET /billing/payments?page=1&limit=20
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "pay-uuid-1",
      "date": "2025-11-10T14:30:00Z",
      "amount": 99.99,
      "currency": "USD",
      "method": "Carte bancaire",
      "plan": "Premium",
      "status": "Payé",
      "receiptUrl": "/billing/payments/pay-uuid-1/receipt"
    },
    {
      "id": "pay-uuid-2",
      "date": "2025-10-10T14:30:00Z",
      "amount": 99.99,
      "currency": "USD",
      "method": "Mobile Money",
      "plan": "Premium",
      "status": "Payé",
      "receiptUrl": "/billing/payments/pay-uuid-2/receipt"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "pages": 1
    }
  }
}
```

### 3. Télécharger un Reçu PDF

```http
GET /billing/payments/{paymentId}/receipt
```

**Headers de réponse** :
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="receipt-{paymentId}.pdf"
Content-Length: 15234
```

**Réponse** : Fichier PDF binaire

> ⚠️ **Note** : La génération PDF est actuellement simulée. L'implémentation complète avec une bibliothèque PDF (ex: puppeteer, jsPDF) est en cours de développement.

### 4. Upload de Preuve de Paiement Manuel

```http
POST /billing/payments/manual
Content-Type: multipart/form-data
```

**Corps de la requête** (multipart/form-data) :
```
proofFile: [Fichier image/PDF]
planId: "plan-premium" (optionnel)
tokenAmount: 1000000 (optionnel)
referenceNumber: "TXN123456789"
amount: 99.99
paymentDate: "2025-11-10"
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "message": "Preuve de paiement téléchargée avec succès",
    "referenceId": "pay-manual-uuid"
  }
}
```

### 5. Lister les Paiements d'un Client

```http
GET /billing/payments/customer/{customerId}?page=1&limit=10
```

**Réponse** :
```json
{
  "payments": [
    {
      "id": "pay-uuid",
      "amount": 99.99,
      "currency": "USD",
      "paymentMethod": "credit_card",
      "status": "completed",
      "paymentDate": "2025-11-10T14:30:00Z",
      "transactionId": "txn_stripe_12345",
      "invoice": {
        "id": "inv-uuid",
        "invoiceNumber": "INV-2511-0001"
      }
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

## 🔒 Sécurité et Conformité

### Chiffrement des Données Sensibles

Les champs sensibles sont automatiquement chiffrés :
- `gatewayResponse` : Réponses des gateways de paiement
- `metadata` : Métadonnées pouvant contenir des informations sensibles

### Validation des Montants

```typescript
// Validation automatique des montants
const validatePaymentAmount = (amount: number, currency: string) => {
  if (amount <= 0) {
    throw new BadRequestException('Le montant doit être positif');
  }
  
  if (currency === 'USD' && amount > 50000) {
    throw new BadRequestException('Montant USD trop élevé');
  }
  
  // Validation précision (2 décimales max)
  if (amount * 100 !== Math.floor(amount * 100)) {
    throw new BadRequestException('Précision maximale : 2 décimales');
  }
};
```

### Audit Trail

Toutes les opérations financières sont automatiquement tracées :
- Création/modification de factures
- Enregistrement de paiements
- Changements de statut
- Remboursements

## ⚙️ Logique Métier

### Mise à Jour Automatique des Factures

Lorsqu'un paiement est enregistré :
1. **Calcul automatique** : Somme des paiements pour la facture
2. **Mise à jour du statut** :
   - `PAID` : Montant payé >= montant facture
   - `PARTIALLY_PAID` : Montant payé > 0 et < montant facture
3. **Date de paiement** : Définie automatiquement si facture payée

### Génération Automatique de Numéros de Facture

Format : `INV-YYMM-NNNN`
- `INV` : Préfixe fixe
- `YY` : Année sur 2 chiffres
- `MM` : Mois sur 2 chiffres
- `NNNN` : Numéro séquentiel sur 4 chiffres

Exemple : `INV-2511-0001` pour la première facture de novembre 2025

### Gestion des Factures en Retard

Processus automatique quotidien :
1. **Identification** : Factures `ISSUED` avec `dueDate < today`
2. **Mise à jour** : Changement statut vers `OVERDUE`
3. **Notifications** : Envoi d'alertes aux clients (à implémenter)

## 📊 Intégrations

### Avec le Module Subscriptions

```typescript
// Création automatique de facture lors d'un renouvellement
const createSubscriptionInvoice = async (subscription: Subscription) => {
  const invoice = await billingService.createInvoice({
    customerId: subscription.customerId,
    subscriptionId: subscription.id,
    amount: subscription.plan.priceUSD,
    currency: 'USD',
    issueDate: new Date(),
    dueDate: addDays(new Date(), 30),
    items: [{
      description: `${subscription.plan.name} - ${subscription.currentPeriod}`,
      quantity: 1,
      unitPrice: subscription.plan.priceUSD,
      amount: subscription.plan.priceUSD
    }]
  });
  
  await billingService.issueInvoice(invoice.id);
  return invoice;
};
```

### Avec Stripe

```typescript
// Création d'un paiement Stripe
const processStripePayment = async (paymentIntent: any) => {
  const payment = await billingService.recordPayment({
    customerId: paymentIntent.metadata.customerId,
    invoiceId: paymentIntent.metadata.invoiceId,
    amount: paymentIntent.amount / 100, // Stripe utilise les centimes
    currency: paymentIntent.currency.toUpperCase(),
    paymentMethod: PaymentMethod.CREDIT_CARD,
    paymentGateway: 'stripe',
    transactionId: paymentIntent.id,
    gatewayResponse: paymentIntent
  });
  
  return payment;
};
```

## 🚨 Gestion d'Erreurs

### Erreurs Communes

```typescript
// Paiement insuffisant
{
  "error": "INSUFFICIENT_PAYMENT",
  "message": "Le montant du paiement est insuffisant",
  "data": {
    "required": 99.99,
    "provided": 50.00,
    "remaining": 49.99
  }
}

// Facture déjà payée
{
  "error": "INVOICE_ALREADY_PAID",
  "message": "Cette facture a déjà été payée intégralement",
  "data": {
    "invoiceId": "inv-uuid",
    "status": "paid",
    "paidDate": "2025-11-10T14:30:00Z"
  }
}

// Paiement dupliqué
{
  "error": "DUPLICATE_PAYMENT",
  "message": "Un paiement avec cette référence existe déjá",
  "data": {
    "transactionId": "txn_12345",
    "existingPaymentId": "pay-uuid"
  }
}
```

## 📈 Métriques et Analytics

### KPIs Disponibles

```typescript
interface BillingMetrics {
  totalRevenue: number;           // Revenus totaux
  monthlyRecurringRevenue: number; // MRR
  averageRevenuePerUser: number;  // ARPU
  churnRate: number;              // Taux de désabonnement
  
  invoiceMetrics: {
    totalInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    averagePaymentTime: number;   // Jours
  };
  
  paymentMethodDistribution: {
    credit_card: number;
    mobile_money: number;
    bank_transfer: number;
    // ...
  };
}
```

---

*Documentation mise à jour le 5 novembre 2025 - Module de facturation intégré avec système d'abonnements et Stripe.*