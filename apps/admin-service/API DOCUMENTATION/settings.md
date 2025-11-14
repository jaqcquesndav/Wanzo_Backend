# API Documentation: Settings Management

This document outlines the API endpoints for managing system and user settings within the Wanzo Admin platform.

## Base URL

- **Via API Gateway**: `http://localhost:8000/admin/api/v1`
- **Direct (admin-service)**: `http://localhost:3001`

**Routing Architecture**: API Gateway strips `admin/api/v1` prefix before routing to admin-service.

## Authentication

All endpoints require Bearer Token authentication. Different settings may require different permission levels.

## Standard Response Types

### APIResponse<T>
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: APIError;
}
```

### PaginatedResponse<T>
```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  totalPages: number;
}
```

## Settings Data Models

### General Settings

```typescript
interface GeneralSettings {
  companyName: string;
  language: string;
  timezone: string;
  dateFormat: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}
```

### Security Settings

```typescript
interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
  };
  twoFactorEnabled: boolean;
  twoFactorMethods: ('email' | 'sms' | 'authenticator')[];
  sessionTimeout: number;
}
```

### Notification Settings

```typescript
interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  notifyOn: {
    newCustomer: boolean;
    newInvoice: boolean;
    paymentReceived: boolean;
    lowTokens: boolean;
    securityAlerts: boolean;
  };
}
```

### Notification Preference

```typescript
interface NotificationPreference {
  id: string; // e.g., 'emailMarketing', 'pushActivity'
  label: string; // User-friendly label for the preference
  description: string; // Description of what the notification is for
  channel: 'email' | 'push' | 'sms'; // Channel of notification
  type: string; // Category like 'marketing', 'security', 'features', 'activity', 'chat', 'alerts'
  isEnabled: boolean;
}
```

### Billing Settings

```typescript
interface BillingSettings {
  defaultCurrency: string;
  taxRate: number;
  paymentMethods: string[];
  invoiceDueDays: number;
  invoiceNotes: string;
  autoGenerateInvoices: boolean;
}
```

### Appearance Settings

```typescript
interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'comfortable' | 'spacious';
  fontFamily: string;
  fontSize: string;
  customCss?: string;
}
```

### Active Session

```typescript
interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: string; // ISO date string
  isCurrent: boolean;
  browser?: string;
  os?: string;
}
```

### Login Attempt

```typescript
interface LoginAttempt {
  id: string;
  date: string; // ISO date string
  ipAddress: string;
  device: string;
  location: string;
  status: 'successful' | 'failed';
  userAgent?: string;
}
```

## System Settings Endpoints

### 1. Get All Settings

*   **Endpoint:** `GET /admin/api/v1/settings`
*   **Description:** Retrieves all system settings.
*   **Permissions Required:** `admin:settings:read` or higher.
*   **Successful Response (200 OK):**
    ```json
    {
      "general": {
        "companyName": "Wanzo Admin",
        "language": "fr",
        "timezone": "Africa/Kinshasa",
        "dateFormat": "DD/MM/YYYY",
        "logoUrl": "https://example.com/logo.png",
        "primaryColor": "#3B82F6",
        "secondaryColor": "#10B981"
      },
      "security": {
        "passwordPolicy": {
          "minLength": 10,
          "requireUppercase": true,
          "requireLowercase": true,
          "requireNumbers": true,
          "requireSpecialChars": true,
          "expiryDays": 90
        },
        "twoFactorEnabled": true,
        "twoFactorMethods": ["email", "authenticator"],
        "sessionTimeout": 30
      },
      "notifications": {
        "email": true,
        "sms": false,
        "push": true,
        "inApp": true,
        "notifyOn": {
          "newCustomer": true,
          "newInvoice": true,
          "paymentReceived": true,
          "lowTokens": true,
          "securityAlerts": true
        }
      },
      "billing": {
        "defaultCurrency": "USD",
        "taxRate": 16,
        "paymentMethods": ["credit_card", "bank_transfer", "mobile_money"],
        "invoiceDueDays": 15,
        "invoiceNotes": "Paiement attendu dans les 15 jours.",
        "autoGenerateInvoices": true
      },
      "appearance": {
        "theme": "system",
        "density": "comfortable",
        "fontFamily": "Inter",
        "fontSize": "medium",
        "customCss": null
      }
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2. Get General Settings

*   **Endpoint:** `GET /admin/api/v1/settings/general`
*   **Description:** Retrieves general system settings.
*   **Permissions Required:** `admin:settings:read` or higher.
*   **Successful Response (200 OK):**
    ```json
    {
      "companyName": "Wanzo Admin",
      "language": "fr",
      "timezone": "Africa/Kinshasa",
      "dateFormat": "DD/MM/YYYY",
      "logoUrl": "https://example.com/logo.png",
      "primaryColor": "#3B82F6",
      "secondaryColor": "#10B981"
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 3. Get Security Settings

*   **Endpoint:** `GET /admin/api/v1/settings/security`
*   **Description:** Retrieves security-related system settings.
*   **Permissions Required:** `admin:settings:read` or higher.
*   **Successful Response (200 OK):**
    ```json
    {
      "passwordPolicy": {
        "minLength": 10,
        "requireUppercase": true,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSpecialChars": true,
        "expiryDays": 90
      },
      "twoFactorEnabled": true,
      "twoFactorMethods": ["email", "authenticator"],
      "sessionTimeout": 30
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 4. Get Notification Settings

*   **Endpoint:** `GET /admin/api/v1/settings/notifications`
*   **Description:** Retrieves notification-related system settings.
*   **Permissions Required:** `admin:settings:read` or higher.
*   **Successful Response (200 OK):**
    ```json
    {
      "email": true,
      "sms": false,
      "push": true,
      "inApp": true,
      "notifyOn": {
        "newCustomer": true,
        "newInvoice": true,
        "paymentReceived": true,
        "lowTokens": true,
        "securityAlerts": true
      }
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 5. Get Billing Settings

*   **Endpoint:** `GET /admin/api/v1/settings/billing`
*   **Description:** Retrieves billing-related system settings.
*   **Permissions Required:** `admin:settings:read` or higher.
*   **Successful Response (200 OK):**
    ```json
    {
      "defaultCurrency": "USD",
      "taxRate": 16,
      "paymentMethods": ["credit_card", "bank_transfer", "mobile_money"],
      "invoiceDueDays": 15,
      "invoiceNotes": "Paiement attendu dans les 15 jours.",
      "autoGenerateInvoices": true
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 6. Get Appearance Settings

*   **Endpoint:** `GET /admin/api/v1/settings/appearance`
*   **Description:** Retrieves appearance-related system settings.
*   **Permissions Required:** `admin:settings:read` or higher.
*   **Successful Response (200 OK):**
    ```json
    {
      "theme": "system",
      "density": "comfortable",
      "fontFamily": "Inter",
      "fontSize": "medium",
      "customCss": null
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 7. Update Settings

*   **Endpoint:** `PUT /admin/api/v1/settings/{section}`
*   **Description:** Updates settings for a specific section.
*   **Parameters:**
    - `section` (path, required): The settings section to update ('general', 'security', 'notifications', 'billing', 'appearance').
*   **Permissions Required:** `admin:settings:write` or higher.
*   **Request Body (application/json):**
    ```json
    {
      // Updated settings for the specified section
      // Format varies by section
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      // Updated settings for the specified section
      // Format varies by section
    }
    ```
*   **Error Responses:**
    - `400 Bad Request`: Invalid request parameters
    - See also [Standard Error Responses](#standard-error-responses).

## User-Specific Settings Endpoints

### 1. Get User Profile Settings

*   **Endpoint:** `GET /admin/profile`
*   **Description:** Retrieves the authenticated admin's profile settings.
*   **Permissions Required:** Authenticated user.
*   **Successful Response (200 OK):**
    ```json
    {
      "id": "admin_123",
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "phoneNumber": "+243999888777",
      "position": "Senior Administrator",
      "avatarUrl": "https://example.com/avatars/admin_123.jpg",
      "role": "super_admin",
      "language": "fr",
      "timezone": "Africa/Kinshasa",
      "createdAt": "2023-01-10T10:00:00Z",
      "updatedAt": "2024-05-20T14:30:00Z"
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2. Update User Profile Settings

*   **Endpoint:** `PUT /admin/profile`
*   **Description:** Updates the authenticated admin's profile settings.
*   **Permissions Required:** Authenticated user.
*   **Request Body (application/json):**
    ```json
    {
      "name": "Jean K. Dupont",
      "phoneNumber": "+243888777666",
      "position": "Senior Administrator",
      "language": "en",
      "timezone": "Europe/Paris"
    }
    ```
    *Only include fields to be updated.*
*   **Successful Response (200 OK):**
    *   The updated admin profile object (see Get User Profile Settings response).
*   **Error Responses:**
    *   `400 Bad Request`: If input data is invalid.
    *   See [Standard Error Responses](#standard-error-responses).

### 3. Upload Profile Avatar

*   **Endpoint:** `POST /admin/profile/avatar`
*   **Description:** Uploads or changes the avatar for the authenticated admin.
*   **Permissions Required:** Authenticated user.
*   **Request Body (multipart/form-data):**
    *   `avatar` (file, required): The image file for the avatar (e.g., JPG, PNG).
*   **Successful Response (200 OK):**
    ```json
    {
      "avatarUrl": "https://example.com/avatars/admin_123_new.jpg",
      "message": "Avatar updated successfully."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If no file is provided, or file type/size is invalid.
    *   See [Standard Error Responses](#standard-error-responses).

## Security Settings Endpoints

### 1. Get Security Settings

*   **Endpoint:** `GET /admin/security/settings`
*   **Description:** Retrieves the security settings for the authenticated admin.
*   **Permissions Required:** Authenticated user.
*   **Successful Response (200 OK):**
    ```json
    {
      "twoFactorEnabled": true
      // Other security settings may be included
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2. Update Two-Factor Authentication

*   **Endpoint:** `PUT /admin/security/settings/2fa`
*   **Description:** Enables or disables two-factor authentication for the authenticated admin.
*   **Permissions Required:** Authenticated user.
*   **Request Body (application/json):**
    ```json
    {
      "enabled": true
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "twoFactorEnabled": true
      // Other security settings may be included
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 3. Change Password

*   **Endpoint:** `PUT /admin/security/password`
*   **Description:** Changes the password for the authenticated admin.
*   **Permissions Required:** Authenticated user.
*   **Request Body (application/json):**
    ```json
    {
      "currentPassword": "old_secure_password",
      "newPassword": "new_very_secure_password"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "message": "Password changed successfully."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If current password is incorrect, or new password doesn't meet complexity requirements.
    *   See [Standard Error Responses](#standard-error-responses).

### 4. Get Active Sessions

*   **Endpoint:** `GET /admin/security/sessions`
*   **Description:** Retrieves a list of active sessions for the authenticated admin.
*   **Permissions Required:** Authenticated user.
*   **Successful Response (200 OK):**
    ```json
    {
      "sessions": [
        {
          "id": "sess_123",
          "device": "Windows Desktop",
          "location": "Kinshasa, DRC",
          "ipAddress": "41.243.11.22",
          "lastActive": "2024-06-05T14:30:00Z",
          "isCurrent": true,
          "browser": "Chrome",
          "os": "Windows 11"
        },
        {
          "id": "sess_456",
          "device": "iPhone",
          "location": "Paris, France",
          "ipAddress": "203.0.113.42",
          "lastActive": "2024-06-04T10:15:00Z",
          "isCurrent": false,
          "browser": "Safari",
          "os": "iOS 17"
        }
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 5. Terminate Session

*   **Endpoint:** `DELETE /admin/security/sessions/{sessionId}`
*   **Description:** Terminates a specific session.
*   **Parameters:**
    - `sessionId` (path, required): The ID of the session to terminate.
*   **Permissions Required:** Authenticated user.
*   **Successful Response (200 OK):**
    ```json
    {
      "message": "Session terminated successfully."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the session ID is invalid.
    *   `404 Not Found`: If the session doesn't exist.
    *   See [Standard Error Responses](#standard-error-responses).

### 6. Terminate All Other Sessions

*   **Endpoint:** `DELETE /admin/security/sessions/all-other`
*   **Description:** Terminates all sessions except the current one.
*   **Permissions Required:** Authenticated user.
*   **Successful Response (200 OK):**
    ```json
    {
      "message": "All other sessions terminated successfully."
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 7. Get Login History

*   **Endpoint:** `GET /admin/security/login-history`
*   **Description:** Retrieves the login history for the authenticated admin.
*   **Parameters:**
    - `limit` (query, optional): Maximum number of records to return. Default: 10.
*   **Permissions Required:** Authenticated user.
*   **Successful Response (200 OK):**
    ```json
    {
      "history": [
        {
          "id": "login_123",
          "date": "2024-06-05T14:30:00Z",
          "ipAddress": "41.243.11.22",
          "device": "Windows Desktop",
          "location": "Kinshasa, DRC",
          "status": "successful",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        },
        {
          "id": "login_122",
          "date": "2024-06-04T08:15:00Z",
          "ipAddress": "203.0.113.42",
          "device": "iPhone",
          "location": "Paris, France",
          "status": "failed",
          "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        }
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

## Notification Preferences Endpoints

### 1. Get Notification Preferences

*   **Endpoint:** `GET /admin/settings/notifications`
*   **Description:** Retrieves notification preferences for the authenticated admin.
*   **Permissions Required:** Authenticated user.
*   **Successful Response (200 OK):**
    ```json
    {
      "preferences": [
        {
          "id": "emailMarketing",
          "label": "Marketing Emails",
          "description": "Receive updates on new products and promotions.",
          "channel": "email",
          "type": "marketing",
          "isEnabled": true
        },
        {
          "id": "emailSecurity",
          "label": "Security Alerts",
          "description": "Receive alerts for important security events.",
          "channel": "email",
          "type": "security",
          "isEnabled": true
        },
        {
          "id": "pushActivity",
          "label": "Account Activity Push",
          "description": "Get push notifications for important account activities.",
          "channel": "push",
          "type": "activity",
          "isEnabled": true
        }
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2. Update Notification Preference

*   **Endpoint:** `PUT /admin/settings/notifications/{preferenceId}`
*   **Description:** Updates a specific notification preference.
*   **Parameters:**
    - `preferenceId` (path, required): The ID of the notification preference to update.
*   **Permissions Required:** Authenticated user.
*   **Request Body (application/json):**
    ```json
    {
      "isEnabled": false
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "id": "emailMarketing",
      "label": "Marketing Emails",
      "description": "Receive updates on new products and promotions.",
      "channel": "email",
      "type": "marketing",
      "isEnabled": false
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the preference ID is invalid.
    *   `404 Not Found`: If the preference doesn't exist.
    *   See [Standard Error Responses](#standard-error-responses).

### 3. Update All Notification Preferences

*   **Endpoint:** `PUT /admin/settings/notifications`
*   **Description:** Updates all notification preferences at once.
*   **Permissions Required:** Authenticated user.
*   **Request Body (application/json):**
    ```json
    {
      "preferences": [
        {
          "id": "emailMarketing",
          "isEnabled": false
        },
        {
          "id": "emailSecurity",
          "isEnabled": true
        },
        {
          "id": "pushActivity",
          "isEnabled": false
        }
      ]
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "preferences": [
        {
          "id": "emailMarketing",
          "label": "Marketing Emails",
          "description": "Receive updates on new products and promotions.",
          "channel": "email",
          "type": "marketing",
          "isEnabled": false
        },
        {
          "id": "emailSecurity",
          "label": "Security Alerts",
          "description": "Receive alerts for important security events.",
          "channel": "email",
          "type": "security",
          "isEnabled": true
        },
        {
          "id": "pushActivity",
          "label": "Account Activity Push",
          "description": "Get push notifications for important account activities.",
          "channel": "push",
          "type": "activity",
          "isEnabled": false
        }
      ]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If any preference ID is invalid.
    *   See [Standard Error Responses](#standard-error-responses).

## Application Settings Endpoints

### 1. Get Application Settings

*   **Endpoint:** `GET /admin/api/v1/settings/app`
*   **Description:** Retrieves application settings that can be configured.
*   **Permissions Required:** `admin:settings:read` or higher.
*   **Successful Response (200 OK):**
    ```json
    {
      "data": [
        {
          "id": "max_file_size",
          "name": "Maximum File Size",
          "value": "10",
          "description": "Maximum file size in MB for uploads",
          "category": "uploads"
        },
        {
          "id": "auto_logout",
          "name": "Auto Logout Time",
          "value": "30",
          "description": "Minutes of inactivity before automatic logout",
          "category": "security"
        },
        {
          "id": "api_rate_limit",
          "name": "API Rate Limit",
          "value": "100",
          "description": "Maximum API calls per minute",
          "category": "api"
        }
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2. Update Application Setting

*   **Endpoint:** `PUT /admin/api/v1/settings/{settingId}`
*   **Description:** Updates a specific application setting.
*   **Parameters:**
    - `settingId` (path, required): The ID of the setting to update.
*   **Permissions Required:** `admin:settings:write` or higher.
*   **Request Body (application/json):**
    ```json
    {
      "value": "15"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "id": "max_file_size",
      "name": "Maximum File Size",
      "value": "15",
      "description": "Maximum file size in MB for uploads",
      "category": "uploads"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the setting ID is invalid or the value is out of range.
    *   `404 Not Found`: If the setting doesn't exist.
    *   See [Standard Error Responses](#standard-error-responses).

## Standard Error Responses

*   **401 Unauthorized:**
    ```json
    {
      "error": "unauthorized",
      "message": "Authentication token is missing or invalid"
    }
    ```

*   **403 Forbidden:**
    ```json
    {
      "error": "forbidden",
      "message": "You do not have permission to access this resource"
    }
    ```

*   **404 Not Found:**
    ```json
    {
      "error": "not_found",
      "message": "The requested resource was not found"
    }
    ```

*   **429 Too Many Requests:**
    ```json
    {
      "error": "rate_limit_exceeded",
      "message": "Rate limit exceeded. Try again in X seconds",
      "retryAfter": 30
    }
    ```

*   **500 Internal Server Error:**
    ```json
    {
      "error": "server_error",
      "message": "An unexpected error occurred",
      "requestId": "req_abc123"
    }
    ```

## Additional Notes

1. System-wide settings are accessed through `/settings` endpoints and require admin privileges.
2. User-specific settings are accessed through `/admin` endpoints and are specific to the authenticated user.
3. Notification preferences control how and when the user receives notifications.
4. Security settings include password management, two-factor authentication, and session management.
5. Application settings affect global behavior of the platform and typically require higher privileges to modify.
