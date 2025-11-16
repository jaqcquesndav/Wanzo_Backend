# Portefeuilles Traditionnels

Ce document décrit les endpoints principaux pour la gestion des portefeuilles traditionnels dans l'API Wanzo Portfolio Institution.

## Modules des Portefeuilles Traditionnels

Les portefeuilles traditionnels sont organisés en plusieurs modules :

1. **[Demandes de Financement](./demandes/README.md)** - Gestion des demandes de financement
2. **[Contrats de Crédit](./contrats/README.md)** - Gestion des contrats de crédit
3. **[Déboursements](./virements/README.md)** - Gestion des déboursements/virements spécifiques aux crédits
4. **[Remboursements](./remboursements/README.md)** - Gestion des remboursements des clients
5. **[Garanties](./garanties/README.md)** - Gestion des garanties
6. **[Paramètres](./parametres/README.md)** - Configuration des paramètres du portefeuille

## Liste des portefeuilles traditionnels

Récupère la liste des portefeuilles traditionnels avec pagination et filtrage.

**Endpoint** : `GET /portfolios/traditional`

**Paramètres de requête** :
- `page` (optionnel, défaut: 1) : Numéro de page
- `limit` (optionnel, défaut: 10) : Nombre d'éléments par page
- `status` (optionnel) : Filtre par statut (active, closed, suspended)
- `manager` (optionnel) : Filtre par gestionnaire
- `client` (optionnel) : Filtre par client
- `dateFrom` (optionnel) : Date de début (format: YYYY-MM-DD)
- `dateTo` (optionnel) : Date de fin (format: YYYY-MM-DD)
- `search` (optionnel) : Recherche textuelle
- `sortBy` (optionnel) : Tri par champ (createdAt, name, totalAmount)
- `sortOrder` (optionnel) : Ordre de tri (asc, desc)

**Réponse réussie** (200 OK) :

```json
[
  {
    "id": "trad-1",
    "name": "Portefeuille PME Nord-Kivu",
    "type": "traditional",
    "status": "active",
    "target_amount": 500000000,
    "target_return": 12,
    "target_sectors": ["Commerce", "Services", "Agriculture"],
    "risk_profile": "moderate",
    "description": "Portefeuille de crédits pour PME",
    "manager_id": "mgr-123",
    "institution_id": "inst-456",
    "products": [
      {
        "id": "prod-1",
        "name": "Crédit PME Standard",
        "type": "credit_professionnel",
        "description": "Crédit pour petites et moyennes entreprises",
        "minAmount": 1000000,
        "maxAmount": 50000000,
        "duration": {
          "min": 12,
          "max": 60
        },
        "interestRate": {
          "type": "fixed",
          "value": 12.5
        },
        "requirements": ["Garantie bancaire", "Business plan"],
        "acceptedGuarantees": ["Hypothèque", "Nantissement"],
        "isPublic": true,
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-03-15T00:00:00.000Z"
      }
    ],
    "bank_accounts": [
      {
        "id": "bank-1",
        "name": "Compte Principal PME",
        "bank_name": "Banque Centrale",
        "account_number": "12345678901",
        "currency": "CDF",
        "balance": 45000000,
        "is_default": true,
        "status": "active"
      }
    ],
    "manager": {
      "id": "mgr-123",
      "name": "Jean Dupont",
      "email": "jean.dupont@exemple.com",
      "phone": "+243810123456",
      "role": "Gestionnaire de Portefeuille",
      "department": "Crédit Traditionnel"
    },
    "management_fees": {
      "setup_fee": 250000,
      "annual_fee": 500000,
      "performance_fee": 2.5
    },
    "metrics": {
      "net_value": 450000000,
      "average_return": 10.5,
      "risk_portfolio": 8,
      "sharpe_ratio": 1.8,
      "volatility": 12,
      "alpha": 2.5,
      "beta": 0.85,
      "asset_allocation": [
        { "type": "Crédit PME", "percentage": 45 },
        { "type": "Microfinance", "percentage": 30 },
        { "type": "Trésorerie", "percentage": 25 }
      ],
      "performance_curve": [100, 110, 120, 115, 130, 128, 140],
      "returns": [100, 110, 120, 115, 130, 128, 140],
      "benchmark": [100, 108, 115, 112, 125, 122, 135],
      "balance_AGE": {
        "total": 120000000,
        "echeance_0_30": 70000000,
        "echeance_31_60": 30000000,
        "echeance_61_90": 15000000,
        "echeance_91_plus": 5000000
      },
      "taux_impayes": 2.1,
      "taux_couverture": 98.5,
      "nb_credits": 45,
      "total_credits": 450000000,
      "avg_credit": 10000000,
      "nb_clients": 35,
      "taux_rotation": 15.5,
      "taux_provision": 2.5,
      "taux_recouvrement": 97.8
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-03-15T00:00:00.000Z"
  }
]
```

