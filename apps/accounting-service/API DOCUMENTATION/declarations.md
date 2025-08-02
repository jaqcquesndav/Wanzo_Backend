# Déclarations Fiscales API Documentation

Ce document décrit les endpoints API pour la gestion des déclarations fiscales de l'application Wanzo Compta. Le système gère toutes les taxes et impôts de la RDC conformément au système SYSCOHADA/OHADA.

## Base URL

```
http://localhost:8000/accounting
```

## Authentication

All endpoints require authentication with a Bearer token.

**Required Headers:**
```
Authorization: Bearer <jwt_token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
Content-Type: application/json
```

## Data Structures

### Declaration

```typescript
interface Declaration {
  id: string;
  type: DeclarationType;
  period: string; // ISO date format (YYYY-MM-DD)
  periodicity: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  dueDate: string; // ISO date format
  status: 'draft' | 'pending' | 'submitted' | 'validated' | 'rejected';
  amount: number; // Amount in CDF (Franc Congolais)
  additionalFees?: number; // Frais supplémentaires non justifiés
  penalties?: number; // Pénalités de retard
  submittedAt?: string; // ISO date format
  submittedBy?: string; // User ID who submitted
  reference?: string; // Declaration reference number
  attachments?: DeclarationAttachment[];
  justificationDocument?: string; // PDF du justificatif
  declarationForm?: string; // Formulaire de déclaration PDF
  notes?: string;
  validatedAt?: string; // ISO date format
  validatedBy?: string; // User ID who validated
}

interface DeclarationAttachment {
  id: string;
  name: string;
  type: 'justification' | 'declaration_form' | 'supporting_document' | 'receipt';
  url: string;
  uploadedAt: string; // ISO date format
  size: number; // File size in bytes
}

type DeclarationType = 
  // Impôts directs
  | 'IBP' // Impôt sur les Bénéfices et Profits
  | 'IPR' // Impôt sur le Revenu Professionnel
  | 'IRCM' // Impôt Réel sur le Chiffre d'Affaires
  | 'IRVM' // Impôt sur les Revenus de Valeurs Mobilières
  | 'IPF' // Impôt Professionnel Forfaitaire
  // Taxes indirectes
  | 'TVA' // Taxe sur la Valeur Ajoutée
  | 'TPI' // Taxe pour la Promotion de l'Industrie
  | 'TCR' // Taxe pour la Circulation Routière
  | 'TE' // Taxe Environnementale
  | 'TAD' // Taxe Administrative
  | 'TRD' // Taxe de Rémunération Directe
  // Cotisations sociales
  | 'CNSS' // Cotisations Sociales CNSS
  | 'INPP' // Institut National de Préparation Professionnelle
  | 'ONEM' // Office National de l'Emploi
  // Autres taxes spécifiques
  | 'TSD' // Taxe de Solidarité pour le Développement
  | 'TPU' // Taxe de Publicité
  | 'TSE' // Taxe sur les Spectacles et Événements
  | 'AUTRES'; // Autres taxes non catégorisées
```

## Types de Déclarations RDC

### Impôts Directs
- **IBP**: Impôt sur les Bénéfices et Profits (30%, annuel, échéance: 31 mars)
- **IPR**: Impôt sur le Revenu Professionnel (15%, mensuel, échéance: 15 du mois suivant)
- **IRCM**: Impôt Réel sur le Chiffre d'Affaires (1%, mensuel, échéance: 15 du mois suivant)
- **IRVM**: Impôt sur les Revenus de Valeurs Mobilières (20%, mensuel, échéance: 15 du mois suivant)
- **IPF**: Impôt Professionnel Forfaitaire (forfaitaire, annuel, échéance: 31 mars)

