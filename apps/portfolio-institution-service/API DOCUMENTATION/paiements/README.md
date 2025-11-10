# Paiements - Documentation API

Ce document décrit les endpoints pour la gestion des ordres de paiement généraux dans l'API Wanzo Portfolio Institution basés sur le PaymentOrderController réellement implémenté.

> **Scope** : Ordres de paiement génériques pour tous types de financement (crédit, leasing, investissement).  
> **Usage** : Gestion complète du cycle de vie des ordres de paiement avec workflow d'approbation.  
> **Distinction** : Différent des remboursements de portefeuille qui concernent les encaissements.

## Endpoints des ordres de paiement

### Liste des ordres de paiement

Récupère tous les ordres de paiement avec pagination et filtrage.

**Endpoint** : `GET /payments`

**Paramètres de requête** :
- `page` (optionnel, défaut: 1) : Numéro de page
- `limit` (optionnel, défaut: 10) : Nombre d'éléments par page
- `status` (optionnel) : Filtre par statut (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
- `fundingType` (optionnel) : Filtre par type de financement (CREDIT, LEASING, INVESTMENT)
- `portfolioId` (optionnel) : Filtre par identifiant de portefeuille
- `contractReference` (optionnel) : Filtre par référence de contrat

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "payment-123",
      "reference": "PAY-2025-001",
      "fundingType": "CREDIT",
      "status": "COMPLETED",
      "amount": 5000000.00,
      "currency": "CDF",
      "portfolioId": "portfolio-456",
      "contractReference": "CONT-2025-001",
      "beneficiary": {
        "name": "ABC Corporation",
        "accountNumber": "1234567890",
        "bankName": "Banque Centrale",
        "bankCode": "BC001"
      },
      "createdBy": {
        "id": "user-789",
        "name": "Jean Dupont"
      },
      "createdAt": "2025-11-10T08:00:00.000Z",
      "processedAt": "2025-11-10T09:30:00.000Z",
      "completedAt": "2025-11-10T10:15:00.000Z"
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "limit": 10,
    "totalPages": 16
  }
}
```

### Détails d'un ordre de paiement

Récupère les détails complets d'un ordre de paiement spécifique.

**Endpoint** : `GET /payments/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'ordre de paiement

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "payment-123",
    "reference": "PAY-2025-001",
    "fundingType": "CREDIT",
    "status": "COMPLETED",
    "amount": 5000000.00,
    "currency": "CDF",
    "portfolioId": "portfolio-456",
    "contractReference": "CONT-2025-001",
    "description": "Déboursement initial crédit PME",
    "beneficiary": {
      "name": "ABC Corporation",
      "accountNumber": "1234567890",
      "bankName": "Banque Centrale",
      "bankCode": "BC001",
      "address": "123 Avenue de la République, Kinshasa"
    },
    "paymentMethod": "BANK_TRANSFER",
    "executionDate": "2025-11-10T09:00:00.000Z",
    "statusHistory": [
      {
        "status": "PENDING",
        "timestamp": "2025-11-10T08:00:00.000Z",
        "actor": "user-789",
        "notes": "Order created"
      },
      {
        "status": "COMPLETED",
        "timestamp": "2025-11-10T10:15:00.000Z",
        "actor": "system",
        "notes": "Payment confirmed by bank"
      }
    ],
    "createdAt": "2025-11-10T08:00:00.000Z",
    "updatedAt": "2025-11-10T10:15:00.000Z"
  }
}
```

### Création d'un ordre de paiement

Crée un nouvel ordre de paiement.

**Endpoint** : `POST /payments`

**Corps de la requête** :

```json
{
  "fundingType": "CREDIT",
  "amount": 7500000.00,
  "currency": "CDF",
  "portfolioId": "portfolio-456",
  "contractReference": "CONT-2025-004",
  "description": "Deuxième tranche crédit équipement",
  "beneficiary": {
    "name": "DEF Industries",
    "accountNumber": "5555666777",
    "bankName": "Banque du Commerce",
    "bankCode": "BDC003"
  },
  "paymentMethod": "BANK_TRANSFER",
  "executionDate": "2025-11-12T09:00:00.000Z"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "payment-125",
    "reference": "PAY-2025-003",
    "fundingType": "CREDIT",
    "status": "PENDING",
    "amount": 7500000.00,
    "currency": "CDF",
    "portfolioId": "portfolio-456",
    "contractReference": "CONT-2025-004",
    "description": "Deuxième tranche crédit équipement",
    "beneficiary": {
      "name": "DEF Industries",
      "accountNumber": "5555666777",
      "bankName": "Banque du Commerce",
      "bankCode": "BDC003"
    },
    "paymentMethod": "BANK_TRANSFER",
    "executionDate": "2025-11-12T09:00:00.000Z",
    "createdAt": "2025-11-10T16:30:00.000Z"
  },
  "message": "Payment order created successfully"
}
```

### Mise à jour d'un ordre de paiement

Met à jour un ordre de paiement existant (uniquement si en statut PENDING).

**Endpoint** : `PUT /payments/{id}`

**Corps de la requête** :

```json
{
  "amount": 8000000.00,
  "executionDate": "2025-11-13T09:00:00.000Z",
  "description": "Deuxième tranche crédit équipement - montant ajusté"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "payment-125",
    "reference": "PAY-2025-003",
    "status": "PENDING",
    "amount": 8000000.00,
    "executionDate": "2025-11-13T09:00:00.000Z",
    "description": "Deuxième tranche crédit équipement - montant ajusté",
    "updatedAt": "2025-11-10T17:00:00.000Z"
  },
  "message": "Payment order updated successfully"
}
```

### Mise à jour du statut d'un ordre de paiement

Change le statut d'un ordre de paiement avec traçabilité.

**Endpoint** : `PUT /payments/{id}/status`

**Corps de la requête** :

```json
{
  "status": "PROCESSING",
  "notes": "Validation effectuée, envoi vers la banque"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "payment-125",
    "reference": "PAY-2025-003",
    "status": "PROCESSING",
    "previousStatus": "PENDING",
    "statusChangedAt": "2025-11-11T08:30:00.000Z",
    "notes": "Validation effectuée, envoi vers la banque"
  },
  "message": "Payment order status updated successfully"
}
```

### Suppression d'un ordre de paiement

Supprime un ordre de paiement (uniquement si en statut PENDING ou FAILED).

**Endpoint** : `DELETE /payments/{id}`

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "Payment order deleted successfully"
}
```

