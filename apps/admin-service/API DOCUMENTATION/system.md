# System & Configuration API Documentation

This document outlines the API endpoints for System Settings, Configuration, Notifications, Audit Logs, and advanced Roles & Permissions management.

## I. General System Settings

### 1. Get All System Settings

*   **HTTP Method:** `GET`
*   **URL:** `/api/settings`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "general": {
        "companyName": "string",
        "language": "string", // e.g., "en", "fr"
        "timezone": "string", // e.g., "UTC", "America/New_York"
        "dateFormat": "string", // e.g., "YYYY-MM-DD", "DD/MM/YYYY"
        "logoUrl": "string" (optional),
        "primaryColor": "string" (optional), // Hex color code
        "secondaryColor": "string" (optional) // Hex color code
      },
      "security": {
        "passwordPolicy": {
          "minLength": "number",
          "requireUppercase": "boolean",
          "requireLowercase": "boolean",
          "requireNumbers": "boolean",
          "requireSpecialChars": "boolean",
          "expiryDays": "number" // 0 for no expiry
        },
        "twoFactorEnabledGlobally": "boolean", // If 2FA is enforced/available system-wide
        "defaultTwoFactorMethods": ["email", "sms", "authenticator"],
        "sessionTimeout": "number" // in minutes
      },
      "notifications": {
        "emailEnabled": "boolean",
        "smsEnabled": "boolean",
        "pushEnabled": "boolean",
        "inAppEnabled": "boolean",
        "defaultNotificationPreferences": {
          "newCustomer": "boolean",
          "newInvoice": "boolean",
          "paymentReceived": "boolean",
          "lowTokens": "boolean",
          "securityAlerts": "boolean"
        }
      },
      "billing": {
        "defaultCurrency": "string", // e.g., "USD", "EUR"
        "taxRate": "number" (optional),
        "defaultPaymentMethods": ["string"], // e.g., ["credit_card", "bank_transfer"]
        "invoiceDueDays": "number",
        "invoiceNotes": "string" (optional),
        "autoGenerateInvoices": "boolean"
      },
      "appearance": {
        "defaultTheme": "light" | "dark" | "system",
        "allowUserThemeOverride": "boolean",
        "density": "compact" | "comfortable" | "spacious",
        "fontFamily": "string",
        "fontSize": "string", // e.g., "14px"
        "customCss": "string" (optional)
      }
    }
    ```

*   **Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view system settings.
*   **500 Internal Server Error:** Unexpected server error.

### 2. Update System Settings Section

*   **HTTP Method:** `PUT`
*   **URL:** `/api/settings/{section}`
    *   `section` can be: `general`, `security`, `notifications`, `billing`, `appearance`.
*   **Request Structure (JSON):** The structure of the specific section being updated (see response of "Get All System Settings").
    *Example for updating `general` section:*
    ```json
    {
      "companyName": "New Company Name",
      "language": "fr"
      // ... other general settings fields to update
    }
    ```
*   **Response Structure (JSON):** The updated section object.
    *Example for `general` section update:*
    ```json
    {
      "companyName": "New Company Name",
      "language": "fr",
      "timezone": "UTC",
      "dateFormat": "YYYY-MM-DD",
      "logoUrl": null,
      "primaryColor": null,
      "secondaryColor": null
    }
    ```

*   **Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., incorrect data types, missing required fields within the section).
    ```json
    {
      "error": "Validation failed for section 'general'.",
      "details": {
        "companyName": "must be a string"
      }
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to update this settings section.
*   **404 Not Found:** If the specified `section` does not exist.
*   **500 Internal Server Error:** Unexpected server error.

## II. Internationalization (i18n)

### 1. Get Available Languages

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/languages`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "languages": [
        {
          "code": "string", // e.g., "en", "fr"
          "name": "string"  // e.g., "English", "Français"
        }
      ]
    }
    ```

*   **Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error.

### 2. Get Translations for a Language

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/translations/{langCode}`
*   **Request Structure:** (None)
*   **Response Structure (JSON):** A key-value pair object representing the translation strings.
    ```json
    {
      "settings.title": "Paramètres",
      "users.newUser": "Nouvel Utilisateur",
      // ... other translation keys
    }
    ```

*   **Error Responses (General):**

*   **404 Not Found:** If translations for the specified `langCode` do not exist.
*   **500 Internal Server Error:** Unexpected server error.

## III. Roles and Permissions (Advanced)

This section assumes a more granular role and permission system beyond basic user roles, potentially for admin users managing other admins or specific system capabilities.

### 1. List All System Roles

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/roles`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "roles": [
        {
          "id": "string",
          "name": "string", // e.g., "Super Administrator", "Finance Manager"
          "description": "string" (optional),
          "permissions": ["string"] // List of permission keys
        }
      ]
    }
    ```

*   **Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to list system roles.
*   **500 Internal Server Error:** Unexpected server error.

### 2. Create System Role

*   **HTTP Method:** `POST`
*   **URL:** `/api/system/roles`
*   **Request Structure (JSON):**
    ```json
    {
      "name": "string",
      "description": "string" (optional),
      "permissions": ["string"] // List of permission keys
    }
    ```
*   **Response Structure (JSON):** The created role object.
    ```json
    {
      "id": "string",
      "name": "string",
      "description": "string" (optional),
      "permissions": ["string"]
    }
    ```

*   **Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., missing `name`, invalid permission keys).
    ```json
    {
      "error": "Validation failed.",
      "details": {
        "name": "Role name is required.",
        "permissions": "Invalid permission key: 'manage_everything'"
      }
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to create system roles.
*   **409 Conflict:** If a role with the same name already exists.
*   **500 Internal Server Error:** Unexpected server error.

### 3. Get System Role Details

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/roles/{roleId}`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "id": "string",
      "name": "string",
      "description": "string" (optional),
      "permissions": ["string"]
    }
    ```

*   **Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view this role.
*   **404 Not Found:** If the role with the specified `roleId` does not exist.
*   **500 Internal Server Error:** Unexpected server error.

### 4. Update System Role

*   **HTTP Method:** `PUT`
*   **URL:** `/api/system/roles/{roleId}`
*   **Request Structure (JSON):**
    ```json
    {
      "name": "string" (optional),
      "description": "string" (optional),
      "permissions": ["string"] (optional)
    }
    ```
*   **Response Structure (JSON):** The updated role object.

*   **Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., invalid permission keys).
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to update this role.
*   **404 Not Found:** If the role with the specified `roleId` does not exist.
*   **409 Conflict:** If trying to rename to a role name that already exists.
*   **500 Internal Server Error:** Unexpected server error.

