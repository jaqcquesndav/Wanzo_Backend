# Files API Documentation

This document describes the Files API endpoints for the Wanzo Compta application.

## Base URL

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentication

All endpoints require authentication with a Bearer token.

**Headers:**
```
Authorization: Bearer <token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
```

## Endpoints

### Upload File

Uploads a file to the system.

**URL:** `/files/upload`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - The file to upload
- `entityType` (optional) - Type of entity the file is related to ('journal-entry', 'account', 'company', 'fiscal-year')
- `entityId` (optional) - ID of the entity the file is related to
- `category` (optional) - Category of the file ('invoice', 'receipt', 'statement', 'contract', 'other')
- `description` (optional) - Description of the file

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "file-123",
    "name": "invoice-june-2024.pdf",
    "originalName": "invoice-june-2024.pdf",
    "mimeType": "application/pdf",
    "size": 1250000,
    "url": "https://example.com/files/invoice-june-2024.pdf",
    "thumbnailUrl": "https://example.com/files/thumbnails/invoice-june-2024.jpg",
    "uploadedAt": "2024-06-19T10:30:00Z",
    "entityType": "journal-entry",
    "entityId": "je-456",
    "category": "invoice",
    "description": "Invoice from Supplier XYZ for June 2024"
  }
}
```

### Get File

Retrieves information about a specific file.

**URL:** `/files/:id`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the file to retrieve

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "file-123",
    "name": "invoice-june-2024.pdf",
    "originalName": "invoice-june-2024.pdf",
    "mimeType": "application/pdf",
    "size": 1250000,
    "url": "https://example.com/files/invoice-june-2024.pdf",
    "thumbnailUrl": "https://example.com/files/thumbnails/invoice-june-2024.jpg",
    "uploadedAt": "2024-06-19T10:30:00Z",
    "entityType": "journal-entry",
    "entityId": "je-456",
    "category": "invoice",
    "description": "Invoice from Supplier XYZ for June 2024",
    "uploadedBy": {
      "id": "user-789",
      "name": "John Doe"
    },
    "metadata": {
      "pages": 2,
      "hasText": true
    }
  }
}
```

### Download File

Downloads a file.

**URL:** `/files/:id/download`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the file to download

**Response:**

The response will be a file download with the appropriate content type.

### Delete File

Deletes a file.

**URL:** `/files/:id`

**Method:** `DELETE`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the file to delete

**Response:**

```json
{
  "success": true
}
```

### List Files

Retrieves a list of files.

**URL:** `/files`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `entityType` (optional) - Filter by entity type
- `entityId` (optional) - Filter by entity ID
- `category` (optional) - Filter by category
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Number of files per page (default: 20)
- `sortBy` (optional) - Field to sort by ('name', 'uploadedAt', 'size')
- `sortDirection` (optional) - Sort direction ('asc', 'desc')

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "file-123",
        "name": "invoice-june-2024.pdf",
        "originalName": "invoice-june-2024.pdf",
        "mimeType": "application/pdf",
        "size": 1250000,
        "url": "https://example.com/files/invoice-june-2024.pdf",
        "thumbnailUrl": "https://example.com/files/thumbnails/invoice-june-2024.jpg",
        "uploadedAt": "2024-06-19T10:30:00Z",
        "entityType": "journal-entry",
        "entityId": "je-456",
        "category": "invoice",
        "description": "Invoice from Supplier XYZ for June 2024"
      },
      {
        "id": "file-124",
        "name": "contract-abc.pdf",
        "originalName": "contract-abc.pdf",
        "mimeType": "application/pdf",
        "size": 2500000,
        "url": "https://example.com/files/contract-abc.pdf",
        "thumbnailUrl": "https://example.com/files/thumbnails/contract-abc.jpg",
        "uploadedAt": "2024-06-18T14:15:00Z",
        "entityType": "company",
        "entityId": "comp-123",
        "category": "contract",
        "description": "Service contract with ABC Technologies"
      }
    ],
    "total": 45,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

### Update File

Updates file information.

**URL:** `/files/:id`

