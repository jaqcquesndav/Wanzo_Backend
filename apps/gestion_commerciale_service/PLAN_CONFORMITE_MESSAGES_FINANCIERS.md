# PLAN DE MISE EN CONFORMITÉ - MESSAGES FINANCIERS
**Date**: 18 Novembre 2025  
**Service**: gestion_commerciale_service  
**Priorité**: 🔴 CRITIQUE

---

## 📋 RÉSUMÉ EXÉCUTIF

### Statut Actuel: ❌ NON CONFORME
- **0/6 modules** publient des événements financiers standardisés
- **Score de conformité**: 15/100
- **Impact**: Désynchronisation avec accounting-service, analytics-service, adha-ai

### Normes de Référence
- ✓ Schémas standardisés définis dans `packages/shared/src/events/message-schemas.ts`
- ✓ Topics Kafka standardisés dans `packages/shared/src/events/standard-kafka-topics.ts`
- ✓ Versioning des messages dans `packages/shared/src/events/message-versioning.ts`

---

## 🎯 OBJECTIFS

1. **Conformité aux schémas financiers**: 100% des transactions émettent des événements standardisés
2. **Intégration Kafka complète**: Sales, Expenses, Inventory publient sur les topics appropriés
3. **Compatibilité inter-services**: Messages consommables par accounting/analytics/adha-ai
4. **Traçabilité financière**: Chaque transaction = 1 événement avec correlation ID

---

## 🔍 ANALYSE DES GAPS

### Module: Sales (CRITIQUE)

**Fichiers concernés:**
- `src/modules/sales/sales.service.ts` (507 lignes)
- `src/modules/sales/sales.controller.ts`
- `src/modules/sales/entities/sale.entity.ts`

**Problèmes identifiés:**

#### 1. Aucune publication d'événements
```typescript
// LIGNE 35-130: create()
async create(createSaleDto: CreateSaleDto): Promise<Sale> {
  return this.dataSource.transaction(async (transactionalEntityManager) => {
    // ... logique de création ...
    const savedSale = await transactionalEntityManager.save(Sale, newSale);
    
    // ❌ MANQUANT: Publication événement commerce.operation.created
    
    return resultSale;
  });
}

// LIGNE 199-233: completeSale()
async completeSale(id: string, completeSaleDto: CompleteSaleDto): Promise<Sale> {
  // ... mise à jour statut ...
  // ❌ MANQUANT: Publication événement commerce.operation.updated
}

// LIGNE 237-277: cancelSale()
async cancelSale(id: string, cancelSaleDto: CancelSaleDto): Promise<Sale> {
  // ... annulation ...
  // ❌ MANQUANT: Publication événement commerce.operation.cancelled
}
```

#### 2. Structure non alignée avec BusinessOperationEventData

**Schéma attendu:**
```typescript
interface BusinessOperationEventData {
  id: string;
  type: OperationType;        // "SALE"
  date: string;               // ISO 8601
  description: string;
  amountCdf: number;
  status: OperationStatus;    // "PENDING" | "COMPLETED" | "CANCELLED"
  companyId: string;
  clientId?: string;
  createdBy: string;
  reference?: string;
  relatedPartyId?: string;
  relatedPartyName?: string;
}
```

**Mapping requis depuis Sale entity:**
```typescript
Sale → BusinessOperationEventData
{
  id: sale.id,
  type: OperationType.SALE,
  date: sale.date.toISOString(),
  description: `Vente ${sale.customerName} - ${sale.items.length} articles`,
  amountCdf: sale.totalAmountInCdf,
  status: mapSaleStatusToOperationStatus(sale.status),
  companyId: sale.companyId,  // ⚠️ À AJOUTER à l'entité Sale
  clientId: sale.customerId || undefined,
  createdBy: sale.userId,
  reference: sale.id,
  relatedPartyId: sale.customerId,
  relatedPartyName: sale.customerName,
  metadata: {
    paymentMethod: sale.paymentMethod,
    itemsCount: sale.items.length,
    exchangeRate: sale.exchangeRate,
    paidAmount: sale.paidAmountInCdf,
  }
}
```

