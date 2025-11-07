# Gestion des Institutions Financières - API Documentation

## Vue d'ensemble

Le module de gestion des institutions financières permet à l'équipe admin de Wanzo de gérer complètement les institutions qui utilisent le **Portfolio Institution Service** (port 3006). Les institutions ont accès à des fonctionnalités spécifiques :

- **Portfolio Management** : Gestion des portfolios de crédit
- **Prospection** : Suivi des prospects et meetings
- **Virements/Disbursements** : Gestion des décaissements
- **Centrale des Risques** : Consultation et gestion des risques
- **Statistics** : Statistiques de performance et santé financière

## Architecture

```
Admin Service (3001)
    ↓ HTTP
Portfolio Institution Service (3006)
    ↓ Database
PostgreSQL (Institution, Portfolios, Prospection, etc.)
```

**Type de client** : `CustomerType.FINANCIAL` dans Customer Service

## Configuration

### Variables d'environnement

```env
INSTITUTION_SERVICE_URL=http://localhost:3006
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

### 1. Lister toutes les institutions

**GET** `/admin/institutions`

Liste toutes les institutions financières avec pagination et filtres.

#### Paramètres de requête

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `page` | number | Numéro de page | 1 |
| `limit` | number | Éléments par page | 20 |
| `status` | string | Filtrer par statut (active, suspended, pending) | - |
| `search` | string | Recherche par nom ou identifiant | - |
| `sortBy` | string | Champ de tri (name, createdAt, etc.) | createdAt |
| `sortOrder` | string | Ordre de tri (asc, desc) | desc |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`
- `FINANCIAL_ADMIN`

#### Réponse succès (200)

```json
{
  "data": [
    {
      "id": "inst_123",
      "name": "Banque Commerciale ABC",
      "type": "BANK",
      "status": "active",
      "email": "contact@bank-abc.com",
      "phone": "+225 XX XX XX XX",
      "address": "Abidjan, Plateau",
      "createdAt": "2024-01-15T10:30:00Z",
      "totalPortfolios": 15,
      "totalLoans": 250,
      "totalAmount": 1500000000,
      "subscriptionStatus": "active"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

#### Exemple d'utilisation

```bash
curl -X GET "http://localhost:8000/admin/api/v1/admin/institutions?page=1&limit=20&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Obtenir les détails d'une institution

**GET** `/admin/institutions/:id`

Récupère les informations complètes d'une institution spécifique.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`
- `FINANCIAL_ADMIN`

#### Réponse succès (200)

```json
{
  "id": "inst_123",
  "name": "Banque Commerciale ABC",
  "type": "BANK",
  "status": "active",
  "email": "contact@bank-abc.com",
  "phone": "+225 XX XX XX XX",
  "address": "Abidjan, Plateau",
  "registrationNumber": "CI-ABC-2023-001",
  "taxId": "TAX123456",
  "website": "https://bank-abc.com",
  "description": "Banque commerciale spécialisée dans le financement des PME",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-03-20T15:45:00Z",
  "metadata": {
    "portfolioCount": 15,
    "activeLoans": 200,
    "totalDisbursed": 1500000000,
    "averageTicketSize": 7500000,
    "defaultRate": 2.5
  },
  "subscription": {
    "id": "sub_456",
    "planName": "Institution Pro",
    "status": "active",
    "startDate": "2024-01-15",
    "nextBillingDate": "2024-04-15",
    "monthlyPrice": 500000
  }
}
```

---

### 3. Récupérer les utilisateurs d'une institution

**GET** `/admin/institutions/:id/users`

