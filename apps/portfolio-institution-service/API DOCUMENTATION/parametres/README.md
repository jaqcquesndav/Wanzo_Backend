# Documentation de l'API Paramètres

Cette section détaille les endpoints de l'API liés aux paramètres (settings) de la plateforme Wanzo Portfolio Institution. Ces endpoints permettent de configurer et personnaliser l'application, gérer les paramètres de sécurité, les notifications, les intégrations et les fonctionnalités système.

## Paramètres d'application

### Récupération des paramètres d'application

Récupère tous les paramètres de l'application, regroupés par catégories.

#### Requête

```
GET /settings
```

#### Réponse

```json
{
  "general": {
    "applicationName": "Wanzo Portfolio Institution",
    "logo": "https://api.wanzo.com/storage/settings/logo.png",
    "favicon": "https://api.wanzo.com/storage/settings/favicon.ico",
    "primaryColor": "#336699",
    "secondaryColor": "#99CCFF",
    "tertiaryColor": "#FFFFFF",
    "currency": "CDF",
    "language": "fr",
    "theme": "light",
    "twoFactorEnabled": true,
    "notificationsEnabled": true,
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h",
    "subscription": {
      "plan": "premium",
      "status": "active",
      "expiryDate": "2025-12-31T23:59:59Z",
      "autoRenew": true
    },
    "paymentMethods": {
      "mobileMoney": {
        "airtel": true,
        "orange": true,
        "mpesa": false
      },
      "cards": {
        "visa": true,
        "mastercard": true,
        "paypal": false
      }
    }
  },
  "security": {
    "passwordPolicy": {
      "minLength": 10,
      "requireLowercase": true,
      "requireUppercase": true,
      "requireNumbers": true,
      "requireSpecialChars": true,
      "expiryDays": 90
    },
    "sessionTimeout": 30,
    "mfaEnabled": true,
    "mfaMethods": ["authenticator", "sms"]
  },
  "notifications": {
    "emailEnabled": true,
    "pushEnabled": true,
    "desktopEnabled": false,
    "notificationSettings": {
      "portfolio_update": {
        "enabled": true,
        "channels": ["email", "push"]
      },
      "risk_alert": {
        "enabled": true,
        "channels": ["email", "push"]
      },
      "payment_due": {
        "enabled": true,
        "channels": ["email"]
      }
    }
  },
  "integration": {
    "apiKeys": [
      {
        "id": "apikey-123456",
        "name": "Système CRM",
        "createdAt": "2025-03-15T10:30:00Z",
        "lastUsed": "2025-07-23T14:45:12Z",
        "status": "active"
      },
      {
        "id": "apikey-123457",
        "name": "Système de reporting",
        "createdAt": "2025-05-20T11:15:30Z",
        "lastUsed": "2025-07-22T09:30:45Z",
        "status": "active"
      }
    ],
    "webhooks": [
      {
        "id": "webhook-123456",
        "event": "portfolio.created",
        "url": "https://example.com/webhooks/portfolio",
        "active": true
      },
      {
        "id": "webhook-123457",
        "event": "risk.alert",
        "url": "https://example.com/webhooks/alerts",
        "active": true
      }
    ]
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

### Mise à jour des paramètres généraux

Met à jour les paramètres généraux de l'application.

#### Requête

```
PUT /settings/general
```

#### Corps de la requête

```json
{
  "applicationName": "Wanzo Portfolio Pro",
  "primaryColor": "#2255AA",
  "secondaryColor": "#88BBEE",
  "currency": "USD",
  "language": "en",
  "dateFormat": "MM/DD/YYYY"
}
```

#### Réponse

```json
{
  "success": true,
  "settings": {
    "applicationName": "Wanzo Portfolio Pro",
    "logo": "https://api.wanzo.com/storage/settings/logo.png",
    "favicon": "https://api.wanzo.com/storage/settings/favicon.ico",
    "primaryColor": "#2255AA",
    "secondaryColor": "#88BBEE",
    "tertiaryColor": "#FFFFFF",
    "currency": "USD",
    "language": "en",
    "dateFormat": "MM/DD/YYYY",
    "timeFormat": "24h"
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Paramètres incorrects |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

## Paramètres de sécurité

### Mise à jour des paramètres de sécurité

Met à jour les paramètres de sécurité de l'application.

#### Requête

```
PUT /settings/security
```

#### Corps de la requête

```json
{
  "passwordPolicy": {
    "minLength": 12,
    "requireSpecialChars": true,
    "expiryDays": 60
  },
  "sessionTimeout": 15,
  "mfaEnabled": true,
  "mfaMethods": ["authenticator", "sms", "email"]
}
```

#### Réponse

```json
{
  "success": true,
  "settings": {
    "passwordPolicy": {
      "minLength": 12,
      "requireLowercase": true,
      "requireUppercase": true,
      "requireNumbers": true,
      "requireSpecialChars": true,
      "expiryDays": 60
    },
    "sessionTimeout": 15,
    "mfaEnabled": true,
    "mfaMethods": ["authenticator", "sms", "email"]
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Paramètres incorrects |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

## Paramètres de notification

### Mise à jour des paramètres de notification

Met à jour les paramètres de notification de l'application.

#### Requête

```
PUT /settings/notifications
```

#### Corps de la requête

```json
{
  "emailEnabled": true,
  "pushEnabled": true,
  "desktopEnabled": true,
  "notificationSettings": {
    "risk_alert": {
      "enabled": true,
      "channels": ["email", "push", "desktop"]
    },
    "payment_due": {
      "enabled": true,
      "channels": ["email", "push"]
    }
  }
}
```

#### Réponse

```json
{
  "success": true,
  "settings": {
    "emailEnabled": true,
    "pushEnabled": true,
    "desktopEnabled": true,
    "notificationSettings": {
      "portfolio_update": {
        "enabled": true,
        "channels": ["email", "push"]
      },
      "risk_alert": {
        "enabled": true,
        "channels": ["email", "push", "desktop"]
      },
      "payment_due": {
        "enabled": true,
        "channels": ["email", "push"]
      }
    }
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Paramètres incorrects |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

## Clés API

### Création d'une clé API

Crée une nouvelle clé API pour intégrer des systèmes externes.

#### Requête

```
POST /settings/api-keys
```

#### Corps de la requête

```json
{
  "name": "Système ERP",
  "permissions": ["portfolio.read", "risk.read", "payment.read"]
}
```

#### Réponse

```json
{
  "id": "apikey-123458",
  "name": "Système ERP",
  "key": "wz_api_123abc456def789ghi", 
  "permissions": ["portfolio.read", "risk.read", "payment.read"],
  "createdAt": "2025-07-24T10:15:30Z",
  "status": "active"
}
```

> **Note importante** : La clé API complète (`key`) n'est retournée qu'une seule fois lors de la création. Assurez-vous de la sauvegarder car elle ne pourra plus être récupérée ultérieurement.

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données manquantes ou incorrectes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 409  | Conflit - Une clé avec ce nom existe déjà |
| 500  | Erreur serveur interne |

### Révocation d'une clé API

Révoque (supprime) une clé API existante.

#### Requête

```
DELETE /settings/api-keys/:id
```

#### Paramètres

| Paramètre | Type   | Description |
|-----------|--------|-------------|
| id        | string | Identifiant de la clé API |

#### Réponse

```
204 No Content
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Clé API non trouvée |
| 500  | Erreur serveur interne |

## Webhooks

### Création d'un webhook

Crée un nouveau webhook pour recevoir des notifications lors d'événements spécifiques.

#### Requête

```
POST /settings/webhooks
```

#### Corps de la requête

```json
{
  "event": "portfolio.created",
  "url": "https://example.com/webhooks/portfolio-events",
  "active": true,
  "secret": "webhookSecret123"
}
```

#### Réponse

```json
{
  "id": "webhook-123458",
  "event": "portfolio.created",
  "url": "https://example.com/webhooks/portfolio-events",
  "active": true,
  "createdAt": "2025-07-24T11:30:00Z"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données manquantes ou incorrectes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

### Mise à jour d'un webhook

Met à jour un webhook existant.

#### Requête

```
PUT /settings/webhooks/:id
```

#### Paramètres

| Paramètre | Type   | Description |
|-----------|--------|-------------|
| id        | string | Identifiant du webhook |

#### Corps de la requête

```json
{
  "url": "https://example.com/webhooks/new-endpoint",
  "active": false
}
```

#### Réponse

```json
{
  "id": "webhook-123458",
  "event": "portfolio.created",
  "url": "https://example.com/webhooks/new-endpoint",
  "active": false,
  "updatedAt": "2025-07-24T14:45:00Z"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données incorrectes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Webhook non trouvé |
| 500  | Erreur serveur interne |

### Suppression d'un webhook

Supprime un webhook existant.

#### Requête

```
DELETE /settings/webhooks/:id
```

#### Paramètres

| Paramètre | Type   | Description |
|-----------|--------|-------------|
| id        | string | Identifiant du webhook |

#### Réponse

```
204 No Content
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Webhook non trouvé |
| 500  | Erreur serveur interne |

### Test d'un webhook

Teste un webhook en envoyant un événement factice.

#### Requête

```
POST /settings/webhooks/:id/test
```

#### Paramètres

| Paramètre | Type   | Description |
|-----------|--------|-------------|
| id        | string | Identifiant du webhook |

#### Réponse

```json
{
  "success": true,
  "message": "Webhook testé avec succès",
  "details": {
    "statusCode": 200,
    "response": "{ \"received\": true }",
    "latency": 245
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Webhook non trouvé |
| 500  | Erreur serveur interne |

## Paramètres système

### Récupération des paramètres système

Récupère les informations sur l'état et la configuration du système.

#### Requête

```
GET /settings/system
```

#### Réponse

```json
{
  "environment": "production",
  "version": "v2.5.3",
  "lastUpdate": "2025-07-15T08:30:00Z",
  "storage": {
    "totalSize": 5000000000,
    "usedSize": 2500000000,
    "percentage": 50
  },
  "maintenance": {
    "scheduled": false
  },
  "limits": {
    "maxUploadSize": 10485760,
    "maxUsers": 500,
    "maxPortfolios": 1000,
    "apiRateLimit": 100
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

### Récupération des logs système

Récupère les logs du système avec options de filtrage.

#### Requête

```
GET /settings/system/logs
```

#### Paramètres de requête

| Paramètre | Type   | Description | Requis |
|-----------|--------|-------------|--------|
| level     | string | Niveau de log ('info', 'warning', 'error', 'critical') | Non |
| startDate | string | Date de début (format ISO) | Non |
| endDate   | string | Date de fin (format ISO) | Non |
| service   | string | Service spécifique | Non |
| search    | string | Recherche textuelle | Non |
| page      | number | Numéro de page | Non |
| limit     | number | Nombre d'éléments par page | Non |

#### Réponse

```json
{
  "data": [
    {
      "id": "log-123456",
      "timestamp": "2025-07-24T10:15:30Z",
      "level": "error",
      "service": "authentication",
      "message": "Échec d'authentification multifacteur",
      "details": {
        "userId": "user-789012",
        "method": "authenticator",
        "ipAddress": "192.168.1.1"
      }
    },
    {
      "id": "log-123457",
      "timestamp": "2025-07-24T09:30:15Z",
      "level": "warning",
      "service": "portfolio",
      "message": "Accès à un portefeuille restreint",
      "details": {
        "userId": "user-789013",
        "portfolioId": "port-345678",
        "action": "view"
      }
    }
  ],
  "meta": {
    "total": 145,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Paramètres de filtre incorrects |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

### Planification d'une maintenance système

Planifie une période de maintenance du système.

#### Requête

```
POST /settings/system/maintenance
```

#### Corps de la requête

```json
{
  "startTime": "2025-07-27T22:00:00Z",
  "endTime": "2025-07-28T02:00:00Z",
  "message": "Maintenance programmée pour mise à jour du système vers la version 2.6.0",
  "notifyUsers": true
}
```

#### Réponse

```json
{
  "success": true,
  "maintenance": {
    "scheduled": true,
    "startTime": "2025-07-27T22:00:00Z",
    "endTime": "2025-07-28T02:00:00Z",
    "message": "Maintenance programmée pour mise à jour du système vers la version 2.6.0",
    "createdAt": "2025-07-24T15:30:00Z",
    "notificationSent": true
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données manquantes ou incorrectes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 409  | Conflit - Une maintenance est déjà planifiée |
| 500  | Erreur serveur interne |

### Annulation d'une maintenance planifiée

Annule une maintenance système planifiée.

#### Requête

```
DELETE /settings/system/maintenance
```

#### Réponse

```json
{
  "success": true,
  "message": "Maintenance annulée avec succès"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Aucune maintenance planifiée |
| 500  | Erreur serveur interne |

## Modèles de données

### Interface AppSettings

| Champ | Type | Description |
|-------|------|-------------|
| currency | string | Devise principale de l'application ('CDF', 'USD') |
| language | string | Langue de l'interface utilisateur |
| theme | string | Thème de l'interface ('light', 'dark') |
| twoFactorEnabled | boolean | Activation de l'authentification à deux facteurs |
| notificationsEnabled | boolean | Activation des notifications générales |
| subscription | object | Informations sur l'abonnement |
| subscription.plan | string | Plan d'abonnement ('basic', 'premium', 'enterprise') |
| subscription.status | string | Statut de l'abonnement ('active', 'inactive', 'trial') |
| subscription.expiryDate | string | Date d'expiration de l'abonnement (format ISO) |
| subscription.autoRenew | boolean | Renouvellement automatique activé |
| paymentMethods | object | Configuration des méthodes de paiement |
| paymentMethods.mobileMoney | object | Configuration du paiement mobile |
| paymentMethods.mobileMoney.airtel | boolean | Support d'Airtel Money |
| paymentMethods.mobileMoney.orange | boolean | Support d'Orange Money |
| paymentMethods.mobileMoney.mpesa | boolean | Support de M-Pesa |
| paymentMethods.cards | object | Configuration des cartes de paiement |
| paymentMethods.cards.visa | boolean | Support des cartes Visa |
| paymentMethods.cards.mastercard | boolean | Support des cartes Mastercard |
| paymentMethods.cards.paypal | boolean | Support de PayPal |

### Interface PaymentProvider

| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du fournisseur |
| name | string | Nom du fournisseur de paiement |
| type | string | Type de fournisseur ('mobile_money', 'card') |
| logo_url | string | URL du logo du fournisseur |
| enabled | boolean | Indique si le fournisseur est actif |

### Interface SubscriptionPlan

| Champ | Type | Description |
|-------|------|-------------|
| id | string | Identifiant unique du plan |
| name | string | Nom du plan d'abonnement |
| price | object | Tarification du plan |
| price.CDF | number | Prix en francs congolais |
| price.USD | number | Prix en dollars américains |
| features | array | Liste des fonctionnalités incluses |
| duration | number | Durée du plan en jours |
