# API des Remboursements - Portefeuille Traditionnel

Cette API permet de gérer les remboursements associés aux contrats de crédit dans le cadre des portefeuilles traditionnels, incluant l'enregistrement des paiements, le suivi des échéances, les pénalités et la gestion des retards.

## Points d'accès

### Liste des remboursements d'un contrat

Récupère la liste des remboursements effectués pour un contrat de crédit spécifique.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Paramètres de requête** :
- `page` (optionnel) : Numéro de la page (défaut : 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut : 10, max : 100)
- `status` (optionnel) : Filtre par statut (paid, partial, late, pending)
- `dateFrom` (optionnel) : Filtre par date de paiement (début)
- `dateTo` (optionnel) : Filtre par date de paiement (fin)
- `sortBy` (optionnel) : Trier par (payment_date, due_date, amount)
- `sortOrder` (optionnel) : Ordre de tri (asc, desc)

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "repayment123",
      "contract_id": "contract123",
      "schedule_id": "payment1",
      "due_date": "2025-02-15T00:00:00.000Z",
      "payment_date": "2025-02-14T10:30:00.000Z",
      "principal_amount": 3750.00,
      "interest_amount": 833.33,
      "total_amount": 4583.33,
      "paid_amount": 4583.33,
      "remaining_amount": 0.00,
      "status": "paid",
      "payment_method": "bank_transfer",
      "payment_reference": "TRX-12345678",
      "created_at": "2025-02-14T10:30:00.000Z",
      "updated_at": "2025-02-14T10:30:00.000Z"
    },
    {
      "id": "repayment124",
      "contract_id": "contract123",
      "schedule_id": "payment2",
      "due_date": "2025-03-15T00:00:00.000Z",
      "payment_date": "2025-03-15T14:20:00.000Z",
      "principal_amount": 3750.00,
      "interest_amount": 781.25,
      "total_amount": 4531.25,
      "paid_amount": 4531.25,
      "remaining_amount": 0.00,
      "status": "paid",
      "payment_method": "bank_transfer",
      "payment_reference": "TRX-23456789",
      "created_at": "2025-03-15T14:20:00.000Z",
      "updated_at": "2025-03-15T14:20:00.000Z"
    },
    {
      "id": "repayment125",
      "contract_id": "contract123",
      "schedule_id": "payment3",
      "due_date": "2025-04-15T00:00:00.000Z",
      "payment_date": "2025-04-14T11:45:00.000Z",
      "principal_amount": 3750.00,
      "interest_amount": 729.17,
      "total_amount": 4479.17,
      "paid_amount": 4479.17,
      "remaining_amount": 0.00,
      "status": "paid",
      "payment_method": "mobile_money",
      "payment_reference": "MM-34567890",
      "created_at": "2025-04-14T11:45:00.000Z",
      "updated_at": "2025-04-14T11:45:00.000Z"
    },
    {
      "id": null,
      "contract_id": "contract123",
      "schedule_id": "payment4",
      "due_date": "2025-05-15T00:00:00.000Z",
      "payment_date": null,
      "principal_amount": 3750.00,
      "interest_amount": 677.08,
      "total_amount": 4427.08,
      "paid_amount": 0.00,
      "remaining_amount": 4427.08,
      "status": "pending"
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

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/{repaymentId}`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `repaymentId` : Identifiant unique du remboursement

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "repayment123",
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "client_id": "client789",
    "company_name": "Entreprise ABC",
    "schedule_id": "payment1",
    "due_date": "2025-02-15T00:00:00.000Z",
    "payment_date": "2025-02-14T10:30:00.000Z",
    "principal_amount": 3750.00,
    "interest_amount": 833.33,
    "total_amount": 4583.33,
    "paid_amount": 4583.33,
    "remaining_amount": 0.00,
    "status": "paid",
    "payment_method": "bank_transfer",
    "payment_reference": "TRX-12345678",
    "payment_details": {
      "bank_name": "Bank of Africa",
      "account_number": "XXXX-XXXX-XXXX-1234",
      "transaction_id": "BOA20250214103022",
      "notes": "Paiement reçu par virement bancaire"
    },
    "receipt_number": "REC-2025-001-01",
    "receipt_url": "https://example.com/receipts/rec-2025-001-01.pdf",
    "processed_by": "user456",
    "processor_name": "Pierre Dubois",
    "processing_notes": "Paiement reçu en avance d'un jour",
    "created_at": "2025-02-14T10:30:00.000Z",
    "updated_at": "2025-02-14T10:30:00.000Z"
  }
}
```

### Enregistrement d'un paiement

Enregistre un nouveau paiement pour une échéance d'un contrat de crédit.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "schedule_id": "payment4",
  "payment_date": "2025-05-14",
  "paid_amount": 4427.08,
  "payment_method": "bank_transfer",
  "payment_reference": "TRX-45678901",
  "payment_details": {
    "bank_name": "Bank of Africa",
    "account_number": "XXXX-XXXX-XXXX-1234",
    "transaction_id": "BOA20250514091545",
    "notes": "Paiement reçu par virement bancaire"
  },
  "processing_notes": "Paiement reçu en avance d'un jour"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "repayment126",
    "contract_id": "contract123",
    "schedule_id": "payment4",
    "due_date": "2025-05-15T00:00:00.000Z",
    "payment_date": "2025-05-14T00:00:00.000Z",
    "principal_amount": 3750.00,
    "interest_amount": 677.08,
    "total_amount": 4427.08,
    "paid_amount": 4427.08,
    "remaining_amount": 0.00,
    "status": "paid",
    "payment_method": "bank_transfer",
    "payment_reference": "TRX-45678901",
    "receipt_number": "REC-2025-001-04",
    "receipt_url": "https://example.com/receipts/rec-2025-001-04.pdf",
    "created_at": "2025-07-25T18:30:00.000Z",
    "updated_at": "2025-07-25T18:30:00.000Z"
  }
}
```

### Enregistrement d'un paiement partiel

Enregistre un paiement partiel pour une échéance d'un contrat de crédit.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/partial`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "schedule_id": "payment5",
  "payment_date": "2025-06-10",
  "paid_amount": 2000.00,
  "payment_method": "cash",
  "payment_reference": "CASH-12345",
  "payment_details": {
    "received_by": "Pierre Dubois",
    "notes": "Paiement partiel reçu en espèces"
  },
  "processing_notes": "Client a promis de payer le solde avant la date d'échéance"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "repayment127",
    "contract_id": "contract123",
    "schedule_id": "payment5",
    "due_date": "2025-06-15T00:00:00.000Z",
    "payment_date": "2025-06-10T00:00:00.000Z",
    "principal_amount": 3750.00,
    "interest_amount": 625.00,
    "total_amount": 4375.00,
    "paid_amount": 2000.00,
    "remaining_amount": 2375.00,
    "status": "partial",
    "payment_method": "cash",
    "payment_reference": "CASH-12345",
    "receipt_number": "REC-2025-001-05-P1",
    "receipt_url": "https://example.com/receipts/rec-2025-001-05-p1.pdf",
    "created_at": "2025-07-25T18:45:00.000Z",
    "updated_at": "2025-07-25T18:45:00.000Z"
  }
}
```

### Solde d'un paiement partiel

Complète un paiement partiel existant pour une échéance.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/{repaymentId}/complete`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `repaymentId` : Identifiant unique du remboursement partiel

