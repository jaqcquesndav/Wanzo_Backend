# API des Contrats de Crédit - Portefeuille Traditionnel

Cette API permet de gérer les contrats de crédit dans le cadre des portefeuilles traditionnels, y compris la création, la consultation, la mise à jour, la restructuration et la gestion des contrats.

## Points d'accès

### Liste des contrats de crédit

Récupère la liste des contrats de crédit pour un portefeuille traditionnel spécifique.

**Endpoint** : `GET /portfolios/traditional/credit-contracts`

**Paramètres de requête** :
- `portfolioId` (optionnel) : Identifiant unique du portefeuille traditionnel
- `status` (optionnel) : Filtre par statut (active, completed, defaulted, restructured)
- `clientId` (optionnel) : Filtre par identifiant du client
- `productType` (optionnel) : Filtre par type de produit
- `dateFrom` (optionnel) : Filtre par date de début du contrat (début)
- `dateTo` (optionnel) : Filtre par date de début du contrat (fin)

**Réponse réussie** (200 OK) :

```json
[
  {
    "id": "CC-00001",
    "portfolio_id": "TP-00001",
    "contract_number": "CONT-2025-001",
    "client_id": "CL-00001",
    "company_name": "Entreprise ABC",
    "product_type": "Crédit PME",
    "amount": 50000.00,
    "interest_rate": 12.5,
    "start_date": "2025-01-15T00:00:00.000Z",
    "end_date": "2026-01-15T00:00:00.000Z",
    "status": "active",
    "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution...",
    "created_at": "2025-01-10T08:00:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z",
    "funding_request_id": "FR-00001"
  },
  {
    "id": "CC-00002",
    "portfolio_id": "TP-00001",
    "contract_number": "CONT-2025-002",
    "client_id": "CL-00002",
    "company_name": "Société XYZ",
    "product_type": "Crédit Investissement",
    "amount": 75000.00,
    "interest_rate": 10.0,
    "start_date": "2025-01-20T00:00:00.000Z",
    "end_date": "2026-07-20T00:00:00.000Z",
    "status": "active",
    "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution...",
    "created_at": "2025-01-15T14:30:00.000Z",
    "updated_at": "2025-01-20T09:15:00.000Z",
    "funding_request_id": "FR-00002"
  }
]
```
### Détails d'un contrat de crédit

Récupère les détails complets d'un contrat de crédit spécifique.

