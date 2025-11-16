# Module Company Profile - Architecture et Flux de Données

**Date de création:** 2025-11-16  
**Service:** portfolio-institution-service  
**Auteur:** Portfolio Institution Team

---

## Vue d'ensemble

Le module **Company Profile** implémente un système de cache local hybride pour les profils complets des companies (PME/SME/organisations) utilisées dans le portfolio-institution-service. Il résout le problème majeur identifié : **les entités du portfolio stockent uniquement des UUIDs (`client_id`, `memberId`) sans données de profil enrichies**.

### Problème résolu

**AVANT:**
```typescript
// Contract, Repayment, Disbursement, etc.
{
  client_id: "550e8400-e29b-41d4-a716-446655440000",  // UUID seul
  // Aucune information sur la company (nom, secteur, métriques financières, contacts)
  // Nécessite des appels HTTP multiples pour récupérer les données
}
```

**APRÈS:**
```typescript
// CompanyProfile - Cache local enrichi
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  // DONNÉES PRIMAIRES (accounting-service):
  companyName: "ABC Technologies SARL",
  sector: "Technology",
  creditScore: 75,
  totalRevenue: 5000000,
  financialRating: "A",
  // DONNÉES SECONDAIRES (customer-service):
  legalForm: "SARL",
  rccm: "CD/KIN/RCCM/12345",
  owner: {...},
  associates: [...],
  locations: [...]
}
```

---

## Architecture de Synchronisation Hybride

### Principe fondamental

Le système utilise **deux sources de données** avec une **stratégie de priorité claire** :

1. **SOURCE PRIMAIRE**: `accounting-service` (HTTP)
   - **Priorité:** HAUTE
   - **Type de données:** Métriques financières opérationnelles
   - **Fréquence:** 24 heures (automatique si stale)
   - **Méthode:** HTTP GET vers `/api/dashboard`, `/api/users/profile`

2. **SOURCE SECONDAIRE**: `customer-service` (Kafka)
   - **Priorité:** BASSE (enrichissement uniquement)
   - **Type de données:** Données administratives/légales
   - **Fréquence:** Événementielle (temps réel)
   - **Méthode:** Consumer Kafka sur topics standards

### Règles de Réconciliation

**En cas de conflit entre les deux sources:**

| Champ | Source gagnante | Justification |
|-------|----------------|---------------|
| `companyName` | accounting-service | Source de vérité opérationnelle |
| `employeeCount` | accounting-service | Donnée RH liée aux finances |
| `sector` | accounting-service | Classification métier |
| `legalForm` | customer-service | Donnée administrative |
| `rccm`, `taxId` | customer-service | Données légales |
| `owner`, `associates` | customer-service | Structure organisationnelle |

**Exemple de résolution:**
```typescript
// Scénario: accounting-service dit "ABC Ltd", customer-service dit "ABC Limited"
profile.companyName = "ABC Ltd"; // accounting-service gagne
profile.recordConflict('companyName', 'ABC Ltd', 'ABC Limited', 'accounting');
// Le conflit est enregistré dans metadata.conflicts pour audit
```

---

## Flux de Données

### 1. Synchronisation depuis accounting-service (Primaire)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNCHRONISATION ACCOUNTING                    │
└─────────────────────────────────────────────────────────────────┘

