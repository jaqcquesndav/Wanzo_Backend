# Documents API Documentation

## Overview

The Documents API in Wanzo provides endpoints for managing documents such as uploading, retrieving, and deleting files related to various entities in the system (invoices, expenses, customers, etc.). It supports multipart file uploads and associating documents with specific business entities.

## Models

### Document Model

The `Document` model represents a document in the system with the following properties:

```json
{
  "id": "string",
  "fileName": "string",
  "fileType": "string (optional)",
  "url": "string",
  "uploadedAt": "datetime",
  "userId": "string (optional)",
  "entityId": "string (optional)",
  "entityType": "string (optional)",
  "fileSize": "number (optional)"
}
```

- `id`: Unique identifier for the document
- `fileName`: Original name of the uploaded file
- `fileType`: MIME type or extension of the file (e.g., pdf, jpg, png)
- `url`: URL to access/download the document
- `uploadedAt`: Timestamp when the document was uploaded
- `userId`: ID of the user who uploaded the document
- `entityId`: ID of the entity this document is associated with (e.g., invoice ID, expense ID)
- `entityType`: Type of the entity (e.g., 'invoice', 'expense', 'customer')
- `fileSize`: Size of the file in bytes

## API Endpoints

### Upload Document

Uploads a new document file and associates it with an entity.

- **Endpoint**: `/documents/upload`
- **Method**: POST
- **Content-Type**: `multipart/form-data`
- **Authorization**: Bearer token required
- **Form Parameters**:
  - `documentFile`: The file to upload (required)
  - `entityId`: ID of the entity to associate with (required)
  - `entityType`: Type of the entity (required)
- **Response**:
  ```json
  {
    "success": true,
    "data": Document,
    "message": "Document uploaded successfully.",
    "statusCode": 200
  }
  ```

### Get Documents

Retrieves a list of documents, with optional filtering.

- **Endpoint**: `/documents`
- **Method**: GET
- **Authorization**: Bearer token required
- **Query Parameters**:
  - `entityId`: Filter by entity ID (optional)
  - `entityType`: Filter by entity type (optional)
  - `documentType`: Filter by document type (optional)
  - `page`: Page number for pagination (optional)
  - `limit`: Number of items per page (optional)
- **Response**:
  ```json
  {
    "success": true,
    "data": [Document],
    "message": "Documents fetched successfully.",
    "statusCode": 200
  }
  ```

### Get Document by ID

Retrieves a specific document by its ID.

- **Endpoint**: `/documents/{id}`
- **Method**: GET
- **Authorization**: Bearer token required
- **URL Parameters**:
  - `id`: ID of the document to retrieve
- **Response**:
  ```json
  {
    "success": true,
    "data": Document,
    "message": "Document fetched successfully.",
    "statusCode": 200
  }
  ```

### Delete Document

Deletes a specific document.

- **Endpoint**: `/documents/{id}`
- **Method**: DELETE
- **Authorization**: Bearer token required
- **URL Parameters**:
  - `id`: ID of the document to delete
- **Response**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "Document deleted successfully.",
    "statusCode": 200
  }
  ```

## Usage Example

```dart
// Upload a document
final File file = File('/path/to/file.pdf');
final ApiResponse<Document> uploadResponse = await documentApiService.uploadDocument(
  file: file,
  entityId: 'invoice-123',
  entityType: 'invoice',
);

// Get documents filtered by entity
final ApiResponse<List<Document>> documents = await documentApiService.getDocuments(
  entityId: 'invoice-123',
  entityType: 'invoice',
  page: 1,
  limit: 10,
);

// Get a specific document
final ApiResponse<Document> document = await documentApiService.getDocumentById('document-id');

// Delete a document
final ApiResponse<void> deleteResponse = await documentApiService.deleteDocument('document-id');
```

## Error Handling

The Documents API handles errors in several ways:

1. Validates file uploads and returns appropriate error messages for invalid files
2. Uses standard HTTP status codes to indicate success or failure
3. Returns detailed error messages in the API response
4. Handles multipart form data errors specifically for file uploads

## Implementation Notes

1. The API supports any file type, but the application may restrict certain file types for security
2. Files are stored on a secure server and accessed via signed URLs
3. The system may impose file size limits (not explicitly defined in the API)
4. Documents are associated with entities to maintain proper organization
5. Document deletion is permanent and cannot be undone