**Method:** `PUT`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - ID of the file to update

**Request Body:**
```json
{
  "name": "invoice-june-2024-revised.pdf",
  "entityType": "journal-entry",
  "entityId": "je-789",
  "category": "invoice",
  "description": "Revised invoice from Supplier XYZ for June 2024"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "file-123",
    "name": "invoice-june-2024-revised.pdf",
    "originalName": "invoice-june-2024.pdf",
    "mimeType": "application/pdf",
    "size": 1250000,
    "url": "https://example.com/files/invoice-june-2024-revised.pdf",
    "thumbnailUrl": "https://example.com/files/thumbnails/invoice-june-2024-revised.jpg",
    "uploadedAt": "2024-06-19T10:30:00Z",
    "updatedAt": "2024-06-19T15:45:00Z",
    "entityType": "journal-entry",
    "entityId": "je-789",
    "category": "invoice",
    "description": "Revised invoice from Supplier XYZ for June 2024"
  }
}
```

### Get File Preview

Generates a preview of a file.

**URL:** `/files/:id/preview`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the file to preview
- `page` (optional) - Page number for multi-page documents (default: 1)
- `width` (optional) - Width of the preview in pixels
- `height` (optional) - Height of the preview in pixels

**Response:**

The response will be an image file (JPEG or PNG) representing the preview of the document.

### Extract Text from File

Extracts text from a document.

**URL:** `/files/:id/extract-text`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - ID of the file to extract text from
- `page` (optional) - Specific page to extract text from (for multi-page documents)

**Response:**

```json
{
  "success": true,
  "data": {
    "text": "Invoice #12345\nSupplier: XYZ Company\nDate: June 15, 2024\nAmount: €1,200.00\nVAT: €240.00\nTotal: €1,440.00",
    "pages": 2,
    "currentPage": 1
  }
}
```

### Batch Upload Files

Uploads multiple files in a single request.

**URL:** `/files/batch-upload`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files[]` - Array of files to upload
- `entityType` (optional) - Type of entity the files are related to
- `entityId` (optional) - ID of the entity the files are related to
- `category` (optional) - Category of the files
- `descriptions[]` (optional) - Array of descriptions for each file

**Response:**

```json
{
  "success": true,
  "data": {
    "uploaded": 3,
    "failed": 0,
    "files": [
      {
        "id": "file-125",
        "name": "invoice1.pdf",
        "originalName": "invoice1.pdf",
        "mimeType": "application/pdf",
        "size": 1250000,
        "url": "https://example.com/files/invoice1.pdf",
        "thumbnailUrl": "https://example.com/files/thumbnails/invoice1.jpg",
        "uploadedAt": "2024-06-19T16:30:00Z",
        "entityType": "journal-entry",
        "entityId": "je-456",
        "category": "invoice",
        "description": "Invoice 1"
      },
      {
        "id": "file-126",
        "name": "invoice2.pdf",
        "originalName": "invoice2.pdf",
        "mimeType": "application/pdf",
        "size": 1350000,
        "url": "https://example.com/files/invoice2.pdf",
        "thumbnailUrl": "https://example.com/files/thumbnails/invoice2.jpg",
        "uploadedAt": "2024-06-19T16:30:00Z",
        "entityType": "journal-entry",
        "entityId": "je-456",
        "category": "invoice",
        "description": "Invoice 2"
      },
      {
        "id": "file-127",
        "name": "invoice3.pdf",
        "originalName": "invoice3.pdf",
        "mimeType": "application/pdf",
        "size": 1450000,
        "url": "https://example.com/files/invoice3.pdf",
        "thumbnailUrl": "https://example.com/files/thumbnails/invoice3.jpg",
        "uploadedAt": "2024-06-19T16:30:00Z",
        "entityType": "journal-entry",
        "entityId": "je-456",
        "category": "invoice",
        "description": "Invoice 3"
      }
    ]
  }
}
```

## Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Session expirée"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "error": "File size exceeds maximum allowed (10MB)"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "File not found"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "You don't have permission to access this file"
}
```

**Other Errors:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
