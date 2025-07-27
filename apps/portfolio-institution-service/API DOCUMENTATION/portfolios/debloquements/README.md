# API des Déboursements - Portefeuille Traditionnel

Cette API permet de gérer les déboursements (virements de fonds) associés aux contrats de crédit dans le cadre des portefeuilles traditionnels, incluant la préparation, l'exécution et le suivi des virements.

## Points d'accès

### Liste des déboursements d'un contrat

Récupère la liste des déboursements effectués pour un contrat de crédit spécifique.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Paramètres de requête** :
- `page` (optionnel) : Numéro de la page (défaut : 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut : 10, max : 100)
- `status` (optionnel) : Filtre par statut (pending, approved, executed, rejected, canceled)
- `dateFrom` (optionnel) : Filtre par date de déboursement (début)
- `dateTo` (optionnel) : Filtre par date de déboursement (fin)
- `sortBy` (optionnel) : Trier par (created_at, amount, disbursement_date)
- `sortOrder` (optionnel) : Ordre de tri (asc, desc)

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "disbursement1",
      "contract_id": "contract123",
      "contract_number": "CONT-2025-001",
      "client_id": "client789",
      "company_name": "Entreprise ABC",
      "disbursement_date": "2025-01-15T09:30:00.000Z",
      "amount": 50000.00,
      "currency": "XOF",
      "status": "executed",
      "method": "bank_transfer",
      "reference": "TRX-12345678",
      "created_at": "2025-01-14T15:20:00.000Z",
      "updated_at": "2025-01-15T09:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Détails d'un déboursement

Récupère les détails complets d'un déboursement spécifique.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `disbursementId` : Identifiant unique du déboursement

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "disbursement1",
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "client_id": "client789",
    "company_name": "Entreprise ABC",
    "request_date": "2025-01-14T15:20:00.000Z",
    "approval_date": "2025-01-14T16:45:00.000Z",
    "disbursement_date": "2025-01-15T09:30:00.000Z",
    "amount": 50000.00,
    "currency": "XOF",
    "status": "executed",
    "method": "bank_transfer",
    "reference": "TRX-12345678",
    "transfer_details": {
      "bank_name": "Ecobank",
      "account_number": "CI123456789012345",
      "account_name": "Entreprise ABC",
      "swift_code": "ECOCCIAB",
      "bank_address": "Avenue Houdaille, Plateau, Abidjan",
      "correspondent_bank": null
    },
    "fees": [
      {
        "name": "Frais de virement",
        "amount": 2500.00,
        "currency": "XOF",
        "deducted_from_disbursement": true
      },
      {
        "name": "Frais de dossier",
        "amount": 5000.00,
        "currency": "XOF",
        "deducted_from_disbursement": true
      }
    ],
    "net_disbursed_amount": 42500.00,
    "requested_by": "user456",
    "requester_name": "Pierre Dubois",
    "approved_by": "user458",
    "approver_name": "Marie Martin",
    "executed_by": "user459",
    "executor_name": "Jean Kouassi",
    "notes": "Déboursement initial pour le contrat CONT-2025-001",
    "prerequisites": [
      {
        "description": "Contrat signé",
        "status": "completed",
        "completed_at": "2025-01-13T14:30:00.000Z"
      },
      {
        "description": "Garanties validées",
        "status": "completed",
        "completed_at": "2025-01-14T10:15:00.000Z"
      },
      {
        "description": "Assurance validée",
        "status": "completed",
        "completed_at": "2025-01-14T11:30:00.000Z"
      }
    ],
    "documents": [
      {
        "id": "doc1",
        "name": "Ordre de virement",
        "type": "transfer_order",
        "url": "https://example.com/documents/ordre-virement-123.pdf",
        "created_at": "2025-01-14T16:50:00.000Z"
      },
      {
        "id": "doc2",
        "name": "Preuve de virement",
        "type": "transfer_proof",
        "url": "https://example.com/documents/preuve-virement-123.pdf",
        "created_at": "2025-01-15T09:35:00.000Z"
      }
    ],
    "created_at": "2025-01-14T15:20:00.000Z",
    "updated_at": "2025-01-15T09:35:00.000Z"
  }
}
```

### Création d'une demande de déboursement

Crée une nouvelle demande de déboursement pour un contrat de crédit.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "amount": 25000.00,
  "currency": "XOF",
  "requested_disbursement_date": "2025-07-28",
  "method": "bank_transfer",
  "transfer_details": {
    "bank_name": "Ecobank",
    "account_number": "CI123456789012345",
    "account_name": "Entreprise ABC",
    "swift_code": "ECOCCIAB",
    "bank_address": "Avenue Houdaille, Plateau, Abidjan"
  },
  "notes": "Deuxième tranche du crédit d'investissement",
  "prerequisites": [
    {
      "description": "Rapport d'avancement validé",
      "status": "completed",
      "completed_at": "2025-07-24T14:30:00.000Z"
    },
    {
      "description": "Factures proforma fournies",
      "status": "completed",
      "completed_at": "2025-07-25T10:15:00.000Z"
    }
  ]
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "disbursement2",
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "request_date": "2025-07-25T20:30:00.000Z",
    "requested_disbursement_date": "2025-07-28T00:00:00.000Z",
    "amount": 25000.00,
    "currency": "XOF",
    "status": "pending",
    "method": "bank_transfer",
    "requested_by": "user456",
    "requester_name": "Pierre Dubois",
    "notes": "Deuxième tranche du crédit d'investissement",
    "created_at": "2025-07-25T20:30:00.000Z",
    "updated_at": "2025-07-25T20:30:00.000Z"
  }
}
```

