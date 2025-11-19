# API Opérations

Cette documentation détaille les endpoints disponibles pour la gestion des opérations dans l'application Wanzo. Le module Operations est un point d'entrée central qui regroupe différents types d'opérations financières et commerciales (ventes, dépenses, financements).

## Types d'Opérations

Les types d'opérations disponibles dans l'API:

- `sale` - Vente
- `expense` - Dépense
- `financing` - Demande de Financement
- `inventory` - Opération d'Inventaire
- `transaction` - Transaction Financière

## Structure du modèle Opération

```json
{
  "id": "string",                       // Identifiant unique de l'opération
  "type": "sale",                       // Type d'opération (voir liste ci-dessus)
  "date": "2023-08-01T12:30:00.000Z",   // Date de l'opération
  "description": "string",              // Description de l'opération
  "entityId": "string",                 // ID de l'entité associée (vente, dépense, etc.)
  "amountCdf": 150000.00,               // Montant en CDF
  "amountUsd": 75.00,                   // Montant en USD (si applicable)
  "relatedPartyId": "string",           // ID de la partie liée (client, fournisseur)
  "relatedPartyName": "string",         // Nom de la partie liée
  "status": "completed",                // Statut de l'opération
  "createdBy": "string",                // ID de l'utilisateur qui a créé l'opération
  "createdAt": "2023-08-01T12:30:00.000Z", // Date de création
  "updatedAt": "2023-08-01T12:30:00.000Z", // Date de mise à jour
  // Champs supplémentaires selon le type d'opération
  "paymentMethod": "cash",              // Méthode de paiement (pour les ventes/dépenses)
  "categoryId": "string",               // ID de la catégorie (pour les dépenses)
  "productCount": 5                     // Nombre de produits (pour les ventes)
}
```

## Endpoints

### 1. Récupérer la liste des opérations

**Endpoint**: `GET /commerce/api/v1/operations`

**Description**: Récupère la liste des opérations avec filtrage et pagination.

**Paramètres de requête (Query Params)**:
- `type` (optionnel): Filtrer par type d'opération (voir liste ci-dessus)
- `startDate` (optionnel): Date de début (format: YYYY-MM-DD)
- `endDate` (optionnel): Date de fin (format: YYYY-MM-DD)
- `relatedPartyId` (optionnel): ID du client ou fournisseur lié
- `status` (optionnel): Statut de l'opération
- `minAmount` (optionnel): Montant minimum
- `maxAmount` (optionnel): Montant maximum
- `sortBy` (optionnel): Champ de tri (date, amount, relatedPartyName)
- `sortOrder` (optionnel): Ordre de tri (asc, desc)
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        // Structure du modèle Opération (version courte)
        "id": "string",
        "type": "sale",
        "date": "2023-08-01T12:30:00.000Z",
        "description": "string",
        "amountCdf": 150000.00,
        "amountUsd": 75.00,
        "relatedPartyName": "string",
        "status": "completed"
      }
    ],
    "totalItems": 120,
    "totalPages": 6,
    "currentPage": 1
  }
}
```

### 2. Récupérer le résumé des opérations

**Endpoint**: `GET /api/v1/operations/summary`

**Description**: Récupère un résumé des opérations regroupées par type et période.

**Paramètres de requête (Query Params)**:
- `period` (obligatoire): Période pour laquelle récupérer les données (valeurs possibles: "day", "week", "month", "year")
- `date` (optionnel): Date de référence (format: YYYY-MM-DD), défaut: aujourd'hui

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "period": "month",
    "startDate": "2023-08-01",
    "endDate": "2023-08-31",
    "summary": {
      "totalOperations": 120,
      "byType": {
        "sale": {
          "count": 65,
          "amountCdf": 9750000.00,
          "amountUsd": 4875.00
        },
        "expense": {
          "count": 45,
          "amountCdf": 3375000.00,
          "amountUsd": 1687.50
        },
        "financing": {
          "count": 2,
          "amountCdf": 20000000.00,
          "amountUsd": 10000.00
        },
        "inventory": {
          "count": 8,
          "productCount": 120
        }
      },
      "byStatus": {
        "completed": 95,
        "pending": 15,
        "cancelled": 10
      }
    }
  }
}
```

### 3. Exporter des opérations

**Endpoint**: `POST /api/v1/operations/export`

**Description**: Génère un fichier d'exportation (PDF ou Excel) des opérations selon les critères spécifiés.

**Corps de la requête**:
```json
{
  "type": "sale",              // Optionnel: Filtrer par type d'opération
  "startDate": "2023-08-01",   // Obligatoire: Date de début
  "endDate": "2023-08-31",     // Obligatoire: Date de fin
  "relatedPartyId": "string",  // Optionnel: ID du client ou fournisseur lié
  "status": "completed",       // Optionnel: Statut de l'opération
  "format": "pdf",             // Obligatoire: Format d'export (pdf, excel)
  "includeDetails": true,      // Optionnel: Inclure les détails des opérations
  "groupBy": "date"            // Optionnel: Regroupement (date, type, party)
}
```

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "exportId": "string",
    "fileName": "operations_export_2023-08-01_2023-08-31.pdf",
    "fileSize": 1250,
    "fileUrl": "https://api.wanzo.com/exports/operations_export_2023-08-01_2023-08-31.pdf",
    "expiresAt": "2023-09-01T12:30:00.000Z"
  }
}
```

### 4. Récupérer les détails d'une opération spécifique

**Endpoint**: `GET /api/v1/operations/{id}`

**Description**: Récupère les détails complets d'une opération spécifique.

**Paramètres de chemin (Path Params)**:
- `id`: L'identifiant unique de l'opération

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    // Structure complète du modèle Opération
    // Les champs supplémentaires dépendent du type d'opération
    "id": "string",
    "type": "sale",
    "date": "2023-08-01T12:30:00.000Z",
    "description": "string",
    "entityId": "sale-123",
    "amountCdf": 150000.00,
    "amountUsd": 75.00,
    "relatedPartyId": "customer-456",
    "relatedPartyName": "Entreprise ABC",
    "status": "completed",
    "paymentMethod": "cash",
    "products": [
      {
        "productId": "string",
        "name": "string",
        "quantity": 3,
        "unitPrice": 50000.00,
        "totalPrice": 150000.00
      }
    ],
    "notes": "string",
    "createdBy": "user-789",
    "createdAt": "2023-08-01T12:30:00.000Z",
    "updatedAt": "2023-08-01T12:30:00.000Z"
  }
}
```

### 5. Obtenir la chronologie des opérations récentes

**Endpoint**: `GET /api/v1/operations/timeline`

**Description**: Récupère une chronologie des opérations récentes pour affichage dans l'interface utilisateur.

**Paramètres de requête (Query Params)**:
- `limit` (optionnel): Nombre d'opérations à récupérer, défaut: 10

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "string",
        "type": "sale",
        "date": "2023-08-01T12:30:00.000Z",
        "description": "Vente à Entreprise ABC",
        "amountCdf": 150000.00,
        "relatedPartyName": "Entreprise ABC",
        "status": "completed",
        "timeAgo": "il y a 2 heures"
      }
    ]
  }
}
```
