# Documentation de l'API du microservice Portfolio Institution

Cette documentation décrit la structure des URLs et les endpoints disponibles pour communiquer avec le microservice Portfolio Institution via l'API Gateway.

*Cette documentation est générée automatiquement à partir du code source du frontend.*

## Informations générales

- **Base URL**: `http://localhost:8000`
- **Préfixe API Portfolio**: `/portfolio/api/v1`
- **URL complète**: `http://localhost:8000/portfolio/api/v1`
- **Port API Gateway**: 8000
- **Port Microservice Portfolio Institution**: 3005 (interne)

## Authentification

Toutes les requêtes nécessitent une authentification via un token JWT.

**Headers requis**:
```
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

## Structure des URLs

Tous les endpoints du microservice sont accessibles via l'API Gateway à l'adresse suivante:
`http://localhost:8000/portfolio/api/v1/<endpoint>`

**Structure complète**:
- **Base**: `http://localhost:8000`
- **Préfixe Portfolio**: `/portfolio/api/v1`
- **Endpoint**: `/<votre-endpoint>`
- **URL finale**: `http://localhost:8000/portfolio/api/v1/<votre-endpoint>`

### ⚠️ Important : Construction des URLs

Dans la documentation qui suit, tous les endpoints sont listés **sans le préfixe**. Pour construire l'URL complète, vous devez **toujours ajouter le préfixe** :

- **Documentation** : `/portfolios/traditional/credit-contracts`
- **URL réelle** : `http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-contracts`

**Exemples de construction** :
```javascript
const baseUrl = 'http://localhost:8000/portfolio/api/v1';
const endpoint = '/portfolios/traditional/credit-contracts';
const fullUrl = baseUrl + endpoint; // URL complète à utiliser
```

## Format des réponses

Les réponses suivent un format standardisé:

**Succès**:
```json
{
  "success": true,
  "data": {
    // Les données spécifiques retournées
  }
}
```

**Pagination**:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Erreur**:
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Type d'erreur"
}
```

## Relations hiérarchiques et workflow

Le système suit une hiérarchie stricte pour organiser les entités et leurs relations :

```
🏢 Institution
  └── 📁 Portefeuille Traditionnel
      ├── ⚙️ Paramètres du portefeuille
      ├── 💰 Produits financiers du portefeuille
      ├── 📄 Demandes de crédit
      └── 📝 Contrats de crédit
          ├── 💸 Déboursements/Virements
          ├── 💳 Remboursements
          ├── 🛡️ Garanties
          └── 📊 Échéanciers de paiement
```

### Workflow principal

1. **Création du portefeuille** → Configuration des paramètres et produits
2. **Demande de crédit** → Évaluation → Approbation
3. **Création du contrat** → À partir de la demande approuvée
4. **Déboursement** → Virement des fonds vers le client
5. **Remboursements** → Paiements selon l'échéancier
6. **Gestion des garanties** → Tout au long du cycle de vie du contrat

### Règles importantes

- **Tous les contrats, produits et paramètres sont associés à un portefeuille spécifique**
- **Les déboursements, remboursements et garanties sont liés à des contrats**
- **Les demandes de crédit précèdent la création des contrats**
- **La structure URL reflète cette hiérarchie** : `/portfolios/traditional/{portfolioId}/...`

## Endpoints disponibles

### 1. Portefeuilles traditionnels

#### Gestion des portefeuilles

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional` | Récupère tous les portefeuilles traditionnels |
| GET | `/portfolios/traditional/${id}` | Récupère un portefeuille traditionnel par son ID |
| POST | `/portfolios/traditional` | Crée un nouveau portefeuille traditionnel |
| PUT | `/portfolios/traditional/${id}` | Met à jour un portefeuille traditionnel |
| DELETE | `/portfolios/traditional/${id}` | Supprime un portefeuille traditionnel |
| POST | `/portfolios/traditional/${id}/status` | Change le statut d'un portefeuille traditionnel |
| GET | `/portfolios/traditional/${id}/performance` | Récupère les performances d'un portefeuille traditionnel |
| GET | `/portfolios/traditional/${id}/activities` | Récupère l'historique des activités d'un portefeuille traditionnel |

#### Produits financiers (associés à un portefeuille)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/${portfolioId}/products` | Récupère tous les produits financiers d'un portefeuille |
| GET | `/portfolios/traditional/${portfolioId}/products/${productId}` | Récupère un produit financier par son ID |
| POST | `/portfolios/traditional/${portfolioId}/products` | Crée un nouveau produit financier dans le portefeuille |
| PUT | `/portfolios/traditional/${portfolioId}/products/${productId}` | Met à jour un produit financier |
| DELETE | `/portfolios/traditional/${portfolioId}/products/${productId}` | Supprime un produit financier |