Liste tous les utilisateurs associés à une institution.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`
- `FINANCIAL_ADMIN`

#### Réponse succès (200)

```json
{
  "users": [
    {
      "id": "user_789",
      "auth0Id": "auth0|abc123",
      "email": "admin@bank-abc.com",
      "firstName": "Jean",
      "lastName": "Kouassi",
      "role": "INSTITUTION_ADMIN",
      "status": "active",
      "lastLogin": "2024-03-22T09:15:00Z",
      "createdAt": "2024-01-15T10:35:00Z"
    },
    {
      "id": "user_790",
      "auth0Id": "auth0|def456",
      "email": "agent@bank-abc.com",
      "firstName": "Marie",
      "lastName": "Diabate",
      "role": "LOAN_OFFICER",
      "status": "active",
      "lastLogin": "2024-03-22T08:30:00Z",
      "createdAt": "2024-02-01T14:20:00Z"
    }
  ],
  "total": 12
}
```

---

### 4. Récupérer les portfolios d'une institution

**GET** `/admin/institutions/:id/portfolios`

Liste tous les portfolios de crédit gérés par l'institution.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `FINANCIAL_ADMIN`

#### Réponse succès (200)

```json
{
  "portfolios": [
    {
      "id": "port_001",
      "name": "Portfolio PME 2024",
      "status": "active",
      "totalLoans": 45,
      "totalAmount": 350000000,
      "disbursedAmount": 300000000,
      "outstandingAmount": 280000000,
      "defaultRate": 2.1,
      "averageInterestRate": 12.5,
      "createdAt": "2024-01-20T10:00:00Z"
    },
    {
      "id": "port_002",
      "name": "Portfolio Agriculture",
      "status": "active",
      "totalLoans": 30,
      "totalAmount": 200000000,
      "disbursedAmount": 180000000,
      "outstandingAmount": 165000000,
      "defaultRate": 1.8,
      "averageInterestRate": 11.0,
      "createdAt": "2024-02-10T11:30:00Z"
    }
  ],
  "total": 15,
  "summary": {
    "totalLoans": 250,
    "totalAmount": 1500000000,
    "totalDisbursed": 1350000000,
    "totalOutstanding": 1200000000,
    "averageDefaultRate": 2.3
  }
}
```

---

### 5. Obtenir les statistiques d'une institution

**GET** `/admin/institutions/:id/statistics`

Récupère les statistiques de performance et santé financière.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `FINANCIAL_ADMIN`

#### Réponse succès (200)

```json
{
  "overview": {
    "totalPortfolios": 15,
    "activeLoans": 250,
    "totalDisbursed": 1500000000,
    "totalOutstanding": 1200000000,
    "totalRepaid": 300000000
  },
  "performance": {
    "defaultRate": 2.5,
    "repaymentRate": 94.5,
    "averageTicketSize": 7500000,
    "averageInterestRate": 12.0,
    "portfolioAtRisk": 3.2
  },
  "activity": {
    "newLoansThisMonth": 12,
    "disbursementsThisMonth": 95000000,
    "repaymentsThisMonth": 45000000,
    "activeProspects": 35
  },
  "users": {
    "totalUsers": 12,
    "activeUsers": 10,
    "lastMonthActivity": 145
  },
  "trends": {
    "monthlyDisbursements": [
      { "month": "Jan", "amount": 80000000 },
      { "month": "Feb", "amount": 95000000 },
      { "month": "Mar", "amount": 95000000 }
    ],
    "monthlyRepayments": [
      { "month": "Jan", "amount": 40000000 },
      { "month": "Feb", "amount": 42000000 },
      { "month": "Mar", "amount": 45000000 }
    ]
  }
}
```

---

### 6. Mettre à jour une institution

**PUT** `/admin/institutions/:id`

Met à jour les informations d'une institution.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `FINANCIAL_ADMIN`

#### Corps de la requête

```json
{
  "name": "Banque Commerciale ABC SA",
  "phone": "+225 XX XX XX XX",
  "address": "Nouveau Plateau, Abidjan",
  "website": "https://new-bank-abc.com",
  "description": "Description mise à jour"
}
```

#### Réponse succès (200)

```json
{
  "message": "Institution updated successfully",
  "institution": {
    "id": "inst_123",
    "name": "Banque Commerciale ABC SA",
    "updatedAt": "2024-03-22T16:45:00Z"
  }
}
```

---

### 7. Suspendre une institution

**POST** `/admin/institutions/:id/suspend`

Suspend tous les accès d'une institution (utilisateurs, opérations).

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

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
  "message": "Institution suspended successfully",
  "institutionId": "inst_123",
  "status": "suspended",
  "suspendedAt": "2024-03-22T17:00:00Z"
}
```

