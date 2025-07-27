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

**Endpoint** : `GET /portfolio_inst/portfolios/traditional`

**Paramètres de requête** :
- `page` (optionnel) : Numéro de la page (défaut : 1)
- `limit` (optionnel) : Nombre de portefeuilles par page (défaut : 10, max : 100)
- `status` (optionnel) : Filtre par statut (active, closed, suspended)
- `manager` (optionnel) : Filtre par gestionnaire
- `client` (optionnel) : Filtre par client
- `dateFrom` (optionnel) : Filtre par date de création (début)
- `dateTo` (optionnel) : Filtre par date de création (fin)
- `search` (optionnel) : Recherche textuelle (nom, référence)
- `sortBy` (optionnel) : Trier par (createdAt, name, totalAmount)
- `sortOrder` (optionnel) : Ordre de tri (asc, desc)

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "portfolio123",
      "reference": "TRP-2025-001",
      "name": "Portefeuille PME 2025",
      "description": "Portefeuille de crédits pour PME",
      "status": "active",
      "totalAmount": 5000000.00,
      "currency": "CDF",
      "clientCount": 25,
      "riskScore": 3.2,
      "manager": {
        "id": "user123",
        "name": "Jean Dupont"
      },
      "client": {
        "id": "client456",
        "name": "Banque Commerciale"
      },
      "createdAt": "2025-01-15T08:00:00.000Z",
      "updatedAt": "2025-07-20T10:30:00.000Z"
    },
    // ... autres portefeuilles
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

## Création d'un portefeuille traditionnel

Crée un nouveau portefeuille traditionnel.

**Endpoint** : `POST /portfolio_inst/portfolios/traditional`

**Corps de la requête** :

```json
{
  "name": "Nouveau Portefeuille PME",
  "description": "Portefeuille destiné aux petites et moyennes entreprises",
  "currency": "CDF",
  "managerId": "user123",
  "clientId": "client456",
  "settings": {
    "maxLoanAmount": 50000.00,
    "interestRateRange": {
      "min": 5.0,
      "max": 15.0
    },
    "loanTermRange": {
      "min": 3,
      "max": 36
    },
    "riskToleranceLevel": "medium"
  }
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "portfolio789",
    "reference": "TRP-2025-045",
    "name": "Nouveau Portefeuille PME",
    "description": "Portefeuille destiné aux petites et moyennes entreprises",
    "status": "active",
    "totalAmount": 0.00,
    "currency": "CDF",
    "clientCount": 0,
    "riskScore": 0.0,
    "manager": {
      "id": "user123",
      "name": "Jean Dupont"
    },
    "client": {
      "id": "client456",
      "name": "Banque Commerciale"
    },
    "settings": {
      "maxLoanAmount": 50000.00,
      "interestRateRange": {
        "min": 5.0,
        "max": 15.0
      },
      "loanTermRange": {
        "min": 3,
        "max": 36
      },
      "riskToleranceLevel": "medium"
    },
    "createdAt": "2025-07-24T14:00:00.000Z",
    "updatedAt": "2025-07-24T14:00:00.000Z"
  }
}
```

## Détails d'un portefeuille traditionnel

Récupère les détails complets d'un portefeuille traditionnel spécifique.

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "portfolio123",
    "reference": "TRP-2025-001",
    "name": "Portefeuille PME 2025",
    "description": "Portefeuille de crédits pour PME",
    "status": "active",
    "totalAmount": 5000000.00,
    "disbursedAmount": 4500000.00,
    "outstandingAmount": 3800000.00,
    "currency": "CDF",
    "clientCount": 25,
    "riskScore": 3.2,
    "delinquencyRate": 1.8,
    "manager": {
      "id": "user123",
      "name": "Jean Dupont",
      "email": "jean.dupont@exemple.com",
      "phone": "+243810123456"
    },
    "client": {
      "id": "client456",
      "name": "Banque Commerciale",
      "contact": {
        "name": "Marie Martin",
        "email": "marie.martin@banquecommerciale.com",
        "phone": "+243820123456"
      }
    },
    "settings": {
      "maxLoanAmount": 500000.00,
      "interestRateRange": {
        "min": 5.0,
        "max": 15.0
      },
      "loanTermRange": {
        "min": 3,
        "max": 36
      },
      "riskToleranceLevel": "medium"
    },
    "kpis": {
      "totalLoans": 30,
      "activeLoans": 25,
      "completedLoans": 5,
      "averageLoanAmount": 200000.00,
      "averageInterestRate": 10.5,
      "averageLoanTerm": 18
    },
    "createdAt": "2025-01-15T08:00:00.000Z",
    "updatedAt": "2025-07-20T10:30:00.000Z"
  }
}
```

## Mise à jour d'un portefeuille traditionnel

Met à jour les informations d'un portefeuille traditionnel existant.

**Endpoint** : `PUT /portfolio_inst/portfolios/traditional/{id}`

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
