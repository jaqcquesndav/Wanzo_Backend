# API des Paramètres - Portefeuille Traditionnel

Cette API permet de gérer les paramètres des portefeuilles traditionnels, incluant les configurations de risque, de produits financiers, de remboursements, de garanties et de provisionnement.

## Points d'accès

### Obtenir les paramètres d'un portefeuille
```
GET /api/portfolio/traditional/:portfolioId/settings
```

#### Paramètres de chemin
| Paramètre | Type | Description |
|-----------|------|-------------|
| portfolioId | string | Identifiant unique du portefeuille traditionnel |

#### Réponse
```json
{
  "success": true,
  "data": {
    "portfolio_id": "trad-001",
    "risk_profile_settings": {
      "max_risk_level": 5,
      "risk_assessment_frequency": "quarterly",
      "risk_thresholds": {
        "low": 2,
        "medium": 3,
        "high": 4
      }
    },
    "product_settings": {
      "interest_rate_ranges": {
        "min": 5,
        "max": 25,
        "default": 12
      },
      "term_ranges": {
        "min": 3,
        "max": 60,
        "default": 24
      },
      "allowed_currencies": ["CDF", "USD"],
      "max_loan_amount": 100000000,
      "min_loan_amount": 1000000,
      "enable_auto_approval": false,
      "auto_approval_threshold": 5000000
    },
    "repayment_settings": {
      "allow_early_repayment": true,
      "early_repayment_fee_percentage": 2,
      "late_payment_fee_percentage": 5,
      "grace_period_days": 5,
      "payment_reminder_days": [1, 3, 7],
      "default_payment_methods": ["bank_transfer", "mobile_money"]
    },
    "guarantee_settings": {
      "required_guarantee_percentage": 150,
      "allowed_guarantee_types": ["real_estate", "equipment", "inventory", "financial_assets"],
      "guarantee_valuation_frequency": "annually"
    },
    "provisioning_settings": {
      "provision_rates": {
        "days_30": 0.1,
        "days_60": 0.3,
        "days_90": 0.5,
        "days_180": 0.75,
        "days_360": 1.0
      },
      "enable_auto_provisioning": true
    },
    "created_at": "2025-01-15T08:30:00Z",
    "updated_at": "2025-07-20T14:15:00Z"
  }
}
```

### Mettre à jour les paramètres d'un portefeuille
```
PUT /api/portfolio/traditional/:portfolioId/settings
```

#### Paramètres de chemin
| Paramètre | Type | Description |
|-----------|------|-------------|
| portfolioId | string | Identifiant unique du portefeuille traditionnel |

#### Corps de la requête
Vous pouvez mettre à jour tout ou partie des paramètres:

```json
{
  "risk_profile_settings": {
    "max_risk_level": 4,
    "risk_assessment_frequency": "monthly"
  },
  "product_settings": {
    "interest_rate_ranges": {
      "max": 20
    },
    "allowed_currencies": ["CDF", "USD", "EUR"]
  }
}
```

#### Réponse
```json
{
  "success": true,
  "data": {
    "portfolio_id": "trad-001",
    "risk_profile_settings": {
      "max_risk_level": 4,
      "risk_assessment_frequency": "monthly",
      "risk_thresholds": {
        "low": 2,
        "medium": 3,
        "high": 4
      }
    },
    "product_settings": {
      "interest_rate_ranges": {
        "min": 5,
        "max": 20,
        "default": 12
      },
      "term_ranges": {
        "min": 3,
        "max": 60,
        "default": 24
      },
      "allowed_currencies": ["CDF", "USD", "EUR"],
      "max_loan_amount": 100000000,
      "min_loan_amount": 1000000,
      "enable_auto_approval": false,
      "auto_approval_threshold": 5000000
    },
    "repayment_settings": {
      "allow_early_repayment": true,
      "early_repayment_fee_percentage": 2,
      "late_payment_fee_percentage": 5,
      "grace_period_days": 5,
      "payment_reminder_days": [1, 3, 7],
      "default_payment_methods": ["bank_transfer", "mobile_money"]
    },
    "guarantee_settings": {
      "required_guarantee_percentage": 150,
      "allowed_guarantee_types": ["real_estate", "equipment", "inventory", "financial_assets"],
      "guarantee_valuation_frequency": "annually"
    },
    "provisioning_settings": {
      "provision_rates": {
        "days_30": 0.1,
        "days_60": 0.3,
        "days_90": 0.5,
        "days_180": 0.75,
        "days_360": 1.0
      },
      "enable_auto_provisioning": true
    },
    "created_at": "2025-01-15T08:30:00Z",
    "updated_at": "2025-07-25T09:45:00Z"
  }
}
```

