# API des Remboursements (Payments API)

Cette API permet de gérer les remboursements de prêts dans le portefeuille traditionnel.

## Structure des Données

### CreditPayment (Remboursement de Crédit)

```typescript
interface CreditPayment {
  id: string;
  contract_id: string;
  portfolio_id: string;
  client_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  transaction_reference?: string; // Référence de la transaction bancaire
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_type: 'principal' | 'interest' | 'penalty' | 'mixed';
  payment_details?: {
    principal_amount: number;
    interest_amount: number;
    penalty_amount: number;
  };
  scheduled_payment_id?: string;
  notes?: string;
  receipt_url?: string; // URL du justificatif de paiement
  supporting_document_url?: string; // URL de la pièce justificative
  has_supporting_document?: boolean; // Indique si une pièce justificative est disponible
  description?: string; // Description du paiement
  created_at: string;
  updated_at: string;
  cancellation_reason?: string; // Raison d'annulation
  cancellation_date?: string; // Date d'annulation
  
  // Nouveaux champs
  due_date?: string; // Date d'échéance prévue
  remaining_amount?: number; // Montant restant à payer
  remaining_percentage?: number; // Pourcentage du montant restant
  slippage?: number; // Glissement en jours (positif = retard, négatif = avance)
  installment_number?: number; // Numéro de l'échéance
  total_installments?: number; // Nombre total d'échéances
}
```

## Points d'API

### Récupérer les Remboursements par Contrat

```
GET /portfolios/traditional/credit-contracts/:contractId/payments
```

Récupère tous les remboursements associés à un contrat spécifique.

#### Paramètres

- `contractId` (chemin) : ID du contrat de crédit

#### Réponse

```json
{
  "status": "success",
  "data": [
    {
      "id": "PAY-00001",
      "contract_id": "CRDT-100001",
      "portfolio_id": "qf3081zdd",
      "client_id": "PME Agro Sarl",
      "payment_date": "2025-08-01T00:00:00Z",
      "amount": 1250000,
      "payment_method": "virement",
      "payment_reference": "VIR-REMB-PME-08010001",
      "transaction_reference": "TRX-PMEAGRO-001",
      "status": "pending",
      "payment_type": "mixed",
      "payment_details": {
        "principal_amount": 1125000,
        "interest_amount": 125000,
        "penalty_amount": 0
      },
      "created_at": "2025-07-01T10:00:00Z",
      "updated_at": "2025-07-01T10:00:00Z",
      "due_date": "2025-08-01T00:00:00Z",
      "remaining_amount": 1250000,
      "remaining_percentage": 100,
      "slippage": 0,
      "installment_number": 1,
      "total_installments": 12
    }
  ]
}
```

### Récupérer un Remboursement par ID

```
GET /portfolios/traditional/payments/:id
```

Récupère les détails d'un remboursement spécifique.

#### Paramètres

- `id` (chemin) : ID du remboursement

#### Réponse

```json
{
  "status": "success",
  "data": {
    "id": "PAY-00001",
    "contract_id": "CRDT-100001",
    "portfolio_id": "qf3081zdd",
    "client_id": "PME Agro Sarl",
    "payment_date": "2025-08-01T00:00:00Z",
    "amount": 1250000,
    "payment_method": "virement",
    "payment_reference": "VIR-REMB-PME-08010001",
    "transaction_reference": "TRX-PMEAGRO-001",
    "status": "pending",
    "payment_type": "mixed",
    "payment_details": {
      "principal_amount": 1125000,
      "interest_amount": 125000,
      "penalty_amount": 0
    },
    "created_at": "2025-07-01T10:00:00Z",
    "updated_at": "2025-07-01T10:00:00Z",
    "due_date": "2025-08-01T00:00:00Z",
    "remaining_amount": 1250000,
    "remaining_percentage": 100,
    "slippage": 0,
    "installment_number": 1,
    "total_installments": 12
  }
}
```

### Enregistrer un Nouveau Remboursement

```
POST /portfolios/traditional/payments
```

Crée un nouveau remboursement dans le système.

#### Corps de la Requête

