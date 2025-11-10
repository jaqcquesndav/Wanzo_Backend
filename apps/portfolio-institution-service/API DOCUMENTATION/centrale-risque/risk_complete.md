# Centrale de Risque - Documentation API Complète

Ce document décrit les endpoints pour la gestion des risques et l'évaluation des risques dans l'API Wanzo Portfolio Institution basés sur le RiskController et CentraleRisqueController réellement implémentés.

## Endpoints d'évaluation des risques

### Récupération de tous les risques

Récupère tous les risques avec filtrage optionnel par entreprise.

**Endpoint** : `GET /risk`

**Paramètres de requête** :
- `companyId` (optionnel) : Filtre par identifiant de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "risk-123",
      "companyId": "company-456",
      "companyName": "ABC Corp",
      "riskType": "credit",
      "riskScore": 7.2,
      "riskLevel": "medium",
      "evaluationDate": "2025-11-10T08:00:00.000Z",
      "factors": [
        {
          "name": "Financial Stability",
          "score": 8.1,
          "weight": 0.4
        },
        {
          "name": "Market Position",
          "score": 6.5,
          "weight": 0.3
        }
      ],
      "recommendations": [
        "Monitor cash flow closely",
        "Review collateral requirements"
      ]
    }
  ]
}
```

### Récupération d'un risque spécifique

Récupère les détails d'une évaluation de risque par son identifiant.

**Endpoint** : `GET /risk/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'évaluation de risque

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "risk-123",
    "companyId": "company-456",
    "companyName": "ABC Corp",
    "riskType": "credit",
    "riskScore": 7.2,
    "riskLevel": "medium",
    "evaluationDate": "2025-11-10T08:00:00.000Z",
    "evaluator": {
      "id": "user-789",
      "name": "Marie Martin",
      "role": "Risk Analyst"
    },
    "factors": [
      {
        "name": "Financial Stability",
        "score": 8.1,
        "weight": 0.4,
        "details": "Strong revenue growth, stable cash flow"
      },
      {
        "name": "Market Position",
        "score": 6.5,
        "weight": 0.3,
        "details": "Good market share but increasing competition"
      },
      {
        "name": "Management Quality",
        "score": 7.8,
        "weight": 0.2,
        "details": "Experienced management team"
      },
      {
        "name": "Industry Risk",
        "score": 6.2,
        "weight": 0.1,
        "details": "Cyclical industry with moderate outlook"
      }
    ],
    "recommendations": [
      "Monitor cash flow closely",
      "Review collateral requirements",
      "Set up quarterly reviews"
    ],
    "attachments": [
      {
        "id": "doc-123",
        "name": "Financial Analysis Report",
        "url": "/documents/financial-analysis-123.pdf"
      }
    ],
    "history": [
      {
        "date": "2025-05-10T08:00:00.000Z",
        "score": 7.8,
        "level": "medium",
        "evaluator": "user-456"
      }
    ]
  }
}
```

### Évaluation du risque crédit d'une entreprise

Récupère l'évaluation du risque crédit pour une entreprise spécifique.

**Endpoint** : `GET /risk/credit/{companyId}`

**Paramètres de chemin** :
- `companyId` : Identifiant unique de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "companyId": "company-456",
    "companyName": "ABC Corp",
    "riskType": "credit",
    "overallScore": 7.2,
    "riskLevel": "medium",
    "creditLimit": 50000000.00,
    "recommendedLimit": 45000000.00,
    "evaluationDate": "2025-11-10T08:00:00.000Z",
    "financialMetrics": {
      "revenueGrowth": 12.5,
      "profitMargin": 8.3,
      "debtToEquity": 1.2,
      "currentRatio": 2.1,
      "quickRatio": 1.8,
      "interestCoverage": 5.4
    },
    "creditHistory": {
      "paymentBehavior": "excellent",
      "defaultHistory": false,
      "averagePaymentDays": 28,
      "maxDelayDays": 45
    },
    "sectorAnalysis": {
      "sector": "Manufacturing",
      "sectorRisk": "medium",
      "outlook": "stable",
      "competitivePosition": "strong"
    },
    "guarantees": [
      {
        "type": "real_estate",
        "value": 60000000.00,
        "coverage": 120.0
      }
    ],
    "warningSignals": [],
    "nextReviewDate": "2026-02-10T08:00:00.000Z"
  }
}
```

### Évaluation du risque leasing d'une entreprise

Récupère l'évaluation du risque leasing pour une entreprise spécifique.

**Endpoint** : `GET /risk/leasing/{companyId}`

