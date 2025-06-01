# API Documentation: Customer Management

This document outlines the API endpoints, request/response structures, and functionalities related to customer management. This includes CRUD operations for customers, Know Your Customer (KYC) processes, data validation, document handling, and differentiation between corporate and individual customer types.

## 1. Customer Endpoints

### 1.1. List Customers
*   **Endpoint:** `GET /api/customers`
*   **Description:** Retrieves a list of all customers, with optional pagination and filtering.
*   **Request:**
    *   Query Parameters:
        *   `page` (optional, integer): Page number for pagination.
        *   `limit` (optional, integer): Number of items per page.
        *   `sortBy` (optional, string): Field to sort by (e.g., `createdAt`, `name`).
        *   `sortOrder` (optional, string): `asc` or `desc`.
        *   `type` (optional, string): Filter by customer type (`individual`, `corporate`).
        *   `status` (optional, string): Filter by KYC status (e.g., `pending`, `verified`, `rejected`).
        *   `search` (optional, string): Search term for customer name, email, etc.
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "data": [
            {
              "id": "cust_123",
              "type": "individual", // or "corporate"
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "phoneNumber": "+1234567890",
              "companyName": null, // if individual
              "registrationNumber": null, // if individual
              "status": "verified", // kyc status
              "createdAt": "2023-01-15T10:00:00Z",
              "updatedAt": "2023-01-16T12:00:00Z"
              // ... other relevant customer fields
            }
          ],
          "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalItems": 50,
            "itemsPerPage": 10
          }
        }
        ```
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission.

**Error Responses (General):**

*   **400 Bad Request:** Invalid query parameters (e.g., invalid format for `page` or `limit`).
    ```json
    {
      "error": "Invalid query parameter: \'status\' must be one of [pending, verified, rejected]."
    }
    ```
*   **500 Internal Server Error:** Unexpected server error.

### 1.2. Create Customer
*   **Endpoint:** `POST /api/customers`
*   **Description:** Creates a new customer.
*   **Request Body:**
    ```json
    {
      "type": "individual", // "individual" or "corporate"
      "firstName": "Jane", // required if type is "individual"
      "lastName": "Doe",   // required if type is "individual"
      "email": "jane.doe@example.com", // required
      "phoneNumber": "+0987654321", // optional
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "postalCode": "90210",
        "country": "USA"
      },
      // Fields for "corporate" type
      "companyName": "Acme Corp", // required if type is "corporate"
      "registrationNumber": "REG12345", // required if type is "corporate"
      "contactPerson": {
          "name": "Contact Name",
          "email": "contact@acmecorp.com",
          "phone": "+1122334455"
      }
      // ... other relevant fields
    }
    ```
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "id": "cust_124",
          "type": "individual",
          "firstName": "Jane",
          "lastName": "Doe",
          "email": "jane.doe@example.com",
          // ... other fields as created
          "status": "pending_verification",
          "createdAt": "2023-01-17T10:00:00Z"
        }
        ```
    *   `400 Bad Request`: If validation fails (e.g., missing required fields, invalid email format).
        ```json
        {
          "error": "Validation failed",
          "details": {
            "email": "Email is required and must be a valid format.",
            "type": "Customer type is required."
          }
        }
        ```
    *   `401 Unauthorized`.
    *   `403 Forbidden`.

**Error Responses (General):**

*   **409 Conflict:** If a customer with the same email already exists.
    ```json
    {
      "error": "Customer with this email already exists."
    }
    ```
*   **422 Unprocessable Entity:** For detailed validation errors if not covered by 400.
*   **500 Internal Server Error:** Unexpected server error.

