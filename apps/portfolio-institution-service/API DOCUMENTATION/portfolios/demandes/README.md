# API des Demandes de Financement - Portefeuille Traditionnel

Cette API permet de gérer les demandes de financement dans le cadre des portefeuilles traditionnels, incluant la création, la consultation, l'analyse, l'approbation ou le rejet des demandes de crédit.

## Points d'accès

### Liste des demandes de financement

Récupère la liste des demandes de financement pour un portefeuille traditionnel spécifique.

**Endpoint** : `GET /portfolios/traditional/funding-requests`

**Paramètres de requête** :
- `portfolioId` (optionnel) : Identifiant unique du portefeuille traditionnel
- `status` (optionnel) : Filtre par statut (pending, under_review, approved, rejected, canceled, disbursed)
- `clientId` (optionnel) : Filtre par identifiant du client
- `productType` (optionnel) : Filtre par type de produit
- `dateFrom` (optionnel) : Filtre par date de création (début)
- `dateTo` (optionnel) : Filtre par date de création (fin)
- `search` (optionnel) : Recherche textuelle (numéro de demande, nom du client)
- `sortBy` (optionnel) : Trier par (created_at, amount, client_name)
- `sortOrder` (optionnel) : Ordre de tri (asc, desc)

**Réponse réussie** (200 OK) :

```json
[
  {
    "id": "FR-00001",
    "portfolio_id": "TP-00001",
    "request_number": "REQ-2025-001",
    "client_id": "CL-00001",
    "company_name": "Entreprise ABC",
    "product_type": "Crédit PME",
    "amount": 50000.00,
    "currency": "XOF",
    "status": "approved",
    "created_at": "2025-01-05T08:00:00.000Z",
    "updated_at": "2025-01-08T14:30:00.000Z",
    "assigned_to": "USER-00001",
    "contract_id": "CC-00001"
  },
  {
    "id": "FR-00002",
    "portfolio_id": "TP-00001",
    "request_number": "REQ-2025-002",
    "client_id": "CL-00002",
    "company_name": "Société XYZ",
    "product_type": "Crédit Investissement",
    "amount": 75000.00,
    "currency": "XOF",
    "status": "under_review",
    "created_at": "2025-01-12T10:15:00.000Z",
    "updated_at": "2025-01-14T09:20:00.000Z",
    "assigned_to": "USER-00002",
    "contract_id": null
  }
]
```

### Détails d'une demande de financement

Récupère les détails complets d'une demande de financement spécifique.

**Endpoint** : `GET /portfolios/traditional/funding-requests/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "client_id": "CL-00001",
  "company_name": "Entreprise ABC",
  "product_type": "Crédit PME",
  "amount": 50000.00,
  "currency": "XOF",
  "purpose": "Achat de matériel et extension d'activité",
  "duration": 12,
  "duration_unit": "months",
  "proposed_start_date": "2025-01-15T00:00:00.000Z",
  "status": "approved",
  "status_date": "2025-01-08T14:30:00.000Z",
  "assigned_to": "USER-00001",
  "financial_data": {
    "annual_revenue": 250000.00,
    "net_profit": 75000.00,
    "existing_debts": 30000.00,
    "cash_flow": 8000.00,
    "assets": 180000.00,
    "liabilities": 60000.00
  },
  "proposed_guarantees": [
    {
      "type": "real_estate",
      "description": "Terrain situé à Cocody, parcelle 123",
      "estimated_value": 80000.00,
      "currency": "XOF"
    },
    {
      "type": "equipment",
      "description": "Matériel industriel",
      "estimated_value": 25000.00,
      "currency": "XOF"
    }
  ],
  "documents": [
    {
      "id": "DOC-00001",
      "name": "Business Plan",
      "type": "business_plan",
      "url": "https://example.com/documents/business-plan-abc.pdf",
      "created_at": "2025-01-05T08:05:00.000Z"
    },
    {
      "id": "DOC-00002",
      "name": "États financiers",
      "type": "financial_statements",
      "url": "https://example.com/documents/etats-financiers-abc.pdf",
      "created_at": "2025-01-05T08:10:00.000Z"
    }
  ],
  "risk_analysis": {
    "credit_score": 85,
    "risk_level": "low",
    "debt_service_ratio": 0.30,
    "analysis_date": "2025-01-07T11:20:00.000Z",
    "analyst_id": "USER-00001",
    "recommended_action": "approve",
    "recommended_amount": 50000.00,
    "recommended_duration": 12,
    "recommended_rate": 12.5,
    "comments": "Client avec un historique de crédit solide et une bonne gestion financière."
  },
  "approval_details": {
    "approved_by": "USER-00003",
    "approval_date": "2025-01-08T14:30:00.000Z",
    "approved_amount": 50000.00,
    "approved_duration": 12,
    "approved_rate": 12.5,
    "conditions": "Déblocage après validation des garanties."
  },
  "contract_id": "CC-00001",
  "created_at": "2025-01-05T08:00:00.000Z",
  "updated_at": "2025-01-08T14:30:00.000Z"
}
```