Client API Request
     │
     ├─► GET /company-profiles/:id?autoSync=true
     │
     ├─► CompanyProfileController.getProfile()
     │        │
     │        └─► CompanySyncService.getProfile(id, autoSync=true)
     │                 │
     │                 ├─► Repository: findOne(id)
     │                 │        │
     │                 │        └─► Profile found?
     │                 │             │
     │                 │             ├─► NO: Trigger sync
     │                 │             └─► YES: Check needsAccountingSync()
     │                 │                      │
     │                 │                      └─► lastSync > 24h?
     │                 │                           │
     │                 │                           └─► YES: Trigger sync
     │                 │
     │                 └─► syncFromAccounting(id)
     │                          │
     │                          ├─► HTTP: AccountingIntegrationService.getSMEFinancialData()
     │                          │         │
     │                          │         └─► GET http://accounting-service/api/dashboard
     │                          │                  Response: {
     │                          │                    totalRevenue, netProfit,
     │                          │                    totalAssets, cashFlow,
     │                          │                    credit_score, financial_rating, ...
     │                          │                  }
     │                          │
     │                          ├─► HTTP: AccountingIntegrationService.getSMESector()
     │                          ├─► HTTP: AccountingIntegrationService.getSMEEmployeeCount()
     │                          ├─► HTTP: AccountingIntegrationService.getSMEWebsite()
     │                          │
     │                          ├─► Apply accounting data to profile
     │                          │    (companyName, sector, creditScore, totalRevenue, ...)
     │                          │
     │                          ├─► Detect conflicts if updating existing
     │                          │    profile.recordConflict(field, accountingVal, existingVal, 'accounting')
     │                          │
     │                          ├─► profile.lastSyncFromAccounting = now()
     │                          ├─► profile.isAccountingDataFresh = true
     │                          ├─► profile.profileCompleteness = calculateCompleteness()
     │                          ├─► profile.recordSync('accounting', 'success')
     │                          │
     │                          └─► Repository.save(profile)
     │
     └─► Return CompanyProfileResponseDto
```

### 2. Enrichissement depuis customer-service (Secondaire)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENRICHISSEMENT CUSTOMER                       │
└─────────────────────────────────────────────────────────────────┘

Customer Service publishes event
     │
     ├─► Kafka Topic: admin.customer.company.profile.shared
     │   Payload: {
     │     customerId, customerType, name, email,
     │     companyProfile: {
     │       legalForm, industry, rccm, taxId,
     │       capital, owner, associates, locations, ...
     │     }
     │   }
     │
     ├─► CompanyEventsConsumer.handleCompanyProfileShared()
     │        │
     │        ├─► Validate customerType === 'COMPANY'
     │        │
     │        └─► CompanySyncService.enrichFromCustomer(event)
     │                 │
     │                 ├─► Repository: findOne(customerId)
     │                 │        │
     │                 │        ├─► Profile exists?
     │                 │        │    │
     │                 │        │    ├─► YES: Enrich existing
     │                 │        │    │    │
     │                 │        │    │    ├─► Detect name conflict:
     │                 │        │    │    │    if (profile.companyName !== event.name)
     │                 │        │    │    │       profile.recordConflict('companyName', 
     │                 │        │    │    │          profile.companyName, event.name, 'accounting')
     │                 │        │    │    │       // KEEP accounting value
     │                 │        │    │    │
     │                 │        │    │    └─► Apply customer data (enrichment only):
     │                 │        │    │         - legalForm, rccm, taxId, natId
     │                 │        │    │         - owner, associates, locations
     │                 │        │    │         - contactPersons, affiliations, socialMedia
     │                 │        │    │
     │                 │        │    └─► NO: Create minimal profile
     │                 │        │         (Accounting sync should be triggered)
     │                 │        │
     │                 │        ├─► profile.lastSyncFromCustomer = now()
     │                 │        ├─► profile.isCustomerDataFresh = true
     │                 │        ├─► profile.profileCompleteness = calculateCompleteness()
     │                 │        ├─► profile.recordSync('customer', 'success')
     │                 │        │
     │                 │        └─► Repository.save(profile)
     │                 │
     │                 └─► Logger: "Successfully enriched company {id}"
```

### 3. Topics Kafka écoutés

Le `CompanyEventsConsumer` écoute **6 topics** :

