# Système de Configuration Centralisé des Subscriptions et Tarification

Ce système permet de gérer facilement tous les aspects de la tarification de la plateforme Wanzo via un fichier de configuration centralisé. Il supporte deux types de clients (PME et Institutions financières) avec des plans flexibles et une gestion granulaire des fonctionnalités.

## 📋 Table des Matières

- [Structure du Système](#structure-du-système)
- [Configuration des Plans](#configuration-des-plans)
- [Gestion des Fonctionnalités](#gestion-des-fonctionnalités)
- [Utilisation dans le Code](#utilisation-dans-le-code)
- [Administration](#administration)
- [Exemples Pratiques](#exemples-pratiques)

## 🏗️ Structure du Système

### Fichiers Principaux

```
src/
├── config/
│   └── subscription-pricing.config.ts    # Configuration centralisée
├── modules/subscriptions/
│   ├── services/
│   │   ├── feature-access.service.ts      # Vérification d'accès aux fonctionnalités
│   │   └── pricing-data-sync.service.ts   # Synchronisation avec la DB
│   ├── controllers/
│   │   ├── pricing.controller.ts          # API publique de tarification
│   │   └── admin-pricing.controller.ts    # Administration
│   ├── decorators/
│   │   └── feature-access.decorator.ts    # Décorateurs pour les contrôleurs
│   ├── guards/
│   │   └── feature-access.guard.ts        # Guard de vérification d'accès
│   └── middleware/
│       └── customer-extractor.middleware.ts # Extraction des données client
```

## ⚙️ Configuration des Plans

### Types de Clients

- **PME (Small & Medium Enterprises)** : Accès aux outils de gestion commerciale et comptable
- **Institutions Financières** : Accès aux outils de prospection et d'évaluation des risques

### Plans Disponibles

#### Plans PME

1. **PME Freemium** (0€/mois)
   - 100,000 tokens/mois
   - Gestion commerciale limitée (50 clients max)
   - Comptabilité de base (50 transactions/mois)
   - Pas d'accès multi-utilisateurs
   - Pas de demandes de financement

2. **PME Standard** (20€/mois)
   - 2,000,000 tokens/mois
   - Gestion commerciale illimitée
   - Comptabilité complète + rapports
   - 5 utilisateurs maximum
   - Demandes de financement (3/mois)
   - Support prioritaire

#### Plans Institution Financière

1. **Institution Freemium** (0€/mois)
   - 500,000 tokens/mois
   - Prospection limitée (10 entreprises fixes)
   - Outils d'évaluation de base

2. **Institution Professional** (100€/mois)
   - 10,000,000 tokens/mois
   - Prospection illimitée
   - 20 utilisateurs maximum
   - Outils d'analyse avancés
   - Support dédié

### Packages de Tokens

```typescript
// Exemple de configuration de packages
{
  id: 'tokens-business',
  name: 'Pack Business',
  tokenAmount: 2000000,
  priceUSD: 18,
  bonusPercentage: 10, // 200k tokens bonus
  customerTypes: [CustomerType.SME]
}
```

## 🔧 Gestion des Fonctionnalités

### Codes de Fonctionnalités

```typescript
export enum FeatureCode {
  // Gestion commerciale
  COMMERCIAL_MANAGEMENT = 'commercial_management',
  CUSTOMER_MANAGEMENT = 'customer_management',
  SALES_TRACKING = 'sales_tracking',
  
  // IA et tokens
  AI_CHAT_ASSISTANCE = 'ai_chat_assistance',
  DOCUMENT_ANALYSIS = 'document_analysis',
  
  // Financement (PME)
  FINANCING_REQUESTS = 'financing_requests',
  
  // Prospection (Institutions)
  COMPANY_PROSPECTING = 'company_prospecting',
  
  // ... autres fonctionnalités
}
```

### Configuration des Limites

Chaque fonctionnalité peut avoir :
- **Activée/Désactivée** : `enabled: boolean`
- **Limite numérique** : `limit?: number` (undefined = illimité)
- **Description** : `description?: string`

## 💻 Utilisation dans le Code

### 1. Décorateur de Vérification d'Accès

```typescript
@Controller('commercial')
@UseGuards(FeatureAccessGuard)
export class CommercialController {
  
  @Get('customers')
  @RequireFeature(FeatureCode.CUSTOMER_MANAGEMENT)
  async getCustomers(@CurrentCustomer() customer: RequestCustomer) {
    // Cette route nécessite l'accès à la gestion des clients
  }
  
  @Post('ai/chat')
  @RequireFeature(FeatureCode.AI_CHAT_ASSISTANCE, 1000) // Coûte 1000 tokens
  async chatWithAI(@CurrentCustomer() customer: RequestCustomer) {
    // Cette route consomme des tokens
  }
}
```

### 2. Vérification Programmatique

```typescript
@Injectable()
export class MyService {
  constructor(private featureAccessService: FeatureAccessService) {}
  
  async processRequest(customerId: string) {
    const customerInfo = await this.featureAccessService.getCustomerSubscriptionInfo(customerId);
    
    const accessCheck = await this.featureAccessService.checkFeatureAccess(
      customerInfo,
      FeatureCode.DOCUMENT_ANALYSIS,
      5000 // Coût en tokens
    );
    
    if (!accessCheck.hasAccess) {
      throw new ForbiddenException(accessCheck.reason);
    }
    
    // Traitement autorisé
  }
}
```

### 3. Récupération des Informations de Tarification

```typescript
// Récupérer les plans pour un type de client
const plans = PricingConfigService.getPlansByCustomerType(CustomerType.SME);

// Vérifier l'accès à une fonctionnalité
const hasAccess = PricingConfigService.isFeatureAvailable('sme-standard', FeatureCode.FINANCING_REQUESTS);

// Calculer le prix annuel avec réduction
const annualPrice = PricingConfigService.calculateAnnualPrice(20, 16.67);
```

## 🛠️ Administration

### API d'Administration

```bash
# Synchroniser les plans depuis la configuration
POST /admin/pricing/sync/plans

# Synchroniser les packages de tokens
POST /admin/pricing/sync/tokens

# Synchroniser toutes les données
POST /admin/pricing/sync/all

# Valider la cohérence des données
GET /admin/pricing/validate

# Générer un rapport de synchronisation
GET /admin/pricing/sync/report
```

### Synchronisation Automatique

Le service `PricingDataSyncService` permet de synchroniser automatiquement la configuration avec la base de données :

```typescript
// Synchronisation complète
await this.pricingDataSyncService.syncAllPricingData();

// Validation des données
const validation = await this.pricingDataSyncService.validatePricingData();
if (!validation.isValid) {
  console.log('Problèmes détectés:', validation.inconsistencies);
}
```

## 📚 Exemples Pratiques

### Modifier un Plan Existant

1. **Éditer le fichier de configuration** (`subscription-pricing.config.ts`)
2. **Modifier les paramètres** (prix, tokens, fonctionnalités)
3. **Synchroniser** via l'API admin ou service

```typescript
// Exemple : Augmenter les tokens du plan PME Standard
{
  id: 'sme-standard',
  // ... autres propriétés
  tokenAllocation: {
    monthlyTokens: 3000000, // Était 2000000
    tokenRollover: true,
    maxRolloverMonths: 3
  }
}
```

### Ajouter une Nouvelle Fonctionnalité

1. **Ajouter le code** dans `FeatureCode`
2. **Configurer l'accès** dans chaque plan
3. **Utiliser dans les contrôleurs** avec `@RequireFeature`

```typescript
// 1. Nouveau code de fonctionnalité
export enum FeatureCode {
  // ... existants
  ADVANCED_REPORTING = 'advanced_reporting'
}

// 2. Configuration dans un plan
features: {
  [FeatureCode.ADVANCED_REPORTING]: { 
    enabled: true, 
    limit: 10, 
    description: '10 rapports/mois' 
  }
}

// 3. Utilisation
@RequireFeature(FeatureCode.ADVANCED_REPORTING)
async generateAdvancedReport() { /* ... */ }
```

### Créer un Nouveau Plan

```typescript
const nouveauPlan: SubscriptionPlan = {
  id: 'sme-enterprise',
  name: 'PME Enterprise',
  description: 'Plan entreprise avec fonctionnalités avancées',
  customerType: CustomerType.SME,
  billingPeriod: BillingPeriod.MONTHLY,
  monthlyPriceUSD: 50,
  annualPriceUSD: 500,
  annualDiscountPercentage: 16.67,
  tokenAllocation: {
    monthlyTokens: 5000000,
    tokenRollover: true,
    maxRolloverMonths: 6
  },
  features: {
    // Configurer toutes les fonctionnalités
  },
  isPopular: false,
  isVisible: true,
  sortOrder: 3,
  tags: ['enterprise', 'advanced']
};

// Ajouter à SUBSCRIPTION_PLANS
```

## 🔄 Workflow de Modification

1. **Modifier** `subscription-pricing.config.ts`
2. **Tester** en local
3. **Déployer** le code
4. **Synchroniser** via l'API admin
5. **Valider** que tout fonctionne

## 📊 Monitoring et Métriques

Le système permet de suivre :
- Consommation de tokens par client
- Usage des fonctionnalités
- Tendances d'upgrade
- Performance des plans

## 🔒 Sécurité

- Vérification d'accès à chaque requête
- Isolation par type de client
- Logging des actions sensibles
- Validation des limites en temps réel

## 🚀 Évolutivité

Le système est conçu pour :
- Ajouter facilement de nouveaux plans
- Créer de nouvelles fonctionnalités
- Modifier la tarification sans code
- Supporter de nouveaux types de clients

---

Ce système offre une flexibilité maximale pour adapter la tarification selon l'évolution du business model, tout en maintenant une sécurité robuste et une facilité d'administration.
