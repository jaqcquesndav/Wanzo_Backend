# Documentation de l'API du microservice Portfolio Institution

Cette documentation décrit la structure des URLs et les endpoints disponibles pour communiquer avec le microservice Portfolio Institution via l'API Gateway.

## Informations générales

- **Base URL**: `http://localhost:8000/portfolio`
- **Port API Gateway**: 8000
- **Port Microservice Portfolio Institution**: 3005 (interne)

## Authentification

Toutes les requêtes nécessitent une authentification via un token JWT.

**Headers requis**:
```
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

## Structure des URLs

Tous les endpoints du microservice sont accessibles via l'API Gateway à l'adresse suivante:
`http://localhost:8000/portfolio/<endpoint>`

## Format des réponses

Les réponses suivent un format standardisé:

**Succès**:
```json
{
  "success": true,
  "data": {
    // Les données spécifiques retournées
  }
}
```

**Pagination**:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Erreur**:
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Type d'erreur"
}
```

## Endpoints disponibles

### 1. Portefeuilles traditionnels (Traditional Portfolios)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional` | Récupérer tous les portefeuilles traditionnels |
| GET | `/portfolios/traditional/:id` | Récupérer un portefeuille par son ID |
| POST | `/portfolios/traditional` | Créer un nouveau portefeuille |
| PUT | `/portfolios/traditional/:id` | Mettre à jour un portefeuille |
| DELETE | `/portfolios/traditional/:id` | Supprimer un portefeuille |
| POST | `/portfolios/traditional/:id/close` | Clôturer un portefeuille |
| GET | `/portfolios/traditional/:id/products` | Récupérer un portefeuille avec ses produits financiers |

**Paramètres de requête pour GET /portfolios/traditional**:
- `page`: Numéro de page pour la pagination (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 10)
- `status`: Filtrer par statut ('active', 'closed', 'suspended')
- `manager`: Filtrer par gestionnaire
- `client`: Filtrer par client
- `dateFrom`: Date de début au format YYYY-MM-DD
- `dateTo`: Date de fin au format YYYY-MM-DD
- `search`: Terme de recherche
- `sortBy`: Champ de tri ('createdAt', 'name', 'totalAmount')
- `sortOrder`: Ordre de tri ('asc', 'desc')

### 2. Produits financiers (Financial Products)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/financial-products` | Récupérer tous les produits financiers |
| GET | `/financial-products/:id` | Récupérer un produit financier par son ID |
| POST | `/financial-products` | Créer un nouveau produit financier |
| PUT | `/financial-products/:id` | Mettre à jour un produit financier |
| DELETE | `/financial-products/:id` | Supprimer un produit financier |

**Paramètres de requête pour GET /financial-products**:
- `page`: Numéro de page pour la pagination (défaut: 1)
- `per_page`: Nombre d'éléments par page (défaut: 10)
- `portfolio_id`: Filtrer par ID de portefeuille
- `status`: Filtrer par statut du produit
- `type`: Filtrer par type de produit
- `search`: Terme de recherche
- `min_interest_rate`: Taux d'intérêt minimum
- `max_interest_rate`: Taux d'intérêt maximum

### 3. Demandes de crédit (Credit Requests)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/credit-requests` | Récupérer toutes les demandes de crédit |
| GET | `/portfolios/traditional/credit-requests/:id` | Récupérer une demande de crédit par son ID |
| POST | `/portfolios/traditional/credit-requests` | Créer une nouvelle demande de crédit |
| PUT | `/portfolios/traditional/credit-requests/:id` | Mettre à jour une demande de crédit |
| DELETE | `/portfolios/traditional/credit-requests/:id` | Supprimer une demande de crédit |

**Paramètres de requête pour GET /portfolios/traditional/credit-requests**:
- `page`: Numéro de page pour la pagination (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 10)
- `portfolioId`: Filtrer par ID de portefeuille
- `status`: Filtrer par statut de la demande
- `clientId`: Filtrer par ID client
- `productType`: Filtrer par type de produit
- `dateFrom`: Date de début au format YYYY-MM-DD
- `dateTo`: Date de fin au format YYYY-MM-DD
- `search`: Terme de recherche
- `sortBy`: Champ de tri
- `sortOrder`: Ordre de tri ('asc', 'desc')

### 4. Contrats de crédit (Credit Contracts)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolio_inst/portfolios/traditional/credit-contracts` | Récupérer tous les contrats de crédit |
| GET | `/portfolio_inst/portfolios/traditional/credit-contracts/:id` | Récupérer un contrat par son ID |
| POST | `/portfolio_inst/portfolios/traditional/credit-contracts/from-request` | Créer un nouveau contrat à partir d'une demande approuvée |

**Paramètres de requête pour GET /portfolio_inst/portfolios/traditional/credit-contracts**:
- `portfolioId`: Filtrer par ID de portefeuille
- `status`: Filtrer par statut du contrat
- `clientId`: Filtrer par ID client
- `productType`: Filtrer par type de produit
- `dateFrom`: Date de début au format YYYY-MM-DD
- `dateTo`: Date de fin au format YYYY-MM-DD
- `search`: Terme de recherche
- `sortBy`: Champ de tri
- `sortOrder`: Ordre de tri ('asc', 'desc')

