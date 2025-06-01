# Authentication API Documentation

This document outlines the API endpoints related to user authentication, including login, registration, password management, and two-factor authentication.

## 1. Login

### `POST /auth/login`

Authenticates a user and returns a token and user information.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response (Success 200 OK):**

```json
{
  "token": "jwt.token.string",
  "user": {
    "id": "user-id-string",
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin" // or "user", "super_admin", etc.
    // other user properties like 'picture', 'status', 'createdAt'
  }
}
```

**Response (2FA Required 200 OK):**

```json
{
  "requiresTwoFactor": true,
  "twoFactorMethods": ["email", "sms"], // Available methods
  "tempToken": "temporary.token.for.2fa.verification" // Token to use for 2FA verification
}
```

**Response (Error 401 Unauthorized):**

```json
{
  "error": "Invalid credentials"
}
```
*   **Error Responses (General):**
    *   `400 Bad Request`: If the request body is malformed (e.g., missing email or password).
    *   `429 Too Many Requests`: If login attempts are rate-limited.
    *   `500 Internal Server Error`: For unexpected server issues.
    *   `503 Service Unavailable`: If an external authentication provider (like OIDC) is down.

## 2. Register

### `POST /auth/register`

Registers a new user.

**Request Body:**

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "newpassword123"
}
```

**Response (Success 201 Created):**

```json
{
  "token": "jwt.token.string",
  "user": {
    "id": "new-user-id",
    "name": "New User",
    "email": "newuser@example.com",
    "role": "user"
    // other user properties
  }
}
```

**Response (Error 422 Unprocessable Entity):**

```json
{
  "error": "Email already exists" // or other validation errors
}
```
*   **Error Responses (General):**
    *   `400 Bad Request`: If the request body is malformed or password doesn't meet complexity requirements.
    *   `500 Internal Server Error`: For unexpected server issues.

## 3. Logout

### `POST /auth/logout`

Logs out the current user by invalidating the session/token.

**Request Body:** (Potentially empty, or may require token in Authorization header)

**Response (Success 200 OK / 204 No Content):** (Usually no body, or a success message)
*   **Error Responses (General):**
    *   `401 Unauthorized`: If no valid token is provided for session invalidation.
    *   `500 Internal Server Error`: For unexpected server issues.

## 4. Get Current User (Me)

### `GET /auth/me`

Retrieves the profile of the currently authenticated user. Requires authentication token in the header.

**Response (Success 200 OK):**

```json
{
  "id": "user-id-string",
  "name": "User Name",
  "email": "user@example.com",
  "role": "admin",
  // other user properties
}
```

**Response (Error 401 Unauthorized):** If no valid token is provided.
*   **Error Responses (General):**
    *   `500 Internal Server Error`: For unexpected server issues.

## 5. Refresh Token

### `POST /auth/refresh`

Refreshes an expired or soon-to-expire authentication token.

**Request Body:** (May vary, could include the old token or a refresh token)

```json
{
  "refreshToken": "your.refresh.token.string" // Example
}
```

**Response (Success 200 OK):**

```json
{
  "token": "new.jwt.token.string"
  // Potentially new user info or refresh token details
}
```

**Response (Error 401 Unauthorized):** If the refresh token is invalid or expired.
*   **Error Responses (General):**
    *   `400 Bad Request`: If the refresh token is missing or malformed.
    *   `500 Internal Server Error`: For unexpected server issues.

## 6. Two-Factor Authentication (2FA)

### 6.1. Setup 2FA

#### `POST /auth/2fa/setup`

Initiates the setup process for two-factor authentication for the current user.

**Request Body:** (May specify method, e.g., 'email' or 'sms', or be empty if default is app-based)
```json
{
  "method": "email", // or "sms"
  "contact": "user@example.com" // or phone number for sms
}
```
*Note: If using an authenticator app, the request might be different or the server might generate a secret without specific input.*

**Response (Success 200 OK):**

```json
{
  "qrCode": "data:image/png;base64,QR_CODE_IMAGE_DATA", // For authenticator apps
  "secret": "YOUR_2FA_SECRET_KEY" // For manual entry or if QR fails
  // May also include backup codes or confirmation details
}
```
*   **Error Responses (General):**
    *   `400 Bad Request`: If the chosen method is invalid or contact info is malformed.
    *   `401 Unauthorized`: If the user is not authenticated to set up 2FA.
    *   `409 Conflict`: If 2FA is already enabled or setup is in an invalid state.
    *   `500 Internal Server Error`: For unexpected server issues.

### 6.2. Verify 2FA Code

#### `POST /auth/2fa/verify`

Verifies a 2FA code provided by the user during login or setup.

**Request Body:**

```json
{
  "code": "123456", // The 2FA code from the authenticator app, email, or SMS
  "method": "email", // or "sms", "app" - the method used
  "tempToken": "temporary.token.for.2fa.verification" // If verifying during login after initial password auth
}
```

**Response (Success 200 OK - Login Finalized):** (If verifying during login)

```json
{
  "token": "jwt.token.string", // Final authentication token
  "user": {
    "id": "user-id-string",
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin"
    // other user properties
  }
}
```

**Response (Success 200 OK - Setup Confirmed):** (If verifying during 2FA setup)
```json
{
  "message": "Two-factor authentication enabled successfully."
  // Potentially backup codes
}
```

**Response (Error 401 Unauthorized / 400 Bad Request):**

```json
{
  "error": "Invalid 2FA code"
}
```
*   **Error Responses (General):**
    *   `400 Bad Request`: If the code or tempToken is missing/malformed.
    *   `429 Too Many Requests`: If verification attempts are rate-limited.
    *   `500 Internal Server Error`: For unexpected server issues.

### 6.3. Generate Backup Codes (Optional)

#### `POST /auth/2fa/backup-codes`

Generates a new set of backup codes for 2FA.

**Response (Success 200 OK):**

```json
{
  "backupCodes": [
    "abcdef12",
    "ghijkl34",
    "mnopqr56"
    // ... more codes
  ]
}
```
*   **Error Responses (General):**
    *   `401 Unauthorized`: If the user is not authenticated or 2FA is not enabled.
    *   `500 Internal Server Error`: For unexpected server issues.

## 7. Password Management

### 7.1. Request Password Reset

#### `POST /auth/forgot-password` (or `/auth/password/request-reset`)

Initiates the password reset process for a user who has forgotten their password. Typically sends a reset link or code to the user's email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (Success 200 OK):** (Usually a generic message to prevent user enumeration)

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```
*   **Error Responses (General):**
    *   `400 Bad Request`: If email is missing or malformed.
    *   `429 Too Many Requests`: If password reset requests are rate-limited for this email/IP.
    *   `500 Internal Server Error`: For unexpected server issues (e.g., email service failure).