## Statuts des ordres de paiement

Les ordres de paiement suivent un workflow avec les statuts suivants :

### Statuts disponibles

| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| `PENDING` | En attente de validation | Modifier, Approuver, Annuler |
| `PROCESSING` | En cours de traitement | Confirmer, Échec |
| `COMPLETED` | Paiement terminé avec succès | Consulter uniquement |
| `FAILED` | Paiement échoué | Réessayer, Annuler |
| `CANCELLED` | Paiement annulé | Consulter uniquement |

### Transitions de statut autorisées

```
PENDING → PROCESSING (Approbation)
PENDING → CANCELLED (Annulation)
PROCESSING → COMPLETED (Confirmation bancaire)
PROCESSING → FAILED (Erreur bancaire)
FAILED → PENDING (Réinitialisation pour nouvel essai)
FAILED → CANCELLED (Abandon définitif)
```

## Types de financement

| Type | Description | Utilisation |
|------|-------------|-------------|
| `CREDIT` | Crédit traditionnel | Déboursements de prêts |
| `LEASING` | Crédit-bail | Paiements de leasing |
| `INVESTMENT` | Investissement | Participations, placements |

## Structures de données

### PaymentOrder

```typescript
interface PaymentOrder {
  id: string;
  reference: string;
  fundingType: 'CREDIT' | 'LEASING' | 'INVESTMENT';
  status: PaymentOrderStatus;
  amount: number;
  currency: string;
  portfolioId: string;
  contractReference?: string;
  description?: string;
  beneficiary: Beneficiary;
  paymentMethod: PaymentMethod;
  executionDate: string;
  createdBy: User;
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}
```

### Beneficiary

```typescript
interface Beneficiary {
  name: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  address?: string;
}
```

### CreatePaymentOrderDto

```typescript
interface CreatePaymentOrderDto {
  fundingType: 'CREDIT' | 'LEASING' | 'INVESTMENT';
  amount: number;
  currency: string;
  portfolioId: string;
  contractReference?: string;
  description?: string;
  beneficiary: Beneficiary;
  paymentMethod: PaymentMethod;
  executionDate: string;
}
```

### UpdatePaymentOrderDto

```typescript
interface UpdatePaymentOrderDto {
  amount?: number;
  executionDate?: string;
  description?: string;
  beneficiary?: Partial<Beneficiary>;
  paymentMethod?: PaymentMethod;
}
```

### UpdatePaymentOrderStatusDto

```typescript
interface UpdatePaymentOrderStatusDto {
  status: PaymentOrderStatus;
  notes?: string;
}
```

## Codes d'erreur spécifiques

| Code HTTP | Code d'erreur | Description |
|-----------|---------------|-------------|
| 400 | INVALID_PAYMENT_DATA | Données de paiement invalides |
| 400 | INVALID_AMOUNT | Montant invalide (négatif ou nul) |
| 400 | INVALID_STATUS_TRANSITION | Transition de statut non autorisée |
| 400 | PAYMENT_NOT_MODIFIABLE | Paiement non modifiable dans son état actuel |
| 404 | PAYMENT_ORDER_NOT_FOUND | Ordre de paiement non trouvé |
| 404 | PORTFOLIO_NOT_FOUND | Portefeuille non trouvé |
| 409 | PAYMENT_REFERENCE_EXISTS | Référence de paiement déjà existante |
| 422 | INSUFFICIENT_FUNDS | Fonds insuffisants dans le portefeuille |

## Permissions et sécurité

### Matrice des permissions

| Action | Admin | Finance Manager | Portfolio Manager | Analyst |
|--------|-------|----------------|-------------------|---------|
| Consulter paiements | ✅ | ✅ | ✅ | ✅ |
| Créer paiement | ✅ | ✅ | ✅ | ❌ |
| Modifier paiement | ✅ | ✅ | ✅* | ❌ |
| Approuver paiement | ✅ | ✅ | ❌ | ❌ |
| Annuler paiement | ✅ | ✅ | ❌ | ❌ |
| Supprimer paiement | ✅ | ✅ | ❌ | ❌ |

*\* Uniquement pour les paiements de ses portefeuilles*

---

*Documentation mise à jour le 10 novembre 2025 basée sur le PaymentOrderController réellement implémenté dans le portfolio-institution-service.*
