# Subscription Payment Analytics API Documentation

Ce document décrit les endpoints d'analytics pour les paiements d'abonnement, utilisés pour le monitoring temps réel des transactions et statistiques dans le dashboard admin.

## Base URLs

- **Via API Gateway**: `http://localhost:8000/admin/api/v1/subscription-payments`
- **Direct (admin-service)**: `http://localhost:3001/admin/subscription-payments`
- **Version**: 1.0

### Architecture de Routing

L'API Gateway détecte le prefix `admin/api/v1` et le **coupe automatiquement** avant de router vers admin-service.

**Flux de requête:**
1. Client appelle: `http://localhost:8000/admin/api/v1/subscription-payments/statistics`
2. Gateway coupe: `/admin/api/v1`
3. Admin-service reçoit: `/subscription-payments/statistics`
4. Controller `@Controller('admin/subscription-payments')` traite la requête

**Note**: Le controller dans admin-service garde le préfixe `admin/` car il est **après** le prefix coupé par l'API Gateway.

## Authentification

Tous les endpoints nécessitent une authentification Bearer Token.

## Endpoints

### 1. Statistiques Globales de Paiement

#### `GET /admin/subscription-payments/statistics`

Récupère les statistiques globales des paiements d'abonnement pour le dashboard admin.

**Description:** Métriques temps réel incluant revenus, volumes, répartition par méthode de paiement et type de client.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 1250,
    "totalRevenue": 45600.00,
    "mobileMoneyTransactions": 800,
    "cardTransactions": 450,
    "failedTransactions": 25,
    "byCustomerType": {
      "sme": {
        "count": 900,
        "revenue": 32000.00
      },
      "financial": {
        "count": 350,
        "revenue": 13600.00
      }
    },
    "byCurrency": {
      "USD": {
        "count": 1250,
        "revenue": 45600.00
      }
    },
    "lastUpdated": "2025-11-10T15:30:45.123Z"
  },
  "message": "Statistiques récupérées avec succès"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Erreur lors de la récupération des statistiques",
  "data": null
}
```

### 2. Transactions Récentes

#### `GET /admin/subscription-payments/recent-transactions`

Récupère la liste des transactions d'abonnement récentes pour monitoring temps réel.

**Query Parameters:**
- `limit` (optional, number): Nombre maximum de transactions (défaut: 50, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "txn_abc123",
      "customerId": "cust_456",  
      "customerName": "PME Solutions",
      "amount": 150.00,
      "currency": "USD",
      "paymentMethod": "mobile_money",
      "provider": "Orange Money",
      "completedAt": "2025-11-10T14:25:30.000Z",
      "planId": "plan_premium",
      "paymentDetails": {
        "phone": "+243999123456",
        "reference": "OM123456789"
      }
    }
  ],
  "total": 1,
  "message": "1 transactions récupérées avec succès"
}
```

### 3. Métriques par Méthode de Paiement

#### `GET /admin/subscription-payments/payment-method-metrics`

Analyse de performance et conversion par méthode de paiement.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "mobile_money": {
      "count": 800,
      "revenue": 28000.00,
      "percentage": 64.0
    },
    "card": {
      "count": 450,
      "revenue": 17600.00,
      "percentage": 36.0
    },
    "failureRate": 2.0
  },
  "message": "Métriques récupérées avec succès"
}
```

### 4. État de Santé du Système

#### `GET /admin/subscription-payments/health`

Vérification de l'état du système de tracking des paiements.

**Response (200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "lastUpdated": "2025-11-10T15:30:45.123Z",
    "totalTransactions": 1250,
    "isActive": true
  },
  "timestamp": "2025-11-10T15:35:12.456Z"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "status": "unhealthy", 
  "error": "Erreur du système de tracking",
  "timestamp": "2025-11-10T15:35:12.456Z"
}
```

## Types de Données

### PaymentMethod
```typescript
type PaymentMethod = 'mobile_money' | 'card';
```

### CustomerType  
```typescript
type CustomerType = 'sme' | 'financial';
```

### TransactionStatus
```typescript
type TransactionStatus = 'completed' | 'failed' | 'pending';
```

## Notes d'Implémentation

- Les données sont collectées en temps réel via les événements Kafka de paiement
- Les statistiques sont mises en cache pour les performances
- Le système supporte uniquement USD actuellement
- Les métriques sont calculées sur une fenêtre glissante de 24h par défaut

## Codes d'Erreur

| Code | Description |
|------|-------------|
| 200  | Succès |
| 401  | Non authentifié |
| 403  | Permissions insuffisantes |
| 500  | Erreur serveur interne |