# API Fournisseurs (Suppliers)

Cette documentation détaille les endpoints disponibles pour la gestion des fournisseurs dans l'application Wanzo.

## Structure du modèle Fournisseur

```json
{
  "id": "string",              // Identifiant unique du fournisseur
  "name": "string",            // Nom du fournisseur
  "phoneNumber": "string",     // Numéro de téléphone du fournisseur
  "email": "string",           // Adresse email du fournisseur (optionnel)
  "address": "string",         // Adresse physique du fournisseur (optionnel)
  "contactPerson": "string",   // Personne à contacter chez le fournisseur (optionnel)
  "createdAt": "string",       // Date de création (format ISO8601)
  "notes": "string",           // Notes ou informations supplémentaires (optionnel)
  "totalPurchases": 0.0,       // Total des achats effectués auprès de ce fournisseur (en FC)
  "lastPurchaseDate": "string", // Date du dernier achat (format ISO8601, optionnel)
  "category": "string",        // Catégorie du fournisseur (enum)
  "deliveryTimeInDays": 0,     // Délai de livraison moyen en jours
  "paymentTerms": "string"     // Termes de paiement (ex: "Net 30")
}
```

## Endpoints

### 1. Récupérer tous les fournisseurs

**Endpoint:** `GET /commerce/api/v1/suppliers`

**Paramètres de requête:**
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page
- `sortBy` (optionnel): Champ sur lequel trier les résultats
- `sortOrder` (optionnel): Ordre de tri (`asc` ou `desc`)
- `q` (optionnel): Terme de recherche pour filtrer les fournisseurs

**Réponse:**
```json
{
  "success": true,
  "message": "Suppliers retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      // Objet fournisseur (voir structure ci-dessus)
    },
    // ... autres fournisseurs
  ]
}
```

### 2. Récupérer un fournisseur par ID

**Endpoint:** `GET /commerce/api/v1/suppliers/{id}`

**Paramètres:**
- `id`: ID du fournisseur à récupérer

**Réponse:**
```json
{
  "success": true,
  "message": "Supplier retrieved successfully",
  "statusCode": 200,
  "data": {
    // Objet fournisseur (voir structure ci-dessus)
  }
}
```

### 3. Créer un nouveau fournisseur

**Endpoint:** `POST /commerce/api/v1/suppliers`

**Corps de la requête:**
```json
{
  "name": "string",            // Obligatoire
  "phoneNumber": "string",     // Obligatoire
  "email": "string",           // Optionnel
  "address": "string",         // Optionnel
  "contactPerson": "string",   // Optionnel
  "notes": "string",           // Optionnel
  "category": "string",        // Obligatoire
  "deliveryTimeInDays": 0,     // Obligatoire
  "paymentTerms": "string"     // Obligatoire
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Supplier created successfully",
  "statusCode": 201,
  "data": {
    // Objet fournisseur créé (voir structure ci-dessus)
  }
}
```

### 4. Mettre à jour un fournisseur

**Endpoint:** `PUT /suppliers/{id}`

**Paramètres:**
- `id`: ID du fournisseur à mettre à jour

**Corps de la requête:**
```json
{
  "name": "string",            // Optionnel
  "phoneNumber": "string",     // Optionnel
  "email": "string",           // Optionnel
  "address": "string",         // Optionnel
  "contactPerson": "string",   // Optionnel
  "notes": "string",           // Optionnel
  "category": "string",        // Optionnel
  "deliveryTimeInDays": 0,     // Optionnel
  "paymentTerms": "string"     // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Supplier updated successfully",
  "statusCode": 200,
  "data": {
    // Objet fournisseur mis à jour (voir structure ci-dessus)
  }
}
```

### 5. Supprimer un fournisseur

**Endpoint:** `DELETE /suppliers/{id}`

**Paramètres:**
- `id`: ID du fournisseur à supprimer

**Réponse:**
```json
{
  "success": true,
  "message": "Supplier deleted successfully",
  "statusCode": 200,
  "data": null
}
```
