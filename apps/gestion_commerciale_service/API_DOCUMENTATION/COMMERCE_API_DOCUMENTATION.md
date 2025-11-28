# Documentation de l'API du microservice Gestion Commerciale

Cette documentation décrit la structure des URLs et les endpoints disponibles pour communiquer avec le microservice de Gestion Commerciale via l'API Gateway.

## Informations générales

- **Base URL (via API Gateway)**: `http://192.168.1.66:8000/commerce/api/v1`
- **Port API Gateway**: 8000
- **Port Microservice Gestion Commerciale**: 3006 (accès direct interne uniquement)
- **Service Kafka Client ID**: `app-mobile-service-client`
- **Documentation Swagger**: `http://localhost:3006/api/docs` (accès direct)

## Architecture

Le service de gestion commerciale est conçu pour les applications mobiles et communique avec d'autres microservices via Kafka:
- **Kafka Topics produits**: `commerce.operation.created`, `commerce.financing.requested`
- **Kafka Topics consommés**: `accounting.journal.entry.status`, `portfolio.analysis.response`

## Authentification

Toutes les requêtes nécessitent une authentification via un token JWT.

**Headers requis**:
```http
Authorization: Bearer <token_jwt>
Content-Type: application/json
Accept: application/json
```

## Versioning et Routing

### Pattern d'accès via API Gateway
```
http://localhost:8000/commerce/api/v1/<endpoint>
          ↓
http://kiota-gestion-commerciale-service:3006/api/<endpoint>
```

Le préfixe `/commerce/api/v1` est transformé en `/api` par l'API Gateway, correspondant au `setGlobalPrefix('api')` du service.

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

Tous les endpoints sont préfixés par `/commerce/api/v1` via l'API Gateway.

### 1. Authentification (Auth)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Inscription nouvel utilisateur + création entreprise |
| POST | `/auth/login` | Connexion utilisateur |
| POST | `/auth/refresh` | Rafraîchir le token JWT |
| GET | `/auth/me` | Récupérer informations utilisateur connecté |
| PATCH | `/auth/me` | Mettre à jour profil utilisateur |
| POST | `/auth/logout` | Déconnexion utilisateur |

**Exemple POST /auth/register**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+243900000000",
  "companyName": "Ma Boutique SARL"
}
```

**Réponse**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "owner",
    "companyId": "uuid"
  }
}
```

### 2. Produits (Products)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/products` | Récupérer tous les produits avec pagination et filtres |
| GET | `/products/:id` | Récupérer un produit par son ID |
| POST | `/products` | Créer un nouveau produit |
| PATCH | `/products/:id` | Mettre à jour un produit |
| DELETE | `/products/:id` | Supprimer un produit |

**Query Parameters GET /products**:
- `page` (number): Numéro de page (défaut: 1)
- `limit` (number): Éléments par page (défaut: 20)
- `search` (string): Recherche par nom ou SKU
- `category` (string): Filtrer par catégorie
- `inStock` (boolean): Filtrer produits en stock
- `sortBy` (string): Champ de tri (name, price, stock)
- `sortOrder` (string): 'ASC' ou 'DESC'

**DTO CreateProductDto**:
```typescript
{
  name: string;              // Requis
  description?: string;
  sku: string;              // Requis, unique
  category: string;
  price: number;            // Requis, > 0
  costPrice?: number;
  stock: number;            // Défaut: 0
  minStockLevel?: number;
  unit: string;             // Ex: "pièce", "kg", "litre"
  imageUrl?: string;
  companyId: string;        // UUID de l'entreprise
}
```

### 3. Ventes (Sales)

**Status**: ✅ **Implémentation Complète** - Service API + Repository hybride offline-first