### Taxes Indirectes
- **TVA**: Taxe sur la Valeur Ajoutée (16%, mensuel, échéance: 15 du mois suivant)
- **TPI**: Taxe pour la Promotion de l'Industrie (1%, mensuel, échéance: 15 du mois suivant)
- **TCR**: Taxe pour la Circulation Routière (variable, annuel, échéance: 31 décembre)
- **TE**: Taxe Environnementale (0.5%, trimestriel, échéance: 15 du mois suivant le trimestre)
- **TAD**: Taxe Administrative (variable, mensuel, échéance: 15 du mois suivant)
- **TRD**: Taxe de Rémunération Directe (5%, mensuel, échéance: 15 du mois suivant)

### Cotisations Sociales
- **CNSS**: Cotisations Sociales CNSS (16.5%, mensuel, échéance: 15 du mois suivant)
- **INPP**: Institut National de Préparation Professionnelle (3%, mensuel, échéance: 15 du mois suivant)
- **ONEM**: Office National de l'Emploi (1.5%, mensuel, échéance: 15 du mois suivant)

### Taxes Spécifiques
- **TSD**: Taxe de Solidarité pour le Développement (1%, trimestriel, échéance: 15 du mois suivant le trimestre)
- **TPU**: Taxe de Publicité (variable, trimestriel, échéance: fin du trimestre)
- **TSE**: Taxe sur les Spectacles et Événements (10%, trimestriel, échéance: fin du trimestre)

## Endpoints

### Get All Declarations

Retrieves all declarations with pagination and filtering.

**URL:** `/declarations`

**Method:** `GET`

**Query Parameters:**
- `type` (optional) - Type de déclaration (IBP, IPR, TVA, etc.)
- `category` (optional) - Catégorie (direct_tax, indirect_tax, social_contribution, special_tax)
- `status` (optional) - Statut (draft, pending, submitted, validated, rejected)
- `period` (optional) - Période de déclaration (YYYY-MM-DD)
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 20, max: 100)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "decl-123",
        "type": "TVA",
        "period": "2024-02-01T00:00:00Z",
        "periodicity": "monthly",
        "dueDate": "2024-03-15T00:00:00Z",
        "status": "validated",
        "amount": 1800000,
        "additionalFees": 50000,
        "penalties": 0,
        "reference": "DCL-TVA-2024-002",
        "submittedAt": "2024-03-10T14:30:00Z",
        "submittedBy": "user-456",
        "validatedAt": "2024-03-12T09:15:00Z",
        "validatedBy": "admin-789",
        "justificationDocument": "/documents/dcl-123-justification.pdf",
        "declarationForm": "/documents/dcl-123-form.pdf",
        "notes": "Déclaration TVA février 2024 - montant calculé automatiquement",
        "attachments": [
          {
            "id": "att-789",
            "name": "bordereau_versement_tva_feb.pdf",
            "type": "justification",
            "url": "/attachments/att-789.pdf",
            "uploadedAt": "2024-03-10T14:35:00Z",
            "size": 245760
          }
        ]
      }
    ],
    "total": 47,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```
      "updatedAt": "2024-03-01T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Créer une Déclaration

Crée une nouvelle déclaration fiscale.

**URL:** `/declarations`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "type": "TVA",
  "period": "2024-03",
  "amount": 2000000,
  "additionalFees": 0,
  "penalties": 0,
  "notes": "Déclaration TVA mars 2024"
}
```

**Response:** `201 Created`

```json
{
  "id": "decl-789",
  "type": "TVA",
  "period": "2024-03",
  "periodicity": "monthly",
  "dueDate": "2024-04-15T00:00:00Z",
  "status": "draft",
  "amount": 2000000,
  "additionalFees": 0,
  "penalties": 0,
  "reference": "TVA-2024-03",
  "notes": "Déclaration TVA mars 2024",
  "createdAt": "2024-04-01T09:00:00Z"
}
```

### Mettre à jour une Déclaration

Met à jour une déclaration existante.

**URL:** `/declarations/{id}`

