# Documentation de l'API du microservice Customer

Cette documentation décrit la structure des URLs et les endpoints disponibles pour communiquer avec le microservice Customer via l'API Gateway.

## Informations générales

- **Base URL**: `http://localhost:8000/customer`
- **Version API**: v1
- **Port API Gateway**: 8000
- **Port Microservice Customer**: 3011 (interne)

## Authentification

Toutes les requêtes nécessitent une authentification via un token JWT.

**Headers requis**:
```
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

## Structure des URLs

Tous les endpoints du microservice sont accessibles via l'API Gateway à l'adresse suivante:
`http://localhost:8000/customer/land/api/v1/<endpoint>`

## Endpoints disponibles

### 1. Gestion des Entreprises (Companies)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/land/api/v1/companies` | Récupérer toutes les entreprises |
| GET | `/land/api/v1/companies/:id` | Récupérer une entreprise par son ID |
| POST | `/land/api/v1/companies` | Créer une nouvelle entreprise |
| PATCH | `/land/api/v1/companies/:id` | Mettre à jour une entreprise |
| DELETE | `/land/api/v1/companies/:id` | Supprimer une entreprise |
| POST | `/land/api/v1/companies/:id/logo` | Uploader un logo d'entreprise |
| GET | `/land/api/v1/companies/user/:auth0Id` | Récupérer les entreprises d'un utilisateur |
| POST | `/land/api/v1/companies/:id/locations` | Ajouter une localisation à une entreprise |
| PATCH | `/land/api/v1/companies/:id/locations/:locationId` | Mettre à jour une localisation |
| DELETE | `/land/api/v1/companies/:id/locations/:locationId` | Supprimer une localisation |
| POST | `/land/api/v1/companies/:id/associates` | Ajouter un associé à une entreprise |
| PATCH | `/land/api/v1/companies/:id/associates/:associateId` | Mettre à jour un associé |
| DELETE | `/land/api/v1/companies/:id/associates/:associateId` | Supprimer un associé |

**Paramètres de filtrage pour GET /companies**:
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 10)
- `name`: Filtrer par nom d'entreprise
- `sector`: Filtrer par secteur d'activité
- `location`: Filtrer par localisation
- `status`: Filtrer par statut

### 2. Gestion des Institutions Financières

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/land/api/v1/financial-institutions` | Récupérer toutes les institutions financières |
| GET | `/land/api/v1/financial-institutions/:id` | Récupérer une institution par son ID |
| POST | `/land/api/v1/financial-institutions` | Créer une nouvelle institution financière |
| PATCH | `/land/api/v1/financial-institutions/:id` | Mettre à jour une institution |
| DELETE | `/land/api/v1/financial-institutions/:id` | Supprimer une institution |
| POST | `/land/api/v1/financial-institutions/:id/logo` | Uploader un logo |
| POST | `/land/api/v1/financial-institutions/:id/branches` | Ajouter une agence |
| PATCH | `/land/api/v1/financial-institutions/:id/branches/:branchId` | Mettre à jour une agence |
| DELETE | `/land/api/v1/financial-institutions/:id/branches/:branchId` | Supprimer une agence |
| POST | `/land/api/v1/financial-institutions/:id/executive-team` | Ajouter un membre de l'équipe de direction |
| PATCH | `/land/api/v1/financial-institutions/:id/executive-team/:memberId` | Mettre à jour un membre |
| DELETE | `/land/api/v1/financial-institutions/:id/executive-team/:memberId` | Supprimer un membre |
| POST | `/land/api/v1/financial-institutions/:id/board` | Ajouter un membre du conseil d'administration |
| PATCH | `/land/api/v1/financial-institutions/:id/board/:memberId` | Mettre à jour un membre |
| DELETE | `/land/api/v1/financial-institutions/:id/board/:memberId` | Supprimer un membre |

**Paramètres de filtrage pour GET /financial-institutions**:
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 10)
- `name`: Filtrer par nom
- `type`: Filtrer par type d'institution
- `country`: Filtrer par pays
- `status`: Filtrer par statut

### 3. Gestion des Utilisateurs

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/land/api/v1/users/me` | Récupérer le profil de l'utilisateur connecté |
| GET | `/land/api/v1/users/:id` | Récupérer un utilisateur par son ID |
| POST | `/land/api/v1/users/sync` | Synchroniser l'utilisateur depuis Auth0 |
| PATCH | `/land/api/v1/users/me` | Mettre à jour le profil utilisateur |
| POST | `/land/api/v1/users/me/avatar` | Uploader une photo de profil |
| POST | `/land/api/v1/users/me/verify-phone` | Vérifier un numéro de téléphone |
| POST | `/land/api/v1/users/me/identity-document` | Uploader un document d'identité |
| PUT | `/land/api/v1/users/me/preferences` | Mettre à jour les préférences utilisateur |
| GET | `/land/api/v1/users/me/companies` | Récupérer les entreprises de l'utilisateur |

