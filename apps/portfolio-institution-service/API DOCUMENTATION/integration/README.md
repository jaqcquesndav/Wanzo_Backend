# Intégration et Compatibilité Inter-Services

Documentation de l'intégration entre les services Gestion Commerciale et Portfolio Institution.

## Vue d'ensemble

Le service Portfolio Institution s'intègre avec le service Gestion Commerciale pour assurer une synchronisation bidirectionnelle des demandes de financement.

## Architecture

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  Gestion Commerciale        │         │  Portfolio Institution       │
│                             │         │                              │
│  FinancingRecord            │◄───────►│  CreditRequest              │
│  (8 statuts)                │  Kafka  │  (14 statuts)               │
│                             │         │                              │
└─────────────────────────────┘         └──────────────────────────────┘
```

## Mappings de Statuts

### Gestion Commerciale → Portfolio Institution

| Statut GC | Statut PI | Description |
|-----------|-----------|-------------|
| `PENDING` | `PENDING` | En attente d'analyse |
| `UNDER_REVIEW` | `UNDER_REVIEW` | En cours d'examen |
| `APPROVED` | `APPROVED` | Approuvée |
| `REJECTED` | `REJECTED` | Rejetée |
| `DISBURSED` | `DISBURSED` | Décaissée |
| `ACTIVE` | `ACTIVE` | Active |
| `CLOSED` | `CLOSED` | Fermée |
| `DEFAULTED` | `DEFAULTED` | En défaut |

### Portfolio Institution → Gestion Commerciale

| Statut PI | Statut GC | Description |
|-----------|-----------|-------------|
| `DRAFT` | `PENDING` | Brouillon → En attente |
| `SUBMITTED` | `UNDER_REVIEW` | Soumise → En examen |
| `UNDER_REVIEW` | `UNDER_REVIEW` | En revue |
| `PENDING` | `PENDING` | En attente |
| `ANALYSIS` | `UNDER_REVIEW` | En analyse → En examen |
| `APPROVED` | `APPROVED` | Approuvée |
| `REJECTED` | `REJECTED` | Rejetée |
| `CANCELED` | `REJECTED` | Annulée → Rejetée |
| `DISBURSED` | `DISBURSED` | Décaissée |
| `ACTIVE` | `ACTIVE` | Active |
| `CLOSED` | `CLOSED` | Fermée |

## Synchronisation des Données

### Structure de Synchronisation

```typescript
interface SyncFinancingRequestDto {
  sourceRequestId: string;        // ID dans gestion_commerciale
  userId: string;                 // ID du client
  portfolioId: string;            // ID du portefeuille
  productId?: string;             // ID du produit financier
  amount: number;                 // Montant demandé
  currency: string;               // Devise
  term: number;                   // Durée en mois
  purpose: string;                // Objet du financement
  status: string;                 // Statut GC
  applicationDate?: Date;         // Date de demande
  businessInformation?: any;      // Infos commerciales
  financialInformation?: any;     // Infos financières
  creditScore?: any;              // Score de crédit
}
```

### Endpoint de Synchronisation

**POST** `/portfolio/api/v1/integration/sync-from-gc`

**Corps de la requête** :

```json
{
  "sourceRequestId": "FR-GC-00123",
  "userId": "client-456",
  "portfolioId": "portfolio-789",
  "amount": 50000,
  "currency": "XOF",
  "term": 12,
  "purpose": "Expansion commerciale",
  "status": "PENDING",
  "applicationDate": "2025-11-16T10:00:00.000Z",
  "businessInformation": {
    "companyName": "ABC SARL",
    "sector": "Commerce"
  },
  "financialInformation": {
    "annualRevenue": 120000,
    "monthlyExpenses": 8000
  }
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "credit-req-001",
  "memberId": "client-456",
  "portfolioId": "portfolio-789",
  "requestAmount": 50000,
  "currency": "XOF",
  "status": "PENDING",
  "metadata": {
    "sourceRequestId": "FR-GC-00123",
    "syncedFrom": "gestion_commerciale",
    "firstSyncAt": "2025-11-16T10:05:00.000Z",
    "lastSyncAt": "2025-11-16T10:05:00.000Z"
  },
  "createdAt": "2025-11-16T10:05:00.000Z"
}
```

## Événements Kafka

### FundingRequestStatusChangedEvent

Publié lors du changement de statut d'une demande de crédit.

**Topic** : `funding.request.status.changed`

**Structure** :

```typescript
interface FundingRequestStatusChangedEvent {
  id: string;                    // ID de la demande
  requestNumber: string;         // Numéro de référence
  portfolioId: string;           // ID du portefeuille
  clientId: string;              // ID du client
  oldStatus: string;             // Ancien statut
  newStatus: string;             // Nouveau statut
  changeDate: Date;              // Date du changement
  changedBy?: string;            // Utilisateur ayant effectué le changement
  amount: number;                // Montant de la demande
  currency: string;              // Devise
}
```

**Exemple** :

```json
{
  "id": "credit-req-001",
  "requestNumber": "CR-A1B2C3D4",
  "portfolioId": "portfolio-789",
  "clientId": "client-456",
  "oldStatus": "PENDING",
  "newStatus": "APPROVED",
  "changeDate": "2025-11-16T14:30:00.000Z",
  "changedBy": "manager-123",
  "amount": 50000,
  "currency": "XOF"
}
```

## Validation des Données

Le service de compatibilité effectue une validation complète des données avant synchronisation :

- ✅ Vérification de la présence des champs obligatoires
- ✅ Validation du format du montant (> 0)
- ✅ Validation de la durée (> 0)
- ✅ Mapping automatique des statuts
- ✅ Enrichissement avec métadonnées de synchronisation

## Statistiques de Synchronisation

**GET** `/portfolio/api/v1/integration/sync-stats`

**Réponse** :

```json
{
  "totalSynced": 145,
  "successfulSyncs": 142,
  "failedSyncs": 3,
  "lastSyncDate": "2025-11-16T14:30:00.000Z",
  "syncsByStatus": {
    "PENDING": 25,
    "APPROVED": 85,
    "REJECTED": 15,
    "ACTIVE": 17
  }
}
```

## Gestion des Erreurs

| Code | Erreur | Description |
|------|--------|-------------|
| 400 | INVALID_SYNC_DATA | Données de synchronisation invalides |
| 404 | PORTFOLIO_NOT_FOUND | Portefeuille non trouvé |
| 409 | DUPLICATE_SOURCE_REQUEST | Demande déjà synchronisée |
| 500 | SYNC_FAILED | Échec de la synchronisation |

## Transactions

Toutes les opérations de synchronisation utilisent des transactions ACID avec :

- **Isolation** : READ COMMITTED
- **Verrous** : Pessimistes sur les demandes de crédit
- **Rollback** : Automatique en cas d'erreur
- **Événements Kafka** : Inclus dans la transaction

---

*Documentation créée le 16 novembre 2025*