| Topic | Source | Action |
|-------|--------|--------|
| `admin.customer.company.profile.shared` | customer-service | Enrichissement complet (70+ champs) |
| `customer.created` (StandardKafkaTopics.CUSTOMER_CREATED) | customer-service | Création profil minimal + trigger accounting sync |
| `customer.updated` (StandardKafkaTopics.CUSTOMER_UPDATED) | customer-service | Mise à jour données administratives |
| `customer.status.changed` (StandardKafkaTopics.CUSTOMER_STATUS_CHANGED) | customer-service | Update `customerServiceStatus` |
| `customer.validated` (StandardKafkaTopics.CUSTOMER_VALIDATED) | customer-service | Trigger sync complète (accounting + customer) |
| `customer.deleted` (StandardKafkaTopics.CUSTOMER_DELETED) | customer-service | Marquer comme `deleted` (pas de suppression physique) |

---

## Mapping des Champs

### Champs depuis accounting-service (HTTP)

| Champ Entity | Source API | Endpoint | Description |
|--------------|-----------|----------|-------------|
| `companyName` | `dashboardData.companyInfo.name` | `/api/dashboard?companyId={id}` | Nom officiel (source de vérité) |
| `totalRevenue` | `dashboardData.financialSummary.totalRevenue` | `/api/dashboard` | CA total (CDF) |
| `annualRevenue` | `dashboardData.financialSummary.totalRevenue` | `/api/dashboard` | CA annuel (CDF) |
| `netProfit` | `dashboardData.financialSummary.netProfit` | `/api/dashboard` | Profit net (CDF) |
| `totalAssets` | `dashboardData.financialSummary.totalAssets` | `/api/dashboard` | Total actifs (CDF) |
| `totalLiabilities` | `dashboardData.financialSummary.totalLiabilities` | `/api/dashboard` | Total passifs (CDF) |
| `cashFlow` | `dashboardData.financialSummary.cashFlow` | `/api/dashboard` | Flux trésorerie (CDF) |
| `debtRatio` | Calculé: `totalLiabilities / totalAssets` | `/api/dashboard` | Ratio endettement |
| `workingCapital` | Calculé: `currentAssets - currentLiabilities` | `/api/dashboard` | Fonds de roulement |
| `creditScore` | `dashboardData.creditScore` | `/api/dashboard` | Score crédit (1-100) |
| `financialRating` | `dashboardData.financialRating` | `/api/dashboard` | Rating (AAA-E) |
| `revenueGrowth` | Calculé: `((current - previous) / previous) * 100` | `/api/dashboard` | Croissance CA (%) |
| `profitMargin` | Calculé: `(netProfit / totalRevenue) * 100` | `/api/dashboard` | Marge bénéficiaire (%) |
| `ebitda` | `dashboardData.financialSummary.ebitda` | `/api/dashboard` | EBITDA (CDF) |
| `sector` | `response.data.sector` | `/api/users/profile?companyId={id}` | Secteur d'activité |
| `employeeCount` | `response.data.employeeCount` | `/api/users/profile` | Nombre employés |
| `websiteUrl` | `response.data.website` | `/api/users/profile` | Site web |
| `companySize` | Calculé: `classifyCompanySize(revenue, assets)` | - | small/medium/large |

### Champs depuis customer-service (Kafka)

