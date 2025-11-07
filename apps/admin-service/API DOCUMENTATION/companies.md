# Gestion des Entreprises SME - API Documentation

## Vue d'ensemble

Le module de gestion des entreprises SME/PME permet à l'équipe admin de Wanzo de gérer complètement les entreprises qui utilisent le **Gestion Commerciale Service** (port 3005). Les entreprises ont accès à des fonctionnalités de gestion commerciale complètes :

- **Sales Management** : Gestion des ventes et chiffre d'affaires
- **Expense Tracking** : Suivi des dépenses et comptabilité
- **Inventory Management** : Gestion des stocks et produits
- **Business Customers** : Gestion des clients d'affaires
- **Suppliers** : Gestion des fournisseurs
- **Financial Statistics** : Statistiques financières (revenue, expenses, profit)

## Architecture

```
Admin Service (3001)
    ↓ HTTP
Gestion Commerciale Service (3005)
    ↓ Database
PostgreSQL (Company, Sales, Expenses, Inventory, etc.)
```

**Type de client** : `CustomerType.SME` dans Customer Service

## Configuration

### Variables d'environnement

```env
GESTION_COMMERCIALE_SERVICE_URL=http://localhost:3005
SERVICE_ID=admin-service
SERVICE_SECRET=your-service-secret
```

### Headers de service-à-service

```
X-Service-ID: admin-service
X-Service-Secret: your-service-secret
```

---

## Endpoints

### 1. Lister toutes les entreprises

**GET** `/admin/companies`

Liste toutes les entreprises SME avec pagination et filtres.

#### Paramètres de requête

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `page` | number | Numéro de page | 1 |
| `limit` | number | Éléments par page | 20 |
| `status` | string | Filtrer par statut (active, suspended, pending) | - |
| `search` | string | Recherche par nom ou identifiant | - |
| `industry` | string | Filtrer par secteur d'activité | - |
| `sortBy` | string | Champ de tri (name, createdAt, revenue) | createdAt |
| `sortOrder` | string | Ordre de tri (asc, desc) | desc |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "data": [
    {
      "id": "comp_123",
      "name": "Distribution Plus SARL",
      "industry": "RETAIL",
      "status": "active",
      "email": "contact@distrib-plus.ci",
      "phone": "+225 XX XX XX XX",
      "address": "Yopougon, Abidjan",
      "createdAt": "2024-01-10T08:30:00Z",
      "totalSales": 45000000,
      "totalExpenses": 38000000,
      "profit": 7000000,
      "inventoryValue": 12000000,
      "subscriptionStatus": "active"
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 20,
  "totalPages": 6
}
```

#### Exemple d'utilisation

```bash
curl -X GET "http://localhost:8000/admin/api/v1/admin/companies?page=1&limit=20&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Obtenir les détails d'une entreprise

**GET** `/admin/companies/:id`

Récupère les informations complètes d'une entreprise spécifique.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "id": "comp_123",
  "name": "Distribution Plus SARL",
  "industry": "RETAIL",
  "status": "active",
  "email": "contact@distrib-plus.ci",
  "phone": "+225 XX XX XX XX",
  "address": "Yopougon, Abidjan",
  "registrationNumber": "CI-RETAIL-2023-456",
  "taxId": "TAX789012",
  "website": "https://distrib-plus.ci",
  "description": "Distribution de produits alimentaires et boissons",
  "createdAt": "2024-01-10T08:30:00Z",
  "updatedAt": "2024-03-20T11:15:00Z",
  "metadata": {
    "totalSales": 45000000,
    "totalExpenses": 38000000,
    "profit": 7000000,
    "profitMargin": 15.6,
    "inventoryValue": 12000000,
    "customersCount": 85,
    "suppliersCount": 15,
    "averageOrderValue": 250000
  },
  "subscription": {
    "id": "sub_789",
    "planName": "SME Professional",
    "status": "active",
    "startDate": "2024-01-10",
    "nextBillingDate": "2024-04-10",
    "monthlyPrice": 75000
  }
}
```

---

### 3. Récupérer les utilisateurs d'une entreprise

**GET** `/admin/companies/:id/users`

Liste tous les utilisateurs associés à une entreprise.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "users": [
    {
      "id": "user_456",
      "auth0Id": "auth0|xyz789",
      "email": "admin@distrib-plus.ci",
      "firstName": "Kouadio",
      "lastName": "N'Guessan",
      "role": "COMPANY_ADMIN",
      "status": "active",
      "lastLogin": "2024-03-22T07:45:00Z",
      "createdAt": "2024-01-10T08:35:00Z"
    },
    {
      "id": "user_457",
      "auth0Id": "auth0|abc321",
      "email": "sales@distrib-plus.ci",
      "firstName": "Aya",
      "lastName": "Koné",
      "role": "SALES_MANAGER",
      "status": "active",
      "lastLogin": "2024-03-22T09:20:00Z",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 8
}
```

