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
| GET | `/portfolios` | Récupère tous les portefeuilles (avec pagination et filtres) |
| GET | `/portfolios/${id}` | Récupère un portefeuille par son ID |
| POST | `/portfolios` | Crée un nouveau portefeuille |
| PUT | `/portfolios/${id}` | Met à jour un portefeuille |
| DELETE | `/portfolios/${id}` | Supprime un portefeuille |
| PUT | `/portfolios/${id}/status` | Change le statut d'un portefeuille |
| POST | `/portfolios/${id}/close` | Ferme définitivement un portefeuille |
| GET | `/portfolios/${id}/products` | Récupère tous les produits financiers d'un portefeuille |

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

#### Gestion des contrats

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/contracts` | Récupère tous les contrats de crédit (avec filtres) |
| GET | `/contracts/${id}` | Récupère un contrat de crédit par son ID |
| POST | `/contracts/from-request` | Crée un nouveau contrat de crédit à partir d'une demande |
| PUT | `/contracts/${id}` | Met à jour un contrat de crédit |
| DELETE | `/contracts/${id}` | Supprime un contrat de crédit |
| GET | `/contracts/${contractId}/schedule` | Récupère l'échéancier de paiement d'un contrat |

#### Actions sur le cycle de vie des contrats

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/contracts/${id}/activate` | Active un contrat (DRAFT → ACTIVE) |
| POST | `/contracts/${id}/suspend` | Suspend un contrat (ACTIVE → SUSPENDED) |
| POST | `/contracts/${id}/mark-default` | Marque un contrat en défaut (ACTIVE → DEFAULTED) |
| POST | `/contracts/${id}/litigation` | Met un contrat en litige (DEFAULTED → LITIGATION) |
| POST | `/contracts/${id}/restructure` | Restructure un contrat |
| POST | `/contracts/${id}/complete` | Termine un contrat (ACTIVE → COMPLETED) |
| POST | `/contracts/${id}/cancel` | Annule un contrat (DRAFT/ACTIVE → CANCELLED) |

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

#### Gestion des utilisateurs

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/users` | Récupère tous les utilisateurs (avec pagination et filtres) |
| GET | `/users/${id}` | Récupère un utilisateur par son ID |
| POST | `/users` | Crée un nouvel utilisateur |
| PUT | `/users/${id}` | Met à jour un utilisateur |
| DELETE | `/users/${id}` | Supprime un utilisateur |

#### Activités et historique

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/users/${id}/activities` | Récupère l'historique des activités d'un utilisateur |

#### Préférences utilisateur

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/users/${id}/preferences` | Récupère toutes les préférences d'un utilisateur |
| GET | `/users/${id}/preferences/${category}` | Récupère les préférences par catégorie |
| PUT | `/users/${id}/preferences` | Met à jour une préférence spécifique |

#### Sessions utilisateur

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/users/${id}/sessions` | Récupère toutes les sessions actives d'un utilisateur |
| DELETE | `/users/${id}/sessions/${sessionId}` | Termine une session spécifique |

### 8. Entreprises

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/companies` | Récupère toutes les entreprises |
| GET | `/companies/${id}` | Récupère une entreprise par son ID |
| POST | `/companies` | Crée une nouvelle entreprise |
| PUT | `/companies/${id}` | Met à jour une entreprise |
| DELETE | `/companies/${id}` | Supprime une entreprise |
| GET | `/companies/search?q=${encodeURIComponent(searchTerm)}` | Recherche d'entreprises par terme |
| GET | `/companies/${id}/financials` | Récupère les données financières d'une entreprise |
| GET | `/companies/${id}/valuation` | Récupère l'évaluation d'une entreprise |

### 9. Gestion des risques

#### Évaluations de risque

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/risk` | Récupère toutes les évaluations de risque |
| POST | `/risk` | Crée une nouvelle évaluation de risque |
| PUT | `/risk/${id}` | Met à jour une évaluation de risque |

#### Évaluations spécialisées par secteur

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/risk/credit/${companyId}` | Récupère l'évaluation de risque crédit d'une entreprise |
| GET | `/risk/leasing/${companyId}` | Récupère l'évaluation de risque leasing d'une entreprise |

#### Centrale des risques

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/risk/central/company/${companyId}` | Récupère les informations de risque de la centrale des risques |
| POST | `/risk/central` | Crée une nouvelle entrée de risque central |
| PUT | `/risk/central/entries/${id}` | Met à jour une entrée de risque central |

