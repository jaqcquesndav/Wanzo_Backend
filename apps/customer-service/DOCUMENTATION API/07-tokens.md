# Système de Tokens Intégré 🪙

## 🎯 Vue d'Ensemble

**IMPORTANT** : Depuis la modernisation de la plateforme, les tokens sont maintenant **intégrés directement dans les plans d'abonnement**. L'achat indépendant de tokens a été supprimé pour simplifier l'expérience utilisateur et assurer une meilleure prévisibilité des coûts.

### Nouvelle Architecture
- ✅ **Allocation automatique** : Tokens inclus dans chaque plan d'abonnement
- ✅ **Système de rollover** : Report intelligent des tokens non utilisés
- ✅ **Gestion centralisée** : Un seul point de gestion via l'abonnement
- ❌ **Plus d'achat séparé** : Simplification du modèle économique

## 🔧 Structure des Données Modernisées

### Types de Transactions

```typescript
enum TokenTransactionType {
  ALLOCATION = 'allocation',    // Attribution mensuelle via abonnement
  USAGE = 'usage',             // Consommation de tokens
  ROLLOVER = 'rollover',       // Report de tokens non utilisés
  ADJUSTMENT = 'adjustment',    // Ajustement manuel
  EXPIRY = 'expiry',           // Expiration automatique
  BONUS = 'bonus'              // Tokens bonus (promotions)
}
```

### Allocation de Tokens par Plan

```typescript
interface TokenAllocation {
  monthlyTokens: number;        // Allocation mensuelle de base
  rolloverLimit: number;        // Limite de tokens reportables
  rolloverPeriods: number;      // Nombre de périodes de rollover autorisées
  bonusMultiplier?: number;     // Multiplicateur pour tokens bonus
}
```

### Solde de Tokens Unifié

```typescript
interface CustomerTokenBalance {
  id: string;
  customerId: string;
  subscriptionId: string;       // Lié à l'abonnement actif
  
  // Solde actuel
  totalTokens: number;          // Total disponible (allocation + rollover + bonus)
  monthlyAllocation: number;    // Allocation du plan actuel
  usedTokens: number;          // Tokens consommés cette période
  remainingTokens: number;     // Tokens restants
  
  // Gestion du rollover
  rolledOverTokens: number;    // Tokens reportés des périodes précédentes
  rolloverHistory: TokenRollover[];
  
  // Tokens bonus
  bonusTokens: number;         // Tokens bonus actifs
  bonusExpiry?: Date;          // Date d'expiration des bonus
  
  // Période courante
  currentPeriod: string;       // Format: YYYY-MM
  periodStartDate: Date;       // Début de la période actuelle
  periodEndDate: Date;         // Fin de la période actuelle
  
  // Métadonnées
  lastUpdated: Date;
  createdAt: Date;
}
```

### Historique de Rollover

```typescript
interface TokenRollover {
  period: string;              // Période d'origine (YYYY-MM)
  rolledAmount: number;        // Montant reporté
  expiryDate: Date;           // Date d'expiration du rollover
  remainingAmount: number;     // Montant encore disponible
  createdAt: Date;            // Date du rollover
}
```

### Transaction de Tokens

