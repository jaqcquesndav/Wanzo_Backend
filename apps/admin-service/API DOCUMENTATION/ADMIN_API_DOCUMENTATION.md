# Documentation de l'API du microservice Admin

Cette documentation décrit la structure des URLs et les endpoints disponibles pour communiquer avec le microservice Admin via l'API Gateway.

## Informations générales

- **Base URL**: `http://localhost:8000/admin`
- **Version API**: v1
- **Port API Gateway**: 8000
- **Port Microservice Admin**: 3001 (interne)

## Authentification

Toutes les requêtes nécessitent une authentification via un token JWT.

**Headers requis**:
```
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

## Structure des URLs

Tous les endpoints du microservice sont accessibles via l'API Gateway à l'adresse suivante:
`http://localhost:8000/admin/api/<endpoint>`

## Endpoints disponibles

### 1. Authentification (Auth)

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/auth/validate-token` | Valide le token JWT et enrichit le profil |
| GET | `/auth/me` | Récupère le profil de l'utilisateur connecté |
| POST | `/auth/refresh` | Rafraîchit le token JWT |
| POST | `/auth/logout` | Déconnecte l'utilisateur |
| PUT | `/auth/profile` | Met à jour le profil de l'utilisateur |
| POST | `/auth/password` | Modifie le mot de passe |
| POST | `/auth/2fa/enable` | Active l'authentification à deux facteurs |
| POST | `/auth/2fa/disable` | Désactive l'authentification à deux facteurs |
| POST | `/auth/2fa/verify` | Vérifie un code d'authentification à deux facteurs |

### 2. Gestion des Utilisateurs (Admin Users)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/admin/users` | Liste tous les utilisateurs |
| POST | `/admin/users` | Crée un nouvel utilisateur |
| GET | `/admin/users/:id` | Récupère un utilisateur par son ID |
| PUT | `/admin/users/:id` | Met à jour un utilisateur |
| DELETE | `/admin/users/:id` | Supprime un utilisateur |
| PUT | `/admin/users/:id/status` | Active ou désactive un utilisateur |
| POST | `/admin/users/:id/reset-password` | Réinitialise le mot de passe d'un utilisateur |
| GET | `/admin/users/:id/permissions` | Récupère les permissions d'un utilisateur |
| PUT | `/admin/users/:id/permissions` | Met à jour les permissions d'un utilisateur |
| GET | `/admin/users/:id/activity` | Récupère l'historique d'activité d'un utilisateur |

**Paramètres de filtrage pour GET /admin/users**:
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 10)
- `search`: Terme de recherche (nom, email, etc.)
- `role`: Filtrer par rôle (`SUPER_ADMIN`, `COMPANY_ADMIN`, etc.)
- `status`: Filtrer par statut (`active`, `inactive`, etc.)

### 3. Gestion des Clients (Admin Customers)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/admin/customers` | Liste tous les clients |
| GET | `/admin/customers/:id` | Récupère un client par son ID |
| POST | `/admin/customers/:id/validate` | Valide un client |
| POST | `/admin/customers/:id/suspend` | Suspend un client |
| POST | `/admin/customers/:id/reactivate` | Réactive un client |
| GET | `/admin/customers/:id/users` | Liste tous les utilisateurs d'un client |
| GET | `/admin/customers/:id/subscriptions` | Liste tous les abonnements d'un client |
| GET | `/admin/customers/:id/usage` | Récupère l'utilisation des services par un client |

### 4. Gestion de l'Entreprise (Company)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/company/profile` | Récupère le profil de l'entreprise |
| PUT | `/api/company/profile` | Met à jour le profil de l'entreprise |
| POST | `/api/company/logo` | Upload un logo d'entreprise |
| GET | `/api/company/documents` | Liste tous les documents de l'entreprise |
| POST | `/api/company/documents` | Upload un document |
| DELETE | `/api/company/documents/:id` | Supprime un document |
| POST | `/api/company/locations` | Ajoute une localisation |
| PUT | `/api/company/locations/:id` | Met à jour une localisation |
| DELETE | `/api/company/locations/:id` | Supprime une localisation |