**Service**: `SalesApiService` (✅ 9 méthodes) | **Repository**: `SalesRepository` (✅ Intégration hybride)

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| GET | `/sales` | Récupérer toutes les ventes avec filtrage | ✅ |
| GET | `/sales/:id` | Récupérer une vente par son ID | ✅ |
| POST | `/sales` | Créer une nouvelle vente | ✅ |
| PATCH | `/sales/:id` | Mettre à jour une vente | ✅ |
| PUT | `/sales/:id/complete` | Marquer une vente comme complétée | ✅ |
| PUT | `/sales/:id/cancel` | Annuler une vente | ✅ |
| POST | `/sales/sync` | Synchroniser les ventes locales vers le backend | ✅ |
| GET | `/sales/stats` | Récupérer les statistiques de ventes | ✅ |
| DELETE | `/sales/:id` | Supprimer une vente | ✅ |

**Query Parameters GET /sales**:
- `page` (number): Numéro de page
- `limit` (number): Éléments par page
- `dateFrom` (string): Date début ISO8601 (YYYY-MM-DD)
- `dateTo` (string): Date fin ISO8601
- `status` (string): 'pending' | 'completed' | 'cancelled'
- `customerId` (uuid): ID du client
- `minAmount` (number): Montant minimum
- `maxAmount` (number): Montant maximum
- `sortBy` (string): Champ de tri
- `sortOrder` (string): 'ASC' | 'DESC'

**DTO CreateSaleDto**:
```typescript
{
  customerId: string;           // UUID requis
  saleDate: Date;              // Date de vente
  paymentMethod: string;       // "cash", "mobile_money", "bank_transfer", "credit"
  paymentStatus: string;       // "paid", "partial", "unpaid"
  items: SaleItemDto[];        // Requis, min 1 item
  notes?: string;
  discount?: number;           // Montant ou pourcentage
  tax?: number;
  companyId: string;
}

// SaleItemDto
{
  productId: string;           // UUID requis
  quantity: number;            // > 0
  unitPrice: number;           // > 0
  discount?: number;
}
```

**Intégration Kafka**: Après création, publie événement `commerce.operation.created` vers accounting-service pour génération écritures comptables.

### 4. Clients (Customers)

**Status**: ✅ **Implémentation Complète** - Service API + Repository hybride offline-first

**Service**: `CustomerApiService` (✅ 8 méthodes) | **Repository**: `CustomerRepository` (✅ Intégration hybride)

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| GET | `/customers` | Récupérer tous les clients avec pagination et recherche | ✅ |
| GET | `/customers/:id` | Récupérer un client par son ID | ✅ |
| POST | `/customers` | Créer un nouveau client | ✅ |
| PATCH | `/customers/:id` | Mettre à jour un client | ✅ |
| DELETE | `/customers/:id` | Supprimer un client (soft delete) | ✅ |
| GET | `/customers/:id/sales` | Récupérer historique ventes du client | ✅ |
| GET | `/customers/:id/payments` | Récupérer historique paiements | ✅ |
| POST | `/customers/sync` | Synchroniser les clients locaux vers le backend | ✅ |
| GET | `/customers/:id/stats` | Récupérer les statistiques détaillées du client | ✅ |

**Query Parameters GET /customers**:
- `page` (number): Numéro de page
- `limit` (number): Éléments par page
- `search` (string): Recherche nom, email, téléphone
- `sortBy` (string): Champ de tri (createdAt, fullName, totalPurchases)
- `sortOrder` (string): 'ASC' | 'DESC'

**DTO CreateCustomerDto**:
```typescript
{
  fullName: string;            // Requis
  email?: string;              // Optionnel, unique si fourni
  phone: string;               // Requis, format international recommandé
  address?: string;
  city?: string;
  notes?: string;
  companyId: string;           // UUID de l'entreprise
  customerType?: string;       // "individual", "business"
}
```

### 5. Fournisseurs (Suppliers)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/suppliers` | Récupérer tous les fournisseurs avec pagination |
| GET | `/suppliers/:id` | Récupérer un fournisseur par son ID |
| POST | `/suppliers` | Créer un nouveau fournisseur |
| PATCH | `/suppliers/:id` | Mettre à jour un fournisseur |
| DELETE | `/suppliers/:id` | Supprimer un fournisseur |
| GET | `/suppliers/:id/purchases` | Récupérer historique achats du fournisseur |

**Query Parameters GET /suppliers**:
- `page` (number): Numéro de page
- `limit` (number): Éléments par page
- `search` (string): Recherche par nom ou contact

