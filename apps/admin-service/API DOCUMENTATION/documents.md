# API Documentation: Documents Management

This document outlines the API endpoints for managing documents within the Wanzo Admin system.

## Base URL

- **Via API Gateway**: `http://localhost:8000/admin/api/v1`
- **Direct (admin-service)**: `http://localhost:3001`

**Routing Architecture**: API Gateway strips `admin/api/v1` prefix before routing to admin-service.

## Authentication

All endpoints require Bearer Token authentication.

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

## Endpoints

### 1. Get All Documents for a Company

*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/companies/{companyId}/documents`
*   **Description:** Retrieves a list of all documents associated with a specific company.
*   **Permissions Required:** `documents:read` (or equivalent)
*   **Path Parameters:**
    *   `companyId` (string, required): The ID of the company.
*   **Response:** `200 OK`
    ```json
    [
      {
        "id": "doc_123",
        "companyId": "comp_abc",
        "type": "rccm",
        "fileName": "RCCM_Certificate.pdf",
        "fileUrl": "https://storage.wanzo.com/documents/doc_123/RCCM_Certificate.pdf",
        "mimeType": "application/pdf",
        "fileSize": 102400,
        "status": "verified",
        "uploadedAt": "2024-03-15T10:00:00Z"
      },
      {
        "id": "doc_456",
        "companyId": "comp_abc",
        "type": "nationalId",
        "fileName": "National_ID.pdf",
        "fileUrl": "https://storage.wanzo.com/documents/doc_456/National_ID.pdf",
        "mimeType": "application/pdf",
        "fileSize": 89600,
        "status": "pending",
        "uploadedAt": "2024-06-01T14:30:00Z"
      }
    ]
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to access these documents.
    *   `404 Not Found`: Company not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 2. Get Document by ID

*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/documents/{documentId}`
*   **Description:** Retrieves detailed information for a specific document.
*   **Permissions Required:** `documents:read` (or equivalent for the specific document)
*   **Path Parameters:**
    *   `documentId` (string, required): The ID of the document.
*   **Response:** `200 OK`
    ```json
    {
      "id": "doc_123",
      "companyId": "comp_abc",
      "type": "rccm",
      "fileName": "RCCM_Certificate.pdf",
      "fileUrl": "https://storage.wanzo.com/documents/doc_123/RCCM_Certificate.pdf",
      "mimeType": "application/pdf",
      "fileSize": 102400,
      "status": "verified",
      "uploadedAt": "2024-03-15T10:00:00Z"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to access this document.
    *   `404 Not Found`: Document not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 3. Upload a New Document

*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/companies/{companyId}/documents/upload`
*   **Description:** Uploads a new document for a specific company.
*   **Permissions Required:** `documents:write` (or equivalent)
*   **Path Parameters:**
    *   `companyId` (string, required): The ID of the company to associate the document with.
*   **Request Body (multipart/form-data):**
    *   `file` (file, required): The document file to upload.
    *   `type` (string, required): The type of the document ("rccm", "nationalId", "taxNumber").
*   **Response:** `201 Created`
    ```json
    {
      "id": "doc_789",
      "fileName": "Tax_Certificate.pdf",
      "fileUrl": "https://storage.wanzo.com/documents/doc_789/Tax_Certificate.pdf",
      "type": "taxNumber",
      "status": "pending",
      "uploadedAt": "2024-06-15T09:45:00Z",
      "message": "Document uploaded successfully"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing required fields or invalid document type.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to upload documents.
    *   `404 Not Found`: Company not found.
    *   `413 Payload Too Large`: Document file exceeds size limit.
    *   `415 Unsupported Media Type`: File format not supported.
    *   `500 Internal Server Error`: Unexpected server error.

### 4. Update Document Status

*   **HTTP Method:** `PATCH`
*   **URL:** `/admin/api/v1/documents/{documentId}/status`
*   **Description:** Updates the status of an existing document.
*   **Permissions Required:** `documents:manage` (or equivalent)
*   **Path Parameters:**
    *   `documentId` (string, required): The ID of the document to update.
*   **Request Body:**
    ```json
    {
      "status": "verified"
    }
    ```
*   **Response:** `200 OK`
    ```json
    {
      "id": "doc_456",
      "companyId": "comp_abc",
      "type": "nationalId",
      "fileName": "National_ID.pdf",
      "fileUrl": "https://storage.wanzo.com/documents/doc_456/National_ID.pdf",
      "mimeType": "application/pdf",
      "fileSize": 89600,
      "status": "verified",
      "uploadedAt": "2024-06-01T14:30:00Z"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid status value.
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to update document status.
    *   `404 Not Found`: Document not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 5. Delete a Document

*   **HTTP Method:** `DELETE`
*   **URL:** `/admin/api/v1/documents/{documentId}`
*   **Description:** Deletes a specific document.
*   **Permissions Required:** `documents:delete` (or equivalent)
*   **Path Parameters:**
    *   `documentId` (string, required): The ID of the document to delete.
*   **Response:** `204 No Content`
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to delete this document.
    *   `404 Not Found`: Document not found.
    *   `500 Internal Server Error`: Unexpected server error.

## Data Models

### Document

```typescript
interface Document {
  id: string;
  type: 'rccm' | 'nationalId' | 'taxNumber';
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'pending' | 'verified' | 'rejected';
  companyId: string;
}
```

### DocumentUpload

```typescript
interface DocumentUpload {
  file: File;
  type: 'rccm' | 'nationalId' | 'taxNumber';
  companyId: string;
}
```

### DocumentUploadResponse

```typescript
interface DocumentUploadResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  type: 'rccm' | 'nationalId' | 'taxNumber';
  status: 'pending';
  uploadedAt: Date;
  message: string;
}
```

## Document Types

| Type | Description |
|------|-------------|
| `rccm` | Business registration certificate (Registre du Commerce et du Crédit Mobilier) |
| `nationalId` | National identification document |
| `taxNumber` | Tax identification number certificate |

## Document Status Values

| Status | Description |
|--------|-------------|
| `pending` | Document has been uploaded but not yet verified |
| `verified` | Document has been reviewed and verified |
| `rejected` | Document has been reviewed and rejected |
