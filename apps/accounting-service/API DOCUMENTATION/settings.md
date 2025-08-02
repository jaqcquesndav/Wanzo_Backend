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
      "apiKey": "ks_..."
    },
    "slack": {
      "enabled": false,
      "webhookUrl": null
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
}
```

### Update Settings Category

Updates the settings for a specific category. The frontend should call the appropriate endpoint when the user saves changes in a specific tab.

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
