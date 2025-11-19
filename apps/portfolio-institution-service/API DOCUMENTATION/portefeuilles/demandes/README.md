# API des Demandes de Crédit - Portefeuille Traditionnel

Cette API permet de gérer les demandes de crédit dans le cadre des portefeuilles traditionnels, incluant la création, la consultation, l'analyse, l'approbation ou le rejet des demandes de crédit.

## Points d'accès

### Liste des demandes de crédit

Récupère la liste des demandes de crédit pour un portefeuille traditionnel spécifique.

**Endpoint** : `GET /portfolios/traditional/credit-requests`

**Paramètres de requête** :
- `portfolioId` (optionnel) : Identifiant unique du portefeuille traditionnel
- `status` (optionnel) : Filtre par statut (draft, submitted, under_review, pending, analysis, approved, rejected, canceled, disbursed, active, closed, defaulted, restructured, consolidated, in_litigation)
- `clientId` (optionnel) : Filtre par identifiant du membre (memberId)
- `productType` (optionnel) : Filtre par type de produit (productId)
- `dateFrom` (optionnel) : Filtre par date de création (début)
- `dateTo` (optionnel) : Filtre par date de création (fin)
- `search` (optionnel) : Recherche textuelle
- `sortBy` (optionnel) : Trier par (createdAt, requestAmount, memberId)
- `sortOrder` (optionnel) : Ordre de tri (asc, desc)

**Réponse réussie** (200 OK) :

```json
[
  {
    "id": "req-001",
    "memberId": "mem-001",
    "productId": "prod-001",
    "receptionDate": "2023-07-15",
    "requestAmount": 50000,
    "periodicity": "monthly",
    "interestRate": 8.5,
    "reason": "Expansion des activités commerciales et ouverture d'une nouvelle boutique",
    "scheduleType": "constant",
    "schedulesCount": 12,
    "deferredPaymentsCount": 0,
    "financingPurpose": "Achat de stocks et aménagement de local",
    "creditManagerId": "mgr-001",
    "isGroup": false,
    "documents": [
      {
        "id": "doc-001",
        "name": "Plan d'affaires.pdf",
        "type": "business_plan",
        "url": "/documents/plan-affaires-mem001.pdf",
        "size": 2457600,
        "mimeType": "application/pdf",
        "uploadedAt": "2023-07-15T09:00:00Z"
      },
      {
        "id": "doc-002",
        "name": "Bilans financiers 2022-2023.pdf",
        "type": "financial_statements",
        "url": "/documents/bilans-mem001.pdf",
        "size": 1843200,
        "mimeType": "application/pdf",
        "uploadedAt": "2023-07-15T09:15:00Z"
      }
    ],
    "status": "pending",
    "createdAt": "2023-07-15T09:30:45Z",
    "updatedAt": "2023-07-15T09:30:45Z"
  },
  {
    "id": "req-002",
    "memberId": "mem-002",
    "productId": "prod-002",
    "receptionDate": "2023-06-22",
    "requestAmount": 75000,
    "periodicity": "monthly",
    "interestRate": 7.25,
    "reason": "Acquisition d'équipements de construction pour de nouveaux contrats",
    "scheduleType": "constant",
    "schedulesCount": 24,
    "deferredPaymentsCount": 0,
    "financingPurpose": "Achat d'équipements de construction",
    "creditManagerId": "mgr-002",
    "isGroup": false,
    "status": "analysis",
    "createdAt": "2023-06-22T14:15:30Z",
    "updatedAt": "2023-07-01T10:25:15Z"
  }
]
```

### Détails d'une demande de crédit

Récupère les détails complets d'une demande de crédit spécifique.