### Approbation d'une demande de déboursement

Approuve une demande de déboursement en attente.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/approve`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `disbursementId` : Identifiant unique du déboursement

**Corps de la requête** :

```json
{
  "approved_amount": 25000.00,
  "disbursement_date": "2025-07-28",
  "fees": [
    {
      "name": "Frais de virement",
      "amount": 2500.00,
      "currency": "XOF",
      "deducted_from_disbursement": true
    }
  ],
  "notes": "Demande approuvée, déboursement prévu pour le 28/07/2025"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "disbursement2",
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "approval_date": "2025-07-25T21:00:00.000Z",
    "disbursement_date": "2025-07-28T00:00:00.000Z",
    "amount": 25000.00,
    "currency": "XOF",
    "status": "approved",
    "fees": [
      {
        "name": "Frais de virement",
        "amount": 2500.00,
        "currency": "XOF",
        "deducted_from_disbursement": true
      }
    ],
    "net_disbursed_amount": 22500.00,
    "approved_by": "user458",
    "approver_name": "Marie Martin",
    "notes": "Demande approuvée, déboursement prévu pour le 28/07/2025",
    "updated_at": "2025-07-25T21:00:00.000Z"
  }
}
```

### Rejet d'une demande de déboursement

Rejette une demande de déboursement en attente.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/reject`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `disbursementId` : Identifiant unique du déboursement

**Corps de la requête** :

```json
{
  "rejection_reason": "Documentation insuffisante",
  "notes": "Les factures proforma fournies ne correspondent pas aux spécifications du projet approuvé.",
  "required_actions": "Fournir des factures proforma détaillées correspondant au projet d'investissement validé."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "disbursement2",
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "rejection_date": "2025-07-25T21:15:00.000Z",
    "status": "rejected",
    "rejection_reason": "Documentation insuffisante",
    "rejected_by": "user458",
    "rejector_name": "Marie Martin",
    "notes": "Les factures proforma fournies ne correspondent pas aux spécifications du projet approuvé.",
    "required_actions": "Fournir des factures proforma détaillées correspondant au projet d'investissement validé.",
    "updated_at": "2025-07-25T21:15:00.000Z"
  }
}
```

### Exécution d'un déboursement

