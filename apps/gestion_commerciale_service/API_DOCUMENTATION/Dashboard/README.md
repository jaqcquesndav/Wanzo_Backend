# API Dashboard

Cette documentation détaille les endpoints disponibles pour le tableau de bord (dashboard) dans l'application Wanzo.

## Structure du modèle DashboardData

```json
{
  "date": "2023-08-01T12:30:00.000Z",    // Date des données du tableau de bord
  "summary": {
    "salesTodayCdf": 1500000.00,         // Montant des ventes du jour en CDF
    "salesTodayUsd": 750.00,             // Montant des ventes du jour en USD
    "salesThisWeekCdf": 7500000.00,      // Montant des ventes de la semaine en CDF
    "salesThisWeekUsd": 3750.00,         // Montant des ventes de la semaine en USD
    "salesThisMonthCdf": 30000000.00,    // Montant des ventes du mois en CDF
    "salesThisMonthUsd": 15000.00,       // Montant des ventes du mois en USD
    "totalCustomers": 45,                // Nombre total de clients
    "newCustomersToday": 3,              // Nouveaux clients du jour
    "totalTransactions": 120,            // Nombre total de transactions
    "transactionsToday": 8,              // Transactions du jour
    "expensesTodayCdf": 500000.00,       // Dépenses du jour en CDF
    "expensesTodayUsd": 250.00,          // Dépenses du jour en USD
    "expensesThisWeekCdf": 2000000.00,   // Dépenses de la semaine en CDF
    "expensesThisWeekUsd": 1000.00,      // Dépenses de la semaine en USD
    "expensesThisMonthCdf": 8000000.00,  // Dépenses du mois en CDF
    "expensesThisMonthUsd": 4000.00,     // Dépenses du mois en USD
    "profitTodayCdf": 1000000.00,        // Bénéfices du jour en CDF
    "profitTodayUsd": 500.00,            // Bénéfices du jour en USD
    "profitThisWeekCdf": 5500000.00,     // Bénéfices de la semaine en CDF
    "profitThisWeekUsd": 2750.00,        // Bénéfices de la semaine en USD
    "profitThisMonthCdf": 22000000.00,   // Bénéfices du mois en CDF
    "profitThisMonthUsd": 11000.00       // Bénéfices du mois en USD
  },
  "recentSales": [
    {
      "id": "string",
      "date": "2023-08-01T12:30:00.000Z",
      "customerName": "string",
      "totalAmount": 150000.00,
      "currency": "CDF",
      "status": "completed"
    }
  ],
  "recentCustomers": [
    {
      "id": "string",
      "name": "string",
      "phone": "string",
      "registrationDate": "2023-08-01T12:30:00.000Z",
      "totalPurchases": 3,
      "totalAmountCdf": 450000.00
    }
  ],
  "salesByDayCdf": [
    {
      "date": "2023-07-25",
      "amount": 1200000.00
    }
  ],
  "salesByDayUsd": [
    {
      "date": "2023-07-25",
      "amount": 600.00
    }
  ],
  "topSellingProducts": [
    {
      "productId": "string",
      "name": "string",
      "quantitySold": 45,
      "totalRevenueCdf": 1350000.00
    }
  ],
  "lowStockProducts": [
    {
      "productId": "string",
      "name": "string",
      "currentStock": 5,
      "reorderPoint": 10
    }
  ],
  "journalEntries": [
    {
      "id": "string",
      "date": "2023-08-01T12:30:00.000Z",
      "operationType": "sale",
      "description": "string",
      "amount": 150000.00,
      "currency": "CDF"
    }
  ]
}
```

## Endpoints

### 1. Récupérer les données du tableau de bord

**Endpoint**: `GET /api/v1/dashboard/data`

**Description**: Récupère les données complètes du tableau de bord pour la date actuelle par défaut.

**Paramètres de requête (Query Params)**:
- `date` (optionnel): Date pour laquelle récupérer les données (format: YYYY-MM-DD)
- `timezone` (optionnel): Fuseau horaire pour les calculs de date

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    // Structure complète de DashboardData
  }
}
```

### 2. Récupérer le résumé des ventes

**Endpoint**: `GET /api/v1/dashboard/sales-summary`

**Description**: Récupère uniquement le résumé des ventes pour une période spécifique.

**Paramètres de requête (Query Params)**:
- `period` (obligatoire): Période pour laquelle récupérer les données (valeurs possibles: "day", "week", "month", "year")
- `date` (optionnel): Date de référence (format: YYYY-MM-DD), défaut: aujourd'hui
- `currency` (optionnel): Devise pour les montants (valeurs possibles: "CDF", "USD", "all"), défaut: "all"

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "period": "week",
    "startDate": "2023-07-25",
    "endDate": "2023-08-01",
    "salesCdf": 7500000.00,
    "salesUsd": 3750.00,
    "transactionCount": 50,
    "averageTransactionCdf": 150000.00,
    "averageTransactionUsd": 75.00,
    "salesByDay": [
      {
        "date": "2023-07-25",
        "amountCdf": 1200000.00,
        "amountUsd": 600.00,
        "count": 8
      }
      // Suite des jours...
    ]
  }
}
```

### 3. Récupérer les statistiques clients

**Endpoint**: `GET /api/v1/dashboard/customer-stats`

**Description**: Récupère les statistiques des clients pour une période spécifique.

**Paramètres de requête (Query Params)**:
- `period` (obligatoire): Période pour laquelle récupérer les données (valeurs possibles: "day", "week", "month", "year")
- `date` (optionnel): Date de référence (format: YYYY-MM-DD), défaut: aujourd'hui

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "totalCustomers": 45,
    "newCustomers": 3,
    "activeCustomers": 15,
    "inactiveCustomers": 30,
    "averagePurchaseCdf": 150000.00,
    "averagePurchaseUsd": 75.00,
    "topCustomers": [
      {
        "id": "string",
        "name": "string",
        "totalPurchasesCdf": 450000.00,
        "totalPurchasesUsd": 225.00,
        "purchaseCount": 3
      }
      // Suite des clients...
    ]
  }
}
```

### 4. Récupérer les entrées du journal d'opérations

**Endpoint**: `GET /api/v1/dashboard/journal`

**Description**: Récupère les entrées du journal d'opérations pour une période spécifique.

**Paramètres de requête (Query Params)**:
- `startDate` (obligatoire): Date de début (format: YYYY-MM-DD)
- `endDate` (obligatoire): Date de fin (format: YYYY-MM-DD)
- `type` (optionnel): Type d'opération (valeurs possibles: "sale", "expense", "inventory", "customer", "all"), défaut: "all"
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "string",
        "date": "2023-08-01T12:30:00.000Z",
        "operationType": "sale",
        "entityId": "string",
        "description": "string",
        "amount": 150000.00,
        "currency": "CDF",
        "userName": "string"
      }
      // Suite des entrées...
    ],
    "totalItems": 120,
    "totalPages": 6,
    "currentPage": 1
  }
}
```
