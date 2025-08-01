# API Financement

Cette documentation détaille les endpoints disponibles pour la gestion des demandes de financement dans l'application Wanzo.

## Types de Financements

Les types de financements disponibles dans l'API:

- `businessLoan` - Prêt Entreprise
- `equipmentLoan` - Prêt Équipement
- `workingCapital` - Fonds de Roulement
- `expansionLoan` - Prêt pour Expansion
- `lineOfCredit` - Ligne de Crédit

## Statuts des Demandes de Financement

Les statuts des demandes de financement sont représentés par des chaînes de caractères:

- `draft` - Brouillon
- `submitted` - Soumise
- `underReview` - En Cours d'Évaluation
- `approved` - Approuvée
- `rejected` - Rejetée
- `disbursed` - Décaissée
- `completed` - Terminée
- `cancelled` - Annulée

## Structure du modèle Demande de Financement

```json
{
  "id": "string",                       // Identifiant unique de la demande
  "businessId": "string",               // ID de l'entreprise
  "productId": "string",                // ID du produit de financement
  "amount": 5000.00,                    // Montant demandé
  "currency": "CDF",                    // Devise (CDF, USD, etc.)
  "term": 12,                           // Durée en mois
  "purpose": "string",                  // Objet du financement
  "status": "submitted",                // Statut de la demande (voir liste ci-dessus)
  "institutionId": "string",            // ID de l'institution financière
  "applicationDate": "2023-08-01T12:30:00.000Z", // Date de soumission
  "lastStatusUpdateDate": "2023-08-02T10:15:00.000Z", // Date de dernière mise à jour
  "approvalDate": "2023-08-15T14:20:00.000Z",    // Date d'approbation (si applicable)
  "disbursementDate": "2023-08-20T09:45:00.000Z", // Date de décaissement (si applicable)
  "businessInformation": {              // Informations sur l'entreprise
    "name": "string",
    "registrationNumber": "string",
    "address": "string",
    "yearsInBusiness": 3,
    "numberOfEmployees": 10,
    "annualRevenue": 50000.00
  },
  "financialInformation": {             // Informations financières
    "monthlyRevenue": 5000.00,
    "monthlyExpenses": 3000.00,
    "existingLoans": [
      {
        "lender": "string",
        "originalAmount": 10000.00,
        "outstandingBalance": 6000.00,
        "monthlyPayment": 500.00
      }
    ]
  },
  "documents": [                       // Documents soumis
    {
      "id": "string",
      "type": "businessPlan",
      "name": "string",
      "url": "string",
      "uploadDate": "2023-08-01T12:30:00.000Z"
    }
  ],
  "notes": "string",                   // Notes supplémentaires
  "createdAt": "2023-08-01T12:30:00.000Z", // Date de création
  "updatedAt": "2023-08-01T12:30:00.000Z"  // Date de mise à jour
}
```

## Endpoints

### 1. Récupérer toutes les demandes de financement

**Endpoint**: `GET /api/v1/financing/requests`

**Description**: Récupère la liste de toutes les demandes de financement de l'utilisateur actuel.

**Paramètres de requête (Query Params)**:
- `status` (optionnel): Filtre par statut
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "string",
        "amount": 5000.00,
        "currency": "CDF",
        "status": "submitted",
        "purpose": "string",
        "applicationDate": "2023-08-01T12:30:00.000Z",
        "institutionName": "string"
      }
    ],
    "totalItems": 10,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### 2. Récupérer une demande de financement spécifique

**Endpoint**: `GET /api/v1/financing/requests/{id}`

**Description**: Récupère les détails d'une demande de financement spécifique.

**Paramètres de chemin (Path Params)**:
- `id`: L'identifiant unique de la demande de financement

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    // Détails complets du modèle de demande de financement
  }
}
```

### 3. Créer une nouvelle demande de financement

**Endpoint**: `POST /api/v1/financing/requests`

**Description**: Crée une nouvelle demande de financement.

**Corps de la requête**:
```json
{
  "productId": "string",
  "amount": 5000.00,
  "currency": "CDF",
  "term": 12,
  "purpose": "string",
  "businessInformation": {
    "name": "string",
    "registrationNumber": "string",
    "address": "string",
    "yearsInBusiness": 3,
    "numberOfEmployees": 10,
    "annualRevenue": 50000.00
  },
  "financialInformation": {
    "monthlyRevenue": 5000.00,
    "monthlyExpenses": 3000.00
  }
}
```

**Réponse réussie (201)**:
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "status": "draft",
    "message": "Demande de financement créée avec succès",
    // Autres détails du modèle de demande de financement
  }
}
```

### 4. Mettre à jour une demande de financement

**Endpoint**: `PUT /api/v1/financing/requests/{id}`

**Description**: Met à jour une demande de financement existante.

**Paramètres de chemin (Path Params)**:
- `id`: L'identifiant unique de la demande de financement

**Corps de la requête**:
```json
{
  "amount": 6000.00,
  "term": 18,
  "purpose": "string",
  // Autres champs à mettre à jour
}
```

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "message": "Demande de financement mise à jour avec succès",
    // Détails mis à jour du modèle
  }
}
```

### 5. Soumettre une demande de financement

**Endpoint**: `POST /api/v1/financing/requests/{id}/submit`

**Description**: Change le statut d'une demande de financement de "brouillon" à "soumise".

**Paramètres de chemin (Path Params)**:
- `id`: L'identifiant unique de la demande de financement

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "status": "submitted",
    "applicationDate": "2023-08-01T12:30:00.000Z",
    "message": "Demande de financement soumise avec succès"
  }
}
```

### 6. Annuler une demande de financement

**Endpoint**: `POST /api/v1/financing/requests/{id}/cancel`

**Description**: Annule une demande de financement en attente.

**Paramètres de chemin (Path Params)**:
- `id`: L'identifiant unique de la demande de financement

**Corps de la requête**:
```json
{
  "reason": "string" // Raison de l'annulation
}
```

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "status": "cancelled",
    "message": "Demande de financement annulée avec succès"
  }
}
```

### 7. Récupérer les produits de financement disponibles

**Endpoint**: `GET /api/v1/financing/products`

**Description**: Récupère la liste des produits de financement disponibles.

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "provider": "string",
        "minAmount": 1000.00,
        "maxAmount": 50000.00,
        "term": {
          "min": 3,
          "max": 36
        },
        "interestRate": 15.5,
        "requirementsSummary": "string",
        "requiredDocuments": ["businessPlan", "financialStatements"]
      }
    ]
  }
}
```
