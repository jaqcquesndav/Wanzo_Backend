# Dashboard API Documentation

This document describes the Dashboard API endpoints for the Wanzo Compta application.

## Base URL

```
http://localhost:8000/accounting
```

## Authentication

All endpoints require authentication with a Bearer token.

**Required Headers:**
```
Authorization: Bearer <jwt_token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
Content-Type: application/json
```

## Data Structures

### DashboardData

```typescript
interface DashboardData {
  quickStats: {
    totalAssets: number;
    revenue: number; // Chiffre d'affaires
    netIncome: number; // Résultat Net
    cashOnHand: number; // Trésorerie Nette Actuelle
    trends: {
      assets: { value: number; isPositive: boolean };
      revenue: { value: number; isPositive: boolean };
      netIncome: { value: number; isPositive: boolean };
      cashOnHand: { value: number; isPositive: boolean };
    };
  };
  financialRatios: {
    grossProfitMargin: number; // Marge Brute en %
    breakEvenPoint: number; // Seuil de Rentabilité en CDF
    daysSalesOutstanding: number; // DSO en jours
    daysPayableOutstanding: number; // DPO en jours
    workingCapital: number; // Besoin en Fonds de Roulement (BFR) en CDF
    currentRatio: number; // Ratio de Liquidité Générale
  };
  keyPerformanceIndicators: {
    creditScore: number;
    financialRating: string;
  };
  revenueData: Array<{
    date: string;
    revenue: number;
  }>;
  expensesData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'success';
    message: string;
  }>;
}
```

## Endpoints

### Get Complete Dashboard Data

Retrieves all dashboard data including quick stats, financial ratios, KPIs, charts data, and alerts.

**URL:** `/dashboard`

**Method:** `GET`

**Query Parameters:**
- `period` (optional) - Time period: 'day' | 'week' | 'month' | 'quarter' | 'year'
- `fiscalYearId` (optional) - ID of the fiscal year (default: current fiscal year)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "quickStats": {
      "totalAssets": 25000000,
      "revenue": 15000000,
      "netIncome": 5000000,
      "cashOnHand": 7500000,
      "trends": {
        "assets": { "value": 15, "isPositive": true },
        "revenue": { "value": 8, "isPositive": true },
        "netIncome": { "value": 12, "isPositive": true },
        "cashOnHand": { "value": 5, "isPositive": true }
      }
    },
    "financialRatios": {
      "grossProfitMargin": 65,
      "breakEvenPoint": 7000000,
      "daysSalesOutstanding": 45,
      "daysPayableOutstanding": 30,
      "workingCapital": 3000000,
      "currentRatio": 1.8
    },
    "keyPerformanceIndicators": {
      "creditScore": 750,
      "financialRating": "AA-"
    },
    "revenueData": [
      { "date": "2024-01", "revenue": 12000000 },
      { "date": "2024-02", "revenue": 15000000 },
      { "date": "2024-03", "revenue": 18000000 },
      { "date": "2024-04", "revenue": 16000000 },
      { "date": "2024-05", "revenue": 20000000 },
      { "date": "2024-06", "revenue": 25000000 }
    ],
    "expensesData": [
      { "name": "Achats", "value": 8000000, "color": "#197ca8" },
      { "name": "Personnel", "value": 5000000, "color": "#015730" },
      { "name": "Services", "value": 3000000, "color": "#ee872b" },
      { "name": "Autres", "value": 2000000, "color": "#64748b" }
    ],
    "recentTransactions": [
      {
        "id": "1",
        "date": "2024-03-01",
        "description": "Facture client ABC SARL",
        "amount": 1180000,
        "type": "credit"
      },
      {
        "id": "2",
        "date": "2024-02-28",
        "description": "Achat marchandises",
        "amount": 850000,
        "type": "debit"
      }
    ],
    "alerts": [
      {
        "id": "1",
        "type": "warning",
        "message": "Déclaration TVA due dans 5 jours"
      },
      {
        "id": "2",
        "type": "success",
        "message": "Synchronisation des données terminée"
      }
    ]
  }
}
```

### Get Quick Stats

Retrieves only the quick statistics data.

**URL:** `/dashboard/quick-stats`

**Method:** `GET`

**Query Parameters:**
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalAssets": 25000000,
    "revenue": 15000000,
    "netIncome": 5000000,
    "cashOnHand": 7500000,
    "trends": {
      "assets": { "value": 15, "isPositive": true },
      "revenue": { "value": 8, "isPositive": true },
      "netIncome": { "value": 12, "isPositive": true },
      "cashOnHand": { "value": 5, "isPositive": true }
    }
  }
}
```