**Endpoint** : `GET /portfolios/traditional/credit-contracts/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du contrat de crédit

**Réponse réussie** (200 OK) :

```json
{
  "id": "CC-00001",
  "portfolio_id": "TP-00001",
  "contract_number": "CONT-2025-001",
  "client_id": "CL-00001",
  "company_name": "Entreprise ABC",
  "product_type": "Crédit PME",
  "amount": 50000.00,
  "interest_rate": 12.5,
  "start_date": "2025-01-15T00:00:00.000Z",
  "end_date": "2026-01-15T00:00:00.000Z",
  "status": "active",
  "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution...",
  "funding_request_id": "FR-00001",
  "guarantees": [
    {
      "id": "GUAR-00001",
      "type": "real_estate",
      "description": "Terrain situé à Cocody, parcelle 123",
      "value": 80000.00,
      "currency": "XOF",
      "documents": [
        {
          "id": "DOC-00001",
          "name": "Titre foncier",
          "url": "https://example.com/documents/titre-foncier-123.pdf"
        },
        {
          "id": "DOC-00002",
          "name": "Évaluation immobilière",
          "url": "https://example.com/documents/evaluation-123.pdf"
        }
      ]
    }
  ],
  "disbursements": [
    {
      "id": "DISB-00001",
      "date": "2025-01-15T09:30:00.000Z",
      "amount": 50000.00,
      "method": "bank_transfer",
      "reference": "TRX-12345678"
    }
  ],
  "payment_schedule": [
    {
      "id": "PAY-00001",
      "due_date": "2025-02-15T00:00:00.000Z",
      "principal_amount": 3750.00,
      "interest_amount": 833.33,
      "total_amount": 4583.33,
      "status": "pending"
    },
    {
      "id": "PAY-00002",
      "due_date": "2025-03-15T00:00:00.000Z",
      "principal_amount": 3750.00,
      "interest_amount": 781.25,
      "total_amount": 4531.25,
      "status": "pending"
    }
  ],
  "documents": [
    {
      "id": "DOC-00003",
      "name": "Contrat original signé",
      "type": "contrat_original",
      "url": "https://example.com/documents/contrat-123.pdf",
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "restructuring_history": [],
  "created_at": "2025-01-10T08:00:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```
### Création d'un contrat de crédit

Crée un nouveau contrat de crédit dans un portefeuille traditionnel.

**Endpoint** : `POST /portfolios/traditional/credit-contracts`

**Corps de la requête** :

```json
{
  "portfolio_id": "TP-00001",
  "client_id": "CL-00001",
  "company_name": "Entreprise ABC",
  "product_type": "Crédit PME",
  "contract_number": "CONT-2025-003",
  "amount": 50000.00,
  "interest_rate": 12.5,
  "start_date": "2025-08-01",
  "end_date": "2026-08-01",
  "status": "active",
  "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution...",
  "funding_request_id": "FR-00003",
  "payment_schedule": [
    {
      "id": "PAY-00003",
      "due_date": "2025-09-01",
      "principal_amount": 3750.00,
      "interest_amount": 833.33,
      "total_amount": 4583.33,
      "status": "pending"
    },
    {
      "id": "PAY-00004",
      "due_date": "2025-10-01",
      "principal_amount": 3750.00,
      "interest_amount": 781.25,
      "total_amount": 4531.25,
      "status": "pending"
    }
  ],
  "guarantees": [
    {
      "id": "GUAR-00002",
      "type": "real_estate",
      "description": "Terrain situé à Cocody, parcelle 123",
      "value": 80000.00,
      "currency": "XOF"
    }
  ]
}
```

**Réponse réussie** (201 Created) :

```json
{
  "id": "CC-00003",
  "portfolio_id": "TP-00001",
  "client_id": "CL-00001",
  "company_name": "Entreprise ABC",
  "product_type": "Crédit PME",
  "contract_number": "CONT-2025-003",
  "amount": 50000.00,
  "interest_rate": 12.5,
  "start_date": "2025-08-01T00:00:00.000Z",
  "end_date": "2026-08-01T00:00:00.000Z",
  "status": "active",
  "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution...",
  "funding_request_id": "FR-00003",
  "created_at": "2025-07-25T15:00:00.000Z",
  "updated_at": "2025-07-25T15:00:00.000Z"
}
```
### Mise à jour d'un contrat de crédit

Met à jour les informations d'un contrat de crédit existant.

**Endpoint** : `PUT /portfolios/traditional/credit-contracts/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "interest_rate": 11.5,
  "end_date": "2026-04-15",
  "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution, révisées le 25/07/2025..."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "CC-00001",
  "portfolio_id": "TP-00001",
  "client_id": "CL-00001",
  "company_name": "Entreprise ABC",
  "product_type": "Crédit PME",
  "contract_number": "CONT-2025-001",
  "amount": 50000.00,
  "interest_rate": 11.5,
  "start_date": "2025-01-15T00:00:00.000Z",
  "end_date": "2026-04-15T00:00:00.000Z",
  "status": "active",
  "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution, révisées le 25/07/2025...",
  "funding_request_id": "FR-00001",
  "created_at": "2025-01-10T08:00:00.000Z",
  "updated_at": "2025-07-25T15:30:00.000Z"
}
```

### Génération de document de contrat

Génère un document PDF pour un contrat de crédit spécifique.

**Endpoint** : `POST /portfolios/traditional/credit-contracts/{id}/generate-document`

**Paramètres de chemin** :
- `id` : Identifiant unique du contrat de crédit

**Corps de la requête** : Vide

**Réponse réussie** (200 OK) :

```json
{
  "documentUrl": "https://example.com/contract-documents/CC-00001.pdf"
}
```
### Marquer un contrat comme défaillant

Marque un contrat de crédit comme étant en défaut de paiement.

**Endpoint** : `POST /portfolios/traditional/credit-contracts/{id}/default`

**Paramètres de chemin** :
- `id` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "reason": "Insolvabilité du client"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "CC-00001",
  "portfolio_id": "TP-00001",
  "contract_number": "CONT-2025-001",
  "client_id": "CL-00001",
  "company_name": "Entreprise ABC",
  "product_type": "Crédit PME",
  "amount": 50000.00,
  "interest_rate": 11.5,
  "start_date": "2025-01-15T00:00:00.000Z",
  "end_date": "2026-04-15T00:00:00.000Z",
  "status": "defaulted",
  "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution, révisées le 25/07/2025...",
  "funding_request_id": "FR-00001",
  "default_date": "2025-07-25T16:00:00.000Z",
  "default_reason": "Insolvabilité du client",
  "created_at": "2025-01-10T08:00:00.000Z",
  "updated_at": "2025-07-25T16:00:00.000Z"
}
```

### Restructuration d'un contrat

Restructure un contrat de crédit existant (modification des termes, taux ou échéances).

**Endpoint** : `POST /portfolios/traditional/credit-contracts/{id}/restructure`

**Paramètres de chemin** :
- `id` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "new_terms": "Contrat restructuré suite à difficultés financières temporaires du client...",
  "new_rate": 10.0,
  "new_end_date": "2026-10-15",
  "reason": "Difficultés de trésorerie temporaires"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "CC-00001",
  "portfolio_id": "TP-00001",
  "contract_number": "CONT-2025-001",
  "client_id": "CL-00001",
  "company_name": "Entreprise ABC",
  "product_type": "Crédit PME",
  "amount": 50000.00,
  "interest_rate": 10.0,
  "start_date": "2025-01-15T00:00:00.000Z",
  "end_date": "2026-10-15T00:00:00.000Z",
  "status": "restructured",
  "terms": "Contrat restructuré suite à difficultés financières temporaires du client...",
  "funding_request_id": "FR-00001",
  "restructuring_history": [
    {
      "date": "2025-07-25T16:30:00.000Z",
      "reason": "Difficultés de trésorerie temporaires",
      "previous_terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution, révisées le 25/07/2025...",
      "previous_rate": 11.5,
      "previous_end_date": "2026-04-15T00:00:00.000Z"
    }
  ],
  "created_at": "2025-01-10T08:00:00.000Z",
  "updated_at": "2025-07-25T16:30:00.000Z"
}
```
### Échéancier de paiement d'un contrat

Récupère l'échéancier de paiement d'un contrat de crédit.

**Endpoint** : `GET /portfolios/traditional/{portfolioId}/credit-contracts/{contractId}/schedule`

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
    "interest_rate": 11.5,
    "schedule": [
      {
        "id": "payment1",
        "due_date": "2025-02-15",
        "principal_amount": 3750.00,
        "interest_amount": 833.33,
        "total_amount": 4583.33,
        "status": "paid",
        "payment_date": "2025-02-14",
        "payment_amount": 4583.33,
        "payment_reference": "PAY-12345678"
      },
      {
        "id": "payment2",
        "due_date": "2025-03-15",
        "principal_amount": 3750.00,
        "interest_amount": 781.25,
        "total_amount": 4531.25,
        "status": "pending"
      }
    ],
    "summary": {
      "total_principal": 50000.00,
      "total_interest": 8020.83,
      "total_amount": 58020.83,
      "paid_principal": 3750.00,
      "paid_interest": 833.33,
      "paid_total": 4583.33,
      "remaining_principal": 46250.00,
      "remaining_interest": 7187.50,
      "remaining_total": 53437.50,
      "payment_count": 12,
      "payments_made": 1,
      "payments_remaining": 11
    }
  }
}
```

### Clôture d'un contrat

Marque un contrat de crédit comme terminé après remboursement complet.

**Endpoint** : `POST /portfolios/traditional/{portfolioId}/credit-contracts/{contractId}/complete`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "completion_date": "2025-07-25",
  "notes": "Remboursement anticipé complet"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "contract123",
    "portfolio_id": "portfolio456",
    "contract_number": "CONT-2025-001",
    "status": "completed",
    "completion_date": "2025-07-25",
    "updated_at": "2025-07-25"
  }
}
```