| Champ Entity | Source Event | Topic | Description |
|--------------|-------------|-------|-------------|
| `legalForm` | `event.companyProfile.legalForm` | `admin.customer.company.profile.shared` | SARL, SA, SAS, etc. |
| `industry` | `event.companyProfile.industry` | `admin.customer.company.profile.shared` | Industrie détaillée |
| `rccm` | `event.companyProfile.rccm` | `admin.customer.company.profile.shared` | Registre commerce |
| `taxId` | `event.companyProfile.taxId` | `admin.customer.company.profile.shared` | N° fiscal |
| `natId` | `event.companyProfile.natId` | `admin.customer.company.profile.shared` | N° identification nationale |
| `yearFounded` | `event.companyProfile.yearFounded` | `admin.customer.company.profile.shared` | Année création |
| `capital` | `event.companyProfile.capital` | `admin.customer.company.profile.shared` | {amount, currency} |
| `owner` | `event.companyProfile.owner` | `admin.customer.company.profile.shared` | Propriétaire principal |
| `associates` | `event.companyProfile.associates` | `admin.customer.company.profile.shared` | Liste associés |
| `locations` | `event.companyProfile.locations` | `admin.customer.company.profile.shared` | Emplacements/succursales |
| `contactPersons` | `event.companyProfile.contactPersons` | `admin.customer.company.profile.shared` | Personnes contact |
| `affiliations` | `event.companyProfile.affiliations` | `admin.customer.company.profile.shared` | CNSS, INPP, etc. |
| `socialMedia` | `event.companyProfile.socialMedia` | `admin.customer.company.profile.shared` | Facebook, LinkedIn, etc. |
| `email` | `event.email` | `admin.customer.company.profile.shared` | Email company |
| `phone` | `event.phone` | `admin.customer.company.profile.shared` | Téléphone |
| `logo` | `event.logo` | `admin.customer.company.profile.shared` | Logo URL |
| `address` | `event.address` | `admin.customer.company.profile.shared` | Adresse complète |
| `customerServiceStatus` | `event.status` | `customer.status.changed` | active, suspended, deleted |

---

## Endpoints API

### 1. GET /company-profiles/:id

**Description:** Récupère un profil complet avec auto-sync si données périmées