#### Paramètres du portefeuille

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/${portfolioId}/settings` | Récupère les paramètres d'un portefeuille traditionnel |
| PUT | `/portfolios/traditional/${portfolioId}/settings` | Met à jour les paramètres d'un portefeuille |
| POST | `/portfolios/traditional/${portfolioId}/settings/reset` | Réinitialise les paramètres d'un portefeuille aux valeurs par défaut |

### 2. Contrats de crédit

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/credit-contracts` | Récupère tous les contrats de crédit |
| GET | `/portfolios/traditional/credit-contracts/${id}` | Récupère un contrat de crédit par son ID |
| POST | `/portfolios/traditional/credit-contracts/from-request` | Crée un nouveau contrat de crédit à partir d'une demande |
| POST | `/portfolios/traditional/credit-contracts/${id}/generate-document` | Génère le document du contrat de crédit |
| POST | `/portfolios/traditional/credit-contracts/${id}/default` | Marque un contrat comme défaillant |
| POST | `/portfolios/traditional/credit-contracts/${id}/restructure` | Restructure un contrat de crédit |
| PUT | `/portfolios/traditional/credit-contracts/${id}` | Met à jour un contrat de crédit |
| GET | `/portfolios/traditional/credit-contracts/${contractId}/payment-schedule` | Récupère l'échéancier de paiement d'un contrat |

### 3. Demandes de crédit

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/credit-requests` | Récupère toutes les demandes de crédit |
| GET | `/portfolios/traditional/credit-requests/${id}` | Récupère une demande de crédit par son ID |
| POST | `/portfolios/traditional/credit-requests` | Crée une nouvelle demande de crédit |
| PATCH | `/portfolios/traditional/credit-requests/${id}/status` | Met à jour le statut d'une demande de crédit |
| PATCH | `/portfolios/traditional/credit-requests/${id}` | Met à jour une demande de crédit |
| DELETE | `/portfolios/traditional/credit-requests/${id}` | Supprime une demande de crédit |

### 4. Décaissements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/disbursements` | Récupère tous les virements et déboursements |
| GET | `/portfolios/traditional/disbursements/${id}` | Récupère un virement par son ID |
| POST | `/portfolios/traditional/disbursements` | Crée un nouveau virement |
| PUT | `/portfolios/traditional/disbursements/${id}` | Met à jour un virement existant |
| POST | `/portfolios/traditional/disbursements/${id}/confirm` | Confirme un virement (change son statut en "effectué") |
| POST | `/portfolios/traditional/disbursements/${id}/cancel` | Annule un virement |

### 5. Remboursements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/repayments` | Récupère tous les paiements de crédit |
| GET | `/portfolios/traditional/repayments/${id}` | Récupère un paiement par son ID |
| POST | `/portfolios/traditional/repayments` | Enregistre un nouveau paiement |
| PUT | `/portfolios/traditional/repayments/${id}` | Met à jour un paiement |
| POST | `/portfolios/traditional/repayments/${id}/cancel` | Annule un paiement |
| POST | `/portfolios/traditional/repayments/${id}/generate-receipt` | Génère un reçu de paiement |
| GET | `/portfolios/traditional/repayments/${paymentId}/receipt` | Récupère un document justificatif par son ID de paiement |
| GET | `/portfolios/traditional/repayments/${paymentId}/receipt/download` | Télécharge un document justificatif |
| GET | `/portfolios/traditional/repayments/${id}/has-receipt` | Vérifie si un paiement possède un justificatif |
| GET | `/portfolios/traditional/repayments/${paymentId}/supporting-document` | Télécharge un justificatif de paiement |

#### Ordres de paiement généraux

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/payments` | Récupère tous les ordres de paiement |
| GET | `/payments/${id}` | Récupère un ordre de paiement par son ID |
| POST | `/payments` | Crée un nouvel ordre de paiement |
| PUT | `/payments/${id}` | Met à jour un ordre de paiement |
| PUT | `/payments/${id}/status` | Met à jour le statut d'un ordre de paiement |
| PUT | `/payments/${id}/cancel` | Annule un ordre de paiement |
| GET | `/payments/beneficiary/${encodeURIComponent(beneficiaryName)}` | Récupère les ordres par bénéficiaire |

### 6. Documents

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/prospection/opportunities/${opportunityId}/documents` | POST /prospection/opportunities/${opportunityId}/documents |

### 7. Utilisateurs

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/users/${id}` | GET /users/${id} |
| POST | `/users/${id}/reset-password` | POST /users/${id}/reset-password |
| POST | `/users/${userId}/portfolios` | POST /users/${userId}/portfolios |
| PUT | `/users/${id}` | PUT /users/${id} |
| DELETE | `/users/${id}` | DELETE /users/${id} |
| DELETE | `/users/${userId}/portfolios/${portfolioId}` | DELETE /users/${userId}/portfolios/${portfolioId} |

### 8. Entreprises

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/companies/${id}` | GET /companies/${id} |
| GET | `/companies/search?q=${encodeURIComponent(searchTerm)}` | GET /companies/search?q=${encodeURIComponent(searchTerm)} |
| PUT | `/companies/${id}` | PUT /companies/${id} |
| DELETE | `/companies/${id}` | DELETE /companies/${id} |

