# Centrale de Risque

Ce document décrit les endpoints pour la gestion des données de la centrale de risque dans l'API Wanzo Portfolio Institution.

## API de Risque

### Récupérer les données de risque crédit pour une entreprise

Récupère les informations de risque crédit pour une entreprise spécifique.

**Endpoint** : `GET /risk/credit/:companyId`

**Paramètres de requête** :
- `companyId` : Identifiant unique de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "id": "cr-123456",
  "companyId": "123456",
  "companyName": "Entreprise ABC",
  "sector": "Technologies",
  "institution": "Banque Commerciale",
  "encours": 250000000,
  "statut": "Actif",
  "coteCredit": "B",
  "incidents": 0,
  "creditScore": 78,
  "debtRatio": 0.45,
  "lastUpdated": "2025-07-20T10:30:45.000Z"
}
```

### Récupérer les données de risque leasing pour une entreprise

Récupère les informations de risque leasing pour une entreprise spécifique.

**Endpoint** : `GET /risk/leasing/:companyId`

**Paramètres de requête** :
- `companyId` : Identifiant unique de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "id": "lr-123456",
  "companyId": "123456",
  "companyName": "Entreprise ABC",
  "sector": "Technologies",
  "institution": "Leasing Pro",
  "equipmentType": "Équipement informatique",
  "valeurFinancement": 150000000,
  "statut": "Actif",
  "coteCredit": "B",
  "incidents": 0,
  "lastUpdated": "2025-07-20T10:30:45.000Z"
}
```

### Récupérer les données de risque investissement pour une entreprise

Récupère les informations de risque investissement pour une entreprise spécifique.

**Endpoint** : `GET /risk/investment/:companyId`

**Paramètres de requête** :
- `companyId` : Identifiant unique de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "id": "ir-123456",
  "companyId": "123456",
  "companyName": "Entreprise ABC",
  "sector": "Technologies",
  "institution": "Fonds d'Investissement Capital",
  "investmentType": "Action",
  "montantInvesti": 100000000,
  "valorisation": 120000000,
  "statut": "Performant",
  "coteCredit": "B",
  "rendementActuel": 0.12,
  "lastUpdated": "2025-07-20T10:30:45.000Z"
}
```

### Soumettre une nouvelle entrée de risque

Soumet une nouvelle entrée de risque pour une entreprise.

**Endpoint** : `POST /risk/:type`

**Paramètres de chemin** :
- `type` : Type de risque (credit, leasing, investment)

**Corps de la requête** :
Le corps de la requête dépend du type de risque soumis.

**Réponse réussie** (200 OK) :

```json
{
  "id": "entry-123456",
  "status": "created"
}
```

### Mettre à jour une entrée de risque

Met à jour une entrée de risque existante.

**Endpoint** : `PUT /risk/:type/:id`

**Paramètres de chemin** :
- `type` : Type de risque (credit, leasing, investment)
- `id` : Identifiant unique de l'entrée de risque

**Corps de la requête** :
Le corps de la requête contient les champs à mettre à jour.

**Réponse réussie** (200 OK) :

```json
{
  "status": "updated"
}
```

### Récupérer un rapport de synthèse des risques

Récupère un rapport de synthèse des risques.

**Endpoint** : `GET /risk/summary`

**Paramètres de requête** :
- `portfolioId` (optionnel) : Identifiant du portefeuille
- `fromDate` (optionnel) : Date de début (format ISO)
- `toDate` (optionnel) : Date de fin (format ISO)
- `riskLevel` (optionnel) : Niveau de risque (low, medium, high, critical)

**Réponse réussie** (200 OK) :

```json
{
  "totalEntries": 150,
  "riskDistribution": {
    "low": 45,
    "medium": 65,
    "high": 30,
    "critical": 10
  },
  "topRiskyCompanies": [
    {
      "companyId": "789012",
      "companyName": "Entreprise XYZ",
      "riskScore": 92,
      "riskLevel": "critical"
    },
    {
      "companyId": "456789",
      "companyName": "Entreprise DEF",
      "riskScore": 86,
      "riskLevel": "high"
    },
    {
      "companyId": "123456",
      "companyName": "Entreprise ABC",
      "riskScore": 78,
      "riskLevel": "medium"
    }
  ]
}
```

## API de Centrale de Risque

### Récupérer le profil de risque d'une entreprise

Récupère les informations détaillées du profil de risque d'une entreprise.

**Endpoint** : `GET /risk/central/company/:companyId`

**Paramètres de requête** :
- `companyId` : Identifiant unique de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "companyId": "123456",
  "companyName": "Entreprise ABC",
  "creditScore": 78,
  "riskCategory": "medium",
  "financialHealth": {
    "solvabilite": 0.70,
    "liquidite": 0.65,
    "rentabilite": 0.80,
    "endettement": 0.45,
    "scoreGlobal": 0.68
  },
  "creditHistory": {
    "encoursTotalActuel": 285000000,
    "encoursTotalHistorique": 450000000,
    "repartitionParType": {
      "creditsBancaires": 250000000,
      "creditsBail": 35000000,
      "lignesDeCredit": 0,
      "autres": 0
    },
    "incidents": {
      "total": 1,
      "cheques": 0,
      "effets": 0,
      "retards": 1
    }
  },
  "defaultProbability": 0.12,
  "recommendedActions": [
    "Surveiller les ratios d'endettement",
    "Vérifier trimestriellement les comptes"
  ],
  "lastUpdate": "2025-07-20T10:30:45.000Z"
}
```

