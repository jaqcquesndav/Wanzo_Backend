# Système de Tokens

## Aperçu
Le système de tokens est un élément central de la plateforme, permettant aux utilisateurs de consommer des services AI et fonctionnalités avancées selon un modèle de paiement basé sur l'usage. Les tokens sont alloués via des abonnements ou peuvent être achetés séparément en paquets.

## Structure des données

### Types d'opérations

```typescript
enum TokenTransactionType {
  PURCHASE = 'purchase',
  USAGE = 'usage',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  EXPIRY = 'expiry',
  BONUS = 'bonus',
  ALLOCATION = 'allocation',
}
```

### Types de tokens

```typescript
enum TokenType {
  PURCHASED = 'purchased',
  BONUS = 'bonus',
  REWARD = 'reward',
}
```

### Entités principales

#### Package de tokens (TokenPackage)
```typescript
interface TokenPackage {
  id: string;
  configId: string;
  name: string;
  description?: string;
  tokenAmount: number;
  priceUSD: number;
  pricePerMillionTokens: number;
  bonusPercentage: number;
  customerTypes: string[];
  isVisible: boolean;
  isActive: boolean;
  sortOrder: number;
}
```

#### Solde de tokens (CustomerTokenBalance)
```typescript
interface CustomerTokenBalance {
  id: string;
  customerId: string;
  totalTokens: number;
  usedTokens: number;
  remainingTokens: number;
  monthlyAllocation: number;
  rolledOverTokens: number;
  purchasedTokens: number;
  bonusTokens: number;
  currentPeriod: string; // Format: YYYY-MM
  periodStartDate: Date;
  periodEndDate: Date;
  rolloverHistory: any[];
}
```

#### Transaction de tokens (TokenTransaction)
```typescript
interface TokenTransaction {
  id: string;
  customerId: string;
  transactionType: TokenTransactionType;
  tokenAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  relatedEntityId?: string;
  costUSD?: number;
  description: string;
  featureCode?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

## Endpoints API

### Achat de tokens

```
POST /tokens/purchase
```

**Payload**:
```json
{
  "customerId": "uuid-client",
  "packageId": "token-package-id",
  "paymentMethod": "card",
  "paymentDetails": {
    // Détails du paiement selon la méthode
  }
}
```

### Vérification du solde de tokens

```
GET /tokens/balance/:customerId
```

**Réponse**:
```json
{
  "balance": {
    "id": "uuid",
    "customerId": "uuid-client",
    "totalTokens": 5000000,
    "usedTokens": 120000,
    "remainingTokens": 4880000,
    "monthlyAllocation": 1000000,
    "rolledOverTokens": 0,
    "purchasedTokens": 4000000,
    "bonusTokens": 0,
    "currentPeriod": "2025-08"
  }
}
```

### Historique des transactions

```
GET /tokens/history/:customerId
```

**Paramètres optionnels**:
- `limit`: nombre maximum de transactions à retourner
- `transactionType`: filtrer par type de transaction

**Réponse**:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "customerId": "uuid-client",
      "transactionType": "usage",
      "tokenAmount": -5000,
      "balanceBefore": 4885000,
      "balanceAfter": 4880000,
      "featureCode": "document_analysis",
      "description": "Analyse de document",
      "createdAt": "2025-08-04T12:34:56Z"
    },
    // ...
  ]
}
```

## Consommation automatique de tokens

Le système utilise le service `TokenManagementService` pour automatiquement consommer des tokens lors de l'utilisation de fonctionnalités. Cette consommation est gérée à travers:

1. Le décorateur `@RequireFeature(featureCode, tokenCost?)`
2. La garde `FeatureAccessGuard`
3. Le middleware `CustomerExtractorMiddleware`

### Exemple de contrôleur avec consommation de tokens:

```typescript
@Controller('commercial')
@UseGuards(FeatureAccessGuard)
export class CommercialController {
  @Get('reports/sales')
  @RequireFeature(FeatureCode.SALES_TRACKING, 5000) // Consomme 5000 tokens
  async generateSalesReport(@CurrentCustomer() customer: RequestCustomer) {
    // La vérification et consommation des tokens est automatique
    // Le code n'est exécuté que si l'accès est autorisé
    return this.salesReportService.generateReport(customer.id);
  }
}
```