### 7.2. Reset Password

#### `POST /auth/reset-password` (or `/auth/password/reset`)

Resets the user's password using a token received via email (or other method).

**Request Body:**

```json
{
  "token": "password.reset.token.string",
  "newPassword": "newSecurePassword123"
}
```

**Response (Success 200 OK):**

```json
{
  "message": "Password has been reset successfully."
}
```

**Response (Error 400 Bad Request / 401 Unauthorized):**

```json
{
  "error": "Invalid or expired token" // or "Password does not meet requirements"
}
```
*   **Error Responses (General):**
    *   `429 Too Many Requests`: If reset attempts are rate-limited.
    *   `500 Internal Server Error`: For unexpected server issues.

### 7.3. Change Password (Authenticated User)

#### `POST /users/change-password` (or `/auth/password/change`)

Allows an authenticated user to change their own password.

**Request Body:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456",
  "confirmPassword": "newSecurePassword456"
}
```

**Response (Success 200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

**Response (Error 400 Bad Request / 401 Unauthorized):**

```json
{
  "success": false,
  "message": "Incorrect current password" // or "New passwords do not match"
}
```
*   **Error Responses (General):**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `422 Unprocessable Entity`: If the new password doesn't meet complexity requirements.
    *   `500 Internal Server Error`: For unexpected server issues.

## 8. KS Auth (OIDC - if applicable)

These endpoints are specific to Kiota Suite's internal OpenID Connect based authentication.

### 8.1. Initiate KS Auth

#### `GET /auth/ks/authorize`

Redirects the user to the KS Auth OIDC provider for authentication.

**Response:** (Typically a 302 Redirect to the OIDC provider's authorization URL)
The response will include an `authorizationUrl` in the JSON body if not a direct redirect.
```json
{
  "authorizationUrl": "https://ks-auth.example.com/authorize?client_id=...&redirect_uri=...&response_type=code&scope=openid%20profile%20email&state=..."
}
```
*   **Error Responses (General):**
    *   `500 Internal Server Error`: If OIDC provider configuration is missing or invalid.
    *   `503 Service Unavailable`: If the OIDC provider is unreachable.

### 8.2. Handle KS Auth Callback

#### `POST /auth/ks/callback`

The OIDC provider redirects back to this endpoint after successful (or failed) authentication. This endpoint exchanges the authorization code for tokens.

**Request Body:** (Contains the authorization code from the OIDC provider)

```json
{
  "code": "authorization_code_from_oidc_provider"
  // May also include 'state' parameter for validation
}
```

**Response (Success 200 OK):** (Similar to standard login response)

```json
{
  "token": "jwt.token.string",
  "user": {
    "id": "user-id-string",
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin"
  }
}
```
*   **Error Responses (General):**
    *   `400 Bad Request`: If the `code` or `state` is missing, or `state` validation fails.
    *   `401 Unauthorized`: If the OIDC provider returns an error or the code is invalid.
    *   `500 Internal Server Error`: If token exchange fails or user provisioning fails.
    *   `503 Service Unavailable`: If the OIDC provider's token endpoint is unreachable.

### 8.3. Logout KS Auth

#### `POST /auth/ks/logout`

Initiates logout from the KS Auth OIDC provider.

**Response:** (May return a logout URL for redirection or confirm logout)
```json
{
  "logoutUrl": "https://ks-auth.example.com/logout?id_token_hint=...&post_logout_redirect_uri=..."
}
```

---

**General Notes:**

*   All request and response bodies are in JSON format.
*   `Authorization: Bearer <token>` header is expected for endpoints requiring authentication, unless otherwise specified.
*   Error responses will typically include a 4xx or 5xx status code and a JSON body with an `error` or `message` key.
*   Specific user roles and permissions might affect accessibility to certain endpoints or data within responses.
*   The exact URLs might be prefixed with a base API path (e.g., `/api/v1`). The paths listed here are relative to that base.
*   Timestamps (like `createdAt`, `lastLogin`) are typically in ISO 8601 format.
