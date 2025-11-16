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

### Mise à jour d'une demande de financement

Met à jour les informations d'une demande de financement existante.

**Endpoint** : `PUT /portfolios/traditional/funding-requests/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "amount": 55000.00,
  "purpose": "Achat de matériel, extension d'activité et recrutement",
  "duration": 15,
  "financial_data": {
    "annual_revenue": 260000.00,
    "net_profit": 78000.00
  }
}
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
  "recommended_duration": 15,
  "recommended_rate": 12.5,
  "comments": "Client avec un historique de crédit solide et une bonne gestion financière."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "status": "under_review",
  "risk_analysis": {
    "credit_score": 85,
    "risk_level": "low",
    "debt_service_ratio": 0.30,
    "analysis_date": "2025-07-25T13:00:00.000Z",
    "analyst_id": "USER-00001",
    "recommended_action": "approve",
    "recommended_amount": 55000.00,
    "recommended_duration": 15,
    "recommended_rate": 12.5,
    "comments": "Client avec un historique de crédit solide et une bonne gestion financière."
  },
  "updated_at": "2025-07-25T13:00:00.000Z"
}
```

### Approbation d'une demande

Approuve une demande de financement après analyse.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/approve`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

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

### Rejet d'une demande

Rejette une demande de financement.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/reject`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "reason": "Ratio d'endettement trop élevé",
  "comments": "Le client présente un ratio d'endettement supérieur à nos critères d'acceptation.",
  "suggestions": "Possibilité de soumettre une nouvelle demande avec un montant réduit ou des garanties supplémentaires."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "status": "rejected",
  "rejection_details": {
    "rejected_by": "USER-00003",
    "rejection_date": "2025-07-25T14:00:00.000Z",
    "reason": "Ratio d'endettement trop élevé",
    "comments": "Le client présente un ratio d'endettement supérieur à nos critères d'acceptation.",
    "suggestions": "Possibilité de soumettre une nouvelle demande avec un montant réduit ou des garanties supplémentaires."
  },
  "updated_at": "2025-07-25T14:00:00.000Z"
}
```

### Annulation d'une demande

Annule une demande de financement en cours.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/cancel`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "reason": "Annulation à la demande du client",
  "comments": "Le client a trouvé un autre moyen de financement."
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "FR-00001",
  "portfolio_id": "TP-00001",
  "request_number": "REQ-2025-001",
  "status": "canceled",
  "cancellation_details": {
    "canceled_by": "USER-00003",
    "cancellation_date": "2025-07-25T14:30:00.000Z",
    "reason": "Annulation à la demande du client",
    "comments": "Le client a trouvé un autre moyen de financement."
  },
  "updated_at": "2025-07-25T14:30:00.000Z"
}
```

### Ajout d'un document à une demande

Ajoute un nouveau document à une demande de financement existante.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/documents`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "name": "Bilan actualisé",
  "type": "updated_balance_sheet",
  "content": "base64_encoded_content",
  "contentType": "application/pdf",
  "description": "Bilan actualisé pour le premier semestre 2025"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "id": "DOC-00003",
  "name": "Bilan actualisé",
  "type": "updated_balance_sheet",
  "url": "https://example.com/documents/bilan-actualise-abc.pdf",
  "created_at": "2025-07-25T15:30:00.000Z"
}
```

### Création d'un contrat à partir d'une demande

Crée un contrat de crédit basé sur une demande de financement approuvée.

**Endpoint** : `POST /portfolios/traditional/funding-requests/{id}/create-contract`

**Paramètres de chemin** :
- `id` : Identifiant unique de la demande de financement

**Corps de la requête** :

```json
{
  "start_date": "2025-08-01",
  "terms": "Ce contrat est soumis aux conditions générales de crédit de l'institution..."
}
```

**Réponse réussie** (201 Created) :

```json
{
  "contract_id": "CC-00001",
  "contract_number": "CONT-2025-001"
}
```

### Statistiques des demandes par portefeuille

Récupère des statistiques sur les demandes de financement d'un portefeuille traditionnel.

**Endpoint** : `GET /portfolios/traditional/{portfolioId}/funding-requests/stats`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel

**Réponse réussie** (200 OK) :

```json
{
  "total_requests": 35,
  "by_status": [
    {
      "status": "approved",
      "count": 15
    },
    {
      "status": "pending",
      "count": 8
    }
  ]
}
```

## Modèles de données

### Demande de financement
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique de la demande |
| portfolio_id | string | Identifiant du portefeuille traditionnel |
| request_number | string | Numéro de référence de la demande |
| client_id | string | Identifiant du client |
| company_name | string | Nom de l'entreprise cliente |
| product_type | string | Type de produit financier demandé |
| amount | number | Montant demandé |
| currency | string | Devise du montant |
| purpose | string | Objet du financement |
| duration | number | Durée souhaitée du financement |
| duration_unit | string | Unité de la durée (months, years) |
| proposed_start_date | string | Date de début souhaitée (format ISO) |
| status | string | Statut de la demande ('pending', 'under_review', 'approved', 'rejected', 'canceled', 'disbursed') |
| status_date | string | Date du dernier changement de statut |
| assigned_to | string | Identifiant de l'analyste assigné |
| financial_data | object | Données financières fournies |
| proposed_guarantees | array | Garanties proposées |
| documents | array | Documents fournis avec la demande |
| risk_analysis | object | Résultats de l'analyse de risque |
| approval_details | object | Détails de l'approbation (si applicable) |
| rejection_details | object | Détails du rejet (si applicable) |
| cancellation_details | object | Détails de l'annulation (si applicable) |
| contract_id | string | Identifiant du contrat créé (si applicable) |
| created_at | string | Date de création (format ISO) |
| updated_at | string | Date de dernière modification (format ISO) |

### Données financières
| Champ | Type | Description |
|-------|------|-------------|
| annual_revenue | number | Chiffre d'affaires annuel |
| net_profit | number | Bénéfice net |
| existing_debts | number | Dettes existantes |
| cash_flow | number | Flux de trésorerie mensuel |
| assets | number | Valeur totale des actifs |
| liabilities | number | Valeur totale des passifs |

### Garantie proposée
| Champ | Type | Description |
|-------|------|-------------|
| type | string | Type de garantie (ex: "real_estate", "equipment") |
| description | string | Description détaillée de la garantie |
| estimated_value | number | Valeur estimée de la garantie |
| currency | string | Devise de la valeur |

### Document
| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du document |
| name | string | Nom du document |
| type | string | Type de document (ex: "business_plan", "financial_statements") |
| url | string | URL d'accès au document |
| created_at | string | Date de création/téléchargement (format ISO) |

### Analyse de risque
| Champ | Type | Description |
|-------|------|-------------|
| credit_score | number | Score de crédit attribué (0-100) |
| risk_level | string | Niveau de risque évalué (low, medium, high) |
| debt_service_ratio | number | Ratio de service de la dette calculé |
| analysis_date | string | Date de l'analyse (format ISO) |
| analyst_id | string | Identifiant de l'analyste |
| recommended_action | string | Action recommandée (approve, reject) |
| recommended_amount | number | Montant recommandé pour approbation |
| recommended_duration | number | Durée recommandée |
| recommended_rate | number | Taux d'intérêt recommandé |
| comments | string | Commentaires de l'analyste |

### Détails d'approbation
| Champ | Type | Description |
|-------|------|-------------|
| approved_by | string | Identifiant de l'approbateur |
| approval_date | string | Date d'approbation (format ISO) |
| approved_amount | number | Montant approuvé |
| approved_duration | number | Durée approuvée |
| approved_rate | number | Taux d'intérêt approuvé |
| conditions | string | Conditions particulières d'approbation |
| comments | string | Commentaires de l'approbateur |

### Détails de rejet
| Champ | Type | Description |
|-------|------|-------------|
| rejected_by | string | Identifiant de la personne ayant rejeté la demande |
| rejection_date | string | Date de rejet (format ISO) |
| reason | string | Raison principale du rejet |
| comments | string | Commentaires détaillés |
| suggestions | string | Suggestions pour une éventuelle nouvelle demande |

### Détails d'annulation
| Champ | Type | Description |
|-------|------|-------------|
| canceled_by | string | Identifiant de la personne ayant annulé la demande |
| cancellation_date | string | Date d'annulation (format ISO) |
| reason | string | Raison de l'annulation |
| comments | string | Commentaires détaillés |

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