### Création d'une demande de financement

Crée une nouvelle demande de financement.

**Endpoint** : `POST /portfolios/traditional/funding-requests`

**Corps de la requête** :

```json
{
  "portfolio_id": "TP-00001",
  "client_id": "CL-00001",
  "product_type": "Crédit PME",
  "amount": 50000.00,
  "currency": "XOF",
  "purpose": "Achat de matériel et extension d'activité",
  "duration": 12,
  "duration_unit": "months",
  "proposed_start_date": "2025-01-15",
  "financial_data": {
    "annual_revenue": 250000.00,
    "net_profit": 75000.00,
    "existing_debts": 30000.00,
    "cash_flow": 8000.00,
    "assets": 180000.00,
    "liabilities": 60000.00
  },
  "proposed_guarantees": [
    {
      "type": "real_estate",
      "description": "Terrain situé à Cocody, parcelle 123",
      "estimated_value": 80000.00,
      "currency": "XOF"
    }
  ]
}
```

**Réponse réussie** (201 Created) :

```json
{
  "id": "FR-00003",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-003",
  "client_id": "CL-00001",
  "company_name": "Entreprise ABC",
  "product_type": "Crédit PME",
  "amount": 50000.00,
  "currency": "XOF",
  "status": "pending",
  "status_date": "2025-07-25T12:00:00.000Z",
  "created_at": "2025-07-25T12:00:00.000Z",
  "updated_at": "2025-07-25T12:00:00.000Z"
}
```

### Mise à jour d'une demande de financement

Met à jour les informations d'une demande de financement existante.

**Endpoint** : `PUT /portfolios/traditional/funding-requests/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "amount": 55000.00,
  "purpose": "Achat de matériel, extension d'activité et recrutement",
  "duration": 15,
  "financial_data": {
    "annual_revenue": 260000.00,
    "net_profit": 78000.00
  }
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "client_id": "CL-00001",
  "company_name": "Entreprise ABC",
  "product_type": "Crédit PME",
  "amount": 55000.00,
  "currency": "XOF",
  "purpose": "Achat de matériel, extension d'activité et recrutement",
  "duration": 15,
  "duration_unit": "months",
  "status": "pending",
  "updated_at": "2025-07-25T12:15:00.000Z"
}
```

### Assigner une demande pour analyse

Assigne une demande de financement à un analyste pour évaluation.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/assign`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "assigned_to": "USER-00001",
  "comment": "Merci d'analyser cette demande prioritairement"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "status": "under_review",
  "assigned_to": "USER-00001",
  "updated_at": "2025-07-25T12:30:00.000Z"
}
```

### Soumettre une analyse de risque

