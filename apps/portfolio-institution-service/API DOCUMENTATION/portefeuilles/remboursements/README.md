# API des Remboursements - Portefeuille Traditionnel

Cette API permet de gérer les remboursements associés aux contrats de crédit dans le cadre des portefeuilles traditionnels, incluant l'enregistrement des paiements, le suivi des échéances, les pénalités et la gestion des retards.

## Points d'accès

### Liste des remboursements d'un contrat

Récupère la liste des remboursements effectués pour un contrat de crédit spécifique.

**Endpoint** : `GET /portfolios/traditional/repayments`

**Paramètres de requête** :
- `portfolioId` (optionnel) : Identifiant unique du portefeuille traditionnel
- `contractId` (optionnel) : Identifiant unique du contrat de crédit
- `page` (optionnel) : Numéro de la page (défaut : 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut : 10, max : 100)
- `status` (optionnel) : Filtre par statut (paid, partial, late, pending)
- `dateFrom` (optionnel) : Filtre par date de paiement (début)
- `dateTo` (optionnel) : Filtre par date de paiement (fin)
- `sortBy` (optionnel) : Trier par (transaction_date, due_date, amount, created_at)
- `sortOrder` (optionnel) : Ordre de tri (asc, desc)

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174123",
      "reference": "PMT-2025-0001",
      "contract_id": "123e4567-e89b-12d3-a456-426614174001",
      "portfolio_id": "123e4567-e89b-12d3-a456-426614174456",
      "client_id": "123e4567-e89b-12d3-a456-426614174789",
      "transaction_date": "2025-02-14T10:30:00.000Z",
      "amount": 4583.33,
      "currency": "XOF",
      "payment_method": "bank_transfer",
      "payment_method_type": "BANK_TRANSFER",
      "transaction_id": "BOA20250214103022",
      "status": "completed",
      "payment_type": "standard",
      "principal_amount": 3750.00,
      "interest_amount": 833.33,
      "penalty_amount": 0.00,
      "allocation": [
        {
          "schedule_id": "123e4567-e89b-12d3-a456-426614174999",
          "principal_amount": 3750.00,
          "interest_amount": 833.33,
          "penalties_amount": 0.00,
          "fees_amount": 0.00
        }
      ],
      "due_date": "2025-02-15T00:00:00.000Z",
      "daysLate": -1,
      "receipt_number": "REC-2025-001-01",
      "notes": "Paiement reçu en avance d'un jour",
      "created_at": "2025-02-14T10:30:00.000Z",
      "updated_at": "2025-02-14T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### Détails d'un remboursement

Récupère les détails complets d'un remboursement spécifique.

**Endpoint** : `GET /portfolios/traditional/repayments/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du remboursement

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174123",
    "reference": "PMT-2025-0001",
    "contract_id": "123e4567-e89b-12d3-a456-426614174001",
    "portfolio_id": "123e4567-e89b-12d3-a456-426614174456",
    "client_id": "123e4567-e89b-12d3-a456-426614174789",
    "transaction_date": "2025-02-14T10:30:00.000Z",
    "amount": 4583.33,
    "currency": "XOF",
    "payment_method": "bank_transfer",
    "payment_method_type": "BANK_TRANSFER",
    "transaction_id": "BOA20250214103022",
    "status": "completed",
    "payment_type": "standard",
    "principal_amount": 3750.00,
    "interest_amount": 833.33,
    "penalty_amount": 0.00,
    "allocation": [
      {
        "schedule_id": "123e4567-e89b-12d3-a456-426614174999",
        "principal_amount": 3750.00,
        "interest_amount": 833.33,
        "penalties_amount": 0.00,
        "fees_amount": 0.00
      }
    ],
    "due_date": "2025-02-15T00:00:00.000Z",
    "daysLate": -1,
    "receipt_number": "REC-2025-001-01",
    "notes": "Paiement reçu en avance d'un jour",
    "created_at": "2025-02-14T10:30:00.000Z",
    "updated_at": "2025-02-14T10:30:00.000Z"
  }
}
```

### Enregistrement d'un paiement