### 4. Gestion des Tokens

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/land/api/v1/tokens/purchase` | Acheter des tokens |
| GET | `/land/api/v1/tokens/balance` | Récupérer le solde de tokens de l'utilisateur connecté |
| GET | `/land/api/v1/tokens/balance/:customerId` | Récupérer le solde de tokens d'un client |
| GET | `/land/api/v1/tokens/usage-history` | Récupérer l'historique d'utilisation des tokens |
| POST | `/land/api/v1/tokens/usage` | Enregistrer une utilisation de tokens |
| GET | `/land/api/v1/tokens/usage-summary` | Récupérer un résumé de l'utilisation des tokens |

**Paramètres pour GET /tokens/usage-history**:
- `startDate`: Date de début (format: YYYY-MM-DD)
- `endDate`: Date de fin (format: YYYY-MM-DD)
- `serviceType`: Type de service (`AI`, `CREDIT_ANALYSIS`, `TRANSACTION_ANALYSIS`)
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

### 5. Gestion des Abonnements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/land/api/v1/subscription/plans` | Récupérer tous les plans d'abonnement disponibles |
| POST | `/land/api/v1` | Créer un nouvel abonnement |
| GET | `/land/api/v1/customer/:customerId` | Récupérer les abonnements d'un client |
| GET | `/land/api/v1/subscription/:id` | Récupérer un abonnement par son ID |
| PUT | `/land/api/v1/subscription/:id` | Mettre à jour un abonnement |
| PUT | `/land/api/v1/subscription/:id/cancel` | Annuler un abonnement |
| PUT | `/land/api/v1/subscription/:id/renew` | Renouveler un abonnement |

### 6. Gestion des Tarifs

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/pricing/plans` | Récupérer les plans d'abonnement disponibles |
| GET | `/pricing/plans/:id` | Récupérer un plan d'abonnement par son ID |
| GET | `/pricing/token-packages` | Récupérer les packages de tokens disponibles |
| GET | `/pricing/token-packages/:id` | Récupérer un package de tokens par son ID |
| POST | `/pricing/calculate` | Calculer le prix d'un abonnement |
| POST | `/pricing/token-purchase/estimate` | Estimer le prix d'un achat de tokens |
| GET | `/pricing/feature-access/:featureId` | Vérifier l'accès à une fonctionnalité |

**Paramètres pour GET /pricing/plans**:
- `customerType`: Type de client (`SME`, `FINANCIAL_INSTITUTION`)
- `billingPeriod`: Période de facturation (`MONTHLY`, `QUARTERLY`, `ANNUAL`)

### 7. Gestion de la Facturation

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/land/api/v1/invoices/customer/:customerId` | Récupérer les factures d'un client |
| GET | `/land/api/v1/invoices/:id` | Récupérer une facture par son ID |
| POST | `/land/api/v1/invoices` | Créer une nouvelle facture |
| PUT | `/land/api/v1/invoices/:id` | Mettre à jour une facture |
| PUT | `/land/api/v1/invoices/:id/status` | Mettre à jour le statut d'une facture |
| GET | `/land/api/v1/payments/customer/:customerId` | Récupérer les paiements d'un client |
| GET | `/land/api/v1/payments/:id` | Récupérer un paiement par son ID |
| POST | `/land/api/v1/payments` | Enregistrer un nouveau paiement |
| GET | `/land/api/v1/invoices/:id/download` | Télécharger une facture (PDF) |

### 8. Gestion des Clients (Customers)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/customers` | Récupérer tous les clients |
| GET | `/customers/:id` | Récupérer un client par son ID |
| POST | `/customers` | Créer un nouveau client |
| PUT | `/customers/:id` | Mettre à jour un client |
| DELETE | `/customers/:id` | Supprimer un client |
| PUT | `/customers/:id/validate` | Valider un client |
| PUT | `/customers/:id/suspend` | Suspendre un client |
| PUT | `/customers/:id/reactivate` | Réactiver un client |

**Paramètres pour GET /customers**:
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 10)

## Format des réponses

Toutes les réponses de l'API suivent le format standard suivant:

### Réponse de succès

```json
{
  "success": true,
  "data": {
    // Les données spécifiques à l'endpoint
  }
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "error": "Message d'erreur spécifique",
  "statusCode": 400
}
```

### Pagination

Les endpoints qui retournent des listes utilisent ce format de pagination:

```json
{
  "success": true,
  "data": {
    "items": [...], // Liste des éléments
    "total": 100,   // Nombre total d'éléments
    "page": 1,      // Page courante
    "limit": 20,    // Éléments par page
    "totalPages": 5 // Nombre total de pages
  }
}
```

## Exemples d'utilisation

### Récupérer le profil utilisateur connecté

```javascript
const fetchUserProfile = async () => {
  try {
    const response = await fetch('http://localhost:8000/customer/land/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    throw error;
  }
};
```

### Créer une nouvelle entreprise

```javascript
const createCompany = async (companyData) => {
  try {
    const response = await fetch('http://localhost:8000/customer/land/api/v1/companies', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(companyData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'entreprise:', error);
    throw error;
  }
};
```

### Acheter des tokens

```javascript
const purchaseTokens = async (purchaseData) => {
  try {
    const response = await fetch('http://localhost:8000/customer/land/api/v1/tokens/purchase', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purchaseData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Erreur lors de l\'achat de tokens:', error);
    throw error;
  }
};
```