### 5. Tableau de Bord (Dashboard)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/dashboard` | Récupère les données du tableau de bord principal |
| GET | `/api/dashboard/widgets/:widgetId` | Récupère les données d'un widget spécifique |
| GET | `/api/dashboard/kpis` | Récupère les KPIs |
| GET | `/api/dashboard/financial-summary` | Récupère le résumé financier |
| GET | `/api/dashboard/recent-activity` | Récupère les activités récentes |
| GET | `/api/dashboard/user-statistics` | Récupère les statistiques utilisateurs |
| GET | `/api/dashboard/system-health` | Récupère l'état de santé du système |
| GET | `/api/dashboard/notifications` | Récupère les notifications |
| GET | `/api/dashboard/configuration` | Récupère la configuration du tableau de bord |
| PUT | `/api/dashboard/configuration` | Met à jour la configuration du tableau de bord |

**Paramètres pour les endpoints du dashboard**:
- `userId`: ID de l'utilisateur (optionnel)
- `dateRange`: Plage de dates (format: `start_date,end_date` ou `last7days`, `last30days`, etc.)
- `timeZone`: Fuseau horaire (format: `Europe/Paris`, `UTC`, etc.)

### 6. Finance et Abonnements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/finance/subscriptions/plans` | Liste tous les plans d'abonnement disponibles |
| GET | `/finance/subscriptions` | Liste tous les abonnements |
| GET | `/finance/subscriptions/:subscriptionId` | Récupère un abonnement par son ID |
| POST | `/finance/subscriptions` | Crée un nouvel abonnement |
| PUT | `/finance/subscriptions/:subscriptionId` | Met à jour un abonnement |
| POST | `/finance/subscriptions/:subscriptionId/cancel` | Annule un abonnement |
| GET | `/finance/invoices` | Liste toutes les factures |
| GET | `/finance/invoices/:invoiceId` | Récupère une facture par son ID |
| POST | `/finance/invoices` | Crée une nouvelle facture |
| PUT | `/finance/invoices/:invoiceId` | Met à jour une facture |
| POST | `/finance/invoices/:invoiceId/send-reminder` | Envoie un rappel de facture |
| GET | `/finance/payments` | Liste tous les paiements |
| GET | `/finance/payments/:paymentId` | Récupère un paiement par son ID |
| POST | `/finance/payments/record-manual` | Enregistre un paiement manuel |
| POST | `/finance/payments/:paymentId/verify` | Vérifie un paiement |

**Paramètres de filtrage pour GET /finance/subscriptions**:
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page
- `status`: Filtrer par statut (`active`, `cancelled`, `expired`)
- `customerId`: Filtrer par ID client
- `planId`: Filtrer par ID plan

### 7. Paramètres du Système (Settings)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/settings` | Récupère tous les paramètres |
| GET | `/api/settings/general` | Récupère les paramètres généraux |
| PUT | `/api/settings/general` | Met à jour les paramètres généraux |
| GET | `/api/settings/security` | Récupère les paramètres de sécurité |
| PUT | `/api/settings/security` | Met à jour les paramètres de sécurité |
| GET | `/api/settings/notifications` | Récupère les paramètres de notifications |
| PUT | `/api/settings/notifications` | Met à jour les paramètres de notifications |
| GET | `/api/settings/billing` | Récupère les paramètres de facturation |
| PUT | `/api/settings/billing` | Met à jour les paramètres de facturation |
| GET | `/api/settings/appearance` | Récupère les paramètres d'apparence |
| PUT | `/api/settings/appearance` | Met à jour les paramètres d'apparence |
| GET | `/api/settings/user-profile` | Récupère le profil utilisateur |
| PUT | `/api/settings/user-profile` | Met à jour le profil utilisateur |
| PUT | `/api/settings/change-password` | Change le mot de passe |
| GET | `/api/settings/active-sessions` | Récupère les sessions actives |
| DELETE | `/api/settings/active-sessions/:sessionId` | Termine une session active |
| GET | `/api/settings/login-history` | Récupère l'historique de connexion |

