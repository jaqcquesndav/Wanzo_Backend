# Dashboard API

Ce document décrit les endpoints pour la gestion des tableaux de bord et métriques dans l'API Wanzo Portfolio Institution.

## Types de données

Les types principaux utilisés dans l'API de dashboard:

```typescript
interface DashboardMetrics {
  // Métriques financières générales
  totalValue: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
  riskScore: number;
  
  // Répartition par secteur
  sectorDistribution: Array<{
    sector: string;
    percentage: number;
    value: number;
  }>;
  
  // Performance historique
  performanceHistory: Array<{
    date: string;
    value: number;
    benchmark?: number;
  }>;
}

interface TraditionalDashboardMetrics extends DashboardMetrics {
  // Métriques spécifiques aux portefeuilles traditionnels
  totalCredits: number;
  activeCredits: number;
  totalDisbursed: number;
  totalRepaid: number;
  
  // Indicateurs de qualité du portefeuille
  portfolioAtRisk: number;  // PAR
  defaultRate: number;
  
  // Statuts des crédits
  creditsByStatus: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
  
  // Échéances
  upcomingDueDates: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}

interface OHADAMetrics {
  // Métriques de conformité OHADA
  complianceScore: number;
  regulatoryRatio: number;
  capitalAdequacy: number;
  liquidityRatio: number;
  
  // Ratios prudentiels
  prudentialRatios: Array<{
    name: string;
    value: number;
    threshold: number;
    status: 'compliant' | 'warning' | 'breach';
  }>;
}

interface WidgetPreference {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
  configuration: Record<string, any>;
}
```

## Endpoints

### Récupérer les métriques du tableau de bord principal

Récupère les métriques générales du tableau de bord.

**Endpoint** : `GET /portfolio/api/v1/dashboard`

**Paramètres de requête** :
- `portfolioId` (optionnel) : Filtre par ID de portefeuille
- `dateRange` (optionnel) : Période ('7d', '30d', '90d', '1y')

**Réponse** :

```json
{
  "totalValue": 125000000,
  "monthlyGrowth": 3.2,
  "yearlyGrowth": 15.8,
  "riskScore": 7.2,
  "sectorDistribution": [
    {
      "sector": "Commerce",
      "percentage": 35,
      "value": 43750000
    },
    {
      "sector": "Services",
      "percentage": 25,
      "value": 31250000
    },
    {
      "sector": "Agriculture",
      "percentage": 20,
      "value": 25000000
    },
    {
      "sector": "Industrie",
      "percentage": 20,
      "value": 25000000
    }
  ],
  "performanceHistory": [
    {
      "date": "2025-07-01",
      "value": 120000000,
      "benchmark": 118000000
    },
    {
      "date": "2025-08-01",
      "value": 122500000,
      "benchmark": 119500000
    },
    {
      "date": "2025-09-01",
      "value": 125000000,
      "benchmark": 121000000
    }
  ]
}
```

### Récupérer les métriques globales

Récupère les métriques agrégées de tous les portefeuilles.

**Endpoint** : `GET /portfolio/api/v1/dashboard/metrics/global`

**Réponse** :

```json
{
  "totalPortfolios": 15,
  "totalValue": 500000000,
  "totalClients": 1250,
  "averagePortfolioSize": 33333333,
  "topPerformingPortfolio": {
    "id": "port-123",
    "name": "Portefeuille PME Nord",
    "performance": 18.5
  },
  "riskDistribution": {
    "low": 60,
    "medium": 30,
    "high": 10
  }
}
```

### Récupérer les métriques d'un portefeuille

Récupère les métriques détaillées d'un portefeuille spécifique.

**Endpoint** : `GET /portfolio/api/v1/dashboard/metrics/portfolio/{portfolioId}`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille

**Réponse** (pour un portefeuille traditionnel) :