**Method:** `PUT`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "amount": 2100000,
  "additionalFees": 25000,
  "notes": "Déclaration TVA mars 2024 - Montant corrigé"
}
```

**Response:** `200 OK`

```json
{
  "id": "decl-789",
  "type": "TVA",
  "period": "2024-03",
  "amount": 2100000,
  "additionalFees": 25000,
  "notes": "Déclaration TVA mars 2024 - Montant corrigé",
  "updatedAt": "2024-04-02T14:30:00Z"
}
```

### Soumettre une Déclaration

Soumet une déclaration pour traitement.

**URL:** `/declarations/{id}/submit`

**Method:** `POST`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "id": "decl-789",
  "status": "submitted",
  "submittedAt": "2024-04-02T15:00:00Z",
  "submittedBy": "user@company.com"
}
```

### Valider une Déclaration

Valide une déclaration (réservé aux validateurs DGI).

**URL:** `/declarations/{id}/validate`

**Method:** `POST`

**Authentication Required:** Yes (rôle validateur requis)

**Request Body:**
```json
{
  "validatorId": "DGI-Validator-001"
}
```

**Response:** `200 OK`

```json
{
  "id": "decl-789",
  "status": "validated",
  "validatedAt": "2024-04-03T10:00:00Z",
  "validatedBy": "DGI-Validator-001"
}
```

### Rejeter une Déclaration

Rejette une déclaration avec motif.

**URL:** `/declarations/{id}/reject`

**Method:** `POST`

**Authentication Required:** Yes (rôle validateur requis)

**Request Body:**
```json
{
  "reason": "Justificatif de paiement incomplet"
}
```

**Response:** `200 OK`

```json
{
  "id": "decl-789",
  "status": "rejected",
  "rejectedAt": "2024-04-03T11:00:00Z",
  "rejectionReason": "Justificatif de paiement incomplet"
}
```

## Gestion des Documents

### Téléverser un Justificatif

Téléverse le justificatif de paiement (PDF obligatoire).

**URL:** `/declarations/{id}/justification`

**Method:** `POST`

**Authentication Required:** Yes

**Content-Type:** `multipart/form-data`

**Form Data:**
- `justification` (file) - Fichier PDF du justificatif

**Response:** `200 OK`

```json
{
  "url": "/documents/decl-789-justification.pdf"
}
```

### Téléverser un Formulaire de Déclaration

Téléverse le formulaire de déclaration rempli (PDF optionnel).

**URL:** `/declarations/{id}/declaration-form`

**Method:** `POST`

**Authentication Required:** Yes

**Content-Type:** `multipart/form-data`

**Form Data:**
- `declaration_form` (file) - Fichier PDF du formulaire

**Response:** `200 OK`

```json
{
  "url": "/documents/decl-789-form.pdf"
}
```

### Téléverser une Pièce Jointe

Ajoute une pièce jointe supplémentaire.

**URL:** `/declarations/{id}/attachments`

**Method:** `POST`

**Authentication Required:** Yes

**Content-Type:** `multipart/form-data`

**Form Data:**
- `attachment` (file) - Fichier à joindre
- `type` (string) - Type ('justification', 'declaration_form', 'supporting_document', 'receipt')

**Response:** `200 OK`

```json
{
  "id": "att-101",
  "name": "recu_bancaire.pdf",
  "type": "supporting_document",
  "url": "/attachments/att-101.pdf",
  "uploadedAt": "2024-04-01T14:00:00Z",
  "size": 156789
}
```

### Obtenir les Pièces Jointes

Récupère la liste des pièces jointes d'une déclaration.

