# API des Garanties - Portefeuille Traditionnel

Cette API permet de gérer les garanties associées aux contrats de crédit dans le cadre des portefeuilles traditionnels, incluant la création, la consultation, la mise à jour et l'évaluation des garanties.

## Points d'accès

### Liste des garanties d'un contrat

Récupère la liste des garanties associées à un contrat de crédit spécifique.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/guarantees`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "guarantee1",
      "contract_id": "contract123",
      "type": "real_estate",
      "description": "Terrain situé à Cocody, parcelle 123",
      "value": 80000.00,
      "currency": "XOF",
      "coverage_ratio": 160,
      "status": "validated",
      "validation_date": "2025-01-12T14:30:00.000Z",
      "validator_id": "user456",
      "validator_name": "Pierre Dubois",
      "last_valuation_date": "2025-01-10T09:15:00.000Z",
      "next_valuation_date": "2026-01-10T00:00:00.000Z",
      "documents": [
        {
          "id": "doc1",
          "name": "Titre foncier",
          "type": "property_title",
          "url": "https://example.com/documents/titre-foncier-123.pdf",
          "created_at": "2025-01-05T10:30:00.000Z"
        },
        {
          "id": "doc2",
          "name": "Évaluation immobilière",
          "type": "valuation_report",
          "url": "https://example.com/documents/evaluation-123.pdf",
          "created_at": "2025-01-10T09:20:00.000Z"
        }
      ],
      "created_at": "2025-01-05T08:00:00.000Z",
      "updated_at": "2025-01-12T14:30:00.000Z"
    },
    {
      "id": "guarantee2",
      "contract_id": "contract123",
      "type": "equipment",
      "description": "Matériel industriel",
      "value": 25000.00,
      "currency": "XOF",
      "coverage_ratio": 50,
      "status": "validated",
      "validation_date": "2025-01-12T14:35:00.000Z",
      "validator_id": "user456",
      "validator_name": "Pierre Dubois",
      "last_valuation_date": "2025-01-07T11:30:00.000Z",
      "next_valuation_date": "2026-01-07T00:00:00.000Z",
      "documents": [
        {
          "id": "doc3",
          "name": "Facture d'achat",
          "type": "invoice",
          "url": "https://example.com/documents/facture-456.pdf",
          "created_at": "2025-01-06T15:45:00.000Z"
        }
      ],
      "created_at": "2025-01-06T15:40:00.000Z",
      "updated_at": "2025-01-12T14:35:00.000Z"
    }
  ]
}
```

### Détails d'une garantie

Récupère les détails complets d'une garantie spécifique.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/guarantees/{guaranteeId}`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `guaranteeId` : Identifiant unique de la garantie

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "guarantee1",
    "contract_id": "contract123",
    "type": "real_estate",
    "description": "Terrain situé à Cocody, parcelle 123",
    "value": 80000.00,
    "currency": "XOF",
    "coverage_ratio": 160,
    "status": "validated",
    "validation_date": "2025-01-12T14:30:00.000Z",
    "validator_id": "user456",
    "validator_name": "Pierre Dubois",
    "last_valuation_date": "2025-01-10T09:15:00.000Z",
    "next_valuation_date": "2026-01-10T00:00:00.000Z",
    "location": {
      "address": "Rue des Palmiers, Cocody",
      "city": "Abidjan",
      "country": "CI",
      "coordinates": {
        "latitude": 5.3599517,
        "longitude": -4.0082563
      }
    },
    "details": {
      "property_type": "land",
      "surface_area": 1000,
      "surface_unit": "m2",
      "title_number": "TF-12345-AB",
      "registry_office": "Bureau de la Conservation Foncière d'Abidjan"
    },
    "documents": [
      {
        "id": "doc1",
        "name": "Titre foncier",
        "type": "property_title",
        "url": "https://example.com/documents/titre-foncier-123.pdf",
        "created_at": "2025-01-05T10:30:00.000Z"
      },
      {
        "id": "doc2",
        "name": "Évaluation immobilière",
        "type": "valuation_report",
        "url": "https://example.com/documents/evaluation-123.pdf",
        "created_at": "2025-01-10T09:20:00.000Z"
      }
    ],
    "valuation_history": [
      {
        "date": "2025-01-10T09:15:00.000Z",
        "value": 80000.00,
        "currency": "XOF",
        "method": "expert_appraisal",
        "appraiser": "Cabinet XYZ Évaluateurs",
        "report_document_id": "doc2"
      }
    ],
    "created_at": "2025-01-05T08:00:00.000Z",
    "updated_at": "2025-01-12T14:30:00.000Z"
  }
}
```

### Création d'une garantie

Ajoute une nouvelle garantie à un contrat de crédit existant.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/guarantees`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit

**Corps de la requête** :

```json
{
  "type": "real_estate",
  "description": "Terrain situé à Cocody, parcelle 123",
  "value": 80000.00,
  "currency": "XOF",
  "location": {
    "address": "Rue des Palmiers, Cocody",
    "city": "Abidjan",
    "country": "CI",
    "coordinates": {
      "latitude": 5.3599517,
      "longitude": -4.0082563
    }
  },
  "details": {
    "property_type": "land",
    "surface_area": 1000,
    "surface_unit": "m2",
    "title_number": "TF-12345-AB",
    "registry_office": "Bureau de la Conservation Foncière d'Abidjan"
  },
  "documents": [
    {
      "name": "Titre foncier",
      "type": "property_title",
      "content": "base64_encoded_content",
      "contentType": "application/pdf"
    }
  ]
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "guarantee1",
    "contract_id": "contract123",
    "type": "real_estate",
    "description": "Terrain situé à Cocody, parcelle 123",
    "value": 80000.00,
    "currency": "XOF",
    "coverage_ratio": 160,
    "status": "pending_validation",
    "created_at": "2025-07-25T15:45:00.000Z",
    "updated_at": "2025-07-25T15:45:00.000Z"
  }
}
```

### Mise à jour d'une garantie

Met à jour les informations d'une garantie existante.

**Endpoint** : `PUT /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/guarantees/{guaranteeId}`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `guaranteeId` : Identifiant unique de la garantie

**Corps de la requête** :

```json
{
  "description": "Terrain situé à Cocody, parcelle 123 - Lot B",
  "value": 85000.00,
  "details": {
    "title_number": "TF-12345-AB-B",
    "surface_area": 900
  }
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "guarantee1",
    "contract_id": "contract123",
    "type": "real_estate",
    "description": "Terrain situé à Cocody, parcelle 123 - Lot B",
    "value": 85000.00,
    "currency": "XOF",
    "coverage_ratio": 170,
    "status": "pending_validation",
    "updated_at": "2025-07-25T16:00:00.000Z"
  }
}
```

### Validation d'une garantie

Valide une garantie après vérification.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/guarantees/{guaranteeId}/validate`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `guaranteeId` : Identifiant unique de la garantie

**Corps de la requête** :

```json
{
  "validator_notes": "Documents vérifiés et conformes.",
  "value_adjustment": 82000.00
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "guarantee1",
    "contract_id": "contract123",
    "status": "validated",
    "value": 82000.00,
    "coverage_ratio": 164,
    "validation_date": "2025-07-25T16:15:00.000Z",
    "validator_id": "user456",
    "validator_name": "Pierre Dubois",
    "updated_at": "2025-07-25T16:15:00.000Z"
  }
}
```

### Rejet d'une garantie

Rejette une garantie qui ne répond pas aux critères.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/guarantees/{guaranteeId}/reject`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `guaranteeId` : Identifiant unique de la garantie

**Corps de la requête** :

```json
{
  "rejection_reason": "Titre de propriété non conforme",
  "rejection_notes": "Le titre foncier présente des irrégularités qui doivent être corrigées."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "guarantee1",
    "contract_id": "contract123",
    "status": "rejected",
    "rejection_reason": "Titre de propriété non conforme",
    "rejection_date": "2025-07-25T16:30:00.000Z",
    "updated_at": "2025-07-25T16:30:00.000Z"
  }
}
```

