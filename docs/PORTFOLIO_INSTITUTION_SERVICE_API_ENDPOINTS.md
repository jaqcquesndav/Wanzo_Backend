# Portfolio Institution Service - API Endpoints Documentation

## 🏦 Vue d'ensemble

Ce document décrit tous les endpoints disponibles pour le **Portfolio Institution Service** via l'**API Gateway**.

**URL de base via API Gateway :** `http://localhost:8000/portfolio/api/v1`

**Port direct du service :** `http://localhost:3005` (pour développement uniquement)

---

## 🔄 Routage API Gateway

```
API Gateway Pattern: /portfolio/api/v1/*
↓
Portfolio Service: /* (suppression du préfixe /portfolio/api/v1)
```

**Exemple :**
- Frontend appelle : `http://localhost:8000/portfolio/api/v1/portfolios/traditional`
- API Gateway route vers : `http://kiota-portfolio-institution-service:3005/portfolios/traditional`

---

## 🔐 Authentification

**Tous les endpoints nécessitent un token JWT Auth0 :**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📂 1. PORTFOLIOS TRADITIONNELS

### Base URL : `/portfolio/api/v1/portfolios/traditional`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste tous les portfolios traditionnels | Tous |
| `GET` | `/:id` | Obtenir un portfolio par ID | Tous |
| `GET` | `/:id/products` | Obtenir portfolio avec ses produits financiers | Tous |
| `POST` | `/` | Créer un nouveau portfolio | `admin` |
| `PUT` | `/:id` | Mettre à jour un portfolio | `admin` |
| `DELETE` | `/:id` | Supprimer un portfolio | `admin` |
| `POST` | `/:id/close` | Fermer un portfolio | `admin` |

#### Paramètres de requête pour `GET /`
```
?page=1&limit=10&status=active&manager=userId&client=clientId
&dateFrom=2024-01-01&dateTo=2024-12-31&search=keyword
&sortBy=createdAt&sortOrder=desc
```

#### Exemple d'appel
```bash
GET http://localhost:8000/portfolio/api/v1/portfolios/traditional?page=1&limit=10&status=active
```

---

## 💰 2. DEMANDES DE CRÉDIT

### Base URL : `/portfolio/api/v1/portfolios/traditional/credit-requests`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste toutes les demandes de crédit | Tous |
| `GET` | `/:id` | Obtenir une demande par ID | Tous |
| `POST` | `/` | Créer une nouvelle demande | `admin`, `credit_manager` |
| `PUT` | `/:id` | Mettre à jour une demande | `admin`, `credit_manager` |
| `DELETE` | `/:id` | Supprimer une demande | `admin` |
| `POST` | `/:id/approve` | Approuver une demande | `admin`, `credit_manager` |
| `POST` | `/:id/reject` | Rejeter une demande | `admin`, `credit_manager` |

#### Paramètres de requête pour `GET /`
```
?page=1&limit=10&portfolioId=uuid&status=pending&clientId=uuid
&productType=loan&dateFrom=2024-01-01&dateTo=2024-12-31
&search=keyword&sortBy=createdAt&sortOrder=desc
```

#### Exemple d'appel
```bash
GET http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-requests?status=pending
POST http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-requests/123/approve
```

---

## 💸 3. VIREMENTS (DISBURSEMENTS)

### Base URL : `/portfolio/api/v1/virements`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste tous les virements | Tous |
| `GET` | `/:id` | Obtenir un virement par ID | Tous |
| `GET` | `/portfolio/:portfolioId` | Virements par portfolio | Tous |
| `GET` | `/contract/:contractReference` | Virements par contrat | Tous |
| `POST` | `/` | Créer un nouveau virement | Selon rôles |
| `PATCH` | `/:id` | Mettre à jour un virement | Selon rôles |
| `PATCH` | `/:id/status` | Mettre à jour le statut | Selon rôles |
| `DELETE` | `/:id` | Supprimer un virement | Selon rôles |

#### Paramètres de requête pour `GET /`
```
?page=1&limit=10&status=pending&portfolioId=uuid
```

#### Statuts disponibles
- `pending` - En attente
- `approved` - Approuvé
- `disbursed` - Décaissé
- `rejected` - Rejeté