#### 3. Fonction de mapping manquante
```typescript
// ❌ MANQUANT: Conversion SaleStatus → OperationStatus
function mapSaleStatusToOperationStatus(status: SaleStatus): OperationStatus {
  switch (status) {
    case SaleStatus.PENDING:
    case SaleStatus.PARTIALLY_PAID:
      return OperationStatus.PENDING;
    case SaleStatus.COMPLETED:
      return OperationStatus.COMPLETED;
    case SaleStatus.CANCELLED:
      return OperationStatus.CANCELLED;
    default:
      return OperationStatus.PENDING;
  }
}
```

### Module: Expenses (CRITIQUE)

**Fichiers concernés:**
- `src/modules/expenses/expenses.service.ts`
- `src/modules/expenses/entities/expense.entity.ts`

**Problèmes:**
- ❌ Aucune publication lors de create()
- ❌ Pas de mapping vers BusinessOperationEventData (type: EXPENSE)
- ❌ Champ `companyId` manquant dans l'entité

### Module: Inventory (MOYEN)

**Fichiers concernés:**
- `src/modules/inventory/products.service.ts`

**Problèmes:**
- ❌ Mouvements de stock non publiés
- ❌ Pas d'événements pour stock-in / stock-out
- ❌ Type INVENTORY non utilisé dans les événements

### Module: Financial Transactions (CRITIQUE)

**Problème global:**
- ❌ Aucune entité FinancialTransaction dédiée
- ❌ Pas de distinction claire entre "transaction" et "opération"
- ❌ Pas de support pour mobile.transaction.created

---

## 🛠️ PLAN D'IMPLÉMENTATION

### Phase 1: Infrastructure de base (1 jour)

#### Task 1.1: Ajouter companyId aux entités
**Fichiers à modifier:**
- `src/modules/sales/entities/sale.entity.ts`
- `src/modules/expenses/entities/expense.entity.ts`

```typescript
// sale.entity.ts
@Entity('sales')
export class Sale {
  // ... autres champs ...
  
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;
  
  @Column({ name: 'user_id' })
  userId: string;
}
```

**Migration requise:**
```sql
ALTER TABLE sales ADD COLUMN company_id UUID NOT NULL;
ALTER TABLE expenses ADD COLUMN company_id UUID NOT NULL;
CREATE INDEX idx_sales_company_id ON sales(company_id);
CREATE INDEX idx_expenses_company_id ON expenses(company_id);
```

#### Task 1.2: Créer utilitaires de mapping
**Nouveau fichier:** `src/common/mappers/event-mappers.ts`