### Récupérer les incidents de paiement d'une entreprise

Récupère les incidents de paiement pour une entreprise.

**Endpoint** : `GET /risk/central/company/:companyId/incidents`

**Paramètres de requête** :
- `companyId` : Identifiant unique de l'entreprise
- `period` (optionnel) : Période pour les incidents (ex: 2025-Q1, 2025-Q2)

**Réponse réussie** (200 OK) :

```json
{
  "companyId": "123456",
  "companyName": "Entreprise ABC",
  "incidents": [
    {
      "id": "inc-123",
      "type": "retard",
      "date": "2025-03-15T00:00:00.000Z",
      "amount": 5000000,
      "days": 12,
      "institution": "Banque Commerciale",
      "description": "Retard de paiement sur échéance de crédit",
      "status": "régularisé",
      "regularisationDate": "2025-03-27T00:00:00.000Z"
    }
  ],
  "summary": {
    "totalIncidents": 1,
    "totalAmount": 5000000,
    "byType": {
      "retard": 1
    },
    "byStatus": {
      "régularisé": 1
    },
    "averageDaysLate": 12
  }
}
```

### Récupérer les engagements d'une entreprise

Récupère les engagements financiers d'une entreprise.

**Endpoint** : `GET /risk/central/company/:companyId/engagements`