#### Exemple d'appel
```bash
GET http://localhost:8000/portfolio/api/v1/virements?status=pending&portfolioId=123
POST http://localhost:8000/portfolio/api/v1/virements
PATCH http://localhost:8000/portfolio/api/v1/virements/456/status
```

---

## 🎯 4. PROSPECTION

### Base URL : `/portfolio/api/v1/prospects`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste tous les prospects | Tous |
| `GET` | `/:id` | Obtenir un prospect par ID | Tous |
| `POST` | `/` | Créer un nouveau prospect | Selon rôles |
| `PUT` | `/:id` | Mettre à jour un prospect | Selon rôles |
| `DELETE` | `/:id` | Supprimer un prospect | Selon rôles |
| `POST` | `/:id/documents` | Ajouter un document | Selon rôles |
| `POST` | `/:id/contact-history` | Ajouter historique contact | Selon rôles |

#### Exemple d'appel
```bash
GET http://localhost:8000/portfolio/api/v1/prospects
POST http://localhost:8000/portfolio/api/v1/prospects/123/documents
```

---

## 📊 5. CAMPAGNES DE PROSPECTION

### Base URL : `/portfolio/api/v1/campaigns`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste toutes les campagnes | Tous |
| `GET` | `/:id` | Obtenir une campagne par ID | Tous |
| `POST` | `/` | Créer une nouvelle campagne | Selon rôles |
| `PUT` | `/:id` | Mettre à jour une campagne | Selon rôles |
| `DELETE` | `/:id` | Supprimer une campagne | Selon rôles |

---

## 📈 6. STATISTIQUES ET LEADS

### Base URL : `/portfolio/api/v1/stats` et `/portfolio/api/v1/leads`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/stats` | Statistiques générales | Tous |
| `GET` | `/leads` | Liste des leads | Tous |
| `GET` | `/leads/:id` | Obtenir un lead par ID | Tous |
| `POST` | `/leads` | Créer un nouveau lead | Selon rôles |

---

## 💾 7. PRODUITS FINANCIERS

### Base URL : `/portfolio/api/v1/financial-products`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste tous les produits financiers | Tous |
| `GET` | `/:id` | Obtenir un produit par ID | Tous |
| `POST` | `/` | Créer un nouveau produit | `admin` |
| `PUT` | `/:id` | Mettre à jour un produit | `admin` |
| `DELETE` | `/:id` | Supprimer un produit | `admin` |

---

## 📄 8. DOCUMENTS

### Base URL : `/portfolio/api/v1/documents`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste tous les documents | Tous |
| `GET` | `/:id` | Obtenir un document par ID | Tous |
| `POST` | `/` | Uploader un nouveau document | Selon rôles |
| `DELETE` | `/:id` | Supprimer un document | Selon rôles |

---

## 💳 9. DEMANDES DE FINANCEMENT

### Base URL : `/portfolio/api/v1/funding-requests`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste toutes les demandes | Tous |
| `GET` | `/:id` | Obtenir une demande par ID | Tous |
| `POST` | `/` | Créer une nouvelle demande | Selon rôles |
| `PUT` | `/:id` | Mettre à jour une demande | Selon rôles |
| `DELETE` | `/:id` | Supprimer une demande | Selon rôles |

---

## 📅 10. ÉCHÉANCIERS DE PAIEMENT

### Base URL : `/portfolio/api/v1/payment-schedules`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste tous les échéanciers | Tous |
| `GET` | `/:id` | Obtenir un échéancier par ID | Tous |
| `POST` | `/` | Créer un nouvel échéancier | Selon rôles |
| `PUT` | `/:id` | Mettre à jour un échéancier | Selon rôles |

---

## 💰 11. REMBOURSEMENTS

### Base URL : `/portfolio/api/v1/repayments`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste tous les remboursements | Tous |
| `GET` | `/:id` | Obtenir un remboursement par ID | Tous |
| `POST` | `/` | Enregistrer un remboursement | Selon rôles |
| `PUT` | `/:id` | Mettre à jour un remboursement | Selon rôles |

---

## 👥 12. GESTION DES UTILISATEURS

