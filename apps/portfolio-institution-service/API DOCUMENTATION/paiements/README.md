# API des Ordres de Paiement

Cette API permet de gérer les ordres de paiement dans l'application, quelle que soit la nature du portefeuille (traditionnel, investissement, leasing).

> **Scope** : Ordres de paiement génériques pour tous types de transactions sortantes (Institution → Externe).  
> **Usage** : Utilisé chaque fois qu'un gestionnaire de portefeuille veut créditer le compte d'un bénéficiaire.  
> **Relations** : Pour les déboursements spécifiques aux crédits traditionnels, voir [Virements/Déboursements](../portefeuilles/virements/README.md).

## Documentation complète

Pour une documentation détaillée de cette API, consultez les sections suivantes :

- [Format des données](./data-format.md) - Structure des données et règles de validation
- [Intégration de l'API](./integration.md) - Guide d'intégration avec exemples de code
- [Cycle de vie d'un ordre de paiement](./lifecycle.md) - Workflow complet d'un ordre de paiement
- [Dépannage et erreurs courantes](./troubleshooting.md) - Solutions aux problèmes fréquents

## Structure d'un Ordre de Paiement

```typescript
interface PaymentOrderData {
  id: string;
  orderNumber: string;
  date: string;
  amount: number;
  currency: string;
  beneficiary: {
    name: string;
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
    address?: string;
  };
  reference: string;
  description: string;
  portfolioId: string;
  portfolioName: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  paidBy?: string;
  paidAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

## Points d'accès

### Récupérer tous les ordres de paiement

```
GET /portfolio/api/v1/payments
```

**Paramètres de requête:**
- `portfolioId` (optionnel): Filtrer par ID de portefeuille
- `status` (optionnel): Filtrer par statut ('draft', 'pending', 'approved', 'rejected', 'paid')
- `fromDate` (optionnel): Date de début au format YYYY-MM-DD
- `toDate` (optionnel): Date de fin au format YYYY-MM-DD

**Réponse:**
```json
[
  {
    "id": "pay-123",
    "orderNumber": "OP-2023-001",
    "date": "2023-01-15",
    "amount": 5000000,
    "currency": "XAF",
    "beneficiary": {
      "name": "Entreprise ABC",
      "accountNumber": "123456789",
      "bankName": "Banque XYZ",
      "swiftCode": "ABCDEFGH"
    },
    "reference": "Paiement contrat CR-2023-001",
    "description": "Paiement du premier déboursement",
    "portfolioId": "port-123",
    "portfolioName": "Portefeuille PME",
    "status": "pending",
    "createdBy": "user-001",
    "createdAt": "2023-01-10T08:30:00Z",
    "updatedAt": "2023-01-10T08:30:00Z"
  }
]
```

### Récupérer un ordre de paiement par ID

```
GET /portfolio/api/v1/payments/{id}
```

**Réponse:**
```json
{
  "id": "pay-123",
  "orderNumber": "OP-2023-001",
  "date": "2023-01-15",
  "amount": 5000000,
  "currency": "XAF",
  "beneficiary": {
    "name": "Entreprise ABC",
    "accountNumber": "123456789",
    "bankName": "Banque XYZ",
    "swiftCode": "ABCDEFGH"
  },
  "reference": "Paiement contrat CR-2023-001",
  "description": "Paiement du premier déboursement",
  "portfolioId": "port-123",
  "portfolioName": "Portefeuille PME",
  "status": "pending",
  "createdBy": "user-001",
  "createdAt": "2023-01-10T08:30:00Z",
  "updatedAt": "2023-01-10T08:30:00Z"
}
```

### Créer un nouvel ordre de paiement

```
POST /portfolio/api/v1/payments
```

**Corps de la requête:**
```json
{
  "orderNumber": "OP-2023-001",
  "date": "2023-01-15",
  "amount": 5000000,
  "currency": "XAF",
  "beneficiary": {
    "name": "Entreprise ABC",
    "accountNumber": "123456789",
    "bankName": "Banque XYZ",
    "swiftCode": "ABCDEFGH"
  },
  "reference": "Paiement contrat CR-2023-001",
  "description": "Paiement du premier déboursement",
  "portfolioId": "port-123",
  "portfolioName": "Portefeuille PME",
  "status": "draft",
  "createdBy": "user-001"
}
```

**Réponse:**
Retourne l'ordre de paiement créé avec un ID généré.

### Mettre à jour un ordre de paiement

```
PUT /portfolio/api/v1/payments/{id}
```

**Corps de la requête:**
```json
{
  "date": "2023-01-20",
  "amount": 5500000,
  "description": "Paiement du premier déboursement - Montant révisé"
}
```

**Réponse:**
Retourne l'ordre de paiement mis à jour.

### Mettre à jour le statut d'un ordre de paiement

```
PUT /portfolio/api/v1/payments/{id}/status
```

**Corps de la requête:**
```json
{
  "status": "approved",
  "comments": "Approuvé après vérification du contrat"
}
```

**Réponse:**
Retourne l'ordre de paiement avec le statut mis à jour.

### Annuler un ordre de paiement

```
PUT /portfolio/api/v1/payments/{id}/cancel
```

**Corps de la requête:**
```json
{
  "reason": "Annulé suite à une erreur de montant"
}
```

**Réponse:**
Retourne l'ordre de paiement avec le statut mis à jour à "rejected".

### Récupérer l'historique d'un ordre de paiement

```
GET /portfolio/api/v1/payments/{id}/history
```

**Réponse:**
```json
[
  {
    "date": "2023-01-10T08:30:00Z",
    "user": "John Doe",
    "action": "create",
    "details": "Création de l'ordre de paiement"
  },
  {
    "date": "2023-01-11T10:15:00Z",
    "user": "Jane Smith",
    "action": "update_status",
    "details": "Statut mis à jour: draft → pending"
  }
]
```

### Générer un rapport de paiement

```
POST /portfolio/api/v1/payments/reports
```

**Corps de la requête:**
```json
{
  "portfolioId": "port-123",
  "fromDate": "2023-01-01",
  "toDate": "2023-01-31",
  "groupBy": "day"
}
```

**Réponse:**
```json
{
  "reportUrl": "https://example.com/reports/payment-report-2023-01.pdf",
  "summary": {
    "totalAmount": 15000000,
    "totalCount": 5,
    "byStatus": {
      "pending": { "count": 2, "amount": 7000000 },
      "approved": { "count": 2, "amount": 6000000 },
      "paid": { "count": 1, "amount": 2000000 }
    }
  }
}
```

### Récupérer les ordres de paiement par bénéficiaire

```
GET /portfolio/api/v1/payments/beneficiary/{beneficiaryName}
```

**Réponse:**
Liste des ordres de paiement associés au bénéficiaire spécifié.

## Codes d'erreur

- `400 Bad Request`: La requête est mal formée ou les données sont invalides
- `401 Unauthorized`: L'utilisateur n'est pas authentifié
- `403 Forbidden`: L'utilisateur n'a pas les droits nécessaires
- `404 Not Found`: L'ordre de paiement n'existe pas
- `409 Conflict`: Conflit avec l'état actuel (par exemple, tentative de modification d'un ordre de paiement déjà approuvé)
- `500 Internal Server Error`: Erreur serveur interne

## Exemples d'utilisation

### Création d'un ordre de paiement

```javascript
const paymentOrder = {
  orderNumber: "OP-2023-001",
  date: new Date().toISOString().split('T')[0],
  amount: 5000000,
  currency: "XAF",
  beneficiary: {
    name: "Entreprise ABC",
    accountNumber: "123456789",
    bankName: "Banque XYZ",
    swiftCode: "ABCDEFGH"
  },
  reference: "Paiement contrat CR-2023-001",
  description: "Paiement du premier déboursement",
  portfolioId: "port-123",
  portfolioName: "Portefeuille PME",
  status: "draft",
  createdBy: currentUser.id
};

const response = await paymentApi.createPaymentOrder(paymentOrder);
console.log("Ordre de paiement créé:", response.data);
```

### Approbation d'un ordre de paiement

```javascript
const orderId = "pay-123";
const response = await paymentApi.updatePaymentStatus(orderId, "approved", "Approuvé après vérification");
console.log("Ordre de paiement approuvé:", response.data);
```
