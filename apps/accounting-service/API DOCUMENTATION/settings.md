# Settings API Documentation

Ce document décrit les endpoints API de paramètres pour l'application Wanzo Compta. Les paramètres sont organisés par catégories correspondant aux onglets de l'interface utilisateur.

## Base URL

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentication

All endpoints require authentication with a Bearer token.

**Headers:**
```
Authorization: Bearer <token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
```

## État de l'Implémentation

> **⚠️ STATUT**: Ces endpoints sont nouvellement créés pour la production. Le frontend utilise actuellement un fallback vers localStorage en cas d'indisponibilité de l'API.

## Endpoints

### Récupérer tous les Paramètres

Récupère tous les paramètres de l'organisation et de l'utilisateur actuel.

**URL:** `/settings`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "general": {
    "language": "fr",
    "dateFormat": "DD/MM/YYYY",
    "timezone": "Africa/Kinshasa",
    "theme": "light",
    "baseCurrency": "CDF",
    "displayCurrency": "CDF",
    "exchangeRates": {
      "USD": 0.0005,
      "EUR": 0.00045
    }
  },
  "accounting": {
    "defaultJournal": "OD",
    "autoNumbering": true,
    "voucherPrefix": "VCH-",
    "fiscalYearPattern": "YYYY",
    "accountingFramework": "OHADA",
    "defaultDepreciationMethod": "linear",
    "defaultVatRate": 18,
    "journalEntryValidation": "manual",
    "accountingLevels": [
      { "level": 1, "name": "Classe", "digits": 1 },
      { "level": 2, "name": "Compte Principal", "digits": 2 },
      { "level": 3, "name": "Compte Divisionnaire", "digits": 3 },
      { "level": 4, "name": "Sous-compte", "digits": 5 }
    ]
  },
  "security": {
    "twoFactorEnabled": false,
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireNumbers": true,
      "requireSymbols": false
    },
    "sessionTimeout": 30,
    "auditLogRetention": 90
  },
  "notifications": {
    "journal_validation": { "email": true, "browser": true },
    "report_generation": { "email": false, "browser": true },
    "user_mention": { "email": true, "browser": true }
  },
  "integrations": {
    "googleDrive": {
      "enabled": false,
      "linkedAccount": null
    },
    "ksPay": {
      "enabled": true,
      "apiKey": "ks_demo_key"
    },
    "slack": {
      "enabled": false,
      "webhookUrl": null
    },
    "dataSharing": {
      "banks": false,
      "microfinance": false,
      "coopec": false,
      "analysts": false,
      "partners": false,
      "consentGiven": false,
      "consentDate": null,
      "lastModified": "2024-08-02T10:00:00Z",
      "modifiedBy": "admin@example.com"
    },
    "dataSources": {
      "sources": [
        {
          "id": "wanzo-mobile",
          "name": "Wanzo Mobile",
          "description": "Application tout-en-un pour la gestion des ventes, facturation, caisse, stocks, clients, fournisseurs avec assistant Adha intégré",
          "icon": "Smartphone",
          "isConnected": false,
          "isConfigurable": true,
          "syncStatus": "disabled"
        },
        {
          "id": "web-scraping",
          "name": "Collecte Web",
          "description": "Collecte automatique des données de factures électroniques et transactions en ligne",
          "icon": "LinkIcon",
          "isConnected": false,
          "isConfigurable": true,
          "syncStatus": "disabled"
        },
        {
          "id": "external-db",
          "name": "Bases de données externes",
          "description": "Connexion à des bases de données tierces (ERP, CRM, etc.)",
          "icon": "Database",
          "isConnected": false,
          "isConfigurable": true,
          "syncStatus": "disabled"
        }
      ]
    },
    "bankIntegrations": [
      {
        "provider": "trust_bank",
        "enabled": false,
        "syncFrequency": "daily",
        "accountMappings": []
      }
    ],
    "eInvoicing": {
      "provider": "dgi_congo",
      "enabled": false,
      "taxpayerNumber": "",
      "autoSubmit": false,
      "validateBeforeSubmit": true,
      "syncInvoices": false
    },
    "taxIntegration": {
      "dgiEnabled": false,
      "taxpayerNumber": "",
      "autoCalculateTax": true,
      "taxRates": [
        {
          "type": "VAT",
          "rate": 18,
          "description": "TVA Standard",
          "accountId": "445100"
        }
      ],
      "declarationFrequency": "monthly"
    },
    "portfolioIntegration": {
      "enabled": false,
      "portfolioTypes": [],
      "automaticValuation": false,
      "valuationFrequency": "monthly",
      "currencyConversion": true
    }
  }
}
```

### Mettre à jour une Catégorie de Paramètres

Met à jour les paramètres pour une catégorie spécifique.

**URL:** `/settings/{category}`

**Method:** `PUT`

**Authentication Required:** Yes

**URL Parameters:**
- `category` (string): Catégorie à mettre à jour (`general`, `accounting`, `security`, `notifications`, `integrations`)

**Request Body** (exemple pour `general`):
```json
{
  "language": "fr",
  "dateFormat": "DD/MM/YYYY",
  "timezone": "Africa/Kinshasa",
  "theme": "dark",
  "baseCurrency": "CDF",
  "displayCurrency": "USD",
  "exchangeRates": {
    "USD": 0.0005,
    "EUR": 0.00045
  }
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Paramètres mis à jour avec succès"
}
```

### Configurer les Taux de Change

Met à jour les taux de change des devises.

**URL:** `/settings/exchange-rates`

**Method:** `PUT`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "rates": [
    {
      "currencyCode": "USD",
      "exchangeRate": 0.0005
    },
    {
      "currencyCode": "EUR",
      "exchangeRate": 0.00045
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Taux de change mis à jour"
}
```