---

### 4. Récupérer les ventes d'une entreprise

**GET** `/admin/companies/:id/sales`

Liste toutes les ventes réalisées par l'entreprise avec filtres de date.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Query Parameters

| Paramètre | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Date de début (ISO 8601) |
| `endDate` | string | Date de fin (ISO 8601) |
| `status` | string | Statut (paid, pending, cancelled) |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "sales": [
    {
      "id": "sale_001",
      "invoiceNumber": "FAC-2024-001",
      "customerId": "cust_101",
      "customerName": "Restaurant Le Palmier",
      "date": "2024-03-20T14:30:00Z",
      "totalAmount": 850000,
      "paidAmount": 850000,
      "status": "paid",
      "paymentMethod": "mobile_money",
      "items": [
        {
          "productId": "prod_10",
          "productName": "Coca-Cola 1.5L x24",
          "quantity": 10,
          "unitPrice": 75000,
          "totalPrice": 750000
        },
        {
          "productId": "prod_15",
          "productName": "Eau minérale 0.5L x12",
          "quantity": 5,
          "unitPrice": 20000,
          "totalPrice": 100000
        }
      ]
    }
  ],
  "total": 235,
  "summary": {
    "totalSales": 45000000,
    "totalPaid": 42000000,
    "totalPending": 3000000,
    "averageOrderValue": 191489
  }
}
```

---

### 5. Récupérer les dépenses d'une entreprise

**GET** `/admin/companies/:id/expenses`

Liste toutes les dépenses de l'entreprise avec filtres.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Query Parameters

| Paramètre | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Date de début (ISO 8601) |
| `endDate` | string | Date de fin (ISO 8601) |
| `category` | string | Catégorie (rent, utilities, supplies, salaries, etc.) |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "expenses": [
    {
      "id": "exp_001",
      "date": "2024-03-01T00:00:00Z",
      "category": "RENT",
      "description": "Loyer mensuel entrepôt",
      "amount": 500000,
      "paymentMethod": "bank_transfer",
      "supplier": "Immobilier Plateau",
      "status": "paid",
      "receiptUrl": "https://storage/receipts/exp_001.pdf"
    },
    {
      "id": "exp_002",
      "date": "2024-03-05T00:00:00Z",
      "category": "UTILITIES",
      "description": "Facture électricité",
      "amount": 125000,
      "paymentMethod": "mobile_money",
      "supplier": "CIE",
      "status": "paid",
      "receiptUrl": "https://storage/receipts/exp_002.pdf"
    }
  ],
  "total": 142,
  "summary": {
    "totalExpenses": 38000000,
    "byCategory": {
      "RENT": 6000000,
      "UTILITIES": 1500000,
      "SUPPLIES": 18000000,
      "SALARIES": 10000000,
      "OTHER": 2500000
    }
  }
}
```

---

### 6. Récupérer l'inventaire d'une entreprise

**GET** `/admin/companies/:id/inventory`

Liste tous les produits en stock de l'entreprise.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "inventory": [
    {
      "id": "prod_10",
      "sku": "COCA-1.5L-24",
      "name": "Coca-Cola 1.5L x24",
      "category": "BEVERAGES",
      "quantity": 150,
      "unit": "carton",
      "costPrice": 70000,
      "sellingPrice": 75000,
      "minStock": 20,
      "maxStock": 200,
      "supplier": "Solibra",
      "lastRestocked": "2024-03-15T10:00:00Z",
      "status": "in_stock"
    },
    {
      "id": "prod_15",
      "sku": "EAU-0.5L-12",
      "name": "Eau minérale 0.5L x12",
      "category": "BEVERAGES",
      "quantity": 8,
      "unit": "carton",
      "costPrice": 18000,
      "sellingPrice": 20000,
      "minStock": 10,
      "maxStock": 100,
      "supplier": "Eau de Source CI",
      "lastRestocked": "2024-03-10T14:30:00Z",
      "status": "low_stock"
    }
  ],
  "total": 125,
  "summary": {
    "totalValue": 12000000,
    "totalItems": 125,
    "lowStockItems": 12,
    "outOfStockItems": 3,
    "categories": {
      "BEVERAGES": 45,
      "FOOD": 50,
      "HOUSEHOLD": 30
    }
  }
}
```

---

### 7. Récupérer les clients d'affaires

**GET** `/admin/companies/:id/customers`

Liste tous les clients professionnels de l'entreprise.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "customers": [
    {
      "id": "cust_101",
      "fullName": "Restaurant Le Palmier",
      "phoneNumber": "+225 XX XX XX XX",
      "email": "lepalmier@restaurant.ci",
      "category": "VIP",
      "totalPurchases": 8500000,
      "lastPurchase": "2024-03-20T14:30:00Z",
      "outstandingBalance": 0,
      "creditLimit": 1000000,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "cust_102",
      "fullName": "Hôtel Étoile du Sud",
      "phoneNumber": "+225 XX XX XX XX",
      "email": "contact@etoiledusud.ci",
      "category": "BUSINESS",
      "totalPurchases": 12000000,
      "lastPurchase": "2024-03-18T11:15:00Z",
      "outstandingBalance": 500000,
      "creditLimit": 2000000,
      "createdAt": "2024-01-20T09:30:00Z"
    }
  ],
  "total": 85,
  "summary": {
    "totalCustomers": 85,
    "vipCustomers": 15,
    "businessCustomers": 45,
    "regularCustomers": 25,
    "totalRevenue": 45000000,
    "totalOutstanding": 3500000
  }
}
```

