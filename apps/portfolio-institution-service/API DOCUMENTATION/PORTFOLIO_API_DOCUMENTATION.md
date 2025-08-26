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

## Endpoints disponibles

### 1. Portefeuilles traditionnels

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/contracts/${id}` | API pour les contrats de crédit/ export const creditApi = { / Récupère un contrat de crédit par son  |
| GET | `/portfolios/traditional/contracts/${contractId}/schedule` | Récupère l'échéancier d'un contrat de crédit |
| GET | `/portfolios/traditional/${portfolioId}/settings` | Type pour les paramètres de portefeuille traditionnel/ export interface TraditionalPortfolioSettings |
| PUT | `/portfolios/traditional/${portfolioId}/settings` | Met à jour les paramètres d'un portefeuille |
| POST | `/portfolios/traditional/${portfolioId}/settings/reset` | Réinitialise les paramètres d'un portefeuille aux valeurs par défaut |
| GET | `/portfolios/traditional/${portfolioId}/products` | Récupère tous les produits financiers d'un portefeuille |
| GET | `/portfolios/traditional/${portfolioId}/products/${productId}` | Récupère un produit financier par son ID |
| POST | `/portfolios/traditional/${portfolioId}/products` | Crée un nouveau produit financier |
| PUT | `/portfolios/traditional/${portfolioId}/products/${productId}` | Met à jour un produit financier |
| DELETE | `/portfolios/traditional/${portfolioId}/products/${productId}` | Supprime un produit financier |
| GET | `/portfolios/traditional?${params.toString()}` | API pour les portefeuilles traditionnels/ export const traditionalPortfolioApi = { / Récupère tous l |
| GET | `/portfolios/traditional/${id}` | Récupère un portefeuille traditionnel par son ID |
| POST | `/portfolios/traditional/${id}` | Crée un nouveau portefeuille traditionnel |
| POST | `/portfolios/traditional/${id}/status` | Change le statut d'un portefeuille traditionnel |
| DELETE | `/portfolios/traditional/${id}` | Supprime un portefeuille traditionnel |
| GET | `/portfolios/traditional/${id}/performance?period=${period}` | Récupère les performances d'un portefeuille traditionnel |
| GET | `/portfolios/traditional/${id}/activities?page=${page}&limit=${limit}` | Récupère l'historique des activités d'un portefeuille traditionnel |

### 2. Contrats de crédit

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolio_inst/portfolios/traditional/credit-contracts?${params.toString()}` | API pour les contrats de crédit/ export const creditContractApi = { / Récupère tous les contrats de  |
| GET | `/portfolio_inst/portfolios/traditional/credit-contracts/${id}` | Récupère un contrat de crédit par son ID |
| POST | `/portfolios/traditional/credit-contracts/${id}` | Crée un nouveau contrat de crédit |
| POST | `/portfolios/traditional/credit-contracts/${id}/generate-document` | Génère le document du contrat de crédit |
| POST | `/portfolios/traditional/credit-contracts/${id}/default` | Marque un contrat comme défaillant |
| POST | `/portfolios/traditional/credit-contracts/${id}/restructure` | Restructure un contrat de crédit |
| PUT | `/portfolios/traditional/credit-contracts/${id}` | PUT /portfolios/traditional/credit-contracts/${id} |
| GET | `/portfolios/traditional/credit-contracts/${contractId}/payment-schedule` | Télécharge une pièce justificative pour un paiement @param paymentId ID du paiement @param file Fich |

### 3. Demandes de crédit

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolios/traditional/credit-requests/${id}` | API pour les demandes de crédit/ export const creditRequestApi = { / Récupère toutes les demandes de |
| PATCH | `/portfolios/traditional/credit-requests/${id}/status` | Met à jour le statut d'une demande de crédit |
| PATCH | `/portfolios/traditional/credit-requests/${id}` | Met à jour une demande de crédit |
| DELETE | `/portfolios/traditional/credit-requests/${id}` | Supprime une demande de crédit |

### 4. Décaissements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolio_inst/portfolios/traditional/disbursements?portfolioId=${portfolioId}` | API pour les virements et déboursements/ export const disbursementApi = { / Récupère tous les vireme |
| GET | `/portfolio_inst/portfolios/traditional/disbursements?contractId=${contractId}` | Récupère tous les virements pour un contrat |
| GET | `/portfolio_inst/portfolios/traditional/disbursements/${id}` | Récupère un virement par son ID |
| PUT | `/portfolio_inst/portfolios/traditional/disbursements/${id}` | Met à jour un virement existant |
| POST | `/portfolios/traditional/disbursements/${id}/confirm` | Confirme un virement (change son statut en "effectué") |
| POST | `/portfolios/traditional/disbursements/${id}/cancel` | Annule un virement |

### 5. Remboursements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/payments/${id}` | GET /payments/${id} |
| GET | `/payments/beneficiary/${encodeURIComponent(beneficiaryName)}` | GET /payments/beneficiary/${encodeURIComponent(beneficiaryName)} |
| PUT | `/payments/${id}` | PUT /payments/${id} |
| PUT | `/payments/${id}/status` | PUT /payments/${id}/status |
| PUT | `/payments/${id}/cancel` | PUT /payments/${id}/cancel |
| GET | `/portfolio_inst/portfolios/traditional/repayments?contractId=${contractId}` | API pour les paiements de crédit/ export const paymentApi = { / Récupère tous les paiements pour un  |
| GET | `/portfolio_inst/portfolios/traditional/repayments?portfolioId=${portfolioId}` | Récupère tous les paiements pour un portefeuille |
| GET | `/portfolio_inst/portfolios/traditional/repayments?portfolioId=${portfolioId}&status=late` | Récupère tous les paiements en retard pour un portefeuille |
| GET | `/portfolio_inst/portfolios/traditional/repayments/${id}` | Récupère un paiement par son ID |
| GET | `/portfolios/traditional/payments/${paymentId}/receipt` | Récupère un document justificatif par son ID de paiement |
| GET | `/portfolios/traditional/payments/${paymentId}/receipt/download` | Télécharge un document justificatif |
| POST | `/portfolios/traditional/payments/${id}` | Enregistre un nouveau paiement |
| POST | `/portfolios/traditional/payments/${id}/cancel` | Annule un paiement |
| POST | `/portfolios/traditional/payments/${id}/generate-receipt` | Génère un reçu de paiement |
| GET | `/portfolios/traditional/payments/${id}/has-receipt` | Vérifie si un paiement possède un justificatif |
| GET | `/portfolios/traditional/payments/${paymentId}/supporting-document` | Télécharge un justificatif de paiement |
| PUT | `/portfolios/traditional/payments/${id}` | PUT /portfolios/traditional/payments/${id} |

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

### 14. Autres

| Méthode | URL | Description |
|---------|-----|-------------|
| DELETE | `${API_CONFIG.endpoints.messages.deleteConversation}/${conversationId}` | DELETE ${API_CONFIG.endpoints.messages.deleteConversation}/${conversationId} |
| PUT | `/institution/managers/${id}` | PUT /institution/managers/${id} |
| DELETE | `/institution/managers/${id}` | DELETE /institution/managers/${id} |
| GET | `/portfolios?type=${type}` | GET /portfolios?type=${type} |
| GET | `/portfolios/${id}` | GET /portfolios/${id} |
| DELETE | `/portfolios/${id}` | DELETE /portfolios/${id} |
| POST | `req-${Date.now()}` | Crée une nouvelle demande de crédit |
| POST | `DISB-${Date.now()}-${Math.floor(Math.random() * 1000)}` | Crée un nouveau virement |

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