### 5. Delete System Role

*   **HTTP Method:** `DELETE`
*   **URL:** `/api/system/roles/{roleId}`
*   **Request Structure:** (None)
*   **Response Structure:** (Status 204 No Content or similar success status)

*   **Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to delete this role (e.g., trying to delete a protected system role).
*   **404 Not Found:** If the role with the specified `roleId` does not exist.
*   **500 Internal Server Error:** Unexpected server error.

### 6. List All Available System Permissions

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/permissions`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "permissions": [
        {
          "key": "string", // e.g., "manage_users", "view_audit_logs", "configure_settings_general"
          "description": "string"
        }
      ]
    }
    ```

*   **Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to list system permissions.
*   **500 Internal Server Error:** Unexpected server error.

## IV. Audit Logs

### 1. Get Audit Logs

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/audit-logs`
*   **Query Parameters:**
    *   `page` (optional): `number`
    *   `limit` (optional): `number`
    *   `userId` (optional): `string` - Filter by user who performed the action.
    *   `actionType` (optional): `string` - Filter by type of action (e.g., "USER_LOGIN", "SETTINGS_UPDATE").
    *   `startDate` (optional): `Date` (ISO 8601 format)
    *   `endDate` (optional): `Date` (ISO 8601 format)
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "logs": [
        {
          "id": "string",
          "timestamp": "Date",
          "userId": "string" (optional, if action is user-specific),
          "userName": "string" (optional),
          "actionType": "string", // e.g., "USER_LOGIN_SUCCESS", "SETTINGS_UPDATED", "ROLE_CREATED"
          "entityType": "string" (optional), // e.g., "User", "Settings", "Role"
          "entityId": "string" (optional), // ID of the affected entity
          "ipAddress": "string" (optional),
          "userAgent": "string" (optional),
          "details": "object" (optional) // Additional context-specific details
        }
      ],
      "totalCount": "number",
      "currentPage": "number",
      "totalPages": "number"
    }
    ```