```typescript
interface TokenTransaction {
  id: string;
  customerId: string;
  subscriptionId?: string;     // Lié à l'abonnement si applicable
  
  // Type et montant
  transactionType: TokenTransactionType;
  tokenAmount: number;         // Positif pour allocation/bonus, négatif pour usage
  
  // Soldes
  balanceBefore: number;
  balanceAfter: number;
  
  // Contexte d'utilisation
  featureCode?: string;        // Code de la fonctionnalité utilisée
  description: string;         // Description de la transaction
  
  // Métadonnées
  metadata?: {
    sessionId?: string;        // ID de session pour usages
    duration?: number;         // Durée en secondes
    complexity?: string;       // Niveau de complexité
    processingTime?: number;   // Temps de traitement
    documentType?: string;     // Type de document traité
    userAction?: string;       // Action utilisateur déclenchante
  };
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}
```
```

## 🔗 Endpoints API Modernisés

> ⚠️ **Note** : Les endpoints d'achat de tokens ont été supprimés. Les tokens sont maintenant gérés automatiquement via les abonnements.

### 1. Consulter le Solde de Tokens

```http
GET /tokens/balance
Authorization: Bearer <access_token>
```

**Réponse** :
```json
{
  "data": {
    "customerId": "user_123",
    "subscriptionId": "sub_456",
    "totalTokens": 2350000,           // Total disponible
    "monthlyAllocation": 2000000,     // Allocation du plan actuel
    "usedTokens": 150000,             // Consommés cette période
    "remainingTokens": 2350000,       // Encore disponibles
    "rolledOverTokens": 500000,       // Reportés des périodes précédentes
    "bonusTokens": 100000,            // Tokens bonus actifs
    "currentPeriod": "2025-11",
    "periodStartDate": "2025-11-01T00:00:00Z",
    "periodEndDate": "2025-11-30T23:59:59Z",
    "rolloverHistory": [
      {
        "period": "2025-10",
        "rolledAmount": 500000,
        "expiryDate": "2025-12-31T23:59:59Z",
        "remainingAmount": 500000,
        "createdAt": "2025-11-01T00:00:00Z"
      }
    ],
    "bonusExpiry": "2025-12-31T23:59:59Z",
    "lastUpdated": "2025-11-05T10:30:00Z"
  }
}
```

### 2. Historique des Transactions

```http
GET /tokens/transactions?page=1&limit=20&type=usage&feature=ai_chat_assistance
Authorization: Bearer <access_token>
```

**Paramètres de requête** :
- `page` : Page (défaut: 1)
- `limit` : Limite par page (défaut: 20, max: 100)
- `type` : Type de transaction (`allocation`, `usage`, `rollover`, `bonus`, `expiry`)
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
      "subscriptionId": "sub_456",
      "transactionType": "usage",
      "tokenAmount": -5000,
      "balanceBefore": 2355000,
      "balanceAfter": 2350000,
      "featureCode": "ai_chat_assistance",
      "description": "Conversation IA - Analyse financière",
      "metadata": {
        "sessionId": "chat_456",
        "duration": 180,
        "complexity": "medium",
        "messageCount": 12,
        "userAction": "financial_analysis"
      },
      "createdAt": "2025-11-05T09:30:00Z"
    },
    {
      "id": "tx_789011",
      "customerId": "user_123",
      "subscriptionId": "sub_456",
      "transactionType": "allocation",
      "tokenAmount": 2000000,
      "balanceBefore": 500000,
      "balanceAfter": 2500000,
      "description": "Allocation mensuelle - Plan SME Standard",
      "createdAt": "2025-11-01T00:00:00Z"
    },
    {
      "id": "tx_789010",
      "customerId": "user_123",
      "transactionType": "rollover",
      "tokenAmount": 500000,
      "balanceBefore": 0,
      "balanceAfter": 500000,
      "description": "Report tokens non utilisés - Octobre 2025",
      "metadata": {
        "originalPeriod": "2025-10",
        "expiryDate": "2025-12-31T23:59:59Z"
      },
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
      "totalRolledOver": 800000,
      "totalBonus": 200000,
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
Authorization: Bearer <access_token>
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
    "processingTime": 45,
    "userAction": "contract_review"
  }
}
```

**Réponse** :
```json
{
  "data": {
    "transactionId": "tx_789013",
    "tokenAmount": 15000,
    "balanceBefore": 2350000,
    "balanceAfter": 2335000,
    "featureCode": "document_analysis",
    "description": "Analyse contrat de prêt",
    "success": true,
    "warningMessage": null
  }
}
```

### 4. Réserver des Tokens (pour opérations longues)

```http
POST /tokens/reserve
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Corps de la requête** :
```json
{
  "featureCode": "bulk_document_processing",
  "estimatedTokens": 50000,
  "description": "Traitement en lot de 20 documents",
  "reservationTimeout": 3600,  // Secondes avant libération auto
  "metadata": {
    "batchId": "batch_789",
    "documentCount": 20,
    "estimatedDuration": 1800
  }
}
```

**Réponse** :
```json
{
  "data": {
    "reservationId": "res_456789",
    "reservedTokens": 50000,
    "expiresAt": "2025-11-05T11:30:00Z",
    "newAvailableBalance": 2285000
  }
}
```

### 5. Confirmer/Libérer Réservation

```http
POST /tokens/reserve/{reservationId}/confirm
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Corps de la requête** :
```json
{
  "actualTokensUsed": 42000,
  "description": "Traitement terminé - 18 documents traités avec succès",
  "metadata": {
    "successfulDocuments": 18,
    "failedDocuments": 2,
    "actualDuration": 1650
  }
}
```