**Endpoint** : `GET /portfolios/traditional/credit-requests/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de crédit

**Réponse réussie** (200 OK) :

```json
{
  "id": "req-003",
  "memberId": "mem-003",
  "productId": "prod-003",
  "receptionDate": "2023-05-10",
  "requestAmount": 120000,
  "periodicity": "monthly",
  "interestRate": 6.75,
  "reason": "Développement d'un nouveau produit technologique",
  "scheduleType": "degressive",
  "schedulesCount": 36,
  "deferredPaymentsCount": 3,
  "gracePeriod": 2,
  "financingPurpose": "R&D et prototypage",
  "creditManagerId": "mgr-003",
  "isGroup": false,
  "status": "approved",
  "createdAt": "2023-05-10T11:20:05Z",
  "updatedAt": "2023-06-15T16:45:30Z"
```

### Création d'une demande de crédit

Crée une nouvelle demande de crédit.

**Endpoint** : `POST /portfolios/traditional/credit-requests`

**Corps de la requête** :

```json
{
  "memberId": "mem-004",
  "productId": "prod-001",
  "receptionDate": "2025-08-03",
  "requestAmount": 50000,
  "periodicity": "monthly",
  "interestRate": 8.5,
  "reason": "Expansion des activités commerciales",
  "scheduleType": "constant",
  "schedulesCount": 12,
  "deferredPaymentsCount": 0,
  "financingPurpose": "Achat de stocks et aménagement de local",
  "creditManagerId": "mgr-001",
  "isGroup": false,
  "gracePeriod": 0
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174006",
    "memberId": "mem-004",
    "productId": "prod-001",
    "receptionDate": "2025-08-03",
    "requestAmount": 50000,
    "periodicity": "monthly",
    "interestRate": 8.5,
    "reason": "Expansion des activités commerciales",
    "scheduleType": "constant",
    "schedulesCount": 12,
    "deferredPaymentsCount": 0,
    "financingPurpose": "Achat de stocks et aménagement de local",
    "creditManagerId": "mgr-001",
    "isGroup": false,
    "portfolioId": null,
    "currency": "XOF",
    "status": "draft",
    "metadata": {
      "sourceRequestId": null,
      "syncedFrom": null
    },
    "createdAt": "2025-08-03T10:30:00.000Z",
    "updatedAt": "2025-08-03T10:30:00.000Z"
  }
}
```

### Mise à jour d'une demande de crédit

Met à jour les informations d'une demande de crédit existante.

**Endpoint** : `PUT /portfolios/traditional/credit-requests/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de crédit

**Corps de la requête** (champs optionnels) :

```json
{
  "requestAmount": 55000,
  "periodicity": "monthly",
  "interestRate": 8.0,
  "reason": "Expansion des activités commerciales et recrutement",
  "schedulesCount": 15,
  "financingPurpose": "Achat de matériel, extension d'activité et recrutement"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "req-001",
  "memberId": "mem-001",
  "productId": "prod-001",
  "receptionDate": "2023-07-15",
  "requestAmount": 55000,
  "periodicity": "monthly",
  "interestRate": 8.0,
  "reason": "Expansion des activités commerciales et recrutement",
  "scheduleType": "constant",
  "schedulesCount": 15,
  "deferredPaymentsCount": 0,
  "financingPurpose": "Achat de matériel, extension d'activité et recrutement",
  "creditManagerId": "mgr-001",
  "isGroup": false,
  "status": "pending",
  "createdAt": "2023-07-15T09:30:45Z",
  "updatedAt": "2025-08-03T12:15:00.000Z"
}
```

### Changement de statut d'une demande

Met à jour le statut d'une demande de crédit.

**Endpoint** : `PATCH /portfolios/traditional/credit-requests/{id}/status`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de crédit

**Corps de la requête** :

```json
{
  "status": "approved"
}
```

**Statuts valides** :
- `draft` : Brouillon
- `submitted` : Soumise
- `under_review` : En revue
- `pending` : En attente
- `analysis` : En analyse
- `approved` : Approuvée
- `rejected` : Rejetée
- `canceled` : Annulée
- `disbursed` : Décaissée
- `active` : Active
- `closed` : Fermée
- `defaulted` : En défaut
- `restructured` : Restructurée
- `consolidated` : Consolidée
- `in_litigation` : En litige

**Réponse réussie** (200 OK) :

```json
{
  "id": "req-001",
  "memberId": "mem-001",
  "productId": "prod-001",
  "receptionDate": "2023-07-15",
  "requestAmount": 50000,
  "periodicity": "monthly",
  "interestRate": 8.5,
  "reason": "Expansion des activités commerciales et ouverture d'une nouvelle boutique",
  "scheduleType": "constant",
  "schedulesCount": 12,
  "deferredPaymentsCount": 0,
  "financingPurpose": "Achat de stocks et aménagement de local",
  "creditManagerId": "mgr-001",
  "isGroup": false,
  "status": "approved",
  "createdAt": "2023-07-15T09:30:45Z",
  "updatedAt": "2025-08-03T14:30:00.000Z"
}
```