### 1.3. Get Customer Details
*   **Endpoint:** `GET /api/customers/{customerId}`
*   **Description:** Retrieves details for a specific customer.
*   **Request:**
    *   Path Parameter: `customerId` (string, required).
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "cust_123",
          "type": "individual",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "phoneNumber": "+1234567890",
          "address": {
            "street": "123 Main St",
            "city": "Anytown",
            "state": "CA",
            "postalCode": "90210",
            "country": "USA"
          },
          "kycDetails": {
            "status": "verified",
            "verifiedAt": "2023-01-16T11:00:00Z",
            "documents": [
              { "documentId": "doc_id1", "type": "passport", "status": "approved" }
            ]
          },
          "createdAt": "2023-01-15T10:00:00Z",
          "updatedAt": "2023-01-16T12:00:00Z"
          // ... other relevant customer fields
        }
        ```
    *   `401 Unauthorized`.
    *   `403 Forbidden`.
    *   `404 Not Found`: If the customer with the given ID does not exist.

**Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error.

### 1.4. Update Customer
*   **Endpoint:** `PUT /api/customers/{customerId}`
*   **Description:** Updates details for a specific customer.
*   **Request:**
    *   Path Parameter: `customerId` (string, required).
    *   Request Body: Contains fields to be updated (similar structure to create, but all fields are optional).
        ```json
        {
          "firstName": "Johnathan", // only fields to update
          "phoneNumber": "+1234567891"
          // ... other fields
        }
        ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "id": "cust_123",
          "firstName": "Johnathan",
          "phoneNumber": "+1234567891",
          // ... other updated fields
          "updatedAt": "2023-01-18T14:00:00Z"
        }
        ```
    *   `400 Bad Request`: If validation fails.
    *   `401 Unauthorized`.
    *   `403 Forbidden`.
    *   `404 Not Found`.

**Error Responses (General):**

*   **409 Conflict:** If trying to update email to one that already exists for another customer.
*   **422 Unprocessable Entity:** For detailed validation errors if not covered by 400.
*   **500 Internal Server Error:** Unexpected server error.

### 1.5. Delete Customer
*   **Endpoint:** `DELETE /api/customers/{customerId}`
*   **Description:** Deletes a specific customer (soft delete recommended).
*   **Request:**
    *   Path Parameter: `customerId` (string, required).
*   **Response:**
    *   `204 No Content`: If deletion is successful.
    *   `401 Unauthorized`.
    *   `403 Forbidden`.
    *   `404 Not Found`.

**Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error.

## 2. KYC (Know Your Customer) Endpoints

### 2.1. Submit KYC Documents
*   **Endpoint:** `POST /api/customers/{customerId}/kyc/documents`
*   **Description:** Submits KYC documents for a customer.
*   **Request:**
    *   Path Parameter: `customerId` (string, required).
    *   Request Body (multipart/form-data):
        *   `documentType` (string, required): e.g., `passport`, `driver_license`, `utility_bill`, `company_registration_cert`.
        *   `file` (file, required): The document file.
        *   `issueDate` (optional, date string): `YYYY-MM-DD`
        *   `expiryDate` (optional, date string): `YYYY-MM-DD`
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "documentId": "doc_xyz789",
          "customerId": "cust_123",
          "documentType": "passport",
          "fileName": "passport_jane_doe.pdf",
          "status": "pending_review", // initial status
          "uploadedAt": "2023-01-19T09:00:00Z"
        }
        ```
    *   `400 Bad Request`: Invalid input, file type not supported, or file too large.
    *   `401 Unauthorized`.
    *   `403 Forbidden`.
    *   `404 Not Found`: Customer not found.

**Error Responses (General):**

*   **422 Unprocessable Entity:** If the document type is invalid or other specific validation rules fail.
    ```json
    {
      "error": "Invalid document type provided."
    }
    ```
*   **500 Internal Server Error:** Unexpected server error (e.g., file storage issue).

