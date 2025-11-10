# Dashboard et Métriques - Documentation API Complète

Ce document décrit tous les endpoints pour le tableau de bord et les métriques dans l'API Wanzo Portfolio Institution basés sur le DashboardController réellement implémenté.

## Endpoints principaux du dashboard

### Tableau de bord principal

Récupère les données consolidées du tableau de bord principal.

**Endpoint** : `GET /dashboard`

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPortfolios": 5,
      "totalContracts": 123,
      "totalAmount": 2500000000.00,
      "activeContracts": 98,
      "pendingApprovals": 12
    },
    "recentActivity": [
      {
        "type": "contract_created",
        "description": "Nouveau contrat créé pour ABC Corp",
        "amount": 5000000.00,
        "timestamp": "2025-11-10T14:30:00.000Z"
      }
    ],
    "alerts": [
      {
        "type": "payment_overdue",
        "message": "3 paiements en retard nécessitent attention",
        "severity": "high",
        "count": 3
      }
    ]
  }
}
```

### Dashboard portefeuilles traditionnels (Legacy)

Récupère les métriques des portefeuilles traditionnels avec options de filtrage.

**Endpoint** : `GET /dashboard/traditional`

**Paramètres de requête** :
- `portfolio_id` (optionnel) : Filtre par portefeuille spécifique
- `period` (optionnel) : Période des métriques (daily, weekly, monthly, quarterly, yearly)
- `start_date` (optionnel) : Date de début (YYYY-MM-DD)
- `end_date` (optionnel) : Date de fin (YYYY-MM-DD)

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPortfolios": 3,
      "totalValue": 1500000000.00,
      "totalContracts": 87,
      "averageReturn": 12.5,
      "riskLevel": "moderate"
    },
    "performance": {
      "monthly": [
        {
          "month": "2025-10",
          "return": 13.2,
          "disbursements": 150000000.00,
          "repayments": 98000000.00
        }
      ]
    },
    "portfolios": [
      {
        "id": "portfolio-123",
        "name": "PME Nord-Kivu",
        "value": 500000000.00,
        "return": 14.1,
        "contracts": 32,
        "status": "active"
      }
    ]
  }
}
```

## Endpoints métriques OHADA/BCEAO

### Métriques OHADA globales

Récupère toutes les métriques de conformité OHADA pour l'institution.

