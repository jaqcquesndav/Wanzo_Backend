# Virements (Disbursements) - Portefeuille Traditionnel

Ce document décrit les endpoints pour la gestion des virements (décaissements) dans le cadre des portefeuilles traditionnels.

> **Note importante** : Ces endpoints sont spécifiques aux déboursements de crédits traditionnels (Institution → Client). 
> Pour les ordres de paiement génériques applicables à tous types de portefeuilles, consultez la [documentation des paiements](../paiements/README.md).

## Liste des virements

Récupère la liste des virements pour un portefeuille traditionnel spécifique.

**Endpoint** : `GET /portfolios/traditional/disbursements`

**Paramètres de requête** :
- `portfolioId` (optionnel) : Identifiant unique du portefeuille traditionnel
- `status` (optionnel) : Filtre par statut ('en attente', 'effectué')
- `company` (optionnel) : Filtre par nom d'entreprise
- `dateFrom` (optionnel) : Filtre par date de création (début)
- `dateTo` (optionnel) : Filtre par date de création (fin)
- `search` (optionnel) : Recherche textuelle (référence de contrat, nom d'entreprise)

**Réponse réussie** (200 OK) :

```json
[
  {
    "id": "DISB-TRAD-20250702-0001",
    "company": "PME Agro Sarl",
    "product": "Crédit PME 12 mois",
    "amount": 15000000,
    "status": "en attente",
    "date": "2025-07-02T11:00:00Z",
    "requestId": "REQ-TRAD-20250701-0001",
    "portfolioId": "qf3081zdd",
    "contractReference": "CRDT-100001",
    "debitAccount": {
      "accountNumber": "FR7630006000011234567890189",
      "accountName": "Institution Financière Portfolio",
      "bankName": "Banque Centrale Africaine",
      "bankCode": "BCA01",
      "branchCode": "ABIDJAN01"
    },
    "beneficiary": {
      "accountNumber": "CI1010010100123456789012345",
      "accountName": "PME Agro Sarl",
      "bankName": "Banque Commerciale Africaine",
      "bankCode": "BCoA21",
      "companyName": "PME Agro Sarl",
      "address": "123 Rue du Commerce, Abidjan"
    },
    "paymentMethod": "virement",
    "description": "Financement Crédit PME 12 mois - Réf. Contrat CRDT-100001"
  }
]
```

## Détails d'un virement

Récupère les détails complets d'un virement spécifique.

**Endpoint** : `GET /portfolios/traditional/disbursements/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du virement

**Réponse réussie** (200 OK) :

```json
{
  "id": "DISB-TRAD-20250629-0002",
  "company": "TransLogistics",
  "product": "Crédit Trésorerie",
  "amount": 8000000,
  "status": "effectué",
  "date": "2025-06-29T09:00:00Z",
  "requestId": "REQ-TRAD-20250628-0002",
  "portfolioId": "qf3081zdd",
  "contractReference": "CRDT-100002",
  "transactionReference": "TRXVIR2506250001",
  "valueDate": "2025-06-30T00:00:00Z",
  "executionDate": "2025-06-29T14:30:00Z",
  "debitAccount": {
    "accountNumber": "FR7630006000011234567890189",
    "accountName": "Institution Financière Portfolio",
    "bankName": "Banque Centrale Africaine",
    "bankCode": "BCA01",
    "branchCode": "ABIDJAN01"
  },
  "beneficiary": {
    "accountNumber": "CI2020020200234567890123456",
    "accountName": "TransLogistics SA",
    "bankName": "Société Générale Côte d'Ivoire",
    "bankCode": "SGCI22",
    "swiftCode": "SGCICIAB",
    "companyName": "TransLogistics",
    "address": "45 Boulevard Industriel, Zone Portuaire, Abidjan"
  },
  "paymentMethod": "virement",
  "paymentReference": "VIR-TL-06250001",
  "description": "Décaissement Crédit Trésorerie - Réf. Contrat CRDT-100002"
## Création d'un virement

Crée un nouveau virement pour un contrat dans un portefeuille traditionnel.

**Endpoint** : `POST /portfolios/traditional/disbursements`

**Corps de la requête** :

```json
{
  "company": "PME Agro Sarl",
  "product": "Crédit PME 12 mois",
  "amount": 15000000,
  "date": "2025-07-05T11:00:00Z",
  "requestId": "REQ-TRAD-20250704-0004",
  "portfolioId": "qf3081zdd",
  "contractReference": "CRDT-100004",
  "debitAccount": {
    "accountNumber": "FR7630006000011234567890189",
    "accountName": "Institution Financière Portfolio",
    "bankName": "Banque Centrale Africaine",
    "bankCode": "BCA01",
    "branchCode": "ABIDJAN01"
  },
  "beneficiary": {
    "accountNumber": "CI1010010100123456789012345",
    "accountName": "PME Agro Sarl",
    "bankName": "Banque Commerciale Africaine",
    "bankCode": "BCoA21",
    "companyName": "PME Agro Sarl",
    "address": "123 Rue du Commerce, Abidjan"
  },
  "paymentMethod": "virement",
  "description": "Financement Crédit PME 12 mois - Réf. Contrat CRDT-100004"
}
```

> **Note**: Le statut initial est automatiquement défini à `draft` par le système. Les champs `debitAccount` et `beneficiary` sont requis selon le DTO actuel.

**Réponse réussie** (201 Created) :

```json
{
  "id": "DISB-TRAD-20250705-0004",
  "status": "en attente",
  "message": "Virement créé avec succès"
}
```

## Mettre à jour un virement

Modifie un virement existant (uniquement possible à l'état "en attente").

**Endpoint** : `PUT /portfolios/traditional/disbursements/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du virement

**Corps de la requête** :

```json
{
  "status": "pending",
  "transactionReference": "TRXVIR0702250001",
  "valueDate": "2025-07-03",
  "executionDate": "2025-07-02",
  "paymentMethod": "virement",
  "paymentReference": "VIR-PA-07020001",
  "description": "Financement Crédit PME 12 mois - Réf. Contrat CRDT-100001 (Montant révisé)",
  "supportingDocumentUrl": "https://example.com/docs/virement-proof.pdf"
}
```

> **Note**: Selon UpdateDisbursementDto, seuls les champs status, transactionReference, valueDate, executionDate, paymentMethod, paymentReference, description et supportingDocumentUrl sont modifiables.

**Réponse réussie** (200 OK) :

```json
{
  "id": "DISB-TRAD-20250702-0001",
  "status": "en attente",
  "message": "Virement mis à jour avec succès"
}
```

## Confirmer un virement

Marque un virement comme effectué.

**Endpoint** : `POST /portfolios/traditional/disbursements/{id}/confirm`

**Paramètres de chemin** :
- `id` : Identifiant unique du virement

**Corps de la requête** :

```json
{
  "transactionReference": "TRXVIR0507250001",
  "executionDate": "2025-07-05T14:30:00Z",
  "valueDate": "2025-07-06T00:00:00Z",
  "paymentReference": "VIR-PA-07050001"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "id": "DISB-TRAD-20250702-0001",
  "status": "effectué",
  "message": "Virement traité avec succès"
}
```

## Annuler un virement

Annule un virement en attente.

**Endpoint** : `DELETE /portfolios/traditional/disbursements/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique du virement

**Réponse réussie** (200 OK) :

```json
{
  "id": "DISB-TRAD-20250702-0001",
  "message": "Virement annulé avec succès"
}
```

## Modèle de données

### Virement (Disbursement)

| Champ | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Identifiant unique du virement |
| reference | string | Référence unique du virement |
| portfolio_id | string (UUID) | Identifiant du portefeuille |
| contract_id | string (UUID) | Identifiant du contrat associé |
| client_id | string (UUID) | Identifiant du client bénéficiaire |
| amount | number | Montant du virement |
| currency | string | Code devise ISO 4217 (CDF, USD, XOF, EUR, XAF) |
| status | enum | Statut: draft, pending, approved, rejected, processing, completed, failed, canceled |
| disbursement_type | enum | Type: full, partial, installment |
| installment_number | integer (optionnel) | Numéro de versement (pour type installment) |
| payment_method | string (optionnel) | Méthode de paiement (bank_transfer, mobile_money, etc.) |
| recipient_info | object (optionnel) | Informations du bénéficiaire (voir structure ci-dessous) |
| transaction_id | string (optionnel) | Identifiant de transaction externe |
| payment_transaction_id | string (optionnel) | ID de la transaction dans payment-service |
| transaction_date | timestamp (optionnel) | Date de la transaction |
| requested_date | timestamp (optionnel) | Date de la demande |
| notes | string (optionnel) | Notes additionnelles |
| approved_by | string (optionnel) | ID de l'utilisateur ayant approuvé |
| approval_date | timestamp (optionnel) | Date d'approbation |
| rejection_reason | string (optionnel) | Raison du rejet |
| rejected_by | string (optionnel) | ID de l'utilisateur ayant rejeté |
| rejection_date | timestamp (optionnel) | Date de rejet |
| executed_by | string (optionnel) | ID de l'utilisateur ayant exécuté |
| execution_date | timestamp (optionnel) | Date d'exécution |
| prerequisites_verified | boolean (optionnel) | Prérequis vérifiés avant traitement |
| documents | array (optionnel) | Documents joints (voir structure ci-dessous) |
| callback_data | object (optionnel) | Données de callback du provider (voir structure ci-dessous) |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Date de dernière modification |

**Structure recipient_info (mobile money ou banque):**
```json
{
  "account_number": "12345678",
  "bank_name": "Bank of Africa",
  "bank_code": "BOA-CI",
  "mobile_wallet": "+22500000000",
  "name": "Entreprise ABC"
}
```

**Structure documents:**
```json
[
  {
    "id": "doc123",
    "name": "contrat.pdf",
    "type": "contract",
    "url": "https://...",
    "upload_date": "2025-01-15T10:00:00Z"
  }
]
```

**Structure callback_data (intégration payment-service):**
```json
{
  "provider": "SerdiPay",
  "response_code": "200",
  "response_message": "Transaction successful",
  "timestamp": "2025-01-15T10:30:00Z",
  "additional_info": {
    "operator": "AM",
    "transaction_ref": "SP-TXN-123456"
  }
}
```

---

## 💳 Support Mobile Money

Les virements peuvent être effectués via mobile money pour une exécution rapide.

**Opérateurs supportés:**
- **AM** (Airtel Money): Min 100 XOF, Max 5M XOF
- **OM** (Orange Money): Min 100 XOF, Max 3M XOF
- **WAVE**: Min 100 XOF, Max 10M XOF
- **MP** (M-Pesa): Min 100 XOF, Max 2M XOF
- **AF** (Africell Money): Min 100 XOF, Max 2M XOF

**Intégration avec payment-service:**

Lorsqu'un virement est créé avec `payment_method: "mobile_money"`, le système:
1. Crée une transaction dans payment-service via SerdiPay
2. Stocke le `payment_transaction_id` dans le disbursement
3. Attend le callback du provider
4. Met à jour le statut avec `callback_data`

**Exemple de recipient_info pour mobile money:**
```json
{
  "mobile_wallet": "+243900000000",
  "name": "Jean Dupont"
}
```

**Exemple de recipient_info pour virement bancaire:**
```json
{
  "account_number": "CI1010010100123456789012345",
  "bank_name": "Bank of Africa",
  "bank_code": "BOA-CI",
  "name": "Entreprise ABC"
}
```

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `disbursementId` : Identifiant unique du virement

**Corps de la requête** :

```json
{
  "failure_reason": "bank_rejection",
  "failure_details": "Coordonnées bancaires incorrectes.",
  "failure_date": "2025-01-15T09:00:00.000Z",
  "retry_scheduled": true,
  "retry_date": "2025-01-16T09:00:00.000Z"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "message": "Virement marqué comme échoué",
  "data": {
    "disbursement_id": "disbursement123",
    "new_status": "failed",
    "retry_id": "disbursement124"
  }
}
```

## Création de virements groupés

Crée plusieurs virements en une seule opération.

**Endpoint** : `POST /portfolios/traditional/disbursements/batch`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel

**Corps de la requête** :

```json
{
  "batch_reference": "BATCH-2025-001",
  "scheduled_date": "2025-01-15T00:00:00.000Z",
  "description": "Virements groupés pour les contrats approuvés en janvier 2025",
  "disbursements": [
    {
      "contract_id": "contract456",
      "amount": 25000.00,
      "currency": "XOF",
      "payment_method": "bank_transfer",
      "recipient_details": {
        "bank_name": "Banque XYZ",
        "account_number": "12345678",
        "account_name": "Entreprise ABC"
      }
    },
    {
      "contract_id": "contract457",
      "amount": 15000.00,
      "currency": "XOF",
      "payment_method": "mobile_money",
      "recipient_details": {
        "phone_number": "+22500000000",
        "operator": "Orange Money",
        "account_name": "Pierre Durand"
      }
    }
  ]
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "message": "Lot de virements créé avec succès",
  "data": {
    "batch_id": "batch123",
    "batch_reference": "BATCH-2025-001",
    "disbursements": [
      {
        "id": "disbursement123",
        "reference": "DISB-2025-0123",
        "contract_id": "contract456",
        "status": "pending"
      },
      {
        "id": "disbursement124",
        "reference": "DISB-2025-0124",
        "contract_id": "contract457",
        "status": "pending"
      }
    ],
    "total_amount": 40000.00,
    "total_count": 2
  }
}
```

## Obtenir les détails d'un lot de virements

Récupère les détails d'un lot de virements et les virements associés.

**Endpoint** : `GET /portfolios/traditional/disbursements/batch/{batchId}`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `batchId` : Identifiant unique du lot de virements

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "batch_id": "batch123",
    "batch_reference": "BATCH-2025-001",
    "portfolio_id": "portfolio123",
    "scheduled_date": "2025-01-15T00:00:00.000Z",
    "description": "Virements groupés pour les contrats approuvés en janvier 2025",
    "status": "processing",
    "status_summary": {
      "total": 2,
      "pending": 0,
      "processing": 1,
      "processed": 1,
      "failed": 0,
      "cancelled": 0
    },
    "total_amount": 40000.00,
    "currency": "XOF",
    "created_at": "2025-01-14T14:00:00.000Z",
    "created_by": {
      "id": "user123",
      "name": "Jean Dupont"
    },
    "updated_at": "2025-01-15T09:00:00.000Z",
    "disbursements": [
      {
        "id": "disbursement123",
        "reference": "DISB-2025-0123",
        "contract_id": "contract456",
        "client_name": "Entreprise ABC",
        "amount": 25000.00,
        "status": "processed",
        "processed_date": "2025-01-15T09:00:00.000Z"
      },
      {
        "id": "disbursement124",
        "reference": "DISB-2025-0124",
        "contract_id": "contract457",
        "client_name": "Pierre Durand",
        "amount": 15000.00,
        "status": "processing"
      }
    ]
  }
}
```

## Ajouter un document à un virement

Ajoute un nouveau document à un virement existant.

**Endpoint** : `POST /portfolios/traditional/disbursements/{disbursementId}/documents`

**Paramètres de chemin** :
- `portfolioId` : Identifiant unique du portefeuille traditionnel
- `disbursementId` : Identifiant unique du virement

**Corps de la requête** :

```json
{
  "type": "payment_receipt",
  "file_id": "file125",
  "name": "Reçu_Virement.pdf",
  "description": "Reçu de virement bancaire"
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "message": "Document ajouté au virement avec succès",
  "data": {
    "document_id": "doc123"
  }
}
```
