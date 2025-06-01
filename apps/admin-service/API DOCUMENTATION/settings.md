# API Documentation: User Settings

This document outlines the API endpoints for managing user-specific settings within the AdminKS system.

## Base URL

All API endpoints are relative to the base URL: `/api`

## Authentication

All endpoints require Bearer Token authentication for the user whose settings are being modified or retrieved.

## 1. User Profile Management

These endpoints manage the authenticated user's profile information.

### 1.1. Get User Profile

*   **Endpoint:** `GET /users/me/profile`
*   **Description:** Retrieves the profile information for the authenticated user.
*   **Permissions Required:** Authenticated user access.
*   **Successful Response (200 OK):**
    ```json
    {
      "id": "user_xyz",
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "phoneNumber": "+243999888777",
      "position": "Administrateur principal",
      "avatarUrl": "https://example.com/avatars/user_xyz.jpg",
      "role": "super_admin", // Or other roles
      "createdAt": "2023-01-10T10:00:00Z",
      "updatedAt": "2024-05-20T14:30:00Z"
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 1.2. Update User Profile

*   **Endpoint:** `PUT /users/me/profile`
*   **Description:** Updates the profile information for the authenticated user.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (application/json):**
    ```json
    {
      "name": "Jean K. Dupont",
      "phoneNumber": "+243888777666",
      "position": "Senior Administrator"
    }
    ```
    *Only include fields to be updated.*
*   **Successful Response (200 OK):**
    *   The updated user profile object (see Get User Profile response).
*   **Error Responses:**
    *   `400 Bad Request`: If input data is invalid.
    *   See [Standard Error Responses](#standard-error-responses).

### 1.3. Upload User Avatar

*   **Endpoint:** `POST /users/me/avatar`
*   **Description:** Uploads or changes the avatar for the authenticated user.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (multipart/form-data):**
    *   `avatar` (file, required): The image file for the avatar (e.g., JPG, PNG).
*   **Successful Response (200 OK):**
    ```json
    {
      "avatarUrl": "https://example.com/avatars/user_xyz_new.jpg",
      "message": "Avatar updated successfully."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If no file is provided, or file type/size is invalid.
    *   See [Standard Error Responses](#standard-error-responses).

## 2. Security Settings

These endpoints manage security-related settings for the authenticated user.

### 2.1. Change Password

*   **Endpoint:** `POST /users/me/security/change-password`
*   **Description:** Allows the authenticated user to change their password.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (application/json):**
    ```json
    {
      "currentPassword": "old_secure_password",
      "newPassword": "new_very_secure_password",
      "confirmNewPassword": "new_very_secure_password"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "message": "Password changed successfully."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If current password is incorrect, or new passwords don't match/meet complexity requirements.
    *   See [Standard Error Responses](#standard-error-responses).

### 2.2. Get Two-Factor Authentication (2FA) Status

*   **Endpoint:** `GET /users/me/security/2fa`
*   **Description:** Retrieves the current 2FA status for the authenticated user.
*   **Permissions Required:** Authenticated user access.
*   **Successful Response (200 OK):**
    ```json
    {
      "isEnabled": true,
      "methods": ["authenticator_app", "sms"], // Available or configured methods
      "defaultMethod": "authenticator_app"
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2.3. Setup/Enable Two-Factor Authentication (2FA)

*   **Endpoint:** `POST /users/me/security/2fa/enable`
*   **Description:** Initiates the setup process for 2FA or enables it with a chosen method.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (application/json):**
    ```json
    // For authenticator app setup (initial request)
    {
      "method": "authenticator_app"
    }
    // For verifying authenticator app
    {
      "method": "authenticator_app",
      "token": "123456", // OTP from authenticator app
      "secret": "SHARED_SECRET_FROM_SERVER" // The secret provided in the setup initiation step
    }
    // For SMS setup
    {
      "method": "sms",
      "phoneNumber": "+243999888777" // Optional if already on profile
    }
    // For verifying SMS OTP
    {
      "method": "sms",
      "token": "123456" // OTP sent to phone
    }
    ```
*   **Successful Response (200 OK / 201 Created):**
    *   If initiating authenticator app setup:
        ```json
        {
          "setupKey": "BASE32_ENCODED_SECRET_KEY",
          "qrCodeImageUrl": "data:image/png;base64,...", // QR code for authenticator app
          "message": "Scan QR code with your authenticator app and verify."
        }
        ```
    *   If 2FA successfully enabled (after verification):
        ```json
        {
          "isEnabled": true,
          "recoveryCodes": ["code1", "code2", ...],
          "message": "Two-factor authentication enabled successfully. Save your recovery codes."
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid method, token, or phone number.
    *   See [Standard Error Responses](#standard-error-responses).

### 2.4. Disable Two-Factor Authentication (2FA)

*   **Endpoint:** `POST /users/me/security/2fa/disable`
*   **Description:** Disables 2FA for the authenticated user. Requires current 2FA verification or password.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (application/json):**
    ```json
    {
      "password": "current_user_password" // Or a 2FA token if preferred by implementation
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "isEnabled": false,
      "message": "Two-factor authentication disabled successfully."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid password or 2FA token.
    *   See [Standard Error Responses](#standard-error-responses).

### 2.5. Get Active Sessions

*   **Endpoint:** `GET /users/me/security/sessions`
*   **Description:** Retrieves a list of active sessions for the authenticated user.
*   **Permissions Required:** Authenticated user access.
*   **Successful Response (200 OK):**
    ```json
    {
      "currentSession": {
        "id": "session_current_abc",
        "ipAddress": "192.168.1.10",
        "userAgent": "Chrome on Windows",
        "location": "Kinshasa, RDC",
        "lastAccessedAt": "2025-06-01T10:00:00Z"
      },
      "otherSessions": [
        {
          "id": "session_xyz789",
          "ipAddress": "10.0.0.5",
          "userAgent": "Firefox on MacOS",
          "location": "Lubumbashi, RDC",
          "lastAccessedAt": "2025-05-30T14:20:00Z"
        }
      ]
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2.6. Terminate a Session

*   **Endpoint:** `DELETE /users/me/security/sessions/{sessionId}`
*   **Description:** Terminates a specific active session for the authenticated user (cannot terminate the current session this way).
*   **Permissions Required:** Authenticated user access.
*   **Path Parameters:**
    *   `sessionId` (string, required): The ID of the session to terminate.
*   **Successful Response (204 No Content):**
*   **Error Responses:**
    *   `400 Bad Request`: If trying to terminate the current session.
    *   `404 Not Found`: If session ID is invalid.
    *   See [Standard Error Responses](#standard-error-responses).

### 2.7. Terminate All Other Sessions

*   **Endpoint:** `POST /users/me/security/sessions/terminate-all-others`
*   **Description:** Terminates all active sessions for the authenticated user, except the current one.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (application/json):** (Optional, may require password for confirmation)
    ```json
    {
      "password": "current_user_password"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "message": "All other active sessions have been terminated."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If password (if required) is incorrect.
    *   See [Standard Error Responses](#standard-error-responses).

### 2.8. Get Login History

*   **Endpoint:** `GET /users/me/security/login-history`
*   **Description:** Retrieves the login history for the authenticated user.
*   **Permissions Required:** Authenticated user access.
*   **Query Parameters:**
    *   `page` (number, optional, default: 1)
    *   `limit` (number, optional, default: 10)
*   **Successful Response (200 OK):**
    ```json
    {
      "history": [
        {
          "timestamp": "2025-06-01T10:00:00Z",
          "ipAddress": "192.168.1.10",
          "userAgent": "Chrome on Windows",
          "location": "Kinshasa, RDC",
          "status": "successful"
        },
        {
          "timestamp": "2025-05-30T08:15:00Z",
          "ipAddress": "203.0.113.45",
          "userAgent": "Unknown Browser",
          "location": "Paris, France",
          "status": "failed",
          "reason": "Incorrect password"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalEntries": 48
      }
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

## 3. Notification Preferences

Manage user preferences for receiving notifications.

### 3.1. Get Notification Preferences

*   **Endpoint:** `GET /users/me/settings/notifications`
*   **Description:** Retrieves the current notification preferences for the authenticated user.
*   **Permissions Required:** Authenticated user access.
*   **Successful Response (200 OK):**
    ```json
    {
      "emailNotifications": {
        "systemAlerts": true,
        "newFeatures": true,
        "activitySummaries": false
      },
      "pushNotifications": {
        "directMessages": true,
        "mentions": true,
        "taskUpdates": false
      },
      "smsNotifications": {
        "securityAlerts": true,
        "urgentUpdates": false
      }
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 3.2. Update Notification Preferences

*   **Endpoint:** `PUT /users/me/settings/notifications`
*   **Description:** Updates the notification preferences for the authenticated user.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (application/json):**
    *   Provide the full structure or partial updates as per API design.
    ```json
    {
      "emailNotifications": {
        "activitySummaries": true
      },
      "pushNotifications": {
        "taskUpdates": true
      }
    }
    ```
*   **Successful Response (200 OK):**
    *   The updated notification preferences object.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid preference keys or values.
    *   See [Standard Error Responses](#standard-error-responses).

## 4. Display & Personalization Preferences

Manage user preferences for application appearance and layout.

### 4.1. Get Display Preferences

*   **Endpoint:** `GET /users/me/settings/display`
*   **Description:** Retrieves the user's display preferences (theme, layout).
*   **Permissions Required:** Authenticated user access.
*   **Successful Response (200 OK):**
    ```json
    {
      "theme": "dark", // "light", "dark", "system"
      "layout": "sidebar" // "sidebar", "topnav"
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 4.2. Update Display Preferences

*   **Endpoint:** `PUT /users/me/settings/display`
*   **Description:** Updates the user's display preferences.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (application/json):**
    ```json
    {
      "theme": "light", // Optional
      "layout": "topnav"  // Optional
    }
    ```
*   **Successful Response (200 OK):**
    *   The updated display preferences object.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid theme or layout value.
    *   See [Standard Error Responses](#standard-error-responses).

## 5. Language & Localization Preferences

Manage user preferences for language and regional formats.

### 5.1. Get Language & Format Preferences

*   **Endpoint:** `GET /users/me/settings/localization`
*   **Description:** Retrieves the user's language and date format preferences.
*   **Permissions Required:** Authenticated user access.
*   **Successful Response (200 OK):**
    ```json
    {
      "language": "fr", // e.g., "en", "fr", "es"
      "dateFormat": "DD/MM/YYYY" // e.g., "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 5.2. Update Language & Format Preferences

*   **Endpoint:** `PUT /users/me/settings/localization`
*   **Description:** Updates the user's language and date format preferences.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (application/json):**
    ```json
    {
      "language": "en", // Optional
      "dateFormat": "MM/DD/YYYY" // Optional
    }
    ```
*   **Successful Response (200 OK):**
    *   The updated localization preferences object.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid language code or date format.
    *   See [Standard Error Responses](#standard-error-responses).

## 6. Currency Settings

Manage user preferences for currency display and manual exchange rates.

### 6.1. Get Currency Settings

*   **Endpoint:** `GET /users/me/settings/currency`
*   **Description:** Retrieves the user's currency display preference and manually set exchange rates.
*   **Permissions Required:** Authenticated user access.
*   **Successful Response (200 OK):**
    ```json
    {
      "displayCurrency": "USD", // User's preferred currency for display
      "baseCurrency": "EUR", // System's base currency for reference
      "manualExchangeRates": {
        "USD_CDF": 2800.50, // 1 USD = 2800.50 CDF
        "USD_FCFA": 600.75   // 1 USD = 600.75 FCFA
      }
    }
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 6.2. Update Currency Settings

*   **Endpoint:** `PUT /users/me/settings/currency`
*   **Description:** Updates the user's currency display preference and/or manual exchange rates.
*   **Permissions Required:** Authenticated user access.
*   **Request Body (application/json):**
    ```json
    {
      "displayCurrency": "CDF", // Optional
      "manualExchangeRates": { // Optional, provide rates relative to the system's base currency
        "EUR_CDF": 3000.00
      }
    }
    ```
*   **Successful Response (200 OK):**
    *   The updated currency settings object.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid currency code or rate format.
    *   See [Standard Error Responses](#standard-error-responses).

## Standard Error Responses

### 400 Bad Request

*   **Description:** The server could not understand the request due to invalid syntax or missing parameters.
*   **Response Body:**
    ```json
    {
      "error": "Bad Request",
      "message": "Invalid input data: [Details about the error]",
      "statusCode": 400
    }
    ```

### 401 Unauthorized

*   **Description:** The request requires user authentication, but the authentication credentials were missing or invalid.
*   **Response Body:**
    ```json
    {
      "error": "Unauthorized",
      "message": "Authentication token is missing or invalid.",
      "statusCode": 401
    }
    ```

### 403 Forbidden

*   **Description:** The authenticated user does not have the necessary permissions to perform the requested action.
*   **Response Body:**
    ```json
    {
      "error": "Forbidden",
      "message": "You do not have permission to access this resource.",
      "statusCode": 403
    }
    ```

### 404 Not Found

*   **Description:** The requested resource could not be found.
*   **Response Body:**
    ```json
    {
      "error": "Not Found",
      "message": "The requested resource was not found.",
      "statusCode": 404
    }
    ```

### 500 Internal Server Error

*   **Description:** An unexpected error occurred on the server.
*   **Response Body:**
    ```json
    {
      "error": "Internal Server Error",
      "message": "An unexpected error occurred. Please try again later.",
      "statusCode": 500
    }
    ```
