# User Management API Documentation

This document outlines the API endpoints for managing users, including CRUD operations, roles, permissions, user activity, and sessions.

## 1. User Object

Represents a user in the system.

```json
{
  "id": "user-id-string",
  "name": "User Name",
  "email": "user@example.com",
  "role": "company_user", // e.g., "super_admin", "cto", "growth_finance", "customer_support", "content_manager", "company_admin", "company_user"
  "userType": "internal", // "internal" or "external"
  "customerAccountId": "pme-123", // Optional, required if userType is "external"
  "status": "active", // e.g., "active", "pending", "suspended", "inactive"
  "avatar": "url_to_avatar_image.png", // Optional
  "createdAt": "2023-01-15T10:30:00Z", // ISO 8601 timestamp
  "updatedAt": "2023-01-18T11:00:00Z", // ISO 8601 timestamp, optional
  "lastLogin": "2023-01-20T14:45:00Z", // ISO 8601 timestamp, optional
  "permissions": [
    // Array of strings defining specific permissions based on ROLE_PERMISSIONS
    "view_own_profile",
    "edit_own_profile"
  ],
  "departement": "Sales", // Optional, typically for "internal" users
  "phoneNumber": "+1234567890" // Optional
}
```

**Key changes:**
*   `role`: Updated example roles to include `company_admin` and `company_user`.
*   `userType`: Added. Indicates if the user is internal to Kiota or an external client user.
*   `customerAccountId`: Added. Links an external user to their company/customer account.
*   `updatedAt`: Added. Timestamp of the last update to the user object.
*   `permissions`: Clarified that permissions are now derived from `ROLE_PERMISSIONS` based on the user's role. Direct assignment of arbitrary permissions is deprecated.
*   Removed `company` and `companyId` as `customerAccountId` serves a similar and more structured purpose for external users.

## 2. List Users

### `GET /users` or `GET /admin/users`

Retrieves a list of users. Supports pagination and filtering.
Super Admins can see all users. Company Admins can see users within their own company.

**Query Parameters:**

*   `search` (string): Search term to filter users by name or email.
*   `role` (string): Filter by user role.
*   `userType` (string): Filter by user type (`internal`, `external`).
*   `customerAccountId` (string): Filter by customer account ID (relevant for listing users of a specific company).
*   `status` (string): Filter by user status.
*   `page` (number): Page number for pagination.
*   `limit` (number): Number of users per page.

**Response (Success 200 OK):**

