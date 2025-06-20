# API Documentation - Treasury

This module manages the organization's treasury, including bank accounts, microfinance accounts, and cash flow.

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

## Endpoints

### 1. List Treasury Accounts

- **Endpoint**: `GET /treasury/accounts`
- **Description**: Retrieves the list of all treasury accounts (banks, microfinance, cooperatives, etc.).
- **Response (200 OK)**:
  ```json
  {
    "accounts": [
      {
        "id": "1",
        "type": "bank",
        "provider": "BICIS",
        "bankName": "BICIS",
        "accountNumber": "SN012 00001 00000000000001",
        "balance": 15000000,
        "currency": "CDF",
        "status": "active",
        "lastReconciliation": "2024-03-01"
      }
    ]
  }
  ```

### 2. Get Treasury Account Details

- **Endpoint**: `GET /treasury/accounts/{id}`
- **Description**: Retrieves detailed information for a specific treasury account.
- **Response (200 OK)**:
  ```json
  {
    "id": "1",
    "type": "bank",
    "provider": "BICIS",
    "bankName": "BICIS",
    "accountNumber": "SN012 00001 00000000000001",
    "balance": 15000000,
    "currency": "CDF",
    "status": "active",
    "lastReconciliation": "2024-03-01",
    "contacts": [
      { "name": "John Doe", "role": "Account Manager", "email": "john.doe@bicis.sn" }
    ]
  }
  ```

### 3. Create a Treasury Account

- **Endpoint**: `POST /treasury/accounts`
- **Description**: Adds a new treasury account.
- **Request Body**:
  ```json
  {
    "type": "bank",
    "provider": "Ecobank",
    "bankName": "Ecobank RDC",
    "accountNumber": "CD012 00001 00000000000001",
    "currency": "USD",
    "status": "active"
  }
  ```
- **Response (201 Created)**: The newly created treasury account object.

### 4. Update a Treasury Account

- **Endpoint**: `PUT /treasury/accounts/{id}`
- **Description**: Updates information for a treasury account.
- **Request Body**:
  ```json
  {
    "status": "inactive",
    "accountNumber": "CD012 00001 0000000000000X"
  }
  ```
- **Response (200 OK)**: The updated treasury account object.

### 5. List Transactions for an Account

- **Endpoint**: `GET /treasury/accounts/{accountId}/transactions`
- **Description**: Retrieves the list of transactions for a specific treasury account.
- **Query Parameters**:
  - `startDate` (string, optional): `YYYY-MM-DD`
  - `endDate` (string, optional): `YYYY-MM-DD`
  - `type` (string, optional): `debit` or `credit`
  - `page` (number, optional)
  - `pageSize` (number, optional)
- **Response (200 OK)**:
  ```json
  {
    "transactions": [
      {
        "id": "1",
        "date": "2024-03-01",
        "description": "Virement client ABC",
        "type": "credit",
        "amount": 1500000,
        "balance": 15000000
      }
    ],
    "pagination": { }
  }
  ```

### 6. Get Overall Treasury Balance

- **Endpoint**: `GET /treasury/balance`
- **Description**: Retrieves an overview of the treasury balance.
- **Query Parameters**:
  - `type` (string, optional): `all` (default) or `bank`.
- **Response (200 OK)**:
  ```json
  {
    "opening": 13500000,
    "current": 15000000,
    "projected": 16500000,
    "currency": "CDF"
  }
  ```

### 7. Reconcile an Account

- **Endpoint**: `POST /treasury/reconcile/{accountId}`
- **Description**: Starts a reconciliation process for a specific account. This can be manual or automated.
- **Request Body**:
  ```json
  {
    "statementId": "stmt_12345",
    "endDate": "2024-03-31"
  }
  ```
- **Response (202 Accepted)**:
  ```json
  {
    "reconciliationId": "recon_abcde",
    "status": "in_progress",
    "message": "Reconciliation started for account {accountId}."
  }
  ```

## Data Structures

### TreasuryAccount

```typescript
interface TreasuryAccount {
  id: string;
  type: 'bank' | 'microfinance' | 'cooperative' | 'vsla' | 'cash';
  provider: string; // e.g., 'BICIS', 'SMICO'
  bankName?: string; // Full name of the bank/institution
  accountNumber: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive' | 'closed';
  lastReconciliation?: string; // YYYY-MM-DD
  contacts?: any[];
}
```

### Transaction

```typescript
interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: 'debit' | 'credit';
  amount: number;
  balance: number; // Balance after transaction
  categoryId?: string;
  reference?: string;
}
```

### TreasuryBalance

```typescript
interface TreasuryBalance {
  opening: number;
  current: number;
  projected: number;
  currency: string;
}
```