### Récupérer les Paramètres de Partage de Données

Récupère la configuration du partage de données avec les partenaires.

**URL:** `/settings/data-sharing`

**Method:** `GET`

**Authentication Required:** Yes (Admin uniquement)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "banks": true,
    "microfinance": false,
    "coopec": true,
    "analysts": true,
    "partners": false,
    "consentGiven": true,
    "consentDate": "2024-08-01T10:00:00Z",
    "lastModified": "2024-08-02T10:00:00Z",
    "modifiedBy": "admin@example.com"
  }
}
```

### Mettre à jour les Paramètres de Partage de Données

Met à jour la configuration du partage de données.

**URL:** `/settings/data-sharing`

**Method:** `PUT`

**Authentication Required:** Yes (Admin uniquement)

**Request Body:**
```json
{
  "banks": true,
  "microfinance": true,
  "coopec": true,
  "analysts": true,
  "partners": false,
  "consentGiven": true
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "banks": true,
    "microfinance": true,
    "coopec": true,
    "analysts": true,
    "partners": false,
    "consentGiven": true,
    "consentDate": "2024-08-02T10:00:00Z",
    "lastModified": "2024-08-02T10:00:00Z",
    "modifiedBy": "admin@example.com"
  },
  "message": "Paramètres de partage mis à jour avec succès"
}
```

### Récupérer les Sources de Données

Récupère la configuration des sources de données connectées.

**URL:** `/settings/data-sources`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "id": "wanzo-mobile",
        "name": "Wanzo Mobile",
        "description": "Application tout-en-un pour la gestion des ventes, facturation, caisse, stocks, clients, fournisseurs avec assistant Adha intégré",
        "icon": "Smartphone",
        "isConnected": true,
        "isConfigurable": true,
        "config": {
          "syncFrequency": "realtime",
          "dataTypes": ["sales", "inventory", "customers"]
        },
        "lastSyncDate": "2024-08-02T09:30:00Z",
        "syncStatus": "active"
      },
      {
        "id": "web-scraping",
        "name": "Collecte Web",
        "description": "Collecte automatique des données de factures électroniques et transactions en ligne",
        "icon": "LinkIcon",
        "isConnected": false,
        "isConfigurable": true,
        "syncStatus": "disabled"
      }
    ]
  }
}
```

