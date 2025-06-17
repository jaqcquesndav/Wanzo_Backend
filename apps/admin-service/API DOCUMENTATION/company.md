# API Documentation: Company Management

This document outlines the API endpoints for managing company-specific information for Wanzo. This includes retrieving and updating the company profile, managing company-level documents, and retrieving company statistics.

## 1. Company Profile Endpoints

### 1.1. Get Company Profile
*   **HTTP Method:** `GET`
*   **URL:** `/api/company/profile`
*   **Description:** Retrieves the profile information for Wanzo.
*   **Request:** None
*   **Response:** `200 OK`
    ```json
    {
      "data": {
        "id": "wanzo_singleton_id",
        "name": "Wanzo Inc.",
        "rccmNumber": "CD/KIN/RCCM/123456",
        "nationalId": "NAT12345",
        "taxNumber": "TAX12345",
        "cnssNumber": "CNSS12345",
        "logo": "https://cdn.wanzo.com/logo.png",
        "legalForm": "SARL",
        "businessSector": "Technologies et télécommunications",
        "description": "Wanzo provides cutting-edge solutions for enterprise needs.",
        "address": {
          "street": "123 Innovation Drive",
          "city": "Kinshasa",
          "province": "Kinshasa",
          "commune": "Gombe",
          "quartier": "Centre-ville",
          "coordinates": {
            "lat": -4.325,
            "lng": 15.322
          }
        },
        "locations": [
          {
            "address": "456 Business Avenue, Kinshasa",
            "coordinates": {
              "lat": -4.327,
              "lng": 15.324
            },
            "type": "headquarters"
          }
        ],
        "documents": {
          "rccmFile": "https://cdn.wanzo.com/docs/rccm.pdf",
          "nationalIdFile": "https://cdn.wanzo.com/docs/national_id.pdf",
          "taxNumberFile": "https://cdn.wanzo.com/docs/tax.pdf",
          "cnssFile": "https://cdn.wanzo.com/docs/cnss.pdf"
        },
        "contactEmail": "info@wanzo.com",
        "contactPhone": ["+243123456789", "+243987654321"],
        "representativeName": "John Doe",
        "representativeRole": "CEO",
        "updatedAt": "2023-05-01T12:00:00Z",
        "createdAt": "2020-01-15T09:00:00Z"
      }
    }
    ```

*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to view company profile.
    *   `404 Not Found`: Company profile not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.2. Update Company Profile
*   **HTTP Method:** `PUT`
*   **URL:** `/api/company/profile`
*   **Description:** Updates the profile information for Wanzo.
*   **Request Body:**
    ```json
    {
      "name": "Wanzo Solutions SARL",
      "description": "Leader dans les solutions technologiques en RDC",
      "legalForm": "SARL",
      "businessSector": "Technologies et télécommunications",
      "address": {
        "street": "456 Enterprise Avenue",
        "city": "Kinshasa",
        "province": "Kinshasa",
        "commune": "Gombe",
        "quartier": "Quartier des affaires"
      },
      "contactEmail": "support@wanzo.com",
      "contactPhone": ["+243123456789", "+243555666777"],
      "representativeName": "Jane Smith",
      "representativeRole": "Directrice Générale"
    }
    ```
