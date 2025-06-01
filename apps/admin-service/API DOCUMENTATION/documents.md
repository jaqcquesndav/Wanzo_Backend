# API Documentation: Documents Management

This document outlines the API endpoints for managing documents within the AdminKS system.

## Base URL

All API endpoints are relative to the base URL: `/api`

## Authentication

All endpoints require Bearer Token authentication.

## Endpoints

### 1. Get All Documents for a Company

*   **Endpoint:** `GET /companies/{companyId}/documents`
*   **Description:** Retrieves a list of all documents associated with a specific company.
*   **Permissions Required:** `documents:read` (or equivalent)
*   **Path Parameters:**
    *   `companyId` (string, required): The ID of the company.
*   **Successful Response (200 OK):**
    ```json
    [
      {
        "id": "doc_123",
        "companyId": "comp_abc",
        "name": "Invoice_2024_001.pdf",
        "type": "invoice",
        "size": 102400, // in bytes
        "url": "https://storage.example.com/documents/doc_123/Invoice_2024_001.pdf",
        "status": "uploaded", // e.g., uploaded, processing, verified, archived
        "uploadedBy": "user_xyz",
        "createdAt": "2024-03-15T10:00:00Z",
        "updatedAt": "2024-03-15T10:05:00Z",
        "metadata": {
          "invoiceNumber": "INV2024001",
          "customerId": "cust_789"
        }
      },
      // ... more documents
    ]
    ```
*   **Error Responses:** See [Standard Error Responses](#standard-error-responses).

### 2. Get Document by ID

*   **Endpoint:** `GET /documents/{documentId}`
*   **Description:** Retrieves detailed information for a specific document.
*   **Permissions Required:** `documents:read` (or equivalent for the specific document)
*   **Path Parameters:**
    *   `documentId` (string, required): The ID of the document.
*   **Successful Response (200 OK):**
    ```json
    {
      "id": "doc_123",
      "companyId": "comp_abc",
      "name": "Invoice_2024_001.pdf",
      "type": "invoice",
      "size": 102400,
      "url": "https://storage.example.com/documents/doc_123/Invoice_2024_001.pdf",
      "status": "uploaded",
      "uploadedBy": "user_xyz",
      "createdAt": "2024-03-15T10:00:00Z",
      "updatedAt": "2024-03-15T10:05:00Z",
      "metadata": {
        "invoiceNumber": "INV2024001",
        "customerId": "cust_789"
      }
    }
    ```
*   **Error Responses:**
    *   `404 Not Found`: If the document with the specified ID does not exist.
    *   See [Standard Error Responses](#standard-error-responses).

### 3. Upload a New Document

*   **Endpoint:** `POST /companies/{companyId}/documents/upload`
*   **Description:** Uploads a new document for a specific company. This is a multipart/form-data request.
*   **Permissions Required:** `documents:write` (or equivalent)
*   **Path Parameters:**
    *   `companyId` (string, required): The ID of the company to associate the document with.
*   **Request Body (multipart/form-data):**
    *   `file` (file, required): The document file to upload.
    *   `type` (string, optional): The type of the document (e.g., "invoice", "contract", "report").
    *   `metadata` (JSON string, optional): Additional metadata for the document.
*   **Successful Response (201 Created):**
    ```json
    {
      "id": "doc_new_456",
      "companyId": "comp_abc",
      "name": "Contract_Q1.pdf",
      "type": "contract",
      "size": 204800,
      "url": "https://storage.example.com/documents/doc_new_456/Contract_Q1.pdf",
      "status": "uploaded",
      "uploadedBy": "user_abc", // ID of the authenticated user
      "createdAt": "2024-06-01T14:30:00Z",
      "updatedAt": "2024-06-01T14:30:00Z",
      "message": "Document uploaded successfully"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the request is malformed (e.g., missing file, invalid metadata).
    *   See [Standard Error Responses](#standard-error-responses).

### 4. Update Document Status

*   **Endpoint:** `PATCH /documents/{documentId}/status`
*   **Description:** Updates the status of an existing document.
*   **Permissions Required:** `documents:manage` or `documents:write` (or equivalent for the specific document)
*   **Path Parameters:**
    *   `documentId` (string, required): The ID of the document to update.
*   **Request Body (application/json):**
    ```json
    {
      "status": "verified" // New status for the document
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
      "id": "doc_123",
      "companyId": "comp_abc",
      "name": "Invoice_2024_001.pdf",
      "type": "invoice",
      "size": 102400,
      "url": "https://storage.example.com/documents/doc_123/Invoice_2024_001.pdf",
      "status": "verified", // Updated status
      "uploadedBy": "user_xyz",
      "createdAt": "2024-03-15T10:00:00Z",
      "updatedAt": "2024-06-01T15:00:00Z", // Reflects update time
      "metadata": {
        "invoiceNumber": "INV2024001",
        "customerId": "cust_789"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the status provided is invalid or the request body is malformed.
    *   `404 Not Found`: If the document with the specified ID does not exist.
    *   See [Standard Error Responses](#standard-error-responses).

### 5. Delete a Document

*   **Endpoint:** `DELETE /documents/{documentId}`
*   **Description:** Deletes a specific document.
*   **Permissions Required:** `documents:delete` (or equivalent for the specific document)
*   **Path Parameters:**
    *   `documentId` (string, required): The ID of the document to delete.
*   **Successful Response (204 No Content):**
    *   An empty response body indicating successful deletion.
*   **Error Responses:**
    *   `404 Not Found`: If the document with the specified ID does not exist.
    *   See [Standard Error Responses](#standard-error-responses).

## Data Models

### Document

| Field       | Type   | Description                                                                 | Example                                                                 |
|-------------|--------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `id`        | string | Unique identifier for the document.                                         | `"doc_123"`                                                             |
| `companyId` | string | ID of the company the document belongs to.                                  | `"comp_abc"`                                                            |
| `name`      | string | Filename of the document.                                                   | `"Invoice_2024_001.pdf"`                                                |
| `type`      | string | Type of the document (e.g., "invoice", "contract", "report", "other").      | `"invoice"`                                                             |
| `size`      | number | Size of the document in bytes.                                              | `102400`                                                                |
| `url`       | string | URL to access/download the document.                                        | `"https://storage.example.com/documents/doc_123/Invoice_2024_001.pdf"` |
| `status`    | string | Current status of the document (e.g., "uploaded", "processing", "verified"). | `"uploaded"`                                                            |
| `uploadedBy`| string | ID of the user who uploaded the document.                                   | `"user_xyz"`                                                            |
| `createdAt` | string | ISO 8601 timestamp of when the document was created.                        | `"2024-03-15T10:00:00Z"`                                                 |
| `updatedAt` | string | ISO 8601 timestamp of when the document was last updated.                   | `"2024-03-15T10:05:00Z"`                                                 |
| `metadata`  | object | Additional key-value pairs specific to the document type.                   | `{"invoiceNumber": "INV2024001", "customerId": "cust_789"}`             |

### DocumentUploadResponse

Extends the `Document` model with an additional field:

| Field     | Type   | Description                          | Example                                  |
|-----------|--------|--------------------------------------|------------------------------------------|
| `message` | string | Confirmation message for the upload. | `"Document uploaded successfully"`       |


## Standard Error Responses

### 400 Bad Request

*   **Description:** The server could not understand the request due to invalid syntax or missing parameters.
*   **Response Body:**
    ```json
    {
      "error": "Bad Request",
      "message": "Invalid input data: [Details about the error, e.g., 'file field is required']",
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

*   **Description:** The requested resource (e.g., document, company) could not be found.
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