**DTO CreateSupplierDto**:
```typescript
{
  name: string;                // Nom du fournisseur, requis
  contactPerson?: string;      // Personne de contact
  email?: string;
  phone: string;               // Requis
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  companyId: string;           // UUID entreprise
  paymentTerms?: string;       // Ex: "Net 30", "Net 60"
  taxId?: string;              // Numéro fiscal
}
```

### 6. Dépenses (Expenses)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/expenses` | Récupérer toutes les dépenses avec filtres |
| GET | `/expenses/:id` | Récupérer une dépense par son ID |
| POST | `/expenses` | Créer une nouvelle dépense |
| PATCH | `/expenses/:id` | Mettre à jour une dépense |
| DELETE | `/expenses/:id` | Supprimer une dépense |
| POST | `/expenses/:id/upload-receipt` | Upload justificatif (image/PDF) |
| GET | `/expenses/categories` | Liste catégories de dépenses |
| POST | `/expenses/categories` | Créer catégorie personnalisée |
| PATCH | `/expenses/categories/:id` | Modifier catégorie |
| DELETE | `/expenses/categories/:id` | Supprimer catégorie |

**Query Parameters GET /expenses**:
- `page` (number): Numéro de page
- `limit` (number): Éléments par page
- `dateFrom` (string): Date début ISO8601 (YYYY-MM-DD)
- `dateTo` (string): Date fin ISO8601
- `categoryId` (uuid): Filtrer par catégorie
- `minAmount` (number): Montant minimum
- `maxAmount` (number): Montant maximum
- `type` (string): 'fixed' | 'variable' | 'one-time'

**DTO CreateExpenseDto**:
```typescript
{
  title: string;               // Requis
  description?: string;
  amount: number;              // > 0, requis
  expenseDate: Date;           // Requis
  categoryId: string;          // UUID catégorie, requis
  paymentMethod: string;       // "cash", "mobile_money", "bank_transfer", "check"
  supplierId?: string;         // UUID si dépense liée à fournisseur
  receiptUrl?: string;         // URL du justificatif
  notes?: string;
  companyId: string;
  type: ExpenseCategoryType;   // "fixed", "variable", "one-time"
}
```

**Catégories prédéfinies**: Loyer, Salaires, Électricité, Eau, Internet, Transport, Marketing, Fournitures, Assurance, Taxes, Maintenance, Autres.

### 7. Opérations Commerciales (Business Operations)

**Status**: ✅ **Implémentation Complète** - Service API + Services d'Export

**Service**: `OperationsApiService` (✅ 5 méthodes) | **Export**: `OperationExportService` (✅ PDF/Excel)

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| GET | `/operations` | Récupérer journal des opérations avec filtres avancés (11 paramètres) | ✅ |
| GET | `/operations/:id` | Récupérer détails d'une opération | ✅ |
| GET | `/operations/summary` | Résumé des opérations par période (day/week/month/year) | ✅ |
| POST | `/operations/export` | Exporter opérations (PDF/Excel avec options avancées) | ✅ |
| GET | `/operations/timeline` | Timeline des opérations récentes | ✅ |

**Services Locaux Complémentaires**:
- `OperationFilter` - Modèle de filtrage avec 8 critères + factory methods (today, thisWeek, thisMonth)
- `OperationExportService` - Export PDF multi-pages, CSV, calcul statistiques

**Query Parameters GET /operations**:
- `page` (number): Numéro de page
- `limit` (number): Éléments par page
- `dateFrom` (string): Date début
- `dateTo` (string): Date fin
- `type` (string): 'sale' | 'purchase' | 'expense' | 'income' | 'adjustment'
- `status` (string): 'completed' | 'pending' | 'cancelled'
- `amountMin` (number): Montant minimum
- `amountMax` (number): Montant maximum