### Réévaluation d'une garantie

Enregistre une nouvelle évaluation de la valeur d'une garantie.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/guarantees/{guaranteeId}/revaluate`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `guaranteeId` : Identifiant unique de la garantie

**Corps de la requête** :

```json
{
  "new_value": 88000.00,
  "currency": "XOF",
  "valuation_date": "2025-07-25",
  "method": "expert_appraisal",
  "appraiser": "Cabinet XYZ Évaluateurs",
  "notes": "Augmentation de la valeur due au développement de la zone",
  "document": {
    "name": "Rapport d'évaluation 2025",
    "type": "valuation_report",
    "content": "base64_encoded_content",
    "contentType": "application/pdf"
  }
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "guarantee1",
    "contract_id": "contract123",
    "value": 88000.00,
    "currency": "XOF",
    "coverage_ratio": 176,
    "last_valuation_date": "2025-07-25T00:00:00.000Z",
    "next_valuation_date": "2026-07-25T00:00:00.000Z",
    "valuation_history": [
      {
        "date": "2025-01-10T09:15:00.000Z",
        "value": 80000.00,
        "currency": "XOF",
        "method": "expert_appraisal",
        "appraiser": "Cabinet XYZ Évaluateurs",
        "report_document_id": "doc2"
      },
      {
        "date": "2025-07-25T00:00:00.000Z",
        "value": 88000.00,
        "currency": "XOF",
        "method": "expert_appraisal",
        "appraiser": "Cabinet XYZ Évaluateurs",
        "report_document_id": "doc4",
        "notes": "Augmentation de la valeur due au développement de la zone"
      }
    ],
    "updated_at": "2025-07-25T16:45:00.000Z"
  }
}
```

### Ajout d'un document à une garantie