**Réponse** :
```json
{
  "data": {
    "transactionId": "tx_789014",
    "reservedTokens": 50000,
    "actualTokensUsed": 42000,
    "refundedTokens": 8000,
    "finalBalance": 2293000,
    "success": true
  }
}
```

    "success": true
  }
}
```

## 💡 Fonctionnalités et Consommation de Tokens

### Codes de Fonctionnalités et Coûts

```typescript
enum FeatureCode {
  // Intelligence Artificielle
  AI_CHAT_ASSISTANCE = 'ai_chat_assistance',          // 500-2000 tokens/session
  DOCUMENT_ANALYSIS = 'document_analysis',            // 5000-50000 tokens/document
  AI_FINANCIAL_ADVISOR = 'ai_financial_advisor',      // 1000-5000 tokens/consultation
  
  // Analyses et Rapports
  BUSINESS_ANALYTICS = 'business_analytics',          // 10000 tokens/rapport
  SALES_TRACKING = 'sales_tracking',                  // 5000 tokens/rapport
  FINANCIAL_REPORTING = 'financial_reporting',        // 15000 tokens/rapport
  PERFORMANCE_DASHBOARD = 'performance_dashboard',     // 3000 tokens/génération
  
  // Gestion Documentaire
  CONTRACT_REVIEW = 'contract_review',                // 20000-100000 tokens/contrat
  INVOICE_PROCESSING = 'invoice_processing',          // 2000-5000 tokens/facture
  DOCUMENT_AUTOMATION = 'document_automation',        // 5000-25000 tokens/batch
  
  // Fonctionnalités Premium
  ADVANCED_FORECASTING = 'advanced_forecasting',     // 25000 tokens/analyse
  RISK_ASSESSMENT = 'risk_assessment',               // 15000 tokens/évaluation
  COMPLIANCE_CHECK = 'compliance_check',             // 10000 tokens/vérification
}
```

### Calcul Dynamique des Coûts

```typescript
interface TokenCostCalculation {
  baseTokens: number;           // Coût de base
  complexityMultiplier: number; // Multiplicateur selon complexité
  volumeMultiplier: number;     // Multiplicateur selon volume
  finalCost: number;           // Coût final calculé
  factors: {
    documentSize?: number;      // Taille du document
    processingTime?: number;    // Temps de traitement
    dataPoints?: number;        // Nombre de points de données
    userInteractions?: number;  // Interactions utilisateur
  };
}
```

## ⚙️ Logique Métier Automatisée

### Allocation Mensuelle Automatique

```typescript
// Processus automatique exécuté le 1er de chaque mois
async function processMonthlyTokenAllocation() {
  const activeSubscriptions = await getActiveSubscriptions();
  
  for (const subscription of activeSubscriptions) {
    const plan = await getPlanDetails(subscription.planId);
    const allocation = plan.tokenAllocation;
    
    // Calcul du rollover
    const currentBalance = await getTokenBalance(subscription.customerId);
    const rolloverAmount = Math.min(
      currentBalance.remainingTokens,
      allocation.rolloverLimit
    );
    
    // Nouvelle allocation
    await allocateMonthlyTokens({
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      monthlyTokens: allocation.monthlyTokens,
      rolloverTokens: rolloverAmount,
      rolloverExpiry: addMonths(new Date(), allocation.rolloverPeriods)
    });
  }
}
```

### Système de Rollover Intelligent

```typescript
interface RolloverStrategy {
  immediate: boolean;           // Report immédiat
  graduated: boolean;          // Report progressif selon utilisation
  maxPeriods: number;          // Nombre max de périodes de report
  decayRate?: number;          // Taux de dépréciation par période
}

// Exemple: Plan Standard avec rollover intelligent
const standardRollover: RolloverStrategy = {
  immediate: true,
  graduated: false,
  maxPeriods: 2,
  decayRate: 0 // Pas de dépréciation
};