**DTO CreateBusinessOperationDto**:
```typescript
{
  type: string;                // 'sale' | 'purchase' | 'expense' | 'income' | 'adjustment'
  description: string;         // Requis
  amount: number;              // Requis, > 0
  operationDate: Date;         // Requis
  relatedEntityId?: string;    // ID vente/achat/dépense liée
  relatedEntityType?: string;  // 'sale' | 'purchase' | 'expense'
  notes?: string;
  companyId: string;
  userId: string;              // Utilisateur créateur
}
```

### 8. Gestion des Documents

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/documents` | Récupérer documents avec filtres et pagination |
| GET | `/documents/:id` | Récupérer métadonnées d'un document |
| GET | `/documents/:id/download` | Télécharger fichier document |
| POST | `/documents/upload` | Upload nouveau document (multipart/form-data) |
| PATCH | `/documents/:id` | Modifier métadonnées document |
| DELETE | `/documents/:id` | Supprimer document (fichier + DB) |

**Query Parameters GET /documents**:
- `page` (number): Numéro de page
- `limit` (number): Éléments par page
- `documentType` (string): 'invoice' | 'receipt' | 'contract' | 'report' | 'other'
- `relatedToEntityType` (string): 'customer' | 'sale' | 'supplier' | 'expense'
- `relatedToEntityId` (uuid): ID de l'entité liée
- `search` (string): Recherche nom/description
- `dateFrom` (string): Date upload début
- `dateTo` (string): Date upload fin

**Upload POST /documents/upload** (multipart/form-data):
```typescript
{
  file: File;                  // Requis, max 10MB
  documentType: string;        // Requis
  relatedToEntityType?: string;
  relatedToEntityId?: string;
  name?: string;               // Auto-généré si absent
  description?: string;
  companyId: string;
}
```

**Stockage**: Cloudinary pour fichiers, métadonnées en PostgreSQL.

### 9. Tableau de Bord (Dashboard)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/dashboard/data` | Données complètes tableau de bord (KPIs globaux) |
| GET | `/dashboard/sales-today` | Ventes du jour en temps réel |
| GET | `/dashboard/sales-summary` | Résumé ventes par période |
| GET | `/dashboard/customer-stats` | Statistiques clients (nouveaux, actifs, top) |
| GET | `/dashboard/operations-journal` | Journal opérations récentes |
| GET | `/dashboard/inventory-alerts` | Alertes stock bas/rupture |
| GET | `/dashboard/receivables` | Total créances à recevoir |
| GET | `/dashboard/clients-served-today` | Nombre clients servis aujourd'hui |
| GET | `/dashboard/export-journal` | Export journal (CSV/Excel) |

**Query Parameters GET /dashboard/data**:
- `period` (string): 'day' | 'week' | 'month' | 'quarter' | 'year'
- `startDate` (string): Date début ISO8601 (optionnel si period fourni)
- `endDate` (string): Date fin ISO8601

**Réponse GET /dashboard/data**:
```typescript
{
  success: true,
  data: {
    salesToday: {
      totalAmount: number,
      count: number,
      sales: Sale[]
    },
    salesSummary: {
      totalRevenue: number,
      totalSales: number,
      averageSaleValue: number,
      growthRate: number
    },
    customerStats: {
      totalCustomers: number,
      newCustomers: number,
      activeCustomers: number,
      topCustomers: Customer[]
    },
    inventoryAlerts: {
      lowStock: Product[],
      outOfStock: Product[]
    },
    operationsJournal: Operation[]
  }
}
```