### Mettre à jour une Source de Données

Met à jour la configuration d'une source de données spécifique.

**URL:** `/settings/data-sources`

**Method:** `PUT`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "sourceId": "wanzo-mobile",
  "isConnected": true,
  "config": {
    "syncFrequency": "hourly",
    "dataTypes": ["sales", "inventory", "customers", "suppliers"]
  }
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "id": "wanzo-mobile",
        "name": "Wanzo Mobile",
        "description": "Application tout-en-un pour la gestion",
        "icon": "Smartphone",
        "isConnected": true,
        "isConfigurable": true,
        "config": {
          "syncFrequency": "hourly",
          "dataTypes": ["sales", "inventory", "customers", "suppliers"]
        },
        "lastSyncDate": "2024-08-02T10:00:00Z",
        "syncStatus": "active"
      }
    ]
  },
  "message": "Source de données mise à jour avec succès"
}
```

### Statut des Intégrations

Récupère le statut de toutes les intégrations configurées.

**URL:** `/settings/integrations/status`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "type": "data-sharing",
        "name": "Partage de données",
        "status": "active",
        "lastActivity": "2024-08-02T09:30:00Z",
        "errorCount": 0
      },
      {
        "type": "wanzo-mobile",
        "name": "Wanzo Mobile",
        "status": "active",
        "lastActivity": "2024-08-02T09:30:00Z",
        "errorCount": 0
      },
      {
        "type": "bank-integration",
        "name": "Intégration bancaire",
        "status": "disabled",
        "lastActivity": null,
        "errorCount": 0
      },
      {
        "type": "e-invoicing",
        "name": "Facturation électronique",
        "status": "error",
        "lastActivity": "2024-08-01T14:20:00Z",
        "errorCount": 3
      }
    ]
  }
}
```

### Configuration Bancaire

Récupère les configurations d'intégration bancaire.

**URL:** `/settings/integrations/banks`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "provider": "trust_bank",
      "enabled": true,
      "syncFrequency": "daily",
      "accountMappings": [
        {
          "bankAccountId": "TB001234567",
          "accountingAccountId": "512100",
          "description": "Compte principal Trust Bank"
        }
      ],
      "lastSyncDate": "2024-08-02T06:00:00Z"
    }
  ]
}
```

### Mettre à jour Configuration Bancaire

Met à jour la configuration d'une intégration bancaire.

**URL:** `/settings/integrations/banks/{bankId}`

**Method:** `PUT`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "enabled": true,
  "apiKey": "new_api_key",
  "syncFrequency": "hourly",
  "accountMappings": [
    {
      "bankAccountId": "TB001234567",
      "accountingAccountId": "512100",
      "description": "Compte principal Trust Bank"
    }
  ]
}
```

## Structures de Données

### Paramètres Généraux (`general`)

```json
{
  "language": "fr",
  "dateFormat": "DD/MM/YYYY",
  "timezone": "Africa/Kinshasa",
  "theme": "light",
  "baseCurrency": "CDF",
  "displayCurrency": "CDF",
  "exchangeRates": {
    "USD": 0.0005,
    "EUR": 0.00045
  }
}
```

### Paramètres Comptables (`accounting`)

```json
{
  "defaultJournal": "OD",
  "autoNumbering": true,
  "voucherPrefix": "VCH-",
  "fiscalYearPattern": "YYYY",
  "accountingFramework": "OHADA",
  "defaultDepreciationMethod": "linear",
  "defaultVatRate": 18,
  "journalEntryValidation": "manual",
  "accountingLevels": [
    { "level": 1, "name": "Classe", "digits": 1 },
    { "level": 2, "name": "Compte Principal", "digits": 2 },
    { "level": 3, "name": "Compte Divisionnaire", "digits": 3 },
    { "level": 4, "name": "Sous-compte", "digits": 5 }
  ]
}
```

### Paramètres de Sécurité (`security`)

