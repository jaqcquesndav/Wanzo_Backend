# API Endpoints - Gestion des Comptes de Portefeuille

## Vue d'ensemble

Cette documentation décrit les endpoints pour la gestion des comptes bancaires et Mobile Money associés à un portefeuille.

## Base URL

```
/portfolio/api/v1/portfolios/{portfolioId}/accounts
```

---

## 🔄 Synchronisation Automatique

**Important** : Toutes les opérations CRUD sur les comptes déclenchent une synchronisation automatique avec l'entité Portfolio.

### Mécanisme

Après chaque modification (ajout, mise à jour, suppression, changement de compte principal), le système :

1. ✅ Met à jour le stockage dédié des comptes (`localStorage.portfolio_{id}_*_accounts`)
2. ✅ Synchronise automatiquement les données vers l'entité Portfolio
3. ✅ Met à jour les champs `bank_accounts` et `mobile_money_accounts` du portfolio
4. ✅ Met à jour le timestamp `updated_at` du portfolio

### Avantages

- **Cohérence des données** : Les deux sources sont toujours synchronisées
- **Pas d'intervention manuelle** : La synchronisation est transparente pour le développeur
- **Gestion d'erreurs** : Les erreurs de sync sont loggées sans bloquer l'opération principale
- **Performance** : Synchronisation asynchrone sans impact sur l'UI

### Implémentation

La synchronisation est gérée par le hook `usePortfolioAccounts` via la fonction `syncAccountsToPortfolio()` :

```typescript
const syncAccountsToPortfolio = async () => {
  // Récupère les dernières données du stockage dédié
  const { bankAccounts, mobileMoneyAccounts } = 
    await portfolioAccountsApi.getAllAccounts(portfolioId);
  
  // Met à jour l'entité Portfolio
  const portfolio = await portfolioStorageService.getPortfolio(portfolioId);
  await portfolioStorageService.addOrUpdatePortfolio({
    ...portfolio,
    bank_accounts: bankAccounts,
    mobile_money_accounts: mobileMoneyAccounts,
    updated_at: new Date().toISOString(),
  });
};
```

Pour plus de détails, consultez [accounts-synchronization.md](../../../docs/accounts-synchronization.md).

---

## Comptes Bancaires

### 1. Récupérer tous les comptes bancaires

**Endpoint:** `GET /portfolios/{portfolioId}/accounts/bank`

**Description:** Récupère la liste de tous les comptes bancaires associés à un portefeuille.

**Paramètres:**
- `portfolioId` (path, string, requis) - ID du portefeuille

**Réponse réussie (200):**
```json
[
  {
    "id": "acc-123",
    "account_number": "0123456789",
    "account_name": "Compte Principal",
    "bank_name": "BCDC",
    "branch": "Gombe",
    "swift_code": "BCDCCDKI",
    "iban": "CD21BCDC...",
    "currency": "CDF",
    "is_primary": true,
    "is_active": true,
    "portfolio_id": "port-123",
    "purpose": "general",
    "balance": 50000000,
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-15T14:30:00Z"
  }
]
```

### 2. Récupérer un compte bancaire spécifique

**Endpoint:** `GET /portfolios/{portfolioId}/accounts/bank/{accountId}`

**Paramètres:**
- `portfolioId` (path, string, requis)
- `accountId` (path, string, requis)

**Réponse réussie (200):** Objet `BankAccount`

### 3. Ajouter un compte bancaire

**Endpoint:** `POST /portfolios/{portfolioId}/accounts/bank`

**Body:**
```json
{
  "account_number": "0123456789",
  "account_name": "Compte Décaissements",
  "bank_name": "Rawbank",
  "branch": "Limete",
  "swift_code": "RAWBCDKI",
  "iban": "CD21RAWB...",
  "currency": "USD",
  "is_primary": false,
  "is_active": true,
  "purpose": "disbursement"
}
```

**Réponse réussie (201):** Objet `BankAccount` créé avec `id`, `created_at`, `updated_at`

> **Note** : Après l'ajout, le compte est automatiquement synchronisé vers `portfolio.bank_accounts`

### 4. Mettre à jour un compte bancaire

**Endpoint:** `PUT /portfolios/{portfolioId}/accounts/bank/{accountId}`

**Body:** Partial<BankAccount>