// Exemple: Plan Premium avec rollover avancé
const premiumRollover: RolloverStrategy = {
  immediate: true,
  graduated: true,
  maxPeriods: 3,
  decayRate: 0.1 // 10% de dépréciation par période
};
```

### Middleware de Consommation Automatique

```typescript
@Injectable()
export class TokenConsumptionMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const customer = req.customer;
    const featureCode = req.headers['x-feature-code'];
    const estimatedTokens = req.headers['x-estimated-tokens'];
    
    if (featureCode && estimatedTokens) {
      // Vérification du solde avant traitement
      const balance = await this.tokenService.getBalance(customer.id);
      
      if (balance.remainingTokens < Number(estimatedTokens)) {
        throw new InsufficientTokensException({
          required: Number(estimatedTokens),
          available: balance.remainingTokens,
          suggestions: await this.getTokenRecommendations(customer.id)
        });
      }
      
      // Réservation des tokens
      req.tokenReservation = await this.tokenService.reserveTokens(
        customer.id,
        Number(estimatedTokens),
        featureCode
      );
    }
    
    next();
  }
}
```

## 🔒 Sécurité et Contrôles

### Validation et Limites

```typescript
interface TokenSecurityConfig {
  maxDailyUsage: number;        // Limite quotidienne
  maxSessionUsage: number;      // Limite par session
  suspiciousActivityThreshold: number; // Seuil d'activité suspecte
  fraudDetectionEnabled: boolean;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerHour: number;
  };
}
```

### Audit et Traçabilité

```typescript
interface TokenAuditLog {
  transactionId: string;
  customerId: string;
  timestamp: Date;
  action: 'allocation' | 'usage' | 'rollover' | 'adjustment';
  previousBalance: number;
  newBalance: number;
  ipAddress: string;
  userAgent: string;
  featureAccessed: string;
  metadata: {
    sessionId?: string;
    geolocation?: string;
    deviceFingerprint?: string;
  };
}
```

## 📊 Analytics et Métriques

### Métriques d'Utilisation

```typescript
interface TokenUsageAnalytics {
  customerId: string;
  period: string;
  totalUsage: number;
  usageByFeature: Record<FeatureCode, number>;
  peakUsageHours: number[];
  utilizationRate: number;      // % d'utilisation vs allocation
  efficiency: {
    successfulOperations: number;
    failedOperations: number;
    averageTokensPerOperation: number;
  };
  predictions: {
    projectedMonthlyUsage: number;
    recommendedPlan?: string;
    optimizationSuggestions: string[];
  };
}
```

### Système d'Alertes

```typescript
enum TokenAlertType {
  LOW_BALANCE = 'low_balance',           // Solde faible
  HIGH_USAGE = 'high_usage',             // Utilisation élevée
  UNUSUAL_PATTERN = 'unusual_pattern',   // Pattern inhabituel
  APPROACHING_LIMIT = 'approaching_limit', // Approche des limites
  ROLLOVER_EXPIRY = 'rollover_expiry'    // Expiration rollover
}

interface TokenAlert {
  type: TokenAlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  actionRequired: boolean;
  suggestedActions: string[];
  metadata: any;
}
```

## 🚀 Optimisations et Performance

### Cache et Performance

```typescript
@Injectable()
export class TokenCacheService {
  private readonly redis: Redis;
  private readonly CACHE_TTL = 300; // 5 minutes
  
  async getCachedBalance(customerId: string): Promise<CustomerTokenBalance | null> {
    const cached = await this.redis.get(`token:balance:${customerId}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  async setCachedBalance(customerId: string, balance: CustomerTokenBalance) {
    await this.redis.setex(
      `token:balance:${customerId}`,
      this.CACHE_TTL,
      JSON.stringify(balance)
    );
  }
  
  async invalidateBalanceCache(customerId: string) {
    await this.redis.del(`token:balance:${customerId}`);
  }
}
```

### Optimisation des Requêtes

```typescript
// Requête optimisée pour le solde avec rollover
const getOptimizedTokenBalance = async (customerId: string) => {
  return await this.tokenRepository
    .createQueryBuilder('balance')
    .leftJoinAndSelect('balance.rolloverHistory', 'rollover')
    .leftJoinAndSelect('balance.subscription', 'subscription')
    .leftJoinAndSelect('subscription.plan', 'plan')
    .where('balance.customerId = :customerId', { customerId })
    .andWhere('rollover.expiryDate > :now OR rollover.expiryDate IS NULL', { 
      now: new Date() 
    })
    .orderBy('rollover.createdAt', 'DESC')
    .getOne();
};
```

---

*Documentation mise à jour le 5 novembre 2025 - Système de tokens intégré aux abonnements, suppression de l'achat indépendant de tokens.*
```