```json
{
  "totalValue": 125000000,
  "monthlyGrowth": 3.2,
  "yearlyGrowth": 15.8,
  "riskScore": 7.2,
  "totalCredits": 85,
  "activeCredits": 72,
  "totalDisbursed": 98000000,
  "totalRepaid": 23000000,
  "portfolioAtRisk": 4.5,
  "defaultRate": 2.1,
  "creditsByStatus": [
    {
      "status": "active",
      "count": 72,
      "amount": 89500000
    },
    {
      "status": "completed",
      "count": 10,
      "amount": 8000000
    },
    {
      "status": "defaulted",
      "count": 3,
      "amount": 2500000
    }
  ],
  "upcomingDueDates": [
    {
      "date": "2025-11-15",
      "amount": 2500000,
      "count": 15
    },
    {
      "date": "2025-11-30",
      "amount": 3200000,
      "count": 18
    }
  ]
}
```

### Récupérer les métriques OHADA

Récupère les métriques de conformité réglementaire OHADA.

**Endpoint** : `GET /portfolio/api/v1/dashboard/metrics/ohada`

**Réponse** :

```json
{
  "complianceScore": 92.5,
  "regulatoryRatio": 15.8,
  "capitalAdequacy": 12.5,
  "liquidityRatio": 25.3,
  "prudentialRatios": [
    {
      "name": "Ratio de fonds propres",
      "value": 12.5,
      "threshold": 8.0,
      "status": "compliant"
    },
    {
      "name": "Ratio de liquidité",
      "value": 25.3,
      "threshold": 20.0,
      "status": "compliant"
    },
    {
      "name": "Ratio de division des risques",
      "value": 18.5,
      "threshold": 25.0,
      "status": "warning"
    }
  ],
  "lastUpdated": "2025-11-04T10:30:00.000Z"
}
```

### Récupérer le résumé de conformité

Récupère un résumé de la conformité réglementaire.

**Endpoint** : `GET /portfolio/api/v1/dashboard/compliance/summary`

**Réponse** :

```json
{
  "overallScore": 85.2,
  "categories": [
    {
      "name": "Ratios prudentiels",
      "score": 92.5,
      "status": "compliant",
      "issues": 0,
      "warnings": 1
    },
    {
      "name": "Reporting réglementaire",
      "score": 78.0,
      "status": "warning",
      "issues": 0,
      "warnings": 3
    },
    {
      "name": "Gestion des risques",
      "score": 88.5,
      "status": "compliant",
      "issues": 0,
      "warnings": 0
    }
  ],
  "recentAlerts": [
    {
      "id": "alert-001",
      "level": "warning",
      "message": "Ratio de division des risques proche du seuil",
      "timestamp": "2025-11-04T09:15:00.000Z",
      "category": "prudentiel"
    }
  ]
}
```

### Récupérer les données de risque de la banque centrale

Récupère les données de risque provenant de la banque centrale.

**Endpoint** : `GET /portfolio/api/v1/dashboard/risk/central-bank`

**Réponse** :

```json
{
  "totalExposure": 45000000,
  "riskWeightedAssets": 38250000,
  "concentrationRisk": {
    "largestExposure": 8500000,
    "top5Exposures": 28750000,
    "concentrationRatio": 18.9
  },
  "sectorConcentration": [
    {
      "sector": "Commerce",
      "exposure": 15750000,
      "percentage": 35.0,
      "riskWeight": 100
    },
    {
      "sector": "Agriculture",
      "exposure": 11250000,
      "percentage": 25.0,
      "riskWeight": 75
    }
  ],
  "lastUpdate": "2025-11-04T08:00:00.000Z"
}
```

### Récupérer l'analyse de risque d'un portefeuille

Récupère l'analyse détaillée des risques d'un portefeuille.