### Suppression d'une demande de crédit

Supprime définitivement une demande de crédit.

**Endpoint** : `DELETE /portfolios/traditional/credit-requests/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de crédit

**Réponse réussie** (204 No Content) : Corps vide

**Réponse d'erreur** (404 Not Found) :

```json
{
  "error": "Credit request not found",
  "message": "La demande de crédit avec l'ID spécifié n'existe pas",
  "code": "CREDIT_REQUEST_NOT_FOUND"
}
```

### Réinitialisation des données (développement/test)

Remet les demandes de crédit aux données d'exemple initiales.

**Endpoint** : `POST /portfolios/traditional/credit-requests/reset`

**Réponse réussie** (200 OK) :

```json
[
  {
    "id": "req-001",
    "memberId": "mem-001",
    "productId": "prod-001",
    "receptionDate": "2023-07-15",
    "requestAmount": 50000,
    "periodicity": "monthly",
    "interestRate": 8.5,
    "reason": "Expansion des activités commerciales et ouverture d'une nouvelle boutique",
    "scheduleType": "constant",
    "schedulesCount": 12,
    "deferredPaymentsCount": 0,
    "financingPurpose": "Achat de stocks et aménagement de local",
    "creditManagerId": "mgr-001",
    "isGroup": false,
    "status": "pending",
    "createdAt": "2023-07-15T09:30:45Z",
    "updatedAt": "2023-07-15T09:30:45Z"
  }
  // ... autres demandes d'exemple
]
```

## Structure de données complète

### Objet CreditRequest

```typescript
interface CreditRequest {
  id: string;
  memberId: string;                    // ID du membre/client
  productId: string;                   // ID du produit financier
  receptionDate: string;               // Date de réception de la demande
  requestAmount: number;               // Montant demandé
  currency: string;                    // Devise (ex: XOF, USD, EUR)
  periodicity: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  interestRate: number;                // Taux d'intérêt
  reason: string;                      // Motif de la demande
  scheduleType: 'constant' | 'degressive';  // Type d'échéancier
  schedulesCount: number;              // Nombre d'échéances
  deferredPaymentsCount: number;       // Nombre de paiements différés
  gracePeriod?: number;                // Période de grâce (optionnel)
  financingPurpose: string;            // Objet du financement
  creditManagerId: string;             // ID du gestionnaire de crédit
  status: CreditRequestStatus;         // Statut de la demande
  isGroup: boolean;                    // Demande de groupe ou individuelle
  groupId?: string;                    // ID du groupe (si applicable)
  distributions?: CreditDistribution[]; // Distributions (si groupe)
  documents?: CreditDocument[];        // Documents et pièces jointes
  rejectionReason?: string;            // Raison du rejet (si applicable)
  portfolioId?: string;                // ID du portefeuille associé
  metadata?: CreditRequestMetadata;    // Métadonnées de synchronisation
  createdAt: string;                   // Date de création (ISO)
  updatedAt?: string;                  // Date de mise à jour (ISO)
}

interface CreditRequestMetadata {
  sourceRequestId?: string;            // ID de la demande source (gestion commerciale)
  syncedFrom?: string;                 // Service source (ex: 'gestion_commerciale')
  businessInformation?: any;           // Informations commerciales
  financialInformation?: any;          // Informations financières
  creditScore?: any;                   // Score de crédit
  firstSyncAt?: string;                // Date de première synchronisation
  lastSyncAt?: string;                 // Date de dernière synchronisation
}

interface CreditDistribution {
  id: string;
  creditRequestId: string;
  memberId: string;
  amount: number;
  createdAt: string;
}

interface CreditDocument {
  id: string;
  name: string;
  type: 'business_plan' | 'financial_statements' | 'identity_document' | 'proof_of_address' | 'tax_certificate' | 'bank_statements' | 'project_file' | 'guarantee_document' | 'other';
  url: string;
  size?: number;                       // Taille en bytes
  mimeType?: string;                   // Type MIME (application/pdf, image/jpeg, etc.)
  uploadedBy?: string;                 // ID de l'utilisateur qui a uploadé
  uploadedAt: string;                  // Date d'upload (ISO 8601)
  description?: string;                // Description optionnelle
}
```

### Types de statut

```typescript
type CreditRequestStatus = 
  | 'draft'           // Brouillon
  | 'submitted'       // Soumise
  | 'under_review'    // En revue
  | 'pending'         // En attente
  | 'analysis'        // En analyse
  | 'approved'        // Approuvée
  | 'rejected'        // Rejetée
  | 'canceled'        // Annulée
  | 'disbursed'       // Décaissée
  | 'active'          // Active
  | 'closed'          // Fermée
  | 'defaulted'       // En défaut
  | 'restructured'    // Restructurée
  | 'consolidated'    // Consolidée
  | 'in_litigation';  // En litige

