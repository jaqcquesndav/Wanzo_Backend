# API Inventaire (Produits et Stock)

Cette documentation détaille les endpoints disponibles pour la gestion de l'inventaire, des produits et des transactions de stock dans l'application Wanzo.

## Catégories de Produits

Les catégories de produits sont représentées par des chaînes de caractères dans les requêtes et réponses API:

- `food` - Alimentation
- `drink` - Boissons
- `electronics` - Électronique
- `clothing` - Vêtements
- `household` - Articles ménagers
- `hygiene` - Hygiène et beauté
- `office` - Fournitures de bureau
- `cosmetics` - Produits cosmétiques
- `pharmaceuticals` - Produits pharmaceutiques
- `bakery` - Boulangerie
- `dairy` - Produits laitiers
- `meat` - Viande
- `vegetables` - Légumes
- `fruits` - Fruits
- `other` - Autres

## Unités de Mesure

Les unités de mesure sont représentées par des chaînes de caractères:

- `piece` - Pièce
- `kg` - Kilogramme
- `g` - Gramme
- `l` - Litre
- `ml` - Millilitre
- `package` - Paquet
- `box` - Boîte
- `other` - Autre

## Types de Transactions de Stock

Les types de transactions de stock sont représentés par des chaînes de caractères:

- `purchase` - Entrée de stock suite à un achat
- `sale` - Sortie de stock suite à une vente
- `adjustment` - Ajustement manuel (positif ou négatif)
- `transferIn` - Entrée de stock suite à un transfert interne
- `transferOut` - Sortie de stock suite à un transfert interne
- `returned` - Retour de marchandise par un client (entrée)
- `damaged` - Marchandise endommagée (sortie)
- `lost` - Marchandise perdue (sortie)
- `initialStock` - Stock initial lors de la création du produit

## Structure du modèle Produit

```json
{
  "id": "string",                  // Identifiant unique du produit
  "name": "string",                // Nom du produit
  "description": "string",         // Description du produit
  "barcode": "string",             // Code barres ou référence
  "category": "food",              // Catégorie du produit (voir liste ci-dessus)
  "costPriceInCdf": 5000.00,       // Prix d'achat en Francs Congolais
  "sellingPriceInCdf": 7500.00,    // Prix de vente en Francs Congolais
  "stockQuantity": 100.0,          // Quantité en stock
  "unit": "piece",                 // Unité de mesure (voir liste ci-dessus)
  "alertThreshold": 10.0,          // Niveau d'alerte de stock bas
  "createdAt": "2023-08-01T12:30:00.000Z", // Date d'ajout dans l'inventaire
  "updatedAt": "2023-08-01T12:30:00.000Z", // Date de dernière mise à jour
  "imageUrl": "string",            // URL de l'image du produit (optionnel)
  "supplierIds": ["string"],       // IDs des fournisseurs (optionnel)
  "tags": ["string"],              // Tags pour le produit (optionnel)
  "taxRate": 16.0,                 // Taux de taxe en pourcentage (optionnel)
  "sku": "string"                  // Référence de stock (optionnel)
}
```

## Structure du modèle Transaction de Stock

```json
{
  "id": "string",                  // Identifiant unique de la transaction
  "productId": "string",           // ID du produit concerné
  "type": "purchase",              // Type de transaction (voir liste ci-dessus)
  "quantity": 10.0,                // Quantité (positive ou négative selon le type)
  "date": "2023-08-01T12:30:00.000Z", // Date de la transaction
  "referenceId": "string",         // ID de référence (vente, achat, etc.) (optionnel)
  "notes": "string",               // Notes additionnelles (optionnel)
  "createdBy": "string",           // ID de l'utilisateur qui a créé la transaction (optionnel)
  "createdAt": "2023-08-01T12:30:00.000Z", // Date de création de l'enregistrement
  "unitCostPrice": 5000.00,        // Prix unitaire d'achat (optionnel)
  "locationId": "string"           // ID de l'emplacement de stock (optionnel)
}
```

## Endpoints pour les Produits

### 1. Récupérer tous les produits

**Endpoint:** `GET /products`

**Paramètres de requête:**
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page
- `category` (optionnel): Filtrer par catégorie
- `sortBy` (optionnel): Champ sur lequel trier les résultats
- `sortOrder` (optionnel): Ordre de tri (`asc` ou `desc`)
- `searchQuery` (optionnel): Terme de recherche pour filtrer les produits