---

### 8. Récupérer les fournisseurs

**GET** `/admin/companies/:id/suppliers`

Liste tous les fournisseurs de l'entreprise.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "suppliers": [
    {
      "id": "sup_201",
      "name": "Solibra CI",
      "phoneNumber": "+225 XX XX XX XX",
      "email": "commercial@solibra.ci",
      "category": "BEVERAGE_SUPPLIER",
      "totalPurchases": 15000000,
      "lastPurchase": "2024-03-15T10:00:00Z",
      "outstandingPayments": 2000000,
      "creditTerms": "30 jours",
      "status": "active",
      "createdAt": "2024-01-10T08:40:00Z"
    },
    {
      "id": "sup_202",
      "name": "Nestlé Côte d'Ivoire",
      "phoneNumber": "+225 XX XX XX XX",
      "email": "ventes@nestle.ci",
      "category": "FOOD_SUPPLIER",
      "totalPurchases": 8000000,
      "lastPurchase": "2024-03-18T15:20:00Z",
      "outstandingPayments": 0,
      "creditTerms": "15 jours",
      "status": "active",
      "createdAt": "2024-01-12T11:00:00Z"
    }
  ],
  "total": 15,
  "summary": {
    "totalSuppliers": 15,
    "activeSuppliers": 14,
    "totalPurchases": 25000000,
    "totalOutstanding": 3500000
  }
}
```

---

### 9. Obtenir les statistiques financières

**GET** `/admin/companies/:id/financial-stats`

Récupère les statistiques financières complètes de l'entreprise.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Query Parameters

| Paramètre | Type | Description |
|-----------|------|-------------|
| `period` | string | Période (daily, weekly, monthly, yearly) |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "overview": {
    "totalRevenue": 45000000,
    "totalExpenses": 38000000,
    "netProfit": 7000000,
    "profitMargin": 15.6,
    "grossMargin": 22.3
  },
  "sales": {
    "totalSales": 45000000,
    "totalOrders": 235,
    "averageOrderValue": 191489,
    "topProducts": [
      { "name": "Coca-Cola 1.5L x24", "revenue": 7500000 },
      { "name": "Eau minérale", "revenue": 4200000 }
    ],
    "topCustomers": [
      { "name": "Hôtel Étoile du Sud", "revenue": 12000000 },
      { "name": "Restaurant Le Palmier", "revenue": 8500000 }
    ]
  },
  "expenses": {
    "totalExpenses": 38000000,
    "byCategory": {
      "SUPPLIES": 18000000,
      "SALARIES": 10000000,
      "RENT": 6000000,
      "UTILITIES": 1500000,
      "OTHER": 2500000
    }
  },
  "inventory": {
    "totalValue": 12000000,
    "totalItems": 125,
    "lowStockItems": 12,
    "stockTurnoverRatio": 3.2
  },
  "cashFlow": {
    "cashIn": 42000000,
    "cashOut": 38000000,
    "netCashFlow": 4000000,
    "accountsReceivable": 3500000,
    "accountsPayable": 3500000
  },
  "trends": {
    "monthlyRevenue": [
      { "month": "Jan", "amount": 12000000 },
      { "month": "Feb", "amount": 15000000 },
      { "month": "Mar", "amount": 18000000 }
    ],
    "monthlyExpenses": [
      { "month": "Jan", "amount": 10000000 },
      { "month": "Feb", "amount": 13000000 },
      { "month": "Mar", "amount": 15000000 }
    ],
    "monthlyProfit": [
      { "month": "Jan", "amount": 2000000 },
      { "month": "Feb", "amount": 2000000 },
      { "month": "Mar", "amount": 3000000 }
    ]
  }
}
```