### 10. Transactions Financières

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/financial-transactions` | Liste transactions avec filtres avancés |
| GET | `/financial-transactions/:id` | Détails transaction |
| POST | `/financial-transactions` | Créer transaction manuelle |
| PATCH | `/financial-transactions/:id` | Modifier transaction |
| DELETE | `/financial-transactions/:id` | Supprimer transaction |
| GET | `/transaction-categories` | Liste catégories transactions |
| POST | `/transaction-categories` | Créer catégorie personnalisée |
| PATCH | `/transaction-categories/:id` | Modifier catégorie |
| DELETE | `/transaction-categories/:id` | Supprimer catégorie |

**Query Parameters GET /financial-transactions**:
- `page` (number): Numéro de page
- `limit` (number): Éléments par page
- `dateFrom` (string): Date début
- `dateTo` (string): Date fin
- `type` (string): 'income' | 'expense' | 'transfer'
- `status` (string): 'pending' | 'completed' | 'failed' | 'cancelled'
- `minAmount` (number): Montant minimum
- `maxAmount` (number): Montant maximum
- `categoryId` (uuid): Filtrer par catégorie
- `accountId` (uuid): Filtrer par compte

**DTO CreateFinancialTransactionDto**:
```typescript
{
  type: TransactionType;       // 'income' | 'expense' | 'transfer'
  amount: number;              // > 0, requis
  description: string;         // Requis
  transactionDate: Date;       // Requis
  categoryId: string;          // UUID catégorie
  accountId?: string;          // UUID compte bancaire
  paymentMethod: string;       // "cash", "mobile_money", "bank_transfer", "check"
  status: TransactionStatus;   // 'pending' | 'completed' | 'failed'
  reference?: string;          // Référence externe
  notes?: string;
  companyId: string;
}
```

### 11. Financement (Financing)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/financing/requests` | Liste demandes financement avec filtres |
| GET | `/financing/requests/:id` | Détails demande financement |
| POST | `/financing/requests` | Créer demande financement |
| PATCH | `/financing/requests/:id` | Modifier demande |
| PUT | `/financing/requests/:id/submit` | Soumettre demande pour analyse |
| PUT | `/financing/requests/:id/approve` | Approuver demande (admin) |
| PUT | `/financing/requests/:id/reject` | Rejeter demande (admin) |
| GET | `/financing/credit-score` | Obtenir score crédit entreprise |

**DTO CreateFinancingRecordDto**:
```typescript
{
  type: FinancingType;         // 'loan' | 'credit_line' | 'invoice_financing'
  amount: number;              // Montant demandé, > 0
  purpose: string;             // Raison du financement
  description?: string;
  duration?: number;           // Durée en mois
  companyId: string;
  status: FinancingRequestStatus; // 'draft' | 'pending' | 'approved' | 'rejected'
}
```

**Intégration Kafka**: Publie `commerce.financing.requested` vers portfolio-institution-service pour analyse crédit via Adha AI.

### 12. Entreprise (Company)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/companies` | Liste entreprises (admin uniquement) |
| GET | `/companies/:id` | Détails entreprise |
| PATCH | `/companies/:id` | Modifier info entreprise |
| GET | `/companies/:id/payment-info` | Info paiement/abonnement |
| POST | `/companies/:id/payment-info` | Créer info paiement |
| PATCH | `/companies/:id/payment-info/:paymentId` | Modifier info paiement |

### 13. Utilisateurs (Users)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/users` | Liste utilisateurs de l'entreprise |
| GET | `/users/:id` | Détails utilisateur |
| POST | `/users` | Créer utilisateur (owner/admin) |
| PATCH | `/users/:id` | Modifier utilisateur |
| DELETE | `/users/:id` | Désactiver utilisateur |
| GET | `/user-activities` | Historique activités utilisateurs |

### 14. Paramètres (Settings)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/settings` | Récupérer paramètres généraux |
| PATCH | `/settings` | Mettre à jour paramètres |
| GET | `/settings-user-profile` | Paramètres profil utilisateur |
| PATCH | `/settings-user-profile` | Modifier profil utilisateur |
| PATCH | `/settings-user-profile/notification-settings` | Modifier préférences notifications |
| PATCH | `/settings-user-profile/app-settings` | Modifier paramètres app (langue, devise, etc.) |

### 15. Notifications

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/notifications` | Liste notifications avec pagination |
| GET | `/notifications/unread` | Notifications non lues uniquement |
| GET | `/notifications/:id` | Détails notification |
| PATCH | `/notifications/:id/read` | Marquer comme lue |
| PATCH | `/notifications/read-all` | Marquer toutes comme lues |
| DELETE | `/notifications/:id` | Supprimer notification |

**Query Parameters GET /notifications**:
- `page` (number): Numéro de page
- `limit` (number): Éléments par page
- `type` (string): 'info' | 'warning' | 'error' | 'success'
- `read` (boolean): Filtrer lues/non lues

## Format des Réponses

### Réponse Success
```json
{
  "success": true,
  "message": "Description du succès",
  "statusCode": 200,
  "data": {
    // Données spécifiques
  }
}
```

### Réponse Error
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "statusCode": 400,
  "error": "Type d'erreur"
}
```

