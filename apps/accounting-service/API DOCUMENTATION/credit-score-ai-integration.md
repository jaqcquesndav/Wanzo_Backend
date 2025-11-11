# Modules d'Intégration - Credit Score et IA Externe

Cette documentation décrit les modules d'intégration pour le scoring de crédit et les fonctionnalités d'IA externe du service accounting.

## Credit Score Module

### Vue d'ensemble

Le module `CreditScoreModule` calcule et maintient les scores de crédit des entreprises basés sur leurs données comptables et financières.

### Fonctionnalités

#### 1. Calcul du Score de Crédit
- **Analyse des ratios financiers**
- **Évaluation de la trésorerie**
- **Historique des paiements**
- **Stabilité des revenus**

#### 2. Rating Financier
- **Échelle de notation**: AAA, AA+, AA, AA-, A+, A, A-, BBB+, BBB, BBB-, BB+, BB, BB-, B+, B, B-, CCC, CC, C, D
- **Mise à jour automatique** basée sur les nouvelles données
- **Historique des changements** de rating

### API Endpoints

#### Get Credit Score
**URL:** `/dashboard/key-performance-indicators`
**Method:** `GET`
**Response:**
```json
{
  "success": true,
  "data": {
    "creditScore": 750,
    "financialRating": "AA-",
    "lastUpdated": "2024-03-15T10:30:00Z",
    "trend": "stable", // "improving" | "stable" | "declining"
    "factors": {
      "liquidityRatio": 1.8,
      "profitabilityRatio": 0.15,
      "debtToEquityRatio": 0.45,
      "cashFlowStability": 0.85
    }
  }
}
```

#### Get Credit Score History
**URL:** `/credit-score/history`
**Method:** `GET`
**Query Parameters:**
- `startDate` (optional) - Start date for history
- `endDate` (optional) - End date for history

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "score": 720,
      "rating": "A+",
      "factors": {
        "liquidityRatio": 1.6,
        "profitabilityRatio": 0.12,
        "debtToEquityRatio": 0.5,
        "cashFlowStability": 0.8
      }
    },
    {
      "date": "2024-03-01",
      "score": 750,
      "rating": "AA-",
      "factors": {
        "liquidityRatio": 1.8,
        "profitabilityRatio": 0.15,
        "debtToEquityRatio": 0.45,
        "cashFlowStability": 0.85
      }
    }
  ]
}
```

### Algorithme de Calcul

#### Facteurs de Scoring (Pondération)
- **Ratio de Liquidité** (25%): Current Assets / Current Liabilities
- **Rentabilité** (30%): Net Income / Total Revenue
- **Endettement** (20%): Total Debt / Total Equity
- **Stabilité des Cash-flows** (15%): Coefficient de variation des cash-flows
- **Historique de Paiement** (10%): Retards et incidents de paiement

#### Calcul du Score
```typescript
interface CreditScoreFactors {
  liquidityRatio: number;    // Ratio de liquidité
  profitabilityRatio: number; // Ratio de rentabilité
  debtToEquityRatio: number;   // Ratio d'endettement
  cashFlowStability: number;   // Stabilité des flux de trésorerie
  paymentHistory: number;      // Historique de paiement
}