## Création d'un portefeuille traditionnel

Crée un nouveau portefeuille traditionnel.

**Endpoint** : `POST /portfolios/traditional`

**Corps de la requête** :

```json
{
  "name": "Nouveau Portefeuille PME",
  "description": "Portefeuille de crédits pour PME",
  "type": "traditional",
  "reference": "PTF-2025-001",
  "manager_id": "123e4567-e89b-12d3-a456-426614174000",
  "institution_id": "987e6543-e21b-34c5-b678-542698765432",
  "target_amount": 200000000,
  "target_return": 15,
  "target_sectors": ["Commerce", "Artisanat", "Agriculture"],
  "risk_profile": "moderate",
  "currency": "XOF"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "reference": "PTF-2025-001",
    "name": "Nouveau Portefeuille PME",
    "description": "Portefeuille de crédits pour PME",
    "type": "traditional",
    "status": "active",
    "manager_id": "123e4567-e89b-12d3-a456-426614174000",
    "institution_id": "987e6543-e21b-34c5-b678-542698765432",
    "target_amount": 200000000,
    "total_amount": 0,
    "target_return": 15,
    "target_sectors": ["Commerce", "Artisanat", "Agriculture"],
    "risk_profile": "moderate",
    "currency": "XOF",
    "clientCount": 0,
    "riskScore": null,
    "products": [],
    "bank_accounts": [],
    "financial_products": [],
    "manager": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Jean Dupont",
      "email": "jean.dupont@exemple.com"
    },
    "managerBankAccounts": [],
    "managerMobileMoneyAccounts": [],
    "managerPaymentPreferences": null,
    "metrics": {
      "net_value": 0,
      "average_return": 0,
      "risk_portfolio": 0,
      "sharpe_ratio": 0,
      "volatility": 0,
      "alpha": 0,
      "beta": 0,
      "asset_allocation": [],
      "performance_curve": [],
      "returns": [],
      "benchmark": []
    },
    "created_at": "2025-08-03T15:30:00.000Z",
    "updated_at": "2025-08-03T15:30:00.000Z"
  }
}
```

## Détails d'un portefeuille traditionnel

Récupère les détails complets d'un portefeuille traditionnel spécifique.