*   **Response:** `200 OK`
    ```json
    {
      "message": "Company profile updated successfully.",
      "data": {
        "id": "wanzo_singleton_id",
        "name": "Wanzo Solutions SARL",
        "rccmNumber": "CD/KIN/RCCM/123456",
        "nationalId": "NAT12345",
        "taxNumber": "TAX12345",
        "cnssNumber": "CNSS12345",
        "logo": "https://cdn.wanzo.com/logo.png",
        "legalForm": "SARL",
        "businessSector": "Technologies et télécommunications",
        "description": "Leader dans les solutions technologiques en RDC",
        "address": {
          "street": "456 Enterprise Avenue",
          "city": "Kinshasa",
          "province": "Kinshasa",
          "commune": "Gombe",
          "quartier": "Quartier des affaires",
          "coordinates": {
            "lat": -4.325,
            "lng": 15.322
          }
        },
        "locations": [
          {
            "address": "456 Business Avenue, Kinshasa",
            "coordinates": {
              "lat": -4.327,
              "lng": 15.324
            },
            "type": "headquarters"
          }
        ],
        "documents": {
          "rccmFile": "https://cdn.wanzo.com/docs/rccm.pdf",
          "nationalIdFile": "https://cdn.wanzo.com/docs/national_id.pdf",
          "taxNumberFile": "https://cdn.wanzo.com/docs/tax.pdf",
          "cnssFile": "https://cdn.wanzo.com/docs/cnss.pdf"
        },
        "contactEmail": "support@wanzo.com",
        "contactPhone": ["+243123456789", "+243555666777"],
        "representativeName": "Jane Smith",
        "representativeRole": "Directrice Générale",
        "updatedAt": "2023-06-01T10:00:00Z",
        "createdAt": "2020-01-15T09:00:00Z"
      }
    }
    ```

