# Architecture des Paiements d'Abonnements - Centrée Client

## Vue d'ensemble

L'architecture des paiements d'abonnements a été refactorisée pour être **centrée sur les clients (customers)** plutôt que sur les utilisateurs (users). Cette approche reflète mieux la réalité business où les abonnements et paiements sont attachés aux entités clients.

## Changements Architecturaux

### Avant (Centré User)
```
Frontend → API Gateway → Customer Service (User-based) → Payment Service
```

### Après (Centré Customer)
```
Frontend → API Gateway → Customer Service (Customer-based) → Payment Service
```

## Structure des Services

### SubscriptionPaymentService (Customer Service)

#### Méthodes Principales

1. **`initiateSubscriptionPaymentByCustomerId(customerId, paymentData)`**
   - Méthode principale pour initier un paiement
   - Travaille directement avec l'ID du client
   - Centralise toute la logique de validation et de traitement

2. **`initiateSubscriptionPaymentByAuth0Id(auth0Id, paymentData)`**
   - Méthode de convenance pour les appels frontend
   - Récupère le customer associé à l'utilisateur
   - Délègue à `initiateSubscriptionPaymentByCustomerId`

3. **`getAvailablePlansForCustomerId(customerId)`**
   - Récupère les plans disponibles pour un client spécifique
   - Basée sur le type de client (commercial, institution, etc.)

4. **`getCustomerPaymentHistory(customerId)`**
   - Historique des paiements centré sur le client
   - Appelle le payment-service avec l'ID client

### Méthodes Privées

- **`processSubscriptionPayment(customer, plan, paymentData, currentSubscription?)`**
  - Logique commune de traitement des paiements
  - Gère la communication avec le payment-service
  - Émet les événements Kafka appropriés

## Flux de Données

### 1. Initiation de Paiement

```typescript
// Frontend envoie
{
  planId: "uuid",
  clientPhone: "243...",
  telecom: "AM",
  channel: "merchant"
}

// Customer Service enrichit
{
  customerId: "customer-uuid",     // ← CENTRÉ CLIENT
  planId: "uuid",
  clientPhone: "243...",
  telecom: "AM",
  channel: "merchant",
  planName: "Standard Plan",
  amount: "50.00",
  currency: "CDF"
}

// Payment Service reçoit
{
  customerId: "customer-uuid",     // ← CENTRÉ CLIENT
  planId: "uuid",
  // ... autres données SerdiPay
  metadata: {
    customerType: "commercial",    // ← INFOS CLIENT
    customerName: "Company ABC",
    isRenewal: false
  }
}
```

### 2. Événements Kafka

Tous les événements sont maintenant émis avec `customerId` comme clé principale :

```typescript
{
  type: 'subscription.payment.initiated',
  subscriptionId: 'sub-uuid',
  customerId: 'customer-uuid',     // ← CENTRÉ CLIENT
  planId: 'plan-uuid',
  timestamp: new Date(),
  metadata: {
    customerType: 'commercial',    // ← INFOS CLIENT
    amount: '50.00',
    currency: 'CDF',
    telecom: 'AM'
  }
}
```

## Endpoints API

### `/subscriptions/purchase` (POST)
- **Authentification** : JWT (utilisateur)
- **Traitement** : Récupère le customer de l'utilisateur puis traite le paiement
- **Réponse** : Informations de transaction + instructions de paiement

### `/subscriptions/plans/available` (GET)
- **Authentification** : JWT (utilisateur)
- **Traitement** : Filtre les plans selon le type de client
- **Réponse** : Plans disponibles pour le type de client

### `/subscriptions/current/payment-history` (GET)
- **Authentification** : JWT (utilisateur)
- **Traitement** : Historique des paiements du client
- **Réponse** : Transactions de paiement d'abonnements

## Avantages de l'Architecture Centrée Client

### 1. **Cohérence Business**
- Les abonnements appartiennent aux clients, pas aux utilisateurs
- Un client peut avoir plusieurs utilisateurs
- Gestion unifiée des limites et quotas par client

### 2. **Traçabilité**
- Tous les paiements sont tracés au niveau client
- Historique complet par entité payante
- Facilite la comptabilité et facturation

### 3. **Scalabilité**
- Support multi-utilisateurs par client
- Gestion des organisations et équipes
- Permissions granulaires par client

### 4. **Intégration SerdiPay**
- Métadonnées enrichies avec informations client
- Meilleure traçabilité des transactions
- Support des différents types de clients

## Structure des Données

### Customer-Centric Payment Data
```typescript
interface CustomerPaymentData {
  customerId: string;              // ← CLÉ PRINCIPALE
  customerType: 'individual' | 'commercial' | 'institution';
  customerName: string;
  
  // Données de paiement
  planId: string;
  amount: string;
  currency: string;
  
  // Contexte d'abonnement
  isRenewal: boolean;
  existingSubscriptionId?: string;
  billingCycleStart: string;
  billingCycleEnd: string;
}
```

### Event Schema
```typescript
interface SubscriptionPaymentEvent {
  type: string;
  customerId: string;              // ← CLÉ PRINCIPALE
  subscriptionId?: string;
  planId: string;
  timestamp: Date;
  metadata: {
    customerType: string;          // ← CONTEXTE CLIENT
    customerName?: string;
    amount?: string;
    currency?: string;
    telecom?: string;
    transactionId?: string;
  };
}
```

## Compatibilité

### Rétrocompatibilité
- Les méthodes basées sur `auth0Id` sont maintenues
- Elles délèguent aux nouvelles méthodes centrées client
- Pas de breaking changes pour le frontend

### Migration
- Pas de migration de données nécessaire
- Les nouvelles transactions utilisent l'approche centrée client
- Les anciennes transactions restent compatibles

## Tests de Validation

Voir le fichier `serdipay-compatibility.test.ts` pour :
- Tests de compatibilité des structures de données
- Validation du flux frontend → customer-service → payment-service
- Vérification de l'intégration SerdiPay

## Prochaines Étapes

1. **Tests d'intégration** : Valider le flux complet avec SerdiPay
2. **Monitoring** : Ajouter des métriques centrées client
3. **Analytics** : Dashboards de paiements par type de client
4. **Multi-tenant** : Support des clients entreprise avec sous-comptes