```typescript
import { Sale, SaleStatus } from '@/modules/sales/entities/sale.entity';
import { Expense } from '@/modules/expenses/entities/expense.entity';
import { BusinessOperationEventData, OperationType, OperationStatus } from '@wanzobe/shared/events/message-schemas';

export class EventMappers {
  /**
   * Convertit une Sale en BusinessOperationEventData
   */
  static saleToEventData(sale: Sale): BusinessOperationEventData {
    return {
      id: sale.id,
      type: OperationType.SALE,
      date: sale.date.toISOString(),
      description: this.generateSaleDescription(sale),
      amountCdf: sale.totalAmountInCdf,
      status: this.mapSaleStatus(sale.status),
      companyId: sale.companyId,
      clientId: sale.customerId || undefined,
      createdBy: sale.userId,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      relatedPartyId: sale.customerId,
      relatedPartyName: sale.customerName,
      reference: sale.id,
      notes: sale.notes || undefined,
    };
  }

  /**
   * Convertit une Expense en BusinessOperationEventData
   */
  static expenseToEventData(expense: Expense): BusinessOperationEventData {
    return {
      id: expense.id,
      type: OperationType.EXPENSE,
      date: expense.date.toISOString(),
      description: expense.description || `Dépense ${expense.category}`,
      amountCdf: expense.amountCdf,
      status: OperationStatus.COMPLETED, // Les dépenses sont toujours complétées
      companyId: expense.companyId,
      createdBy: expense.createdBy,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
      relatedPartyId: expense.supplierId || undefined,
      reference: expense.reference || expense.id,
      notes: expense.notes || undefined,
    };
  }

  /**
   * Mappe SaleStatus vers OperationStatus standardisé
   */
  private static mapSaleStatus(status: SaleStatus): OperationStatus {
    switch (status) {
      case SaleStatus.PENDING:
      case SaleStatus.PARTIALLY_PAID:
        return OperationStatus.PENDING;
      case SaleStatus.COMPLETED:
        return OperationStatus.COMPLETED;
      case SaleStatus.CANCELLED:
        return OperationStatus.CANCELLED;
      default:
        return OperationStatus.PENDING;
    }
  }

  /**
   * Génère une description lisible pour une vente
   */
  private static generateSaleDescription(sale: Sale): string {
    const itemCount = sale.items?.length || 0;
    return `Vente ${sale.customerName} - ${itemCount} article${itemCount > 1 ? 's' : ''}`;
  }
}
```

### Phase 2: Intégration dans Sales Service (1 jour)

#### Task 2.1: Injecter EventsService
**Fichier:** `src/modules/sales/sales.service.ts`

```typescript
import { EventsService } from '../events/events.service';
import { EventMappers } from '../../common/mappers/event-mappers';
import { BusinessOperationCreatedEvent } from '@wanzobe/shared/events/commerce-operations';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Sale) private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem) private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @Inject(forwardRef(() => CustomersService)) private readonly customersService: CustomersService,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventsService: EventsService, // ✅ NOUVEAU
  ) {}
  
  // ... reste du code ...
}
```

#### Task 2.2: Publier événement à la création
**Modification:** `sales.service.ts` ligne ~130

```typescript
async create(createSaleDto: CreateSaleDto): Promise<Sale> {
  return this.dataSource.transaction(async (transactionalEntityManager) => {
    // ... logique existante ...
    
    const savedSale = await transactionalEntityManager.save(Sale, newSale);

    if (customerEntity && totalAmountInCdf > 0) {
      await this.customersService.updateTotalPurchases(
        customerEntity.id, 
        totalAmountInCdf, 
        transactionalEntityManager
      );
    }
    
    const resultSale = await transactionalEntityManager.findOne(Sale, { 
      where: { id: savedSale.id }, 
      relations: ['customer', 'items', 'items.product'] 
    });
    
    if (!resultSale) {
      throw new NotFoundException('Failed to retrieve the created sale after saving.');
    }
    
    // ✅ NOUVEAU: Publier événement après commit de la transaction
    // Utilisation de setImmediate pour publier APRÈS la transaction
    setImmediate(async () => {
      try {
        const eventData = EventMappers.saleToEventData(resultSale);
        const event: BusinessOperationCreatedEvent = {
          ...eventData,
          type: eventData.type as any,
          status: eventData.status as any,
          date: new Date(eventData.date),
          createdAt: new Date(eventData.createdAt),
          updatedAt: new Date(eventData.updatedAt),
        };
        
        await this.eventsService.publishBusinessOperationCreated(event);
        this.logger.log(`Published commerce.operation.created for sale ${resultSale.id}`);
      } catch (error) {
        this.logger.error(`Failed to publish event for sale ${resultSale.id}:`, error);
        // Ne pas faire échouer la transaction si la publication échoue
      }
    });
    
    return resultSale;
  });
}
```

#### Task 2.3: Publier événement à l'annulation
**Modification:** `sales.service.ts` ligne ~277