Enregistre un nouveau paiement pour une échéance d'un contrat de crédit.

**Endpoint** : `POST /portfolios/traditional/repayments`

**Corps de la requête** :

```json
{
  "contractId": "123e4567-e89b-12d3-a456-426614174001",
  "amount": 4583.33,
  "paymentDate": "2025-02-14T10:30:00.000Z",
  "paymentMethod": "bank_transfer",
  "paymentType": "standard",
  "transactionId": "BOA20250214103022",
  "transactionDate": "2025-02-14T10:30:00.000Z",
  "scheduleIds": ["123e4567-e89b-12d3-a456-426614174999"],
  "notes": "Paiement régulier de l'échéance mensuelle"
}
```

**Champs obligatoires:**
- `contractId` (UUID): Identifiant du contrat de crédit
- `amount` (number > 0.01): Montant du paiement
- `paymentDate` (ISO 8601): Date du paiement
- `paymentMethod` (string): Méthode de paiement (bank_transfer, mobile_money, cash, check)
- `paymentType` (enum): Type de remboursement

**Champs optionnels:**
- `transactionId` (string): ID transaction externe (unique pour idempotence)
- `transactionDate` (ISO 8601): Date de la transaction
- `scheduleIds` (UUID[]): IDs des échéances à payer spécifiquement
- `notes` (string): Notes additionnelles

**Types de remboursement (paymentType):**
- **standard**: Paiement normal d'échéances dans l'ordre chronologique
- **partial**: Paiement partiel d'une échéance spécifique (nécessite scheduleIds)
- **advance**: Paiement anticipé de plusieurs échéances futures
- **early_payoff**: Remboursement anticipé total du crédit
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174555",
    "reference": "PMT-2025-0042",
    "contract_id": "123e4567-e89b-12d3-a456-426614174001",
    "portfolio_id": "123e4567-e89b-12d3-a456-426614174456",
    "client_id": "123e4567-e89b-12d3-a456-426614174789",
    "amount": 4583.33,
    "currency": "XOF",
    "status": "completed",
    "payment_type": "standard",
    "transaction_id": "BOA20250214103022",
    "transaction_date": "2025-02-14T10:30:00.000Z",
    "principal_amount": 3750.00,
    "interest_amount": 833.33,
    "penalty_amount": 0.00,
    "allocation": [
      {
        "schedule_id": "123e4567-e89b-12d3-a456-426614174999",
        "principal_amount": 3750.00,
        "interest_amount": 833.33,
        "penalties_amount": 0.00,
        "fees_amount": 0.00
      }
    ],
    "receipt_number": "REC-2025-001-04",
    "created_at": "2025-07-25T18:30:00.000Z",
    "updated_at": "2025-07-25T18:30:00.000Z"
  }
}
```

> **Note sur l'idempotence**: Si un `transactionId` est fourni et existe déjà, le système retournera le remboursement existant au lieu de créer un doublon.

> **Champ allocation**: Tableau détaillant comment le paiement a été alloué sur chaque échéance, incluant la répartition entre principal, intérêts, pénalités et frais.
```

La documentation des remboursements a été mise à jour pour refléter les endpoints réels du code source. 

**Note importante** : Plusieurs endpoints complexes documentés ici (comme les paiements partiels, anticipés, etc.) correspondent à des fonctionnalités avancées qui peuvent ne pas être entièrement implémentées dans le code source actuel. 

Les endpoints de base confirmés dans le code source sont :
- `GET /portfolios/traditional/repayments` - Liste des remboursements avec filtres
- `GET /portfolios/traditional/repayments/{id}` - Détails d'un remboursement  
- `POST /portfolios/traditional/repayments` - Enregistrement d'un nouveau paiement

## Erreurs spécifiques