**Corps de la requête** :

```json
{
  "payment_date": "2025-06-14",
  "paid_amount": 2375.00,
  "payment_method": "mobile_money",
  "payment_reference": "MM-56789012",
  "payment_details": {
    "provider": "Orange Money",
    "phone_number": "+22500000000",
    "transaction_id": "OM20250614152233",
    "notes": "Solde du paiement reçu via Orange Money"
  }
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "repayment127",
    "contract_id": "contract123",
    "schedule_id": "payment5",
    "due_date": "2025-06-15T00:00:00.000Z",
    "payment_date": "2025-06-14T00:00:00.000Z",
    "principal_amount": 3750.00,
    "interest_amount": 625.00,
    "total_amount": 4375.00,
    "paid_amount": 4375.00,
    "remaining_amount": 0.00,
    "status": "paid",
    "payment_history": [
      {
        "date": "2025-06-10T00:00:00.000Z",
        "amount": 2000.00,
        "method": "cash",
        "reference": "CASH-12345"
      },
      {
        "date": "2025-06-14T00:00:00.000Z",
        "amount": 2375.00,
        "method": "mobile_money",
        "reference": "MM-56789012"
      }
    ],
    "receipt_number": "REC-2025-001-05",
    "receipt_url": "https://example.com/receipts/rec-2025-001-05.pdf",
    "updated_at": "2025-07-25T19:00:00.000Z"
  }
}
```

