# API Dépenses (Expenses)

Cette documentation détaille les endpoints disponibles pour la gestion des dépenses dans l'application Wanzo.

## Catégories de Dépenses

Les catégories de dépenses sont représentées par des chaînes de caractères dans les requêtes et réponses API. Voici les catégories disponibles :

- `rent` - Loyer
- `utilities` - Services Publics
- `supplies` - Fournitures
- `salaries` - Salaires
- `marketing` - Marketing
- `transport` - Transport
- `maintenance` - Maintenance
- `other` - Autre
- `inventory` - Stock et Inventaire
- `equipment` - Équipement
- `taxes` - Taxes et Impôts
- `insurance` - Assurances
- `loan` - Remboursement de Prêt
- `office` - Fournitures de Bureau
- `training` - Formation et Développement
- `travel` - Voyages d'Affaires
- `software` - Logiciels et Technologie
- `advertising` - Publicité
- `legal` - Services Juridiques
- `manufacturing` - Production et Fabrication
- `consulting` - Conseil et Services
- `research` - Recherche et Développement
- `fuel` - Carburant
- `entertainment` - Représentation et Cadeaux
- `communication` - Télécommunications

## Structure du modèle Dépense

```json
{
  "id": "string",                     // Identifiant unique de la dépense
  "localId": "string",                // Identifiant local pour offline (optionnel, local uniquement)
  "date": "2023-08-01T12:30:00.000Z", // Date de la dépense (format ISO8601)
  "motif": "string",                  // Motif de la dépense
  "amount": 150.00,                   // Montant de la dépense
  "category": "rent",                 // Catégorie de la dépense (voir liste ci-dessus)
  "paymentMethod": "string",          // Méthode de paiement (optionnel)
  "attachmentUrls": [                 // URLs Cloudinary des pièces jointes après sync (optionnel)
    "string",
    "string"
  ],
  "localAttachmentPaths": [           // Chemins locaux des pièces jointes avant sync (optionnel, local uniquement)
    "string",
    "string"
  ],
  "supplierId": "string",             // ID du fournisseur (optionnel)
  "beneficiary": "string",            // Bénéficiaire de la dépense (optionnel)
  "notes": "string",                  // Notes additionnelles (optionnel)
  "currencyCode": "CDF",              // Code de la devise (CDF, USD, EUR, etc.) (optionnel, défaut: CDF)
  "userId": "string",                 // ID de l'utilisateur (optionnel)
  "createdAt": "2023-08-01T12:30:00.000Z", // Date de création (optionnel)
  "updatedAt": "2023-08-01T12:30:00.000Z", // Date de mise à jour (optionnel)
  "syncStatus": "synced",             // Statut de synchronisation: "synced", "pending", "failed" (local uniquement)
  "lastSyncAttempt": "2023-08-01T12:30:00.000Z", // Dernière tentative de sync (local uniquement, optionnel)
  "errorMessage": "string"            // Message d'erreur de synchronisation (local uniquement, optionnel)
}
```

## Gestion Multi-Devises des Dépenses

L'application supporte l'enregistrement des dépenses dans différentes devises:

### Fonctionnalités
- Saisir une dépense en CDF, USD, EUR, ou toute autre devise
- Conversion automatique vers CDF pour les rapports consolidés
- Conservation de la devise d'origine pour traçabilité

### Exemple d'Utilisation

**Scénario**: Dépense en USD

```json
{
  "motif": "Achat de matériel informatique",
  "amount": 500.0,
  "currencyCode": "USD",
  "category": "equipment",
  "paymentMethod": "Virement bancaire"
}
```

Le système:
1. Enregistre le montant original (500 USD)
2. Applique le taux de change du jour
3. Calcule l'équivalent en CDF pour les statistiques

## Gestion des Pièces Jointes

### Workflow Offline-First

1. **Mode Offline**: Les pièces jointes sont stockées localement
   - Chemin stocké dans `localAttachmentPaths[]`
   - Fichiers sauvegardés dans le stockage local de l'appareil

2. **Synchronisation**: Lors de la connexion internet
   - Upload automatique des fichiers vers Cloudinary
   - URLs retournées stockées dans `attachmentUrls[]`
   - `localAttachmentPaths[]` conservés comme backup

