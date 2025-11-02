# Portefeuilles Traditionnels

Ce document décrit les endpoints principaux pour la gestion des portefeuilles traditionnels dans l'API Wanzo Portfolio Institution.

## Modules des Portefeuilles Traditionnels

Les portefeuilles traditionnels sont organisés en plusieurs modules :

1. **[Demandes de Financement](./demandes/README.md)** - Gestion des demandes de financement
2. **[Contrats de Crédit](./contrats/README.md)** - Gestion des contrats de crédit
3. **[Déboursements](./virements/README.md)** - Gestion des déboursements/virements spécifiques aux crédits
4. **[Remboursements](./remboursements/README.md)** - Gestion des remboursements des clients
5. **[Garanties](./garanties/README.md)** - Gestion des garanties
6. **[Paramètres](./parametres/README.md)** - Configuration des paramètres du portefeuille

## Liste des portefeuilles traditionnels

Récupère la liste des portefeuilles traditionnels avec pagination et filtrage.

**Endpoint** : `GET /portfolios/traditional`

**Paramètres de requête** :
- `status` (optionnel) : Filtre par statut (active, inactive, pending, archived)
- `riskProfile` (optionnel) : Filtre par profil de risque (conservative, moderate, aggressive)
- `minAmount` (optionnel) : Filtre par montant minimum cible
- `sector` (optionnel) : Filtre par secteur cible

**Réponse réussie** (200 OK) :

```json
[
  {
    "id": "trad-1",
    "name": "Portefeuille PME Nord-Kivu",
    "description": "Portefeuille de crédits pour PME",
    "manager_id": "mgr-123",
    "institution_id": "inst-456",
    "type": "traditional",
    "status": "active",
    "target_amount": 500000000,
    "target_return": 12,
    "target_sectors": ["Commerce", "Services", "Agriculture"],
    "risk_profile": "moderate",
    "products": [
      {
        "id": "prod-1",
        "name": "Crédit PME Standard",
        "type": "credit",
        "description": "Crédit pour petites et moyennes entreprises",
        "minAmount": 1000000,
        "maxAmount": 50000000,
        "duration": {
          "min": 12,
          "max": 60
        },
        "interestRate": {
          "type": "fixed",
          "value": 12.5
        },
        "requirements": ["Garantie bancaire", "Business plan"],
        "acceptedGuarantees": ["Hypothèque", "Nantissement"],
        "isPublic": true,
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-03-15T00:00:00.000Z"
      }
    ],
    "manager": {
      "id": "mgr-123",
      "name": "Jean Dupont",
      "email": "jean.dupont@exemple.com",
      "phone": "+243810123456"
    },
    "metrics": {
      "net_value": 450000000,
      "average_return": 10.5,
      "risk_portfolio": 8,
      "sharpe_ratio": 1.8,
      "volatility": 12,
      "alpha": 2.5,
      "beta": 0.85,
      "asset_allocation": [
        { "type": "Crédit PME", "percentage": 45 },
        { "type": "Microfinance", "percentage": 30 },
        { "type": "Trésorerie", "percentage": 25 }
      ],
      "performance_curve": [100, 110, 120, 115, 130, 128, 140],
      "balance_AGE": {
        "total": 120000000,
        "echeance_0_30": 70000000,
        "echeance_31_60": 30000000,
        "echeance_61_90": 15000000,
        "echeance_91_plus": 5000000
      },
      "taux_impayes": 2.1,
      "taux_couverture": 98.5
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-03-15T00:00:00.000Z"
  }
]
```

## Création d'un portefeuille traditionnel

Crée un nouveau portefeuille traditionnel.

**Endpoint** : `POST /portfolios/traditional`

**Corps de la requête** :

```json
{
  "name": "Nouveau Portefeuille PME",
  "description": "Portefeuille de crédits pour PME",
  "type": "traditional",
  "target_amount": 200000000,
  "target_return": 15,
  "target_sectors": ["Commerce", "Artisanat", "Agriculture"],
  "risk_profile": "moderate",
  "manager": {
    "id": "mgr-123",
    "name": "Jean Dupont",
    "email": "jean.dupont@exemple.com"
  }
}
```

**Réponse réussie** (201 Created) :

```json
{
  "id": "trad-3",
  "name": "Nouveau Portefeuille PME",
  "description": "Portefeuille de crédits pour PME",
  "type": "traditional",
  "status": "active",
  "target_amount": 200000000,
  "target_return": 15,
  "target_sectors": ["Commerce", "Artisanat", "Agriculture"],
  "risk_profile": "moderate",
  "products": [],
  "metrics": {
    "net_value": 0,
    "average_return": 0,
    "risk_portfolio": 0,
    "sharpe_ratio": 0,
    "volatility": 0,
    "alpha": 0,
    "beta": 0,
    "asset_allocation": [],
    "performance_curve": [],
    "returns": [],
    "benchmark": []
  },
  "manager": {
    "id": "mgr-123",
    "name": "Jean Dupont",
    "email": "jean.dupont@exemple.com"
  },
  "created_at": "2025-08-03T15:30:00.000Z",
  "updated_at": "2025-08-03T15:30:00.000Z"
}
```