*   **Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters (e.g., invalid date format).
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view audit logs.
*   **500 Internal Server Error:** Unexpected server error when gathering metrics.

## V. System Health & Metrics

### 1. Get System Health Status

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/health`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "status": "HEALTHY" | "DEGRADED" | "UNHEALTHY",
      "timestamp": "Date",
      "checks": [
        {
          "name": "string", // e.g., "DatabaseConnection", "ApiService", "CacheService"
          "status": "UP" | "DOWN" | "DEGRADED",
          "message": "string" (optional)
        }
      ]
    }
    ```

*   **Error Responses (General):**

*   **500 Internal Server Error:** If the health check mechanism itself fails.
*   **503 Service Unavailable:** If the system is unhealthy (this might be reflected in the body as well).

### 2. Get System Metrics

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/metrics`
*   **Request Structure:** (None)
*   **Response Structure (JSON):** (Structure can be extensive and vary based on monitored components)
    ```json
    {
      "serverHealth": {
        "cpuUsage": "number", // percentage
        "memoryUsage": {
          "usedMb": "number",
          "totalMb": "number",
          "percentage": "number"
        },
        "diskUsage": {
          "usedGb": "number",
          "totalGb": "number",
          "percentage": "number"
        },
        "uptimeSeconds": "number"
      },
      "databaseMetrics": {
        // Specific metrics for each DB (PostgreSQL, Neo4j, Timescale)
        "postgresql": {
          "activeConnections": "number",
          "queryPerformanceMs": "number", // average
          "storageUsageMb": "number"
        }
        // ... other DBs
      },
      "apiMetrics": {
        "totalRequests": "number",
        "requestsPerMinute": "number",
        "averageResponseTimeMs": "number",
        "errorRatePercentage": "number",
        "requestsByEndpoint": {
          "/api/users": "number",
          "/api/auth/login": "number"
          // ... other endpoints
        }
      },
      "aiServiceMetrics": {
        "totalRequests": "number",
        "tokensProcessed": "number",
        "averageProcessingTimeMs": "number",
        "errorRatePercentage": "number",
        "costIncurredUSD": "number",
        "requestsByModel": {
          "gpt-4": "number",
          "claude-2": "number"
          // ... other models
        }
      }
      // ... other relevant metrics (e.g., queue lengths, cache hit rates)
    }
    ```

*   **Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid (if metrics are protected).
*   **403 Forbidden:** Authenticated user does not have permission to view system metrics.
*   **500 Internal Server Error:** Unexpected server error when gathering metrics.

## VI. Application Configuration (Advanced)

This refers to more deeply embedded configurations, potentially managed via a UI for super admins or through deployment configurations.

### 1. Get Backend Configuration (Sensitive - Admin Only)

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/config/backend`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "environment": "development" | "staging" | "production",
      "dbConnections": {
        "postgresql": "string", // Connection string (masked or partial for security)
        "neo4j": "string",
        "timescale": "string"
      },
      "aiProviders": {
        "openai": {
          "modelConfiguration": {
            "gpt-4": {
              "enabled": "boolean",
              "costPerToken": "number",
              "rateLimit": "number"
            }
            // ... other models
          },
          "apiKeysConfigured": "boolean" // Indicates if keys are set, not the keys themselves
        }
        // ... other AI providers
      },
      "featureFlags": {
        "newDashboardFeature": "boolean",
        "extendedReporting": "boolean"
      }
    }
    ```

*   **Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view backend configuration.
*   **500 Internal Server Error:** Unexpected server error.

### 2. Update Feature Flag

*   **HTTP Method:** `PUT`
*   **URL:** `/api/system/config/feature-flags/{flagName}`
*   **Request Structure (JSON):**
    ```json
    {
      "enabled": "boolean"
    }
    ```
*   **Response Structure (JSON):**
    ```json
    {
      "flagName": "string",
      "enabled": "boolean"
    }
    ```

*   **Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., `enabled` not a boolean).
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to update feature flags.
*   **404 Not Found:** If the `flagName` does not exist.
*   **500 Internal Server Error:** Unexpected server error.

## VII. Data Management (Advanced)

### 1. Export Data

*   **HTTP Method:** `POST`
*   **URL:** `/api/system/data/export`
*   **Request Structure (JSON):**
    ```json
    {
      "format": "json" | "csv" | "xlsx",
      "dataType": "all" | "users" | "audit_logs" | "settings" // etc.
      // Potentially add date ranges or other filters
    }
    ```
*   **Response Structure:** File download (e.g., `application/json`, `text/csv`). The API might return a job ID for asynchronous exports, with another endpoint to check status and get the download link.
    *Synchronous (for small exports):*
      File stream
    *Asynchronous (for large exports):*
    ```json
    {
      "jobId": "string",
      "status": "PENDING",
      "message": "Data export initiated. You will be notified upon completion."
    }
    ```

*   **Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., invalid `format` or `dataType`).
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to export data.
*   **500 Internal Server Error:** Unexpected server error during export process.

### 2. Import Data

*   **HTTP Method:** `POST`
*   **URL:** `/api/system/data/import`
*   **Request Structure:** `multipart/form-data` containing the file and metadata.
    *   `file`: The data file.
    *   `dataType`: `string` (e.g., "users", "settings_backup")
    *   `options` (optional JSON string): `{"overwrite": true, "dryRun": false}`
*   **Response Structure (JSON):**
    ```json
    {
      "jobId": "string" (if asynchronous),
      "status": "SUCCESS" | "PENDING" | "FAILED",
      "message": "string",
      "errors": [] (optional, list of errors if any)
    }
    ```

*   **Error Responses (General):**

*   **400 Bad Request:** Invalid request (e.g., missing file, unsupported `dataType`, invalid options).
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to import data.
*   **422 Unprocessable Entity:** If the data in the file is invalid or causes conflicts.
    ```json
    {
      "jobId": "string",
      "status": "FAILED",
      "message": "Import failed due to data validation errors.",
      "errors": [
        { "row": 2, "field": "email", "error": "Invalid email format" }
      ]
    }
    ```
*   **500 Internal Server Error:** Unexpected server error during import process.

### 3. Get Database Backup Status

*   **HTTP Method:** `GET`
*   **URL:** `/api/system/database/backups`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "backups": [
        {
          "databaseName": "string", // e.g., "PostgreSQLPrimary", "Neo4jGraph"
          "lastBackupTime": "Date",
          "backupSizeMb": "number",
          "status": "success" | "failed" | "in_progress",
          "location": "string" (e.g., "S3 Bucket Path", "Local Path"),
          "retentionDays": "number"
        }
      ]
    }
    ```

*   **Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view backup status.
*   **500 Internal Server Error:** Unexpected server error.

### 4. Trigger Database Backup

*   **HTTP Method:** `POST`
*   **URL:** `/api/system/database/backups/trigger`
*   **Request Structure (JSON):**
    ```json
    {
      "databaseName": "string" // Optional: specific DB, or all if omitted
    }
    ```
*   **Response Structure (JSON):**
    ```json
    {
      "jobId": "string",
      "status": "STARTED",
      "message": "Database backup process initiated for {databaseName or all databases}."
    }
    ```

*   **Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., invalid `databaseName`).
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to trigger backups.
*   **409 Conflict:** If a backup process is already in progress for the specified database.
*   **500 Internal Server Error:** Unexpected server error.