function calculateCreditScore(factors: CreditScoreFactors): number {
  const weightedScore = 
    (factors.liquidityRatio * 0.25) +
    (factors.profitabilityRatio * 0.30) +
    ((1 - factors.debtToEquityRatio) * 0.20) +
    (factors.cashFlowStability * 0.15) +
    (factors.paymentHistory * 0.10);
    
  return Math.min(850, Math.max(300, Math.round(weightedScore * 850)));
}
```

---

## External AI Module (ADHA)

### Vue d'ensemble

Le module `ExternalAIModule` intègre les services d'intelligence artificielle ADHA pour l'automatisation comptable et l'analyse financière.

### Fonctionnalités

#### 1. Génération Automatique d'Écritures
- **Analyse de documents** (factures, reçus, relevés)
- **Reconnaissance OCR** et extraction de données
- **Génération d'écritures comptables** selon les règles SYSCOHADA
- **Validation automatique** des équilibres débit/crédit

#### 2. Analyse Financière Intelligente
- **Détection d'anomalies** dans les écritures
- **Suggestions d'optimisation** fiscale
- **Analyse prédictive** des cash-flows
- **Recommandations** de gestion financière

#### 3. Assistant Comptable Virtuel
- **Réponses aux questions** comptables
- **Guidance** pour les déclarations fiscales
- **Explications** des ratios financiers
- **Formation** aux bonnes pratiques

### API Endpoints

#### Generate Automated Journal Entries
**URL:** `/journal-entries/automated`
**Method:** `POST`
**Authentication:** Required + `RequireAutomatedAccounting(1)`

**Request Body:**
```json
{
  "documentType": "invoice", // "invoice" | "receipt" | "bank_statement"
  "documentData": {
    "base64Content": "base64_encoded_document",
    "filename": "facture_001.pdf",
    "mimeType": "application/pdf"
  },
  "analysisOptions": {
    "autoValidate": false,
    "confidenceThreshold": 0.8,
    "ruleset": "SYSCOHADA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "ai-analysis-123",
    "confidence": 0.95,
    "suggestedEntries": [
      {
        "id": "suggested-entry-1",
        "date": "2024-03-15",
        "journalType": "purchases",
        "description": "Achat fournitures bureau - Facture FOURN-001",
        "reference": "FOURN-001",
        "lines": [
          {
            "accountCode": "605000",
            "accountName": "Autres achats",
            "debit": 120000,
            "credit": 0,
            "description": "Fournitures de bureau",
            "confidence": 0.96
          },
          {
            "accountCode": "445610",
            "accountName": "TVA récupérable sur achats",
            "debit": 19200,
            "credit": 0,
            "description": "TVA sur fournitures 16%",
            "confidence": 0.94
          },
          {
            "accountCode": "401000",
            "accountName": "Fournisseurs",
            "debit": 0,
            "credit": 139200,
            "description": "Fournisseur ABC SARL",
            "confidence": 0.98
          }
        ],
        "totalDebit": 139200,
        "totalCredit": 139200,
        "status": "suggested",
        "validationRequired": true
      }
    ],
    "extractedData": {
      "supplierName": "ABC SARL",
      "invoiceNumber": "FOURN-001",
      "invoiceDate": "2024-03-15",
      "totalAmount": 139200,
      "vatAmount": 19200,
      "items": [
        {
          "description": "Fournitures de bureau",
          "quantity": 1,
          "unitPrice": 120000,
          "totalPrice": 120000
        }
      ]
    }
  }
}
```

#### Get AI Analysis Status
**URL:** `/ai/analysis/:analysisId`
**Method:** `GET`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ai-analysis-123",
    "status": "completed", // "processing" | "completed" | "failed"
    "progress": 100,
    "startedAt": "2024-03-15T10:00:00Z",
    "completedAt": "2024-03-15T10:02:30Z",
    "processingTime": 150000, // milliseconds
    "confidence": 0.95,
    "errors": []
  }
}
```

#### Ask AI Assistant
**URL:** `/ai/assistant/ask`
**Method:** `POST`

**Request Body:**
```json
{
  "question": "Comment comptabiliser un achat de matériel informatique en SYSCOHADA ?",
  "context": {
    "companyType": "SARL",
    "accountingStandard": "SYSCOHADA",
    "fiscalYear": "2024"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Pour comptabiliser un achat de matériel informatique en SYSCOHADA, vous devez utiliser le compte 244 'Matériel informatique' au débit et le compte 481 'Fournisseurs d'investissement' au crédit. Si l'achat inclut de la TVA récupérable, débiter également le compte 445610.",
    "suggestedAccounts": [
      {
        "code": "244000",
        "name": "Matériel informatique",
        "type": "asset"
      },
      {
        "code": "481000", 
        "name": "Fournisseurs d'investissement",
        "type": "liability"
      }
    ],
    "relatedDocuments": [
      "Plan comptable SYSCOHADA - Classe 2",
      "Guide des immobilisations"
    ],
    "confidence": 0.92
  }
}
```

### Configuration du Service ADHA

#### Variables d'Environnement
```env
ADHA_API_URL=https://api.adha.ai/v1
ADHA_API_KEY=your_api_key_here
ADHA_TIMEOUT=30000
ADHA_MAX_RETRIES=3
ADHA_CONFIDENCE_THRESHOLD=0.8
```

#### Paramètres de Sécurité
- **Chiffrement** des documents envoyés
- **Audit trail** de toutes les interactions
- **Rate limiting** pour éviter les abus
- **Validation** des réponses IA avant application

### Monitoring et Métriques

#### Métriques Collectées
- **Temps de réponse** des appels API ADHA
- **Taux de succès** des analyses
- **Niveau de confiance** moyen des suggestions
- **Taux d'acceptation** des écritures suggérées

#### Logs Structurés
```typescript
{
  timestamp: "2024-03-15T10:30:00Z",
  level: "info",
  service: "external-ai",
  action: "document_analysis",
  analysisId: "ai-analysis-123",
  confidence: 0.95,
  processingTime: 150000,
  documentType: "invoice",
  success: true
}
```

### Gestion des Erreurs

#### Types d'Erreurs
- **Timeout**: Service ADHA indisponible
- **Low Confidence**: Niveau de confiance insuffisant
- **Parse Error**: Document illisible ou corrompu
- **Validation Error**: Écritures déséquilibrées

#### Stratégies de Fallback
- **Retry automatique** avec backoff exponentiel
- **Mode dégradé** avec suggestions simplifiées
- **Notification utilisateur** pour validation manuelle
- **Fallback vers règles** comptables standard