3. **Différence entre les champs**:
   - `attachmentUrls`: URLs publiques Cloudinary (après sync)
   - `localAttachmentPaths`: Chemins locaux (avant sync)

### Champs de Synchronisation Offline

- `localId`: Identifiant temporaire généré localement
- `syncStatus`: État de synchronisation (`synced`, `pending`, `failed`)
- `lastSyncAttempt`: Date de la dernière tentative
- `errorMessage`: Message d'erreur détaillé en cas d'échec

**Note**: Ces champs de synchronisation ne sont pas envoyés au serveur.

## Endpoints

### 1. Récupérer toutes les dépenses

**Endpoint:** `GET /commerce/api/v1/expenses`

**Paramètres de requête:**
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page
- `dateFrom` (optionnel): Date de début au format ISO8601 (YYYY-MM-DD)
- `dateTo` (optionnel): Date de fin au format ISO8601 (YYYY-MM-DD)
- `categoryId` (optionnel): Filtrer par catégorie de dépense
- `sortBy` (optionnel): Champ sur lequel trier les résultats
- `sortOrder` (optionnel): Ordre de tri (`asc` ou `desc`)

**Réponse:**
```json
{
  "success": true,
  "message": "Expenses retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      // Objet dépense (voir structure ci-dessus)
    },
    // ... autres dépenses
  ]
}
```

### 2. Récupérer une dépense par ID

**Endpoint:** `GET /commerce/api/v1/expenses/{id}`

**Paramètres:**
- `id`: ID de la dépense à récupérer

**Réponse:**
```json
{
  "success": true,
  "message": "Expense retrieved successfully",
  "statusCode": 200,
  "data": {
    // Objet dépense (voir structure ci-dessus)
  }
}
```

### 3. Créer une nouvelle dépense

**Endpoint:** `POST /commerce/api/v1/expenses`

**Corps de la requête:**
```json
{
  "date": "2023-08-01T12:30:00.000Z", // Obligatoire
  "motif": "string",                  // Obligatoire
  "amount": 150.00,                   // Obligatoire
  "category": "rent",                 // Obligatoire
  "paymentMethod": "string",          // Optionnel
  "supplierId": "string",             // Optionnel
  "beneficiary": "string",            // Optionnel
  "notes": "string",                  // Optionnel
  "currencyCode": "USD"               // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Expense created successfully",
  "statusCode": 201,
  "data": {
    // Objet dépense créé (voir structure ci-dessus)
  }
}
```

### 4. Mettre à jour une dépense

**Endpoint:** `PATCH /commerce/api/v1/expenses/{id}`

**Paramètres:**
- `id`: ID de la dépense à mettre à jour

**Corps de la requête:**
```json
{
  "date": "2023-08-01T12:30:00.000Z", // Optionnel
  "motif": "string",                  // Optionnel
  "amount": 150.00,                   // Optionnel
  "category": "rent",                 // Optionnel
  "paymentMethod": "string",          // Optionnel
  "supplierId": "string",             // Optionnel
  "beneficiary": "string",            // Optionnel
  "notes": "string",                  // Optionnel
  "currencyCode": "USD"               // Optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Expense updated successfully",
  "statusCode": 200,
  "data": {
    // Objet dépense mis à jour (voir structure ci-dessus)
  }
}
```

### 5. Supprimer une dépense

**Endpoint:** `DELETE /commerce/api/v1/expenses/{id}`

**Paramètres:**
- `id`: ID de la dépense à supprimer

**Réponse:**
```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "statusCode": 200,
  "data": null
}
```

### 6. Téléchargement de pièces jointes

**Endpoint:** `POST /commerce/api/v1/expenses/:id/upload-receipt`

**Type de requête:** `multipart/form-data`

**Paramètres:**
- `file`: Fichier à télécharger (image ou PDF)
- `expenseId` (optionnel): ID de la dépense associée

**Réponse:**
```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "statusCode": 200,
  "data": {
    "url": "string", // URL de la pièce jointe téléchargée
    "fileType": "string",
    "fileName": "string"
  }
}
```