```json
{
  "contract_id": "CRDT-100001",
  "portfolio_id": "qf3081zdd",
  "client_id": "PME Agro Sarl",
  "payment_date": "2025-08-01T00:00:00Z",
  "amount": 1250000,
  "payment_method": "virement",
  "payment_reference": "VIR-REMB-PME-08010001",
  "transaction_reference": "TRX-PMEAGRO-001",
  "status": "completed",
  "payment_type": "mixed",
  "payment_details": {
    "principal_amount": 1125000,
    "interest_amount": 125000,
    "penalty_amount": 0
  },
  "due_date": "2025-08-01T00:00:00Z",
  "installment_number": 1,
  "total_installments": 12
}
```

#### Réponse

```json
{
  "status": "success",
  "data": {
    "id": "PAY-00001",
    "contract_id": "CRDT-100001",
    "portfolio_id": "qf3081zdd",
    "client_id": "PME Agro Sarl",
    "payment_date": "2025-08-01T00:00:00Z",
    "amount": 1250000,
    "payment_method": "virement",
    "payment_reference": "VIR-REMB-PME-08010001",
    "transaction_reference": "TRX-PMEAGRO-001",
    "status": "completed",
    "payment_type": "mixed",
    "payment_details": {
      "principal_amount": 1125000,
      "interest_amount": 125000,
      "penalty_amount": 0
    },
    "created_at": "2025-08-01T10:00:00Z",
    "updated_at": "2025-08-01T10:00:00Z",
    "due_date": "2025-08-01T00:00:00Z",
    "remaining_amount": 0,
    "remaining_percentage": 0,
    "slippage": 0,
    "installment_number": 1,
    "total_installments": 12
  }
}
```

### Mettre à Jour un Remboursement

```
PUT /portfolios/traditional/payments/:id
```

Met à jour les informations d'un remboursement existant.

#### Paramètres

- `id` (chemin) : ID du remboursement

#### Corps de la Requête

```json
{
  "status": "completed",
  "payment_date": "2025-08-01T09:30:00Z",
  "payment_method": "virement",
  "payment_reference": "VIR-REMB-PME-08010001",
  "transaction_reference": "TRX-PMEAGRO-001"
}
```

#### Réponse

```json
{
  "status": "success",
  "data": {
    "id": "PAY-00001",
    "contract_id": "CRDT-100001",
    "portfolio_id": "qf3081zdd",
    "client_id": "PME Agro Sarl",
    "payment_date": "2025-08-01T09:30:00Z",
    "amount": 1250000,
    "payment_method": "virement",
    "payment_reference": "VIR-REMB-PME-08010001",
    "transaction_reference": "TRX-PMEAGRO-001",
    "status": "completed",
    "payment_type": "mixed",
    "payment_details": {
      "principal_amount": 1125000,
      "interest_amount": 125000,
      "penalty_amount": 0
    },
    "created_at": "2025-07-01T10:00:00Z",
    "updated_at": "2025-08-01T09:30:00Z",
    "due_date": "2025-08-01T00:00:00Z",
    "remaining_amount": 0,
    "remaining_percentage": 0,
    "slippage": 0,
    "installment_number": 1,
    "total_installments": 12
  }
}
```

### Télécharger un Justificatif de Paiement

```
POST /portfolios/traditional/payments/:id/upload-receipt
```

Télécharge un justificatif de paiement pour un remboursement.

#### Paramètres

- `id` (chemin) : ID du remboursement

#### Corps de la Requête

Formulaire multipart avec un champ `receipt` contenant le fichier PDF.

#### Réponse

```json
{
  "status": "success",
  "data": {
    "receipt_url": "https://example.com/receipts/PAY-00001.pdf"
  }
}
```

### Récupérer un Justificatif de Paiement

```
GET /portfolios/traditional/payments/:id/receipt
```

Récupère l'URL du justificatif de paiement pour un remboursement.

#### Paramètres

- `id` (chemin) : ID du remboursement

#### Réponse

```json
{
  "status": "success",
  "data": {
    "receipt_url": "https://example.com/receipts/PAY-00001.pdf"
  }
}
```

### Télécharger un Justificatif de Paiement

```
GET /portfolios/traditional/payments/:id/receipt/download
```

Télécharge le fichier justificatif de paiement pour un remboursement.

#### Paramètres

- `id` (chemin) : ID du remboursement

#### Réponse

Fichier binaire (PDF) avec l'en-tête `Content-Type: application/pdf`.