### 10. Paiements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/payments` | Récupère tous les ordres de paiement |
| GET | `/payments/${id}` | Récupère un ordre de paiement par son ID |
| POST | `/payments` | Crée un nouvel ordre de paiement |
| PUT | `/payments/${id}` | Met à jour un ordre de paiement |
| PUT | `/payments/${id}/status` | Met à jour le statut d'un ordre de paiement |
| PUT | `/payments/${id}/cancel` | Annule un ordre de paiement |
| GET | `/payments/beneficiary/${encodeURIComponent(beneficiaryName)}` | Récupère les ordres par bénéficiaire |
| GET | `/payments?${params.toString()}` | Récupère les paiements avec filtres (page, limit, status, etc.) |

### 11. Paramètres

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/settings` | Récupère tous les paramètres système |
| PUT | `/settings` | Met à jour les paramètres système |
| GET | `/settings/system` | Récupère les paramètres système globaux |
| PUT | `/settings/system` | Met à jour les paramètres système globaux |
| GET | `/settings/notifications` | Récupère les paramètres de notifications |
| PUT | `/settings/notifications` | Met à jour les paramètres de notifications |
| GET | `/settings/security` | Récupère les paramètres de sécurité |
| PUT | `/settings/security` | Met à jour les paramètres de sécurité |
| GET | `/settings/appearance` | Récupère les paramètres d'apparence |
| PUT | `/settings/appearance` | Met à jour les paramètres d'apparence |
| GET | `/settings/integrations` | Récupère les paramètres d'intégrations |
| PUT | `/settings/integrations` | Met à jour les paramètres d'intégrations |
| GET | `/settings/webhooks` | Récupère la liste des webhooks |
| POST | `/settings/webhooks` | Crée un nouveau webhook |
| PUT | `/settings/webhooks/${id}` | Met à jour un webhook |
| DELETE | `/settings/webhooks/${id}` | Supprime un webhook |
| POST | `/settings/webhooks/${id}/test` | Teste un webhook |
| GET | `/settings/api-keys` | Récupère la liste des clés API |
| POST | `/settings/api-keys` | Crée une nouvelle clé API |
| DELETE | `/settings/api-keys/${id}` | Supprime une clé API |

### 12. Prospection

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/prospection/opportunities` | Récupère toutes les opportunités de prospection |
| GET | `/prospection/opportunities/${id}` | Récupère une opportunité par son ID |
| POST | `/prospection/opportunities` | Crée une nouvelle opportunité |
| PUT | `/prospection/opportunities/${id}` | Met à jour une opportunité |
| DELETE | `/prospection/opportunities/${id}` | Supprime une opportunité |
| POST | `/prospection/opportunities/${opportunityId}/activities` | Ajoute une activité à une opportunité |
| GET | `/prospection/opportunities/${opportunityId}/activities` | Récupère les activités d'une opportunité |
| POST | `/prospection/opportunities/${opportunityId}/documents` | Ajoute un document à une opportunité |
| GET | `/prospection/opportunities/${opportunityId}/documents` | Récupère les documents d'une opportunité |
| GET | `/prospection/leads` | Récupère tous les leads |
| POST | `/prospection/leads` | Crée un nouveau lead |
| PUT | `/prospection/leads/${id}` | Met à jour un lead |

### 13. Chat et notifications

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/chat/conversations` | Récupère toutes les conversations |
| GET | `/chat/conversations/${id}` | Récupère une conversation par son ID |
| POST | `/chat/conversations` | Crée une nouvelle conversation |
| DELETE | `/chat/conversations/${id}` | Supprime une conversation |
| GET | `/chat/messages` | Récupère tous les messages |
| GET | `/chat/messages/${conversationId}` | Récupère les messages d'une conversation |
| POST | `/chat/messages` | Envoie un nouveau message |
| PUT | `/chat/messages/${messageId}` | Met à jour un message |
| POST | `/chat/messages/${messageId}/rating` | Évalue un message |
| DELETE | `/chat/contexts/${id}` | Supprime un contexte de chat |
| GET | `/notifications` | Récupère toutes les notifications |
| POST | `/notifications` | Crée une nouvelle notification |
| PUT | `/notifications/${id}/read` | Marque une notification comme lue |

### 14. Dashboard et métriques

#### Dashboard principal

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/dashboard` | Récupère les données du tableau de bord principal |
| GET | `/dashboard/traditional` | Récupère le tableau de bord traditionnel |

