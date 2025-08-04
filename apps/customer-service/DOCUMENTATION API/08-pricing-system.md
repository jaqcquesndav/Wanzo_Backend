# Système de Tarification Centralisé

## Introduction

Le système de tarification centralisé permet de gérer l'ensemble des plans d'abonnement, packages de tokens et limites de fonctionnalités pour tous les types de clients (PME et Institutions Financières). Ce système est basé sur une configuration unique dans le fichier `subscription-pricing.config.ts` qui est utilisée par l'ensemble des modules.

## Architecture

### Configuration Centralisée

La configuration des prix est définie dans le fichier `src/config/subscription-pricing.config.ts` qui contient:

1. Les enums et interfaces de base (CustomerType, FeatureCode, etc.)
2. Les constantes de configuration (SUBSCRIPTION_PLANS, TOKEN_PURCHASE_PACKAGES)
3. Le service utilitaire PricingConfigService pour accéder aux données

### Services de Pricing

1. **PricingConfigService**: Service statique pour accéder à la configuration
2. **PricingDataSyncService**: Service pour synchroniser la configuration avec la base de données
3. **FeatureAccessService**: Service pour vérifier l'accès aux fonctionnalités et consommer des tokens

### Contrôleurs d'API

1. **PricingController**: API publique pour accéder aux informations de pricing
2. **AdminPricingController**: API admin pour gérer la configuration
3. **CommercialController** et **FinancialInstitutionController**: Exemples de contrôleurs avec accès restreint par feature

## Flux de synchronisation des données

```
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│ Configuration     │      │ PricingDataSync   │      │ Base de données   │
│ Centralisée       │ ─────> Service           │ ─────> (Entities)        │
└───────────────────┘      └───────────────────┘      └───────────────────┘
```

1. Les plans et packages sont définis dans le fichier de configuration
2. L'administrateur appelle l'endpoint `/admin/pricing/sync-all`
3. Le PricingDataSyncService convertit la configuration en entités
4. Les entités sont sauvegardées dans la base de données

## Endpoints API

### Endpoints Admin

```
POST /admin/pricing/sync/plans
POST /admin/pricing/sync/tokens
POST /admin/pricing/sync/all
GET  /admin/pricing/status
```

### Endpoints Publics

```
GET  /pricing/plans
GET  /pricing/plans/:planId
POST /pricing/calculate
GET  /pricing/tokens/packages
GET  /pricing/features
GET  /pricing/compare
```

## Intégration avec le système de tokens

Le système de pricing est étroitement lié au système de tokens:

1. **Allocations mensuelles**: Les plans d'abonnement définissent l'allocation mensuelle de tokens
2. **Packages d'achat**: Configuration des packages de tokens disponibles à l'achat
3. **Contrôle d'accès**: Vérification des limites de fonctionnalités et consommation de tokens

## Accès aux fonctionnalités avec décorateurs

Le système utilise un décorateur `@RequireFeature` et un guard `FeatureAccessGuard` pour protéger l'accès aux endpoints:

```typescript
@Controller('financial')
@UseGuards(FeatureAccessGuard)
export class FinancialInstitutionController {
  @Get('portfolio-analysis')
  @RequireFeature(FeatureCode.PORTFOLIO_MANAGEMENT, 10000)
  async generatePortfolioAnalysis(@CurrentCustomer() customer: RequestCustomer) {
    // Exécuté uniquement si:
    // 1. La fonctionnalité est activée pour le client
    // 2. Le client a suffisamment de tokens
    return this.analysisService.generate(customer.id);
  }
}
```
