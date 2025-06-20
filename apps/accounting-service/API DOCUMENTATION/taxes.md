# Taxes API Documentation

This documentation outlines the endpoints available for managing tax declarations and submissions in the Wanzo Compta application.

## Overview

The Taxes API (implemented through the Declarations system) provides endpoints for retrieving, creating, updating, and submitting various tax declarations including:
- IPR (Impôt sur le Revenu Professionnel)
- IB (Impôt sur les Bénéfices)
- TVA (Taxe sur la Valeur Ajoutée)
- CNSS (Cotisations sociales)
- TPI (Taxe de Promotion de l'Industrie)
- TE (Taxe Environnementale)

## Base URL

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentication

All API requests require authentication with a valid JWT token.

**Headers**:
```
Authorization: Bearer {token}
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
```

## API Endpoints

### Get All Tax Declarations

Retrieves a paginated list of all tax declarations.

**URL**: `/declarations`

**Method**: `GET`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number for pagination (default: 1) |
| pageSize | number | No | Number of items per page (default: 20) |

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "dec-123",
      "type": "TVA",
      "period": "2023-03",
      "periodicity": "monthly",
      "dueDate": "2023-04-15",
      "status": "submitted",
      "amount": 45000,
      "submittedAt": "2023-04-10T14:30:00Z",
      "submittedBy": "user-456",
      "reference": "TVA-2023-03-001",
      "attachments": ["att-789", "att-790"]
    },
    {
      "id": "dec-124",
      "type": "IPR",
      "period": "2023-03",
      "periodicity": "monthly",
      "dueDate": "2023-04-15",
      "status": "pending",
      "amount": 32000
    },
    // More declarations...
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3
  }
}
```

### Get Tax Declaration by ID

Retrieves a specific tax declaration by its ID.

**URL**: `/declarations/{id}`

**Method**: `GET`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the declaration to retrieve |

**Response**: `200 OK`
```json
{
  "id": "dec-123",
  "type": "TVA",
  "period": "2023-03",
  "periodicity": "monthly",
  "dueDate": "2023-04-15",
  "status": "submitted",
  "amount": 45000,
  "submittedAt": "2023-04-10T14:30:00Z",
  "submittedBy": "user-456",
  "reference": "TVA-2023-03-001",
  "attachments": ["att-789", "att-790"]
}
```

### Create Tax Declaration

Creates a new tax declaration.

**URL**: `/declarations`

**Method**: `POST`

**Request Body**:
```json
{
  "type": "TVA",
  "period": "2023-04",
  "amount": 42000,
  "attachments": ["att-791"]
}
```

**Response**: `201 Created`
```json
{
  "id": "dec-125",
  "type": "TVA",
  "period": "2023-04",
  "periodicity": "monthly",
  "dueDate": "2023-05-15",
  "status": "draft",
  "amount": 42000,
  "attachments": ["att-791"]
}
```

### Update Tax Declaration

Updates an existing tax declaration.

**URL**: `/declarations/{id}`

**Method**: `PUT`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the declaration to update |

**Request Body**:
```json
{
  "amount": 43500,
  "attachments": ["att-791", "att-792"]
}
```

**Response**: `200 OK`
```json
{
  "id": "dec-125",
  "type": "TVA",
  "period": "2023-04",
  "periodicity": "monthly",
  "dueDate": "2023-05-15",
  "status": "draft",
  "amount": 43500,
  "attachments": ["att-791", "att-792"]
}
```

### Submit Tax Declaration

Submits a tax declaration for official filing.

**URL**: `/declarations/{id}/submit`

**Method**: `POST`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the declaration to submit |

**Request Body**: Empty object `{}`

**Response**: `200 OK`
```json
{
  "id": "dec-125",
  "type": "TVA",
  "period": "2023-04",
  "periodicity": "monthly",
  "dueDate": "2023-05-15",
  "status": "submitted",
  "amount": 43500,
  "submittedAt": "2023-05-10T09:45:00Z",
  "submittedBy": "user-456",
  "reference": "TVA-2023-04-001",
  "attachments": ["att-791", "att-792"]
}
```

### Download Tax Declaration

Downloads a tax declaration in the specified format.

**URL**: `/declarations/{id}/download`

**Method**: `GET`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the declaration to download |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| format | string | Yes | The format to download ('pdf' or 'excel') |

**Response**: `200 OK`

A Blob object containing the declaration in the requested format.

## Error Responses

**400 Bad Request**
```json
{
  "error": "Bad Request",
  "message": "Invalid declaration data",
  "details": [
    "Amount must be a positive number",
    "Period must be in YYYY-MM format for monthly declarations"
  ]
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions to submit declarations"
}
```

**404 Not Found**
```json
{
  "error": "Not Found",
  "message": "Declaration not found"
}
```

**409 Conflict**
```json
{
  "error": "Conflict",
  "message": "Cannot modify a submitted declaration"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Data Structures

### Declaration

```typescript
interface Declaration {
  id: string;                                  // Unique identifier
  type: DeclarationType;                       // Type of declaration
  period: string;                             // Period in 'YYYY-MM' format for monthly/quarterly, 'YYYY' for annual
  periodicity: DeclarationPeriodicity;        // Frequency of declaration
  dueDate: string;                           // Due date for filing the declaration
  status: DeclarationStatus;                  // Current status
  amount: number;                            // Amount to pay
  submittedAt?: string;                      // Date and time of submission
  submittedBy?: string;                      // User ID who submitted
  reference?: string;                        // Official reference after submission
  attachments?: string[];                    // Array of attachment IDs
}
```

### DeclarationType

```typescript
type DeclarationType = 
  | 'IPR'   // Impôt sur le Revenu Professionnel
  | 'IB'    // Impôt sur les Bénéfices
  | 'TVA'   // Taxe sur la Valeur Ajoutée
  | 'CNSS'  // Cotisations CNSS
  | 'TPI'   // Taxe de Promotion de l'Industrie
  | 'TE';   // Taxe Environnementale
```

### DeclarationPeriodicity

```typescript
type DeclarationPeriodicity = 'monthly' | 'quarterly' | 'annual';
```

### DeclarationStatus

```typescript
type DeclarationStatus = 'draft' | 'pending' | 'submitted';
```

## Tax Types Information

### IPR (Impôt sur le Revenu Professionnel)
- **Description**: Professional income tax withheld from employee salaries
- **Periodicity**: Monthly
- **Due Date**: 15th day of the following month

### IB (Impôt sur les Bénéfices)
- **Description**: Corporate income tax on company profits
- **Periodicity**: Annual
- **Due Date**: March 31st of the following year

### TVA (Taxe sur la Valeur Ajoutée)
- **Description**: Value-added tax
- **Periodicity**: Monthly
- **Due Date**: 15th day of the following month

### CNSS (Cotisations CNSS)
- **Description**: Social security contributions
- **Periodicity**: Monthly
- **Due Date**: 10th day of the following month

### TPI (Taxe de Promotion de l'Industrie)
- **Description**: Industry promotion tax
- **Periodicity**: Monthly
- **Due Date**: 15th day of the following month

### TE (Taxe Environnementale)
- **Description**: Environmental tax
- **Periodicity**: Quarterly
- **Due Date**: 15th day of the first month of the following quarter