**Réponse réussie (200):** Objet `BankAccount` mis à jour

> **Note** : Après la mise à jour, les modifications sont automatiquement synchronisées vers `portfolio.bank_accounts`

### 5. Supprimer un compte bancaire

**Endpoint:** `DELETE /portfolios/{portfolioId}/accounts/bank/{accountId}`

**Réponse réussie (204):** No content

> **Note** : Après la suppression, le compte est automatiquement retiré de `portfolio.bank_accounts`

---

## Comptes Mobile Money

### 1. Récupérer tous les comptes Mobile Money

**Endpoint:** `GET /portfolios/{portfolioId}/accounts/mobile-money`

**Description:** Récupère la liste de tous les comptes Mobile Money associés à un portefeuille.

**Réponse réussie (200):**
```json
[
  {
    "id": "mm-456",
    "account_name": "Jean Kabongo",
    "phone_number": "+243 812 345 678",
    "provider": "Orange Money",
    "pin_code": "[ENCRYPTED]",
    "account_holder_id": "1-12-34-56789A",
    "currency": "CDF",
    "is_primary": true,
    "is_active": true,
    "portfolio_id": "port-123",
    "purpose": "collection",
    "balance": 25000000,
    "service_number": "*150#",
    "account_status": "verified",
    "daily_limit": 5000000,
    "monthly_limit": 100000000,
    "created_at": "2025-01-05T09:00:00Z",
    "updated_at": "2025-01-18T16:20:00Z"
  }
]
```

### 2. Récupérer un compte Mobile Money spécifique

**Endpoint:** `GET /portfolios/{portfolioId}/accounts/mobile-money/{accountId}`

**Réponse réussie (200):** Objet `MobileMoneyAccount`

### 3. Ajouter un compte Mobile Money

**Endpoint:** `POST /portfolios/{portfolioId}/accounts/mobile-money`

**Body:**
```json
{
  "account_name": "Marie Nkulu",
  "phone_number": "+243 898 765 432",
  "provider": "M-Pesa",
  "pin_code": "1234",
  "account_holder_id": "1-98-76-54321B",
  "currency": "USD",
  "is_primary": false,
  "is_active": true,
  "purpose": "disbursement",
  "service_number": "*555#",
  "account_status": "verified",
  "daily_limit": 2000,
  "monthly_limit": 50000
}
```

**Réponse réussie (201):** Objet `MobileMoneyAccount` créé

**Note de sécurité:** Le `pin_code` doit être chiffré côté serveur avant stockage.

> **Note** : Après l'ajout, le compte est automatiquement synchronisé vers `portfolio.mobile_money_accounts`

### 4. Mettre à jour un compte Mobile Money

**Endpoint:** `PUT /portfolios/{portfolioId}/accounts/mobile-money/{accountId}`

**Body:** Partial<MobileMoneyAccount>

**Réponse réussie (200):** Objet `MobileMoneyAccount` mis à jour

> **Note** : Après la mise à jour, les modifications sont automatiquement synchronisées vers `portfolio.mobile_money_accounts`

### 5. Supprimer un compte Mobile Money

**Endpoint:** `DELETE /portfolios/{portfolioId}/accounts/mobile-money/{accountId}`

**Réponse réussie (204):** No content

> **Note** : Après la suppression, le compte est automatiquement retiré de `portfolio.mobile_money_accounts`

---

## Opérations Globales

### 1. Récupérer tous les comptes (bancaires + Mobile Money)

**Endpoint:** `GET /portfolios/{portfolioId}/accounts`

**Réponse réussie (200):**
```json
{
  "bankAccounts": [...],
  "mobileMoneyAccounts": [...]
}
```

### 2. Définir un compte comme principal

**Endpoint:** `PUT /portfolios/{portfolioId}/accounts/{accountType}/{accountId}/set-primary`

**Paramètres:**
- `portfolioId` (path, string, requis)
- `accountType` (path, enum, requis) - Valeurs: `bank` | `mobile_money`
- `accountId` (path, string, requis)

