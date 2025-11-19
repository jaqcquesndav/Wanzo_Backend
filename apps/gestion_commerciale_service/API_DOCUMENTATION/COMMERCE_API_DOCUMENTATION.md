# Documentation de l'API du microservice Gestion Commerciale

Cette documentation décrit la structure des URLs et les endpoints disponibles pour communiquer avec le microservice de Gestion Commerciale via l'API Gateway.

## Informations générales

- **Base URL**: `http://localhost:8000/commerce`
- **Port API Gateway**: 8000
- **Port Microservice Gestion Commerciale**: 3006 (interne)

## Authentification

Toutes les requêtes nécessitent une authentification via un token JWT.

**Headers requis**:
```
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

## Structure des URLs

Tous les endpoints du microservice sont accessibles via l'API Gateway à l'adresse suivante:
`http://localhost:8000/commerce/<endpoint>`

## Format des réponses

Les réponses suivent un format standardisé:

**Succès**:
```json
{
  "success": true,
  "message": "Description du succès",
  "statusCode": 200,
  "data": {
    // Les données spécifiques retournées
  }
}
```

**Erreur**:
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "statusCode": 400,
  "error": "Type d'erreur"
}
```

## Endpoints disponibles

### 1. Produits (Inventory)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/products` | Récupérer tous les produits avec pagination |
| GET | `/products/:id` | Récupérer un produit par son ID |
| POST | `/products` | Créer un nouveau produit |
| PATCH | `/products/:id` | Mettre à jour un produit |
| DELETE | `/products/:id` | Supprimer un produit |

**Paramètres de requête pour GET /products**:
- `page`: Numéro de page pour la pagination
- `limit`: Nombre d'éléments par page
- `search`: Terme de recherche pour filtrer les produits
- `category`: Filtrer par catégorie de produit
- `inStock`: Filtrer par disponibilité en stock (true/false)

### 2. Ventes (Sales)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/sales` | Récupérer toutes les ventes avec filtrage |
| GET | `/sales/:id` | Récupérer une vente par son ID |
| POST | `/sales` | Créer une nouvelle vente |
| PATCH | `/sales/:id` | Mettre à jour une vente |
| PUT | `/sales/:id/complete` | Marquer une vente comme complétée |
| PUT | `/sales/:id/cancel` | Annuler une vente |
| GET | `/sales/:id/invoice` | Générer une facture pour une vente |

**Paramètres de requête pour GET /sales**:
- `page`: Numéro de page pour la pagination
- `limit`: Nombre d'éléments par page
- `dateFrom`: Date de début au format ISO8601 (YYYY-MM-DD)
- `dateTo`: Date de fin au format ISO8601 (YYYY-MM-DD)
- `status`: Filtrer par statut ('pending', 'completed', 'cancelled')
- `customerId`: Filtrer par client

### 3. Clients (Customers)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/customers` | Récupérer tous les clients avec pagination |
| GET | `/customers/:id` | Récupérer un client par son ID |
| POST | `/customers` | Créer un nouveau client |
| PATCH | `/customers/:id` | Mettre à jour un client |
| DELETE | `/customers/:id` | Supprimer un client |
| GET | `/customers/:id/sales` | Récupérer les ventes d'un client |
| GET | `/customers/:id/payments` | Récupérer les paiements d'un client |

**Paramètres de requête pour GET /customers**:
- `page`: Numéro de page pour la pagination
- `limit`: Nombre d'éléments par page
- `search`: Terme de recherche pour filtrer les clients
- `sortBy`: Champ de tri
- `sortOrder`: Ordre de tri ('asc', 'desc')

### 4. Fournisseurs (Suppliers)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/suppliers` | Récupérer tous les fournisseurs |
| GET | `/suppliers/:id` | Récupérer un fournisseur par son ID |
| POST | `/suppliers` | Créer un nouveau fournisseur |
| PATCH | `/suppliers/:id` | Mettre à jour un fournisseur |
| DELETE | `/suppliers/:id` | Supprimer un fournisseur |
| GET | `/suppliers/:id/purchases` | Récupérer les achats auprès d'un fournisseur |

**Paramètres de requête pour GET /suppliers**:
- `page`: Numéro de page pour la pagination
- `limit`: Nombre d'éléments par page

### 5. Dépenses (Expenses)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/expenses` | Récupérer toutes les dépenses avec filtrage |
| GET | `/expenses/:id` | Récupérer une dépense par son ID |
| POST | `/expenses` | Créer une nouvelle dépense |
| PATCH | `/expenses/:id` | Mettre à jour une dépense |
| DELETE | `/expenses/:id` | Supprimer une dépense |
| GET | `/expenses/categories` | Récupérer toutes les catégories de dépenses |
| POST | `/expenses/categories` | Créer une nouvelle catégorie de dépense |
| PATCH | `/expenses/categories/:id` | Mettre à jour une catégorie de dépense |
| DELETE | `/expenses/categories/:id` | Supprimer une catégorie de dépense |

**Paramètres de requête pour GET /expenses**:
- `page`: Numéro de page pour la pagination
- `limit`: Nombre d'éléments par page
- `dateFrom`: Date de début au format ISO8601 (YYYY-MM-DD)
- `dateTo`: Date de fin au format ISO8601 (YYYY-MM-DD)
- `categoryId`: Filtrer par catégorie de dépense
- `minAmount`: Montant minimum
- `maxAmount`: Montant maximum

