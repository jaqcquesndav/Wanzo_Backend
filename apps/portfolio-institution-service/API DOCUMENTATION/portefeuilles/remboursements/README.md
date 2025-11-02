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
      "portfolio_id": "portfolio456",
      "client_id": "client789",
      "payment_date": "2025-02-14T10:30:00.000Z",
      "amount": 4583.33,
      "payment_method": "bank_transfer",
      "payment_reference": "TRX-12345678",
      "transaction_reference": "BOA20250214103022",
      "status": "completed",
      "payment_type": "mixed",
      "payment_details": {
        "principal_amount": 3750.00,
        "interest_amount": 833.33,
        "penalty_amount": 0.00
      },
      "scheduled_payment_id": "payment1",
      "due_date": "2025-02-15T00:00:00.000Z",
      "remaining_amount": 0.00,
      "remaining_percentage": 0.0,
      "slippage": -1,
      "installment_number": 1,
      "total_installments": 12,
      "receipt_url": "https://example.com/receipts/rec-2025-001-01.pdf",
      "source_account": {
        "accountNumber": "XXXX-XXXX-XXXX-1234",
        "accountName": "Entreprise ABC",
        "bankName": "Bank of Africa",
        "bankCode": "BOA-CI",
        "companyName": "Entreprise ABC"
      },
      "destination_account": {
        "accountNumber": "XXXX-XXXX-XXXX-5678",
        "accountName": "Portfolio Traditionnel PME",
        "bankName": "Banque Centrale",
        "portfolioName": "Portefeuille PME Nord-Kivu"
      },
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
    "id": "repayment123",
    "contract_id": "contract123",
    "portfolio_id": "portfolio456",
    "client_id": "client789",
    "payment_date": "2025-02-14T10:30:00.000Z",
    "amount": 4583.33,
    "payment_method": "bank_transfer",
    "payment_reference": "TRX-12345678",
    "transaction_reference": "BOA20250214103022",
    "status": "completed",
    "payment_type": "mixed",
    "payment_details": {
      "principal_amount": 3750.00,
      "interest_amount": 833.33,
      "penalty_amount": 0.00
    },
    "scheduled_payment_id": "payment1",
    "due_date": "2025-02-15T00:00:00.000Z",
    "remaining_amount": 0.00,
    "remaining_percentage": 0.0,
    "slippage": -1,
    "installment_number": 1,
    "total_installments": 12,
    "receipt_url": "https://example.com/receipts/rec-2025-001-01.pdf",
    "supporting_document_url": "https://example.com/documents/payment-proof-123.pdf",
    "has_supporting_document": true,
    "description": "Paiement échéance mensuelle #1",
    "source_account": {
      "accountNumber": "XXXX-XXXX-XXXX-1234",
      "accountName": "Entreprise ABC",
      "bankName": "Bank of Africa",
      "bankCode": "BOA-CI",
      "companyName": "Entreprise ABC"
    },
    "destination_account": {
      "accountNumber": "XXXX-XXXX-XXXX-5678",
      "accountName": "Portfolio Traditionnel PME",
      "bankName": "Banque Centrale",
      "portfolioName": "Portefeuille PME Nord-Kivu"
    },
    "notes": "Paiement reçu en avance d'un jour",
    "created_at": "2025-02-14T10:30:00.000Z",
    "updated_at": "2025-02-14T10:30:00.000Z"
  }
}
```

### Enregistrement d'un paiement

Enregistre un nouveau paiement pour une échéance d'un contrat de crédit.

**Endpoint** : `POST /portfolios/traditional/repayments`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "contract_id": "contract123",
  "portfolio_id": "portfolio456",
  "client_id": "client789",
  "payment_date": "2025-05-14",
  "amount": 4427.08,
  "payment_method": "bank_transfer",
  "payment_reference": "TRX-45678901",
  "transaction_reference": "BOA20250514091545",
  "status": "completed",
  "payment_type": "mixed",
  "payment_details": {
    "principal_amount": 3750.00,
    "interest_amount": 677.08,
    "penalty_amount": 0.00
  },
  "scheduled_payment_id": "payment4",
  "due_date": "2025-05-15",
  "installment_number": 4,
  "total_installments": 12,
  "source_account": {
    "accountNumber": "XXXX-XXXX-XXXX-1234",
    "accountName": "Entreprise ABC",
    "bankName": "Bank of Africa",
    "bankCode": "BOA-CI",
    "companyName": "Entreprise ABC"
  },
  "notes": "Paiement reçu en avance d'un jour",
  "description": "Paiement échéance mensuelle #4"
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