```json
{
  "twoFactorEnabled": false,
  "passwordPolicy": {
    "minLength": 8,
    "requireUppercase": true,
    "requireNumbers": true,
    "requireSymbols": false
  },
  "sessionTimeout": 30,
  "auditLogRetention": 90
}
```

### Paramètres de Notifications (`notifications`)

```json
{
  "journal_validation": { "email": true, "browser": true },
  "report_generation": { "email": false, "browser": true },
  "user_mention": { "email": true, "browser": true }
}
```

### Paramètres d'Intégrations (`integrations`)

```json
{
  "googleDrive": {
    "enabled": false,
    "linkedAccount": null
  },
  "ksPay": {
    "enabled": true,
    "apiKey": "ks_..."
  },
  "slack": {
    "enabled": false,
    "webhookUrl": null
  }
}
```

## Gestion des Erreurs

Toutes les erreurs suivent la même structure de réponse:

**Response:** `400 Bad Request` / `401 Unauthorized` / `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": {
    "field_name": ["Erreur spécifique pour ce champ"]
  }
}
```

## API Endpoints

### Get All Settings

Retrieves all settings for the organization and the current user. The frontend can use this endpoint to populate all the settings tabs at once.

**URL**: `/settings`

**Method**: `GET`

**Response**: `200 OK`
```json
{
  "general": {
    "language": "fr",
    "dateFormat": "DD/MM/YYYY",
    "timezone": "Africa/Kinshasa",
    "theme": "light"
  },
  "accounting": {
    "defaultJournal": "OD",
    "autoNumbering": true,
    "voucherPrefix": "VCH-",
    "fiscalYearPattern": "YYYY",
    "accountingFramework": "OHADA",
    "accountingLevels": [
        { "level": 1, "name": "Classe", "digits": 1 },
        { "level": 2, "name": "Compte Principal", "digits": 2 },
        { "level": 3, "name": "Compte Divisionnaire", "digits": 3 },
        { "level": 4, "name": "Sous-compte", "digits": 5 }
    ]
  },
  "security": {
    "twoFactorEnabled": false,
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireNumbers": true,
      "requireSymbols": false
    },
    "sessionTimeout": 30,
    "auditLogRetention": 90
  },
  "notifications": {
      "journal_validation": { "email": true, "browser": true },
      "report_generation": { "email": false, "browser": true },
      "user_mention": { "email": true, "browser": true }
  },
  "integrations": {
### Paramètres d'Intégration (`integrations`)

```json
{
  "googleDrive": {
    "enabled": false,
    "linkedAccount": null
  },
  "ksPay": {
    "enabled": true,
    "apiKey": "ks_demo_key"
  },
  "slack": {
    "enabled": false,
    "webhookUrl": null
  },
  "dataSharing": {
    "banks": false,
    "microfinance": false,
    "coopec": false,
    "analysts": false,
    "partners": false,
    "consentGiven": false,
    "consentDate": null,
    "lastModified": "2024-08-02T10:00:00Z",
    "modifiedBy": "admin@example.com"
  },
  "dataSources": {
    "sources": [
      {
        "id": "wanzo-mobile",
        "name": "Wanzo Mobile",
        "description": "Application mobile de gestion",
        "icon": "Smartphone",
        "isConnected": false,
        "isConfigurable": true,
        "syncStatus": "disabled"
      }
    ]
  },
  "bankIntegrations": [
    {
      "provider": "trust_bank",
      "enabled": false,
      "syncFrequency": "daily",
      "accountMappings": []
    }
  ],
  "eInvoicing": {
    "provider": "dgi_congo",
    "enabled": false,
    "taxpayerNumber": "",
    "autoSubmit": false,
    "validateBeforeSubmit": true,
    "syncInvoices": false
  },
  "taxIntegration": {
    "dgiEnabled": false,
    "taxpayerNumber": "",
    "autoCalculateTax": true,
    "taxRates": [
      {
        "type": "VAT",
        "rate": 18,
        "description": "TVA Standard",
        "accountId": "445100"
      }
    ],
    "declarationFrequency": "monthly"
  },
  "portfolioIntegration": {
    "enabled": false,
    "portfolioTypes": [],
    "automaticValuation": false,
    "valuationFrequency": "monthly",
    "currencyConversion": true
  }
}
```

### DataSharingSettings

Structure pour la configuration du partage de données.

```typescript
interface DataSharingSettings {
  banks: boolean;
  microfinance: boolean;
  coopec: boolean;
  analysts: boolean;
  partners: boolean;
  consentGiven: boolean;
  consentDate?: string;
  lastModified?: string;
  modifiedBy?: string;
}
```

### DataSource

Structure pour une source de données.

```typescript
interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name
  isConnected: boolean;
  isConfigurable?: boolean;
  config?: Record<string, any>;
  lastSyncDate?: string;
  syncStatus?: 'active' | 'error' | 'disabled';
  errorMessage?: string;
}
```

### BankIntegrationConfig

Configuration d'intégration bancaire.

```typescript
interface BankIntegrationConfig {
  provider: 'trust_bank' | 'equity_bank' | 'rawbank' | 'other';
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  accountMappings?: Array<{
    bankAccountId: string;
    accountingAccountId: string;
    description: string;
  }>;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  lastSyncDate?: string;
}
```

## Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Token d'authentification manquant ou invalide"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "Permissions insuffisantes pour accéder aux paramètres"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "error": "Données de requête invalides",
  "details": {
    "field": "category",
    "message": "Catégorie de paramètres non supportée"
  }
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Catégorie de paramètres non trouvée"
}
```

