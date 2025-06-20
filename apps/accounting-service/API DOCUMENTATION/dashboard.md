# Dashboard API Documentation

This document describes the Dashboard API endpoints for the Wanzo Compta application.

## Base URL

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentication

All endpoints require authentication with a Bearer token.

**Headers:**
```
Authorization: Bearer <token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
```

## Endpoints

### Get Dashboard Data

Retrieves all dashboard data including quick stats, financial ratios, KPIs, revenue data, expenses data, recent transactions, and alerts.

**URL:** `/dashboard`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `fiscalYearId` (optional) - ID of the fiscal year (default: current fiscal year)

**Response:**

```json
{
  "success": true,
  "data": {
    "quickStats": {
      "totalAssets": 750000.00,
      "revenue": 450000.00,
      "netIncome": 125000.00,
      "cashOnHand": 185000.00,
      "trends": {
        "assets": { "value": 5.2, "isPositive": true },
        "revenue": { "value": 7.8, "isPositive": true },
        "netIncome": { "value": 3.1, "isPositive": true },
        "cashOnHand": { "value": 2.5, "isPositive": true }
      }
    },
    "financialRatios": {
      "grossProfitMargin": 42.5,
      "breakEvenPoint": 320000.00,
      "daysSalesOutstanding": 45,
      "daysPayableOutstanding": 30,
      "workingCapital": 135000.00,
      "currentRatio": 1.8
    },
    "keyPerformanceIndicators": {
      "creditScore": 82,
      "financialRating": "A-"
    },
    "revenueData": [
      {
        "date": "2024-01",
        "revenue": 32000.00
      },
      {
        "date": "2024-02",
        "revenue": 35000.00
      },
      {
        "date": "2024-03",
        "revenue": 40000.00
      },
      {
        "date": "2024-04",
        "revenue": 38000.00
      },
      {
        "date": "2024-05",
        "revenue": 42000.00
      },
      {
        "date": "2024-06",
        "revenue": 45000.00
      }
    ],
    "expensesData": [
      {
        "name": "Achats",
        "value": 120000.00,
        "color": "#FF6384"
      },
      {
        "name": "Personnel",
        "value": 85000.00,
        "color": "#36A2EB"
      },
      {
        "name": "Loyers",
        "value": 35000.00,
        "color": "#FFCE56"
      },
      {
        "name": "Services Externes",
        "value": 28000.00,
        "color": "#4BC0C0"
      },
      {
        "name": "Autres Charges",
        "value": 22000.00,
        "color": "#9966FF"
      }
    ],
    "recentTransactions": [
      {
        "id": "trans-1",
        "date": "2024-06-15",
        "description": "Paiement client ABC",
        "amount": 12500.00,
        "type": "credit"
      },
      {
        "id": "trans-2",
        "date": "2024-06-14",
        "description": "Facture fournisseur XYZ",
        "amount": 4800.00,
        "type": "debit"
      },
      {
        "id": "trans-3",
        "date": "2024-06-12",
        "description": "Loyer mensuel",
        "amount": 3500.00,
        "type": "debit"
      },
      {
        "id": "trans-4",
        "date": "2024-06-10",
        "description": "Paiement client DEF",
        "amount": 8750.00,
        "type": "credit"
      },
      {
        "id": "trans-5",
        "date": "2024-06-08",
        "description": "Salaires",
        "amount": 15000.00,
        "type": "debit"
      }
    ],
    "alerts": [
      {
        "id": "alert-1",
        "type": "warning",
        "message": "Créances clients dépassant 60 jours: 15000 €"
      },
      {
        "id": "alert-2",
        "type": "success",
        "message": "Objectif de chiffre d'affaires mensuel atteint"
      },
      {
        "id": "alert-3",
        "type": "error",
        "message": "TVA à déclarer avant le 30/06/2024"
      }
    ]
  }
}
```

## Data Structures

### DashboardData

```typescript
interface DashboardData {
  quickStats: QuickStats;
  financialRatios: FinancialRatios;
  keyPerformanceIndicators: KeyPerformanceIndicators;
  revenueData: RevenueDataPoint[];
  expensesData: ExpensesDataPoint[];
  recentTransactions: Transaction[];
  alerts: Alert[];
}

interface QuickStats {
  totalAssets: number;
  revenue: number;
  netIncome: number;
  cashOnHand: number;
  trends: {
    assets: Trend;
    revenue: Trend;
    netIncome: Trend;
    cashOnHand: Trend;
  };
}

interface Trend {
  value: number;
  isPositive: boolean;
}

interface FinancialRatios {
  grossProfitMargin: number;
  breakEvenPoint: number;
  daysSalesOutstanding: number;
  daysPayableOutstanding: number;
  workingCapital: number;
  currentRatio: number;
}

interface KeyPerformanceIndicators {
  creditScore: number;
  financialRating: string;
}

interface RevenueDataPoint {
  date: string; // Format: YYYY-MM
  revenue: number;
}

interface ExpensesDataPoint {
  name: string;
  value: number;
  color: string;
}

interface Transaction {
  id: string;
  date: string; // Format: YYYY-MM-DD
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'error' | 'info';
  message: string;
}
```


## Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Session expirée"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "error": "Invalid date range"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Fiscal year not found"
}
```

**Other Errors:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