### 6. Opérations Commerciales (Business Operations)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/operations` | Récupérer toutes les opérations commerciales |
| GET | `/operations/:id` | Récupérer une opération par son ID |
| POST | `/operations` | Créer une nouvelle opération |
| PATCH | `/operations/:id` | Mettre à jour une opération |
| DELETE | `/operations/:id` | Supprimer une opération |
| GET | `/operations/export` | Exporter les opérations (CSV, Excel) |

**Paramètres de requête pour GET /operations**:
- `page`: Numéro de page pour la pagination
- `limit`: Nombre d'éléments par page
- `dateFrom`: Date de début
- `dateTo`: Date de fin
- `type`: Type d'opération
- `status`: Statut de l'opération

### 7. Gestion des Documents

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/documents` | Récupérer tous les documents avec filtrage |
| GET | `/documents/:id` | Récupérer un document par son ID |
| GET | `/documents/:id/download` | Télécharger un document |
| POST | `/documents` | Télécharger un nouveau document |
| PATCH | `/documents/:id` | Mettre à jour les métadonnées d'un document |
| DELETE | `/documents/:id` | Supprimer un document |

**Paramètres de requête pour GET /documents**:
- `page`: Numéro de page pour la pagination
- `limit`: Nombre d'éléments par page
- `documentType`: Type de document
- `relatedToEntityType`: Type d'entité associée (ex: 'customer', 'sale')
- `relatedToEntityId`: ID de l'entité associée
- `search`: Recherche textuelle sur nom et description

### 8. Tableau de Bord (Dashboard)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/dashboard/data` | Récupérer les données complètes du tableau de bord |
| GET | `/dashboard/sales-today` | Récupérer les ventes du jour |
| GET | `/dashboard/sales-summary` | Récupérer le résumé des ventes |
| GET | `/dashboard/customer-stats` | Récupérer les statistiques des clients |
| GET | `/dashboard/operations-journal` | Récupérer le journal des opérations |
| GET | `/dashboard/inventory-alerts` | Récupérer les alertes d'inventaire |
| GET | `/dashboard/export-journal` | Exporter le journal des opérations |

**Paramètres de requête pour GET /dashboard/data**:
- `period`: Période ('day', 'week', 'month', 'quarter', 'year')
- `startDate`: Date de début au format ISO8601
- `endDate`: Date de fin au format ISO8601

### 9. Transactions Financières

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/financial-transactions` | Récupérer toutes les transactions financières |
| GET | `/financial-transactions/:id` | Récupérer une transaction par son ID |
| POST | `/financial-transactions` | Créer une nouvelle transaction |
| PATCH | `/financial-transactions/:id` | Mettre à jour une transaction |
| DELETE | `/financial-transactions/:id` | Supprimer une transaction |
| GET | `/financial-transactions/categories` | Récupérer les catégories de transactions |
| POST | `/financial-transactions/categories` | Créer une nouvelle catégorie |

**Paramètres de requête pour GET /financial-transactions**:
- `page`: Numéro de page pour la pagination
- `limit`: Nombre d'éléments par page
- `dateFrom`: Date de début
- `dateTo`: Date de fin
- `type`: Type de transaction ('income', 'expense', 'transfer')
- `status`: Statut de la transaction ('pending', 'completed', 'failed')
- `minAmount`: Montant minimum
- `maxAmount`: Montant maximum

### 10. Utilisateurs et Authentification

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/auth/login` | Connexion utilisateur |
| POST | `/auth/refresh` | Rafraîchir le token JWT |
| GET | `/auth/me` | Récupérer les informations de l'utilisateur connecté |
| PATCH | `/auth/me` | Mettre à jour les informations de l'utilisateur connecté |
| POST | `/auth/password-reset` | Demander une réinitialisation de mot de passe |
| POST | `/auth/password-reset/confirm` | Confirmer la réinitialisation de mot de passe |

### 11. Paramètres (Settings)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/settings` | Récupérer tous les paramètres |
| PATCH | `/settings` | Mettre à jour les paramètres |
| GET | `/settings/user-profile` | Récupérer les paramètres du profil utilisateur |
| PATCH | `/settings/user-profile` | Mettre à jour les paramètres du profil utilisateur |
| GET | `/settings/business` | Récupérer les paramètres de l'entreprise |
| PATCH | `/settings/business` | Mettre à jour les paramètres de l'entreprise |

### 12. Notifications

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/notifications` | Récupérer toutes les notifications |
| GET | `/notifications/unread` | Récupérer les notifications non lues |
| PATCH | `/notifications/:id/read` | Marquer une notification comme lue |
| PATCH | `/notifications/read-all` | Marquer toutes les notifications comme lues |
| DELETE | `/notifications/:id` | Supprimer une notification |

## Exemples d'utilisation

### Récupérer la liste des produits

```javascript
const fetchProducts = async () => {
  try {
    const response = await fetch('http://localhost:8000/commerce/products?page=1&limit=10&search=téléphone', {
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
    console.error('Erreur lors de la récupération des produits:', error);
    throw error;
  }
};
```

### Créer une nouvelle vente

```javascript
const createSale = async (saleData) => {
  try {
    const response = await fetch('http://localhost:8000/commerce/sales', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(saleData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la création de la vente:', error);
    throw error;
  }
};
```

### Récupérer les données du tableau de bord

```javascript
const getDashboardData = async (period = 'month') => {
  try {
    const response = await fetch(`http://localhost:8000/commerce/dashboard/data?period=${period}`, {
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
    console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    throw error;
  }
};
```