## Détails d'un portefeuille traditionnel

Récupère les détails complets d'un portefeuille traditionnel spécifique.

**Endpoint** : `GET /portfolios/traditional/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Réponse réussie** (200 OK) :

```json
{
  "id": "trad-1",
  "name": "Portefeuille PME Nord-Kivu",
  "description": "Portefeuille de crédits pour PME",
  "type": "traditional",
  "status": "active",
  "target_amount": 500000000,
  "target_return": 12,
  "target_sectors": ["Commerce", "Services", "Agriculture"],
  "risk_profile": "moderate",
  "products": [],
  "metrics": {
    "net_value": 450000000,
    "average_return": 10.5,
    "risk_portfolio": 8,
    "sharpe_ratio": 1.8,
    "volatility": 12,
    "alpha": 2.5,
    "beta": 0.85,
    "asset_allocation": [
      { "type": "Crédit PME", "percentage": 45 },
      { "type": "Microfinance", "percentage": 30 },
      { "type": "Trésorerie", "percentage": 25 }
    ],
    "performance_curve": [100, 110, 120, 115, 130, 128, 140],
    "returns": [100, 110, 120, 115, 130, 128, 140],
    "benchmark": [100, 108, 115, 112, 125, 122, 135],
    "balance_AGE": {
      "total": 120000000,
      "echeance_0_30": 70000000,
      "echeance_31_60": 30000000,
      "echeance_61_90": 15000000,
      "echeance_91_plus": 5000000
    },
    "taux_impayes": 2.1,
    "taux_couverture": 98.5,
    "nb_credits": 45,
    "total_credits": 450000000,
    "avg_credit": 10000000,
    "nb_clients": 35,
    "taux_rotation": 15.5,
    "taux_provision": 2.5,
    "taux_recouvrement": 97.8
  },
  "manager": {
    "id": "mgr-123",
    "name": "Jean Dupont",
    "email": "jean.dupont@exemple.com",
    "phone": "+243810123456",
    "role": "Gestionnaire de Portefeuille",
    "department": "Crédit Traditionnel"
  },
  "management_fees": {
    "setup_fee": 250000,
    "annual_fee": 500000,
    "performance_fee": 2.5
  },
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-03-15T00:00:00.000Z"
}
```

## Mise à jour d'un portefeuille traditionnel

Met à jour les informations d'un portefeuille traditionnel existant.

**Endpoint** : `PUT /portfolios/traditional/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Corps de la requête** :

```json
{
  "name": "Portefeuille PME 2025 - Révisé",
  "description": "Portefeuille de crédits pour PME - Révisé",
  "status": "active",
  "managerId": "user789",
  "settings": {
    "maxLoanAmount": 600000.00,
    "interestRateRange": {
      "min": 6.0,
      "max": 16.0
    },
    "loanTermRange": {
      "min": 6,
      "max": 48
    },
    "riskToleranceLevel": "high"
  }
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "portfolio123",
    "reference": "TRP-2025-001",
    "name": "Portefeuille PME 2025 - Révisé",
    "description": "Portefeuille de crédits pour PME - Révisé",
    "status": "active",
    "manager": {
      "id": "user789",
      "name": "Pierre Durand"
    },
    "settings": {
      "maxLoanAmount": 600000.00,
      "interestRateRange": {
        "min": 6.0,
        "max": 16.0
      },
      "loanTermRange": {
        "min": 6,
        "max": 48
      },
      "riskToleranceLevel": "high"
    },
    "updatedAt": "2025-07-24T15:00:00.000Z"
  }
}
```

## Suppression d'un portefeuille traditionnel

Supprime un portefeuille traditionnel du système.

**Endpoint** : `DELETE /portfolios/traditional/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "Portefeuille supprimé avec succès"
}
```

## Changement de statut d'un portefeuille traditionnel

Change le statut d'un portefeuille traditionnel.

**Endpoint** : `POST /portfolios/traditional/{id}/status`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Corps de la requête** :

```json
{
  "status": "inactive"
}
```

**Statuts valides** :
- `active` : Actif
- `inactive` : Inactif 
- `pending` : En attente
- `archived` : Archivé

**Réponse réussie** (200 OK) :

```json
{
  "id": "trad-1",
  "name": "Portefeuille PME Nord-Kivu",
  "status": "inactive",
  "updated_at": "2025-08-03T16:00:00.000Z"
}
```

## Erreurs spécifiques

| Code HTTP | Code d'erreur                   | Description                                        |
|-----------|---------------------------------|----------------------------------------------------|
| 400       | INVALID_PORTFOLIO_DATA          | Données de portefeuille invalides                   |
| 404       | PORTFOLIO_NOT_FOUND             | Portefeuille non trouvé                             |
| 403       | INSUFFICIENT_PERMISSIONS        | Permissions insuffisantes                           |
| 409       | PORTFOLIO_REFERENCE_EXISTS      | Référence de portefeuille déjà existante            |
| 400       | INVALID_PORTFOLIO_STATUS_CHANGE | Changement de statut de portefeuille invalide       |
