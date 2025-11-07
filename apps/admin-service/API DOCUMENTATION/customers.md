# API Documentation: Customer Management

This document outlines the API endpoints, request/response structures, and functionalities related to customer management. This includes CRUD operations for customers, Know Your Customer (KYC) processes, data validation, document handling, and differentiation between various customer types.

## Standard Response Types

### PaginatedResponse<T>
```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  totalPages: number;
}
```

### APIResponse<T>
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: APIError;
}
```

## 1. Customer Endpoints

### 1.1. List Customers
*   **HTTP Method:** `GET`
*   **URL:** `/api/customers`
*   **Description:** Retrieves a list of all customers, with pagination and filtering options.
*   **Query Parameters:**
    *   `page` (optional, integer): Page number for pagination.
    *   `limit` (optional, integer): Number of items per page.
    *   `sortBy` (optional, string): Field to sort by (e.g., `createdAt`, `name`).
    *   `sortOrder` (optional, string): `asc` or `desc`.
    *   `type` (optional, string): Filter by customer type (`pme`, `financial`).
    *   `status` (optional, string): Filter by status (`active`, `pending`, `suspended`, `inactive`, `needs_validation`, `validation_in_progress`).
    *   `search` (optional, string): Search term for customer name, email, etc.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "items": [
            {
              "id": "cust_123",
              "name": "Acme Corp",
              "type": "pme",
              "email": "contact@acmecorp.com",
              "phone": "+243123456789",
              "address": "123 Main St, Kinshasa",
              "city": "Kinshasa",
              "country": "Democratic Republic of Congo",
              "status": "active",
              "billingContactName": "John Doe",
              "billingContactEmail": "billing@acmecorp.com",
              "tokenAllocation": 1000,
              "accountType": "premium",
              "createdAt": "2023-01-15T10:00:00Z",
              "updatedAt": "2023-01-16T12:00:00Z"
            }
          ],
          "totalCount": 50,
          "page": 1,
          "totalPages": 5
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters.
        ```json
        {
          "error": "Invalid query parameter: 'status' must be one of [active, pending, suspended, inactive, needs_validation, validation_in_progress]."
        }
        ```
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.2. Create Customer
*   **HTTP Method:** `POST`
*   **URL:** `/api/customers`
*   **Description:** Creates a new customer.
*   **Request Body:**
    ```json
    {
      "name": "Acme Corp",
      "type": "pme",
      "email": "contact@acmecorp.com",
      "phone": "+243123456789",
      "address": "123 Main St, Kinshasa",
      "city": "Kinshasa",
      "country": "Democratic Republic of Congo",
      "billingContactName": "John Doe",
      "billingContactEmail": "billing@acmecorp.com",
      "accountType": "premium"
    }
    ```
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "id": "cust_124",
          "name": "Acme Corp",
          "type": "pme",
          "email": "contact@acmecorp.com",
          "phone": "+243123456789",
          "address": "123 Main St, Kinshasa",
          "city": "Kinshasa",
          "country": "Democratic Republic of Congo",
          "status": "pending",
          "billingContactName": "John Doe",
          "billingContactEmail": "billing@acmecorp.com",
          "tokenAllocation": 0,
          "accountType": "premium",
          "createdAt": "2023-01-17T10:00:00Z"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If validation fails.
        ```json
        {
          "error": "Validation failed",
          "details": {
            "email": "Email is required and must be a valid format.",
            "type": "Customer type is required."
          }
        }
        ```
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `409 Conflict`: If a customer with the same email already exists.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.3. Get Customer Details
*   **HTTP Method:** `GET`
*   **URL:** `/api/customers/{customerId}`
*   **Description:** Retrieves details for a specific customer.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "customer": {
            "id": "cust_123",
            "name": "Acme Corp",
            "type": "pme",
            "email": "contact@acmecorp.com",
            "phone": "+243123456789",
            "address": "123 Main St, Kinshasa",
            "city": "Kinshasa",
            "country": "Democratic Republic of Congo",
            "status": "active",
            "billingContactName": "John Doe",
            "billingContactEmail": "billing@acmecorp.com",
            "tokenAllocation": 1000,
            "accountType": "premium",
            "ownerId": "user_456",
            "ownerEmail": "owner@acmecorp.com",
            "validatedAt": "2023-01-16T11:00:00Z",
            "validatedBy": "admin_789",
            "documents": [
              {
                "id": "doc_001",
                "type": "rccm",
                "fileName": "rccm_certificate.pdf",
                "fileUrl": "https://example.com/docs/rccm_certificate.pdf",
                "uploadedAt": "2023-01-15T14:00:00Z",
                "uploadedBy": "user_456",
                "status": "approved",
                "reviewedAt": "2023-01-16T10:00:00Z",
                "reviewedBy": "admin_789"
              }
            ],
            "validationHistory": [
              {
                "date": "2023-01-15T15:00:00Z",
                "action": "info_submitted",
                "by": "user_456"
              },
              {
                "date": "2023-01-16T11:00:00Z",
                "action": "validated",
                "by": "admin_789",
                "notes": "All documents verified successfully."
              }
            ],
            "createdAt": "2023-01-15T10:00:00Z",
            "updatedAt": "2023-01-16T12:00:00Z"
          },
          "statistics": {
            "tokensUsed": 250,
            "lastActivity": "2023-01-17T09:30:00Z",
            "activeSubscriptions": 1,
            "totalSpent": 500
          },
          "activities": [
            {
              "id": "act_001",
              "customerId": "cust_123",
              "type": "subscription",
              "action": "activated",
              "description": "Premium subscription activated",
              "performedBy": "user_456",
              "performedByName": "John Doe",
              "timestamp": "2023-01-16T13:00:00Z",
              "details": {
                "planId": "plan_premium",
                "amount": 500
              }
            }
          ]
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer with the given ID does not exist.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.4. Update Customer
*   **HTTP Method:** `PUT`
*   **URL:** `/api/customers/{customerId}`
*   **Description:** Updates details for a specific customer.
*   **Request Body:**
    ```json
    {
      "name": "Acme Corporation",
      "phone": "+243987654321",
      "billingContactName": "Jane Smith"
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "cust_123",
          "name": "Acme Corporation",
          "type": "pme",
          "email": "contact@acmecorp.com",
          "phone": "+243987654321",
          "address": "123 Main St, Kinshasa",
          "city": "Kinshasa",
          "country": "Democratic Republic of Congo",
          "status": "active",
          "billingContactName": "Jane Smith",
          "billingContactEmail": "billing@acmecorp.com",
          "tokenAllocation": 1000,
          "accountType": "premium",
          "updatedAt": "2023-01-18T14:00:00Z"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If validation fails.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer with the given ID does not exist.
    *   `409 Conflict`: If trying to update email to one that already exists for another customer.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.5. Validate Customer
*   **HTTP Method:** `PUT`
*   **URL:** `/api/customers/{customerId}/validate`
*   **Description:** Changes customer status to active after validation.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "cust_123",
          "status": "active",
          "validatedAt": "2023-01-19T10:00:00Z",
          "validatedBy": "admin_789"
          // Other customer fields...
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If the customer is not in a validatable state.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer with the given ID does not exist.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.6. Suspend Customer
*   **HTTP Method:** `PUT`
*   **URL:** `/api/customers/{customerId}/suspend`
*   **Description:** Suspends a customer.
*   **Request Body:**
    ```json
    {
      "reason": "Payment overdue for 60 days"
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "cust_123",
          "status": "suspended",
          "suspendedAt": "2023-01-20T14:00:00Z",
          "suspendedBy": "admin_789",
          "suspensionReason": "Payment overdue for 60 days"
          // Other customer fields...
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If the request is invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer with the given ID does not exist.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.7. Reactivate Customer
*   **HTTP Method:** `PUT`
*   **URL:** `/api/customers/{customerId}/reactivate`
*   **Description:** Reactivates a suspended customer.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "cust_123",
          "status": "active",
          "reactivatedAt": "2023-01-21T09:00:00Z",
          "reactivatedBy": "admin_789"
          // Other customer fields...
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If the customer is not in a suspended state.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer with the given ID does not exist.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.8. Delete Customer
*   **HTTP Method:** `DELETE`
*   **URL:** `/api/customers/{customerId}`
*   **Description:** Deletes a customer.
*   **Response:**
    *   `204 No Content`: Success, no response body.
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer with the given ID does not exist.
    *   `409 Conflict`: If the customer has active subscriptions or other dependencies.
    *   `500 Internal Server Error`: Unexpected server error.

## 2. Customer Documents

### 2.1. Upload Customer Document
*   **HTTP Method:** `POST`
*   **URL:** `/api/customers/{customerId}/documents`
*   **Description:** Uploads a document for a customer.
*   **Request Body:** Multipart form data with:
    * `file`: The document file
    * `type`: Document type (rccm, id_nat, nif, cnss, inpp, patente, agrement, contract)
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "id": "doc_002",
          "type": "nif",
          "fileName": "tax_certificate.pdf",
          "fileUrl": "https://example.com/docs/tax_certificate.pdf",
          "uploadedAt": "2023-01-21T11:00:00Z",
          "uploadedBy": "user_456",
          "status": "pending"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If the file is missing or invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer with the given ID does not exist.
    *   `500 Internal Server Error`: Unexpected server error.

### 2.2. Get Customer Documents
*   **HTTP Method:** `GET`
*   **URL:** `/api/customers/{customerId}/documents`
*   **Description:** Retrieves all documents for a customer.
*   **Response:**
    *   `200 OK`:
        ```json
        [
          {
            "id": "doc_001",
            "type": "rccm",
            "fileName": "rccm_certificate.pdf",
            "fileUrl": "https://example.com/docs/rccm_certificate.pdf",
            "uploadedAt": "2023-01-15T14:00:00Z",
            "uploadedBy": "user_456",
            "status": "approved",
            "reviewedAt": "2023-01-16T10:00:00Z",
            "reviewedBy": "admin_789"
          },
          {
            "id": "doc_002",
            "type": "nif",
            "fileName": "tax_certificate.pdf",
            "fileUrl": "https://example.com/docs/tax_certificate.pdf",
            "uploadedAt": "2023-01-21T11:00:00Z",
            "uploadedBy": "user_456",
            "status": "pending"
          }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer with the given ID does not exist.
    *   `500 Internal Server Error`: Unexpected server error.

### 2.3. Approve Customer Document
*   **HTTP Method:** `PUT`
*   **URL:** `/api/customers/{customerId}/documents/{documentId}/approve`
*   **Description:** Approves a customer document.
*   **Request Body:**
    ```json
    {
      "comments": "Document verified and approved." // Optional
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "doc_002",
          "type": "nif",
          "fileName": "tax_certificate.pdf",
          "fileUrl": "https://example.com/docs/tax_certificate.pdf",
          "uploadedAt": "2023-01-21T11:00:00Z",
          "uploadedBy": "user_456",
          "status": "approved",
          "reviewedAt": "2023-01-21T14:00:00Z",
          "reviewedBy": "admin_789",
          "reviewComments": "Document verified and approved."
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If the request is invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer or document does not exist.
    *   `500 Internal Server Error`: Unexpected server error.

### 2.4. Reject Customer Document
*   **HTTP Method:** `PUT`
*   **URL:** `/api/customers/{customerId}/documents/{documentId}/reject`
*   **Description:** Rejects a customer document.
*   **Request Body:**
    ```json
    {
      "reason": "Document is illegible or incomplete."
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "doc_002",
          "type": "nif",
          "fileName": "tax_certificate.pdf",
          "fileUrl": "https://example.com/docs/tax_certificate.pdf",
          "uploadedAt": "2023-01-21T11:00:00Z",
          "uploadedBy": "user_456",
          "status": "rejected",
          "reviewedAt": "2023-01-21T14:00:00Z",
          "reviewedBy": "admin_789",
          "reviewComments": "Document is illegible or incomplete."
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If the request is invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer or document does not exist.
    *   `500 Internal Server Error`: Unexpected server error.

## 3. Customer Activities

### 3.1. Get Customer Activities
*   **HTTP Method:** `GET`
*   **URL:** `/api/customers/{customerId}/activities`
*   **Description:** Retrieves a customer's activity history.
*   **Query Parameters:**
    *   `page` (optional, integer): Page number for pagination.
    *   `limit` (optional, integer): Number of items per page.
*   **Response:**
    *   `200 OK`:
        ```json
        [
          {
            "id": "act_001",
            "customerId": "cust_123",
            "type": "subscription",
            "action": "activated",
            "description": "Premium subscription activated",
            "performedBy": "user_456",
            "performedByName": "John Doe",
            "timestamp": "2023-01-16T13:00:00Z",
            "details": {
              "planId": "plan_premium",
              "amount": 500
            }
          },
          {
            "id": "act_002",
            "customerId": "cust_123",
            "type": "document",
            "action": "uploaded",
            "description": "Tax certificate uploaded",
            "performedBy": "user_456",
            "performedByName": "John Doe",
            "timestamp": "2023-01-21T11:00:00Z",
            "details": {
              "documentId": "doc_002",
              "documentType": "nif"
            }
          }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `404 Not Found`: If the customer with the given ID does not exist.
    *   `500 Internal Server Error`: Unexpected server error.

## 4. Customer Statistics

### 4.1. Get Customer Statistics
*   **HTTP Method:** `GET`
*   **URL:** `/api/customers/statistics`
*   **Description:** Retrieves aggregated statistics about customers.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "total": 150,
          "active": 120,
          "inactive": 10,
          "pending": 15,
          "suspended": 5,
          "byType": {
            "pme": 120,
            "financial": 30
          },
          "byAccountType": {
            "freemium": 50,
            "standard": 40,
            "premium": 40,
            "enterprise": 20
          }
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.
    *   `500 Internal Server Error`: Unexpected server error.

---

## 5. Advanced Customer Management (Admin Service Extensions)

Le service admin offre des fonctionnalités avancées de gestion des clients via communication HTTP avec le Customer Service.

### 5.1. Update Customer Subscription
*   **HTTP Method:** `PUT`
*   **URL:** `/api/admin/customers/{customerId}/subscriptions/{subscriptionId}`
*   **Description:** Met à jour l'abonnement d'un client (admin uniquement)
*   **Request Body:**
    ```json
    {
      "planId": "plan_premium",
      "autoRenew": true,
      "metadata": {
        "notes": "Upgraded by admin"
      }
    }
    ```
*   **Response:**
    *   `200 OK`: Returns updated subscription details
*   **Required Roles:** `SUPER_ADMIN`, `CUSTOMER_MANAGER`

### 5.2. Cancel Customer Subscription
*   **HTTP Method:** `POST`
*   **URL:** `/api/admin/customers/{customerId}/subscriptions/{subscriptionId}/cancel`
*   **Description:** Annule l'abonnement d'un client
*   **Request Body:**
    ```json
    {
      "reason": "Customer request / Payment issues / Service violation"
    }
    ```
*   **Response:**
    *   `200 OK`: Returns canceled subscription details
*   **Required Roles:** `SUPER_ADMIN`, `CUSTOMER_MANAGER`

### 5.3. Allocate Tokens to Customer
*   **HTTP Method:** `POST`
*   **URL:** `/api/admin/customers/{customerId}/tokens/allocate`
*   **Description:** Alloue des tokens à un client (bonus, compensation, etc.)
*   **Request Body:**
    ```json
    {
      "amount": 5000,
      "reason": "Service compensation / Promotional bonus / Trial extension"
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "customerId": "cust_123",
          "tokensAllocated": 5000,
          "newBalance": 15000,
          "reason": "Service compensation",
          "allocatedAt": "2024-01-15T10:30:00Z",
          "allocatedBy": "admin_user_789"
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `CUSTOMER_MANAGER`

### 5.4. Suspend Customer User
*   **HTTP Method:** `POST`
*   **URL:** `/api/admin/customers/{customerId}/users/{userId}/suspend`
*   **Description:** Suspend un utilisateur d'un client
*   **Request Body:**
    ```json
    {
      "reason": "Policy violation / Security concerns / Account compromise"
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "userId": "user_456",
          "customerId": "cust_123",
          "status": "suspended",
          "suspendedAt": "2024-01-15T11:00:00Z",
          "suspendedBy": "admin_user_789",
          "reason": "Policy violation"
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `CUSTOMER_MANAGER`

### 5.5. Reactivate Customer User
*   **HTTP Method:** `POST`
*   **URL:** `/api/admin/customers/{customerId}/users/{userId}/reactivate`
*   **Description:** Réactive un utilisateur suspendu
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "userId": "user_456",
          "customerId": "cust_123",
          "status": "active",
          "reactivatedAt": "2024-01-16T09:00:00Z",
          "reactivatedBy": "admin_user_789"
        }
        ```
*   **Required Roles:** `SUPER_ADMIN`, `CUSTOMER_MANAGER`

### 5.6. Create Customer Subscription
*   **HTTP Method:** `POST`
*   **URL:** `/api/admin/customers/{customerId}/subscriptions`
*   **Description:** Crée un nouvel abonnement pour un client (admin uniquement)
*   **Request Body:**
    ```json
    {
      "planId": "plan_premium",
      "startDate": "2024-01-01T00:00:00Z",
      "autoRenew": true,
      "trialPeriodDays": 30,
      "metadata": {
        "createdBy": "admin",
        "notes": "Special arrangement"
      }
    }
    ```
*   **Response:**
    *   `201 Created`: Returns new subscription details
*   **Required Roles:** `SUPER_ADMIN`, `CUSTOMER_MANAGER`

**Note technique** : Toutes ces opérations communiquent avec le Customer Service via HTTP et propagent les changements via Kafka pour assurer la cohérence des données dans le système.

---

## 6. Type Definitions

### 5.1. Customer
```typescript
interface Customer {
  id?: string;
  name: string;
  type: CustomerType; // 'pme' | 'financial'
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: CustomerStatus; // 'active' | 'pending' | 'suspended' | 'inactive' | 'needs_validation' | 'validation_in_progress'
  createdAt?: string;
  updatedAt?: string;
  billingContactName: string;
  billingContactEmail: string;
  tokenAllocation: number;
  accountType: AccountType; // 'freemium' | 'standard' | 'premium' | 'enterprise'
  ownerId?: string;
  ownerEmail?: string;
  validatedAt?: string;
  validatedBy?: string;
  documents?: CustomerDocument[];
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  reactivatedAt?: string;
  reactivatedBy?: string;
  validationHistory?: Array<{
    date: string;
    action: 'validated' | 'revoked' | 'info_requested' | 'info_submitted';
    by: string;
    notes?: string;
  }>;
}
```

### 5.2. CustomerDocument
```typescript
interface CustomerDocument {
  id?: string;
  type: DocumentType; // 'rccm' | 'id_nat' | 'nif' | 'cnss' | 'inpp' | 'patente' | 'agrement' | 'contract'
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  status: DocumentStatus; // 'pending' | 'approved' | 'rejected'
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComments?: string;
}
```

### 5.3. CustomerActivity
```typescript
interface CustomerActivity {
  id: string;
  customerId: string;
  type: string;
  action?: string;
  description?: string;
  performedBy?: string;
  performedByName?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
```

### 5.4. Extended Types for Specific Customer Types

#### PME Specific Data
```typescript
interface PmeSpecificData {
  industry: string;
  size: 'micro' | 'small' | 'medium';
  employeesCount: number;
  yearFounded?: number;
  registrationNumber?: string;
  taxId?: string;
  businessLicense?: string;
}
```

#### Financial Institution Specific Data
```typescript
interface FinancialInstitutionSpecificData {
  institutionType: 'bank' | 'microfinance' | 'insurance' | 'investment' | 'other';
  regulatoryBody?: string;
  regulatoryLicenseNumber?: string;
  branchesCount?: number;
  clientsCount?: number;
  assetsUnderManagement?: number;
}
```

### 5.5. Validation Process
```typescript
interface ValidationProcess {
  id: string;
  customerId: string;
  status: CustomerStatus;
  steps: ValidationStep[];
  currentStepIndex: number;
  startedAt: string;
  lastUpdatedAt: string;
  completedAt?: string;
  validatedBy?: string;
  notes?: string[];
}

interface ValidationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  order?: number;
  requiredDocuments?: DocumentType[];
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}
```