**Paramètres de requête** :
- `companyId` : Identifiant unique de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "companyId": "123456",
  "companyName": "Entreprise ABC",
  "totalEngagement": 285000000,
  "engagements": [
    {
      "id": "eng-123",
      "institution": "Banque Commerciale",
      "type": "credit",
      "startDate": "2024-10-15T00:00:00.000Z",
      "endDate": "2026-10-14T23:59:59.999Z",
      "initialAmount": 250000000,
      "currentAmount": 250000000,
      "currency": "XOF",
      "status": "actif",
      "paymentStatus": "normal"
    },
    {
      "id": "eng-456",
      "institution": "Leasing Pro",
      "type": "leasing",
      "startDate": "2025-01-15T00:00:00.000Z",
      "endDate": "2027-01-14T23:59:59.999Z",
      "initialAmount": 35000000,
      "currentAmount": 35000000,
      "currency": "XOF",
      "status": "actif",
      "paymentStatus": "normal"
    }
  ],
  "summary": {
    "byType": {
      "credit": 250000000,
      "leasing": 35000000
    },
    "byStatus": {
      "actif": 285000000
    },
    "byPaymentStatus": {
      "normal": 285000000
    }
  }
}
```

### Ajouter une entrée de risque

Ajoute une nouvelle entrée de risque pour une entreprise.

**Endpoint** : `POST /risk/central/entries`

**Corps de la requête** :

```json
{
  "companyId": "123456",
  "type": "incident_paiement",
  "date": "2025-07-15T00:00:00.000Z",
  "amount": 5000000,
  "description": "Retard de paiement sur échéance de crédit",
  "severity": "medium",
  "source": "Banque Commerciale"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "entry-789",
  "companyId": "123456",
  "type": "incident_paiement",
  "date": "2025-07-15T00:00:00.000Z",
  "amount": 5000000,
  "description": "Retard de paiement sur échéance de crédit",
  "severity": "medium",
  "source": "Banque Commerciale",
  "created_at": "2025-07-15T10:30:45.000Z"
}
```

### Mettre à jour une entrée de risque

Met à jour une entrée de risque existante.

**Endpoint** : `PUT /risk/central/entries/:id`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'entrée de risque

**Corps de la requête** :

```json
{
  "status": "resolved",
  "resolution": "Paiement effectué et régularisé",
  "severity": "low"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "entry-789",
  "companyId": "123456",
  "type": "incident_paiement",
  "date": "2025-07-15T00:00:00.000Z",
  "amount": 5000000,
  "description": "Retard de paiement sur échéance de crédit",
  "severity": "low",
  "status": "resolved",
  "resolution": "Paiement effectué et régularisé",
  "source": "Banque Commerciale",
  "created_at": "2025-07-15T10:30:45.000Z",
  "updated_at": "2025-07-20T11:45:30.000Z"
}
```

### Récupérer les alertes de risque actives

Récupère les alertes de risque actives.

**Endpoint** : `GET /risk/central/alerts`

**Paramètres de requête** :
- `severity` (optionnel) : Niveau de sévérité (low, medium, high)
- `type` (optionnel) : Type d'alerte (market, credit, operational, compliance, liquidity)
- `page` (optionnel) : Numéro de page pour la pagination
- `limit` (optionnel) : Nombre d'éléments par page

**Réponse réussie** (200 OK) :

```json
{
  "data": [
    {
      "id": "alert-123",
      "type": "credit",
      "severity": "medium",
      "title": "Augmentation des retards de paiement dans le secteur textile",
      "description": "Une hausse de 15% des incidents de paiement a été observée dans le secteur textile au cours du dernier trimestre.",
      "affectedEntities": [
        {
          "id": "sector-textile",
          "type": "sector",
          "name": "Textile"
        }
      ],
      "createdAt": "2025-07-10T08:15:30.000Z",
      "status": "new"
    }
  ],
  "meta": {
    "total": 24,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Récupérer les statistiques de risque

Récupère les statistiques générales de risque.

**Endpoint** : `GET /risk/central/statistics`

**Réponse réussie** (200 OK) :

```json
{
  "totalCompanies": 1250,
  "riskDistribution": {
    "low": 450,
    "medium": 520,
    "high": 200,
    "very_high": 80
  },
  "sectorRiskHeatmap": [
    {
      "sector": "Technologies",
      "riskScore": 45,
      "exposure": 3500000000,
      "companies": 120
    },
    {
      "sector": "Textile",
      "riskScore": 68,
      "exposure": 2100000000,
      "companies": 85
    }
  ],
  "defaultRates": {
    "overall": 0.08,
    "byCompanySize": {
      "small": 0.12,
      "medium": 0.08,
      "large": 0.04
    },
    "bySector": {
      "Technologies": 0.05,
      "Textile": 0.10
    }
  },
  "trends": {
    "period": "last-12-months",
    "defaultRate": [
      {"date": "2024-08", "value": 0.075},
      {"date": "2024-09", "value": 0.080}
    ],
    "riskDistribution": [
      {
        "date": "2024-08",
        "low": 460,
        "medium": 510,
        "high": 195,
        "very_high": 75
      },
      {
        "date": "2024-09",
        "low": 455,
        "medium": 515,
        "high": 198,
        "very_high": 77
      }
    ]
  }
}
```

### Récupérer le rapport de risque complet d'une entreprise

Récupère le rapport de risque complet pour une entreprise.

**Endpoint** : `GET /risk/central/company/:companyId/full-report`

**Paramètres de requête** :
- `companyId` : Identifiant unique de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "companyId": "123456",
  "companyName": "Entreprise ABC",
  "generateDate": "2025-07-25T12:00:00.000Z",
  "creditScore": 78,
  "riskCategory": "medium",
  "financialAnalysis": {
    "balanceSheet": {
      "totalAssets": 5000000000,
      "currentAssets": 2000000000,
      "fixedAssets": 3000000000,
      "totalLiabilities": 3000000000,
      "currentLiabilities": 1000000000,
      "longTermLiabilities": 2000000000,
      "equity": 2000000000
    },
    "incomeStatement": {
      "revenue": 3500000000,
      "operatingExpenses": 3000000000,
      "operatingProfit": 500000000,
      "netProfit": 350000000
    },
    "cashFlow": {
      "operatingCashFlow": 450000000,
      "investingCashFlow": -200000000,
      "financingCashFlow": -100000000,
      "netCashFlow": 150000000
    },
    "keyRatios": {
      "currentRatio": 2.0,
      "quickRatio": 1.5,
      "debtToEquity": 1.5,
      "returnOnAssets": 0.07,
      "returnOnEquity": 0.175
    },
    "trends": {
      "revenue": [
        {"year": "2023", "value": 3000000000},
        {"year": "2024", "value": 3200000000},
        {"year": "2025", "value": 3500000000}
      ],
      "netProfit": [
        {"year": "2023", "value": 280000000},
        {"year": "2024", "value": 310000000},
        {"year": "2025", "value": 350000000}
      ]
    }
  },
  "creditHistory": {
    "engagements": [
      {
        "institution": "Banque Commerciale",
        "type": "credit",
        "amount": 250000000,
        "startDate": "2024-10-15",
        "status": "actif"
      },
      {
        "institution": "Leasing Pro",
        "type": "leasing",
        "amount": 35000000,
        "startDate": "2025-01-15",
        "status": "actif"
      }
    ],
    "incidents": [
      {
        "type": "retard",
        "date": "2025-03-15",
        "amount": 5000000,
        "status": "régularisé"
      }
    ]
  },
  "marketAnalysis": {
    "sectorRisk": 0.55,
    "sectorTrend": "stable",
    "competitivePosition": "strong",
    "marketShareTrend": "growing"
  },
  "managementAssessment": {
    "experienceScore": 0.8,
    "stabilityScore": 0.75,
    "complianceScore": 0.9,
    "observations": [
      "Équipe de direction stable depuis 5 ans",
      "Bonne gouvernance d'entreprise"
    ]
  },
  "recommendation": {
    "maxExposure": 500000000,
    "suggestedCollateral": ["Garanties immobilières", "Nantissement d'équipement"],
    "monitoringFrequency": "trimestrielle",
    "additionalConditions": [
      "Reporting financier trimestriel",
      "Notification de tout changement majeur de direction"
    ]
  }
}
```

### Récupérer l'historique des risques d'une entreprise

Récupère l'historique des risques pour une entreprise.

**Endpoint** : `GET /risk/central/company/:companyId/history`

**Paramètres de requête** :
- `companyId` : Identifiant unique de l'entreprise
- `startDate` (optionnel) : Date de début (format ISO)
- `endDate` (optionnel) : Date de fin (format ISO)

**Réponse réussie** (200 OK) :

```json
{
  "companyId": "123456",
  "companyName": "Entreprise ABC",
  "history": [
    {
      "date": "2025-01-15",
      "creditScore": 82,
      "riskCategory": "low"
    },
    {
      "date": "2025-04-15",
      "creditScore": 78,
      "riskCategory": "medium",
      "significantChanges": [
        {
          "type": "incident_paiement",
          "description": "Retard de paiement sur échéance de crédit",
          "impact": "negative"
        }
      ]
    },
    {
      "date": "2025-07-15",
      "creditScore": 78,
      "riskCategory": "medium"
    }
  ],
  "trend": "stable",
  "volatility": 0.05
}
```

## Implémentation technique

Les endpoints ci-dessus sont implémentés dans deux modules distincts :

1. Le module `risk.api.ts` qui fournit les fonctions suivantes :
   - `getCreditRisk(companyId)` : Récupère les données de risque crédit
   - `getLeasingRisk(companyId)` : Récupère les données de risque leasing
   - `getInvestmentRisk(companyId)` : Récupère les données de risque investissement
   - `submitRiskEntry(type, entry)` : Soumet une nouvelle entrée de risque
   - `updateRiskEntry(type, id, updates)` : Met à jour une entrée de risque
   - `getRiskSummary(filters)` : Récupère un rapport de synthèse

2. Le module `centrale-risque.api.ts` qui fournit des fonctions plus détaillées :
   - `getCompanyRiskProfile(companyId)` : Récupère le profil de risque complet
   - `getCompanyPaymentIncidents(companyId, period)` : Récupère les incidents de paiement
   - `getCompanyEngagements(companyId)` : Récupère les engagements financiers
   - `addRiskEntry(entry)` : Ajoute une entrée de risque
   - `updateRiskEntry(id, updates)` : Met à jour une entrée de risque
   - `getActiveRiskAlerts(filters)` : Récupère les alertes de risque actives
   - `getRiskStatistics()` : Récupère les statistiques de risque
   - `getFullRiskReport(companyId)` : Récupère le rapport de risque complet
   - `getRiskHistory(companyId, startDate, endDate)` : Récupère l'historique des risques

En mode développement ou hors ligne, ces fonctions utilisent un mécanisme de stockage local (localStorage) pour persister les données via le service `centraleRisqueStorageService`.

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide ou paramètres manquants |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Ressource non trouvée |
| 422  | Entité non traitable - Validation échouée |
| 500  | Erreur serveur interne |

## Modèles de données

### CreditRiskEntry

| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de l'entrée |
| companyId | string | Identifiant de l'entreprise |
| companyName | string | Nom de l'entreprise |
| sector | string | Secteur d'activité |
| institution | string | Institution financière |
| encours | number | Montant de l'encours |
| statut | string | Statut (Actif, En défaut, Clôturé) |
| coteCredit | string | Note de crédit (A, B, C, D) |
| incidents | number | Nombre d'incidents |
| creditScore | number | Score de crédit (0-100) |
| debtRatio | number | Ratio d'endettement |
| lastUpdated | string | Date de dernière mise à jour |

### LeasingRiskEntry

| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de l'entrée |
| companyId | string | Identifiant de l'entreprise |
| companyName | string | Nom de l'entreprise |
| sector | string | Secteur d'activité |
| institution | string | Institution financière |
| equipmentType | string | Type d'équipement |
| valeurFinancement | number | Valeur du financement |
| statut | string | Statut (Actif, En défaut, Clôturé) |
| coteCredit | string | Note de crédit (A, B, C, D) |
| incidents | number | Nombre d'incidents |
| lastUpdated | string | Date de dernière mise à jour |

### InvestmentRiskEntry

| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de l'entrée |
| companyId | string | Identifiant de l'entreprise |
| companyName | string | Nom de l'entreprise |
| sector | string | Secteur d'activité |
| institution | string | Institution financière |
| investmentType | string | Type d'investissement (Action, Obligation) |
| montantInvesti | number | Montant investi |
| valorisation | number | Valorisation actuelle |
| statut | string | Statut (Performant, En difficulté, Clôturé) |
| coteCredit | string | Note de crédit (A, B, C, D) |
| rendementActuel | number | Rendement actuel |
| lastUpdated | string | Date de dernière mise à jour |
