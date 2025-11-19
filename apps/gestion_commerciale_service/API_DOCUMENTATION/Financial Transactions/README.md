# API Transactions Financières

Cette documentation détaille les endpoints disponibles pour la gestion des transactions financières dans l'application Wanzo.

## Types de Transactions

Les types de transactions sont représentés par des chaînes de caractères dans les requêtes et réponses API:

- `income` - Revenus
- `expense` - Dépenses
- `transfer` - Transferts entre comptes
- `payment` - Paiements pour ventes ou achats
- `refund` - Remboursements
- `openingBalance` - Solde d'ouverture
- `other` - Autre

## Statuts de Transactions

Les statuts de transactions sont représentés par des chaînes de caractères:

- `pending` - En attente
- `completed` - Terminée
- `failed` - Échouée
- `cancelled` - Annulée
- `onHold` - En suspens

## Structure du modèle Transaction Financière

```json
{
  "id": "string",                      // Identifiant unique de la transaction
  "date": "2023-08-01T12:30:00.000Z",  // Date de la transaction (format ISO8601)
  "amount": 150.00,                    // Montant de la transaction
  "type": "income",                    // Type de transaction (voir liste ci-dessus)
  "description": "string",             // Description de la transaction
  "category": "string",                // Catégorie de la transaction (optionnel)
  "relatedParty": "string",            // Partie liée (ID client, fournisseur, etc.) (optionnel)
  "paymentMethod": "string",           // Méthode de paiement (optionnel)
  "referenceNumber": "string",         // Numéro de référence (optionnel)
  "status": "completed",               // Statut de la transaction (voir liste ci-dessus)
  "notes": "string",                   // Notes additionnelles (optionnel)
  "createdAt": "2023-08-01T12:30:00.000Z", // Date de création
  "updatedAt": "2023-08-01T12:30:00.000Z", // Date de mise à jour
  "linkedDocumentId": "string",        // ID du document lié (optionnel)
  "linkedDocumentType": "string"       // Type du document lié (optionnel)
}
```

## Endpoints

### 1. Récupérer toutes les transactions financières

**Endpoint:** `GET /commerce/api/v1/financial-transactions`

**Paramètres de requête:**
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page
- `dateFrom` (optionnel): Date de début au format ISO8601 (YYYY-MM-DD)
- `dateTo` (optionnel): Date de fin au format ISO8601 (YYYY-MM-DD)
- `type` (optionnel): Type de transaction (voir liste des types)
- `status` (optionnel): Statut de la transaction (voir liste des statuts)
- `paymentMethodId` (optionnel): ID de la méthode de paiement

**Réponse:**
```json
{
  "success": true,
  "message": "Financial transactions fetched successfully.",
  "statusCode": 200,
  "data": [
    {
      // Objet transaction financière (voir structure ci-dessus)
    },
    // ... autres transactions
  ]
}
```

### 2. Récupérer une transaction financière par ID

**Endpoint:** `GET /financial-transactions/{id}`

**Paramètres:**
- `id`: ID de la transaction à récupérer

**Réponse:**
```json
{
  "success": true,
  "message": "Financial transaction fetched successfully.",
  "statusCode": 200,
  "data": {
    // Objet transaction financière (voir structure ci-dessus)
  }
}
```

### 3. Créer une nouvelle transaction financière

**Endpoint:** `POST /financial-transactions`

**Corps de la requête:**
```json
{
  "date": "2023-08-01T12:30:00.000Z", // Obligatoire
  "amount": 150.00,                    // Obligatoire
  "type": "income",                    // Obligatoire
  "description": "string",             // Obligatoire
  "category": "string",                // Optionnel
  "relatedParty": "string",            // Optionnel
  "paymentMethod": "string",           // Optionnel
  "referenceNumber": "string",         // Optionnel
  "status": "completed",               // Obligatoire
  "notes": "string",                   // Optionnel
  "linkedDocumentId": "string",        // Optionnel
  "linkedDocumentType": "string"       // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Financial transaction created successfully.",
  "statusCode": 201,
  "data": {
    // Objet transaction financière créée (voir structure ci-dessus)
  }
}
```

### 4. Mettre à jour une transaction financière

**Endpoint:** `PUT /financial-transactions/{id}`

**Paramètres:**
- `id`: ID de la transaction à mettre à jour

**Corps de la requête:**
```json
{
  "date": "2023-08-01T12:30:00.000Z", // Optionnel
  "amount": 150.00,                    // Optionnel
  "type": "income",                    // Optionnel
  "description": "string",             // Optionnel
  "category": "string",                // Optionnel
  "relatedParty": "string",            // Optionnel
  "paymentMethod": "string",           // Optionnel
  "referenceNumber": "string",         // Optionnel
  "status": "completed",               // Optionnel
  "notes": "string",                   // Optionnel
  "linkedDocumentId": "string",        // Optionnel
  "linkedDocumentType": "string"       // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Financial transaction updated successfully.",
  "statusCode": 200,
  "data": {
    // Objet transaction financière mise à jour (voir structure ci-dessus)
  }
}
```

### 5. Supprimer une transaction financière

**Endpoint:** `DELETE /financial-transactions/{id}`

**Paramètres:**
- `id`: ID de la transaction à supprimer

**Réponse:**
```json
{
  "success": true,
  "message": "Financial transaction deleted successfully.",
  "statusCode": 200,
  "data": null
}
```

### 6. Récupérer le résumé des transactions financières

**Endpoint:** `GET /financial-transactions/summary`

**Paramètres de requête:**
- `dateFrom` (optionnel): Date de début au format ISO8601 (YYYY-MM-DD)
- `dateTo` (optionnel): Date de fin au format ISO8601 (YYYY-MM-DD)
- `type` (optionnel): Type de transaction (filtrer par type)

**Réponse:**
```json
{
  "success": true,
  "message": "Financial transactions summary fetched successfully.",
  "statusCode": 200,
  "data": {
    "totalIncome": 5000.00,
    "totalExpense": 2000.00,
    "netAmount": 3000.00,
    "totalCount": 25,
    "typeBreakdown": [
      {
        "type": "income",
        "amount": 5000.00,
        "count": 10
      },
      {
        "type": "expense",
        "amount": 2000.00,
        "count": 15
      }
    ]
  }
}
```
