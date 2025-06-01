# API Documentation: Company Management

This document outlines the API endpoints for managing company-specific information for Kiota. This includes retrieving and updating the company profile and managing company-level documents.

## 1. Company Profile Endpoints

### 1.1. Get Company Profile
*   **Endpoint:** `GET /api/company/profile`
*   **Description:** Retrieves the profile information for Kiota.
*   **Request:** None
*   **Response:** `200 OK`
    ```json
    {
      "data": {
        "id": "kiota_singleton_id",
        "name": "Kiota Inc.",
        "registrationNumber": "123456789",
        "taxId": "TAXID123",
        "address": {
          "street": "123 Innovation Drive",
          "city": "Tech City",
          "state": "CA",
          "postalCode": "90210",
          "country": "USA"
        },
        "contactEmail": "info@kiota.com",
        "phoneNumber": "+1-555-0100",
        "website": "https://www.kiota.com",
        "logoUrl": "https://cdn.kiota.com/logo.png",
        "industry": "Technology",
        "foundedDate": "2020-01-15",
        "description": "Kiota provides cutting-edge solutions for enterprise needs.",
        "updatedAt": "2023-05-01T12:00:00Z",
        "createdAt": "2020-01-15T09:00:00Z"
      }
    }
    ```

*   **Error Responses (General):**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to view company profile (should generally be allowed for any authenticated admin).
    *   `404 Not Found`: Company profile not found (should not happen in a single-company setup, but good to define).
    *   `500 Internal Server Error`: Unexpected server error.

### 1.2. Update Company Profile
*   **Endpoint:** `PUT /api/company/profile`
*   **Description:** Updates the profile information for Kiota.
*   **Request Body:**
    ```json
    {
      "name": "Kiota Solutions Ltd.",
      "address": {
        "street": "456 Enterprise Avenue",
        "city": "Innovation Hub",
        "state": "TX",
        "postalCode": "75001",
        "country": "USA"
      },
      "contactEmail": "support@kiota.com",
      "phoneNumber": "+1-555-0101",
      "website": "https://www.kiota.com/solutions"
      // Include other fields to update as necessary
    }
    ```
*   **Response:** `200 OK`
    ```json
    {
      "message": "Company profile updated successfully.",
      "data": {
        // The updated company profile object
        "id": "kiota_singleton_id",
        "name": "Kiota Solutions Ltd.",
        "registrationNumber": "123456789",
        "taxId": "TAXID123",
        "address": {
          "street": "456 Enterprise Avenue",
          "city": "Innovation Hub",
          "state": "TX",
          "postalCode": "75001",
          "country": "USA"
        },
        "contactEmail": "support@kiota.com",
        "phoneNumber": "+1-555-0101",
        "website": "https://www.kiota.com/solutions",
        "logoUrl": "https://cdn.kiota.com/logo.png",
        "industry": "Technology",
        "foundedDate": "2020-01-15",
        "description": "Kiota provides cutting-edge solutions for enterprise needs.",
        "updatedAt": "2023-06-01T10:00:00Z",
        "createdAt": "2020-01-15T09:00:00Z"
      }
    }
    ```

*   **Error Responses (General):**
    *   `400 Bad Request`: Invalid request body (e.g., malformed JSON, invalid data types for fields like email, phone, website URL).
        ```json
        {
          "error": "InvalidInput",
          "message": "Provided email format is invalid.",
          "details": {
            "field": "contactEmail",
            "value": "not-an-email"
          }
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to update the company profile.
    *   `422 Unprocessable Entity`: The request was well-formed but contains semantic errors (e.g., country code not recognized, invalid postal code for the given country).
    *   `500 Internal Server Error`: Unexpected server error.

## 2. Company Document Endpoints

### 2.1. List Company Documents
*   **Endpoint:** `GET /api/company/documents`
*   **Description:** Retrieves a list of documents associated with Kiota.
*   **Request:**
    *   Query Parameters:
        *   `category` (optional, string): Filter documents by category (e.g., "legal", "financial_reports", "compliance").
        *   `uploadedAfter` (optional, date string YYYY-MM-DD): Filter documents uploaded after a certain date.
        *   `page` (optional, integer): For pagination.
        *   `limit` (optional, integer): Number of documents per page.
*   **Response:** `200 OK`
    ```json
    {
      "data": [
        {
          "id": "doc_company_abc123",
          "fileName": "AnnualReport2023.pdf",
          "category": "financial_reports",
          "fileType": "application/pdf",
          "fileSize": 5242880, // in bytes
          "uploadDate": "2024-01-20T10:00:00Z",
          "uploadedBy": "user_admin_001",
          "description": "Kiota Annual Financial Report for FY2023.",
          "url": "/api/documents/doc_company_abc123/download" // Example download link
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 3,
        "totalItems": 25,
        "itemsPerPage": 10
      }
    }
    ```

*   **Error Responses (General):**
    *   `400 Bad Request`: Invalid query parameters (e.g., invalid date format for `uploadedAfter`, non-integer `page` or `limit`).
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to list company documents.
    *   `500 Internal Server Error`: Unexpected server error.

### 2.2. Upload Company Document
*   **Endpoint:** `POST /api/company/documents/upload`
*   **Description:** Uploads a new document for Kiota. This is typically a multipart/form-data request.
*   **Request Body (multipart/form-data):**
    *   `file`: The document file.
    *   `category` (string, optional): Category of the document (e.g., "legal", "internal_policy").
    *   `description` (string, optional): A brief description of the document.
*   **Response:** `201 Created`
    ```json
    {
      "message": "Document uploaded successfully.",
      "data": {
        "id": "doc_company_xyz789",
        "fileName": "NDA_Template_Kiota.docx",
        "category": "legal",
        "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "fileSize": 150320, // in bytes
        "uploadDate": "2024-06-01T11:00:00Z",
        "uploadedBy": "user_admin_002", // ID of the uploading admin user
        "description": "Standard Non-Disclosure Agreement template for Kiota.",
        "url": "/api/documents/doc_company_xyz789/download"
      }
    }
    ```

*   **Error Responses (General):**
    *   `400 Bad Request`: No file provided, or invalid form data (e.g., missing `file` part, unsupported file type if validation is done server-side before deep processing).
        ```json
        {
          "error": "MissingFile",
          "message": "No file was found in the upload request."
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to upload company documents.
    *   `413 Payload Too Large`: If the uploaded file exceeds the server's configured size limit.
    *   `422 Unprocessable Entity`: Invalid category, or other metadata issues.
    *   `500 Internal Server Error`: Unexpected server error during file processing or storage.