**Réponse:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      // Objet produit (voir structure ci-dessus)
    },
    // ... autres produits
  ]
}
```

### 2. Récupérer un produit par ID

**Endpoint:** `GET /products/{id}`

**Paramètres:**
- `id`: ID du produit à récupérer

**Réponse:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "statusCode": 200,
  "data": {
    // Objet produit (voir structure ci-dessus)
  }
}
```

### 3. Créer un nouveau produit

**Endpoint:** `POST /products`

**Type de requête:** `multipart/form-data` (si vous incluez une image) ou `application/json`

**Corps de la requête:**
```json
{
  "name": "string",                // Obligatoire
  "description": "string",         // Obligatoire
  "barcode": "string",             // Optionnel
  "category": "food",              // Obligatoire
  "costPriceInCdf": 5000.00,       // Obligatoire
  "sellingPriceInCdf": 7500.00,    // Obligatoire
  "stockQuantity": 100.0,          // Obligatoire
  "unit": "piece",                 // Obligatoire
  "alertThreshold": 10.0,          // Optionnel
  "supplierIds": ["string"],       // Optionnel
  "tags": ["string"],              // Optionnel
  "taxRate": 16.0,                 // Optionnel
  "sku": "string"                  // Optionnel
}
```

**Champs supplémentaires pour multipart/form-data:**
- `image`: Fichier image du produit (jpg, png, etc.)

**Réponse:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "statusCode": 201,
  "data": {
    // Objet produit créé (voir structure ci-dessus)
  }
}
```

### 4. Mettre à jour un produit

**Endpoint:** `PUT /products/{id}`

**Paramètres:**
- `id`: ID du produit à mettre à jour

**Type de requête:** `multipart/form-data` (si vous incluez une image) ou `application/json`

**Corps de la requête:**
```json
{
  "name": "string",                // Optionnel
  "description": "string",         // Optionnel
  "barcode": "string",             // Optionnel
  "category": "food",              // Optionnel
  "costPriceInCdf": 5000.00,       // Optionnel
  "sellingPriceInCdf": 7500.00,    // Optionnel
  "stockQuantity": 100.0,          // Optionnel (préférer les transactions de stock pour modifier)
  "unit": "piece",                 // Optionnel
  "alertThreshold": 10.0,          // Optionnel
  "supplierIds": ["string"],       // Optionnel
  "tags": ["string"],              // Optionnel
  "taxRate": 16.0,                 // Optionnel
  "sku": "string",                 // Optionnel
  "removeImage": false             // Optionnel, pour supprimer l'image existante
}
```

**Champs supplémentaires pour multipart/form-data:**
- `image`: Fichier image du produit (jpg, png, etc.)

**Réponse:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "statusCode": 200,
  "data": {
    // Objet produit mis à jour (voir structure ci-dessus)
  }
}
```

### 5. Supprimer un produit

**Endpoint:** `DELETE /products/{id}`

**Paramètres:**
- `id`: ID du produit à supprimer

**Réponse:**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "statusCode": 200,
  "data": null
}
```

## Endpoints pour les Transactions de Stock

### 1. Récupérer toutes les transactions de stock

**Endpoint:** `GET /stock-transactions`

**Paramètres de requête:**
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page
- `productId` (optionnel): Filtrer par ID de produit
- `type` (optionnel): Filtrer par type de transaction
- `dateFrom` (optionnel): Date de début au format ISO8601 (YYYY-MM-DD)
- `dateTo` (optionnel): Date de fin au format ISO8601 (YYYY-MM-DD)

**Réponse:**
```json
{
  "success": true,
  "message": "Stock transactions retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      // Objet transaction de stock (voir structure ci-dessus)
    },
    // ... autres transactions
  ]
}
```

### 2. Récupérer une transaction de stock par ID

**Endpoint:** `GET /stock-transactions/{id}`

**Paramètres:**
- `id`: ID de la transaction à récupérer

**Réponse:**
```json
{
  "success": true,
  "message": "Stock transaction retrieved successfully",
  "statusCode": 200,
  "data": {
    // Objet transaction de stock (voir structure ci-dessus)
  }
}
```

### 3. Créer une nouvelle transaction de stock

**Endpoint:** `POST /stock-transactions`

**Corps de la requête:**
```json
{
  "productId": "string",           // Obligatoire
  "type": "purchase",              // Obligatoire
  "quantity": 10.0,                // Obligatoire
  "date": "2023-08-01T12:30:00.000Z", // Obligatoire
  "referenceId": "string",         // Optionnel
  "notes": "string",               // Optionnel
  "unitCostPrice": 5000.00,        // Optionnel
  "locationId": "string"           // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Stock transaction created successfully",
  "statusCode": 201,
  "data": {
    // Objet transaction de stock créé (voir structure ci-dessus)
  }
}
```