```typescript
async cancelSale(id: string, cancelSaleDto: CancelSaleDto): Promise<Sale> {
  return this.dataSource.transaction(async (transactionalEntityManager) => {
    // ... logique existante d'annulation ...
    
    const cancelledSale = await transactionalEntityManager.save(Sale, sale);
    
    // ✅ NOUVEAU: Publier événement d'annulation
    setImmediate(async () => {
      try {
        const eventData = EventMappers.saleToEventData(cancelledSale);
        const event: BusinessOperationCreatedEvent = {
          ...eventData,
          type: eventData.type as any,
          status: eventData.status as any,
          date: new Date(eventData.date),
          createdAt: new Date(eventData.createdAt),
          updatedAt: new Date(eventData.updatedAt),
        };
        
        await this.eventsService.publishBusinessOperationCreated(event);
        this.logger.log(`Published commerce.operation.created (CANCELLED) for sale ${cancelledSale.id}`);
      } catch (error) {
        this.logger.error(`Failed to publish cancellation event for sale ${cancelledSale.id}:`, error);
      }
    });
    
    return cancelledSale;
  });
}
```

#### Task 2.4: Publier événement à la complétion
**Modification:** `sales.service.ts` ligne ~233

```typescript
async completeSale(id: string, completeSaleDto: CompleteSaleDto): Promise<Sale> {
  return this.dataSource.transaction(async (transactionalEntityManager) => {
    // ... logique existante ...
    
    const completedSale = await transactionalEntityManager.save(Sale, sale);
    
    // ✅ NOUVEAU: Publier événement de complétion
    setImmediate(async () => {
      try {
        const eventData = EventMappers.saleToEventData(completedSale);
        const event: BusinessOperationCreatedEvent = {
          ...eventData,
          type: eventData.type as any,
          status: eventData.status as any,
          date: new Date(eventData.date),
          createdAt: new Date(eventData.createdAt),
          updatedAt: new Date(eventData.updatedAt),
        };
        
        await this.eventsService.publishBusinessOperationCreated(event);
        this.logger.log(`Published commerce.operation.created (COMPLETED) for sale ${completedSale.id}`);
      } catch (error) {
        this.logger.error(`Failed to publish completion event for sale ${completedSale.id}:`, error);
      }
    });
    
    return completedSale;
  });
}
```

### Phase 3: Intégration dans Expenses Service (0.5 jour)

**Fichier:** `src/modules/expenses/expenses.service.ts`

Appliquer le même pattern:
1. Injecter `EventsService`
2. Utiliser `EventMappers.expenseToEventData()`
3. Publier après création/mise à jour

```typescript
async create(createExpenseDto: CreateExpenseDto, companyId: string, userId: string): Promise<Expense> {
  // ... logique existante ...
  const savedExpense = await this.expenseRepository.save(expense);
  
  // ✅ Publier événement
  setImmediate(async () => {
    try {
      const eventData = EventMappers.expenseToEventData(savedExpense);
      const event: BusinessOperationCreatedEvent = {
        ...eventData,
        type: eventData.type as any,
        status: eventData.status as any,
        date: new Date(eventData.date),
        createdAt: new Date(eventData.createdAt),
        updatedAt: new Date(eventData.updatedAt),
      };
      
      await this.eventsService.publishBusinessOperationCreated(event);
    } catch (error) {
      this.logger.error(`Failed to publish event for expense ${savedExpense.id}:`, error);
    }
  });
  
  return savedExpense;
}
```

### Phase 4: Testing & Validation (0.5 jour)

#### Task 4.1: Tests unitaires pour EventMappers
**Nouveau fichier:** `src/common/mappers/__tests__/event-mappers.spec.ts`