Marque un déboursement approuvé comme exécuté.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/execute`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `disbursementId` : Identifiant unique du déboursement

**Corps de la requête** :

```json
{
  "execution_date": "2025-07-28",
  "reference": "TRX-87654321",
  "documents": [
    {
      "name": "Preuve de virement",
      "type": "transfer_proof",
      "content": "base64_encoded_content",
      "contentType": "application/pdf"
    }
  ],
  "notes": "Virement exécuté via le système bancaire"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "disbursement2",
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "disbursement_date": "2025-07-28T00:00:00.000Z",
    "execution_date": "2025-07-28T00:00:00.000Z",
    "amount": 25000.00,
    "currency": "XOF",
    "net_disbursed_amount": 22500.00,
    "status": "executed",
    "method": "bank_transfer",
    "reference": "TRX-87654321",
    "executed_by": "user459",
    "executor_name": "Jean Kouassi",
    "documents": [
      {
        "id": "doc3",
        "name": "Preuve de virement",
        "type": "transfer_proof",
        "url": "https://example.com/documents/preuve-virement-456.pdf",
        "created_at": "2025-07-28T09:30:00.000Z"
      }
    ],
    "notes": "Virement exécuté via le système bancaire",
    "updated_at": "2025-07-28T09:30:00.000Z"
  }
}
```

### Annulation d'un déboursement

Annule un déboursement approuvé mais non encore exécuté.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/cancel`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `disbursementId` : Identifiant unique du déboursement

**Corps de la requête** :

```json
{
  "cancellation_reason": "Annulation à la demande du client",
  "notes": "Le client a décidé de reporter ce déboursement au mois prochain."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "disbursement2",
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "cancellation_date": "2025-07-26T10:00:00.000Z",
    "status": "canceled",
    "cancellation_reason": "Annulation à la demande du client",
    "canceled_by": "user456",
    "canceler_name": "Pierre Dubois",
    "notes": "Le client a décidé de reporter ce déboursement au mois prochain.",
    "updated_at": "2025-07-26T10:00:00.000Z"
  }
}
```

### Ajout d'un document à un déboursement