**Description:** Marque le compte spécifié comme principal et retire le flag `is_primary` des autres comptes du même type.

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Compte défini comme principal"
}
```

> **Note** : Après le changement, le flag `is_primary` est automatiquement synchronisé dans `portfolio.bank_accounts` ou `portfolio.mobile_money_accounts`

---

## Codes de Statut

- `200` - Succès
- `201` - Créé
- `204` - Supprimé avec succès
- `400` - Requête invalide
- `404` - Compte ou portefeuille non trouvé
- `409` - Conflit (ex: compte déjà existant)
- `500` - Erreur serveur

---

## Types de Purpose (Objectif)

Les valeurs possibles pour le champ `purpose`:

- `general` - Usage général
- `disbursement` - Décaissements
- `collection` - Recouvrements/Collections
- `investment` - Investissements
- `escrow` - Séquestre
- `reserve` - Réserve

---

## Providers Mobile Money

Les fournisseurs supportés:

- `Orange Money` - Service number: `*150#`
- `M-Pesa` (Vodacom) - Service number: `*555#`
- `Airtel Money` - Service number: `*501#`

---

## Règles de Gestion

1. **Compte principal**: Un seul compte peut être principal par type (bancaire ou Mobile Money) et par portefeuille
2. **Devise**: Doit correspondre aux devises supportées: `CDF`, `USD`, `EUR`
3. **PIN Code**: Le code PIN Mobile Money doit être chiffré avant stockage
4. **Limites**: Les limites quotidiennes/mensuelles sont vérifiées lors des transactions
5. **Statut du compte**: 
   - `verified` - Compte vérifié et opérationnel
   - `pending` - En attente de vérification
   - `suspended` - Compte suspendu temporairement
6. **Synchronisation automatique**: Toute modification de compte déclenche une synchronisation vers l'entité Portfolio
   - Pas de délai de propagation
   - Gestion transparente pour le développeur
   - Les erreurs de sync n'impactent pas l'opération principale

---

## Exemples d'utilisation

### JavaScript/TypeScript

```typescript
import { portfolioAccountsApi } from '@/services/api/shared/portfolio-accounts.api';

// Ajouter un compte bancaire
const newBankAccount = await portfolioAccountsApi.addBankAccount('port-123', {
  account_number: '0123456789',
  account_name: 'Compte Principal',
  bank_name: 'BCDC',
  currency: 'CDF',
  is_primary: true,
  is_active: true,
  purpose: 'general'
});

// Ajouter un compte Mobile Money
const newMobileAccount = await portfolioAccountsApi.addMobileMoneyAccount('port-123', {
  account_name: 'Jean Kabongo',
  phone_number: '+243812345678',
  provider: 'Orange Money',
  pin_code: '1234',
  currency: 'CDF',
  is_primary: true,
  is_active: true,
  purpose: 'collection'
});

// Définir comme principal
await portfolioAccountsApi.setPrimaryAccount('port-123', 'acc-123', 'bank');

// Note : Toutes ces opérations déclenchent automatiquement 
// la synchronisation vers portfolio.bank_accounts et portfolio.mobile_money_accounts
```

---

## Workflow de Synchronisation

### Flux de Données

```
1. UI Component (AccountsPanel)
   ↓
2. Hook (usePortfolioAccounts)
   ↓ addBankAccount / updateBankAccount / deleteBankAccount
3. API Service (portfolioAccountsApi)
   ↓ Update localStorage.portfolio_{id}_bank_accounts
4. Stockage Dédié
   ↓ syncAccountsToPortfolio()
5. Portfolio Storage Service
   ↓ Update portfolio.bank_accounts
6. Entité Portfolio (synchronized)
```

### Points de Synchronisation

La synchronisation est déclenchée dans `usePortfolioAccounts` après :

- `addBankAccount()` ✓
- `updateBankAccount()` ✓
- `deleteBankAccount()` ✓
- `addMobileMoneyAccount()` ✓
- `updateMobileMoneyAccount()` ✓
- `deleteMobileMoneyAccount()` ✓
- `setPrimaryAccount()` ✓

### Gestion des Erreurs

En cas d'erreur de synchronisation :
- L'erreur est loggée dans la console : `Failed to sync accounts to portfolio: Error`
- L'opération CRUD principale réussit quand même
- L'utilisateur reçoit une notification de succès pour l'opération CRUD
- La synchronisation sera retentée lors de la prochaine modification

---

*Documentation mise à jour le 19 novembre 2025 - Synchronisation automatique implémentée*
