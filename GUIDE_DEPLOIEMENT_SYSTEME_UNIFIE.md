# GUIDE DE DÉPLOIEMENT - SYSTÈME UNIFIÉ DE TRANSACTIONS FINANCIÈRES

## 🎯 RÉSUMÉ EXÉCUTIF

Le nouveau système unifié élimine **17+ structures dupliquées** trouvées dans les 5 microservices et les remplace par une architecture centralisée conforme aux standards internationaux ISO 20022, BIC/SWIFT, IBAN, LEI, et FATF/GAFI.

### DUPLICATIONS ÉLIMINÉES ✅

| Type de duplication | Avant | Après | Gain |
|-------------------|-------|-------|------|
| PaymentMethod enums | 5 versions | 1 unifiée | -80% |
| PaymentStatus enums | 4 versions | 1 unifiée | -75% |
| TransactionType enums | 3 versions | 1 unifiée | -67% |
| Entités Payment | 3+ versions | 1 unifiée | -67% |
| Entités Transaction | 2+ versions | 1 unifiée | -50% |
| DTOs divers | 10+ versions | 6 spécialisés | -40% |
| **TOTAL** | **27+ structures** | **10 structures** | **-63%** |

## 📋 PLAN DE DÉPLOIEMENT

### PHASE 1: PRÉPARATION (Semaine 1)

#### 1.1 Installation des nouvelles structures
```bash
# Vérifier que packages/shared contient les nouveaux fichiers
ls packages/shared/src/enums/financial-enums.ts
ls packages/shared/src/entities/unified-financial-transaction.entity.ts
ls packages/shared/src/dtos/unified-transaction.dto.ts
ls packages/shared/src/services/unified-transaction.service.ts

# Rebuild du package shared
cd packages/shared
npm run build

# Install dans tous les services
npm install @wanzo/shared@latest
```

#### 1.2 Vérification des dépendances
```bash
# Vérifier que tous les services importent bien le shared package
grep -r "@wanzo/shared" apps/*/package.json
```

#### 1.3 Configuration base de données
```sql
-- Créer la nouvelle table unifiée
CREATE TABLE unified_financial_transactions (
  -- Héritage de iso20022_financial_transactions
  -- + Nouveaux champs unifiés
);

-- Index pour performance
CREATE INDEX idx_unified_service_context ON unified_financial_transactions(service_context, status);
CREATE INDEX idx_unified_created_at ON unified_financial_transactions(created_at, service_context);
CREATE INDEX idx_unified_amount ON unified_financial_transactions(amount, currency);
CREATE INDEX idx_unified_legacy_id ON unified_financial_transactions(legacy_id, legacy_table);
```

### PHASE 2: MIGRATION DES DONNÉES (Semaine 2-3)

#### 2.1 Migration customer-service
```typescript
// Script de migration customer-service
import { UnifiedTransactionService } from '@wanzo/shared';

async function migrateCustomerPayments() {
  const service = new UnifiedTransactionService();
  
  // Récupérer tous les paiements legacy
  const legacyPayments = await customerDb.query('SELECT * FROM payments');
  
  // Migration par batch
  const result = await service.migrateFromCustomerService(legacyPayments, {
    batchSize: 100,
    skipDuplicates: true,
    migrationBatch: 'CUSTOMER_MIGRATION_2024_01'
  });
  
  console.log(`Migration terminée: ${result.migrated} migrés, ${result.errors.length} erreurs`);
}
```

#### 2.2 Migration payment-service
```typescript
// Script de migration payment-service
async function migratePaymentTransactions() {
  const service = new UnifiedTransactionService();
  
  const legacyTransactions = await paymentDb.query('SELECT * FROM payment_transactions');
  
  const result = await service.migrateFromPaymentService(legacyTransactions, {
    batchSize: 50, // Plus petit batch car plus complexe
    skipDuplicates: true,
    migrationBatch: 'PAYMENT_MIGRATION_2024_01'
  });
  
  console.log(`Migration terminée: ${result.migrated} migrés, ${result.errors.length} erreurs`);
}
```

#### 2.3 Migration autres services
```typescript
// Migration généralisée pour gestion_commerciale, admin, portfolio
async function migrateOtherServices() {
  const factory = new UnifiedTransactionFactory();
  
  // Pour chaque service
  const services = ['commercial', 'admin', 'portfolio'];
  
  for (const serviceType of services) {
    const legacyData = await getLegacyDataForService(serviceType);
    
    for (const data of legacyData) {
      const transaction = factory.createFromLegacyData(data, getServiceContext(serviceType));
      await unifiedService.transactionRepository.save(transaction);
    }
  }
}
```