**Endpoint** : `GET /portfolios/traditional/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

## Récupérer un portefeuille avec ses produits financiers

Récupère un portefeuille traditionnel incluant tous ses produits financiers associés.

**Endpoint** : `GET /portfolios/traditional/{id}/products`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "portfolio": {
      "id": "trad-1",
      "name": "Portefeuille PME Nord-Kivu",
      "status": "active",
      "target_amount": 500000000
    },
    "products": [
      {
        "id": "prod-1",
        "name": "Crédit PME Standard",
        "type": "credit_professionnel",
        "minAmount": 1000000,
        "maxAmount": 50000000,
        "interestRate": 12.5,
        "status": "active"
      }
    ]
  }
}

**Réponse réussie** (200 OK) :

```json
{
  "id": "trad-1",
  "name": "Portefeuille PME Nord-Kivu",
  "description": "Portefeuille de crédits pour PME",
  "type": "traditional",
  "status": "active",
  "target_amount": 500000000,
  "target_return": 12,
  "target_sectors": ["Commerce", "Services", "Agriculture"],
  "risk_profile": "moderate",
  "products": [],
  "metrics": {
    "net_value": 450000000,
    "average_return": 10.5,
    "risk_portfolio": 8,
    "sharpe_ratio": 1.8,
    "volatility": 12,
    "alpha": 2.5,
    "beta": 0.85,
    "asset_allocation": [
      { "type": "Crédit PME", "percentage": 45 },
      { "type": "Microfinance", "percentage": 30 },
      { "type": "Trésorerie", "percentage": 25 }
    ],
    "performance_curve": [100, 110, 120, 115, 130, 128, 140],
    "returns": [100, 110, 120, 115, 130, 128, 140],
    "benchmark": [100, 108, 115, 112, 125, 122, 135],
    "balance_AGE": {
      "total": 120000000,
      "echeance_0_30": 70000000,
      "echeance_31_60": 30000000,
      "echeance_61_90": 15000000,
      "echeance_91_plus": 5000000
    },
    "taux_impayes": 2.1,
    "taux_couverture": 98.5,
    "nb_credits": 45,
    "total_credits": 450000000,
    "avg_credit": 10000000,
    "nb_clients": 35,
    "taux_rotation": 15.5,
    "taux_provision": 2.5,
    "taux_recouvrement": 97.8
  },
  "manager": {
    "id": "mgr-123",
    "name": "Jean Dupont",
    "email": "jean.dupont@exemple.com",
    "phone": "+243810123456",
    "role": "Gestionnaire de Portefeuille",
    "department": "Crédit Traditionnel"
  },
  "management_fees": {
    "setup_fee": 250000,
    "annual_fee": 500000,
    "performance_fee": 2.5
  },
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-03-15T00:00:00.000Z"
}
```

## Mise à jour d'un portefeuille traditionnel

Met à jour les informations d'un portefeuille traditionnel existant.

**Endpoint** : `PUT /portfolios/traditional/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Corps de la requête** :

```json
{
  "name": "Portefeuille PME 2025 - Révisé",
  "description": "Portefeuille de crédits pour PME - Révisé",
  "status": "active",
  "total_amount": 600000000,
  "clientCount": 25,
  "riskScore": 75,
  "manager_id": "123e4567-e89b-12d3-a456-426614174789",
  "target_return": 18,
  "settings": {
    "maxLoanAmount": 600000000,
    "interestRateRange": {
      "min": 6.0,
      "max": 16.0
    },
    "loanTermRange": {
      "min": 6,
      "max": 48
    },
    "riskToleranceLevel": "high"
  }
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "portfolio123",
    "reference": "TRP-2025-001",
    "name": "Portefeuille PME 2025 - Révisé",
    "description": "Portefeuille de crédits pour PME - Révisé",
    "status": "active",
    "manager": {
      "id": "user789",
      "name": "Pierre Durand"
    },
    "settings": {
      "maxLoanAmount": 600000.00,
      "interestRateRange": {
        "min": 6.0,
        "max": 16.0
      },
      "loanTermRange": {
        "min": 6,
        "max": 48
      },
      "riskToleranceLevel": "high"
    },
    "updatedAt": "2025-07-24T15:00:00.000Z"
  }
}
```

## Suppression d'un portefeuille traditionnel

Supprime un portefeuille traditionnel du système.

**Endpoint** : `DELETE /portfolios/traditional/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "Portefeuille supprimé avec succès"
}
```

## Changement de statut d'un portefeuille traditionnel

Change le statut d'un portefeuille traditionnel.

**Endpoint** : `POST /portfolios/traditional/{id}/status`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Corps de la requête** :