*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body.
        ```json
        {
          "error": "InvalidInput",
          "message": "Provided email format is invalid."
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to update company profile.
    *   `404 Not Found`: Company profile not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 1.3 Upload Company Logo
*   **HTTP Method:** `POST`
*   **URL:** `/api/company/logo`
*   **Description:** Uploads a new logo for the company.
*   **Request Body:** Multipart form data with a 'logo' file field
*   **Response:** `200 OK`
    ```json
    {
      "message": "Logo uploaded successfully",
      "data": {
        "logoUrl": "https://cdn.wanzo.com/logos/company-logo-12345.png"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid file format or size
        ```json
        {
          "error": "InvalidFile",
          "message": "Logo must be JPG, PNG, or SVG format and less than 2MB."
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to update company logo.
    *   `500 Internal Server Error`: Unexpected server error.

## 2. Company Documents Management

### 2.1. Upload Company Document
*   **HTTP Method:** `POST`
*   **URL:** `/api/company/documents`
*   **Description:** Uploads a company document.
*   **Request Body:** Multipart form data with:
    * `file`: The document file
    * `type`: Document type ('rccmFile', 'nationalIdFile', 'taxNumberFile', 'cnssFile')
*   **Response:** `201 Created`
    ```json
    {
      "message": "Document uploaded successfully",
      "data": {
        "documentId": "doc_12345",
        "type": "rccmFile",
        "fileUrl": "https://cdn.wanzo.com/docs/rccm.pdf",
        "uploadedAt": "2023-06-10T14:30:00Z"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid file format or size
        ```json
        {
          "error": "InvalidFile",
          "message": "Document must be PDF format and less than 10MB."
        }
        ```
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to upload company documents.
    *   `500 Internal Server Error`: Unexpected server error.

### 2.2. List Company Documents
*   **HTTP Method:** `GET`
*   **URL:** `/api/company/documents`
*   **Description:** Retrieves a list of all company documents.
*   **Response:** `200 OK`
    ```json
    {
      "data": [
        {
          "id": "doc_12345",
          "type": "rccmFile",
          "fileUrl": "https://cdn.wanzo.com/docs/rccm.pdf",
          "fileName": "RCCM-Certificate.pdf",
          "fileSize": 1024000,
          "mimeType": "application/pdf",
          "uploadedAt": "2023-06-10T14:30:00Z"
        },
        {
          "id": "doc_67890",
          "type": "taxNumberFile",
          "fileUrl": "https://cdn.wanzo.com/docs/tax.pdf",
          "fileName": "Tax-Certificate.pdf",
          "fileSize": 890000,
          "mimeType": "application/pdf",
          "uploadedAt": "2023-06-11T09:15:00Z"
        }
      ]
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to view company documents.
    *   `500 Internal Server Error`: Unexpected server error.

## 3. Company Locations Management

### 3.1. Add Company Location
*   **HTTP Method:** `POST`
*   **URL:** `/api/company/locations`
*   **Description:** Adds a new location for the company.
*   **Request Body:**
    ```json
    {
      "address": "789 Branch Street, Lubumbashi",
      "coordinates": {
        "lat": -11.662,
        "lng": 27.479
      },
      "type": "site"
    }
    ```
*   **Response:** `201 Created`
    ```json
    {
      "message": "Location added successfully",
      "data": {
        "id": "loc_12345",
        "address": "789 Branch Street, Lubumbashi",
        "coordinates": {
          "lat": -11.662,
          "lng": 27.479
        },
        "type": "site",
        "createdAt": "2023-06-15T10:00:00Z"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to add company locations.
    *   `500 Internal Server Error`: Unexpected server error.

### 3.2. Update Company Location
*   **HTTP Method:** `PUT`
*   **URL:** `/api/company/locations/{locationId}`
*   **Description:** Updates an existing company location.
*   **Request Body:**
    ```json
    {
      "address": "789 Updated Street, Lubumbashi",
      "coordinates": {
        "lat": -11.663,
        "lng": 27.480
      },
      "type": "store"
    }
    ```
*   **Response:** `200 OK`
    ```json
    {
      "message": "Location updated successfully",
      "data": {
        "id": "loc_12345",
        "address": "789 Updated Street, Lubumbashi",
        "coordinates": {
          "lat": -11.663,
          "lng": 27.480
        },
        "type": "store",
        "updatedAt": "2023-06-16T11:30:00Z",
        "createdAt": "2023-06-15T10:00:00Z"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid request body
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to update company locations.
    *   `404 Not Found`: Location not found.
    *   `500 Internal Server Error`: Unexpected server error.

### 3.3. Delete Company Location
*   **HTTP Method:** `DELETE`
*   **URL:** `/api/company/locations/{locationId}`
*   **Description:** Deletes a company location.
*   **Response:** `200 OK`
    ```json
    {
      "message": "Location deleted successfully"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to delete company locations.
    *   `404 Not Found`: Location not found.
    *   `500 Internal Server Error`: Unexpected server error.

## 4. Company Statistics

### 4.1. Get Company Statistics
*   **HTTP Method:** `GET`
*   **URL:** `/api/company/stats`
*   **Description:** Retrieves statistics about the company.
*   **Response:** `200 OK`
    ```json
    {
      "data": {
        "activeUsers": 125,
        "activeCompanies": 45,
        "activeSubscriptions": 38,
        "totalRevenue": {
          "usd": 15000,
          "cdf": 37500000
        }
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication token is missing or invalid.
    *   `403 Forbidden`: Authenticated user does not have permission to view company statistics.
    *   `500 Internal Server Error`: Unexpected server error.

## 5. Type Definitions

### 5.1. Company
```typescript
interface Company {
  id: string;
  name: string;
  rccmNumber: string;
  nationalId: string;
  taxNumber: string;
  cnssNumber?: string;
  logo?: string;
  legalForm?: LegalForm;
  businessSector?: string;
  description?: string;
  address: {
    street: string;
    city: string;
    province: string;
    commune: string;
    quartier: string;
    coordinates: Coordinates;
  };
  locations: Location[];
  documents: {
    rccmFile?: string;
    nationalIdFile?: string;
    taxNumberFile?: string;
    cnssFile?: string;
  };
  contactEmail: string;
  contactPhone: string[];
  representativeName: string;
  representativeRole: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2. Location
```typescript
interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'headquarters' | 'site' | 'store';
}
```

### 5.3. Legal Forms
```typescript
type LegalForm = 'SARL' | 'SA' | 'SURL' | 'SNC' | 'SCS' | 'COOP' | 'EI';
```