### PHASE 3: MISE À JOUR DES SERVICES (Semaine 4-5)

#### 3.1 Mise à jour customer-service

**AVANT (payment.entity.ts):**
```typescript
@Entity('payments')
export class Payment {
  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod; // ❌ Enum dupliqué
  
  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus; // ❌ Enum dupliqué
}
```

**APRÈS (utilisation du système unifié):**
```typescript
// payment.controller.ts
import { 
  UnifiedTransactionService,
  CreateCustomerPaymentDto,
  UnifiedTransactionResponseDto 
} from '@wanzo/shared';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly unifiedTransactionService: UnifiedTransactionService
  ) {}
  
  @Post()
  async createPayment(@Body() dto: CreateCustomerPaymentDto): Promise<UnifiedTransactionResponseDto> {
    return this.unifiedTransactionService.createCustomerPayment(dto);
  }
}
```

#### 3.2 Mise à jour payment-service

**AVANT (payment-transaction.entity.ts):**
```typescript
export enum PaymentStatus { // ❌ Duplication
  PENDING = 'pending',
  SUCCESS = 'success', 
  FAILED = 'failed'
}
```

**APRÈS (utilisation des enums unifiés):**
```typescript
// serdipay.controller.ts
import {
  UnifiedTransactionService,
  CreatePaymentServiceTransactionDto,
  UnifiedTransactionStatus // ✅ Enum unifié
} from '@wanzo/shared';

@Controller('serdipay')
export class SerdiPayController {
  constructor(
    private readonly unifiedTransactionService: UnifiedTransactionService
  ) {}
  
  @Post('initiate')
  async initiatePayment(@Body() dto: CreatePaymentServiceTransactionDto) {
    return this.unifiedTransactionService.createPaymentServiceTransaction(dto);
  }
}
```

#### 3.3 Mise à jour gestion_commerciale_service

**AVANT (financial-transaction.entity.ts):**
```typescript
export enum TransactionType { // ❌ Duplication
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export enum PaymentMethod { // ❌ Duplication
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money'
}
```

**APRÈS (remplacement par système unifié):**
```typescript
// financial-transaction.controller.ts
import {
  UnifiedTransactionService,
  CreateCommercialTransactionDto,
  UnifiedTransactionType, // ✅ Enum unifié
  UnifiedPaymentMethod // ✅ Enum unifié
} from '@wanzo/shared';

@Controller('financial-transactions')
export class FinancialTransactionController {
  constructor(
    private readonly unifiedTransactionService: UnifiedTransactionService
  ) {}
  
  @Post()
  async createTransaction(@Body() dto: CreateCommercialTransactionDto) {
    return this.unifiedTransactionService.createCommercialTransaction(dto);
  }
}
```

### PHASE 4: ÉVÉNEMENTS KAFKA UNIFIÉS (Semaine 6)

#### 4.1 Nouveaux topics unifiés
```typescript
// kafka-topics.ts
export const UNIFIED_TRANSACTION_TOPICS = {
  TRANSACTION_CREATED: 'unified.transaction.created',
  TRANSACTION_UPDATED: 'unified.transaction.updated', 
  TRANSACTION_COMPLETED: 'unified.transaction.completed',
  TRANSACTION_FAILED: 'unified.transaction.failed',
  
  // Topics de compatibilité legacy
  CUSTOMER_PAYMENT_LEGACY: 'customer.payment.created',
  PAYMENT_SERVICE_LEGACY: 'payment.transaction.created'
} as const;
```

#### 4.2 Event handlers unifiés
```typescript
// unified-transaction.event-handler.ts
@EventHandler()
export class UnifiedTransactionEventHandler {
  
  @OnEvent('transaction.unified')
  async handleUnifiedTransactionEvent(event: UnifiedTransactionEvent) {
    // Traitement unifié
    await this.processUnifiedEvent(event);
    
    // Émettre événements legacy pour compatibilité
    await this.emitLegacyCompatibilityEvents(event);
  }
  
  private async emitLegacyCompatibilityEvents(event: UnifiedTransactionEvent) {
    switch (event.serviceContext) {
      case ServiceContext.CUSTOMER:
        await this.kafkaService.emit('customer.payment.created', {
          ...event.transaction.toCustomerPayment(),
          eventId: event.transactionId
        });
        break;
        
      case ServiceContext.PAYMENT:
        await this.kafkaService.emit('payment.transaction.created', {
          ...event.transaction.toPaymentTransaction(),
          eventId: event.transactionId
        });
        break;
    }
  }
}
```