### Enregistrement d'un paiement anticipé

Enregistre un paiement anticipé pour plusieurs échéances d'un contrat de crédit.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/advance`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "payment_date": "2025-07-01",
  "paid_amount": 17200.00,
  "schedule_ids": ["payment6", "payment7", "payment8", "payment9"],
  "payment_method": "bank_transfer",
  "payment_reference": "TRX-67890123",
  "payment_details": {
    "bank_name": "Ecobank",
    "account_number": "XXXX-XXXX-XXXX-5678",
    "transaction_id": "ECO20250701103045",
    "notes": "Paiement anticipé de 4 échéances"
  },
  "processing_notes": "Client a payé 4 échéances en avance pour des raisons de trésorerie"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "contract_id": "contract123",
    "paid_amount": 17200.00,
    "paid_schedules": 4,
    "payment_date": "2025-07-01T00:00:00.000Z",
    "payment_method": "bank_transfer",
    "payment_reference": "TRX-67890123",
    "receipt_number": "REC-2025-001-ADV1",
    "receipt_url": "https://example.com/receipts/rec-2025-001-adv1.pdf",
    "repayments": [
      {
        "id": "repayment128",
        "schedule_id": "payment6",
        "due_date": "2025-07-15T00:00:00.000Z",
        "total_amount": 4322.92,
        "status": "paid"
      },
      {
        "id": "repayment129",
        "schedule_id": "payment7",
        "due_date": "2025-08-15T00:00:00.000Z",
        "total_amount": 4270.83,
        "status": "paid"
      },
      {
        "id": "repayment130",
        "schedule_id": "payment8",
        "due_date": "2025-09-15T00:00:00.000Z",
        "total_amount": 4218.75,
        "status": "paid"
      },
      {
        "id": "repayment131",
        "schedule_id": "payment9",
        "due_date": "2025-10-15T00:00:00.000Z",
        "total_amount": 4166.67,
        "status": "paid"
      }
    ],
    "created_at": "2025-07-25T19:15:00.000Z"
  }
}
```

### Remboursement anticipé total

Enregistre un remboursement anticipé total d'un contrat de crédit.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/early-payoff`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "payment_date": "2025-07-25",
  "payment_method": "bank_transfer",
  "payment_reference": "TRX-78901234",
  "payment_details": {
    "bank_name": "Ecobank",
    "account_number": "XXXX-XXXX-XXXX-5678",
    "transaction_id": "ECO20250725123456",
    "notes": "Remboursement anticipé total du crédit"
  },
  "processing_notes": "Client a décidé de solder son crédit suite à une rentrée de fonds importante"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "outstanding_principal": 11250.00,
    "remaining_interest": 468.75,
    "early_payoff_penalty": 225.00,
    "total_payoff_amount": 11943.75,
    "payment_date": "2025-07-25T00:00:00.000Z",
    "payment_method": "bank_transfer",
    "payment_reference": "TRX-78901234",
    "receipt_number": "REC-2025-001-PAYOFF",
    "receipt_url": "https://example.com/receipts/rec-2025-001-payoff.pdf",
    "contract_status": "completed",
    "repayments": [
      {
        "id": "repayment132",
        "schedule_id": "payment10",
        "due_date": "2025-11-15T00:00:00.000Z",
        "total_amount": 4114.58,
        "status": "paid"
      },
      {
        "id": "repayment133",
        "schedule_id": "payment11",
        "due_date": "2025-12-15T00:00:00.000Z",
        "total_amount": 4062.50,
        "status": "paid"
      },
      {
        "id": "repayment134",
        "schedule_id": "payment12",
        "due_date": "2026-01-15T00:00:00.000Z",
        "total_amount": 4010.42,
        "status": "paid"
      }
    ],
    "created_at": "2025-07-25T19:30:00.000Z"
  }
}
```

### Récupération d'un reçu de paiement

Récupère un reçu de paiement au format PDF.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/{repaymentId}/receipt`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `repaymentId` : Identifiant unique du remboursement