```typescript
import { EventMappers } from '../event-mappers';
import { Sale, SaleStatus } from '@/modules/sales/entities/sale.entity';
import { OperationType, OperationStatus } from '@wanzobe/shared/events/message-schemas';

describe('EventMappers', () => {
  describe('saleToEventData', () => {
    it('should map Sale to BusinessOperationEventData correctly', () => {
      const sale: Sale = {
        id: 'sale-123',
        date: new Date('2025-01-15'),
        totalAmountInCdf: 50000,
        status: SaleStatus.COMPLETED,
        customerName: 'Test Customer',
        customerId: 'customer-123',
        companyId: 'company-123',
        userId: 'user-123',
        createdAt: new Date('2025-01-15T10:00:00Z'),
        updatedAt: new Date('2025-01-15T10:00:00Z'),
        items: [{}, {}] as any, // 2 items
      } as Sale;

      const eventData = EventMappers.saleToEventData(sale);

      expect(eventData.id).toBe('sale-123');
      expect(eventData.type).toBe(OperationType.SALE);
      expect(eventData.status).toBe(OperationStatus.COMPLETED);
      expect(eventData.amountCdf).toBe(50000);
      expect(eventData.companyId).toBe('company-123');
      expect(eventData.clientId).toBe('customer-123');
      expect(eventData.description).toContain('2 articles');
    });

    it('should map PENDING status correctly', () => {
      const sale = { status: SaleStatus.PENDING } as Sale;
      const eventData = EventMappers.saleToEventData(sale);
      expect(eventData.status).toBe(OperationStatus.PENDING);
    });

    it('should map CANCELLED status correctly', () => {
      const sale = { status: SaleStatus.CANCELLED } as Sale;
      const eventData = EventMappers.saleToEventData(sale);
      expect(eventData.status).toBe(OperationStatus.CANCELLED);
    });
  });
});
```

#### Task 4.2: Test d'intégration Kafka
**Nouveau fichier:** `test/events/kafka-integration.e2e-spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { SalesService } from '@/modules/sales/sales.service';
import { EventsService } from '@/modules/events/events.service';

describe('Kafka Events Integration (e2e)', () => {
  let salesService: SalesService;
  let eventsService: EventsService;
  let publishSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      // ... setup module ...
    }).compile();

    salesService = module.get(SalesService);
    eventsService = module.get(EventsService);
    publishSpy = jest.spyOn(eventsService, 'publishBusinessOperationCreated');
  });

  it('should publish event when creating a sale', async () => {
    const createSaleDto = {
      date: new Date().toISOString(),
      customerName: 'Test Customer',
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: 10000 }],
      paymentMethod: 'cash',
      exchangeRate: 2000,
    };

    const sale = await salesService.create(createSaleDto);

    // Attendre la publication asynchrone
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: sale.id,
        type: expect.any(String),
        amountCdf: expect.any(Number),
      })
    );
  });
});
```

#### Task 4.3: Monitoring Kafka
**Vérifier dans Grafana/Prometheus:**
- Métrique: `kafka_messages_sent_total{topic="commerce.operation.created"}`
- Vérifier que les messages sont bien envoyés
- Vérifier la consommation par accounting-service

---

## 📊 CRITÈRES DE SUCCÈS

### Metrics cibles (après implémentation)

| Métrique | Avant | Cible | Mesure |
|----------|-------|-------|---------|
| Événements publiés (Sales) | 0% | 100% | Tous les create/cancel/complete |
| Événements publiés (Expenses) | 0% | 100% | Tous les create |
| Conformité schéma | 0% | 100% | Validation message-schemas.ts |
| Erreurs Kafka | N/A | <1% | Taux d'échec de publication |
| Consommation accounting | 0% | 100% | Écritures générées automatiquement |
| Latence publication | N/A | <50ms | Temps de publication |

### Tests de validation

✅ **Test 1: Création de vente**
```bash
# Créer une vente via API
POST /api/v1/sales
{
  "date": "2025-11-18T10:00:00Z",
  "customerName": "Test Client",
  "items": [{"productId": "xxx", "quantity": 2, "unitPrice": 10000}],
  "paymentMethod": "cash",
  "exchangeRate": 2000
}

# Vérifier dans Kafka
kafka-console-consumer --topic commerce.operation.created --from-beginning

# Vérifier dans accounting-service logs
# Devrait voir: "Processing commerce operation event: sale for operation xxx"
```