---

### 10. Mettre à jour une entreprise

**PUT** `/admin/companies/:id`

Met à jour les informations d'une entreprise.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Corps de la requête

```json
{
  "name": "Distribution Plus SARL CI",
  "phone": "+225 XX XX XX XX",
  "address": "Nouvelle adresse, Yopougon",
  "website": "https://new-distrib-plus.ci",
  "description": "Description mise à jour"
}
```

#### Réponse succès (200)

```json
{
  "message": "Company updated successfully",
  "company": {
    "id": "comp_123",
    "name": "Distribution Plus SARL CI",
    "updatedAt": "2024-03-22T16:30:00Z"
  }
}
```

---

### 11. Suspendre une entreprise

**POST** `/admin/companies/:id/suspend`

Suspend tous les accès d'une entreprise (utilisateurs, opérations).

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`

#### Corps de la requête

```json
{
  "reason": "Non-paiement de l'abonnement",
  "notifyUsers": true
}
```

#### Réponse succès (200)

```json
{
  "message": "Company suspended successfully",
  "companyId": "comp_123",
  "status": "suspended",
  "suspendedAt": "2024-03-22T17:00:00Z"
}
```

---

### 12. Réactiver une entreprise

**POST** `/admin/companies/:id/reactivate`

Réactive une entreprise suspendue.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`

#### Réponse succès (200)

```json
{
  "message": "Company reactivated successfully",
  "companyId": "comp_123",
  "status": "active",
  "reactivatedAt": "2024-03-25T09:00:00Z"
}
```

---

### 13. Suspendre un utilisateur d'entreprise

**POST** `/admin/companies/:id/users/:userId/suspend`

Suspend un utilisateur spécifique de l'entreprise.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |
| `userId` | string | ID de l'utilisateur |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Corps de la requête

```json
{
  "reason": "Violation des conditions d'utilisation"
}
```

#### Réponse succès (200)

```json
{
  "message": "User suspended successfully",
  "userId": "user_456",
  "status": "suspended"
}
```

---

### 14. Réactiver un utilisateur d'entreprise

**POST** `/admin/companies/:id/users/:userId/reactivate`

Réactive un utilisateur suspendu.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |
| `userId` | string | ID de l'utilisateur |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "message": "User reactivated successfully",
  "userId": "user_456",
  "status": "active"
}
```

---

### 15. Allouer des tokens à une entreprise

**POST** `/admin/companies/:id/tokens/allocate`

Alloue des tokens supplémentaires à une entreprise.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Corps de la requête

```json
{
  "amount": 2000,
  "reason": "Bonus pour excellent usage de la plateforme",
  "expiresAt": "2024-06-30T23:59:59Z"
}
```

#### Réponse succès (200)

```json
{
  "message": "Tokens allocated successfully",
  "companyId": "comp_123",
  "tokensAdded": 2000,
  "newBalance": 5000,
  "expiresAt": "2024-06-30T23:59:59Z"
}
```

---

### 16. Récupérer l'abonnement d'une entreprise

**GET** `/admin/companies/:id/subscription`

Récupère les détails de l'abonnement actif.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "id": "sub_789",
  "companyId": "comp_123",
  "planId": "plan_sme_pro",
  "planName": "SME Professional",
  "status": "active",
  "startDate": "2024-01-10T00:00:00Z",
  "nextBillingDate": "2024-04-10T00:00:00Z",
  "billingCycle": "monthly",
  "amount": 75000,
  "currency": "XOF",
  "features": {
    "maxUsers": 10,
    "maxProducts": 500,
    "maxCustomers": 200,
    "maxSuppliers": 50,
    "invoicing": true,
    "inventory": true,
    "reporting": true
  },
  "usage": {
    "users": 8,
    "products": 125,
    "customers": 85,
    "suppliers": 15
  }
}
```

---

### 17. Mettre à jour l'abonnement

**PUT** `/admin/companies/:id/subscriptions/:subscriptionId`

Met à jour l'abonnement d'une entreprise (changement de plan).

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |
| `subscriptionId` | string | ID de l'abonnement |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Corps de la requête

```json
{
  "planId": "plan_sme_enterprise",
  "effectiveDate": "2024-04-01T00:00:00Z",
  "prorationEnabled": true
}
```

#### Réponse succès (200)