type CreditPeriodicity = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual';
```

## Gestion des documents

### Ajout d'un document à une demande de crédit

Ajoute un nouveau document à une demande de crédit existante.

**Endpoint** : `POST /portfolios/traditional/credit-requests/{id}/documents`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de crédit

**Corps de la requête** :

```json
{
  "name": "Bilan actualisé",
  "type": "financial_statements",
  "content": "base64_encoded_content",
  "mimeType": "application/pdf",
  "description": "Bilan actualisé pour le premier semestre 2025"
}
```

**Types de documents valides** :
- `business_plan` : Plan d'affaires
- `financial_statements` : États financiers
- `identity_document` : Pièce d'identité
- `proof_of_address` : Justificatif de domicile
- `tax_certificate` : Attestation fiscale
- `bank_statements` : Relevés bancaires
- `project_file` : Dossier de projet
- `guarantee_document` : Document de garantie
- `other` : Autre type de document

**Réponse réussie** (201 Created) :

```json
{
  "id": "doc-011",
  "name": "Bilan actualisé",
  "type": "financial_statements",
  "url": "/documents/bilan-actualise-mem001.pdf",
  "size": 1536000,
  "mimeType": "application/pdf",
  "uploadedAt": "2025-07-25T15:30:00.000Z",
  "description": "Bilan actualisé pour le premier semestre 2025"
}
```

### Récupérer les documents d'une demande

Récupère tous les documents associés à une demande de crédit.

**Endpoint** : `GET /portfolios/traditional/credit-requests/{id}/documents`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de crédit

**Réponse réussie** (200 OK) :

```json
[
  {
    "id": "doc-001",
    "name": "Plan d'affaires.pdf",
    "type": "business_plan",
    "url": "/documents/plan-affaires-mem001.pdf",
    "size": 2457600,
    "mimeType": "application/pdf",
    "uploadedBy": "user-123",
    "uploadedAt": "2023-07-15T09:00:00Z",
    "description": "Plan d'affaires détaillé pour l'expansion"
  },
  {
    "id": "doc-002",
    "name": "Bilans financiers 2022-2023.pdf",
    "type": "financial_statements",
    "url": "/documents/bilans-mem001.pdf",
    "size": 1843200,
    "mimeType": "application/pdf",
    "uploadedAt": "2023-07-15T09:15:00Z"
  }
]
```

### Supprimer un document

Supprime un document d'une demande de crédit.

**Endpoint** : `DELETE /portfolios/traditional/credit-requests/{id}/documents/{documentId}`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de crédit
- `documentId` : Identifiant unique du document

**Réponse réussie** (204 No Content) : Corps vide

---

## Gestion des erreurs

Toutes les réponses d'erreur suivent le format standard :

```json
{
  "error": "Error type",
  "message": "Description de l'erreur en français",
  "code": "ERROR_CODE",
  "details": {}  // Optionnel, détails supplémentaires
}
```

**Codes d'erreur courants** :
- `CREDIT_REQUEST_NOT_FOUND` (404) : Demande de crédit introuvable
- `INVALID_CREDIT_REQUEST_DATA` (400) : Données de demande invalides
- `CREDIT_REQUEST_ALREADY_PROCESSED` (409) : Demande déjà traitée
- `INSUFFICIENT_PERMISSIONS` (403) : Permissions insuffisantes
- `DOCUMENT_UPLOAD_FAILED` (500) : Échec de l'upload du document
- `DOCUMENT_NOT_FOUND` (404) : Document introuvable

---

## 📋 Métadonnées de Synchronisation Inter-Services

Le champ `metadata` est critique pour l'intégration avec `gestion-commerciale-service`. Il maintient la traçabilité des demandes synchronisées.

**Structure:**
```json
{
  "sourceRequestId": "uuid",
  "syncedFrom": "gestion-commerciale-service",
  "creditScore": { "score": 75, "riskLevel": "MEDIUM" }
}
```
