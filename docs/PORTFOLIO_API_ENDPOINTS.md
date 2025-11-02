# Documentation API Portfolio - Structure des Endpoints

## Vue d'ensemble

L'API Portfolio est accessible via l'API Gateway sur le préfixe unifié `/portfolio/api/v1/`. Tous les endpoints du service portfolio-institution-service passent par cette route standardisée.

## Configuration API Gateway

- **URL de base** : `http://localhost:8000`
- **Préfixe portfolio** : `/portfolio/api/v1/`
- **Service cible** : `kiota-portfolio-institution-service:3005`
- **Routage** : `/portfolio/api/v1/*` → `/*` (direct vers service)

## Structure des Endpoints

### 🏥 Santé du Service

```http
GET /portfolio/api/v1/health
```
- **Description** : Vérification de la santé du service portfolio
- **Authentification** : Non requise
- **Réponse** : Status de santé du service

### 🏛️ Gestion des Institutions

#### Institution principale
```http
GET    /portfolio/api/v1/institution
POST   /portfolio/api/v1/institution
PUT    /portfolio/api/v1/institution/:id
DELETE /portfolio/api/v1/institution/:id
```

#### Utilisateurs d'institution
```http
GET    /portfolio/api/v1/institution/users
POST   /portfolio/api/v1/institution/users
GET    /portfolio/api/v1/institution/users/:id
PUT    /portfolio/api/v1/institution/users/:id
DELETE /portfolio/api/v1/institution/users/:id
```

### 💼 Gestion des Portfolios

#### Portfolios traditionnels
```http
GET    /portfolio/api/v1/portfolios/traditional
POST   /portfolio/api/v1/portfolios/traditional
GET    /portfolio/api/v1/portfolios/traditional/:id
PUT    /portfolio/api/v1/portfolios/traditional/:id
DELETE /portfolio/api/v1/portfolios/traditional/:id
POST   /portfolio/api/v1/portfolios/traditional/:id/close
```

#### Produits de portfolio
```http
GET /portfolio/api/v1/portfolios/traditional/:id/products
```

### 📋 Demandes de Crédit

```http
GET    /portfolio/api/v1/portfolios/traditional/credit-requests
POST   /portfolio/api/v1/portfolios/traditional/credit-requests
GET    /portfolio/api/v1/portfolios/traditional/credit-requests/:id
PUT    /portfolio/api/v1/portfolios/traditional/credit-requests/:id
DELETE /portfolio/api/v1/portfolios/traditional/credit-requests/:id
POST   /portfolio/api/v1/portfolios/traditional/credit-requests/:id/approve
POST   /portfolio/api/v1/portfolios/traditional/credit-requests/:id/reject
```

### 📜 Contrats de Crédit

```http
GET  /portfolio/api/v1/portfolios/traditional/credit-contracts
POST /portfolio/api/v1/portfolios/traditional/credit-contracts/from-request
GET  /portfolio/api/v1/portfolios/traditional/credit-contracts/:id
PUT  /portfolio/api/v1/portfolios/traditional/credit-contracts/:id
```

#### Actions sur les contrats
```http
POST /portfolio/api/v1/portfolios/traditional/credit-contracts/:id/activate
POST /portfolio/api/v1/portfolios/traditional/credit-contracts/:id/suspend
POST /portfolio/api/v1/portfolios/traditional/credit-contracts/:id/default
POST /portfolio/api/v1/portfolios/traditional/credit-contracts/:id/restructure
POST /portfolio/api/v1/portfolios/traditional/credit-contracts/:id/litigation
POST /portfolio/api/v1/portfolios/traditional/credit-contracts/:id/complete
POST /portfolio/api/v1/portfolios/traditional/credit-contracts/:id/cancel
```

#### Échéancier
```http
GET /portfolio/api/v1/portfolios/traditional/credit-contracts/:id/schedule
```

### 💸 Débloquements (Disbursements)

```http
GET  /portfolio/api/v1/portfolios/traditional/disbursements
POST /portfolio/api/v1/portfolios/traditional/disbursements
GET  /portfolio/api/v1/portfolios/traditional/disbursements/:id
```

#### Actions sur les débloquements
```http
POST /portfolio/api/v1/portfolios/traditional/disbursements/:id/approve
POST /portfolio/api/v1/portfolios/traditional/disbursements/:id/reject
POST /portfolio/api/v1/portfolios/traditional/disbursements/:id/process
POST /portfolio/api/v1/portfolios/traditional/disbursements/:id/cancel
```

### 💰 Remboursements

```http
GET  /portfolio/api/v1/portfolios/traditional/repayments
POST /portfolio/api/v1/portfolios/traditional/repayments
GET  /portfolio/api/v1/portfolios/traditional/repayments/:id
```