### 8. Gestion des Documents

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/documents` | Liste tous les documents |
| GET | `/documents/:id` | Récupère un document par son ID |
| POST | `/documents` | Crée un nouveau document |
| PUT | `/documents/:id` | Met à jour un document |
| PATCH | `/documents/:id/status` | Met à jour le statut d'un document |
| DELETE | `/documents/:id` | Supprime un document |
| GET | `/documents/folders` | Liste tous les dossiers de documents |
| GET | `/documents/folders/:id` | Récupère un dossier par son ID |
| POST | `/documents/folders` | Crée un nouveau dossier |
| PUT | `/documents/folders/:id` | Met à jour un dossier |
| DELETE | `/documents/folders/:id` | Supprime un dossier |

**Paramètres de filtrage pour GET /documents**:
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page
- `type`: Filtrer par type de document
- `status`: Filtrer par statut
- `folderId`: Filtrer par dossier
- `search`: Terme de recherche

### 9. Gestion du Système

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/admin/system/health` | Récupère l'état de santé du système |
| GET | `/admin/system/logs` | Récupère les logs du système |
| GET | `/admin/system/alerts` | Récupère les alertes du système |
| PUT | `/admin/system/alerts/:alertId/resolve` | Résout une alerte système |
| GET | `/admin/system/api-performance` | Récupère les performances de l'API |
| GET | `/admin/system/database-metrics` | Récupère les métriques de la base de données |
| GET | `/admin/system/ai-models` | Récupère la liste des modèles IA |
| PUT | `/admin/system/ai-models/:modelId` | Met à jour la configuration d'un modèle IA |
| GET | `/admin/system/maintenance-status` | Récupère le statut du mode maintenance |
| PUT | `/admin/system/maintenance-mode` | Active/désactive le mode maintenance |

**Paramètres pour GET /admin/system/logs**:
- `level`: Niveau de log (`error`, `warning`, `info`, `debug`)
- `service`: Filtrer par service
- `startDate`: Date de début (format ISO)
- `endDate`: Date de fin (format ISO)
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

### 10. Gestion des Tokens

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/tokens/balance` | Récupère le solde de tokens |
| GET | `/tokens/packages` | Récupère les packages de tokens disponibles |
| POST | `/tokens/purchase` | Achète des tokens |
| GET | `/tokens/usage` | Récupère l'utilisation des tokens |
| GET | `/tokens/history` | Récupère l'historique des tokens |
| GET | `/tokens/statistics` | Récupère les statistiques des tokens |
| POST | `/tokens/allocate` | Alloue des tokens à un client ou utilisateur |

**Paramètres pour GET /tokens/usage**:
- `startDate`: Date de début
- `endDate`: Date de fin
- `service`: Filtrer par service
- `customerId`: Filtrer par client
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

### 11. Chat Support

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/chat/sessions` | Liste toutes les sessions de chat |
| POST | `/chat/sessions` | Crée une nouvelle session de chat |
| GET | `/chat/sessions/:sessionId` | Récupère une session de chat par son ID |
| PUT | `/chat/sessions/:sessionId` | Met à jour une session de chat |
| DELETE | `/chat/sessions/:sessionId` | Ferme une session de chat |
| POST | `/chat/sessions/:sessionId/assign` | Assigne un agent à une session |
| GET | `/chat/sessions/:sessionId/messages` | Récupère les messages d'une session |
| POST | `/chat/sessions/:sessionId/messages` | Envoie un nouveau message |
| POST | `/chat/sessions/:sessionId/upload` | Upload des fichiers dans une session |
| POST | `/chat/sessions/:sessionId/read` | Marque des messages comme lus |
| POST | `/chat/sessions/:sessionId/typing` | Envoie un événement de frappe |
| GET | `/chat/stats` | Récupère les statistiques de chat |

## Format des réponses

Toutes les réponses de l'API suivent le format standard suivant:

### Réponse de succès

```json
{
  "success": true,
  "data": {
    // Les données spécifiques à l'endpoint
  },
  "meta": {
    // Métadonnées comme la pagination, les timestamps, etc.
  }
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Message d'erreur détaillé",
    "details": {
      // Détails supplémentaires sur l'erreur
    }
  }
}
```

### Pagination

Les endpoints qui retournent des listes utilisent ce format de pagination:

```json
{
  "success": true,
  "data": {
    "items": [...], // Liste des éléments
    "total": 100,   // Nombre total d'éléments
    "page": 1,      // Page courante
    "limit": 20,    // Éléments par page
    "totalPages": 5 // Nombre total de pages
  },
  "meta": {
    "timestamp": "2025-08-08T10:00:00Z"
  }
}
```

## Exemples d'utilisation

### Récupérer la liste des utilisateurs

```javascript
const fetchUsers = async () => {
  try {
    const response = await fetch('http://localhost:8000/admin/api/admin/users?page=1&limit=20&role=COMPANY_ADMIN', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};
```

### Mettre à jour le profil de l'entreprise

```javascript
const updateCompanyProfile = async (profileData) => {
  try {
    const response = await fetch('http://localhost:8000/admin/api/company/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
};
```