---

### 8. Réactiver une institution

**POST** `/admin/institutions/:id/reactivate`

Réactive une institution suspendue.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`

#### Réponse succès (200)

```json
{
  "message": "Institution reactivated successfully",
  "institutionId": "inst_123",
  "status": "active",
  "reactivatedAt": "2024-03-25T10:00:00Z"
}
```

---

### 9. Suspendre un utilisateur d'institution

**POST** `/admin/institutions/:id/users/:userId/suspend`

Suspend un utilisateur spécifique de l'institution.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |
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
  "userId": "user_789",
  "status": "suspended"
}
```

---

### 10. Réactiver un utilisateur d'institution

**POST** `/admin/institutions/:id/users/:userId/reactivate`

Réactive un utilisateur suspendu.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |
| `userId` | string | ID de l'utilisateur |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Réponse succès (200)

```json
{
  "message": "User reactivated successfully",
  "userId": "user_789",
  "status": "active"
}
```

---

### 11. Allouer des tokens à une institution

**POST** `/admin/institutions/:id/tokens/allocate`

Alloue des tokens supplémentaires à une institution.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Corps de la requête

```json
{
  "amount": 5000,
  "reason": "Bonus pour performance exceptionnelle",
  "expiresAt": "2024-06-30T23:59:59Z"
}
```

#### Réponse succès (200)

```json
{
  "message": "Tokens allocated successfully",
  "institutionId": "inst_123",
  "tokensAdded": 5000,
  "newBalance": 12000,
  "expiresAt": "2024-06-30T23:59:59Z"
}
```

---

### 12. Récupérer l'abonnement d'une institution

**GET** `/admin/institutions/:id/subscription`

Récupère les détails de l'abonnement actif.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`
- `FINANCIAL_ADMIN`

#### Réponse succès (200)

```json
{
  "id": "sub_456",
  "institutionId": "inst_123",
  "planId": "plan_pro_institution",
  "planName": "Institution Pro",
  "status": "active",
  "startDate": "2024-01-15T00:00:00Z",
  "nextBillingDate": "2024-04-15T00:00:00Z",
  "billingCycle": "monthly",
  "amount": 500000,
  "currency": "XOF",
  "features": {
    "maxPortfolios": 20,
    "maxLoans": 500,
    "maxUsers": 15,
    "apiAccess": true,
    "advancedAnalytics": true,
    "dedicatedSupport": true
  },
  "usage": {
    "portfolios": 15,
    "loans": 250,
    "users": 12
  }
}
```

---

### 13. Mettre à jour l'abonnement

**PUT** `/admin/institutions/:id/subscriptions/:subscriptionId`

Met à jour l'abonnement d'une institution (changement de plan).

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |
| `subscriptionId` | string | ID de l'abonnement |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Corps de la requête

```json
{
  "planId": "plan_enterprise_institution",
  "effectiveDate": "2024-04-01T00:00:00Z",
  "prorationEnabled": true
}
```

#### Réponse succès (200)

```json
{
  "message": "Subscription updated successfully",
  "subscriptionId": "sub_456",
  "newPlan": "Institution Enterprise",
  "effectiveDate": "2024-04-01T00:00:00Z",
  "newAmount": 800000
}
```

---

### 14. Annuler l'abonnement

**POST** `/admin/institutions/:id/subscriptions/:subscriptionId/cancel`