### Réinitialiser les paramètres d'un portefeuille
```
POST /api/portfolio/traditional/:portfolioId/settings/reset
```

#### Paramètres de chemin
| Paramètre | Type | Description |
|-----------|------|-------------|
| portfolioId | string | Identifiant unique du portefeuille traditionnel |

#### Corps de la requête
```json
{}
```

#### Réponse
```json
{
  "success": true,
  "data": {
    "portfolio_id": "trad-001",
    "risk_profile_settings": {
      "max_risk_level": 5,
      "risk_assessment_frequency": "quarterly",
      "risk_thresholds": {
        "low": 2,
        "medium": 3,
        "high": 4
      }
    },
    "product_settings": {
      "interest_rate_ranges": {
        "min": 5,
        "max": 25,
        "default": 12
      },
      "term_ranges": {
        "min": 3,
        "max": 60,
        "default": 24
      },
      "allowed_currencies": ["CDF", "USD"],
      "max_loan_amount": 100000000,
      "min_loan_amount": 1000000,
      "enable_auto_approval": false,
      "auto_approval_threshold": 5000000
    },
    "repayment_settings": {
      "allow_early_repayment": true,
      "early_repayment_fee_percentage": 2,
      "late_payment_fee_percentage": 5,
      "grace_period_days": 5,
      "payment_reminder_days": [1, 3, 7],
      "default_payment_methods": ["bank_transfer", "mobile_money"]
    },
    "guarantee_settings": {
      "required_guarantee_percentage": 150,
      "allowed_guarantee_types": ["real_estate", "equipment", "inventory", "financial_assets"],
      "guarantee_valuation_frequency": "annually"
    },
    "provisioning_settings": {
      "provision_rates": {
        "days_30": 0.1,
        "days_60": 0.3,
        "days_90": 0.5,
        "days_180": 0.75,
        "days_360": 1.0
      },
      "enable_auto_provisioning": true
    },
    "created_at": "2025-01-15T08:30:00Z",
    "updated_at": "2025-07-25T10:00:00Z"
  }
}
```

### Obtenir tous les produits financiers
```
GET /api/portfolio/traditional/:portfolioId/products
```

#### Paramètres de chemin
| Paramètre | Type | Description |
|-----------|------|-------------|
| portfolioId | string | Identifiant unique du portefeuille traditionnel |

#### Paramètres de requête
| Paramètre | Type | Description |
|-----------|------|-------------|
| page | number | Numéro de page (par défaut: 1) |
| limit | number | Nombre d'éléments par page (par défaut: 10) |
| status | string | Filtrer par statut ('active', 'inactive') |
| type | string | Filtrer par type ('credit', 'savings', 'investment') |

