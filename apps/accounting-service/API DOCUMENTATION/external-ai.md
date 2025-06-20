# External AI API Documentation

This document describes the External AI API endpoints for the Wanzo Compta application. These endpoints handle integration with AI services.

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

### AI Chat Completion

Sends a message to an AI model and gets a response.

**URL:** `/external-ai/chat`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Comment enregistrer une facture d'achat avec TVA ?",
  "conversationId": "conv-123",
  "modelId": "adha-1",
  "context": ["fiscal-year-2024", "SYSCOHADA"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": "Pour enregistrer une facture d'achat avec TVA dans le système SYSCOHADA, vous devez créer une écriture de journal avec les comptes suivants :\n\n1. Débiter le compte de charge approprié (classe 6)\n2. Débiter le compte 4456 - TVA déductible\n3. Créditer le compte 401 - Fournisseurs\n\nExemple pour une facture de 1000 € HT avec TVA à 20% :\n- Débit 6xxxxx : 1000 €\n- Débit 4456 : 200 €\n- Crédit 401 : 1200 €",
    "messageId": "msg-1",
    "model": {
      "id": "adha-1",
      "name": "Adha 1"
    },
    "timestamp": "2024-06-19T15:30:45Z",
    "tokenUsage": {
      "prompt": 56,
      "completion": 128,
      "total": 184
    }
  }
}
```

### AI Document Analysis

Analyzes a document using AI.

**URL:** `/external-ai/analyze-document`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - The document file to analyze
- `type` (optional) - Type of analysis ('invoice', 'receipt', 'statement', 'contract', default: auto-detect)
- `modelId` (optional) - ID of the AI model to use

**Response:**

```json
{
  "success": true,
  "data": {
    "documentType": "invoice",
    "confidence": 0.95,
    "extracted": {
      "invoiceNumber": "INV-12345",
      "date": "2024-06-15",
      "dueDate": "2024-07-15",
      "vendor": {
        "name": "ABC Technologies",
        "address": "123 Tech Street, Paris 75001",
        "taxId": "FR12345678901"
      },
      "customer": {
        "name": "XYZ Corporation",
        "address": "456 Business Avenue, Lyon 69002",
        "taxId": "FR98765432101"
      },
      "items": [
        {
          "description": "Web Development Services",
          "quantity": 1,
          "unitPrice": 1000.00,
          "totalPrice": 1000.00,
          "vatRate": 20,
          "vatAmount": 200.00
        }
      ],
      "totals": {
        "subtotal": 1000.00,
        "vatAmount": 200.00,
        "total": 1200.00
      },
      "paymentDetails": {
        "bankName": "BNP Paribas",
        "accountNumber": "FR7630001007941234567890185",
        "reference": "INV-12345"
      }
    },
    "suggestions": {
      "journalEntry": {
        "date": "2024-06-15",
        "description": "Invoice #INV-12345 from ABC Technologies",
        "reference": "INV-12345",
        "lines": [
          {
            "accountCode": "622600",
            "accountName": "Honoraires",
            "debit": 1000.00,
            "credit": 0
          },
          {
            "accountCode": "445660",
            "accountName": "TVA déductible sur autres biens et services",
            "debit": 200.00,
            "credit": 0
          },
          {
            "accountCode": "401000",
            "accountName": "Fournisseurs",
            "debit": 0,
            "credit": 1200.00
          }
        ]
      },
      "tags": ["development", "services", "webdev"]
    },
    "tokenUsage": {
      "prompt": 1024,
      "completion": 512,
      "total": 1536
    }
  }
}
```

### AI Account Reconciliation

Uses AI to suggest account reconciliations.

**URL:** `/external-ai/reconcile`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accountId": "acc-512",
  "statementEntries": [
    {
      "date": "2024-06-10",
      "description": "VIR SEPA CLIENT ABC",
      "amount": 1200.00,
      "type": "credit"
    },
    {
      "date": "2024-06-12",
      "description": "PRLV SEPA LOYER BUREAU",
      "amount": 2500.00,
      "type": "debit"
    },
    {
      "date": "2024-06-15",
      "description": "VIR SEPA CLIENT DEF",
      "amount": 3500.00,
      "type": "credit"
    }
  ],
  "ledgerEntries": [
    {
      "id": "je-123",
      "date": "2024-06-10",
      "description": "Paiement facture client ABC",
      "amount": 1200.00,
      "type": "credit"
    },
    {
      "id": "je-124",
      "date": "2024-06-15",
      "description": "Paiement facture client DEF",
      "amount": 3500.00,
      "type": "credit"
    }
  ],
  "modelId": "adha-1"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "statementEntry": {
          "date": "2024-06-10",
          "description": "VIR SEPA CLIENT ABC",
          "amount": 1200.00,
          "type": "credit"
        },
        "ledgerEntry": {
          "id": "je-123",
          "date": "2024-06-10",
          "description": "Paiement facture client ABC",
          "amount": 1200.00,
          "type": "credit"
        },
        "confidence": 0.95
      },
      {
        "statementEntry": {
          "date": "2024-06-15",
          "description": "VIR SEPA CLIENT DEF",
          "amount": 3500.00,
          "type": "credit"
        },
        "ledgerEntry": {
          "id": "je-124",
          "date": "2024-06-15",
          "description": "Paiement facture client DEF",
          "amount": 3500.00,
          "type": "credit"
        },
        "confidence": 0.98
      }
    ],
    "unmatched": {
      "statementEntries": [
        {
          "date": "2024-06-12",
          "description": "PRLV SEPA LOYER BUREAU",
          "amount": 2500.00,
          "type": "debit"
        }
      ],
      "ledgerEntries": []
    },
    "suggestions": [
      {
        "description": "Le prélèvement SEPA 'LOYER BUREAU' du 12/06/2024 n'a pas d'entrée correspondante dans le grand livre. Il semble être un paiement de loyer. Suggestion d'écriture :",
        "journalEntry": {
          "date": "2024-06-12",
          "description": "Loyer bureau",
          "lines": [
            {
              "accountCode": "613200",
              "accountName": "Locations immobilières",
              "debit": 2500.00,
              "credit": 0
            },
            {
              "accountCode": "512000",
              "accountName": "Banque",
              "debit": 0,
              "credit": 2500.00
            }
          ]
        }
      }
    ],
    "tokenUsage": {
      "prompt": 512,
      "completion": 384,
      "total": 896
    }
  }
}
```

### AI Financial Analysis

Uses AI to analyze financial data and provide insights.

**URL:** `/external-ai/analyze-financials`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fiscalYearId": "fy-123",
  "period": "quarter",
  "compareWithPrevious": true,
  "includeRatios": true,
  "modelId": "adha-pro"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": "Les performances financières de l'entreprise montrent une amélioration par rapport à la période précédente. Le chiffre d'affaires a augmenté de 12%, tandis que les marges se sont améliorées de 2.5 points. La trésorerie reste solide avec une augmentation de 15% par rapport au trimestre précédent.",
    "keyFindings": [
      {
        "title": "Croissance du chiffre d'affaires",
        "description": "Le chiffre d'affaires a augmenté de 12% par rapport au trimestre précédent, principalement porté par le secteur des services (+18%).",
        "trend": "positive"
      },
      {
        "title": "Amélioration des marges",
        "description": "La marge brute est passée de 40% à 42.5%, grâce à une meilleure gestion des coûts directs.",
        "trend": "positive"
      },
      {
        "title": "Augmentation des frais généraux",
        "description": "Les frais généraux ont augmenté de 8%, ce qui est inférieur à la croissance du chiffre d'affaires, mais mérite une attention particulière.",
        "trend": "neutral"
      },
      {
        "title": "Amélioration de la trésorerie",
        "description": "La position de trésorerie s'est améliorée de 15%, permettant une plus grande flexibilité financière.",
        "trend": "positive"
      }
    ],
    "ratioAnalysis": [
      {
        "name": "Marge brute",
        "current": 42.5,
        "previous": 40.0,
        "change": 2.5,
        "benchmark": 38.0,
        "analysis": "La marge brute est supérieure à la moyenne du secteur (38%) et s'est améliorée de 2.5 points, ce qui est un signe positif."
      },
      {
        "name": "Ratio de liquidité générale",
        "current": 1.8,
        "previous": 1.6,
        "change": 0.2,
        "benchmark": 1.5,
        "analysis": "Le ratio de liquidité est bon et s'est amélioré, ce qui indique une bonne capacité à faire face aux obligations à court terme."
      },
      {
        "name": "Ratio d'endettement",
        "current": 0.8,
        "previous": 0.9,
        "change": -0.1,
        "benchmark": 1.0,
        "analysis": "Le ratio d'endettement est en amélioration et reste inférieur à la moyenne du secteur, ce qui est positif."
      },
      {
        "name": "Rotation des actifs",
        "current": 0.45,
        "previous": 0.42,
        "change": 0.03,
        "benchmark": 0.4,
        "analysis": "La rotation des actifs s'est légèrement améliorée, indiquant une meilleure utilisation des actifs pour générer des revenus."
      }
    ],
    "recommendations": [
      {
        "title": "Maintenir la stratégie de gestion des coûts",
        "description": "Continuer à optimiser les coûts directs pour maintenir l'amélioration de la marge brute.",
        "priority": "high"
      },
      {
        "title": "Surveiller les frais généraux",
        "description": "Bien que les frais généraux aient augmenté moins rapidement que le chiffre d'affaires, il est recommandé de surveiller leur évolution pour éviter une dérive.",
        "priority": "medium"
      },
      {
        "title": "Investir dans les secteurs à forte croissance",
        "description": "Le secteur des services ayant montré une forte croissance (+18%), il pourrait être judicieux d'y allouer davantage de ressources.",
        "priority": "medium"
      },
      {
        "title": "Optimiser la gestion des créances clients",
        "description": "Le DSO (Days Sales Outstanding) est légèrement supérieur à la moyenne du secteur. Une amélioration de la gestion des créances pourrait encore améliorer la position de trésorerie.",
        "priority": "low"
      }
    ],
    "tokenUsage": {
      "prompt": 2048,
      "completion": 1536,
      "total": 3584
    }
  }
}
```

### AI Journal Entry Generation

Uses AI to generate journal entries based on a description.

**URL:** `/external-ai/generate-journal-entry`

**Method:** `POST`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "description": "Achat de matériel informatique pour 2000€ HT, TVA 20%, payé par chèque",
  "date": "2024-06-19",
  "fiscalYearId": "fy-123",
  "modelId": "adha-1"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "journalEntry": {
      "date": "2024-06-19",
      "description": "Achat de matériel informatique",
      "journalType": "purchases",
      "reference": "AUTO-2024-06-19-001",
      "totalDebit": 2400.00,
      "totalCredit": 2400.00,
      "totalVat": 400.00,
      "status": "draft",
      "lines": [
        {
          "accountCode": "218300",
          "accountName": "Matériel informatique",
          "debit": 2000.00,
          "credit": 0,
          "description": "Achat de matériel informatique"
        },
        {
          "accountCode": "445620",
          "accountName": "TVA déductible sur immobilisations",
          "debit": 400.00,
          "credit": 0,
          "description": "TVA sur achat de matériel informatique",
          "vatCode": "TVA20",
          "vatAmount": 400.00
        },
        {
          "accountCode": "512000",
          "accountName": "Banque",
          "debit": 0,
          "credit": 2400.00,
          "description": "Paiement par chèque"
        }
      ]
    },
    "explanation": "Cette écriture enregistre l'achat de matériel informatique pour 2000€ HT, avec TVA à 20% (400€), pour un total de 2400€ TTC. Le matériel informatique est une immobilisation, donc on utilise le compte 218300. La TVA sur immobilisations est déductible et enregistrée dans le compte 445620. Le paiement est effectué par chèque, donc on utilise le compte 512000 (Banque).",
    "tokenUsage": {
      "prompt": 256,
      "completion": 512,
      "total": 768
    }
  }
}
```

### Get Available AI Models

Retrieves all available external AI models.

**URL:** `/external-ai/models`

**Method:** `GET`

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "adha-1",
      "name": "Adha 1",
      "description": "Modèle de base pour la comptabilité générale",
      "capabilities": ["chat", "document-analysis", "reconciliation", "journal-entry-generation"],
      "contextLength": 4096
    },
    {
      "id": "adha-fisk",
      "name": "Adha Fisk",
      "description": "Modèle spécialisé pour la fiscalité et l'audit",
      "capabilities": ["chat", "document-analysis", "reconciliation", "financial-analysis"],
      "contextLength": 8192
    },
    {
      "id": "adha-pro",
      "name": "Adha Pro",
      "description": "Modèle avancé pour toutes les opérations comptables",
      "capabilities": ["chat", "document-analysis", "reconciliation", "journal-entry-generation", "financial-analysis"],
      "contextLength": 16384
    }
  ]
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
  "error": "Invalid model ID"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "AI model not found"
}
```

**Service Unavailable (503):**
```json
{
  "success": false,
  "error": "External AI service is currently unavailable"
}
```

**Other Errors:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