### 2.2. Get KYC Status
*   **Endpoint:** `GET /api/customers/{customerId}/kyc`
*   **Description:** Retrieves the KYC status and associated documents for a customer.
*   **Request:**
    *   Path Parameter: `customerId` (string, required).
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "customerId": "cust_123",
          "status": "pending_review", // Overall KYC status: pending_review, needs_resubmission, verified, rejected
          "documents": [
            {
              "documentId": "doc_xyz789",
              "documentType": "passport",
              "status": "pending_review", // Document-specific status
              "rejectionReason": null, // if rejected
              "uploadedAt": "2023-01-19T09:00:00Z",
              "reviewedAt": null
            },
            {
              "documentId": "doc_abc123",
              "documentType": "utility_bill",
              "status": "approved",
              "rejectionReason": null,
              "uploadedAt": "2023-01-19T09:05:00Z",
              "reviewedAt": "2023-01-20T11:00:00Z"
            }
          ],
          "lastCheckedAt": "2023-01-20T11:00:00Z" // Timestamp of the last review action
        }
        ```
    *   `401 Unauthorized`.
    *   `403 Forbidden`.
    *   `404 Not Found`.

**Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error.

### 2.3. Update KYC Status (Admin Action)
*   **Endpoint:** `PUT /api/customers/{customerId}/kyc/status`
*   **Description:** Allows an admin to update the overall KYC status of a customer or the status of individual documents.
*   **Request:**
    *   Path Parameter: `customerId` (string, required).
    *   Request Body:
        ```json
        {
          "overallStatus": "verified", // "verified", "rejected", "needs_resubmission"
          "rejectionReason": "Provided ID was blurry.", // if overallStatus is "rejected" or "needs_resubmission"
          "documentsToUpdate": [ // Optional: to update specific document statuses
            {
              "documentId": "doc_xyz789",
              "status": "rejected", // "approved", "rejected", "needs_resubmission"
              "rejectionReason": "Document expired."
            }
          ]
        }
        ```
*   **Response:**
    *   `200 OK`: Updated KYC status object (similar to GET /kyc).
    *   `400 Bad Request`: Invalid status or parameters.
    *   `401 Unauthorized`.
    *   `403 Forbidden`: User does not have permission to perform KYC actions.
    *   `404 Not Found`: Customer or document not found.

**Error Responses (General):**

*   **422 Unprocessable Entity:** If the provided status transition is not allowed or data is inconsistent.
    ```json
    {
      "error": "Invalid KYC status transition."
    }
    ```
*   **500 Internal Server Error:** Unexpected server error.

## 3. Customer Document Management (General Documents, not just KYC)

### 3.1. Upload Document for Customer
*   **Endpoint:** `POST /api/customers/{customerId}/documents`
*   **Description:** Uploads a general document associated with a customer (e.g., contracts, agreements).
*   **Request:**
    *   Path Parameter: `customerId` (string, required).
    *   Request Body (multipart/form-data):
        *   `documentTitle` (string, required): Title or description of the document.
        *   `documentType` (string, optional): e.g., `contract`, `nda`, `invoice_proof`.
        *   `file` (file, required): The document file.
*   **Response:**
    *   `201 Created`:
        ```json
        {
          "documentId": "gen_doc_001",
          "customerId": "cust_123",
          "documentTitle": "Service Agreement Q1 2023",
          "documentType": "contract",
          "fileName": "service_agreement_q1.pdf",
          "fileSize": 102400, // in bytes
          "mimeType": "application/pdf",
          "uploadedAt": "2023-01-21T15:00:00Z"
        }
        ```
    *   `400 Bad Request`.
    *   `401 Unauthorized`.
    *   `403 Forbidden`.
    *   `404 Not Found`.

**Error Responses (General):**

*   **413 Payload Too Large:** If the uploaded file exceeds the size limit.
*   **422 Unprocessable Entity:** Invalid document type or metadata.
*   **500 Internal Server Error:** Unexpected server error (e.g., file storage issue).

### 3.2. List Customer Documents
*   **Endpoint:** `GET /api/customers/{customerId}/documents`
*   **Description:** Retrieves a list of general documents for a customer.
*   **Request:**
    *   Path Parameter: `customerId` (string, required).
*   **Response:**
    *   `200 OK`:
        ```json
        {
          "data": [
            {
              "documentId": "gen_doc_001",
              "documentTitle": "Service Agreement Q1 2023",
              "documentType": "contract",
              "fileName": "service_agreement_q1.pdf",
              "uploadedAt": "2023-01-21T15:00:00Z"
            }
            // ... other documents
          ]
        }
        ```
    *   `401 Unauthorized`.
    *   `403 Forbidden`.
    *   `404 Not Found`.

**Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error.

### 3.3. Get Customer Document
*   **Endpoint:** `GET /api/customers/{customerId}/documents/{documentId}`
*   **Description:** Retrieves a specific document (metadata or download link).
*   **Request:**
    *   Path Parameters: `customerId`, `documentId` (string, required).
*   **Response:**
    *   `200 OK` (metadata):
        ```json
        {
          "documentId": "gen_doc_001",
          "customerId": "cust_123",
          "documentTitle": "Service Agreement Q1 2023",
          "documentType": "contract",
          "fileName": "service_agreement_q1.pdf",
          "fileSize": 102400,
          "mimeType": "application/pdf",
          "uploadedAt": "2023-01-21T15:00:00Z",
          "downloadUrl": "/api/customers/cust_123/documents/gen_doc_001/download" // Example
        }
        ```
    *   Or `200 OK` with file stream for direct download if `/download` path is used.
    *   `401 Unauthorized`.
    *   `403 Forbidden`.
    *   `404 Not Found`.

**Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error (e.g., file not accessible).

### 3.4. Delete Customer Document
*   **Endpoint:** `DELETE /api/customers/{customerId}/documents/{documentId}`
*   **Description:** Deletes a specific general document.
*   **Request:**
    *   Path Parameters: `customerId`, `documentId` (string, required).
*   **Response:**
    *   `204 No Content`.
    *   `401 Unauthorized`.
    *   `403 Forbidden`.
    *   `404 Not Found`.

**Error Responses (General):**

*   **500 Internal Server Error:** Unexpected server error.

## 4. Data Validation and Types

*   **Customer Types:**
    *   `individual`: Represents an individual person. Requires fields like `firstName`, `lastName`.
    *   `corporate`: Represents a business entity. Requires fields like `companyName`, `registrationNumber`.
*   **Validation:**
    *   Standard validation rules apply (e.g., email format, required fields based on type).
    *   Phone numbers should ideally be validated for format (e.g., E.164).
    *   Address components should be validated where possible.
    *   Specific validation logic for KYC documents (e.g., expiry dates, document types).

## 5. Key Data Structures

### Customer Object (Core)
```json
{
  "id": "string", // Unique identifier
  "type": "string", // "individual" or "corporate"
  "email": "string", // (unique)
  "phoneNumber": "string" (optional),
  "address": { // (optional)
    "street": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string"
  },
  "status": "string", // e.g., "active", "inactive", "pending_verification"
  "kycStatus": "string", // e.g., "not_started", "pending", "verified", "rejected", "needs_resubmission"
  "createdAt": "timestamp",
  "updatedAt": "timestamp",

  // Individual-specific
  "firstName": "string" (optional),
  "lastName": "string" (optional),
  "dateOfBirth": "date" (optional),

  // Corporate-specific
  "companyName": "string" (optional),
  "registrationNumber": "string" (optional),
  "taxId": "string" (optional),
  "industry": "string" (optional),
  "website": "string" (optional),
  "contactPerson": { // (optional)
      "name": "string",
      "email": "string",
      "phone": "string"
  }
}
```

### KYC Document Object
```json
{
  "documentId": "string",
  "customerId": "string",
  "documentType": "string", // e.g., "passport", "driver_license", "utility_bill", "company_registration_cert"
  "fileName": "string",
  "fileUrl": "string", // URL to access/download the document
  "status": "string", // "pending_review", "approved", "rejected", "needs_resubmission"
  "rejectionReason": "string" (optional),
  "issueDate": "date" (optional),
  "expiryDate": "date" (optional),
  "uploadedAt": "timestamp",
  "reviewedAt": "timestamp" (optional),
  "reviewedBy": "string" // userId of admin who reviewed (optional)
}
```

### General Document Object
```json
{
  "documentId": "string",
  "customerId": "string",
  "documentTitle": "string",
  "documentType": "string" (optional), // User-defined type
  "fileName": "string",
  "fileUrl": "string",
  "fileSize": "integer", // bytes
  "mimeType": "string",
  "uploadedAt": "timestamp",
  "uploadedBy": "string" // userId of uploader
}
```

This documentation provides a comprehensive guide for backend development related to Customer Management. Ensure consistency in naming conventions and error handling across all endpoints.