**URL:** `/declarations/{id}/attachments`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
[
  {
    "id": "att-101",
    "name": "recu_bancaire.pdf",
    "type": "supporting_document",
    "url": "/attachments/att-101.pdf",
    "uploadedAt": "2024-04-01T14:00:00Z",
    "size": 156789
  }
]
```

## Téléchargements

### Télécharger une Déclaration

Génère et télécharge une déclaration au format spécifié.

**URL:** `/declarations/{id}/download`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `format` (required) - Format ('pdf' ou 'excel')

**Response:** `200 OK`

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="declaration-TVA-2024-03.pdf"

[Binary PDF content]
```

### Télécharger un Document

Télécharge un document spécifique (justificatif, formulaire, pièce jointe).

**URL:** `/declarations/{id}/justification/download`
**URL:** `/declarations/{id}/declaration-form/download`
**URL:** `/declarations/{id}/attachments/{attachmentId}/download`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="justificatif.pdf"

[Binary content]
```

## Statistiques

### Obtenir les Statistiques

Récupère les statistiques des déclarations.

**URL:** `/declarations/statistics`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `period` (optional) - Période d'analyse (ex: "2024-Q1", "2024")

**Response:** `200 OK`

```json
{
  "totalDeclarations": 156,
  "totalAmount": 45000000,
  "byStatus": {
    "draft": 12,
    "pending": 8,
    "submitted": 25,
    "validated": 108,
    "rejected": 3
  },
  "byType": {
    "TVA": 48,
    "IBP": 12,
    "IPR": 48,
    "CNSS": 36,
    "TPI": 12
  },
  "overdueCount": 5
}
```

## Templates

### Obtenir un Modèle de Déclaration

Télécharge le modèle de formulaire pour un type de déclaration.

**URL:** `/declarations/templates/{type}`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="template-TVA.pdf"

[Template PDF content]
```

## Validation

### Valider les Données

Valide les données d'une déclaration avant création/mise à jour.

**URL:** `/declarations/validate`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "type": "TVA",
  "period": "2024-03",
  "amount": 2000000
}
```

**Response:** `200 OK`

```json
{
  "valid": true,
  "errors": []
}
```

**Response si erreurs:** `200 OK`

```json
{
  "valid": false,
  "errors": [
    "Le montant ne peut pas être négatif",
    "La période ne peut pas être future"
  ]
}
```

## Structures de Données

### Déclaration

```typescript
interface Declaration {
  id: string;
  type: DeclarationType;
  period: string;
  periodicity: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  dueDate: string;
  status: 'draft' | 'pending' | 'submitted' | 'validated' | 'rejected';
  amount: number;
  additionalFees?: number;
  penalties?: number;
  reference?: string;
  justificationDocument?: string;
  declarationForm?: string;
  notes?: string;
  attachments?: DeclarationAttachment[];
  submittedAt?: string;
  submittedBy?: string;
  validatedAt?: string;
  validatedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Pièce Jointe

```typescript
interface DeclarationAttachment {
  id: string;
  name: string;
  type: 'justification' | 'declaration_form' | 'supporting_document' | 'receipt';
  url: string;
  uploadedAt: string;
  size: number;
}
```

## Statuts de Déclaration

- **draft**: Brouillon en cours de préparation
- **pending**: Prête à être soumise, en attente
- **submitted**: Soumise aux autorités fiscales
- **validated**: Validée et acceptée par la DGI
- **rejected**: Rejetée, corrections nécessaires

## Gestion des Erreurs

Toutes les erreurs suivent la même structure de réponse:

**Response:** `400 Bad Request` / `401 Unauthorized` / `403 Forbidden` / `404 Not Found` / `422 Unprocessable Entity` / `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": {
    "field_name": ["Erreur spécifique pour ce champ"]
  }
}
```

## Notes d'Implémentation

- Tous les montants sont en Francs Congolais (CDF)
- Les justificatifs PDF sont obligatoires avant soumission
- Les échéances sont calculées automatiquement selon le type de déclaration
- Le système respecte la nomenclature fiscale SYSCOHADA/OHADA
- Les validations métier empêchent les soumissions incomplètes
- L'historique des modifications est conservé pour audit
