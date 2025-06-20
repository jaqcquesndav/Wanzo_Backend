# Settings API Documentation

This documentation outlines the endpoints available for managing application settings in the Wanzo Compta application.

## Overview

The Settings API provides endpoints for retrieving and updating various application settings, which are organized into categories corresponding to the tabs in the user interface.

## Base URL

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentication

All API requests require authentication with a valid JWT token.

**Headers**:
```
Authorization: Bearer {token}
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
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