### 5. Décaissements (Disbursements)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolio_inst/portfolios/traditional/disbursements` | Récupérer tous les décaissements |
| GET | `/portfolio_inst/portfolios/traditional/disbursements/:id` | Récupérer un décaissement par son ID |
| POST | `/portfolio_inst/portfolios/traditional/disbursements` | Créer un nouveau décaissement |

**Paramètres de requête pour GET /portfolio_inst/portfolios/traditional/disbursements**:
- `contractId`: Filtrer par ID de contrat
- `status`: Filtrer par statut du décaissement
- `dateFrom`: Date de début au format YYYY-MM-DD
- `dateTo`: Date de fin au format YYYY-MM-DD

### 6. Remboursements (Repayments)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolio_inst/portfolios/traditional/repayments` | Récupérer tous les remboursements |
| GET | `/portfolio_inst/portfolios/traditional/repayments/:id` | Récupérer un remboursement par son ID |
| POST | `/portfolio_inst/portfolios/traditional/repayments` | Enregistrer un nouveau remboursement |

**Paramètres de requête pour GET /portfolio_inst/portfolios/traditional/repayments**:
- `contractId`: Filtrer par ID de contrat
- `status`: Filtrer par statut du remboursement
- `dateFrom`: Date de début au format YYYY-MM-DD
- `dateTo`: Date de fin au format YYYY-MM-DD

### 7. Échéanciers de paiement (Payment Schedules)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/payment-schedules` | Récupérer tous les échéanciers de paiement |
| GET | `/portfolios/traditional/payment-schedules/:id` | Récupérer un échéancier de paiement par son ID |
| GET | `/portfolios/traditional/payment-schedules/by-contract/:contractId` | Récupérer l'échéancier de paiement d'un contrat |

### 8. Documents

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/documents` | Récupérer tous les documents |
| GET | `/portfolios/traditional/documents/:id` | Récupérer un document par son ID |
| POST | `/portfolios/traditional/documents` | Télécharger un nouveau document |
| DELETE | `/portfolios/traditional/documents/:id` | Supprimer un document |

### 9. Virements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/virements` | Récupérer tous les virements |
| GET | `/virements/:id` | Récupérer un virement par son ID |
| POST | `/virements` | Créer un nouveau virement |

### 10. Prospection

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/prospection/prospects` | Récupérer tous les prospects |
| GET | `/prospection/prospects/:id` | Récupérer un prospect par son ID |
| POST | `/prospection/prospects` | Créer un nouveau prospect |
| PUT | `/prospection/prospects/:id` | Mettre à jour un prospect |
| DELETE | `/prospection/prospects/:id` | Supprimer un prospect |
| GET | `/prospection/stats` | Récupérer les statistiques de prospection |
| POST | `/prospection/prospects/:id/analysis` | Analyser un prospect |

### 11. Paramètres (Settings)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/settings` | Récupérer tous les paramètres |
| PUT | `/settings/:key` | Mettre à jour un paramètre |
| GET | `/settings/webhooks` | Récupérer les configurations de webhooks |
| POST | `/settings/webhooks` | Créer une nouvelle configuration de webhook |
| GET | `/settings/api-keys` | Récupérer les clés API |
| POST | `/settings/api-keys` | Créer une nouvelle clé API |
| DELETE | `/settings/api-keys/:id` | Supprimer une clé API |
| GET | `/settings/system/status` | Vérifier l'état du système |

### 12. Utilisateurs (Users)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/users` | Récupérer tous les utilisateurs |
| GET | `/users/:id` | Récupérer un utilisateur par son ID |
| POST | `/users` | Créer un nouvel utilisateur |
| PUT | `/users/:id` | Mettre à jour un utilisateur |
| DELETE | `/users/:id` | Désactiver un utilisateur |
| GET | `/admin/users` | Administration des utilisateurs (admin uniquement) |
| POST | `/admin/users` | Créer un utilisateur avec des privilèges avancés (admin uniquement) |

## Exemples d'utilisation

### Récupérer tous les portefeuilles

```javascript
const fetchPortfolios = async () => {
  try {
    const response = await fetch('http://localhost:8000/portfolio/portfolios/traditional?page=1&limit=10&status=active', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des portefeuilles:', error);
    throw error;
  }
};
```

### Créer un nouveau produit financier

```javascript
const createFinancialProduct = async (productData) => {
  try {
    const response = await fetch('http://localhost:8000/portfolio/financial-products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.product;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la création du produit financier:', error);
    throw error;
  }
};
```

### Enregistrer un remboursement

```javascript
const recordRepayment = async (repaymentData) => {
  try {
    const response = await fetch('http://localhost:8000/portfolio/portfolio_inst/portfolios/traditional/repayments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(repaymentData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du remboursement:', error);
    throw error;
  }
};
```
