# Documentation Conforme - Architecture Événementielle 

## 🎯 Architecture Réelle du Projet

### ✅ Principe Fondamental
**AUCUN appel HTTP inter-services** - Tout passe par **Kafka Events**

### 🏗️ Responsabilités par Service

#### Customer-Service
- ✅ Gestion clients, utilisateurs, abonnements
- ✅ Exposition API REST pour frontend
- ✅ Émission d'événements Kafka vers autres services
- ❌ **PAS** de gestion admin des plans (c'est admin-service)

#### Admin-Service  
- ✅ Création/modification des plans d'abonnement
- ✅ Analytics et monitoring
- ✅ Dashboard administrateur
- ✅ Consommation événements customer-service via Kafka

#### Payment-Service
- ✅ Traitement paiements Stripe
- ✅ Gestion webhooks Stripe
- ✅ Communication Kafka bidirectionnelle

---

## 📋 Corrections Documentation ENDPOINTS_EXACT.md

### ❌ **À SUPPRIMER** (N'existent pas dans customer-service)
```markdown
### 8. Admin Pricing (`/admin/pricing`)
### 9. Admin Subscriptions (`/admin/subscriptions`)
```

### ✅ **À CONSERVER/CORRIGER** (Existent vraiment)

#### 8. Pricing Configuration (`/pricing`) - pricing.controller.ts
```markdown
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/pricing/plans` | Plans disponibles (configurés par admin via Kafka) |
| `GET` | `/pricing/plans/{id}` | Détails plan avec features/limites |
| `POST` | `/pricing/calculate` | Calcul prix personnalisé |
| `GET` | `/pricing/tokens/packages` | Packages tokens disponibles |
| `POST` | `/pricing/tokens/estimate` | Estimation coût tokens |
| `GET` | `/pricing/my-subscription` | Infos abonnement utilisateur |
| `GET` | `/pricing/features/check/{featureCode}` | Vérification accès feature |
| `GET` | `/pricing/comparison` | Comparaison plans par type client |
```

**Note** : Ces endpoints exposent les plans **configurés par l'admin-service** et reçus via Kafka.

#### 9. Subscriptions Spécialisés

##### Commercial Plans (`/subscriptions/commercial`) - commercial.controller.ts
```markdown
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/subscriptions/commercial/plans` | Plans PME spécialisés |
```

##### Financial Institution Plans (`/subscriptions/financial`) - financial-institution.controller.ts  
```markdown
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/subscriptions/financial/plans` | Plans institutions financières |
```

#### 10. Stripe Integration (`/subscriptions/stripe`) - stripe-subscription-payment.controller.ts
```markdown
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/subscriptions/stripe/setup-payment` | Configuration paiement Stripe |
| `POST` | `/subscriptions/stripe/confirm-payment` | Confirmation paiement |
| `POST` | `/subscriptions/stripe/setup-recurring` | Configuration récurrent |
| `POST` | `/subscriptions/stripe/webhook` | Traitement webhooks Stripe |
| `GET` | `/subscriptions/stripe/payment-methods` | Méthodes paiement client |
```

---

## 🔄 Documentation Kafka Events (Section Complète)

### Events Standards Sortants (Customer → Admin)

#### Profils Clients Complets
```typescript
// Topic: admin.customer.company.profile.shared
{
  customerId: string;
  customerType: 'COMPANY';
  name: string;
  email: string;
  // ... données complètes entreprise
  companyProfile: {
    legalForm: string;
    industry: string;
    capital: object;
    financials: object;
    // ... tous les champs v2.1
  };
  extendedProfile: object; // Formulaire identification étendu
  patrimoine: {
    assets: AssetData[];
    stocks: StockData[];
    totalAssetsValue: number;
  };
  profileCompleteness: {
    percentage: number;
    missingFields: string[];
    completedSections: string[];
  };
}

// Topic: admin.customer.institution.profile.shared  
{
  customerId: string;
  customerType: 'FINANCIAL_INSTITUTION';
  // ... données institution financière complètes
  institutionProfile: {
    denominationSociale: string;
    typeInstitution: string;
    licenseNumber: string;
    // ... 70+ champs spécialisés
  };
  regulatoryProfile: object;
}
```

#### Événements Subscription
```typescript
// Topic: admin-service.subscription.created
{
  subscriptionId: string;
  customerId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  source: 'customer-service';
  timestamp: string;
}
```

#### Événements Standards (StandardKafkaTopics)
```typescript
// Topics utilisés par le CustomerEventsProducer:
StandardKafkaTopics.CUSTOMER_CREATED
StandardKafkaTopics.CUSTOMER_UPDATED  
StandardKafkaTopics.CUSTOMER_STATUS_CHANGED
StandardKafkaTopics.SUBSCRIPTION_CREATED
StandardKafkaTopics.TOKEN_PURCHASE
// ... et 20+ autres topics standardisés
```

### Events Entrants (Admin → Customer)

**Note importante** : Le customer-service CONSOMME aussi des événements pour :
- Recevoir les plans configurés par l'admin
- Recevoir les mises à jour de configuration
- Recevoir les actions administratives

---

## 🎫 Structures Données Conformes

### Plans d'Abonnement (DYNAMIC - pas codés en dur)

Les plans dans `subscription-pricing.config.ts` sont des **TEMPLATES** uniquement. Les vrais plans viennent de l'admin-service via Kafka.

#### Structure Plan Réelle (reçue via Kafka)
```typescript
interface SubscriptionPlan {
  id: string;
  name: string; // Défini par admin
  description: string; // Défini par admin  
  customerType: CustomerType;
  
  // TARIFICATION (définie par admin)
  monthlyPriceUSD: number;
  annualPriceUSD: number;
  annualDiscountPercentage: number;
  
  // ALLOCATION TOKENS (définie par admin)
  tokenAllocation: {
    monthlyTokens: number;
    tokenRollover: boolean;
    maxRolloverMonths: number;
  };
  
  // FONCTIONNALITÉS (configurées par admin)
  features: {
    [featureCode: string]: {
      enabled: boolean;
      limit?: number; // -1 = illimité
      description?: string;
    };
  };
  
  // MÉTADONNÉES (gérées par admin)  
  isPopular: boolean;
  isVisible: boolean;
  sortOrder: number;
  tags: string[];
  
  // Ajouté dynamiquement par admin
  lastModified: string;
  modifiedBy: string;
}
```

### Business Features (Configurables par Admin)

```typescript
// Plus de 50 features business configurables
enum BusinessFeature {
  // Comptabilité
  ACCOUNTING_ENTRIES_MONTHLY = 'accounting_entries_monthly',
  AUTOMATED_ACCOUNTING_ENTRIES = 'automated_accounting_entries',
  FINANCIAL_REPORTS_GENERATION = 'financial_reports_generation',
  
  // Gestion commerciale  
  ACTIVE_CUSTOMERS_LIMIT = 'active_customers_limit',
  INVOICES_GENERATION_MONTHLY = 'invoices_generation_monthly',
  SALES_TRANSACTIONS_MONTHLY = 'sales_transactions_monthly',
  
  // Financement PME
  FINANCING_REQUESTS_MONTHLY = 'financing_requests_monthly',
  CREDIT_AMOUNT_LIMIT_USD = 'credit_amount_limit_usd',
  CREDIT_SCORING_REQUESTS = 'credit_scoring_requests',
  
  // Portfolio Institution
  PORTFOLIO_USERS_LIMIT = 'portfolio_users_limit',
  PROSPECTABLE_COMPANIES_LIMIT = 'prospectable_companies_limit',
  MANAGED_PORTFOLIOS_LIMIT = 'managed_portfolios_limit',
  
  // IA et Analytics
  AI_CHAT_TOKENS_MONTHLY = 'ai_chat_tokens_monthly',
  DOCUMENT_ANALYSIS_REQUESTS = 'document_analysis_requests',
  PREDICTIVE_ANALYTICS_REQUESTS = 'predictive_analytics_requests',
  
  // Et 30+ autres features...
}

// Configuration par feature (définie par admin)
interface BusinessFeatureConfig {
  enabled: boolean;
  limit: number; // -1 = illimité, 0 = désactivé, >0 = limite
  periodType: 'daily' | 'monthly' | 'yearly';
  description?: string;
  warningThreshold?: number; // % alerte
}
```

---

## 🔧 Services Réels à Documenter

### StripePaymentService (634 lignes - critique)

```typescript
// Méthodes principales à documenter:
class StripePaymentService {
  // Paiement unique par carte
  async processCardPayment(request: CardPaymentRequest): Promise<CardPaymentResult>
  
  // Configuration abonnement récurrent  
  async setupRecurringSubscription(request: RecurringSetupRequest): Promise<RecurringSetupResult>
  
  // Traitement webhooks Stripe
  async handleWebhookEvent(event: Stripe.Event): Promise<void>
  
  // Gestion client Stripe
  async createStripeCustomer(customer: Customer): Promise<string>
  async cancelStripeSubscription(subscriptionId: string): Promise<void>
}

// Interfaces critiques pour frontend:
interface CardPaymentRequest {
  customerId: string;
  planId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string; // De Stripe Elements
  saveCard?: boolean;
  returnUrl?: string; // Pour 3D Secure
}

interface CardPaymentResult {
  success: boolean;
  paymentIntentId: string;
  status: string;
  clientSecret?: string; // Pour confirmation frontend
  requiresAction?: boolean; // 3D Secure nécessaire
  nextAction?: any;
  paymentId?: string; // ID interne
  message: string;
}
```

### CustomerEventsProducer (15+ méthodes événementielles)

```typescript
// Méthodes principales:
class CustomerEventsProducer {
  // Profils complets pour admin
  async emitCompanyProfileShare(data: CompanyProfileData): Promise<void>
  async emitInstitutionProfileShare(data: InstitutionProfileData): Promise<void>
  
  // Événements v2.1 spécialisés
  async emitAssetDataUpdate(data: AssetDataUpdate): Promise<void>
  async emitStockDataUpdate(data: StockDataUpdate): Promise<void>
  async emitFinancialInstitutionSpecificData(data: InstitutionSpecificData): Promise<void>
  
  // Synchronisation critique
  async emitCriticalDataSync(data: CriticalSyncData): Promise<void>
  
  // Communication admin-service
  async notifyAdminServiceSubscriptionCreated(subscription: SubscriptionData): Promise<void>
}
```

---

## ✅ Plan d'Action Corrigé

### Phase 1 : Correction Endpoints (1 jour)
- [x] Supprimer endpoints admin inexistants
- [x] Corriger endpoints pricing réels  
- [x] Ajouter endpoints Stripe manquants
- [x] Documenter endpoints spécialisés (commercial, financial)

### Phase 2 : Documentation Kafka (2 jours)
- [ ] Documenter tous les events sortants réels
- [ ] Documenter structure des messages standardisés  
- [ ] Ajouter exemples complets d'événements v2.1
- [ ] Diagrammes de flux événementiels

### Phase 3 : Services Stripe (1 jour)
- [ ] Documentation complète StripePaymentService
- [ ] Interfaces TypeScript pour frontend
- [ ] Gestion erreurs et retry logic
- [ ] Flow complet paiement avec 3D Secure

### Phase 4 : Structures v2.1 (1 jour)
- [ ] Entités Customer avec tous nouveaux champs
- [ ] Structures BusinessFeature configurables
- [ ] AssetData et StockData complètes
- [ ] FinancialInstitutionSpecificData (70+ champs)

---

## 🎯 Résultat Final

### Documentation Conforme à l'Architecture
✅ **Événementielle** - Kafka uniquement  
✅ **Plans Dynamiques** - Configurés par admin  
✅ **Structures v2.1** - Toutes les nouvelles entités  
✅ **Services Réels** - Code source exact  

### Impact Frontend
✅ **Intégration correcte** - APIs réelles documentées  
✅ **Gestion Stripe** - Flow complet avec 3D Secure  
✅ **Events temps réel** - Kafka pour notifications  
✅ **Plans dynamiques** - Pas de hard-coding  

---

*Documentation corrigée le 10 novembre 2025 - Architecture événementielle respectée*