```json
{
  "users": [
    // Array of User objects (see section 1)
  ],
  "totalCount": 100,
  "page": 1,
  "totalPages": 10
}
```

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters (e.g., invalid format for `page` or `limit`).
    ```json
    {
      "error": "Invalid query parameter: 'page' must be a positive integer."
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
    ```json
    {
      "error": "Authentication required."
    }
    ```
*   **403 Forbidden:** Authenticated user does not have permission to list users.
    ```json
    {
      "error": "You do not have permission to access this resource."
    }
    ```
*   **500 Internal Server Error:** Unexpected server error.
    ```json
    {
      "error": "An unexpected error occurred."
    }
    ```

## 3. Create User

### `POST /users/create` or `POST /admin/users`

Creates a new user.

**Request Body:**

```json
{
  "name": "New User Name",
  "email": "new.user@example.com",
  "password": "securePassword123",
  "role": "company_user", // Must be a valid UserRole
  "userType": "external", // "internal" or "external"
  "customerAccountId": "pme-123", // Required if userType is "external"
  "sendInvitation": true, // Optional
  "departement": "Client Services", // Optional
  "phoneNumber": "+0987654321" // Optional
}
```
**Key changes in Request Body:**
*   `role`: Must be one of the defined `UserRole` types.
*   `userType`: Added.
*   `customerAccountId`: Added, conditionally required.
*   `permissions`: Removed. Permissions are now automatically assigned based on the `role` via `ROLE_PERMISSIONS`.

**Response (Success 201 Created):**

```json
// User object (see section 1)
{
  "id": "new-user-id",
  "name": "New User Name",
  "email": "new.user@example.com",
  "role": "company_user",
  "userType": "external",
  "customerAccountId": "pme-123",
  // ... other user properties including auto-assigned permissions
}
```

**Response (Error 422 Unprocessable Entity):** If email already exists or validation fails.

```json
{
  "error": "Email already exists"
}
```

**Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., missing required fields, invalid email format).
    ```json
    {
      "error": "Validation failed.",
      "details": {
        "email": "Invalid email format."
      }
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to create users.
*   **409 Conflict:** If a resource conflict occurs (e.g., trying to create a user with an email that is already in use, if not covered by 422).
    ```json
    {
      "error": "User with this email already exists."
    }
    ```
*   **500 Internal Server Error:** Unexpected server error.

## 4. Get User by ID

### `GET /users/{id}` or `GET /admin/users/{id}`

Retrieves a specific user by their ID.

**Response (Success 200 OK):**

```json
// User object (see section 1)
```

**Response (Error 404 Not Found):** If the user with the specified ID does not exist.

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view this user.
*   **500 Internal Server Error:** Unexpected server error.

## 5. Update User

### `PUT /users/{id}` or `PUT /admin/users/{id}`

Updates an existing user's information. `userType` and `customerAccountId` (for external users) are generally not updatable after creation to maintain data integrity.

**Request Body:** (Partial User object with fields to update)

```json
{
  "name": "Updated User Name",
  "role": "company_admin", // Can be updated, permissions will adjust accordingly
  "status": "active",
  "departement": "Client Management", // Optional
  "phoneNumber": "+1122334455" // Optional
  // "userType" and "customerAccountId" are typically not changed here.
  // "permissions" field is not directly updatable; it's derived from "role".
}
```
**Key changes in Request Body:**
*   `role`: Can be updated. This will automatically update the user's permissions based on the new role's `ROLE_PERMISSIONS`.
*   `userType` and `customerAccountId`: Generally not updatable to prevent accidental misclassification or re-association.
*   `permissions`: Removed from direct update.

**Response (Success 200 OK):**

```json
// Updated User object (see section 1), with potentially new permissions based on role change
```

**Response (Error 404 Not Found):** If the user does not exist.
**Response (Error 422 Unprocessable Entity):** If validation fails (e.g., invalid role).

**Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., invalid data types for fields).
    ```json
    {
      "error": "Validation failed.",
      "details": {
        "role": "Invalid role specified."
      }
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to update this user.
*   **500 Internal Server Error:** Unexpected server error.

## 6. Delete User

### `DELETE /users/{id}` or `DELETE /admin/users/{id}`

Deletes a user.

**Response (Success 200 OK / 204 No Content):** (Usually no body, or a success message)

**Response (Error 404 Not Found):** If the user does not exist.
**Response (Error 403 Forbidden):** If the authenticated user does not have permission to delete this user (e.g., trying to delete a super_admin).

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **500 Internal Server Error:** Unexpected server error.

## 7. User Profile (Current User)

### `GET /users/profile` (Typically same as `/auth/me`)

Retrieves the profile of the currently authenticated user.

**Response (Success 200 OK):**

```json
// User object (see section 1)
```

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **404 Not Found:** If the authenticated user's profile cannot be found (should not typically happen if authenticated).
*   **500 Internal Server Error:** Unexpected server error.

### `PUT /users/update` (or `/users/profile`)

Updates the profile of the currently authenticated user.

**Request Body:** (Partial User object with fields to update, e.g., name, avatar, phone)

```json
{
  "name": "My Updated Name",
  "phoneNumber": "+1122334455"
}
```

**Response (Success 200 OK):**

```json
// Updated User object (see section 1)
```

**Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., invalid data for fields being updated).
    ```json
    {
      "error": "Validation failed.",
      "details": {
        "phoneNumber": "Invalid phone number format."
      }
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **422 Unprocessable Entity:** If validation fails for specific fields (e.g., email format if email is updatable here).
*   **500 Internal Server Error:** Unexpected server error.

## 8. Change User Password (Authenticated User)

### `POST /users/change-password`

Allows an authenticated user to change their own password. (Also documented in `auth.md`)

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

**Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., passwords don't match, new password too weak, current password incorrect).
    ```json
    {
      "error": "Current password is incorrect."
    }
    ```
    ```json
    {
      "error": "New passwords do not match."
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **422 Unprocessable Entity:** If the new password does not meet complexity requirements.
    ```json
    {
      "error": "Password does not meet complexity requirements."
    }
    ```
*   **500 Internal Server Error:** Unexpected server error.

## 9. Admin: Reset User Password

### `POST /admin/users/{userId}/reset-password`

Allows an administrator to trigger a password reset for a specific user.

**Response (Success 200 OK):**

```json
{
  "success": true,
  "message": "Password reset initiated for user."
}
```

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to reset passwords.
*   **404 Not Found:** If the user with the specified `userId` does not exist.
*   **500 Internal Server Error:** Unexpected server error (e.g., email service failure).

## 10. Admin: Toggle User Status

### `POST /admin/users/{userId}/toggle-status`

Allows an administrator to activate or deactivate/suspend a user account.

**Request Body:**

```json
{
  "active": true // or false to deactivate/suspend
}
```

**Response (Success 200 OK):**

```json
// Updated User object (see section 1) reflecting the new status
```

**Error Responses (General):**

*   **400 Bad Request:** Invalid request body (e.g., `active` field missing or not a boolean).
    ```json
    {
      "error": "'active' field must be a boolean."
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to toggle user status.
*   **404 Not Found:** If the user with the specified `userId` does not exist.
*   **500 Internal Server Error:** Unexpected server error.

## 11. User Activities

### `GET /users/{id}/activities` or `GET /admin/users/{id}/activities`

Retrieves activity logs for a specific user. Supports pagination.

**Query Parameters:**

*   `page` (number): Page number.
*   `limit` (number): Activities per page.

**Activity Log Object:**

```json
{
  "id": "activity-log-id",
  "userId": "user-id-string",
  "userName": "User Name",
  "applicationId": "accounting", // ID of the application where activity occurred
  "applicationName": "Comptabilité", // Name of the application
  "type": "login", // e.g., "login", "logout", "create", "update", "delete", "view", "export", "import", "error"
  "action": "User logged in successfully", // More specific description of the action
  "details": "Additional details about the activity", // Optional, can be a string or object
  "ipAddress": "192.168.1.100",
  "userAgent": "Chrome/90.0.4430.93 Windows/10",
  "timestamp": "2023-01-20T15:00:00Z", // ISO 8601 timestamp
  "severity": "info" // "info", "warning", "error"
}
```

**Response (Success 200 OK):**

```json
{
  "activities": [
    // Array of Activity Log objects
  ],
  "totalCount": 50
}
```

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view activities for this user.
*   **404 Not Found:** If the user with the specified `id` does not exist.
*   **500 Internal Server Error:** Unexpected server error.

## 12. User Sessions

### `GET /users/{id}/sessions` or `GET /admin/users/{id}/sessions`

Retrieves active and past sessions for a specific user.

**User Session Object:**

```json
{
  "id": "session-id-string",
  "userId": "user-id-string",
  "userName": "User Name",
  "applicationId": "sales",
  "applicationName": "Ventes",
  "ipAddress": "203.0.113.45",
  "userAgent": "Firefox/88.0 Ubuntu/20.04",
  "device": "Desktop", // Extracted from userAgent or provided by client
  "browser": "Firefox", // Extracted from userAgent
  "location": "Paris, France", // GeoIP lookup based on ipAddress, optional
  "startedAt": "2023-01-20T14:00:00Z",
  "lastActivityAt": "2023-01-20T16:30:00Z",
  "status": "active" // "active", "expired", "terminated"
}
```

**Response (Success 200 OK):**

```json
{
  "sessions": [
    // Array of User Session objects
  ],
  "totalCount": 5
}
```

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view sessions for this user.
*   **404 Not Found:** If the user with the specified `id` does not exist.
*   **500 Internal Server Error:** Unexpected server error.

### `DELETE /sessions/{sessionId}` or `DELETE /admin/sessions/{sessionId}`

Terminates a specific user session. Typically used by an admin or by the user themselves.

**Response (Success 200 OK / 204 No Content):**

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to terminate this session.
*   **404 Not Found:** If the session with the specified `sessionId` does not exist.
*   **500 Internal Server Error:** Unexpected server error.

## 13. Upload User Avatar

### `POST /users/avatar` or `POST /users/{id}/avatar`

Uploads or updates a user's avatar image.

**Request Body:** (Multipart/form-data)

*   `file`: The avatar image file.

**Response (Success 200 OK):**

```json
{
  "avatarUrl": "https://cdn.example.com/avatars/new_avatar.png",
  "publicId": "cloudinary_public_id" // If using a service like Cloudinary
}
```

**Error Responses (General):**

*   **400 Bad Request:** No file uploaded, invalid file type, file too large.
    ```json
    {
      "error": "Invalid file type. Only JPG and PNG are allowed."
    }
    ```
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to upload an avatar for the target user (if `POST /users/{id}/avatar`).
*   **404 Not Found:** If `POST /users/{id}/avatar` and the user does not exist.
*   **500 Internal Server Error:** Unexpected server error (e.g., error during file processing or storage).

## 14. User Statistics (Admin)

### `GET /admin/users/statistics`

Retrieves statistics about users (e.g., total users, active users, roles distribution).

**User Statistics Object (Example):**

```json
{
  "totalUsers": 1500,
  "activeUsers": 1200,
  "pendingUsers": 50,
  "usersByRole": {
    "admin": 20,
    "manager": 100,
    "user": 1080
  },
  "newUsersLast30Days": 75
}
```

**Response (Success 200 OK):**

```json
// User Statistics Object
```

**Error Responses (General):**

*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view user statistics.
*   **500 Internal Server Error:** Unexpected server error.

## 15. Activity Statistics (Admin)

### `GET /admin/activity/statistics`

Retrieves statistics about user activities.

**Query Parameters:**

*   `period` (string): Time period for statistics (e.g., `daily`, `weekly`, `monthly`). Default: `daily`.

**Activity Statistics Object (Example):**

```json
{
  "totalLogins": 5000,
  "failedLogins": 150,
  "mostActiveUsers": [
    { "userId": "user-abc", "name": "Active User 1", "activityCount": 200 },
    { "userId": "user-def", "name": "Active User 2", "activityCount": 180 }
  ],
  "activityByType": {
    "create": 1000,
    "update": 800,
    "delete": 50
  }
}
```

**Response (Success 200 OK):**

```json
// Activity Statistics Object
```

**Error Responses (General):**

*   **400 Bad Request:** Invalid `period` query parameter.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view activity statistics.
*   **500 Internal Server Error:** Unexpected server error.

## 16. Admin: Get Customer Accounts (if users are linked to customer accounts)

### `GET /admin/customer-accounts`

Retrieves a list of customer accounts, potentially managed by or associated with users.

**Query Parameters:**

*   `type` (string): Filter by customer account type.
*   `status` (string): Filter by customer account status.
*   `search` (string): Search term.
*   `page` (number): Page number.
*   `limit` (number): Items per page.

**Customer Account Object (Example):**

```json
{
  "id": "cust-acc-123",
  "name": "Customer Company Name",
  "type": "corporate",
  "status": "active",
  "primaryContactUserId": "user-xyz"
  // ... other customer account details
}
```

**Response (Success 200 OK):**

```json
{
  "accounts": [
    // Array of Customer Account objects
  ],
  "totalCount": 200
}
```

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters.
*   **401 Unauthorized:** Authentication token is missing or invalid.
*   **403 Forbidden:** Authenticated user does not have permission to view customer accounts.
*   **500 Internal Server Error:** Unexpected server error.

---

**General Notes:**

*   All request and response bodies are in JSON format unless specified (e.g., avatar upload).
*   `Authorization: Bearer <token>` header is expected for all endpoints.
*   Error responses will typically include a 4xx or 5xx status code and a JSON body with an `error` or `message` key.
*   The term `admin` in URLs like `/admin/users` usually implies endpoints intended for administrative users with higher privileges.
*   Specific permissions required for each endpoint are not detailed here but would be enforced by the backend.