Annule l'abonnement d'une institution.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |
| `subscriptionId` | string | ID de l'abonnement |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`

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
  "subscriptionId": "sub_456",
  "status": "cancelled",
  "cancelledAt": "2024-03-22T18:00:00Z",
  "accessUntil": "2024-04-15T23:59:59Z"
}
```

---

### 15. Créer un abonnement

**POST** `/admin/institutions/:id/subscriptions`

Crée un nouvel abonnement pour une institution.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | string | ID de l'institution |

#### Rôles requis

- `SUPER_ADMIN`
- `CTO`
- `CUSTOMER_MANAGER`

#### Corps de la requête

```json
{
  "planId": "plan_pro_institution",
  "startDate": "2024-04-01T00:00:00Z",
  "billingCycle": "monthly",
  "autoRenew": true,
  "paymentMethod": "invoice"
}
```

#### Réponse succès (201)

```json
{
  "message": "Subscription created successfully",
  "subscription": {
    "id": "sub_789",
    "institutionId": "inst_123",
    "planId": "plan_pro_institution",
    "status": "active",
    "startDate": "2024-04-01T00:00:00Z",
    "nextBillingDate": "2024-05-01T00:00:00Z",
    "amount": 500000,
    "currency": "XOF"
  }
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
| 404 | Not Found | Institution non trouvée |
| 500 | Internal Server Error | Erreur du service Portfolio Institution |
| 503 | Service Unavailable | Service Portfolio Institution indisponible |

### Format des erreurs

```json
{
  "statusCode": 404,
  "message": "Institution not found",
  "error": "Not Found",
  "timestamp": "2024-03-22T18:30:00Z",
  "path": "/admin/institutions/inst_999"
}
```

---

## Notes importantes

### Service-to-service authentication

Toutes les requêtes vers Portfolio Institution Service utilisent :
```
X-Service-ID: admin-service
X-Service-Secret: configured-secret
```

### Intégration avec Customer Service

Les institutions sont des clients de type `CustomerType.FINANCIAL` dans Customer Service. Lors de la création d'une institution :
1. Customer Service crée le customer avec type FINANCIAL
2. Portfolio Institution Service crée l'institution
3. Admin Service peut gérer les deux aspects

### Opérations spécifiques aux institutions

- **Portfolios** : Gérés exclusivement par Portfolio Institution Service
- **Prospection** : Suivi des prospects et meetings
- **Virements** : Décaissements vers les bénéficiaires de crédit
- **Centrale des Risques** : Consultation et mise à jour des données de risque
- **Statistics** : Métriques de performance et santé du portfolio

### Différence avec Companies

| Aspect | Institutions | Companies (SME) |
|--------|-------------|-----------------|
| Service | Portfolio Institution (3006) | Gestion Commerciale (3005) |
| Type | CustomerType.FINANCIAL | CustomerType.SME |
| Fonctionnalités | Portfolios, Prospection, Virements | Sales, Expenses, Inventory |
| Utilisateurs | Loan officers, Risk managers | Sales staff, Accountants |

---

## Exemples d'utilisation

### Scénario 1 : Supervision mensuelle d'une institution

```javascript
// 1. Récupérer les statistiques du mois
const stats = await fetch(
  'http://localhost:8000/admin/api/v1/admin/institutions/inst_123/statistics',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// 2. Vérifier les portfolios
const portfolios = await fetch(
  'http://localhost:8000/admin/api/v1/admin/institutions/inst_123/portfolios',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// 3. Allouer des bonus tokens si performance excellente
if (stats.performance.defaultRate < 2.0) {
  await fetch(
    'http://localhost:8000/admin/api/v1/admin/institutions/inst_123/tokens/allocate',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 2000,
        reason: 'Performance bonus - low default rate'
      })
    }
  );
}
```

### Scénario 2 : Gestion d'incident

```javascript
// Suspendre une institution en cas de problème
const suspend = await fetch(
  'http://localhost:8000/admin/api/v1/admin/institutions/inst_123/suspend',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reason: 'Suspected fraud - under investigation',
      notifyUsers: true
    })
  }
).then(r => r.json());

// Réactiver après investigation
setTimeout(async () => {
  await fetch(
    'http://localhost:8000/admin/api/v1/admin/institutions/inst_123/reactivate',
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
}, 3600000); // 1 heure plus tard
```

---

## Support

Pour toute question ou problème :
- **Documentation complète** : `ADMIN_API_DOCUMENTATION.md`
- **Service concerné** : Portfolio Institution Service (port 3006)
- **Contact** : Équipe technique Wanzo