**Internal Server Error (500):**
```json
{
  "success": false,
  "error": "Erreur interne du serveur lors de la sauvegarde"
}
```

## Notes d'Implémentation

### Sécurité
- **Accès Admin** : Les paramètres de partage de données nécessitent des privilèges administrateur
- **Validation** : Toutes les configurations sont validées côté serveur
- **Audit** : Toutes les modifications sont loggées avec utilisateur et timestamp

### Fallback
- Le frontend utilise localStorage comme fallback si l'API n'est pas disponible
- Les paramètres par défaut sont appliqués en cas d'échec de chargement
- La synchronisation reprend automatiquement quand l'API redevient disponible

### Intégrations Avancées
- **Consentement requis** : Le partage de données nécessite un consentement explicite
- **Configuration modulaire** : Chaque intégration peut être activée/désactivée indépendamment
- **Statut temps réel** : Le statut des intégrations est mis à jour en temps réel
- **Gestion d'erreurs** : Les erreurs d'intégration sont trackées et reportées

### Conformité
- **RGPD** : Respect des règles de protection des données
- **Audit Trail** : Traçabilité complète des modifications de paramètres
- **Permissions** : Contrôle d'accès granulaire par rôle utilisateur

**URL**: `/settings/{category}`

**Method**: `PUT`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category`| string | Yes | The category of settings to update. Can be `general`, `accounting`, `security`, `notifications`, or `integrations`. |

**Body**:
The body should contain the settings object for the specified category. For example, to update the `general` settings:
```json
{
  "language": "en",
  "dateFormat": "MM/DD/YYYY",
  "timezone": "UTC",
  "theme": "dark"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Settings updated successfully."
}
```

---

## Settings Categories Details

### General (`general`)
Contains general application settings related to language, date format, timezone, and theme.

**Data Structure**:
```json
{
  "language": "fr",
  "dateFormat": "DD/MM/YYYY",
  "timezone": "Africa/Kinshasa",
  "theme": "light"
}
```

### Accounting (`accounting`)
Contains settings related to accounting configuration.

**Data Structure**:
```json
{
  "defaultJournal": "OD",
  "autoNumbering": true,
  "voucherPrefix": "VCH-",
  "fiscalYearPattern": "YYYY",
  "accountingFramework": "OHADA",
  "accountingLevels": [
      { "level": 1, "name": "Classe", "digits": 1 },
      { "level": 2, "name": "Compte Principal", "digits": 2 },
      { "level": 3, "name": "Compte Divisionnaire", "digits": 3 },
      { "level": 4, "name": "Sous-compte", "digits": 5 }
  ]
}
```

### Security (`security`)
Contains security-related settings.

**Data Structure**:
```json
{
  "twoFactorEnabled": false,
  "passwordPolicy": {
    "minLength": 8,
    "requireUppercase": true,
    "requireNumbers": true,
    "requireSymbols": false
  },
  "sessionTimeout": 30,
  "auditLogRetention": 90
}
```

### Notifications (`notifications`)
Contains settings for user notifications. The keys represent the type of event, and the values are booleans for each channel.

**Data Structure**:
```json
{
  "journal_validation": { "email": true, "browser": true },
  "report_generation": { "email": false, "browser": true },
  "user_mention": { "email": true, "browser": true }
}
```

### Integrations (`integrations`)
Contains settings for third-party integrations.

**Data Structure**:
```json
{
  "googleDrive": {
    "enabled": false,
    "linkedAccount": null
  },
  "ksPay": {
    "enabled": true,
    "apiKey": "ks_..."
  },
    "slack": {
        "enabled": false,
        "webhookUrl": null
    }
}
```

---

## Error Handling
The API uses standard HTTP status codes to indicate the success or failure of a request.

| Code | Description |
|---|---|
| `200 OK` | The request was successful. |
| `400 Bad Request` | The request was malformed or contained invalid parameters. |
| `401 Unauthorized` | The request requires user authentication. |
| `403 Forbidden` | The authenticated user does not have permission to access the resource. |
| `404 Not Found` | The requested resource could not be found. |
| `500 Internal Server Error` | An unexpected error occurred on the server. |

**Example Error Response**:
```json
{
  "error": {
    "code": "InvalidParameter",
    "message": "The 'theme' parameter must be 'light' or 'dark'."
  }
}
```

## Nouveaux Endpoints Ajoutés

### Valider les Paramètres

Valide les paramètres avant de les sauvegarder.

**URL:** `/settings/validate`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "general": {
    "theme": "dark",
    "baseCurrency": "USD"
  }
}
```