### 📅 Échéanciers de Paiement

```http
POST /portfolio/api/v1/portfolios/traditional/payment-schedules/simulate
```

### 💵 Demandes de Financement

```http
GET    /portfolio/api/v1/portfolios/traditional/funding-requests
POST   /portfolio/api/v1/portfolios/traditional/funding-requests
GET    /portfolio/api/v1/portfolios/traditional/funding-requests/:id
PUT    /portfolio/api/v1/portfolios/traditional/funding-requests/:id
DELETE /portfolio/api/v1/portfolios/traditional/funding-requests/:id
PUT    /portfolio/api/v1/portfolios/traditional/funding-requests/:id/status
```

### 💬 Chat Portfolio

```http
GET    /portfolio/api/v1/portfolio-chat
POST   /portfolio/api/v1/portfolio-chat
GET    /portfolio/api/v1/portfolio-chat/:id
PUT    /portfolio/api/v1/portfolio-chat/:id
DELETE /portfolio/api/v1/portfolio-chat/:id
```

### 💸 Virements

```http
GET    /portfolio/api/v1/virements
POST   /portfolio/api/v1/virements
GET    /portfolio/api/v1/virements/:id
PATCH  /portfolio/api/v1/virements/:id
DELETE /portfolio/api/v1/virements/:id
```

#### Virements par portfolio/contrat
```http
GET /portfolio/api/v1/virements/portfolio/:portfolioId
GET /portfolio/api/v1/virements/contract/:contractReference
```

#### Statut des virements
```http
PATCH /portfolio/api/v1/virements/:id/status
```

### 🔔 Notifications

```http
GET    /portfolio/api/v1/notifications
GET    /portfolio/api/v1/notifications/unread-count
POST   /portfolio/api/v1/notifications/:id/read
DELETE /portfolio/api/v1/notifications/:id
```

### ⚙️ Paramètres

```http
GET    /portfolio/api/v1/settings/public
GET    /portfolio/api/v1/settings/:key
POST   /portfolio/api/v1/settings
PUT    /portfolio/api/v1/settings/:key
DELETE /portfolio/api/v1/settings/:key
```

#### Paramètres spécialisés
```http
GET /portfolio/api/v1/settings/general
PUT /portfolio/api/v1/settings/general
GET /portfolio/api/v1/settings/security
PUT /portfolio/api/v1/settings/security
```

### 📄 Documents

```http
GET    /portfolio/api/v1/documents
POST   /portfolio/api/v1/documents
GET    /portfolio/api/v1/documents/:id
PUT    /portfolio/api/v1/documents/:id
DELETE /portfolio/api/v1/documents/:id
```

#### Actions sur les documents
```http
PUT    /portfolio/api/v1/documents/:id/file
PUT    /portfolio/api/v1/documents/:id/archive
DELETE /portfolio/api/v1/documents/:id/permanent
```

## Authentification

Tous les endpoints (sauf `/health`) nécessitent une authentification JWT :

```http
Authorization: Bearer <jwt_token>
```

## Codes de Réponse

- **200** : Succès
- **201** : Créé avec succès
- **400** : Requête invalide
- **401** : Non authentifié
- **403** : Non autorisé (permissions insuffisantes)
- **404** : Ressource non trouvée
- **500** : Erreur serveur

## Exemples d'utilisation

### Test de connectivité
```bash
curl -X GET http://localhost:8000/portfolio/api/v1/health
```

### Récupérer les portfolios traditionnels
```bash
curl -X GET \
  http://localhost:8000/portfolio/api/v1/portfolios/traditional \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Créer une demande de crédit
```bash
curl -X POST \
  http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-requests \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000, "purpose": "Business expansion"}'
```

## Migration depuis l'ancien préfixe

⚠️ **Important** : L'ancien préfixe `/portfolio_inst/` a été **déprécié**. 

### Correspondances de migration :
- ❌ `/portfolio_inst/portfolios/traditional/credit-contracts` 
- ✅ `/portfolio/api/v1/portfolios/traditional/credit-contracts`

- ❌ `/portfolio_inst/portfolios/traditional/disbursements`
- ✅ `/portfolio/api/v1/portfolios/traditional/disbursements`

- ❌ `/portfolio_inst/portfolios/traditional/repayments`
- ✅ `/portfolio/api/v1/portfolios/traditional/repayments`

Tous les endpoints doivent maintenant utiliser le préfixe unifié `/portfolio/api/v1/`.

## Support

Pour toute question concernant l'API Portfolio, consultez :
- Logs du service : `docker logs kiota-portfolio-institution-service`
- Logs de l'API Gateway : `docker logs kiota-api-gateway`
- Documentation Swagger : `http://localhost:8000/api/docs` (si disponible)