**Endpoint** : `GET /dashboard/metrics/ohada`

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "institution": {
      "id": "inst-456",
      "name": "Banque Exemple",
      "reportingDate": "2025-11-10T16:00:00.000Z"
    },
    "portfolios": [
      {
        "portfolioId": "portfolio-123",
        "portfolioName": "PME Nord-Kivu",
        "metrics": {
          "totalOutstandingAmount": 450000000.00,
          "totalProvisions": 11250000.00,
          "provisionRate": 2.5,
          "nonPerformingLoans": {
            "amount": 22500000.00,
            "rate": 5.0,
            "count": 8
          },
          "riskClassification": {
            "saine": { "amount": 360000000.00, "count": 65 },
            "surveillance": { "amount": 67500000.00, "count": 12 },
            "douteuse": { "amount": 18000000.00, "count": 4 },
            "compromise": { "amount": 4500000.00, "count": 4 }
          },
          "sectorialDistribution": {
            "commerce": { "amount": 180000000.00, "percentage": 40.0 },
            "industrie": { "amount": 135000000.00, "percentage": 30.0 },
            "agriculture": { "amount": 90000000.00, "percentage": 20.0 },
            "services": { "amount": 45000000.00, "percentage": 10.0 }
          },
          "maturityAnalysis": {
            "moins_1_an": { "amount": 112500000.00, "percentage": 25.0 },
            "1_a_5_ans": { "amount": 270000000.00, "percentage": 60.0 },
            "plus_5_ans": { "amount": 67500000.00, "percentage": 15.0 }
          },
          "collateralCoverage": {
            "totalCollateral": 585000000.00,
            "coverageRatio": 130.0,
            "guaranteeTypes": {
              "hypothecaire": 351000000.00,
              "mobiliere": 117000000.00,
              "bancaire": 117000000.00
            }
          },
          "complianceIndicators": {
            "singleBorrowerLimit": {
              "isCompliant": true,
              "maxExposure": 75000000.00,
              "limitPercentage": 15.0
            },
            "provisioning": {
              "isCompliant": true,
              "requiredProvisions": 11250000.00,
              "actualProvisions": 11250000.00
            },
            "largeExposures": {
              "isCompliant": true,
              "count": 3,
              "totalAmount": 180000000.00
            }
          }
        }
      }
    ],
    "aggregatedMetrics": {
      "totalOutstandingAmount": 1200000000.00,
      "totalProvisions": 30000000.00,
      "overallProvisionRate": 2.5,
      "overallNPLRate": 4.2,
      "totalCollateralCoverage": 125.5
    }
  }
}
```

### Métriques d'un portefeuille spécifique

Récupère les métriques OHADA détaillées pour un portefeuille donné.

**Endpoint** : `GET /dashboard/metrics/portfolio/{portfolioId}`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "portfolioId": "portfolio-123",
    "portfolioName": "PME Nord-Kivu",
    "reportingDate": "2025-11-10T16:00:00.000Z",
    "totalOutstandingAmount": 450000000.00,
    "totalProvisions": 11250000.00,
    "provisionRate": 2.5,
    "nonPerformingLoans": {
      "amount": 22500000.00,
      "rate": 5.0,
      "count": 8,
      "breakdown": {
        "0_30_days": { "amount": 9000000.00, "count": 3 },
        "31_60_days": { "amount": 6750000.00, "count": 2 },
        "61_90_days": { "amount": 4500000.00, "count": 2 },
        "over_90_days": { "amount": 2250000.00, "count": 1 }
      }
    },
    "riskClassification": {
      "saine": {
        "amount": 360000000.00,
        "count": 65,
        "percentage": 80.0,
        "provisionRate": 1.0
      },
      "surveillance": {
        "amount": 67500000.00,
        "count": 12,
        "percentage": 15.0,
        "provisionRate": 5.0
      },
      "douteuse": {
        "amount": 18000000.00,
        "count": 4,
        "percentage": 4.0,
        "provisionRate": 50.0
      },
      "compromise": {
        "amount": 4500000.00,
        "count": 4,
        "percentage": 1.0,
        "provisionRate": 100.0
      }
    },
    "performanceIndicators": {
      "returnOnAssets": 14.2,
      "netInterestMargin": 8.5,
      "costOfRisk": 2.1,
      "operationalEfficiency": 65.3
    }
  }
}
```

### Métriques globales consolidées

Récupère les métriques agrégées de tous les portefeuilles de l'institution.

