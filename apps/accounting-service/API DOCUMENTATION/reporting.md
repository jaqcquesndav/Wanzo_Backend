# Reporting API Documentation

This documentation outlines the endpoints available for generating and managing financial reports in the Wanzo Compta application.

## Overview

The Reporting API provides endpoints for generating and exporting various financial statements, including:
- Balance Sheet
- Income Statement
- Cash Flow Statement
- Equity Changes Statement
- Notes to Financial Statements
- Reconciliation Statement
- Analytical Statement
- Social Balance Sheet
- Statistical Statement

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

### Generate Financial Report

Generates a financial report based on the specified parameters. This is the primary endpoint for retrieving report data.

**URL**: `/reports/generate`

**Method**: `POST`

**Body**:
```json
{
  "type": "balance",
  "format": "json",
  "date": "2023-12-31",
  "comparative": true,
  "currency": "CDF",
  "includeNotes": true,
  "filters": {
    "analytical_account_id": "12345",
    "cost_center_id": "67890"
  }
}
```

**Body Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | The type of financial statement to generate. See [Financial Statement Types](#financial-statement-types) for possible values. |
| `format` | string | No | The desired format of the report data. Defaults to `json`. Can be `json` or `html`. |
| `date` | string | Yes | The end date for the report period (YYYY-MM-DD). |
| `comparative` | boolean | No | Whether to include comparative data from the previous period. Defaults to `false`. |
| `currency` | string | No | The currency code for the report (e.g., 'USD', 'CDF'). Defaults to the organization's base currency. |
| `includeNotes` | boolean | No | Whether to include analytical notes in the report. Defaults to `false`. |
| `filters` | object | No | Additional filters for analytical or specific reports. |

**Response**: `200 OK`

The response will contain the generated report data in JSON format, structured according to the report type. See the specific report sections for example responses.

### Export Financial Report

Exports a previously generated financial report to a specified format (PDF or Excel).

**URL**: `/reports/export`

**Method**: `POST`

**Body**:
```json
{
  "type": "balance",
  "format": "pdf",
  "data": { ... },
  "title": "Bilan au 31/12/2023",
  "organization": {
    "name": "ENTREPRISE ABC SARL",
    "address": "Kinshasa, RD Congo",
    "registrationNumber": "CD/KIN/RCCM/22-B-01234",
    "taxId": "A1234567Y"
  },
  "generatedBy": "John Doe",
  "isAudited": true,
  "currency": "CDF"
}
```

**Body Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | The type of financial statement being exported. |
| `format` | string | Yes | The export format. Can be `pdf` or `excel`. |
| `data` | object | Yes | The JSON data of the report to be exported. This should be the output from the `/reports/generate` endpoint. |
| `title` | string | Yes | The title of the report. |
| `organization` | object | Yes | Information about the organization. |
| `generatedBy` | string | Yes | The name or email of the user who generated the report. |
| `isAudited` | boolean | No | Whether the report is marked as audited. Defaults to `false`. |
| `currency` | string | Yes | The currency of the report. |

**Response**: `200 OK`

The response will be a file stream of the generated report in the specified format.

---

## Financial Statement Types

The `type` parameter in the `/reports/generate` endpoint can have one of the following values:

| Value | Description |
|---|---|
| `balance` | Bilan (Balance Sheet) |
| `income` | Compte de Résultat (Income Statement) |
| `cashflow` | Tableau des Flux de Trésorerie (Cash Flow Statement) |
| `equity-changes` | Tableau de Variation des Capitaux Propres (Statement of Changes in Equity) |
| `notes` | Notes Annexes (Notes to Financial Statements) |
| `reconciliation` | État de Rapprochement (Reconciliation Statement) |
| `analytical` | État Analytique (Analytical Report) |
| `social` | Bilan Social (Social Balance Sheet) |
| `statistics` | État Statistique (Statistical Report) |

---

## Report Data Structures and Examples

### Balance Sheet (`balance`)

Retrieves the balance sheet data for a specified date.

**Example Response Body** (`/reports/generate` with `type: 'balance'`)
```json
{
  "fixedAssets": {
    "intangibleAssets": [
      {
        "code": "211",
        "label": "Brevets et licences",
        "brut": 50000,
        "amort": 20000,
        "net": 30000,
        "netN1": 35000
      }
    ],
    "tangibleAssets": [],
    "financialAssets": [],
    "total": {
      "code": "2",
      "label": "Total Actif Immobilisé",
      "brut": 850000,
      "amort": 250000,
      "net": 600000,
      "netN1": 550000
    }
  },
  "currentAssets": {
    "total": {
      "code": "3",
      "label": "Total Actif Circulant",
      "net": 350000,
      "netN1": 320000
    }
  },
  "treasuryAssets": {
    "total": {
      "code": "5",
      "label": "Total Trésorerie-Actif",
      "net": 180000,
      "netN1": 150000
    }
  },
  "grandTotal": {
    "code": "T",
    "label": "Total Actif",
    "net": 1130000,
    "netN1": 1020000
  },
  "equity": {
    "total": {
      "code": "1",
      "label": "Total Capitaux Propres",
      "net": 580000,
      "netN1": 520000
    }
  },
  "liabilities": {
    "total": {
      "code": "4",
      "label": "Total Dettes",
      "net": 550000,
      "netN1": 500000
    }
  }
}
```

### Income Statement (`income`)

Retrieves the income statement for a specified period.

**Example Response Body** (`/reports/generate` with `type: 'income'`)
```json
{
  "operatingRevenue": {
    "items": [
      {
        "code": "70",
        "label": "Ventes de marchandises",
        "amount": 1200000,
        "amountN1": 1100000
      }
    ],
    "total": {
      "code": "I",
      "label": "Total Produits d'Exploitation",
      "amount": 1500000,
      "amountN1": 1350000
    }
  },
  "operatingExpenses": {
    "items": [
      {
        "code": "60",
        "label": "Achats de marchandises",
        "amount": 800000,
        "amountN1": 750000
      }
    ],
    "total": {
      "code": "II",
      "label": "Total Charges d'Exploitation",
      "amount": 1100000,
      "amountN1": 1000000
    }
  },
  "operatingResult": {
    "code": "III",
    "label": "Résultat d'Exploitation",
    "amount": 400000,
    "amountN1": 350000
  },
  "financialResult": {
    "code": "IV",
    "label": "Résultat Financier",
    "amount": -20000,
    "amountN1": -15000
  },
  "extraordinaryResult": {
    "code": "V",
    "label": "Résultat Hors Activités Ordinaires",
    "amount": 0,
    "amountN1": 0
  },
  "taxOnProfit": {
    "code": "VI",
    "label": "Impôts sur les bénéfices",
    "amount": 120000,
    "amountN1": 100000
  },
  "netResult": {
    "code": "VII",
    "label": "Résultat Net",
    "amount": 260000,
    "amountN1": 235000
  }
}
```

### Cash Flow Statement (`cashflow`)

Retrieves the cash flow statement for a specified period.

**Example Response Body** (`/reports/generate` with `type: 'cashflow'`)
```json
{
  "operatingActivities": {
    "netIncome": 260000,
    "depreciationAndAmortization": 80000,
    "changesInWorkingCapital": -30000,
    "netCashFlow": 310000
  },
  "investingActivities": {
    "purchaseOfAssets": -150000,
    "saleOfAssets": 20000,
    "netCashFlow": -130000
  },
  "financingActivities": {
    "issuanceOfShares": 50000,
    "repaymentOfDebt": -70000,
    "netCashFlow": -20000
  },
  "netChangeInCash": 160000,
  "beginningCashBalance": 100000,
  "endingCashBalance": 260000
}
```

### Statement of Changes in Equity (`equity-changes`)

Retrieves the statement of changes in equity for a specified period.

**Example Response Body** (`/reports/generate` with `type: 'equity-changes'`)
```json
{
  "openingBalance": {
    "shareCapital": 500000,
    "retainedEarnings": 150000,
    "total": 650000
  },
  "changes": {
    "netIncome": 260000,
    "dividends": -100000,
    "shareIssuance": 50000
  },
  "closingBalance": {
    "shareCapital": 550000,
    "retainedEarnings": 310000,
    "total": 860000
  }
}
```

---

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request.

| Code | Description |
|---|---|
| `200 OK` | The request was successful. |
| `400 Bad Request` | The request was malformed or contained invalid parameters. |
| `401 Unauthorized` | The request requires user authentication. |
| `403 Forbidden` | The authenticated user does not have permission to access the resource. |
| `404 Not Found` | The requested resource could not be found. |
| `500 Internal Server Error` | An unexpected error occurred on the server. |

**Example Error Response**:
```json
{
  "error": {
    "code": "InvalidParameter",
    "message": "The 'type' parameter is invalid. Please provide a valid report type."
  }
}
```