**Réponse réussie** (200 OK) : Fichier PDF du reçu

### Ajout d'une pénalité de retard

Ajoute une pénalité de retard à une échéance impayée.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/{scheduleId}/penalties`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `scheduleId` : Identifiant unique de l'échéance

**Corps de la requête** :

```json
{
  "penalty_date": "2025-07-25",
  "penalty_amount": 221.35,
  "penalty_rate": 5.0,
  "days_late": 10,
  "notes": "Pénalité appliquée pour retard de paiement de 10 jours"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "penalty123",
    "contract_id": "contract123",
    "schedule_id": "payment5",
    "due_date": "2025-06-15T00:00:00.000Z",
    "penalty_date": "2025-07-25T00:00:00.000Z",
    "penalty_amount": 221.35,
    "penalty_rate": 5.0,
    "days_late": 10,
    "original_amount": 4375.00,
    "total_due": 4596.35,
    "status": "late",
    "notes": "Pénalité appliquée pour retard de paiement de 10 jours",
    "created_at": "2025-07-25T19:45:00.000Z",
    "updated_at": "2025-07-25T19:45:00.000Z"
  }
}
```

### Suppression d'une pénalité de retard

Supprime une pénalité de retard précédemment ajoutée.

**Endpoint** : `DELETE /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/penalties/{penaltyId}`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `penaltyId` : Identifiant unique de la pénalité

**Corps de la requête** :

```json
{
  "reason": "Pénalité annulée suite à justification du client",
  "approved_by": "user458"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "penalty123",
    "contract_id": "contract123",
    "schedule_id": "payment5",
    "penalty_amount": 221.35,
    "status": "canceled",
    "cancellation_reason": "Pénalité annulée suite à justification du client",
    "canceled_by": "user458",
    "canceler_name": "Marie Martin",
    "canceled_at": "2025-07-25T20:00:00.000Z"
  }
}
```

### Statistiques des remboursements par contrat

Récupère des statistiques sur les remboursements d'un contrat spécifique.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/stats`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "total_amount": 50000.00,
    "total_interest": 8020.83,
    "total_payments": 12,
    "payments_summary": {
      "paid": 9,
      "partial": 0,
      "pending": 0,
      "late": 0,
      "defaulted": 0
    },
    "principal_paid": 50000.00,
    "interest_paid": 8020.83,
    "penalties_paid": 0.00,
    "total_paid": 58020.83,
    "remaining_principal": 0.00,
    "remaining_interest": 0.00,
    "payment_performance": {
      "on_time_payments": 8,
      "early_payments": 1,
      "late_payments": 0,
      "average_days_early": 1.5,
      "maximum_days_late": 0
    },
    "payment_methods": [
      {
        "method": "bank_transfer",
        "count": 7,
        "amount": 48541.66,
        "percentage": 83.66
      },
      {
        "method": "mobile_money",
        "count": 2,
        "amount": 6854.17,
        "percentage": 11.81
      },
      {
        "method": "cash",
        "count": 1,
        "amount": 2625.00,
        "percentage": 4.53
      }
    ]
  }
}
```

### Statistiques des remboursements par portefeuille

Récupère des statistiques sur les remboursements d'un portefeuille traditionnel.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/repayments/stats`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel

**Paramètres de requête** :
- `period` (optionnel) : Période d'analyse (month, quarter, year, all) - défaut : all
- `from` (optionnel) : Date de début pour la période personnalisée
- `to` (optionnel) : Date de fin pour la période personnalisée

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "total_contracts": 35,
    "active_contracts": 28,
    "completed_contracts": 5,
    "defaulted_contracts": 2,
    "total_principal": 2750000.00,
    "total_interest": 465000.00,
    "principal_collected": 1850000.00,
    "interest_collected": 325000.00,
    "collection_rate": 67.27,
    "payment_performance": {
      "on_time_payments": 285,
      "early_payments": 65,
      "late_payments": 32,
      "on_time_rate": 74.61,
      "early_payment_rate": 17.02,
      "late_payment_rate": 8.38,
      "average_days_early": 2.8,
      "average_days_late": 5.6
    },
    "payment_methods": [
      {
        "method": "bank_transfer",
        "count": 212,
        "amount": 1680000.00,
        "percentage": 77.36
      },
      {
        "method": "mobile_money",
        "count": 128,
        "amount": 380000.00,
        "percentage": 17.50
      },
      {
        "method": "cash",
        "count": 42,
        "amount": 115000.00,
        "percentage": 5.14
      }
    ],
    "monthly_trend": [
      {
        "period": "2025-01",
        "expected": 220000.00,
        "collected": 210000.00,
        "collection_rate": 95.45
      },
      {
        "period": "2025-02",
        "expected": 235000.00,
        "collected": 220000.00,
        "collection_rate": 93.62
      },
      {
        "period": "2025-03",
        "expected": 245000.00,
        "collected": 225000.00,
        "collection_rate": 91.84
      },
      {
        "period": "2025-04",
        "expected": 260000.00,
        "collected": 235000.00,
        "collection_rate": 90.38
      },
      {
        "period": "2025-05",
        "expected": 270000.00,
        "collected": 240000.00,
        "collection_rate": 88.89
      },
      {
        "period": "2025-06",
        "expected": 275000.00,
        "collected": 240000.00,
        "collection_rate": 87.27
      },
      {
        "period": "2025-07",
        "expected": 285000.00,
        "collected": 250000.00,
        "collection_rate": 87.72
      }
    ],
    "default_rate": 0.97,
    "penalties_applied": 45000.00,
    "penalties_collected": 32000.00,
    "penalties_collection_rate": 71.11
  }
}
```

## Modèles de données

### Remboursement
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du remboursement |
| contract_id | string | Identifiant du contrat de crédit |
| contract_number | string | Numéro de référence du contrat |
| client_id | string | Identifiant du client |
| company_name | string | Nom de l'entreprise cliente |
| schedule_id | string | Identifiant de l'échéance dans le calendrier |
| due_date | string | Date d'échéance prévue (format ISO) |
| payment_date | string | Date du paiement effectif (format ISO) |
| principal_amount | number | Part de capital à rembourser |
| interest_amount | number | Part d'intérêts à payer |
| total_amount | number | Montant total de l'échéance |
| paid_amount | number | Montant payé |
| remaining_amount | number | Montant restant à payer |
| status | string | Statut ('paid', 'partial', 'pending', 'late', 'defaulted') |
| payment_method | string | Méthode de paiement utilisée |
| payment_reference | string | Référence de la transaction |
| payment_details | object | Détails spécifiques au moyen de paiement |
| payment_history | array | Historique des paiements (pour paiements partiels) |
| receipt_number | string | Numéro du reçu de paiement |
| receipt_url | string | URL d'accès au reçu de paiement |
| processed_by | string | Identifiant de l'utilisateur ayant traité le paiement |
| processor_name | string | Nom de l'utilisateur ayant traité le paiement |
| processing_notes | string | Notes additionnelles sur le traitement |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |

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