```json
{
  "message": "Subscription updated successfully",
  "subscriptionId": "sub_789",
  "newPlan": "SME Enterprise",
  "effectiveDate": "2024-04-01T00:00:00Z",
  "newAmount": 150000
}
```

---

### 18. Annuler l'abonnement

**POST** `/admin/companies/:id/subscriptions/:subscriptionId/cancel`

Annule l'abonnement d'une entreprise.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'entreprise |
| `subscriptionId` | string | ID de l'abonnement |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Corps de la requête

```json
{
  "reason": "Client request",
  "cancelAtPeriodEnd": true,
  "refundAmount": 0
}
```

#### Réponse succès (200)

```json
{
  "message": "Subscription cancelled successfully",
  "subscriptionId": "sub_789",
  "status": "cancelled",
  "cancelledAt": "2024-03-22T18:00:00Z",
  "accessUntil": "2024-04-10T23:59:59Z"
}
```

---

## Gestion des erreurs

### Codes d'erreur courants

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Paramètres invalides |
| 401 | Unauthorized | Token JWT manquant ou invalide |
| 403 | Forbidden | Rôle insuffisant |
| 404 | Not Found | Entreprise non trouvée |
| 500 | Internal Server Error | Erreur du service Gestion Commerciale |
| 503 | Service Unavailable | Service Gestion Commerciale indisponible |

### Format des erreurs

```json
{
  "statusCode": 404,
  "message": "Company not found",
  "error": "Not Found",
  "timestamp": "2024-03-22T18:30:00Z",
  "path": "/admin/companies/comp_999"
}
```

---

## Notes importantes

### Service-to-service authentication

Toutes les requêtes vers Gestion Commerciale Service utilisent :
```
X-Service-ID: admin-service
X-Service-Secret: configured-secret
```

### Intégration avec Customer Service

Les entreprises sont des clients de type `CustomerType.SME` dans Customer Service. Lors de la création d'une entreprise :
1. Customer Service crée le customer avec type SME
2. Gestion Commerciale Service crée la company
3. Admin Service peut gérer les deux aspects

### Opérations spécifiques aux entreprises

- **Sales Management** : Facturation, suivi des ventes
- **Expense Tracking** : Comptabilité, catégorisation des dépenses
- **Inventory** : Gestion des stocks, alertes de réapprovisionnement
- **Business Customers** : Clients professionnels, gestion du crédit
- **Suppliers** : Fournisseurs, conditions de paiement
- **Financial Stats** : KPIs, trends, profitabilité

### Différence avec Institutions

| Aspect | Companies (SME) | Institutions |
|--------|-----------------|--------------|
| Service | Gestion Commerciale (3005) | Portfolio Institution (3006) |
| Type | CustomerType.SME | CustomerType.FINANCIAL |
| Fonctionnalités | Sales, Expenses, Inventory | Portfolios, Prospection, Virements |
| Utilisateurs | Sales staff, Accountants | Loan officers, Risk managers |

---

## Exemples d'utilisation

### Scénario 1 : Audit mensuel d'une entreprise

```javascript
// 1. Récupérer les statistiques financières
const financialStats = await fetch(
  'http://localhost:8000/admin/api/v1/admin/companies/comp_123/financial-stats?period=monthly',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// 2. Vérifier les ventes
const sales = await fetch(
  'http://localhost:8000/admin/api/v1/admin/companies/comp_123/sales?startDate=2024-03-01&endDate=2024-03-31',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// 3. Analyser l'inventaire
const inventory = await fetch(
  'http://localhost:8000/admin/api/v1/admin/companies/comp_123/inventory',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// 4. Récompenser si excellent
if (financialStats.overview.profitMargin > 20) {
  await fetch(
    'http://localhost:8000/admin/api/v1/admin/companies/comp_123/tokens/allocate',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 1000,
        reason: 'High profit margin achievement'
      })
    }
  );
}
```

### Scénario 2 : Support client

```javascript
// Obtenir le contexte complet de l'entreprise
const company = await fetch(
  'http://localhost:8000/admin/api/v1/admin/companies/comp_123',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// Vérifier les utilisateurs
const users = await fetch(
  'http://localhost:8000/admin/api/v1/admin/companies/comp_123/users',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// Vérifier l'abonnement
const subscription = await fetch(
  'http://localhost:8000/admin/api/v1/admin/companies/comp_123/subscription',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// Tout le contexte pour support efficace
console.log({
  company,
  users,
  subscription
});
```

---

## Support

Pour toute question ou problème :
- **Documentation complète** : `ADMIN_API_DOCUMENTATION.md`
- **Service concerné** : Gestion Commerciale Service (port 3005)
- **Contact** : Équipe technique Wanzo