Ajoute un nouveau document à une garantie existante.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/contracts/{contractId}/guarantees/{guaranteeId}/documents`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `contractId` : Identifiant unique du contrat de crédit
- `guaranteeId` : Identifiant unique de la garantie

**Corps de la requête** :

```json
{
  "name": "Certificat d'enregistrement",
  "type": "registration_certificate",
  "content": "base64_encoded_content",
  "contentType": "application/pdf",
  "description": "Certificat d'enregistrement au registre foncier"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "doc5",
    "name": "Certificat d'enregistrement",
    "type": "registration_certificate",
    "url": "https://example.com/documents/certificat-123.pdf",
    "created_at": "2025-07-25T17:00:00.000Z"
  }
}
```

### Liste des types de garanties disponibles

Récupère la liste des types de garanties disponibles pour le portefeuille.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/guarantee-types`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "real_estate",
      "name": "Bien immobilier",
      "description": "Terrains, bâtiments, et autres biens immobiliers",
      "valuation_method": "expert_appraisal",
      "coverage_ratio": 150,
      "required_documents": [
        {
          "type": "property_title",
          "name": "Titre de propriété",
          "required": true
        },
        {
          "type": "valuation_report",
          "name": "Rapport d'évaluation",
          "required": true
        },
        {
          "type": "insurance_certificate",
          "name": "Certificat d'assurance",
          "required": false
        }
      ],
      "revaluation_frequency": "yearly"
    },
    {
      "id": "equipment",
      "name": "Équipement",
      "description": "Machines, véhicules, et autres équipements",
      "valuation_method": "invoice_value",
      "coverage_ratio": 130,
      "required_documents": [
        {
          "type": "invoice",
          "name": "Facture d'achat",
          "required": true
        },
        {
          "type": "technical_specifications",
          "name": "Spécifications techniques",
          "required": false
        },
        {
          "type": "insurance_certificate",
          "name": "Certificat d'assurance",
          "required": true
        }
      ],
      "revaluation_frequency": "semi_annually"
    },
    {
      "id": "inventory",
      "name": "Stock",
      "description": "Marchandises et matières premières",
      "valuation_method": "market_value",
      "coverage_ratio": 120,
      "required_documents": [
        {
          "type": "inventory_list",
          "name": "Liste d'inventaire",
          "required": true
        },
        {
          "type": "storage_certificate",
          "name": "Certificat d'entreposage",
          "required": false
        }
      ],
      "revaluation_frequency": "quarterly"
    },
    {
      "id": "financial_assets",
      "name": "Actifs financiers",
      "description": "Dépôts, obligations, actions et autres actifs financiers",
      "valuation_method": "market_value",
      "coverage_ratio": 110,
      "required_documents": [
        {
          "type": "account_statement",
          "name": "Relevé de compte",
          "required": true
        },
        {
          "type": "ownership_certificate",
          "name": "Certificat de propriété",
          "required": true
        }
      ],
      "revaluation_frequency": "monthly"
    }
  ]
}
```

### Statistiques des garanties par portefeuille

Récupère des statistiques sur les garanties d'un portefeuille traditionnel.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/guarantees/stats`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "total_guarantees_count": 45,
    "total_guarantees_value": 7500000.00,
    "average_coverage_ratio": 148.5,
    "by_type": [
      {
        "type": "real_estate",
        "count": 20,
        "value": 5000000.00,
        "percentage": 66.67
      },
      {
        "type": "equipment",
        "count": 15,
        "value": 1800000.00,
        "percentage": 24.00
      },
      {
        "type": "inventory",
        "count": 8,
        "value": 500000.00,
        "percentage": 6.67
      },
      {
        "type": "financial_assets",
        "count": 2,
        "value": 200000.00,
        "percentage": 2.66
      }
    ],
    "by_status": [
      {
        "status": "validated",
        "count": 38,
        "percentage": 84.44
      },
      {
        "status": "pending_validation",
        "count": 5,
        "percentage": 11.11
      },
      {
        "status": "rejected",
        "count": 2,
        "percentage": 4.45
      }
    ],
    "pending_revaluations": 3,
    "overdue_revaluations": 1
  }
}
```

## Modèles de données

### Garantie
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de la garantie |
| contract_id | string | Identifiant du contrat associé |
| type | string | Type de garantie (ex: "real_estate", "equipment") |
| description | string | Description détaillée de la garantie |
| value | number | Valeur estimée de la garantie |
| currency | string | Devise de la valeur |
| coverage_ratio | number | Ratio de couverture par rapport au montant du crédit (%) |
| status | string | Statut ('pending_validation', 'validated', 'rejected') |
| validation_date | string | Date de validation (format ISO) |
| validator_id | string | Identifiant du validateur |
| validator_name | string | Nom du validateur |
| rejection_reason | string | Raison du rejet (si applicable) |
| rejection_date | string | Date du rejet (si applicable) |
| last_valuation_date | string | Date de la dernière évaluation (format ISO) |
| next_valuation_date | string | Date prévue pour la prochaine évaluation (format ISO) |
| location | object | Informations de localisation (pour biens immobiliers) |
| details | object | Détails spécifiques au type de garantie |
| documents | array | Documents justificatifs associés |
| valuation_history | array | Historique des évaluations |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |

### Type de garantie
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du type de garantie |
| name | string | Nom du type de garantie |
| description | string | Description du type de garantie |
| valuation_method | string | Méthode d'évaluation par défaut |
| coverage_ratio | number | Ratio de couverture minimum recommandé (%) |
| required_documents | array | Documents requis pour ce type de garantie |
| revaluation_frequency | string | Fréquence recommandée pour la réévaluation |

### Document
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du document |
| name | string | Nom du document |
| type | string | Type de document (ex: "property_title", "valuation_report") |
| url | string | URL d'accès au document |
| created_at | string | Date de création/téléchargement (format ISO) |

### Évaluation
| Champ | Type | Description |
|-------|------|-------------|
| date | string | Date de l'évaluation (format ISO) |
| value | number | Valeur évaluée |
| currency | string | Devise de l'évaluation |
| method | string | Méthode d'évaluation utilisée |
| appraiser | string | Nom de l'évaluateur/cabinet d'évaluation |
| report_document_id | string | Identifiant du document de rapport d'évaluation |
| notes | string | Notes additionnelles sur l'évaluation |