**Response:** `200 OK`
```json
{
  "valid": true,
  "errors": []
}
```

**Response (avec erreurs):** `400 Bad Request`
```json
{
  "valid": false,
  "errors": [
    "Le thème doit être 'light' ou 'dark'",
    "La devise de base n'est pas supportée"
  ]
}
```

### Exporter les Paramètres

Exporte tous les paramètres de l'organisation.

**URL:** `/settings/export`

**Method:** `GET`

**Authentication Required:** Yes

**Response:** `200 OK`
```json
{
  "general": { ... },
  "accounting": { ... },
  "security": { ... },
  "notifications": { ... },
  "integrations": { ... }
}
```

### Importer les Paramètres

Importe des paramètres depuis un fichier d'export.

**URL:** `/settings/import`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "general": { ... },
  "accounting": { ... }
}
```

**Response:** `200 OK`
```json
{
  "general": { ... },
  "accounting": { ... },
  "security": { ... },
  "notifications": { ... },
  "integrations": { ... }
}
```

### Réinitialiser les Paramètres

Remet les paramètres aux valeurs par défaut.

**URL:** `/settings/reset` ou `/settings/{category}/reset`

**Method:** `POST`

**Authentication Required:** Yes

**Path Parameters:**
- `category` (optional) - Catégorie à réinitialiser ('general', 'accounting', 'security', 'notifications', 'integrations')

**Response:** `200 OK`
```json
{
  "general": { ... },
  "accounting": { ... },
  "security": { ... },
  "notifications": { ... },
  "integrations": { ... }
}
```

## Frontend Integration

Le hook `useSettings()` est configuré avec un système de fallback :

1. **Tentative API** : Appel vers les endpoints décrits ci-dessus
2. **Fallback localStorage** : En cas d'échec API, utilisation des données locales
3. **Paramètres par défaut** : Si aucune donnée disponible, valeurs par défaut

```typescript
const { 
  settings, 
  loading, 
  error, 
  updateSettings, 
  resetSettings 
} = useSettings();
```