| Code HTTP | Code d'erreur           | Description                                        |
|-----------|------------------------|----------------------------------------------------|
| 400       | INVALID_PAYMENT_DATA   | Données de paiement invalides                     |
| 404       | PAYMENT_NOT_FOUND      | Remboursement non trouvé                          |
| 403       | INSUFFICIENT_PERMISSIONS| Permissions insuffisantes                         |
| 409       | PAYMENT_ALREADY_EXISTS | Paiement déjà enregistré pour cette échéance     |
```

## Modèles de données

### Remboursement
| Champ | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Identifiant unique du remboursement |
| reference | string | Référence unique du paiement (ex: PMT-2025-0001) |
| contract_id | string (UUID) | Identifiant du contrat de crédit |
| portfolio_id | string (UUID) | Identifiant du portefeuille |
| client_id | string (UUID) | Identifiant du client |
| schedule_id | string (UUID, optionnel) | Identifiant de l'échéance dans le calendrier |
| amount | number | Montant total du paiement |
| currency | string | Code devise ISO 4217 (CDF, USD, XOF, EUR, XAF) |
| principal_amount | number (optionnel) | Part de capital remboursée |
| interest_amount | number (optionnel) | Part d'intérêts payée |
| penalty_amount | number (optionnel) | Part de pénalités payée |
| status | enum | Statut: pending, processing, completed, failed, partial |
| payment_method | string (optionnel) | Méthode de paiement utilisée |
| payment_method_type | enum (optionnel) | Type: BANK_TRANSFER, CASH, CHECK, MOBILE_MONEY, OTHER |
| payment_type | enum | Type: standard, partial, advance, early_payoff |
| transaction_id | string (optionnel, unique) | ID transaction externe pour idempotence |
| transaction_date | timestamp (optionnel) | Date de la transaction |
| due_date | timestamp (optionnel) | Date d'échéance prévue |
| receipt_number | string (optionnel) | Numéro du reçu de paiement |
| daysLate | integer (optionnel) | Nombre de jours de retard (négatif si en avance) |
| notes | string (optionnel) | Notes additionnelles |
| processed_by | string (optionnel) | Identifiant de l'utilisateur ayant traité |
| is_external | boolean | Paiement provenant d'un système externe (défaut: false) |
| allocation | array (optionnel) | Détails d'allocation par échéance (voir structure ci-dessous) |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Date de dernière modification |

**Structure de l'allocation:**
```json
[
  {
    "schedule_id": "uuid",
    "principal_amount": 0.00,
    "interest_amount": 0.00,
    "penalties_amount": 0.00,
    "fees_amount": 0.00
  }
]
```

### Pénalité
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de la pénalité |
| contract_id | string | Identifiant du contrat de crédit |
| schedule_id | string | Identifiant de l'échéance concernée |
| due_date | string | Date d'échéance prévue (format ISO) |
| penalty_date | string | Date d'application de la pénalité (format ISO) |
| penalty_amount | number | Montant de la pénalité |
| penalty_rate | number | Taux de pénalité appliqué (%) |
| days_late | number | Nombre de jours de retard |
| original_amount | number | Montant original de l'échéance |
| total_due | number | Montant total dû (échéance + pénalité) |
| status | string | Statut ('active', 'paid', 'canceled') |
| notes | string | Notes sur la pénalité |
| cancellation_reason | string | Raison de l'annulation (si applicable) |
| canceled_by | string | Identifiant de l'utilisateur ayant annulé la pénalité |
| canceler_name | string | Nom de l'utilisateur ayant annulé la pénalité |
| canceled_at | string | Date d'annulation (format ISO) |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |

### Détails de paiement
| Champ | Type | Description |
|-------|------|-------------|
| bank_name | string | Nom de la banque (pour paiements bancaires) |
| account_number | string | Numéro de compte masqué (pour paiements bancaires) |
| transaction_id | string | Identifiant de transaction de la banque |
| provider | string | Fournisseur du service (pour mobile money) |
| phone_number | string | Numéro de téléphone (pour mobile money) |
| received_by | string | Nom de la personne ayant reçu le paiement (pour espèces) |
| notes | string | Notes additionnelles sur le paiement |

### Historique de paiement
| Champ | Type | Description |
|-------|------|-------------|
| date | string | Date du paiement (format ISO) |
| amount | number | Montant payé |
| method | string | Méthode de paiement utilisée |
| reference | string | Référence de la transaction |