**Endpoint** : `GET /portfolio/api/v1/dashboard/risk/portfolios/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Réponse** :

```json
{
  "portfolioId": "port-123",
  "overallRiskScore": 7.2,
  "riskLevel": "medium",
  "factors": [
    {
      "name": "Concentration sectorielle",
      "score": 6.5,
      "weight": 0.3,
      "description": "Concentration élevée dans le secteur commerce"
    },
    {
      "name": "Qualité du portefeuille",
      "score": 8.2,
      "weight": 0.4,
      "description": "PAR à 30 jours acceptable"
    },
    {
      "name": "Diversification géographique",
      "score": 7.8,
      "weight": 0.2,
      "description": "Bonne répartition géographique"
    }
  ],
  "recommendations": [
    "Diversifier les secteurs d'activité",
    "Renforcer le suivi des créances"
  ],
  "var": {
    "var95": 1250000,
    "var99": 2100000,
    "expectedShortfall": 2850000
  }
}
```

### Récupérer les préférences du tableau de bord

Récupère les préférences de configuration du tableau de bord pour un utilisateur.

**Endpoint** : `GET /portfolio/api/v1/dashboard/preferences/{userId}`

**Paramètres de chemin** :
- `userId` : Identifiant unique de l'utilisateur

**Réponse** :

```json
{
  "userId": "user-123",
  "dashboardLayout": "grid",
  "widgets": [
    {
      "id": "widget-001",
      "type": "metric",
      "title": "Valeur totale du portefeuille",
      "position": { "x": 0, "y": 0 },
      "size": { "width": 4, "height": 2 },
      "isVisible": true,
      "configuration": {
        "portfolioId": "port-123",
        "metric": "totalValue",
        "format": "currency"
      }
    },
    {
      "id": "widget-002",
      "type": "chart",
      "title": "Performance mensuelle",
      "position": { "x": 4, "y": 0 },
      "size": { "width": 8, "height": 4 },
      "isVisible": true,
      "configuration": {
        "chartType": "line",
        "dataSource": "performanceHistory",
        "timeRange": "12m"
      }
    }
  ],
  "refreshInterval": 300,
  "lastUpdated": "2025-11-04T10:15:00.000Z"
}
```

### Mettre à jour un widget du tableau de bord

Met à jour la configuration d'un widget spécifique.

**Endpoint** : `PUT /portfolio/api/v1/dashboard/preferences/{userId}/widget/{widgetId}`

**Paramètres de chemin** :
- `userId` : Identifiant unique de l'utilisateur
- `widgetId` : Identifiant unique du widget

**Corps de la requête** :

```json
{
  "position": { "x": 0, "y": 4 },
  "size": { "width": 6, "height": 3 },
  "isVisible": false,
  "configuration": {
    "timeRange": "6m"
  }
}
```

**Réponse** :

```json
{
  "id": "widget-002",
  "type": "chart",
  "title": "Performance mensuelle",
  "position": { "x": 0, "y": 4 },
  "size": { "width": 6, "height": 3 },
  "isVisible": false,
  "configuration": {
    "chartType": "line",
    "dataSource": "performanceHistory",
    "timeRange": "6m"
  },
  "updatedAt": "2025-11-04T11:00:00.000Z"
}
```

### Réinitialiser les préférences du tableau de bord

Remet les préférences du tableau de bord aux valeurs par défaut.

**Endpoint** : `POST /portfolio/api/v1/dashboard/preferences/{userId}/reset`

**Paramètres de chemin** :
- `userId` : Identifiant unique de l'utilisateur

**Réponse** :

```json
{
  "success": true,
  "message": "Préférences réinitialisées avec succès",
  "defaultLayout": "grid",
  "widgetCount": 6
}
```

## Codes d'erreur

| Code HTTP | Code d'erreur                | Description                                           |
|-----------|------------------------------|-------------------------------------------------------|
| 400       | INVALID_DATE_RANGE           | Plage de dates invalide                              |
| 403       | INSUFFICIENT_PERMISSIONS     | Permissions insuffisantes pour accéder aux métriques |
| 404       | PORTFOLIO_NOT_FOUND          | Portefeuille non trouvé                              |
| 404       | WIDGET_NOT_FOUND             | Widget non trouvé                                     |
| 422       | INVALID_WIDGET_CONFIGURATION | Configuration de widget invalide                      |

---

*Documentation mise à jour le 4 novembre 2025 pour correspondre aux endpoints du code source*