✅ **Test 2: Annulation de vente**
```bash
# Annuler une vente
PATCH /api/v1/sales/:id/cancel
{ "reason": "Test annulation" }

# Vérifier l'événement avec status: "CANCELLED"
```

✅ **Test 3: Analytics consomme les événements**
```bash
# Vérifier dans analytics-service logs
# Devrait voir: "Processing business operation event: sale for operation xxx"
# Risk score devrait être calculé
```

---

## ⚠️ RISQUES ET MITIGATION

### Risque 1: Migration companyId
**Problème**: Les ventes existantes n'ont pas de companyId  
**Mitigation**:
```sql
-- Migration de backfill
UPDATE sales 
SET company_id = (SELECT company_id FROM users WHERE users.id = sales.user_id)
WHERE company_id IS NULL;
```

### Risque 2: Perte d'événements si Kafka down
**Problème**: Transactions commitées mais événements non publiés  
**Mitigation**:
- Ajouter colonne `sync_status` à Sale/Expense
- Job de réconciliation quotidien pour republier les événements manquants

```typescript
// Nouveau service: SyncReconciliationService
async reconcileMissingSaleEvents() {
  const unsyncedSales = await this.saleRepository.find({
    where: { syncStatus: Not('synced') },
    take: 100,
  });
  
  for (const sale of unsyncedSales) {
    try {
      await this.publishSaleEvent(sale);
      sale.syncStatus = 'synced';
      await this.saleRepository.save(sale);
    } catch (error) {
      this.logger.error(`Failed to sync sale ${sale.id}`, error);
    }
  }
}
```

### Risque 3: Performance impact
**Problème**: Publication Kafka ralentit les transactions  
**Mitigation**:
- Utilisation de `setImmediate()` pour publication asynchrone
- Publication APRÈS commit de transaction (pas de rollback si Kafka fail)
- Monitoring des latences

---

## 📅 TIMELINE

| Phase | Durée | Début | Fin | Responsable |
|-------|-------|-------|-----|-------------|
| Phase 1: Infrastructure | 1 jour | J+0 | J+1 | Backend Team |
| Phase 2: Sales Integration | 1 jour | J+1 | J+2 | Backend Team |
| Phase 3: Expenses Integration | 0.5 jour | J+2 | J+2.5 | Backend Team |
| Phase 4: Testing | 0.5 jour | J+2.5 | J+3 | QA Team |
| **TOTAL** | **3 jours** | **J+0** | **J+3** | - |

---

## 🔗 RÉFÉRENCES

1. **Message Schemas**: `packages/shared/src/events/message-schemas.ts`
2. **Kafka Topics**: `packages/shared/src/events/standard-kafka-topics.ts`
3. **Commerce Events**: `packages/shared/src/events/commerce-operations.ts`
4. **Events Service**: `apps/gestion_commerciale_service/src/modules/events/events.service.ts`
5. **Accounting Consumer**: `apps/accounting-service/src/modules/kafka/kafka-consumer.service.ts`
6. **Analytics Consumer**: `apps/analytics-service/src/modules/kafka-consumer/services/kafka-consumer.service.ts`

---

## 📝 CHECKLIST DE DÉPLOIEMENT

Avant de merger en production:

- [ ] Migration `companyId` exécutée sur les tables sales et expenses
- [ ] EventMappers testé avec 100% de couverture
- [ ] Tests e2e Kafka passent tous
- [ ] Monitoring Kafka configuré (Grafana dashboards)
- [ ] Documentation API mise à jour
- [ ] Accounting-service consomme les événements correctement
- [ ] Analytics-service consomme les événements correctement
- [ ] Job de réconciliation configuré (cron daily)
- [ ] Rollback plan documenté
- [ ] Formation équipe sur le nouveau système d'événements

---

**Status**: 🔴 EN ATTENTE D'IMPLÉMENTATION  
**Prochaine étape**: Validation avec l'équipe architecture + démarrage Phase 1
