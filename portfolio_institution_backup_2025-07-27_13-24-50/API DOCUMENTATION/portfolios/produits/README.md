# Produits Financiers - Documentation Technique

Ce document détaille le système de produits financiers utilisé dans le module de portefeuille traditionnel.

## 1. Aperçu du Système de Produits Financiers

Le module de produits financiers permet aux institutions de définir, configurer et gérer l'ensemble des produits financiers proposés dans leurs portefeuilles traditionnels. Ces produits constituent la base des services offerts aux clients et déterminent les paramètres des contrats financiers.

## 2. Structure des Données

### 2.1 Produit Financier

La structure principale est l'interface `FinancialProduct` :

```typescript
interface FinancialProduct {
  id: string;
  name: string;
  type: 'credit' | 'savings' | 'investment';
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
  acceptedGuarantees?: string[]; // Types de garanties acceptées pour ce produit
  isPublic: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
```

### 2.2 Types de Produits

Le système prend en charge trois types principaux de produits :

1. **Crédit** - Prêts et avances de fonds
   - Crédits commerciaux
   - Crédits d'investissement
   - Lignes de crédit
   - Microcrédits
   - etc.

2. **Épargne** - Produits de dépôt et d'épargne
   - Comptes d'épargne
   - Dépôts à terme
   - Plans d'épargne programmée
   - etc.

3. **Investissement** - Produits d'investissement
   - Fonds communs de placement
   - Obligations
   - Actions
   - etc.

### 2.3 Configuration des Taux d'Intérêt

Les taux d'intérêt peuvent être configurés de deux manières :

1. **Taux fixe** - Un taux unique défini pour toute la durée du produit
   ```json
   "interestRate": {
     "type": "fixed",
     "value": 12.5
   }
   ```

2. **Taux variable** - Une plage de taux avec minimum et maximum
   ```json
   "interestRate": {
     "type": "variable",
     "min": 8.0,
     "max": 15.0
   }
   ```

## 3. Gestion des Produits

### 3.1 Création d'un Produit

La création d'un produit implique la définition de ses paramètres de base :
- Nom et description
- Type de produit
- Limites de montant
- Durée minimale et maximale
- Configuration du taux d'intérêt
- Exigences et garanties acceptées

### 3.2 Activation/Désactivation

Les produits peuvent être activés ou désactivés :
- Les produits actifs sont disponibles pour les nouvelles demandes
- Les produits inactifs ne sont plus proposés, mais les contrats existants restent valides

### 3.3 Visibilité

La visibilité des produits peut être configurée :
- Produits publics : visibles par tous les clients
- Produits non-publics : réservés à certains clients ou utilisés uniquement en interne

## 4. API Services

Le module expose plusieurs services API pour gérer les produits financiers :

```typescript
// API pour les produits financiers
export const financialProductApi = {
  getAllProducts: async (filters?: {
    type?: 'credit' | 'savings' | 'investment';
    status?: 'active' | 'inactive';
    isPublic?: boolean;
  }) => { /* ... */ },
  
  getProductById: async (productId: string) => { /* ... */ },
  
  createProduct: async (data: Omit<FinancialProduct, 'id' | 'created_at' | 'updated_at'>) => { /* ... */ },
  
  updateProduct: async (productId: string, data: Partial<FinancialProduct>) => { /* ... */ },
  
  activateProduct: async (productId: string) => { /* ... */ },
  
  deactivateProduct: async (productId: string) => { /* ... */ }
};
```

## 5. Interfaces API REST

### 5.1 Liste des Produits

**Endpoint** : `GET /api/portfolio/traditional/products`

**Paramètres de requête** :
- `type` (optionnel) : Filtre par type de produit
- `status` (optionnel) : Filtre par statut
- `isPublic` (optionnel) : Filtre par visibilité
- etc.

### 5.2 Création d'un Produit

**Endpoint** : `POST /api/portfolio/traditional/products`

**Corps de la requête** :
```json
{
  "name": "Crédit Investissement PME",
  "type": "credit",
  "description": "Crédit d'investissement pour petites et moyennes entreprises",
  "minAmount": 10000,
  "maxAmount": 500000,
  "duration": {
    "min": 6,
    "max": 60
  },
  "interestRate": {
    "type": "fixed",
    "value": 12.5
  },
  "requirements": [
    "Plan d'affaires",
    "États financiers des 2 dernières années",
    "Projections financières"
  ],
  "acceptedGuarantees": [
    "real_estate",
    "equipment",
    "cash_collateral"
  ],
  "isPublic": true,
  "status": "active"
}
```

### 5.3 Autres Endpoints

- `GET /api/portfolio/traditional/products/{productId}`
- `PUT /api/portfolio/traditional/products/{productId}`
- `PATCH /api/portfolio/traditional/products/{productId}/status`

## 6. Composants UI

L'interface utilisateur comprend plusieurs composants clés :

- `ProductList` - Liste des produits avec filtrage
- `ProductForm` - Formulaire de création/modification de produit
- `ProductDetails` - Affichage détaillé d'un produit
- `InterestRateConfig` - Configuration des taux d'intérêt
- `RequirementsEditor` - Éditeur des exigences du produit

## 7. Intégration avec les Demandes de Financement

Les produits financiers sont étroitement liés aux demandes de financement :

1. Un client sélectionne un produit lors de la création d'une demande
2. Les paramètres du produit déterminent les limites et conditions de la demande
3. Les exigences du produit déterminent les documents à fournir
4. Les garanties acceptées limitent les types de garanties proposables

## 8. Calculs Financiers

Le module intègre plusieurs fonctions de calcul financier :

- Calcul des échéanciers de remboursement
- Calcul des intérêts (fixes ou variables)
- Calcul des frais associés
- Simulation de scénarios financiers

Ces calculs sont utilisés pour :
- Générer des simulations pour les clients
- Créer des tableaux d'amortissement
- Calculer les montants des échéances

## 9. Personnalisation et Flexibilité

Le système est conçu pour être hautement configurable :

- Création de produits personnalisés pour des marchés spécifiques
- Ajustement des paramètres selon l'évolution du marché
- Gestion des versions de produits
- Produits saisonniers ou promotionnels

## 10. Rapports et Analyse

Le module fournit des rapports sur les produits :

- Performance des produits
- Taux d'approbation par produit
- Taux de défaut par produit
- Rentabilité par produit

Ces informations aident à optimiser l'offre de produits et à ajuster les paramètres pour mieux répondre aux besoins du marché.

## 11. Considérations Réglementaires

Le système permet de configurer les produits conformément aux exigences réglementaires :

- Limites de taux d'intérêt
- Divulgation d'informations obligatoires
- Conformité avec les règles de protection des consommateurs
- Adaptation aux spécificités réglementaires locales