#### Métriques OHADA

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/dashboard/ohada` | Récupère les métriques de conformité OHADA globales |
| GET | `/dashboard/ohada/portfolio/${portfolioId}` | Récupère les métriques OHADA d'un portefeuille spécifique |

#### Préférences et widgets

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/dashboard/preferences` | Récupère les préférences du tableau de bord |
| PUT | `/dashboard/preferences/widget` | Met à jour les préférences d'un widget |

### 15. Notifications

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/notifications` | Récupère toutes les notifications |
| POST | `/notifications` | Crée une nouvelle notification |
| GET | `/notifications/unread-count` | Récupère le nombre de notifications non lues |
| POST | `/notifications/${id}/read` | Marque une notification comme lue |
| DELETE | `/notifications/${id}` | Supprime une notification |

### 16. Chat Portfolio

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/portfolio-chat` | Récupère toutes les conversations de chat |
| POST | `/portfolio-chat` | Crée une nouvelle conversation |
| GET | `/portfolio-chat/${id}` | Récupère une conversation par son ID |
| PUT | `/portfolio-chat/${id}` | Met à jour une conversation |
| DELETE | `/portfolio-chat/${id}` | Supprime une conversation |

### 17. Synchronisation

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/sync/status` | Récupère le statut de synchronisation |
| POST | `/sync/pull` | Récupère les changements du serveur |
| POST | `/sync/push` | Envoie les changements locaux |
| POST | `/sync/reset` | Réinitialise l'état de synchronisation |

### 18. Autres endpoints généraux

#### Santé du service

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/health` | Vérification de la santé du service (sans authentification) |

#### Gestion d'institution

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/institution/managers` | Récupère tous les gestionnaires d'institution |
| POST | `/institution/managers` | Crée un nouveau gestionnaire |
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

## ✨ Nouvelles fonctionnalités découvertes (Mise à jour du 10 novembre 2025)

Cette section documente les nouvelles fonctionnalités ajoutées au service portfolio-institution qui n'étaient pas documentées précédemment :

### 🔄 Workflow avancé des contrats
- **États étendus** : Support complet des états DRAFT, ACTIVE, SUSPENDED, DEFAULTED, LITIGATION, COMPLETED, CANCELLED
- **Transitions contrôlées** : Actions spécialisées pour chaque changement d'état avec validation
- **Traçabilité complète** : Historique détaillé de tous les changements d'état

### 👥 Gestion avancée des utilisateurs
- **Préférences granulaires** : Système de préférences par catégorie (UI, notifications, sécurité, etc.)
- **Suivi d'activité** : Historique complet des actions utilisateur avec horodatage
- **Gestion de sessions** : Contrôle des sessions actives et déconnexion sélective

### 📊 Dashboard OHADA et métriques
- **Conformité OHADA** : Métriques spécialisées pour la conformité aux normes OHADA
- **Widgets personnalisables** : Interface de tableau de bord configurable par utilisateur
- **Métriques par portefeuille** : Analyses détaillées par type de financement

### 🔍 Système d'évaluation des risques
- **Évaluations multicritères** : Support pour crédit, leasing et investissement
- **Centrale des risques** : Interface avec les organismes de régulation financière
- **Scoring automatisé** : Calculs de risque en temps réel avec historique

### 💳 Ordres de paiement génériques
- **Multi-financement** : Support pour tous types de financement (crédit, leasing, investissement)
- **Workflow d'approbation** : Processus de validation avec états (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
- **Traçabilité bancaire** : Suivi complet jusqu'à confirmation bancaire

### 🔔 Notifications et chat intégrés
- **Système de notifications** : Gestion complète des notifications avec compteur de non-lus
- **Chat portfolio** : Conversations contextuelles liées aux portfolios et opérations

### 🚀 Améliorations techniques

#### Structure d'URL simplifiée
- **URLs consolidées** : Simplification de `/portfolios/traditional/` vers `/portfolios/` et `/contracts/`
- **Cohérence API** : Standardisation des patterns d'URL sur l'ensemble du service

#### Filtrage et pagination avancés
- **Filtres uniformes** : Support cohérent des filtres par statut, type, dates sur tous les endpoints
- **Pagination optimisée** : Métadonnées complètes (total, pages, limites) sur toutes les listes

#### Sécurité renforcée
- **Authentification JWT** : Intégration complète avec Auth0
- **Contrôle d'accès** : Vérification des permissions par rôle sur tous les endpoints
- **Audit trail** : Traçabilité complète des actions utilisateur

---

*Documentation mise à jour le 10 novembre 2025 suite à l'analyse complète du code source du portfolio-institution-service.*