Ajoute un nouveau document à un déboursement existant.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/documents`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `disbursementId` : Identifiant unique du déboursement

**Corps de la requête** :

```json
{
  "name": "Confirmation de réception",
  "type": "receipt_confirmation",
  "content": "base64_encoded_content",
  "contentType": "application/pdf",
  "description": "Confirmation de réception des fonds signée par le client"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "doc4",
    "name": "Confirmation de réception",
    "type": "receipt_confirmation",
    "url": "https://example.com/documents/confirmation-reception-123.pdf",
    "created_at": "2025-07-29T14:30:00.000Z"
  }
}
```

### Déboursement par tranches pour un contrat

Crée un plan de déboursement par tranches pour un contrat de crédit.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/schedule`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "total_amount": 100000.00,
  "currency": "XOF",
  "method": "bank_transfer",
  "transfer_details": {
    "bank_name": "Ecobank",
    "account_number": "CI123456789012345",
    "account_name": "Entreprise ABC",
    "swift_code": "ECOCCIAB",
    "bank_address": "Avenue Houdaille, Plateau, Abidjan"
  },
  "tranches": [
    {
      "amount": 50000.00,
      "scheduled_date": "2025-08-01",
      "description": "Première tranche - Initial",
      "prerequisites": [
        {
          "description": "Contrat signé et validé",
          "required": true
        },
        {
          "description": "Garanties validées",
          "required": true
        }
      ]
    },
    {
      "amount": 30000.00,
      "scheduled_date": "2025-09-01",
      "description": "Deuxième tranche - Phase intermédiaire",
      "prerequisites": [
        {
          "description": "Rapport d'avancement phase 1",
          "required": true
        },
        {
          "description": "Factures justificatives phase 1",
          "required": true
        }
      ]
    },
    {
      "amount": 20000.00,
      "scheduled_date": "2025-10-01",
      "description": "Troisième tranche - Phase finale",
      "prerequisites": [
        {
          "description": "Rapport d'avancement phase 2",
          "required": true
        },
        {
          "description": "Inspection sur site",
          "required": true
        }
      ]
    }
  ],
  "notes": "Plan de déboursement pour le projet d'expansion"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "contract_id": "contract123",
    "contract_number": "CONT-2025-001",
    "total_amount": 100000.00,
    "currency": "XOF",
    "method": "bank_transfer",
    "schedule_id": "schedule123",
    "tranches": [
      {
        "id": "tranche1",
        "amount": 50000.00,
        "scheduled_date": "2025-08-01T00:00:00.000Z",
        "description": "Première tranche - Initial",
        "status": "pending",
        "disbursement_id": null
      },
      {
        "id": "tranche2",
        "amount": 30000.00,
        "scheduled_date": "2025-09-01T00:00:00.000Z",
        "description": "Deuxième tranche - Phase intermédiaire",
        "status": "pending",
        "disbursement_id": null
      },
      {
        "id": "tranche3",
        "amount": 20000.00,
        "scheduled_date": "2025-10-01T00:00:00.000Z",
        "description": "Troisième tranche - Phase finale",
        "status": "pending",
        "disbursement_id": null
      }
    ],
    "created_at": "2025-07-30T10:00:00.000Z",
    "updated_at": "2025-07-30T10:00:00.000Z"
  }
}
```

### Statistiques des déboursements par contrat

Récupère des statistiques sur les déboursements d'un contrat spécifique.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/stats`

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
    "contract_amount": 100000.00,
    "total_disbursed": 75000.00,
    "remaining_amount": 25000.00,
    "disbursement_progress": 75.0,
    "disbursement_count": 2,
    "first_disbursement_date": "2025-01-15T09:30:00.000Z",
    "last_disbursement_date": "2025-07-28T00:00:00.000Z",
    "disbursements": [
      {
        "id": "disbursement1",
        "date": "2025-01-15T09:30:00.000Z",
        "amount": 50000.00,
        "status": "executed",
        "percentage": 50.0
      },
      {
        "id": "disbursement2",
        "date": "2025-07-28T00:00:00.000Z",
        "amount": 25000.00,
        "status": "executed",
        "percentage": 25.0
      }
    ],
    "schedule": {
      "id": "schedule123",
      "tranches_count": 3,
      "tranches_completed": 2,
      "next_scheduled_date": "2025-10-01T00:00:00.000Z",
      "next_scheduled_amount": 20000.00
    }
  }
}
```

### Statistiques des déboursements par portefeuille

Récupère des statistiques sur les déboursements d'un portefeuille traditionnel.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/disbursements/stats`

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
    "contracts_with_disbursements": 28,
    "total_approved_amount": 2750000.00,
    "total_disbursed_amount": 2100000.00,
    "disbursement_rate": 76.36,
    "disbursement_count": 42,
    "disbursements_by_method": [
      {
        "method": "bank_transfer",
        "count": 36,
        "amount": 1950000.00,
        "percentage": 92.86
      },
      {
        "method": "mobile_money",
        "count": 4,
        "amount": 100000.00,
        "percentage": 4.76
      },
      {
        "method": "check",
        "count": 2,
        "amount": 50000.00,
        "percentage": 2.38
      }
    ],
    "monthly_trend": [
      {
        "period": "2025-01",
        "count": 8,
        "amount": 550000.00
      },
      {
        "period": "2025-02",
        "count": 6,
        "amount": 420000.00
      },
      {
        "period": "2025-03",
        "count": 5,
        "amount": 350000.00
      },
      {
        "period": "2025-04",
        "count": 7,
        "amount": 380000.00
      },
      {
        "period": "2025-05",
        "count": 5,
        "amount": 200000.00
      },
      {
        "period": "2025-06",
        "count": 6,
        "amount": 150000.00
      },
      {
        "period": "2025-07",
        "count": 5,
        "amount": 50000.00
      }
    ],
    "processing_time": {
      "request_to_approval": 1.2,
      "approval_to_execution": 0.8,
      "total": 2.0
    },
    "pending_disbursements": {
      "count": 5,
      "amount": 200000.00
    },
    "scheduled_disbursements": {
      "count": 8,
      "amount": 450000.00
    }
  }
}
```

## Modèles de données

### Déboursement
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du déboursement |
| contract_id | string | Identifiant du contrat de crédit |
| contract_number | string | Numéro de référence du contrat |
| client_id | string | Identifiant du client |
| company_name | string | Nom de l'entreprise cliente |
| request_date | string | Date de la demande (format ISO) |
| approval_date | string | Date d'approbation (format ISO) |
| disbursement_date | string | Date prévue du déboursement (format ISO) |
| execution_date | string | Date d'exécution effective (format ISO) |
| amount | number | Montant du déboursement |
| currency | string | Devise du montant |
| status | string | Statut ('pending', 'approved', 'executed', 'rejected', 'canceled') |
| method | string | Méthode de paiement utilisée |
| reference | string | Référence de la transaction |
| transfer_details | object | Détails du compte bancaire ou autre moyen de transfert |
| fees | array | Frais associés au déboursement |
| net_disbursed_amount | number | Montant net déboursé après déduction des frais |
| requested_by | string | Identifiant de l'utilisateur ayant demandé le déboursement |
| requester_name | string | Nom de l'utilisateur ayant demandé le déboursement |
| approved_by | string | Identifiant de l'utilisateur ayant approuvé le déboursement |
| approver_name | string | Nom de l'utilisateur ayant approuvé le déboursement |
| executed_by | string | Identifiant de l'utilisateur ayant exécuté le déboursement |
| executor_name | string | Nom de l'utilisateur ayant exécuté le déboursement |
| rejected_by | string | Identifiant de l'utilisateur ayant rejeté le déboursement |
| rejector_name | string | Nom de l'utilisateur ayant rejeté le déboursement |
| canceled_by | string | Identifiant de l'utilisateur ayant annulé le déboursement |
| canceler_name | string | Nom de l'utilisateur ayant annulé le déboursement |
| rejection_reason | string | Raison du rejet (si applicable) |
| cancellation_reason | string | Raison de l'annulation (si applicable) |
| notes | string | Notes additionnelles sur le déboursement |
| required_actions | string | Actions requises (en cas de rejet) |
| prerequisites | array | Conditions préalables au déboursement |
| documents | array | Documents associés au déboursement |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |

### Détails de transfert
| Champ | Type | Description |
|-------|------|-------------|
| bank_name | string | Nom de la banque |
| account_number | string | Numéro de compte |
| account_name | string | Nom du titulaire du compte |
| swift_code | string | Code SWIFT/BIC de la banque |
| bank_address | string | Adresse de la banque |
| correspondent_bank | string | Banque correspondante (si applicable) |
| provider | string | Fournisseur du service (pour mobile money) |
| phone_number | string | Numéro de téléphone (pour mobile money) |

### Frais
| Champ | Type | Description |
|-------|------|-------------|
| name | string | Nom des frais |
| amount | number | Montant des frais |
| currency | string | Devise des frais |
| deducted_from_disbursement | boolean | Indique si les frais sont déduits du montant du déboursement |

### Prérequis
| Champ | Type | Description |
|-------|------|-------------|
| description | string | Description du prérequis |
| status | string | Statut ('pending', 'completed') |
| required | boolean | Indique si le prérequis est obligatoire |
| completed_at | string | Date de complétion (format ISO) |

### Document
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du document |
| name | string | Nom du document |
| type | string | Type de document |
| url | string | URL d'accès au document |
| created_at | string | Date de création/téléchargement (format ISO) |

### Plan de déboursement
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du plan de déboursement |
| contract_id | string | Identifiant du contrat de crédit |
| total_amount | number | Montant total à débourser |
| currency | string | Devise du montant |
| method | string | Méthode de paiement à utiliser |
| tranches | array | Liste des tranches de déboursement |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |

### Tranche de déboursement
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de la tranche |
| amount | number | Montant de la tranche |
| scheduled_date | string | Date prévue pour le déboursement (format ISO) |
| description | string | Description de la tranche |
| status | string | Statut ('pending', 'processing', 'disbursed', 'canceled') |
| disbursement_id | string | Identifiant du déboursement associé (si applicable) |
| prerequisites | array | Conditions préalables au déboursement de cette tranche |