### Base URL : `/portfolio/api/v1/users`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste tous les utilisateurs | `admin` |
| `GET` | `/:id` | Obtenir un utilisateur par ID | `admin` |
| `POST` | `/` | Créer un nouvel utilisateur | `admin` |
| `PUT` | `/:id` | Mettre à jour un utilisateur | `admin` |
| `DELETE` | `/:id` | Supprimer un utilisateur | `admin` |

---

## ⚙️ 13. PARAMÈTRES ET CONFIGURATION

### Base URL : `/portfolio/api/v1/settings`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Obtenir les paramètres | Tous |
| `PUT` | `/` | Mettre à jour les paramètres | `admin` |
| `GET` | `/api-keys` | Liste des clés API | `admin` |
| `POST` | `/api-keys` | Créer une clé API | `admin` |
| `DELETE` | `/api-keys/:id` | Supprimer une clé API | `admin` |

---

## 🔔 14. WEBHOOKS

### Base URL : `/portfolio/api/v1/webhooks`

| Méthode | Endpoint | Description | Rôles requis |
|---------|----------|-------------|--------------|
| `GET` | `/` | Liste tous les webhooks | `admin` |
| `POST` | `/` | Créer un webhook | `admin` |
| `PUT` | `/:id` | Mettre à jour un webhook | `admin` |
| `DELETE` | `/:id` | Supprimer un webhook | `admin` |

---

## 🚨 Gestion des erreurs

### Codes de statut HTTP

| Code | Description |
|------|-------------|
| `200` | Succès |
| `201` | Créé avec succès |
| `400` | Requête invalide |
| `401` | Token manquant ou invalide |
| `403` | Accès interdit (rôle insuffisant) |
| `404` | Ressource non trouvée |
| `500` | Erreur serveur interne |

### Format des réponses

**Succès :**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Erreur :**
```json
{
  "success": false,
  "error": "Message d'erreur",
  "statusCode": 400,
  "timestamp": "2025-11-02T14:30:00Z"
}
```

---

## 🔧 Exemples d'utilisation

### JavaScript/TypeScript (Frontend)

```typescript
// Configuration de base
const API_BASE_URL = 'http://localhost:8000/portfolio/api/v1';
const authToken = 'your-jwt-token';

const headers = {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
};

// Obtenir tous les portfolios
const getPortfolios = async () => {
  const response = await fetch(`${API_BASE_URL}/portfolios/traditional`, {
    headers
  });
  return response.json();
};

// Créer une demande de crédit
const createCreditRequest = async (data) => {
  const response = await fetch(`${API_BASE_URL}/portfolios/traditional/credit-requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  return response.json();
};

// Obtenir les virements avec filtres
const getDisbursements = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/virements?${params}`, {
    headers
  });
  return response.json();
};
```

### cURL (Tests)

```bash
# Obtenir tous les portfolios
curl -X GET "http://localhost:8000/portfolio/api/v1/portfolios/traditional" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Créer un virement
curl -X POST "http://localhost:8000/portfolio/api/v1/virements" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "portfolioId": "123", "contractReference": "CT001"}'

# Approuver une demande de crédit
curl -X POST "http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-requests/456/approve" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Demande approuvée après vérification"}'
```

---

## 📝 Notes importantes

1. **Tous les endpoints nécessitent une authentification JWT Auth0**
2. **Les rôles sont vérifiés pour les opérations sensibles**
3. **La pagination est disponible sur la plupart des endpoints de listing**
4. **Les filtres et tri sont supportés sur les endpoints de recherche**
5. **Les réponses suivent un format standardisé avec `success`, `data`, et `meta`**
6. **Utiliser toujours l'API Gateway pour les appels depuis le frontend**

---

## 🔄 Mise à jour

Ce document est maintenu à jour avec les changements de l'API. Dernière mise à jour : **2 novembre 2025**

---

## 📞 Support

Pour des questions ou problèmes avec l'API, vérifiez :
1. Les logs de l'API Gateway : `docker logs kiota-api-gateway`
2. Les logs du service Portfolio : `docker logs kiota-portfolio-institution-service`
3. La connectivité réseau entre les services