**Endpoint** : `GET /dashboard/metrics/global`

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "institution": {
      "id": "inst-456",
      "name": "Banque Exemple",
      "totalPortfolios": 5
    },
    "aggregatedMetrics": {
      "totalOutstandingAmount": 2500000000.00,
      "totalProvisions": 62500000.00,
      "overallProvisionRate": 2.5,
      "overallNPLRate": 4.8,
      "totalCollateralCoverage": 128.5,
      "averageReturn": 12.8,
      "totalContracts": 234,
      "activeContracts": 198,
      "completedContracts": 36
    },
    "sectorDistribution": {
      "commerce": { "amount": 750000000.00, "percentage": 30.0 },
      "industrie": { "amount": 625000000.00, "percentage": 25.0 },
      "agriculture": { "amount": 500000000.00, "percentage": 20.0 },
      "services": { "amount": 375000000.00, "percentage": 15.0 },
      "immobilier": { "amount": 250000000.00, "percentage": 10.0 }
    },
    "geographicDistribution": {
      "kinshasa": { "amount": 1000000000.00, "percentage": 40.0 },
      "nord_kivu": { "amount": 750000000.00, "percentage": 30.0 },
      "sud_kivu": { "amount": 500000000.00, "percentage": 20.0 },
      "autres": { "amount": 250000000.00, "percentage": 10.0 }
    }
  }
}
```

### Résumé de conformité

Récupère le statut de conformité réglementaire de l'institution.

**Endpoint** : `GET /dashboard/compliance/summary`

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "institution": {
      "id": "inst-456",
      "name": "Banque Exemple",
      "reportingDate": "2025-11-10T16:00:00.000Z"
    },
    "overallComplianceScore": 92.5,
    "complianceStatus": "COMPLIANT",
    "categories": {
      "creditRisk": {
        "score": 95.0,
        "status": "COMPLIANT",
        "checks": [
          {
            "name": "Single Borrower Limit",
            "status": "COMPLIANT",
            "value": 12.5,
            "limit": 15.0
          },
          {
            "name": "Large Exposures",
            "status": "COMPLIANT", 
            "count": 8,
            "limit": 10
          }
        ]
      },
      "provisioning": {
        "score": 88.0,
        "status": "COMPLIANT",
        "checks": [
          {
            "name": "Provision Coverage",
            "status": "COMPLIANT",
            "value": 98.5,
            "minimum": 90.0
          }
        ]
      },
      "liquidity": {
        "score": 94.5,
        "status": "COMPLIANT",
        "checks": [
          {
            "name": "Liquidity Ratio",
            "status": "COMPLIANT",
            "value": 125.3,
            "minimum": 100.0
          }
        ]
      }
    },
    "alerts": [
      {
        "type": "WARNING",
        "category": "provisioning",
        "message": "Portfolio PME Sud-Kivu proche du seuil de provisioning",
        "portfolioId": "portfolio-789",
        "currentValue": 91.2,
        "threshold": 90.0
      }
    ],
    "recommendations": [
      {
        "priority": "MEDIUM",
        "category": "risk-management",
        "description": "Réviser la politique de collatéral pour le secteur agricole",
        "impact": "Amélioration potentielle de 2.5% du taux de couverture"
      }
    ]
  }
}
```

## Endpoints de customisation du dashboard

### Préférences utilisateur du dashboard

Récupère les préférences de customisation du tableau de bord pour un utilisateur.

**Endpoint** : `GET /dashboard/preferences/{userId}`

**Paramètres de chemin** :
- `userId` : Identifiant unique de l'utilisateur

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "preferences": {
      "layout": "grid",
      "theme": "dark",
      "autoRefresh": true,
      "refreshInterval": 300,
      "widgets": {
        "portfolio_overview": {
          "visible": true,
          "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
        },
        "risk_metrics": {
          "visible": true,
          "position": { "x": 6, "y": 0, "w": 6, "h": 4 }
        },
        "recent_activity": {
          "visible": true,
          "position": { "x": 0, "y": 4, "w": 12, "h": 3 }
        },
        "compliance_status": {
          "visible": false,
          "position": { "x": 0, "y": 7, "w": 6, "h": 3 }
        }
      }
    },
    "lastUpdated": "2025-11-10T15:30:00.000Z"
  }
}
```

### Mise à jour d'un widget

Met à jour la visibilité et/ou la position d'un widget spécifique.

**Endpoint** : `PUT /dashboard/preferences/{userId}/widget/{widgetId}`

**Paramètres de chemin** :
- `userId` : Identifiant unique de l'utilisateur
- `widgetId` : Identifiant unique du widget

**Corps de la requête** :

```json
{
  "visible": true,
  "position": { "x": 3, "y": 2, "w": 6, "h": 4 }
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "Widget mis à jour avec succès",
  "data": {
    "userId": "user-123",
    "widgetId": "risk_metrics",
    "visible": true,
    "position": { "x": 3, "y": 2, "w": 6, "h": 4 },
    "updatedAt": "2025-11-10T16:45:00.000Z"
  }
}
```

### Réinitialisation des préférences

Remet les préférences du dashboard aux valeurs par défaut.

**Endpoint** : `POST /dashboard/preferences/{userId}/reset`

**Paramètres de chemin** :
- `userId` : Identifiant unique de l'utilisateur

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "Préférences remises aux valeurs par défaut",
  "data": {
    "userId": "user-123",
    "preferences": {
      "layout": "grid",
      "theme": "light",
      "autoRefresh": false,
      "refreshInterval": 600,
      "widgets": {
        "portfolio_overview": {
          "visible": true,
          "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
        },
        "risk_metrics": {
          "visible": true,
          "position": { "x": 6, "y": 0, "w": 6, "h": 4 }
        },
        "recent_activity": {
          "visible": true,
          "position": { "x": 0, "y": 4, "w": 12, "h": 3 }
        }
      }
    },
    "resetAt": "2025-11-10T17:00:00.000Z"
  }
}
```