```

### Télécharger une Pièce Justificative

```
POST /portfolios/traditional/payments/:id/supporting-document
```

Télécharge une pièce justificative pour un remboursement (différent du reçu, c'est un document qui justifie le paiement).

#### Paramètres

- `id` (chemin) : ID du remboursement

#### Corps de la Requête

Formulaire multipart avec un champ `document` contenant le fichier (PDF, JPEG, PNG).

#### Réponse

```json
{
  "status": "success",
  "data": {
    "success": true,
    "document_url": "https://example.com/documents/PAY-00001.pdf",
    "message": "Document téléchargé avec succès"
  }
}
```

### Récupérer une Pièce Justificative

```
GET /portfolios/traditional/payments/:id/supporting-document
```

Télécharge le fichier de la pièce justificative pour un remboursement.

#### Paramètres

- `id` (chemin) : ID du remboursement

#### Réponse

Fichier binaire (PDF, JPEG ou PNG) avec l'en-tête `Content-Type` approprié.

### Comparer les Remboursements avec les Échéances

```
GET /portfolios/traditional/credit-contracts/:contractId/payments/compare-with-schedule
```

Compare les remboursements effectués avec les échéances planifiées pour analyser les écarts.

#### Paramètres

- `contractId` (chemin) : ID du contrat de crédit

#### Réponse

```json
{
  "status": "success",
  "data": [
    {
      "schedule_id": "SCH-001",
      "due_date": "2025-08-01T00:00:00Z",
      "expected_amount": 1250000,
      "principal_amount": 1125000,
      "interest_amount": 125000,
      "actual_payments": [
        {
          "payment_id": "PAY-00001",
          "payment_date": "2025-08-01T09:30:00Z",
          "amount": 1250000,
          "status": "completed",
          "reference": "VIR-REMB-PME-08010001",
          "transaction_reference": "TRX-PMEAGRO-001"
        }
      ],
      "total_paid": 1250000,
      "remaining_amount": 0,
      "payment_percentage": 100,
      "computed_status": "paid",
      "slippage": 0,
      "installment_number": 1
    },
    {
      "schedule_id": "SCH-002",
      "due_date": "2025-09-01T00:00:00Z",
      "expected_amount": 1250000,
      "principal_amount": 1125000,
      "interest_amount": 125000,
      "actual_payments": [],
      "total_paid": 0,
      "remaining_amount": 1250000,
      "payment_percentage": 0,
      "computed_status": "pending",
      "slippage": 0,
      "installment_number": 2
    }
  ]
}
```

### Annuler un Remboursement

```
POST /portfolios/traditional/payments/:id/cancel
```

Annule un remboursement existant.

#### Paramètres

- `id` (chemin) : ID du remboursement

#### Corps de la Requête

```json
{
  "reason": "Paiement effectué en double"
}
```

#### Réponse

```json
{
  "status": "success",
  "data": {
    "id": "PAY-00001",
    "status": "cancelled",
    "cancellation_reason": "Paiement effectué en double",
    "cancellation_date": "2025-08-02T10:00:00Z",
    "updated_at": "2025-08-02T10:00:00Z"
  }
}
```

### Vérifier l'Existence d'un Justificatif

```
GET /portfolios/traditional/payments/:id/has-receipt
```

Vérifie si un remboursement possède un justificatif.

#### Paramètres

- `id` (chemin) : ID du remboursement

#### Réponse

```json
{
  "status": "success",
  "data": {
    "has_receipt": true
  }
}
```

### Récupérer les Paiements en Retard pour un Portefeuille

```
GET /portfolios/traditional/:portfolioId/late-payments
```

Récupère tous les paiements en retard pour un portefeuille spécifique.

#### Paramètres

- `portfolioId` (chemin) : ID du portefeuille

#### Réponse

```json
{
  "status": "success",
  "data": [
    {
      "id": "PAY-00003",
      "contract_id": "CRDT-100003",
      "portfolio_id": "qf3081zdd",
      "client_id": "BTP Services",
      "payment_date": "2025-07-10T00:00:00Z",
      "amount": 2100000,
      "status": "pending",
      "due_date": "2025-07-10T00:00:00Z",
      "slippage": 15
    }
  ]
}
```

## Codes d'Erreur

- `400 Bad Request` : La requête est malformée ou manque de paramètres requis
- `401 Unauthorized` : Authentification requise
- `403 Forbidden` : Utilisateur non autorisé à accéder à cette ressource
- `404 Not Found` : Ressource non trouvée
- `500 Internal Server Error` : Erreur serveur interne