### Get Financial Ratios

Retrieves financial ratios and metrics.

**URL:** `/dashboard/financial-ratios`

**Method:** `GET`

**Query Parameters:**
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "grossProfitMargin": 65,
    "breakEvenPoint": 7000000,
    "daysSalesOutstanding": 45,
    "daysPayableOutstanding": 30,
    "workingCapital": 3000000,
    "currentRatio": 1.8
  }
}
```

### Get Key Performance Indicators

Retrieves credit score and financial rating.

**URL:** `/dashboard/key-performance-indicators`

**Method:** `GET`

**Query Parameters:**
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "creditScore": 750,
    "financialRating": "AA-"
  }
}
```

### Get Revenue Data

Retrieves revenue data for charts.

**URL:** `/dashboard/revenue`

**Method:** `GET`

**Query Parameters:**
- `startDate` (optional) - Start date (ISO format)
- `endDate` (optional) - End date (ISO format)
- `period` (optional) - 'day' | 'week' | 'month'
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    { "date": "2024-01", "revenue": 12000000 },
    { "date": "2024-02", "revenue": 15000000 },
    { "date": "2024-03", "revenue": 18000000 }
  ]
}
```

### Get Expenses Data

Retrieves expenses breakdown for charts.

**URL:** `/dashboard/expenses`

**Method:** `GET`

**Query Parameters:**
- `startDate` (optional) - Start date (ISO format)
- `endDate` (optional) - End date (ISO format)
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    { "name": "Achats", "value": 8000000, "color": "#197ca8" },
    { "name": "Personnel", "value": 5000000, "color": "#015730" },
    { "name": "Services", "value": 3000000, "color": "#ee872b" },
    { "name": "Autres", "value": 2000000, "color": "#64748b" }
  ]
}
```

### Get Recent Transactions

Retrieves recent transactions.

**URL:** `/dashboard/transactions`

**Method:** `GET`

**Query Parameters:**
- `limit` (optional) - Number of transactions to return (default: 10)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "date": "2024-03-01",
      "description": "Facture client ABC SARL",
      "amount": 1180000,
      "type": "credit"
    }
  ]
}
```

### Get Alerts

Retrieves system alerts and notifications.

**URL:** `/dashboard/alerts`

**Method:** `GET`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "type": "warning",
      "message": "Déclaration TVA due dans 5 jours"
    }
  ]
}
```
```

### Get Quick Stats

Retrieves quick statistics (KPIs) for the dashboard.

**URL:** `/dashboard/quick-stats`

**Method:** `GET`

**Query Parameters:**
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** QuickStats object

### Get Financial Ratios

Retrieves financial ratios for the dashboard.

**URL:** `/dashboard/financial-ratios`

**Method:** `GET`

**Query Parameters:**
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** FinancialRatios object

### Get Key Performance Indicators

Retrieves key performance indicators including credit score and financial rating.

**URL:** `/dashboard/key-performance-indicators`

**Method:** `GET`

**Query Parameters:**
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** KeyPerformanceIndicators object

### Get Revenue Data

Retrieves revenue data for charts.

**URL:** `/dashboard/revenue`

**Method:** `GET`

**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `period` (optional) - 'day' | 'week' | 'month'
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** Array of RevenueDataPoint

### Get Expenses Data

Retrieves expenses data for charts.

**URL:** `/dashboard/expenses`

**Method:** `GET`

**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `fiscalYearId` (optional) - ID of the fiscal year

**Response:** Array of ExpensesDataPoint

### Get Recent Transactions

Retrieves recent transactions for the dashboard.

**URL:** `/dashboard/transactions`

**Method:** `GET`

**Query Parameters:**
- `limit` (optional) - Number of transactions to retrieve

**Response:** Array of Transaction objects

### Get Alerts

Retrieves alerts for the dashboard.

**URL:** `/dashboard/alerts`

**Method:** `GET`

**Response:** Array of Alert objects

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