### Widgets disponibles

Récupère la liste complète des widgets disponibles avec leurs métadonnées.

**Endpoint** : `GET /dashboard/widgets/available`

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "portfolio_overview",
      "name": "Vue d'ensemble des portefeuilles",
      "description": "Résumé des performances des portefeuilles",
      "category": "overview",
      "defaultSize": { "w": 6, "h": 4 },
      "minSize": { "w": 4, "h": 3 },
      "maxSize": { "w": 12, "h": 8 },
      "configurable": true,
      "defaultVisible": true
    },
    {
      "id": "risk_metrics",
      "name": "Métriques de risque",
      "description": "Indicateurs de risque et conformité OHADA",
      "category": "risk",
      "defaultSize": { "w": 6, "h": 4 },
      "minSize": { "w": 4, "h": 3 },
      "maxSize": { "w": 8, "h": 6 },
      "configurable": true,
      "defaultVisible": true
    },
    {
      "id": "recent_activity",
      "name": "Activité récente",
      "description": "Dernières transactions et événements",
      "category": "activity",
      "defaultSize": { "w": 12, "h": 3 },
      "minSize": { "w": 6, "h": 2 },
      "maxSize": { "w": 12, "h": 6 },
      "configurable": false,
      "defaultVisible": true
    },
    {
      "id": "compliance_status",
      "name": "Statut de conformité",
      "description": "Indicateurs de conformité réglementaire",
      "category": "compliance",
      "defaultSize": { "w": 6, "h": 3 },
      "minSize": { "w": 4, "h": 2 },
      "maxSize": { "w": 8, "h": 5 },
      "configurable": true,
      "defaultVisible": false
    }
  ]
}
```

## Structures de données

### DashboardData

```typescript
interface DashboardData {
  summary: {
    totalPortfolios: number;
    totalContracts: number;
    totalAmount: number;
    activeContracts: number;
    pendingApprovals: number;
  };
  recentActivity: Activity[];
  alerts: Alert[];
}
```

### TraditionalDashboardMetrics

```typescript
interface TraditionalDashboardMetrics {
  overview: {
    totalPortfolios: number;
    totalValue: number;
    totalContracts: number;
    averageReturn: number;
    riskLevel: string;
  };
  performance: {
    monthly: MonthlyPerformance[];
  };
  portfolios: PortfolioSummary[];
}
```

### OHADAMetrics

```typescript
interface OHADAMetrics {
  portfolioId: string;
  portfolioName: string;
  reportingDate: string;
  totalOutstandingAmount: number;
  totalProvisions: number;
  provisionRate: number;
  nonPerformingLoans: NPLData;
  riskClassification: RiskClassification;
  performanceIndicators: PerformanceIndicators;
}
```

### DashboardPreferences

```typescript
interface DashboardPreferences {
  userId: string;
  preferences: {
    layout: 'grid' | 'list';
    theme: 'light' | 'dark';
    autoRefresh: boolean;
    refreshInterval: number;
    widgets: Record<string, WidgetConfig>;
  };
  lastUpdated: string;
}
```

### WidgetConfig

```typescript
interface WidgetConfig {
  visible: boolean;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}
```

## Codes d'erreur spécifiques

| Code HTTP | Code d'erreur | Description |
|-----------|---------------|-------------|
| 400 | INVALID_WIDGET_CONFIG | Configuration de widget invalide |
| 400 | INVALID_DATE_RANGE | Plage de dates invalide |
| 404 | PORTFOLIO_NOT_FOUND | Portefeuille non trouvé |
| 404 | USER_PREFERENCES_NOT_FOUND | Préférences utilisateur non trouvées |
| 500 | METRICS_CALCULATION_ERROR | Erreur lors du calcul des métriques |

---

*Documentation mise à jour le 10 novembre 2025 basée sur le DashboardController réellement implémenté dans le portfolio-institution-service.*