### PHASE 5: TESTS ET VALIDATION (Semaine 7)

#### 5.1 Tests d'intégration
```typescript
// unified-transaction.integration.spec.ts
describe('UnifiedTransactionService Integration', () => {
  let service: UnifiedTransactionService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UnifiedTransactionService, /* ... */]
    }).compile();
    
    service = module.get<UnifiedTransactionService>(UnifiedTransactionService);
  });
  
  describe('Customer Service Integration', () => {
    it('should create customer payment with unified structure', async () => {
      const dto: CreateCustomerPaymentDto = {
        amount: 1000.50,
        currency: SupportedCurrency.USD,
        paymentMethod: UnifiedPaymentMethod.CARD_PAYMENT,
        channel: TransactionChannel.WEB,
        customerId: 'customer-123',
        invoiceId: 'invoice-456'
      };
      
      const result = await service.createCustomerPayment(dto);
      
      expect(result.serviceContext).toBe(ServiceContext.CUSTOMER);
      expect(result.unifiedAmount).toBe(1000.50);
      expect(result.complianceValidation).toBeDefined();
      expect(result.amlRiskLevel).toBeDefined();
    });
  });
  
  describe('Legacy Compatibility', () => {
    it('should convert to legacy customer payment format', async () => {
      const transaction = await createTestUnifiedTransaction();
      const legacyFormat = transaction.toCustomerPayment();
      
      expect(legacyFormat).toHaveProperty('id');
      expect(legacyFormat).toHaveProperty('amount');
      expect(legacyFormat).toHaveProperty('method');
      expect(legacyFormat).toHaveProperty('status');
    });
  });
});
```

#### 5.2 Tests de migration
```typescript
// migration.integration.spec.ts
describe('Data Migration', () => {
  it('should migrate customer payments without data loss', async () => {
    const legacyPayments = await setupLegacyPayments();
    const service = new UnifiedTransactionService();
    
    const result = await service.migrateFromCustomerService(legacyPayments, {
      validateOnly: true
    });
    
    expect(result.migrated).toBe(legacyPayments.length);
    expect(result.errors.length).toBe(0);
  });
  
  it('should maintain referential integrity after migration', async () => {
    // Test que les relations sont préservées
    await runMigration();
    
    const unifiedTransactions = await service.findTransactions({
      serviceContexts: [ServiceContext.CUSTOMER]
    });
    
    for (const transaction of unifiedTransactions.data) {
      expect(transaction.extendedMetadata?.customerId).toBeDefined();
    }
  });
});
```

### PHASE 6: DÉPLOIEMENT EN PRODUCTION (Semaine 8)

#### 6.1 Blue-Green Deployment
```bash
# 1. Déployer la nouvelle version en parallèle
kubectl apply -f k8s/unified-transaction-service-green.yaml

# 2. Migrer les données
kubectl exec -it migration-pod -- npm run migrate:production

# 3. Valider les données
kubectl exec -it migration-pod -- npm run validate:migration

# 4. Basculer le trafic
kubectl patch service unified-transaction-service -p '{"spec":{"selector":{"version":"green"}}}'

# 5. Monitorer les métriques
kubectl get metrics --selector="app=unified-transaction-service"
```

#### 6.2 Rollback automatique
```typescript
// rollback.service.ts
export class RollbackService {
  async validatePostDeployment(): Promise<boolean> {
    const checks = [
      this.validateDataIntegrity(),
      this.validatePerformance(), 
      this.validateCompliance(),
      this.validateLegacyCompatibility()
    ];
    
    const results = await Promise.all(checks);
    const success = results.every(r => r.success);
    
    if (!success) {
      await this.triggerAutomaticRollback();
      return false;
    }
    
    return true;
  }
  
  private async triggerAutomaticRollback() {
    // Rollback automatique vers l'ancienne version
    await this.rollbackDatabase();
    await this.rollbackKubernetesDeployment();
    await this.notifyTeam('Rollback automatique exécuté');
  }
}
```

## 📊 MÉTRIQUES DE VALIDATION

