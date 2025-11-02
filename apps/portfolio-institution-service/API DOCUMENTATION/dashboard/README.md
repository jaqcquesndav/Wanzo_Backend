# Documentation du Dashboard Portefeuille Traditionnel

Cette section détaille les endpoints de l'API spécifiques au tableau de bord pour les portefeuilles traditionnels (crédit classique) de la plateforme Wanzo Portfolio Institution.

## Structure du Dashboard Traditionnel

Le dashboard pour les portefeuilles traditionnels se concentre sur les métriques suivantes :
- Performance des crédits accordés
- Répartition par type de crédit
- Analyse des risques et retards de paiement
- Indicateurs clés de performance (KPIs)

## Types de Données Principaux

Les types de données principaux utilisés dans les API sont les suivants:

```typescript
interface TraditionalDashboardMetrics {
  assets: TraditionalAssetMetrics;
  performance: BasePerformanceMetrics;
  risk: TraditionalRiskMetrics;
  clients: BaseClientMetrics;
  paymentStatus?: {
    onTime: number;
    late30Days: number;
    late60Days: number;
    late90Days: number;
  };
}

interface TraditionalAssetMetrics extends BaseAssetMetrics {
  distribution: {
    credit: number;
    microfinance: number;
    treasury: number;
  };
  creditUtilization: number;
}

interface TraditionalRiskMetrics extends BaseRiskMetrics {
  delinquencyRate: number;
  provisionRate: number;
  concentrationRisk: number;
}

interface BasePerformanceMetrics {
  global: number;
  change: number;
  monthly: Array<{
    month: string;
    value: number;
    benchmark: number;
  }>;
}
```

## Endpoints spécifiques

### Récupération des KPIs du portefeuille traditionnel

Récupère les indicateurs clés de performance (KPIs) spécifiques aux portefeuilles traditionnels.

#### Requête

```
GET /portfolio/api/v1/dashboard
```

#### Réponse

```json
{
  "type": "traditional",
  "count": 12,
  "totalValue": 5000000,
  "growth": 2.8,
  "avgRiskScore": 2.4,
  "performance": {
    "monthly": 0.8,
    "quarterly": 2.1,
    "yearly": 7.5
  },
  "topPortfolios": [
    {
      "id": "port-456",
      "name": "Portefeuille PME",
      "value": 1800000,
      "growth": 1.8
    },
    {
      "id": "port-789",
      "name": "Portefeuille Micro-finance",
      "value": 1200000,
      "growth": 3.2
    }
  ],
  "metrics": {
    "delinquencyRate": 3.2,
    "provisionRate": 2.5,
    "concentrationRisk": 12.4,
    "creditUtilization": 75
  }
}
```

### Récupération des données de performance pour un portefeuille

Récupère les données de performance pour un portefeuille traditionnel spécifique.

#### Requête

```
GET /portfolio/api/v1/dashboard/portfolio/{portfolioId}/performance?type={type}&period={period}
```

#### Paramètres de requête

| Paramètre   | Type   | Description | Requis |
|-------------|--------|-------------|--------|
| portfolioId | string | ID du portefeuille | Oui |
| type        | string | Type de portefeuille (doit être 'traditional' ici) | Oui |
| period      | string | Période d'analyse ('daily', 'weekly', 'monthly', 'quarterly', 'yearly') | Oui |

#### Réponse

```json
{
  "id": "port-456",
  "name": "Portefeuille PME",
  "type": "traditional",
  "period": "monthly",
  "data": [
    { "date": "2025-01-01", "value": 1750000 },
    { "date": "2025-02-01", "value": 1760000 },
    { "date": "2025-03-01", "value": 1770000 },
    { "date": "2025-04-01", "value": 1780000 },
    { "date": "2025-05-01", "value": 1790000 },
    { "date": "2025-06-01", "value": 1800000 }
  ],
  "metrics": {
    "totalReturn": 2.8,
    "annualizedReturn": 5.6,
    "volatility": 0.5,
    "sharpeRatio": 2.1,
    "maxDrawdown": 0.2
  }
}
```

### Récupération des tendances de portefeuille

Récupère les données de tendance pour tous les portefeuilles, y compris le type traditionnel.

#### Requête

```
GET /portfolio/api/v1/dashboard/trends?period={period}
```

#### Paramètres de requête

| Paramètre | Type   | Description | Requis |
|-----------|--------|-------------|--------|
| period    | string | Période d'analyse ('daily', 'weekly', 'monthly', 'quarterly', 'yearly') | Oui |

#### Réponse

```json
{
  "period": "monthly",
  "trends": {
    "traditional": {
      "growth": 2.8,
      "data": [
        { "date": "2025-01-01", "value": 4850000 },
        { "date": "2025-02-01", "value": 4880000 },
        { "date": "2025-03-01", "value": 4910000 },
        { "date": "2025-04-01", "value": 4940000 },
        { "date": "2025-05-01", "value": 4970000 },
        { "date": "2025-06-01", "value": 5000000 }
      ]
    },
    "investment": {
      "growth": 7.5,
      "data": [/* ... */]
    },
    "leasing": {
      "growth": 3.5,
      "data": [/* ... */]
    }
  }
}
```

## Composants UI associés

Les principaux composants UI utilisés pour afficher les données du dashboard traditionnel sont :

- `PortfolioPerformanceChart` - Affiche la performance des portefeuilles traditionnels
- `CreditDistributionPieChart` - Montre la répartition des crédits par type
- `DelinquencyRateChart` - Montre l'évolution du taux de retard de paiement
- `PaymentStatusDashboard` - Affiche les statuts de paiement (à temps, retards)

Ces composants utilisent les données fournies par les endpoints API décrits ci-dessus.