#### Réponse
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod-001",
        "name": "Crédit PME",
        "type": "credit",
        "description": "Crédit pour les petites et moyennes entreprises",
        "minAmount": 5000000,
        "maxAmount": 50000000,
        "duration": {
          "min": 6,
          "max": 36
        },
        "interestRate": {
          "type": "fixed",
          "value": 15
        },
        "requirements": ["Business plan", "États financiers", "Garanties"],
        "acceptedGuarantees": ["real_estate", "equipment"],
        "isPublic": true,
        "status": "active",
        "created_at": "2025-01-15T08:35:00Z",
        "updated_at": "2025-01-15T08:35:00Z"
      },
      {
        "id": "prod-002",
        "name": "Dépôt à terme",
        "type": "savings",
        "description": "Compte d'épargne à terme fixe",
        "minAmount": 1000000,
        "maxAmount": 100000000,
        "duration": {
          "min": 3,
          "max": 60
        },
        "interestRate": {
          "type": "fixed",
          "value": 8
        },
        "requirements": ["Pièce d'identité"],
        "isPublic": true,
        "status": "active",
        "created_at": "2025-01-16T10:20:00Z",
        "updated_at": "2025-01-16T10:20:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### Obtenir un produit financier par ID
```
GET /api/portfolio/traditional/:portfolioId/products/:productId
```

#### Paramètres de chemin
| Paramètre | Type | Description |
|-----------|------|-------------|
| portfolioId | string | Identifiant unique du portefeuille traditionnel |
| productId | string | Identifiant unique du produit financier |

#### Réponse
```json
{
  "success": true,
  "data": {
    "id": "prod-001",
    "name": "Crédit PME",
    "type": "credit",
    "description": "Crédit pour les petites et moyennes entreprises",
    "minAmount": 5000000,
    "maxAmount": 50000000,
    "duration": {
      "min": 6,
      "max": 36
    },
    "interestRate": {
      "type": "fixed",
      "value": 15
    },
    "requirements": ["Business plan", "États financiers", "Garanties"],
    "acceptedGuarantees": ["real_estate", "equipment"],
    "isPublic": true,
    "status": "active",
    "created_at": "2025-01-15T08:35:00Z",
    "updated_at": "2025-01-15T08:35:00Z"
  }
}
```

### Créer un produit financier
```
POST /api/portfolio/traditional/:portfolioId/products
```

#### Paramètres de chemin
| Paramètre | Type | Description |
|-----------|------|-------------|
| portfolioId | string | Identifiant unique du portefeuille traditionnel |

#### Corps de la requête
```json
{
  "name": "Microcrédit Agricole",
  "type": "credit",
  "description": "Microcrédit destiné aux agriculteurs",
  "minAmount": 500000,
  "maxAmount": 5000000,
  "duration": {
    "min": 3,
    "max": 24
  },
  "interestRate": {
    "type": "fixed",
    "value": 12
  },
  "requirements": ["Carte professionnelle agricole", "Plan d'exploitation"],
  "acceptedGuarantees": ["equipment", "inventory"],
  "isPublic": true,
  "status": "active"
}
```

#### Réponse
```json
{
  "success": true,
  "data": {
    "id": "prod-003",
    "name": "Microcrédit Agricole",
    "type": "credit",
    "description": "Microcrédit destiné aux agriculteurs",
    "minAmount": 500000,
    "maxAmount": 5000000,
    "duration": {
      "min": 3,
      "max": 24
    },
    "interestRate": {
      "type": "fixed",
      "value": 12
    },
    "requirements": ["Carte professionnelle agricole", "Plan d'exploitation"],
    "acceptedGuarantees": ["equipment", "inventory"],
    "isPublic": true,
    "status": "active",
    "created_at": "2025-07-25T10:15:00Z",
    "updated_at": "2025-07-25T10:15:00Z"
  }
}
```

### Mettre à jour un produit financier
```
PUT /api/portfolio/traditional/:portfolioId/products/:productId
```

#### Paramètres de chemin
| Paramètre | Type | Description |
|-----------|------|-------------|
| portfolioId | string | Identifiant unique du portefeuille traditionnel |
| productId | string | Identifiant unique du produit financier |

#### Corps de la requête
```json
{
  "maxAmount": 8000000,
  "interestRate": {
    "value": 10
  },
  "status": "inactive"
}
```

#### Réponse
```json
{
  "success": true,
  "data": {
    "id": "prod-003",
    "name": "Microcrédit Agricole",
    "type": "credit",
    "description": "Microcrédit destiné aux agriculteurs",
    "minAmount": 500000,
    "maxAmount": 8000000,
    "duration": {
      "min": 3,
      "max": 24
    },
    "interestRate": {
      "type": "fixed",
      "value": 10
    },
    "requirements": ["Carte professionnelle agricole", "Plan d'exploitation"],
    "acceptedGuarantees": ["equipment", "inventory"],
    "isPublic": true,
    "status": "inactive",
    "created_at": "2025-07-25T10:15:00Z",
    "updated_at": "2025-07-25T10:30:00Z"
  }
}
```

### Supprimer un produit financier
```
DELETE /api/portfolio/traditional/:portfolioId/products/:productId
```

#### Paramètres de chemin
| Paramètre | Type | Description |
|-----------|------|-------------|
| portfolioId | string | Identifiant unique du portefeuille traditionnel |
| productId | string | Identifiant unique du produit financier |

#### Réponse
```json
{
  "success": true,
  "message": "Le produit financier a été supprimé avec succès"
}
```

## Modèles de données

### Paramètres de portefeuille traditionnel
| Champ | Type | Description |
|-------|------|-------------|
| portfolio_id | string | Identifiant unique du portefeuille |
| risk_profile_settings | object | Paramètres de gestion des risques |
| risk_profile_settings.max_risk_level | number | Niveau de risque maximal acceptable (échelle numérique) |
| risk_profile_settings.risk_assessment_frequency | string | Fréquence d'évaluation ('monthly', 'quarterly', 'annually') |
| risk_profile_settings.risk_thresholds | object | Seuils pour différents niveaux de risque |
| product_settings | object | Paramètres des produits financiers |
| product_settings.interest_rate_ranges | object | Plages de taux d'intérêt |
| product_settings.term_ranges | object | Plages de durée en mois |
| product_settings.allowed_currencies | array | Liste des devises autorisées |
| product_settings.max_loan_amount | number | Montant maximum de prêt |
| product_settings.min_loan_amount | number | Montant minimum de prêt |
| product_settings.enable_auto_approval | boolean | Activer l'approbation automatique |
| product_settings.auto_approval_threshold | number | Seuil pour l'approbation automatique |
| repayment_settings | object | Paramètres des remboursements |
| repayment_settings.allow_early_repayment | boolean | Autoriser les remboursements anticipés |
| repayment_settings.early_repayment_fee_percentage | number | Frais pour remboursement anticipé (%) |
| repayment_settings.late_payment_fee_percentage | number | Frais pour paiement tardif (%) |
| repayment_settings.grace_period_days | number | Jours de grâce avant pénalités |
| repayment_settings.payment_reminder_days | array | Jours avant échéance pour rappels |
| repayment_settings.default_payment_methods | array | Méthodes de paiement par défaut |
| guarantee_settings | object | Paramètres des garanties |
| guarantee_settings.required_guarantee_percentage | number | Pourcentage de garantie requis |
| guarantee_settings.allowed_guarantee_types | array | Types de garanties autorisés |
| guarantee_settings.guarantee_valuation_frequency | string | Fréquence d'évaluation ('monthly', 'quarterly', 'annually') |
| provisioning_settings | object | Paramètres de provisionnement |
| provisioning_settings.provision_rates | object | Taux de provisionnement par âge |
| provisioning_settings.enable_auto_provisioning | boolean | Activer le provisionnement automatique |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |

### Produit financier
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du produit |
| name | string | Nom du produit |
| type | string | Type de produit ('credit', 'savings', 'investment') |
| description | string | Description détaillée |
| minAmount | number | Montant minimum |
| maxAmount | number | Montant maximum |
| duration | object | Durée du produit |
| duration.min | number | Durée minimum en mois |
| duration.max | number | Durée maximum en mois |
| interestRate | object | Configuration du taux d'intérêt |
| interestRate.type | string | Type de taux ('fixed', 'variable') |
| interestRate.value | number | Valeur du taux (pour type 'fixed') |
| interestRate.min | number | Taux minimum (pour type 'variable') |
| interestRate.max | number | Taux maximum (pour type 'variable') |
| requirements | array | Liste des exigences documentaires |
| acceptedGuarantees | array | Types de garanties acceptées |
| isPublic | boolean | Indique si le produit est visible publiquement |
| status | string | Statut du produit ('active', 'inactive') |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |
