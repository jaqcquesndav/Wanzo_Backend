# API Documentation - Data Import

This module describes the process for importing large sets of data into Wanzo Compta, such as importing an entire fiscal year from a file.

## Base URL

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentication

All API requests require authentication with a valid JWT token.

**Headers**:
```
Authorization: Bearer <token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
```

## Fiscal Year Import

This feature allows importing a full fiscal year, including all its journal entries, from a single file (XLSX or CSV).

### Endpoint

- **URL**: `/fiscal-years/import`
- **Method**: `POST`
- **Description**: Creates a new fiscal year and imports all its journal entries from a data payload. The data payload is expected to be a JSON array representing the rows of the source file.

### Request Body

The request body must be a JSON object containing the fiscal year information and the journal entries data.

```json
{
  "fiscalYear": {
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "code": "EX2023"
  },
  "journalEntries": [
    {
      "date": "2023-01-15",
      "journal": "AC",
      "account": "601100",
      "label": "Achat de marchandises",
      "debit": 150000,
      "credit": 0,
      "reference": "FACT-001"
    },
    {
      "date": "2023-01-15",
      "journal": "AC",
      "account": "445200",
      "label": "TVA déductible",
      "debit": 27000,
      "credit": 0,
      "reference": "FACT-001"
    },
    {
      "date": "2023-01-15",
      "journal": "AC",
      "account": "401100",
      "label": "Fournisseur A",
      "debit": 0,
      "credit": 177000,
      "reference": "FACT-001"
    }
  ]
}
```

### File Structure (for client-side parsing)

The client-side implementation should parse XLSX or CSV files with the following columns to generate the `journalEntries` array:

- `date`: Date of the entry (YYYY-MM-DD)
- `journal`: Journal code (e.g., 'AC', 'VT', 'BQ')
- `account`: Account number
- `label`: Description of the entry
- `debit`: Debit amount
- `credit`: Credit amount
- `reference`: Invoice or document reference

### Backend Process

1.  The backend receives the fiscal year data and the array of journal entries.
2.  It creates a new fiscal year with the provided start date, end date, and code.
3.  It validates and imports each journal entry, associating it with the newly created fiscal year.
4.  The process is typically asynchronous. The API will return an immediate response to confirm that the import process has started.

### Responses

- **Success (202 Accepted)**: Indicates that the import process has been initiated.
  ```json
  {
    "importId": "import-xyz-123",
    "status": "pending",
    "message": "Fiscal year import has been initiated."
  }
  ```
- **Error (400 Bad Request)**: If the data format is invalid.
  ```json
  {
    "error": "InvalidData",
    "message": "The provided data is invalid.",
    "details": ["Field 'startDate' is missing from fiscalYear."]
  }
  ```

### Tracking Import Status

A separate endpoint can be used to track the status of the import.

- **URL**: `/import-status/{importId}`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "importId": "import-xyz-123",
    "status": "completed", // or 'processing', 'failed'
    "processedEntries": 5432,
    "totalEntries": 5432,
    "errors": [] // List of errors if any
  }
  ```