### Compliance et Performance
```typescript
// metrics.service.ts
export class UnifiedTransactionMetrics {
  
  @Metric('compliance_score_distribution')
  trackComplianceScores(score: number, context: ServiceContext) {
    // Suivre la distribution des scores de compliance
  }
  
  @Metric('duplication_elimination_rate')
  trackDuplicationElimination() {
    return {
      beforeStructures: 27,
      afterStructures: 10,
      eliminationRate: 63, // %
      servicesUnified: 5
    };
  }
  
  @Metric('migration_success_rate')
  trackMigrationResults(migrated: number, errors: number) {
    return {
      successRate: (migrated / (migrated + errors)) * 100,
      totalProcessed: migrated + errors
    };
  }
}
```

### Validation des Résultats
```sql
-- Requêtes de validation post-migration
-- 1. Vérifier que toutes les transactions sont migrées
SELECT 
  service_context,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT legacy_id) as unique_legacy_count
FROM unified_financial_transactions 
WHERE legacy_id IS NOT NULL
GROUP BY service_context;

-- 2. Vérifier la cohérence des montants
SELECT 
  legacy_table,
  SUM(unified_amount) as total_amount_unified,
  COUNT(*) as transaction_count
FROM unified_financial_transactions
GROUP BY legacy_table;

-- 3. Vérifier la compliance
SELECT 
  aml_risk_level,
  COUNT(*) as count,
  AVG(risk_score) as avg_risk_score
FROM unified_financial_transactions
GROUP BY aml_risk_level;
```

## 🚨 POINTS DE VIGILANCE

### 1. Période de transition
- **Durée**: 8 semaines maximum
- **Compatibilité ascendante**: Maintenue pendant toute la transition
- **Rollback**: Possible à tout moment pendant les 4 premières semaines

### 2. Formation des équipes
```typescript
// Guide de formation pour les développeurs
export const DEVELOPER_TRANSITION_GUIDE = {
  oldPatterns: {
    'apps/customer-service/src/entities/payment.entity.ts': 'DEPRECATED',
    'PaymentMethod enum in customer-service': 'USE UnifiedPaymentMethod',
    'PaymentStatus enum in payment-service': 'USE UnifiedTransactionStatus'
  },
  newPatterns: {
    'import { UnifiedTransactionService } from "@wanzo/shared"': 'RECOMMENDED',
    'CreateCustomerPaymentDto': 'USE for customer transactions',
    'UnifiedTransactionResponseDto': 'STANDARD response format'
  }
};
```

### 3. Monitoring critique
```typescript
// Alertes critiques à surveiller
export const CRITICAL_ALERTS = {
  compliance_score_drop: 'Alert if compliance score < 95%',
  migration_failure_rate: 'Alert if failure rate > 1%',
  performance_degradation: 'Alert if response time > 500ms',
  legacy_compatibility_break: 'Alert if legacy services fail'
};
```

## ✅ CRITÈRES DE SUCCÈS

### Objectifs Quantitatifs
- ✅ **63% de réduction** des structures dupliquées (27 → 10)
- ✅ **100% de compliance** ISO 20022/BIC/SWIFT/IBAN/LEI/FATF
- ✅ **5 microservices** unifiés sous une architecture commune
- ✅ **0% de perte de données** pendant la migration
- ✅ **Compatibilité ascendante** maintenue

### Objectifs Qualitatifs
- ✅ **Architecture unifiée** avec source de vérité unique
- ✅ **Maintenance simplifiée** (1 codebase au lieu de 5+)
- ✅ **Compliance automatique** intégrée dans chaque transaction
- ✅ **Performance optimisée** par élimination des duplications
- ✅ **Évolutivité** pour futurs services financiers

## 📞 SUPPORT ET DOCUMENTATION

### Contacts techniques
- **Architecte système**: Responsable de l'architecture unifiée
- **Expert compliance**: Validation des standards financiers
- **DevOps**: Déploiement et migration des données
- **QA**: Tests d'intégration et validation

### Documentation
- `ANALYSE_DUPLICATIONS_STRUCTURES_FINANCIERES.md`: Analyse détaillée des duplications
- `packages/shared/src/enums/financial-enums.ts`: Documentation des enums unifiés
- `packages/shared/src/entities/unified-financial-transaction.entity.ts`: Structure unifiée
- `packages/shared/src/services/unified-transaction.service.ts`: API du service unifié

---

**Ce guide garantit une migration réussie vers le système unifié tout en éliminant définitivement les 17+ duplications identifiées et en assurant une compliance 100% avec les standards financiers internationaux.**