Soumet l'analyse de risque pour une demande de financement.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/risk-analysis`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "credit_score": 85,
  "risk_level": "low",
  "debt_service_ratio": 0.30,
  "recommended_action": "approve",
  "recommended_amount": 55000.00,
  "recommended_duration": 15,
  "recommended_rate": 12.5,
  "comments": "Client avec un historique de crédit solide et une bonne gestion financière."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "status": "under_review",
  "risk_analysis": {
    "credit_score": 85,
    "risk_level": "low",
    "debt_service_ratio": 0.30,
    "analysis_date": "2025-07-25T13:00:00.000Z",
    "analyst_id": "USER-00001",
    "recommended_action": "approve",
    "recommended_amount": 55000.00,
    "recommended_duration": 15,
    "recommended_rate": 12.5,
    "comments": "Client avec un historique de crédit solide et une bonne gestion financière."
  },
  "updated_at": "2025-07-25T13:00:00.000Z"
}
```

### Approbation d'une demande

Approuve une demande de financement après analyse.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/approve`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "approved_amount": 55000.00,
  "approved_duration": 15,
  "approved_rate": 12.5,
  "conditions": "Déblocage après validation des garanties.",
  "comments": "Demande approuvée selon les recommandations de l'analyste."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "status": "approved",
  "approval_details": {
    "approved_by": "USER-00003",
    "approval_date": "2025-07-25T13:30:00.000Z",
    "approved_amount": 55000.00,
    "approved_duration": 15,
    "approved_rate": 12.5,
    "conditions": "Déblocage après validation des garanties."
  },
  "updated_at": "2025-07-25T13:30:00.000Z"
}
```

### Rejet d'une demande

Rejette une demande de financement.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/reject`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "reason": "Ratio d'endettement trop élevé",
  "comments": "Le client présente un ratio d'endettement supérieur à nos critères d'acceptation.",
  "suggestions": "Possibilité de soumettre une nouvelle demande avec un montant réduit ou des garanties supplémentaires."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "status": "rejected",
  "rejection_details": {
    "rejected_by": "USER-00003",
    "rejection_date": "2025-07-25T14:00:00.000Z",
    "reason": "Ratio d'endettement trop élevé",
    "comments": "Le client présente un ratio d'endettement supérieur à nos critères d'acceptation.",
    "suggestions": "Possibilité de soumettre une nouvelle demande avec un montant réduit ou des garanties supplémentaires."
  },
  "updated_at": "2025-07-25T14:00:00.000Z"
}
```

### Annulation d'une demande

Annule une demande de financement en cours.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/cancel`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "reason": "Annulation à la demande du client",
  "comments": "Le client a trouvé un autre moyen de financement."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "status": "canceled",
  "cancellation_details": {
    "canceled_by": "USER-00003",
    "cancellation_date": "2025-07-25T14:30:00.000Z",
    "reason": "Annulation à la demande du client",
    "comments": "Le client a trouvé un autre moyen de financement."
  },
  "updated_at": "2025-07-25T14:30:00.000Z"
}
```

### Ajout d'un document à une demande

Ajoute un nouveau document à une demande de financement existante.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/documents`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "name": "Bilan actualisé",
  "type": "updated_balance_sheet",
  "content": "base64_encoded_content",
  "contentType": "application/pdf",
  "description": "Bilan actualisé pour le premier semestre 2025"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "id": "DOC-00003",
  "name": "Bilan actualisé",
  "type": "updated_balance_sheet",
  "url": "https://example.com/documents/bilan-actualise-abc.pdf",
  "created_at": "2025-07-25T15:30:00.000Z"
}
```

### Création d'un contrat à partir d'une demande

Crée un contrat de crédit basé sur une demande de financement approuvée.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/create-contract`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "start_date": "2025-08-01",
  "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution..."
}
```

**Réponse réussie** (201 Created) :

```json
{
  "contract_id": "CC-00001",
  "contract_number": "CONT-2025-001"
}
```

### Statistiques des demandes par portefeuille

Récupère des statistiques sur les demandes de financement d'un portefeuille traditionnel.

**Endpoint** : `GET /portfolios/traditional/{portfolioId}/funding-requests/stats`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel

**Réponse réussie** (200 OK) :

```json
{
  "total_requests": 35,
  "by_status": [
    {
      "status": "approved",
      "count": 15
    },
    {
      "status": "pending",
      "count": 8
    }
  ]
}
```

## Modèles de données

### Demande de financement
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de la demande |
| portfolio_id | string | Identifiant du portefeuille traditionnel |
| request_number | string | Numéro de référence de la demande |
| client_id | string | Identifiant du client |
| company_name | string | Nom de l'entreprise cliente |
| product_type | string | Type de produit financier demandé |
| amount | number | Montant demandé |
| currency | string | Devise du montant |
| purpose | string | Objet du financement |
| duration | number | Durée souhaitée du financement |
| duration_unit | string | Unité de la durée (months, years) |
| proposed_start_date | string | Date de début souhaitée (format ISO) |
| status | string | Statut de la demande ('pending', 'under_review', 'approved', 'rejected', 'canceled', 'disbursed') |
| status_date | string | Date du dernier changement de statut |
| assigned_to | string | Identifiant de l'analyste assigné |
| financial_data | object | Données financières fournies |
| proposed_guarantees | array | Garanties proposées |
| documents | array | Documents fournis avec la demande |
| risk_analysis | object | Résultats de l'analyse de risque |
| approval_details | object | Détails de l'approbation (si applicable) |
| rejection_details | object | Détails du rejet (si applicable) |
| cancellation_details | object | Détails de l'annulation (si applicable) |
| contract_id | string | Identifiant du contrat créé (si applicable) |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |

### Données financières
| Champ | Type | Description |
|-------|------|-------------|
| annual_revenue | number | Chiffre d'affaires annuel |
| net_profit | number | Bénéfice net |
| existing_debts | number | Dettes existantes |
| cash_flow | number | Flux de trésorerie mensuel |
| assets | number | Valeur totale des actifs |
| liabilities | number | Valeur totale des passifs |

### Garantie proposée
| Champ | Type | Description |
|-------|------|-------------|
| type | string | Type de garantie (ex: "real_estate", "equipment") |
| description | string | Description détaillée de la garantie |
| estimated_value | number | Valeur estimée de la garantie |
| currency | string | Devise de la valeur |

### Document
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du document |
| name | string | Nom du document |
| type | string | Type de document (ex: "business_plan", "financial_statements") |
| url | string | URL d'accès au document |
| created_at | string | Date de création/téléchargement (format ISO) |

### Analyse de risque
| Champ | Type | Description |
|-------|------|-------------|
| credit_score | number | Score de crédit attribué (0-100) |
| risk_level | string | Niveau de risque évalué (low, medium, high) |
| debt_service_ratio | number | Ratio de service de la dette calculé |
| analysis_date | string | Date de l'analyse (format ISO) |
| analyst_id | string | Identifiant de l'analyste |
| recommended_action | string | Action recommandée (approve, reject) |
| recommended_amount | number | Montant recommandé pour approbation |
| recommended_duration | number | Durée recommandée |
| recommended_rate | number | Taux d'intérêt recommandé |
| comments | string | Commentaires de l'analyste |

### Détails d'approbation
| Champ | Type | Description |
|-------|------|-------------|
| approved_by | string | Identifiant de l'approbateur |
| approval_date | string | Date d'approbation (format ISO) |
| approved_amount | number | Montant approuvé |
| approved_duration | number | Durée approuvée |
| approved_rate | number | Taux d'intérêt approuvé |
| conditions | string | Conditions particulières d'approbation |
| comments | string | Commentaires de l'approbateur |

### Détails de rejet
| Champ | Type | Description |
|-------|------|-------------|
| rejected_by | string | Identifiant de la personne ayant rejeté la demande |
| rejection_date | string | Date de rejet (format ISO) |
| reason | string | Raison principale du rejet |
| comments | string | Commentaires détaillés |
| suggestions | string | Suggestions pour une éventuelle nouvelle demande |

### Détails d'annulation
| Champ | Type | Description |
|-------|------|-------------|
| canceled_by | string | Identifiant de la personne ayant annulé la demande |
| cancellation_date | string | Date d'annulation (format ISO) |
| reason | string | Raison de l'annulation |
| comments | string | Commentaires détaillés |