### 9. Gestion des risques

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/risk/central/company/${companyId}` | GET /risk/central/company/${companyId} |
| PUT | `/risk/central/entries/${id}` | PUT /risk/central/entries/${id} |
| GET | `/risk/credit/${companyId}` | GET /risk/credit/${companyId} |
| GET | `/risk/leasing/${companyId}` | GET /risk/leasing/${companyId} |
| GET | `/risk/investment/${companyId}` | GET /risk/investment/${companyId} |
| POST | `/risk/${type}` | POST /risk/${type} |
| PUT | `/risk/${type}/${id}` | PUT /risk/${type}/${id} |

### 10. Paiements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/payments?${params.toString()}` | GET /payments?${params.toString()} |

### 11. Paramètres

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/settings/webhooks/${id}/test` | POST /settings/webhooks/${id}/test |
| PUT | `/settings/webhooks/${id}` | PUT /settings/webhooks/${id} |
| DELETE | `/settings/api-keys/${id}` | DELETE /settings/api-keys/${id} |
| DELETE | `/settings/webhooks/${id}` | DELETE /settings/webhooks/${id} |

### 12. Prospection

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/prospection/opportunities/${opportunityId}/activities` | POST /prospection/opportunities/${opportunityId}/activities |
| PUT | `/prospection/opportunities/${id}` | PUT /prospection/opportunities/${id} |
| DELETE | `/prospection/opportunities/${id}` | DELETE /prospection/opportunities/${id} |

### 13. Chat et notifications

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/chat/messages/${messageId}/rating` | POST /chat/messages/${messageId}/rating |
| DELETE | `/chat/contexts/${id}` | DELETE /chat/contexts/${id} |

### 14. Autres endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios` | Récupère tous les portefeuilles (tous types) |
| GET | `/portfolios/${id}` | Récupère un portefeuille par son ID |
| DELETE | `/portfolios/${id}` | Supprime un portefeuille |
| PUT | `/institution/managers/${id}` | Met à jour un gestionnaire d'institution |
| DELETE | `/institution/managers/${id}` | Supprime un gestionnaire d'institution |

## Exemples d'utilisation

### Récupérer tous les portefeuilles

```javascript
const fetchPortfolios = async () => {
  try {
    const response = await fetch('http://localhost:8000/portfolio/api/v1/portfolios/traditional?page=1&limit=10&status=active', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des portefeuilles:', error);
    throw error;
  }
};
```

### Créer un nouveau contrat de crédit

```javascript
const createCreditContract = async (contractData) => {
  try {
    const response = await fetch('http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-contracts/from-request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contractData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la création du contrat:', error);
    throw error;
  }
};
```

### Enregistrer un remboursement

```javascript
const recordRepayment = async (repaymentData) => {
  try {
    const response = await fetch('http://localhost:8000/portfolio/api/v1/portfolios/traditional/repayments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(repaymentData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du remboursement:', error);
    throw error;
  }
};
```

### Créer un produit financier dans un portefeuille

```javascript
const createFinancialProduct = async (portfolioId, productData) => {
  try {
    const response = await fetch(`http://localhost:8000/portfolio/api/v1/portfolios/traditional/${portfolioId}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    throw error;
  }
};
```

### Workflow complet : De la demande au remboursement

```javascript
const completeWorkflow = async () => {
  try {
    // 1. Créer une demande de crédit
    const creditRequest = await fetch('http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-requests', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: 'client-123',
        productId: 'prod-456',
        requestAmount: 50000,
        reason: 'Expansion commerciale'
      })
    }).then(res => res.json());

    // 2. Approuver la demande
    await fetch(`http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-requests/${creditRequest.data.id}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });

    // 3. Créer le contrat à partir de la demande
    const contract = await fetch('http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-contracts/from-request', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ creditRequestId: creditRequest.data.id })
    }).then(res => res.json());

    // 4. Effectuer le déboursement
    const disbursement = await fetch('http://localhost:8000/portfolio/api/v1/portfolios/traditional/disbursements', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractReference: contract.data.contract_number,
        amount: 50000,
        beneficiary: { /* détails du bénéficiaire */ }
      })
    }).then(res => res.json());

    // 5. Enregistrer un remboursement
    const repayment = await fetch('http://localhost:8000/portfolio/api/v1/portfolios/traditional/repayments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contract_id: contract.data.id,
        amount: 4583.33,
        payment_method: 'bank_transfer'
      })
    }).then(res => res.json());

    console.log('Workflow complet terminé avec succès');
    return { creditRequest, contract, disbursement, repayment };
    
  } catch (error) {
    console.error('Erreur dans le workflow:', error);
    throw error;
  }
};
```
