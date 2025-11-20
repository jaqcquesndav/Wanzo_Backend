# Authentication API Documentation

## Overview

The authentication system in Wanzo uses Auth0 for secure user authentication and authorization. The application supports both online authentication through Auth0's hosted login page and offline authentication for when users don't have an internet connection.

## Models

### User Model

The `User` model represents a user in the system with the following properties:

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "role": "string",
  "token": "string",
  "picture": "string (optional)",
  "job_title": "string (optional)",
  "physical_address": "string (optional)",
  "id_card": "string (optional)",
  "id_card_status": "string (PENDING, VERIFIED, REJECTED, UNKNOWN)",
  "id_card_status_reason": "string (optional)",
  "company_id": "string (optional)",
  "company_name": "string (optional)",
  "rccm_number": "string (optional)",
  "company_location": "string (optional)",
  "business_sector": "string (optional)",
  "business_sector_id": "string (optional)",
  "business_address": "string (optional)",
  "business_logo_url": "string (optional)",
  "email_verified": "boolean",
  "phone_verified": "boolean"
}
```

### Champs Business Supplémentaires

Les champs suivants sont disponibles pour une gestion complète du profil d'entreprise:

- **`business_sector_id`**: Identifiant unique du secteur d'activité (référence vers une table de secteurs)
- **`business_address`**: Adresse physique de l'entreprise (peut différer de `company_location` qui est une localisation géographique générale)
- **`business_logo_url`**: URL du logo de l'entreprise (stocké sur Cloudinary après upload)

**Différence entre `company_location` et `business_address`**:
- `company_location`: Ville ou région générale (ex: "Kinshasa")
- `business_address`: Adresse complète (ex: "123 Ave. Kasavubu, Gombe, Kinshasa")

**Exemple complet**:
```json
{
  "company_name": "Entreprise ABC SARL",
  "rccm_number": "CD/KIN/RCCM/23-B-12345",
  "company_location": "Kinshasa",
  "business_sector": "Commerce de détail",
  "business_sector_id": "sector_001",
  "business_address": "123 Avenue Kasavubu, Commune de Gombe, Kinshasa",
  "business_logo_url": "https://res.cloudinary.com/wanzo/image/upload/v1234567890/logos/abc_logo.png"
}
```

### IdStatus Enum

Represents the verification status of a user's ID card:

- `PENDING`: ID card has been submitted but not yet verified
- `VERIFIED`: ID card has been verified and approved
- `REJECTED`: ID card verification has been rejected
- `UNKNOWN`: ID card status is unknown or not available

## API Endpoints

### Login

Authenticates a user using Auth0's hosted login page.

- **Endpoint**: `/auth/login` (handled by Auth0)
- **Method**: GET/POST (handled by Auth0)
- **Parameters**:
  - `audience`: API audience identifier
  - `scope`: Requested permissions (openid, profile, email, offline_access, read:user_id_token)
  - `prompt`: Login prompt behavior

### Logout

Logs out the current user from both the application and Auth0.

- **Endpoint**: `/auth/logout` (handled by Auth0)
- **Method**: GET/POST (handled by Auth0)

### Get User Info

Retrieves the authenticated user's profile information.

- **Endpoint**: `/userinfo` (handled by Auth0)
- **Method**: GET
- **Authorization**: Bearer token required
- **Response**: User object

### Reset Password

Sends a password reset email to the user's registered email address.

- **Endpoint**: `/dbconnections/change_password` (handled by Auth0)
- **Method**: POST
- **Parameters**:
  - `email`: User's email address
  - `connection`: Connection type (typically "Username-Password-Authentication")

## Offline Authentication

The application supports offline authentication for users who have previously logged in. This functionality is managed by the `OfflineAuthService` which provides:

1. Storage of the last logged-in user's information in secure storage
2. Ability to enable/disable offline login
3. Methods to check if a user can log in offline
4. Cache management for user data during offline periods

## Usage Example

```dart
// Login with Auth0
final User user = await auth0Service.login();

// Get access token
final String? accessToken = await auth0Service.getAccessToken();

// Get user info
final User? userInfo = await auth0Service.getUserInfoFromSdk();

// Reset password
await auth0Service.sendPasswordResetEmail('user@example.com');

// Logout
await auth0Service.logout();

// Demo user login (for testing)
final User demoUser = await auth0Service.loginWithDemoAccount();
```

## Error Handling

The authentication system handles various error scenarios:

- Network connectivity issues: Falls back to offline authentication if available
- User cancellation: Detects when the user cancels the login process
- Token expiration: Automatically refreshes expired tokens
- Authentication failures: Provides appropriate error messages

## Security Considerations

1. Access tokens and user information are stored securely using `FlutterSecureStorage`
2. Token refresh is handled automatically when tokens expire
3. Offline login can be disabled for higher security requirements
4. Demo mode is clearly indicated to prevent confusion with real authentication
