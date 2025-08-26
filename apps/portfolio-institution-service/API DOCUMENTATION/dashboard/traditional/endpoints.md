# Endpoints API - Dashboard Traditionnel OHADA

Documentation des endpoints API pour le dashboard traditionnel conforme aux standards OHADA/BCEAO.

```

## 📊 Métriques OHADA

### GET /metrics/ohada

Récupère toutes les métriques OHADA des portefeuilles traditionnels.

#### Réponse

```typescript
interface OHADAMetricsResponse {
  success: boolean;
  data: OHADAMetrics[];
  metadata: {
    totalPortfolios: number;
    calculationDate: string;
    regulatoryFramework: 'OHADA' | 'BCEAO';
    complianceStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  };
  benchmarks: {
    avgNplRatio: number; // Seuil BCEAO: 5%
    avgProvisionRate: number; // Norme OHADA: 3-5%
    avgROA: number; // Marché CEMAC: 3.2%
    avgYield: number; // Marché: 14.5%
    collectionEfficiency: number; // Standard: 90%
  };
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": [
    {
      "id": "port-001",
      "name": "PME Cameroun",
      "sector": "PME",
      "totalAmount": 2500000000,
      "activeContracts": 156,
      "avgLoanSize": 16025641,
      "nplRatio": 3.2,
      "provisionRate": 4.1,
      "collectionEfficiency": 92.3,
      "balanceAGE": {
        "current": 72.5,
        "days30": 18.3,
        "days60": 6.1,
        "days90Plus": 3.1
      },
      "roa": 3.8,
      "portfolioYield": 15.2,
      "riskLevel": "Faible",
      "growthRate": 8.5,
      "monthlyPerformance": [12.1, 13.2, 14.5, 15.1, 15.8, 16.2, 15.9, 16.1, 15.7, 16.3, 16.8, 17.2],
      "lastActivity": "2025-08-26T10:30:00Z",
      "regulatoryCompliance": {
        "bceaoCompliant": true,
        "ohadaProvisionCompliant": true,
        "riskRating": "A"
      }
    }
  ],
  "metadata": {
    "totalPortfolios": 8,
    "calculationDate": "2025-08-26T10:30:00Z",
    "regulatoryFramework": "OHADA",
    "complianceStatus": "COMPLIANT"
  },
  "benchmarks": {
    "avgNplRatio": 4.2,
    "avgProvisionRate": 3.8,
    "avgROA": 3.2,
    "avgYield": 14.5,
    "collectionEfficiency": 90.0
  }
}
```

### GET /metrics/portfolio/{portfolioId}

Récupère les métriques OHADA pour un portefeuille spécifique.

#### Paramètres

| Paramètre | Type | Description | Requis |
|-----------|------|-------------|---------|
| portfolioId | string | ID du portefeuille | Oui |

#### Réponse

```json
{
  "success": true,
  "data": {
    "id": "port-001",
    "name": "PME Cameroun",
    "sector": "PME",
    "totalAmount": 2500000000,
    "activeContracts": 156,
    "avgLoanSize": 16025641,
    "nplRatio": 3.2,
    "provisionRate": 4.1,
    "collectionEfficiency": 92.3,
    "balanceAGE": {
      "current": 72.5,
      "days30": 18.3,
      "days60": 6.1,
      "days90Plus": 3.1
    },
    "roa": 3.8,
    "portfolioYield": 15.2,
    "riskLevel": "Faible",
    "growthRate": 8.5,
    "monthlyPerformance": [12.1, 13.2, 14.5, 15.1, 15.8, 16.2, 15.9, 16.1, 15.7, 16.3, 16.8, 17.2],
    "lastActivity": "2025-08-26T10:30:00Z",
    "regulatoryCompliance": {
      "bceaoCompliant": true,
      "ohadaProvisionCompliant": true,
      "riskRating": "A"
    }
  }
}
```

### GET /metrics/global

Récupère les métriques globales agrégées de tous les portefeuilles.

#### Réponse

```json
{
  "success": true,
  "data": {
    "id": "global",
    "name": "Vue Globale",
    "sector": "Tous Secteurs",
    "totalAmount": 18750000000,
    "activeContracts": 1248,
    "avgLoanSize": 15024038,
    "nplRatio": 4.1,
    "provisionRate": 3.9,
    "collectionEfficiency": 91.2,
    "balanceAGE": {
      "current": 69.8,
      "days30": 19.1,
      "days60": 7.3,
      "days90Plus": 3.8
    },
    "roa": 3.5,
    "portfolioYield": 14.8,
    "riskLevel": "Faible",
    "growthRate": 7.2,
    "monthlyPerformance": [11.8, 12.9, 13.7, 14.2, 14.9, 15.3, 15.1, 15.4, 15.0, 15.6, 16.1, 16.5],
    "lastActivity": "2025-08-26T10:30:00Z",
    "regulatoryCompliance": {
      "bceaoCompliant": true,
      "ohadaProvisionCompliant": true,
      "riskRating": "A"
    }
  }
}
```

### GET /compliance/summary

Récupère un résumé de la conformité réglementaire.

#### Réponse

```json
{
  "success": true,
  "data": {
    "status": "COMPLIANT",
    "riskLevel": "Faible",
    "totalPortfolios": 8,
    "nonCompliantCount": 0,
    "complianceRate": "100.0",
    "details": {
      "bceaoCompliance": {
        "threshold": 5.0,
        "currentAvg": 4.1,
        "compliantCount": 8,
        "status": "COMPLIANT"
      },
      "ohadaProvisionCompliance": {
        "minThreshold": 3.0,
        "maxThreshold": 5.0,
        "currentAvg": 3.9,
        "compliantCount": 8,
        "status": "COMPLIANT"
      }
    }
  }
}
```

## 🎛️ Préférences Dashboard

### GET /preferences/{userId}

Récupère les préférences de customisation du dashboard pour un utilisateur.

#### Paramètres

| Paramètre | Type | Description | Requis |
|-----------|------|-------------|---------|
| userId | string | ID de l'utilisateur | Oui |

#### Réponse

```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "widgets": {
      "overview_metrics": {
        "visible": true,
        "position": 0,
        "config": {}
      },
      "portfolio_performance": {
        "visible": true,
        "position": 1,
        "config": {}
      },
      "balance_age_analysis": {
        "visible": false,
        "position": 2,
        "config": {}
      }
    },
    "selectorPosition": {
      "x": 20,
      "y": 20,
      "minimized": false
    },
    "lastUpdated": "2025-08-26T10:30:00Z"
  }
}
```

### PUT /preferences/{userId}/widget/{widgetId}

Met à jour la visibilité d'un widget spécifique.

#### Paramètres

| Paramètre | Type | Description | Requis |
|-----------|------|-------------|---------|
| userId | string | ID de l'utilisateur | Oui |
| widgetId | string | ID du widget | Oui |

#### Corps de la requête

```json
{
  "visible": true,
  "position": 3
}
```

#### Réponse

```json
{
  "success": true,
  "message": "Widget mis à jour avec succès",
  "data": {
    "userId": "user-123",
    "widgetId": "portfolio_performance",
    "visible": true,
    "position": 3,
    "updatedAt": "2025-08-26T10:30:00Z"
  }
}
```

### POST /preferences/{userId}/reset

Remet les préférences aux valeurs par défaut.

#### Paramètres

| Paramètre | Type | Description | Requis |
|-----------|------|-------------|---------|
| userId | string | ID de l'utilisateur | Oui |

#### Réponse

```json
{
  "success": true,
  "message": "Préférences remises à zéro",
  "data": {
    "userId": "user-123",
    "resetAt": "2025-08-26T10:30:00Z",
    "widgetsCount": 12
  }
}
```

### POST /preferences/{userId}/backup

Sauvegarde les préférences actuelles.

#### Réponse

```json
{
  "success": true,
  "message": "Préférences sauvegardées",
  "data": {
    "backupId": "backup-789",
    "userId": "user-123",
    "backupDate": "2025-08-26T10:30:00Z"
  }
}
```

### POST /preferences/{userId}/restore/{backupId}

Restaure une sauvegarde de préférences.

#### Paramètres

| Paramètre | Type | Description | Requis |
|-----------|------|-------------|---------|
| userId | string | ID de l'utilisateur | Oui |
| backupId | string | ID de la sauvegarde | Oui |

#### Réponse

```json
{
  "success": true,
  "message": "Préférences restaurées",
  "data": {
    "userId": "user-123",
    "backupId": "backup-789",
    "restoredAt": "2025-08-26T10:30:00Z"
  }
}
```

## 🔄 Actualisation des Données

### POST /metrics/refresh

Force l'actualisation des métriques OHADA.

#### Réponse

```json
{
  "success": true,
  "message": "Métriques actualisées",
  "data": {
    "refreshedAt": "2025-08-26T10:30:00Z",
    "portfoliosProcessed": 8,
    "calculationTime": "1.23s"
  }
}
```

## 📊 Codes de Statut

| Code | Description |
|------|-------------|
| 200 | Succès |
| 400 | Requête invalide |
| 401 | Non autorisé |
| 403 | Accès interdit |
| 404 | Ressource non trouvée |
| 422 | Données de validation échouées |
| 500 | Erreur serveur interne |

## 🔐 Authentification

Tous les endpoints nécessitent une authentification via token Bearer :

```
Authorization: Bearer <your-token>
```
