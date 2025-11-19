# API Ventes

Cette documentation détaille les endpoints disponibles pour la gestion des ventes dans l'application Wanzo.

## Statuts des Ventes

Les statuts de ventes sont représentés par des chaînes de caractères dans les requêtes et réponses API:

- `pending` - En attente
- `completed` - Terminée
- `cancelled` - Annulée
- `partiallyPaid` - Partiellement payée

## Structure du modèle Vente

```json
{
  "id": "string",                      // Identifiant unique de la vente
  "localId": "string",                 // Identifiant local (optionnel)
  "date": "2023-08-01T12:30:00.000Z",  // Date de la vente
  "dueDate": "2023-08-15T12:30:00.000Z", // Date d'échéance (optionnel)
  "customerId": "string",              // Identifiant du client (optionnel)
  "customerName": "string",            // Nom du client
  "items": [                           // Liste des produits vendus
    {
      "id": "string",                  // Identifiant unique de l'article
      "productId": "string",           // Identifiant du produit
      "productName": "string",         // Nom du produit
      "quantity": 5,                   // Quantité vendue
      "unitPrice": 10.00,              // Prix unitaire
      "discount": 0.00,                // Remise (optionnel)
      "totalPrice": 50.00,             // Prix total
      "currencyCode": "USD",           // Code de la devise (optionnel)
      "taxRate": 16.00,                // Taux de taxe en pourcentage (optionnel)
      "taxAmount": 8.00,               // Montant de la taxe (optionnel)
      "notes": "string"                // Notes additionnelles (optionnel)
    }
  ],
  "totalAmountInCdf": 50000.00,        // Montant total en Francs Congolais
  "amountPaidInCdf": 50000.00,         // Montant payé en Francs Congolais
  "status": "completed",               // Statut de la vente
  "paymentMethod": "string",           // Méthode de paiement
  "paymentReference": "string",        // Référence de paiement (optionnel)
  "notes": "string",                   // Notes additionnelles (optionnel)
  "exchangeRate": 2000.00,             // Taux de change
  "createdAt": "2023-08-01T12:30:00.000Z", // Date de création
  "updatedAt": "2023-08-01T12:30:00.000Z", // Date de mise à jour
  "syncStatus": "synced"               // Statut de synchronisation (local uniquement)
}
```

## Endpoints

### 1. Récupérer toutes les ventes

**Endpoint:** `GET /commerce/api/v1/sales`

**Paramètres de requête:**
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page
- `dateFrom` (optionnel): Date de début au format ISO8601 (YYYY-MM-DD)
- `dateTo` (optionnel): Date de fin au format ISO8601 (YYYY-MM-DD)
- `customerId` (optionnel): Filtrer par ID client
- `status` (optionnel): Filtrer par statut
- `minAmount` (optionnel): Montant minimal
- `maxAmount` (optionnel): Montant maximal
- `sortBy` (optionnel): Champ sur lequel trier
- `sortOrder` (optionnel): Ordre de tri (`asc` ou `desc`)

**Réponse:**
```json
{
  "success": true,
  "message": "Sales fetched successfully.",
  "statusCode": 200,
  "data": [
    {
      // Objet vente (voir structure ci-dessus)
    },
    // ... autres ventes
  ]
}
```

### 2. Récupérer une vente par ID

**Endpoint:** `GET /commerce/api/v1/sales/{id}`

**Paramètres:**
- `id`: ID de la vente à récupérer

**Réponse:**
```json
{
  "success": true,
  "message": "Sale fetched successfully.",
  "statusCode": 200,
  "data": {
    // Objet vente (voir structure ci-dessus)
  }
}
```

### 3. Créer une nouvelle vente

**Endpoint:** `POST /commerce/api/v1/sales`

**Corps de la requête:**
```json
{
  "date": "2023-08-01T12:30:00.000Z",  // Obligatoire
  "dueDate": "2023-08-15T12:30:00.000Z", // Optionnel
  "customerId": "string",              // Optionnel
  "customerName": "string",            // Obligatoire
  "items": [                           // Obligatoire (au moins un élément)
    {
      "productId": "string",           // Obligatoire
      "productName": "string",         // Obligatoire
      "quantity": 5,                   // Obligatoire
      "unitPrice": 10.00,              // Obligatoire
      "discount": 0.00,                // Optionnel
      "currencyCode": "USD",           // Optionnel
      "taxRate": 16.00,                // Optionnel
      "notes": "string"                // Optionnel
    }
  ],
  "paymentMethod": "string",           // Obligatoire
  "paymentReference": "string",        // Optionnel
  "notes": "string",                   // Optionnel
  "exchangeRate": 2000.00              // Obligatoire si devises différentes
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Sale created successfully.",
  "statusCode": 201,
  "data": {
    // Objet vente créé (voir structure ci-dessus)
  }
}
```

### 4. Mettre à jour une vente

**Endpoint:** `PATCH /commerce/api/v1/sales/{id}`

**Paramètres:**
- `id`: ID de la vente à mettre à jour

**Corps de la requête:**
```json
{
  "date": "2023-08-01T12:30:00.000Z",  // Optionnel
  "dueDate": "2023-08-15T12:30:00.000Z", // Optionnel
  "customerName": "string",            // Optionnel
  "items": [                           // Optionnel
    {
      "id": "string",                  // Obligatoire si l'article existe déjà
      "productId": "string",           // Obligatoire pour nouvel article
      "productName": "string",         // Obligatoire pour nouvel article
      "quantity": 5,                   // Obligatoire pour nouvel article
      "unitPrice": 10.00,              // Obligatoire pour nouvel article
      "discount": 0.00,                // Optionnel
      "notes": "string"                // Optionnel
    }
  ],
  "status": "completed",               // Optionnel
  "paymentMethod": "string",           // Optionnel
  "amountPaidInCdf": 50000.00,         // Optionnel
  "paymentReference": "string",        // Optionnel
  "notes": "string"                    // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Sale updated successfully.",
  "statusCode": 200,
  "data": {
    // Objet vente mis à jour (voir structure ci-dessus)
  }
}
```

### 5. Supprimer une vente

**Endpoint:** `DELETE /commerce/api/v1/sales/{id}`

**Paramètres:**
- `id`: ID de la vente à supprimer

**Réponse:**
```json
{
  "success": true,
  "message": "Sale deleted successfully.",
  "statusCode": 200,
  "data": null
}
```

### 6. Marquer une vente comme complétée

**Endpoint:** `PUT /commerce/api/v1/sales/{id}/complete`

**Paramètres:**
- `id`: ID de la vente à marquer comme complétée

**Corps de la requête:**
```json
{
  "amountPaidInCdf": 50000.00,         // Obligatoire
  "paymentMethod": "string",           // Obligatoire
  "paymentReference": "string"         // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Sale marked as completed successfully.",
  "statusCode": 200,
  "data": {
    // Objet vente mis à jour (voir structure ci-dessus)
  }
}
```

### 7. Annuler une vente

**Endpoint:** `PUT /commerce/api/v1/sales/{id}/cancel`

**Paramètres:**
- `id`: ID de la vente à annuler

**Corps de la requête:**
```json
{
  "reason": "string"                   // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Sale cancelled successfully.",
  "statusCode": 200,
  "data": {
    // Objet vente mis à jour (voir structure ci-dessus)
  }
}
```