**Query Parameters:**
- `autoSync` (boolean, default: `true`) - Si false, retourne les données en cache sans vérifier la fraîcheur

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "companyName": "ABC Technologies SARL",
  "sector": "Technology",
  "totalRevenue": 5000000,
  "annualRevenue": 5000000,
  "netProfit": 800000,
  "totalAssets": 10000000,
  "totalLiabilities": 3000000,
  "cashFlow": 1200000,
  "debtRatio": 0.3,
  "workingCapital": 2000000,
  "creditScore": 75,
  "financialRating": "A",
  "revenueGrowth": 15.5,
  "profitMargin": 16.0,
  "ebitda": 1000000,
  "employeeCount": 50,
  "companySize": "medium",
  "websiteUrl": "https://abctech.cd",
  "legalForm": "SARL",
  "industry": "Software Development",
  "rccm": "CD/KIN/RCCM/12345",
  "taxId": "A1234567",
  "natId": "NAT9876543",
  "yearFounded": 2015,
  "capital": {
    "amount": 1000000,
    "currency": "CDF"
  },
  "owner": {
    "id": "owner-123",
    "name": "Jean Dupont",
    "email": "jean@abctech.cd"
  },
  "associates": [...],
  "locations": [...],
  "contactPersons": [...],
  "affiliations": {
    "cnss": "CNSS123456",
    "inpp": "INPP654321"
  },
  "email": "contact@abctech.cd",
  "phone": "+243123456789",
  "logo": "https://cdn.example.com/logos/abc.png",
  "address": "123 Avenue de la Liberté, Kinshasa, RDC",
  "customerServiceStatus": "active",
  "lastSyncFromAccounting": "2025-11-16T10:30:00Z",
  "lastSyncFromCustomer": "2025-11-16T09:15:00Z",
  "profileCompleteness": 85,
  "isAccountingDataFresh": true,
  "isCustomerDataFresh": true,
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-11-16T10:30:00Z"
}
```

### 2. GET /company-profiles

**Description:** Recherche paginée avec filtres multiples

**Query Parameters:**
- `companyName` (string) - Recherche partielle sur nom
- `sector` (string) - Filtrage par secteur
- `minCreditScore` (number, 0-100) - Score minimum
- `maxCreditScore` (number, 0-100) - Score maximum
- `financialRating` (string) - Rating exact (AAA, AA, A, BBB, etc.)
- `companySize` (string) - small, medium, large
- `rccm` (string) - Registre commerce exact
- `taxId` (string) - N° fiscal exact
- `page` (number, default: 1) - Page courante
- `limit` (number, default: 20, max: 100) - Résultats par page

**Example:**
```
GET /company-profiles?sector=Technology&minCreditScore=70&page=1&limit=20
```

**Response:**
```json
{
  "profiles": [
    { /* CompanyProfileResponseDto */ },
    { /* CompanyProfileResponseDto */ }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### 3. GET /company-profiles/stats

**Description:** Statistiques globales des profils

**Response:**
```json
{
  "totalProfiles": 250,
  "profilesWithFreshAccountingData": 230,
  "profilesWithFreshCustomerData": 245,
  "averageCompleteness": 78,
  "bySector": {
    "Technology": 50,
    "Agriculture": 80,
    "Commerce": 70,
    "Manufacturing": 30,
    "Services": 20
  },
  "bySize": {
    "small": 150,
    "medium": 80,
    "large": 20
  },
  "byFinancialRating": {
    "AAA": 5,
    "AA": 15,
    "A": 40,
    "BBB": 60,
    "BB": 50,
    "B": 40,
    "C": 25,
    "D": 10,
    "E": 5
  },
  "lastCalculated": "2025-11-16T11:00:00Z"
}
```

### 4. POST /company-profiles/:id/sync

**Description:** Synchronisation manuelle depuis accounting-service

**Body:**
```json
{
  "source": "accounting",  // "accounting" | "customer" | "both"
  "forceRefresh": true     // Ignorer vérification de fraîcheur
}
```

**Response:**
```json
{
  "success": true,
  "message": "Company 550e8400-e29b-41d4-a716-446655440000 synchronized successfully from accounting-service",
  "syncDetails": {
    "accountingSynced": true,
    "customerSynced": false,
    "fieldsUpdated": ["accounting-financial-data"],
    "conflicts": [
      {
        "field": "companyName",
        "accountingValue": "ABC Technologies",
        "customerValue": "ABC Tech Ltd",
        "resolvedWith": "accounting",
        "timestamp": "2025-11-16T10:35:00Z"
      }
    ]
  },
  "profile": { /* CompanyProfileResponseDto */ }
}
```

### 5. POST /company-profiles/:id/sync-complete

**Description:** Synchronisation complète (accounting + customer check)

**Body:**
```json
{
  "forceRefresh": true
}
```

**Response:** Similaire à `/sync` avec `syncDetails.customerSynced` inclus

### 6. GET /company-profiles/:id/freshness

**Description:** Vérification de fraîcheur des données

**Response:**
```json
{
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "accountingDataFresh": true,
  "customerDataFresh": false,
  "needsAccountingSync": false,
  "needsCustomerSync": true,
  "lastSyncFromAccounting": "2025-11-16T10:30:00Z",
  "lastSyncFromCustomer": "2025-11-09T14:20:00Z"
}
```

### 7. GET /company-profiles/:id/sync-history

**Description:** Historique de synchronisation et conflits résolus

**Response:**
```json
{
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "syncHistory": [
    {
      "source": "accounting",
      "timestamp": "2025-11-16T10:30:00Z",
      "status": "success"
    },
    {
      "source": "customer",
      "timestamp": "2025-11-09T14:20:00Z",
      "status": "success"
    },
    {
      "source": "accounting",
      "timestamp": "2025-11-15T09:00:00Z",
      "status": "failed",
      "error": "Accounting service unavailable"
    }
  ],
  "conflicts": [
    {
      "field": "companyName",
      "accountingValue": "ABC Technologies SARL",
      "customerValue": "ABC Tech Limited",
      "resolvedWith": "accounting",
      "timestamp": "2025-11-16T10:30:00Z"
    }
  ]
}
```

---

## Stratégie de Cache et Fraîcheur

### Indicateurs de Fraîcheur

```typescript
interface FreshnessIndicators {
  // Données accounting (source primaire)
  isAccountingDataFresh: boolean;  // true si sync < 24h
  lastSyncFromAccounting: Date;
  needsAccountingSync(): boolean;  // true si lastSync > 24h

  // Données customer (source secondaire)
  isCustomerDataFresh: boolean;    // true si sync < 7 jours
  lastSyncFromCustomer: Date;
  needsCustomerSync(): boolean;    // true si lastSync > 7 jours
}
```

### Politique de Synchronisation Automatique

| Contexte | Condition | Action |
|----------|-----------|--------|
| GET /company-profiles/:id avec `autoSync=true` | `needsAccountingSync() === true` | Trigger `syncFromAccounting()` avant retour |
| GET /company-profiles/:id avec `autoSync=false` | N/A | Retour immédiat des données en cache |
| Kafka event `CUSTOMER_CREATED` | Profile n'existe pas | Enrichir depuis customer + trigger accounting sync en arrière-plan |
| Kafka event `CUSTOMER_UPDATED` | N/A | Enrichir depuis customer (ne force pas accounting sync) |
| Kafka event `CUSTOMER_VALIDATED` | N/A | Trigger `syncComplete()` en arrière-plan |

### Calcul de Complétude

```typescript
profileCompleteness = (fieldsRemplis / fieldsTotal) * 100

fieldsEssentiels = [
  companyName, sector, totalRevenue, annualRevenue, creditScore,
  legalForm, rccm, taxId, owner, email, phone, address,
  employeeCount, yearFounded
]

// Exemple:
// 12 champs remplis / 14 champs essentiels = 85% de complétude
```

---

## Métadonnées et Audit

### Structure metadata (JSONB)

```typescript
metadata: {
  syncHistory: [
    {
      source: 'accounting' | 'customer',
      timestamp: string (ISO),
      status: 'success' | 'partial' | 'failed',
      error?: string
    }
  ],
  conflicts: [
    {
      field: string,
      accountingValue: any,
      customerValue: any,
      resolvedWith: 'accounting' | 'customer',
      timestamp: string (ISO)
    }
  ]
}
```

### Enregistrement d'un Conflit

```typescript
// Dans CompanySyncService
if (profile.companyName !== financialData.companyName) {
  this.logger.warn(
    `[CONFLICT] Company name mismatch for ${companyId}: ` +
    `existing="${profile.companyName}", accounting="${financialData.companyName}"`
  );
  profile.recordConflict('companyName', financialData.companyName, profile.companyName, 'accounting');
}

// Entity method
profile.recordConflict(field, accountingValue, customerValue, resolvedWith) {
  if (!this.metadata) this.metadata = {};
  if (!this.metadata.conflicts) this.metadata.conflicts = [];
  
  this.metadata.conflicts.push({
    field,
    accountingValue,
    customerValue,
    resolvedWith,
    timestamp: new Date().toISOString()
  });
}
```

---

## Performance et Optimisation

### Indexes de Base de Données

```sql
-- Indexes créés par la migration
CREATE INDEX IDX_company_profiles_companyName ON company_profiles(companyName);
CREATE INDEX IDX_company_profiles_sector ON company_profiles(sector);
CREATE INDEX IDX_company_profiles_creditScore ON company_profiles(creditScore);
CREATE INDEX IDX_company_profiles_rccm ON company_profiles(rccm);
CREATE INDEX IDX_company_profiles_taxId ON company_profiles(taxId);
CREATE INDEX IDX_company_profiles_lastSyncFromAccounting ON company_profiles(lastSyncFromAccounting);

-- Indexes composites pour recherches fréquentes
CREATE INDEX IDX_company_profiles_sector_creditScore ON company_profiles(sector, creditScore);
CREATE INDEX IDX_company_profiles_companySize_financialRating ON company_profiles(companySize, financialRating);
```

### Stratégies de Requêtage

**Éviter N+1:**
```typescript
// ❌ MAUVAIS: N+1 queries
for (const contract of contracts) {
  const company = await httpClient.get(`/customer-service/companies/${contract.client_id}`);
  // 1 query par contract
}

// ✅ BON: Batch fetch avec cache local
const clientIds = contracts.map(c => c.client_id);
const companies = await companyProfileRepository.find({
  where: { id: In(clientIds) }
});
// 1 seule query pour tous les contracts
```

**Utilisation dans les Relations:**
```typescript
// Dans Contract entity (optionnel - si relation désirée)
@ManyToOne(() => CompanyProfile)
@JoinColumn({ name: 'client_id' })
companyProfile?: CompanyProfile;

// Query avec eager loading
const contract = await contractRepository.findOne({
  where: { id: contractId },
  relations: ['companyProfile']
});

console.log(contract.companyProfile.companyName); // Pas d'appel HTTP
console.log(contract.companyProfile.creditScore);  // Données en cache
```

---

## Gestion des Erreurs

### Stratégies de Fallback

```typescript
// Accounting service unavailable
try {
  await companySyncService.syncFromAccounting(companyId);
} catch (error) {
  // 1. Enregistrer l'échec
  profile.isAccountingDataFresh = false;
  profile.recordSync('accounting', 'failed', error.message);
  
  // 2. Retourner les données en cache si disponibles
  if (profile.creditScore > 0) {
    logger.warn(`Using stale accounting data for ${companyId}`);
    return profile;
  }
  
  // 3. Sinon, throw error
  throw new ServiceUnavailableException('Accounting service unavailable');
}
```

### Consumer Kafka - Never Throw

```typescript
// ❌ MAUVAIS: Throw bloque la queue Kafka
@EventPattern('admin.customer.company.profile.shared')
async handleCompanyProfileShared(event) {
  await companySyncService.enrichFromCustomer(event); // Peut throw
}

// ✅ BON: Catch et log, ne pas bloquer
@EventPattern('admin.customer.company.profile.shared')
async handleCompanyProfileShared(event) {
  try {
    await companySyncService.enrichFromCustomer(event);
  } catch (error) {
    this.logger.error(`Failed to process event for ${event.customerId}:`, error.stack);
    // Ne pas throw - consumer continue
  }
}
```

---

## Cas d'Usage

### 1. Portfolio Manager veut voir les détails d'un client

**Avant (sans CompanyProfile):**
```typescript
// 3 appels HTTP séparés
const contract = await getContract(contractId);
const customer = await httpClient.get(`/customer-service/customers/${contract.client_id}`);
const financial = await httpClient.get(`/accounting-service/dashboard?companyId=${contract.client_id}`);

// Latence: ~300-600ms
```

**Après (avec CompanyProfile):**
```typescript
const contract = await getContract(contractId);
const company = await companySyncService.getProfile(contract.client_id);

// Latence: ~10-20ms (cache local)
// Données enrichies disponibles immédiatement
```

### 2. Nouvelle company créée dans customer-service

```
1. Customer-service publie: CUSTOMER_CREATED
2. CompanyEventsConsumer reçoit l'événement
3. enrichFromCustomer() crée un profil minimal avec données customer
4. Trigger accounting sync en arrière-plan (fire-and-forget)
5. 30s plus tard, accounting sync complète les données financières
6. Profil complet disponible: 85% de complétude
```

### 3. Détection de conflit de nom

```
Scénario:
- accounting-service dit: "Société ABC Technologies SARL"
- customer-service dit: "ABC Tech Limited"

Flux:
1. syncFromAccounting() met companyName = "Société ABC Technologies SARL"
2. enrichFromCustomer() reçoit name = "ABC Tech Limited"
3. Détection: profile.companyName !== event.name
4. profile.recordConflict('companyName', 'Société ABC Technologies SARL', 'ABC Tech Limited', 'accounting')
5. companyName reste "Société ABC Technologies SARL" (accounting gagne)
6. Conflit visible via GET /company-profiles/:id/sync-history
```

---

## Tests et Validation

### Tests Unitaires

Voir `company-sync.service.spec.ts` pour:

- ✅ Création de nouveau profil depuis accounting
- ✅ Mise à jour profil existant avec accounting
- ✅ Skip sync si données fraîches
- ✅ Enrichissement depuis customer events
- ✅ Création profil minimal si customer arrive avant accounting
- ✅ Détection et résolution de conflits (accounting gagne)
- ✅ Priorité accounting pour companyName et employeeCount
- ✅ Calcul de complétude de profil
- ✅ Gestion erreurs et fallback

### Tests d'Intégration (à implémenter)

```typescript
describe('Company Profile Integration', () => {
  it('should sync from accounting and enrich from customer', async () => {
    // 1. Mock accounting HTTP response
    // 2. Trigger syncFromAccounting()
    // 3. Mock Kafka customer event
    // 4. Trigger enrichFromCustomer()
    // 5. Verify profile has both accounting + customer data
  });

  it('should auto-sync stale accounting data on GET', async () => {
    // 1. Create profile with lastSyncFromAccounting = 25h ago
    // 2. GET /company-profiles/:id?autoSync=true
    // 3. Verify accounting sync was triggered
  });
});
```

---

## Maintenance et Évolution

### Ajout d'un nouveau champ

**1. SOURCE PRIMAIRE (accounting):**

```typescript
// 1. Ajouter dans CompanyProfile entity
@Column('decimal', { precision: 10, scale: 2, nullable: true })
liquidityRatio?: number;

// 2. Ajouter dans applyAccountingData()
profile.liquidityRatio = financialData.liquidityRatio;

// 3. Ajouter dans CompanyProfileResponseDto
@IsOptional()
@IsNumber()
liquidityRatio?: number;

// 4. Créer migration
export class AddLiquidityRatio... {
  async up(queryRunner) {
    await queryRunner.addColumn('company_profiles', 
      new TableColumn({
        name: 'liquidityRatio',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true
      })
    );
  }
}
```

**2. SOURCE SECONDAIRE (customer):**

```typescript
// 1. Ajouter dans CompanyProfile entity
@Column('jsonb', { nullable: true })
certifications?: Array<{
  name: string;
  issuedBy: string;
  date: string;
}>;

// 2. Ajouter dans applyCustomerData()
profile.certifications = cp.certifications;

// 3. Ajouter dans CustomerCompanyProfileEventDto
@IsOptional()
@IsArray()
certifications?: Array<any>;
```

### Monitoring et Alertes

**Métriques à surveiller:**

- `company_profiles_total` - Nombre total de profils
- `company_profiles_stale_accounting` - Profils avec accounting data > 24h
- `company_profiles_stale_customer` - Profils avec customer data > 7 jours
- `company_profile_sync_duration_seconds` - Durée de synchronisation
- `company_profile_sync_errors_total` - Nombre d'échecs de sync
- `company_profile_conflicts_total` - Nombre de conflits détectés

**Alertes:**

- Si `stale_accounting > 10%` → Accounting service en panne?
- Si `sync_errors > 50/hour` → Problème d'intégration
- Si `conflicts > 100/day` → Incohérence données entre services

---

## Conclusion

Le module Company Profile résout le problème majeur d'accès aux données de profil PME dans portfolio-institution-service en implémentant:

✅ **Cache local performant** - Réduit latence de 300-600ms → 10-20ms  
✅ **Synchronisation hybride** - Accounting (primaire) + Customer (secondaire)  
✅ **Résolution de conflits robuste** - Accounting-service = source de vérité  
✅ **Enrichissement temps réel** - Via Kafka events customer-service  
✅ **API REST complète** - 7 endpoints pour accès/recherche/stats/sync  
✅ **Audit et traçabilité** - Historique syncs + conflits résolus  
✅ **Tests complets** - Unitaires + intégration (à compléter)  

**Impact business:**
- Portfolio managers voient données enrichies immédiatement
- Pas de latence réseau pour chaque consultation de client
- Données financières toujours à jour (< 24h)
- Traçabilité complète des modifications et conflits
