# API Virements

Cette section documente les endpoints liés à la gestion des virements dans le système Wanzo.

## Structure de données

Un virement est représenté par l'objet `Disbursement` avec la structure suivante :

```typescript
interface Disbursement {
  id: string;                  // Identifiant unique du virement
  company: string;             // Nom de l'entreprise bénéficiaire
  product: string;             // Produit financier associé
  amount: number;              // Montant du virement en FCFA
  status: 'en attente' | 'effectué'; // Statut du virement
  date: string;                // Date du virement (ISO 8601)
  requestId?: string;          // Référence à la demande de financement
  portfolioId: string;         // Identifiant du portefeuille
  contractReference: string;   // Référence du contrat associé
  
  // Informations bancaires de l'ordre de virement
  transactionReference?: string; // Référence de transaction bancaire
  valueDate?: string;          // Date de valeur
  executionDate?: string;      // Date d'exécution
  
  // Informations du compte débité (compte de l'institution)
  debitAccount: {
    accountNumber: string;     // Numéro de compte
    accountName: string;       // Nom du titulaire
    bankName: string;          // Nom de la banque
    bankCode: string;          // Code banque
    branchCode?: string;       // Code agence
  };
  
  // Informations du compte crédité (compte du bénéficiaire)
  beneficiary: {
    accountNumber: string;     // Numéro de compte
    accountName: string;       // Nom du titulaire
    bankName: string;          // Nom de la banque
    bankCode?: string;         // Code banque
    branchCode?: string;       // Code agence
    swiftCode?: string;        // Code SWIFT pour virements internationaux
    companyName: string;       // Nom de l'entreprise
    address?: string;          // Adresse du bénéficiaire
  };
  
  // Informations de paiement
  paymentMethod?: 'virement' | 'transfert' | 'chèque' | 'espèces';
  paymentReference?: string;   // Référence du paiement
  description?: string;        // Description ou motif du paiement
}
```

## Endpoints

### Récupérer tous les virements d'un portefeuille

```
GET /portfolios/traditional/{portfolioId}/disbursements
```

**Paramètres de chemin**
- `portfolioId` (obligatoire) - Identifiant du portefeuille

**Réponse**
- `200 OK` - Liste des virements
- `404 Not Found` - Portefeuille non trouvé
- `500 Internal Server Error` - Erreur serveur

### Récupérer les virements d'un contrat

```
GET /portfolios/traditional/credit-contracts/{contractId}/disbursements
```

**Paramètres de chemin**
- `contractId` (obligatoire) - Identifiant du contrat

**Réponse**
- `200 OK` - Liste des virements
- `404 Not Found` - Contrat non trouvé
- `500 Internal Server Error` - Erreur serveur

### Récupérer un virement par son ID

```
GET /portfolios/traditional/disbursements/{id}
```

**Paramètres de chemin**
- `id` (obligatoire) - Identifiant du virement

**Réponse**
- `200 OK` - Détails du virement
- `404 Not Found` - Virement non trouvé
- `500 Internal Server Error` - Erreur serveur

### Créer un nouveau virement

```
POST /portfolios/traditional/disbursements
```

**Corps de la requête**
- Objet `Disbursement` sans l'ID (qui sera généré par le serveur)

**Réponse**
- `201 Created` - Virement créé avec succès
- `400 Bad Request` - Données invalides
- `500 Internal Server Error` - Erreur serveur

### Mettre à jour un virement

```
PUT /portfolios/traditional/disbursements/{id}
```

**Paramètres de chemin**
- `id` (obligatoire) - Identifiant du virement

**Corps de la requête**
- Données partielles de type `Disbursement` à mettre à jour

**Réponse**
- `200 OK` - Virement mis à jour avec succès
- `400 Bad Request` - Données invalides
- `404 Not Found` - Virement non trouvé
- `500 Internal Server Error` - Erreur serveur

### Confirmer un virement

```
POST /portfolios/traditional/disbursements/{id}/confirm
```

**Paramètres de chemin**
- `id` (obligatoire) - Identifiant du virement

**Corps de la requête**
```json
{
  "transactionReference": "string",
  "executionDate": "string (ISO 8601)",
  "valueDate": "string (ISO 8601, optionnel)"
}
```

**Réponse**
- `200 OK` - Virement confirmé avec succès
- `400 Bad Request` - Données invalides
- `404 Not Found` - Virement non trouvé
- `500 Internal Server Error` - Erreur serveur

### Annuler un virement

```
POST /portfolios/traditional/disbursements/{id}/cancel
```

**Paramètres de chemin**
- `id` (obligatoire) - Identifiant du virement

**Corps de la requête**
```json
{
  "reason": "string"
}
```

**Réponse**
- `200 OK` - Virement annulé avec succès
- `400 Bad Request` - Données invalides
- `404 Not Found` - Virement non trouvé
- `500 Internal Server Error` - Erreur serveur

## Exemples d'utilisation

### Exemple d'intégration front-end

```typescript
import { disbursementApi } from '../services/api/traditional/disbursement.api';

// Récupérer les virements d'un portefeuille
const disbursements = await disbursementApi.getDisbursementsByPortfolio('portfolio-123');

// Créer un nouveau virement
const newDisbursement = await disbursementApi.createDisbursement({
  company: 'PME Agro Sarl',
  product: 'Crédit PME 12 mois',
  amount: 15000000,
  status: 'en attente',
  date: new Date().toISOString(),
  portfolioId: 'portfolio-123',
  contractReference: 'CRDT-100001',
  
  debitAccount: {
    accountNumber: 'FR7630006000011234567890189',
    accountName: 'Institution Financière Portfolio',
    bankName: 'Banque Centrale Africaine',
    bankCode: 'BCA01',
  },
  
  beneficiary: {
    accountNumber: 'CI1010010100123456789012345',
    accountName: 'PME Agro Sarl',
    bankName: 'Banque Commerciale Africaine',
    bankCode: 'BCoA21',
    companyName: 'PME Agro Sarl',
  },
  
  paymentMethod: 'virement',
  description: 'Financement Crédit PME 12 mois - Réf. Contrat CRDT-100001'
});

// Confirmer un virement
const confirmedDisbursement = await disbursementApi.confirmDisbursement(
  'disbursement-123',
  {
    transactionReference: 'TRXVIR2506250001',
    executionDate: new Date().toISOString(),
    valueDate: new Date(Date.now() + 86400000).toISOString() // J+1
  }
);
```