## Modèles de données

### Contrat de crédit
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du contrat |
| portfolio_id | string | Identifiant du portefeuille traditionnel |
| contract_number | string | Numéro de référence du contrat |
| client_id | string | Identifiant du client |
| company_name | string | Nom de l'entreprise cliente |
| product_type | string | Type de produit financier |
| amount | number | Montant total du crédit |
| interest_rate | number | Taux d'intérêt annuel (%) |
| start_date | string | Date de début du contrat (format ISO) |
| end_date | string | Date de fin du contrat (format ISO) |
| status | string | Statut du contrat ('active', 'completed', 'defaulted', 'restructured') |
| terms | string | Conditions générales du contrat |
| funding_request_id | string | Identifiant de la demande de financement associée (optionnel) |
| payment_schedule | array | Échéancier de paiement (optionnel) |
| guarantees | array | Garanties associées au contrat (optionnel) |
| disbursements | array | Historique des déboursements (optionnel) |
| documents | array | Documents associés au contrat (optionnel) |
| restructuring_history | array | Historique des restructurations (optionnel) |
| default_date | string | Date du défaut de paiement (si applicable) |
| default_reason | string | Raison du défaut de paiement (si applicable) |
| completion_date | string | Date de clôture du contrat (si applicable) |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |

### Échéance de paiement
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de l'échéance |
| due_date | string | Date d'échéance prévue (format ISO) |
| principal_amount | number | Part de capital à rembourser |
| interest_amount | number | Part d'intérêts à payer |
| total_amount | number | Montant total de l'échéance |
| status | string | Statut ('pending', 'paid', 'partial', 'late', 'defaulted') |
| payment_date | string | Date du paiement effectif (si applicable) |
| payment_amount | number | Montant payé (si applicable) |
| payment_reference | string | Référence du paiement (si applicable) |

### Garantie
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de la garantie |
| type | string | Type de garantie (ex: "real_estate", "equipment") |
| description | string | Description détaillée de la garantie |
| value | number | Valeur estimée de la garantie |
| currency | string | Devise de la valeur |
| documents | array | Documents justificatifs de la garantie (optionnel) |

### Document
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du document |
| name | string | Nom du document |
| type | string | Type de document (ex: "contrat_original", "avenant") |
| url | string | URL d'accès au document |
| created_at | string | Date de création/téléchargement (format ISO) |

### Déboursement
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du déboursement |
| date | string | Date du déboursement (format ISO) |
| amount | number | Montant déboursé |
| method | string | Méthode de paiement utilisée |
| reference | string | Référence de la transaction |

### Historique de restructuration
| Champ | Type | Description |
|-------|------|-------------|
| date | string | Date de la restructuration (format ISO) |
| reason | string | Raison de la restructuration |
| previous_terms | string | Conditions antérieures du contrat |
| previous_rate | number | Taux d'intérêt antérieur |
| previous_end_date | string | Date de fin antérieure du contrat (format ISO) |
