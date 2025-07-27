# Virements (Disbursements) - Portefeuille Traditionnel

Ce document décrit les endpoints pour la gestion des virements (décaissements) dans le cadre des portefeuilles traditionnels.

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
  "status": "en attente",
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
  "amount": 16000000,
  "paymentMethod": "virement",
  "beneficiary": {
    "accountNumber": "CI1010010100123456789012345",
    "accountName": "PME Agro Sarl",
    "bankName": "Banque Commerciale Africaine"
  },
  "description": "Financement Crédit PME 12 mois - Réf. Contrat CRDT-100001 (Montant révisé)"
}
```

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
| id | string | Identifiant unique du virement |
| company | string | Nom de l'entreprise bénéficiaire |
| product | string | Type de produit financier |
| amount | number | Montant du virement |
| status | string | Statut du virement ('en attente', 'effectué') |
| date | string | Date du virement (format ISO) |
| requestId | string | Référence de la demande associée (optionnel) |
| portfolioId | string | Identifiant du portefeuille |
| contractReference | string | Référence du contrat associé |
| transactionReference | string | Référence de la transaction bancaire (optionnel) |
| valueDate | string | Date de valeur (optionnel) |
| executionDate | string | Date d'exécution (optionnel) |
| debitAccount | object | Informations du compte débité |
| beneficiary | object | Informations du bénéficiaire |
| paymentMethod | string | Méthode de paiement (virement, transfert, etc.) |
| paymentReference | string | Référence du paiement (optionnel) |
| description | string | Description ou motif du paiement (optionnel) |

### Compte débité (DebitAccount)

| Champ | Type | Description |
|-------|------|-------------|
| accountNumber | string | Numéro de compte |
| accountName | string | Nom du compte |
| bankName | string | Nom de la banque |
| bankCode | string | Code de la banque |
| branchCode | string | Code de l'agence (optionnel) |

### Bénéficiaire (Beneficiary)

| Champ | Type | Description |
|-------|------|-------------|
| accountNumber | string | Numéro de compte |
| accountName | string | Nom du titulaire du compte |
| bankName | string | Nom de la banque |
| bankCode | string | Code de la banque (optionnel) |
| branchCode | string | Code de l'agence (optionnel) |
| swiftCode | string | Code SWIFT (optionnel) |
| companyName | string | Nom de l'entreprise |
| address | string | Adresse (optionnel) |

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

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/disbursements/batch`

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

**Endpoint** : `GET /portfolio_inst/portfolios/traditional/{portfolioId}/disbursements/batch/{batchId}`

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

**Endpoint** : `POST /portfolio_inst/portfolios/traditional/{portfolioId}/disbursements/{disbursementId}/documents`

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