```json
{
  "status": "inactive"
}
```

**Statuts valides** :
- `active` : Actif
- `inactive` : Inactif 
- `pending` : En attente
- `archived` : Archivé

**Réponse réussie** (200 OK) :

```json
{
  "id": "trad-1",
  "name": "Portefeuille PME Nord-Kivu",
  "status": "inactive",
  "updated_at": "2025-08-03T16:00:00.000Z"
}
```

## Fermeture d'un portefeuille traditionnel

Ferme définitivement un portefeuille traditionnel avec possibilité d'ajouter une raison.

**Endpoint** : `POST /portfolios/traditional/{id}/close`

**Paramètres de chemin** :
- `id` : Identifiant unique du portefeuille

**Corps de la requête** :

```json
{
  "closureReason": "Fin de mandat",
  "closureNotes": "Tous les crédits ont été soldés, fermeture programmée"
}
```

**Paramètres optionnels** :
- `closureReason` (optionnel) : Raison de la fermeture
- `closureNotes` (optionnel) : Notes complémentaires

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "trad-1",
    "name": "Portefeuille PME Nord-Kivu",
    "status": "closed",
    "closureReason": "Fin de mandat",
    "closureNotes": "Tous les crédits ont été soldés, fermeture programmée",
    "closedAt": "2025-11-10T16:00:00.000Z",
    "updated_at": "2025-11-10T16:00:00.000Z"
  }
}
```

## Erreurs spécifiques

| Code HTTP | Code d'erreur                   | Description                                        |
|-----------|---------------------------------|----------------------------------------------------|
| 400       | INVALID_PORTFOLIO_DATA          | Données de portefeuille invalides                   |
| 404       | PORTFOLIO_NOT_FOUND             | Portefeuille non trouvé                             |
| 403       | INSUFFICIENT_PERMISSIONS        | Permissions insuffisantes                           |
| 409       | PORTFOLIO_REFERENCE_EXISTS      | Référence de portefeuille déjà existante            |
| 400       | INVALID_PORTFOLIO_STATUS_CHANGE | Changement de statut de portefeuille invalide       |

---

## 📝 Structure de Données TypeScript

### Interface TraditionalPortfolio

```typescript
interface TraditionalPortfolio extends Portfolio {
  description: string;
  manager_id: string;
  institution_id: string;
}

interface Portfolio {
  id: string;
  name: string;
  reference: string;                      // Référence unique du portefeuille (obligatoire)
  type: 'traditional' | 'credit' | 'savings' | 'microfinance' | 'treasury';
  status: 'active' | 'inactive' | 'pending' | 'archived' | 'closed' | 'suspended';
  manager_id: string;                     // UUID du gestionnaire (obligatoire)
  institution_id: string;                 // UUID de l'institution (obligatoire)
  target_amount: number;
  total_amount: number;                   // Montant total actualisé (default: 0)
  clientCount?: number;                   // Nombre de clients (calculé)
  riskScore?: number;                     // Score de risque (0-100, calculé)
  target_return?: number;
  target_sectors?: string[];
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  currency: string;                       // Code ISO 4217 (default: XOF)
  products: string[];                     // IDs des produits
  bank_accounts?: BankAccount[];
  financial_products?: FinancialProduct[];
  manager?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role?: string;
    department?: string;
  };
  management_fees?: {
    setup_fee?: number;
    annual_fee?: number;
    performance_fee?: number;
  };
  metrics?: PortfolioMetrics;
  settings?: {
    maxLoanAmount: number;
    interestRateRange: { min: number; max: number; };
    loanTermRange: { min: number; max: number; };
    riskToleranceLevel: 'low' | 'medium' | 'high';
  };
  managerBankAccounts?: ManagerBankAccount[];
  managerMobileMoneyAccounts?: ManagerMobileMoneyAccount[];
  managerPaymentPreferences?: ManagerPaymentPreferences;
  clientId?: string;
  createdBy?: string;
  created_at: string;
  updated_at: string;
}

interface ManagerBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  swiftCode?: string;
  iban?: string;
  branchCode?: string;
  branchAddress?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ManagerMobileMoneyAccount {
  id: string;
  operator: 'AM' | 'OM' | 'WAVE' | 'MP' | 'AF';
  phoneNumber: string;
  accountHolderName: string;
  isDefault: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

interface ManagerPaymentPreferences {
  preferredMethod: 'bank' | 'mobile_money';
  defaultBankAccount?: string;
  defaultMobileMoneyAccount?: string;
  allowAutomaticPayments: boolean;
  minimumPaymentThreshold?: number;
  notificationPreferences?: {
    sms?: boolean;
    email?: boolean;
    push?: boolean;
  };
}
```

### Interface FinancialProduct

```typescript
interface FinancialProduct {
  id: string;
  name: string;
  type: 'credit_personnel' | 'credit_immobilier' | 'credit_auto' | 'credit_professionnel' | 'microcredit' | 'credit_consommation';
  description: string;
  minAmount: number;
  maxAmount: number;
  duration: {
    min: number;
    max: number;
  };
  interestRate: {
    type: 'fixed' | 'variable';
    value?: number;
    min?: number;
    max?: number;
  };
  requirements: string[];
  acceptedGuarantees?: string[];
  isPublic: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
```

### Interface BankAccount

```typescript
interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number: string;
  currency: string;
  balance: number;
  is_default: boolean;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}
```

### Interface PortfolioMetrics

```typescript
interface PortfolioMetrics {
  net_value: number;
  average_return: number;
  risk_portfolio: number;
  sharpe_ratio: number;
  volatility: number;
  alpha: number;
  beta: number;
  asset_allocation: Array<{
    type: string;
    percentage: number;
  }>;
  performance_curve?: number[];
  returns?: number[];
  benchmark?: number[];
  // Indicateurs spécifiques crédit
  balance_AGE?: {
    total: number;
    echeance_0_30: number;
    echeance_31_60: number;
    echeance_61_90: number;
    echeance_91_plus: number;
  };
  taux_impayes?: number;
  taux_couverture?: number;
  // Métriques métier crédit/traditionnel
  nb_credits?: number;
  total_credits?: number;
  avg_credit?: number;
  nb_clients?: number;
  taux_rotation?: number;
  taux_provision?: number;
  taux_recouvrement?: number;
}
```

---

## 📊 Champs Calculés et Dynamiques

Les champs suivants sont calculés automatiquement par le système et ne peuvent pas être modifiés directement:

| Champ | Type | Calcul | Description |
|-------|------|--------|-------------|
| `total_amount` | number | Somme des montants de tous les contrats actifs | Montant total actualisé du portefeuille |
| `clientCount` | number | COUNT(DISTINCT client_id) des contrats | Nombre de clients uniques |
| `riskScore` | number | Algorithme de scoring basé sur taux_impayes, taux_couverture, balance_AGE | Score de risque global (0-100) |
| `metrics.nb_credits` | number | COUNT(contracts WHERE status='active') | Nombre de crédits actifs |
| `metrics.total_credits` | number | SUM(contracts.amount) | Montant total des crédits |
| `metrics.avg_credit` | number | total_credits / nb_credits | Montant moyen par crédit |
| `metrics.nb_clients` | number | COUNT(DISTINCT clients) | Nombre de clients (identique à clientCount) |
| `metrics.taux_impayes` | number | Calculé depuis repayments en retard | Taux d'impayés en % |
| `metrics.taux_recouvrement` | number | Calculé depuis repayments reçus vs dus | Taux de recouvrement en % |

> **Note**: Ces champs sont en lecture seule et sont recalculés lors de chaque événement affectant le portefeuille (création de contrat, remboursement, etc.).

---

*Documentation mise à jour le 16 novembre 2025 - Conformité 100% avec le code source*