## Exemples d'utilisation

### 1. Inscription et Login (React Native / Expo)

```typescript
// Inscription
const register = async (userData: RegisterDto) => {
  try {
    const response = await fetch('http://localhost:8000/commerce/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (result.accessToken) {
      // Stocker tokens
      await AsyncStorage.setItem('accessToken', result.accessToken);
      await AsyncStorage.setItem('refreshToken', result.refreshToken);
      return result;
    } else {
      throw new Error(result.message || 'Inscription échouée');
    }
  } catch (error) {
    console.error('Erreur inscription:', error);
    throw error;
  }
};

// Login
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:8000/commerce/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const result = await response.json();
  if (result.accessToken) {
    await AsyncStorage.setItem('accessToken', result.accessToken);
    await AsyncStorage.setItem('refreshToken', result.refreshToken);
  }
  return result;
};
```

### 2. Récupérer produits avec pagination

```typescript
const fetchProducts = async (page = 1, limit = 20, search = '') => {
  const token = await AsyncStorage.getItem('accessToken');
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search })
  });
  
  const response = await fetch(
    `http://localhost:8000/commerce/api/v1/products?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const result = await response.json();
  return result.success ? result.data : [];
};
```

### 3. Créer une vente

```typescript
const createSale = async (saleData: CreateSaleDto) => {
  const token = await AsyncStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:8000/commerce/api/v1/sales', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(saleData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Vente créée:', result.data);
    return result.data;
  } else {
    throw new Error(result.message);
  }
};

// Exemple de données
const saleData = {
  customerId: 'customer-uuid',
  saleDate: new Date().toISOString(),
  paymentMethod: 'cash',
  paymentStatus: 'paid',
  items: [
    {
      productId: 'product-uuid-1',
      quantity: 2,
      unitPrice: 5000
    },
    {
      productId: 'product-uuid-2',
      quantity: 1,
      unitPrice: 15000
    }
  ],
  companyId: 'company-uuid'
};

await createSale(saleData);
```

### 4. Dashboard pour mobile

```typescript
const getDashboardData = async (period: 'day' | 'week' | 'month' = 'month') => {
  const token = await AsyncStorage.getItem('accessToken');
  
  const response = await fetch(
    `http://localhost:8000/commerce/api/v1/dashboard/data?period=${period}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const result = await response.json();
  
  if (result.success) {
    const { salesToday, salesSummary, customerStats, inventoryAlerts } = result.data;
    return {
      todaySales: salesToday.totalAmount,
      todayCount: salesToday.count,
      totalRevenue: salesSummary.totalRevenue,
      lowStockProducts: inventoryAlerts.lowStock.length,
      outOfStockProducts: inventoryAlerts.outOfStock.length
    };
  }
  
  return null;
};
```

### 5. Upload document/photo

```typescript
const uploadExpenseReceipt = async (expenseId: string, imageUri: string) => {
  const token = await AsyncStorage.getItem('accessToken');
  
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: `receipt-${Date.now()}.jpg`
  } as any);
  formData.append('documentType', 'receipt');
  formData.append('relatedToEntityType', 'expense');
  formData.append('relatedToEntityId', expenseId);
  
  const response = await fetch(
    'http://localhost:8000/commerce/api/v1/documents/upload',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    }
  );
  
  return await response.json();
};
```

## Codes d'erreur courants

| Code | Description |
|------|-------------|
| 400 | Requête invalide (validation DTO échouée) |
| 401 | Non authentifié (token manquant/invalide) |
| 403 | Non autorisé (permissions insuffisantes) |
| 404 | Ressource non trouvée |
| 409 | Conflit (ex: email déjà utilisé) |
| 422 | Entité non traitable (validation métier échouée) |
| 500 | Erreur serveur interne |
| 503 | Service temporairement indisponible |
