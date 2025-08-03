# Portefeuilles Traditionnels

Ce document décrit les endpoints principaux pour la gestion des portefeuilles traditionnels dans l'API Wanzo Portfolio Institution.

## Modules des Portefeuilles Traditionnels

Les portefeuilles traditionnels sont organisés en plusieurs modules :

1. **[Demandes de Financement](./demandes/README.md)** - Gestion des demandes de financement
2. **[Contrats de Crédit](./contrats/README.md)** - Gestion des contrats de crédit
3. **[Virements](./virements/README.md)** - Gestion des virements (disbursements)
4. **[Remboursements](./remboursements/README.md)** - Gestion des remboursements
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
    "manager": {
      "id": "mgr-123",
      "name": "Jean Dupont",
      "email": "jean.dupont@exemple.com",
      "phone": "+243810123456"
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
  "manager_id": "mgr-123",
  "institution_id": "inst-456",
  "target_amount": 200000000,
  "target_return": 15,
  "target_sectors": ["Commerce", "Artisanat", "Agriculture"],
  "risk_profile": "moderate"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "id": "trad-3",
  "name": "Nouveau Portefeuille PME",
  "description": "Portefeuille de crédits pour PME",
  "manager_id": "mgr-123",
  "institution_id": "inst-456",
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
    "asset_allocation": []
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
  "manager_id": "mgr-123",
  "institution_id": "inst-456",
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
  "manager": {
    "id": "mgr-123",
    "name": "Jean Dupont",
    "email": "jean.dupont@exemple.com",
    "phone": "+243810123456"
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

**Endpoint** : `DELETE /portfolio_inst/portfolios/traditional/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "message": "Portefeuille supprimé avec succès"
  }
}
```

## Clôture d'un portefeuille traditionnel

Change le statut d'un portefeuille traditionnel à 'closed'.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{id}/close`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Corps de la requête** :

```json
{
  "closureReason": "Objectifs atteints",
  "closureNotes": "Tous les prêts ont été remboursés, portefeuille fermé selon le plan."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "portfolio123",
    "status": "closed",
    "closureReason": "Objectifs atteints",
    "closureNotes": "Tous les prêts ont été remboursés, portefeuille fermé selon le plan.",
    "closedAt": "2025-07-24T16:00:00.000Z",
    "closedBy": {
      "id": "user123",
      "name": "Jean Dupont"
    }
  }
}
```

## Suspension d'un portefeuille traditionnel

Change le statut d'un portefeuille traditionnel à 'suspended'.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{id}/suspend`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Corps de la requête** :

```json
{
  "suspensionReason": "Révision des taux d'intérêt",
  "suspensionNotes": "Suspension temporaire pour réviser la structure des taux d'intérêt."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "portfolio123",
    "status": "suspended",
    "suspensionReason": "Révision des taux d'intérêt",
    "suspensionNotes": "Suspension temporaire pour réviser la structure des taux d'intérêt.",
    "suspendedAt": "2025-07-24T16:30:00.000Z",
    "suspendedBy": {
      "id": "user123",
      "name": "Jean Dupont"
    }
  }
}
```

## Réactivation d'un portefeuille traditionnel

Change le statut d'un portefeuille traditionnel suspendu ou fermé à 'active'.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{id}/reactivate`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Corps de la requête** :

```json
{
  "reactivationReason": "Révision des taux terminée",
  "reactivationNotes": "Nouvelle structure de taux approuvée, portefeuille réactivé."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "portfolio123",
    "status": "active",
    "reactivationReason": "Révision des taux terminée",
    "reactivationNotes": "Nouvelle structure de taux approuvée, portefeuille réactivé.",
    "reactivatedAt": "2025-07-24T17:00:00.000Z",
    "reactivatedBy": {
      "id": "user123",
      "name": "Jean Dupont"
    }
  }
}
```

## Tableau de bord d'un portefeuille traditionnel

Récupère les données de tableau de bord pour un portefeuille traditionnel spécifique.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{id}/dashboard`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Paramètres de requête** :
- `period` (optionnel) : Période d'analyse (week, month, quarter, year, all). Défaut: month

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "portfolio123",
    "name": "Portefeuille PME 2025",
    "period": "month",
    "summary": {
      "totalLoans": 30,
      "activeLoans": 25,
      "disbursedAmount": 4500000.00,
      "outstandingAmount": 3800000.00,
      "repaidAmount": 700000.00,
      "overdueAmount": 50000.00
    },
    "performance": {
      "delinquencyRate": 1.8,
      "defaultRate": 0.5,
      "interestIncomeRate": 10.2,
      "profitability": 8.4
    },
    "trends": {
      "disbursements": [
        { "date": "2025-06-24", "amount": 200000.00 },
        { "date": "2025-06-30", "amount": 150000.00 },
        { "date": "2025-07-10", "amount": 300000.00 },
        { "date": "2025-07-15", "amount": 250000.00 }
      ],
      "repayments": [
        { "date": "2025-06-25", "amount": 50000.00 },
        { "date": "2025-07-01", "amount": 100000.00 },
        { "date": "2025-07-10", "amount": 75000.00 },
        { "date": "2025-07-20", "amount": 125000.00 }
      ],
      "outstandingBalance": [
        { "date": "2025-06-24", "amount": 3500000.00 },
        { "date": "2025-07-01", "amount": 3550000.00 },
        { "date": "2025-07-10", "amount": 3775000.00 },
        { "date": "2025-07-20", "amount": 3800000.00 }
      ]
    },
    "riskAnalysis": {
      "loanSizeDistribution": [
        { "range": "0-10000", "count": 5, "amount": 25000.00 },
        { "range": "10001-50000", "count": 10, "amount": 300000.00 },
        { "range": "50001-100000", "count": 8, "amount": 600000.00 },
        { "range": "100001+", "count": 7, "amount": 2875000.00 }
      ],
      "sectorDistribution": [
        { "sector": "Agriculture", "count": 8, "amount": 1000000.00 },
        { "sector": "Commerce", "count": 10, "amount": 2000000.00 },
        { "sector": "Services", "count": 7, "amount": 1500000.00 }
      ],
      "delinquencyByDuration": [
        { "duration": "1-30 jours", "count": 3, "amount": 30000.00 },
        { "duration": "31-90 jours", "count": 1, "amount": 15000.00 },
        { "duration": "91+ jours", "count": 1, "amount": 5000.00 }
      ]
    }
  }
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