**Paramètres de chemin** :
- `companyId` : Identifiant unique de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "companyId": "company-456",
    "companyName": "ABC Corp", 
    "riskType": "leasing",
    "overallScore": 6.8,
    "riskLevel": "medium",
    "maxLeasingAmount": 35000000.00,
    "recommendedAmount": 30000000.00,
    "evaluationDate": "2025-11-10T08:00:00.000Z",
    "assetSpecific": {
      "assetType": "Industrial Equipment",
      "assetValue": 40000000.00,
      "residualValue": 12000000.00,
      "depreciation": "20% annual",
      "marketability": "good"
    },
    "operationalRisk": {
      "businessModel": "stable",  
      "operationalEfficiency": 7.5,
      "maintenanceCapability": "good",
      "technicalExpertise": "high"
    },
    "leasingHistory": {
      "previousLeases": 3,
      "paymentRecord": "excellent",
      "assetCare": "very good",
      "returnCondition": "good"
    },
    "sectorFactors": {
      "equipmentDemand": "stable",
      "technologicalObsolescence": "low",
      "regulatoryRisk": "minimal"
    },
    "recommendations": [
      "Standard leasing terms applicable",
      "Monitor asset utilization quarterly",
      "Review market conditions annually"
    ]
  }
}
```

## Endpoints de la centrale des risques

### Informations de la centrale des risques

Récupère les informations de risque d'une entreprise depuis la centrale des risques.

**Endpoint** : `GET /risk/central/company/{companyId}`

**Paramètres de chemin** :
- `companyId` : Identifiant unique de l'entreprise

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "companyId": "company-456",
    "companyName": "ABC Corp",
    "registrationNumber": "RC-123456",
    "queryDate": "2025-11-10T16:00:00.000Z",
    "centralRiskInfo": {
      "overallRating": "B+",
      "totalExposure": 125000000.00,
      "numberOfInstitutions": 5,
      "paymentBehavior": "satisfactory",
      "incidents": [
        {
          "date": "2025-08-15",
          "type": "late_payment",
          "severity": "minor",
          "institution": "Banque XYZ",
          "amount": 2500000.00,
          "resolved": true
        }
      ],
      "guarantees": [
        {
          "type": "real_estate",
          "value": 85000000.00,
          "institution": "Banque ABC"
        }
      ]
    },
    "financialSummary": {
      "revenue": 350000000.00,
      "netIncome": 28000000.00,
      "totalAssets": 180000000.00,
      "totalLiabilities": 95000000.00,
      "lastAuditDate": "2024-12-31"
    },
    "legalStatus": {
      "status": "active",
      "incorporationDate": "2018-03-15",
      "legalForm": "SARL",
      "headquarters": "Kinshasa, RDC"
    },
    "alerts": [],
    "recommendations": [
      "Monitor payment patterns",
      "Review guarantee adequacy annually"
    ]
  }
}
```

### Création d'une entrée de risque central

Crée une nouvelle entrée dans la centrale des risques.

**Endpoint** : `POST /risk/central`

**Corps de la requête** :

```json
{
  "companyId": "company-789",
  "institutionId": "inst-456",
  "exposureAmount": 15000000.00,
  "exposureType": "credit",
  "riskRating": "B",
  "guarantee": {
    "type": "equipment",
    "value": 18000000.00,
    "description": "Industrial machinery"
  },
  "remarks": "New client with good prospects"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "central-risk-123",
    "companyId": "company-789",
    "institutionId": "inst-456",
    "exposureAmount": 15000000.00,
    "exposureType": "credit",
    "riskRating": "B",
    "guarantee": {
      "type": "equipment",
      "value": 18000000.00,
      "description": "Industrial machinery"
    },
    "createdAt": "2025-11-10T17:30:00.000Z",
    "status": "active"
  }
}
```

### Mise à jour d'une entrée de risque central

Met à jour une entrée existante dans la centrale des risques.

**Endpoint** : `PUT /risk/central/entries/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'entrée

**Corps de la requête** :

```json
{
  "exposureAmount": 18000000.00,
  "riskRating": "B+",
  "status": "monitoring",
  "remarks": "Client showing improvement, increased exposure approved"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "central-risk-123",
    "companyId": "company-789",
    "institutionId": "inst-456",
    "exposureAmount": 18000000.00,
    "riskRating": "B+",
    "status": "monitoring",
    "updatedAt": "2025-11-10T18:00:00.000Z"
  }
}
```

## Structures de données

### RiskEvaluation

```typescript
interface RiskEvaluation {
  id: string;
  companyId: string;
  companyName: string;
  riskType: 'credit' | 'leasing' | 'investment';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  evaluationDate: string;
  evaluator: {
    id: string;
    name: string;
    role: string;
  };
  factors: RiskFactor[];
  recommendations: string[];
  notes?: string;
  status: 'active' | 'archived' | 'pending_review';
}
```

### CentralRiskInfo

```typescript
interface CentralRiskInfo {
  companyId: string;
  companyName: string;
  registrationNumber: string;
  overallRating: string;
  totalExposure: number;
  numberOfInstitutions: number;
  paymentBehavior: 'excellent' | 'satisfactory' | 'poor' | 'default';
  incidents: Incident[];
  guarantees: Guarantee[];
  financialSummary: FinancialSummary;
  legalStatus: LegalStatus;
  alerts: Alert[];
  recommendations: string[];
}
```

## Codes d'erreur spécifiques

| Code HTTP | Code d'erreur | Description |
|-----------|---------------|-------------|
| 400 | INVALID_RISK_DATA | Données d'évaluation de risque invalides |
| 404 | COMPANY_NOT_FOUND | Entreprise non trouvée |
| 404 | RISK_EVALUATION_NOT_FOUND | Évaluation de risque non trouvée |
| 500 | RISK_CALCULATION_ERROR | Erreur lors du calcul du score de risque |
| 503 | CENTRAL_RISK_SERVICE_UNAVAILABLE | Service de centrale des risques indisponible |

---

*Documentation mise à jour le 10 novembre 2025 basée sur le RiskController réellement implémenté dans le portfolio-institution-service.*