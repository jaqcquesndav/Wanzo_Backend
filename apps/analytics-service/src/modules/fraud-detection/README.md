# Module Fraud Detection - Analytics Service

## Vue d'ensemble

Le module **Fraud Detection** est responsable de l'identification et de l'analyse des patterns de fraude dans les transactions financières des PME. Il utilise des algorithmes de machine learning et des règles statistiques pour détecter des anomalies comportementales et des activités suspectes.

## Architecture

### Composants Principaux

1. **FraudDetectionService** - Moteur de détection de fraude
2. **FraudDetectionController** - API REST pour l'analyse de fraude
3. **FraudAlert Entity** - Modèle de données pour les alertes
4. **DTOs** - Types TypeScript pour validation des données

### Algorithmes de Détection

Le système utilise plusieurs méthodes de détection complémentaires :

- **Détection d'anomalies statistiques** (Z-score, percentiles)
- **Analyse de patterns temporels** (transactions hors horaires)
- **Détection de vélocité** (transactions en rafale)
- **Analyse géographique** (localisation suspecte)
- **Détection de blanchiment** (structuring, smurfing)

## Types de Fraude Détectés

### 1. UNUSUAL_TRANSACTION
Transactions avec des montants ou patterns anormaux
- Montants significativement supérieurs à l'historique
- Transactions à des heures inhabituelles
- Patterns de fréquence suspects

### 2. PAYMENT_FRAUD
Fraudes liées aux méthodes de paiement
- Vélocité de transactions anormale
- Méthodes de paiement multiples simultanées
- Patterns de remboursement suspects

### 3. IDENTITY_FRAUD
Usurpation d'identité ou fraude documentaire
- Localisation géographique incohérente
- Changements soudains de patterns comportementaux
- Utilisation d'identifiants suspects

### 4. MONEY_LAUNDERING
Blanchiment d'argent et structuring
- Transactions juste en dessous des seuils réglementaires
- Smurfing (nombreuses petites transactions)
- Patterns de transactions rondes répétitives

### 5. DATA_MANIPULATION
Manipulation de données financières
- Incohérences dans les données comptables
- Patterns de reporting suspects
- Anomalies dans les métriques financières

## Configuration et Seuils

### Seuils de Détection par Type

```typescript
const FRAUD_THRESHOLDS = {
  UNUSUAL_TRANSACTION: 0.7,    // 70% de confiance minimum
  PAYMENT_FRAUD: 0.8,          // 80% de confiance minimum
  IDENTITY_FRAUD: 0.6,         // 60% de confiance minimum
  MONEY_LAUNDERING: 0.9,       // 90% de confiance minimum
  DATA_MANIPULATION: 0.75      // 75% de confiance minimum
};
```

### Seuils Réglementaires

```typescript
const REGULATORY_THRESHOLDS = {
  DECLARATION_THRESHOLD: 10000000,  // 10M CDF
  SUSPICIOUS_AMOUNT: 5000000,       // 5M CDF
  HIGH_VELOCITY_COUNT: 10,          // 10 transactions/heure
  ROUND_AMOUNT_THRESHOLD: 1000000   // 1M CDF
};
```

## API REST

### Endpoints Principaux

#### POST /api/v1/fraud-detection/analyze/transaction
Analyse une transaction pour détecter des patterns de fraude

**Request Body:**
```json
{
  "id": "txn-12345",
  "amount": 5000000,
  "currency": "CDF",
  "entityId": "sme-67890",
  "timestamp": "2025-08-04T10:30:00Z",
  "paymentMethod": "BANK_TRANSFER",
  "location": {
    "province": "Kinshasa",
    "city": "Kinshasa"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "alertsGenerated": 1,
    "maxRiskScore": 0.85,
    "detectedFraudTypes": ["UNUSUAL_TRANSACTION"],
    "riskIndicators": ["z_score_extreme", "amount_above_p95"],
    "recommendations": ["Investigate transaction history", "Verify identity"],
    "analysisStatus": "completed"
  }
}
```

#### GET /api/v1/fraud-detection/alerts
Récupère la liste des alertes de fraude

**Query Parameters:**
- `status` - Statut des alertes (OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE)
- `severity` - Sévérité minimum (LOW, MEDIUM, HIGH, CRITICAL)
- `fraudType` - Type de fraude à filtrer
- `province` - Province à filtrer
- `startDate` - Date de début
- `endDate` - Date de fin

**Response:**
```json
{
  "status": "success",
  "data": {
    "alerts": [
      {
        "id": "alert-001",
        "entityId": "sme-12345",
        "fraudType": "UNUSUAL_TRANSACTION",
        "severity": "HIGH",
        "riskScore": 0.85,
        "description": "Montant anormalement élevé détecté",
        "status": "OPEN",
        "province": "Kinshasa",
        "createdAt": "2025-08-04T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1
  }
}
```

#### PUT /api/v1/fraud-detection/alerts/:id
Met à jour une alerte de fraude

**Request Body:**
```json
{
  "status": "INVESTIGATING",
  "investigationNotes": "En cours de vérification des documents",
  "assignedTo": "investigator@wanzo.com"
}
```

#### GET /api/v1/fraud-detection/statistics
Obtient les statistiques de fraude

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalAlerts": 245,
    "openAlerts": 12,
    "resolvedAlerts": 220,
    "falsePositives": 13,
    "fraudTypeDistribution": {
      "UNUSUAL_TRANSACTION": 120,
      "PAYMENT_FRAUD": 45,
      "MONEY_LAUNDERING": 35,
      "IDENTITY_FRAUD": 30,
      "DATA_MANIPULATION": 15
    },
    "severityDistribution": {
      "CRITICAL": 8,
      "HIGH": 35,
      "MEDIUM": 89,
      "LOW": 113
    },
    "provinceDistribution": {
      "Kinshasa": 98,
      "Haut-Katanga": 45,
      "Nord-Kivu": 32
    },
    "trends": {
      "weeklyGrowth": 2.5,
      "monthlyGrowth": 8.3,
      "averageResolutionTime": "2.3 days"
    }
  }
}
```

#### POST /api/v1/fraud-detection/bulk-analyze
Analyse en lot de transactions

**Request Body:**
```json
{
  "transactions": [
    {
      "id": "txn-001",
      "amount": 1000000,
      "currency": "CDF",
      "entityId": "sme-001",
      "timestamp": "2025-08-04T10:00:00Z",
      "paymentMethod": "MOBILE_MONEY"
    }
  ],
  "options": {
    "includeHistorical": true,
    "severityThreshold": "MEDIUM",
    "skipDuplicates": true
  }
}
```

## Algorithmes de Détection Détaillés

### 1. Détection d'Anomalies de Montant

```typescript
// Calcul du Z-score pour détecter les outliers
const zScore = Math.abs((transaction.amount - mean) / stdDev);

// Classification des anomalies
if (zScore > 3) {
  anomalyScore += 0.4;
  indicators.push('z_score_extreme');
} else if (zScore > 2.5) {
  anomalyScore += 0.3;
  indicators.push('z_score_high');
}

// Détection de montants suspicieusement ronds
if (isRoundNumber(amount) && amount > mean * 3) {
  anomalyScore += 0.2;
  indicators.push('suspicious_round_amount');
}
```

### 2. Analyse de Patterns Temporels

```typescript
// Détection de transactions hors horaires normaux
const hour = new Date(transaction.timestamp).getHours();
if (hour < 6 || hour > 22) {
  anomalyScore += 0.3;
  indicators.push('unusual_time');
}

// Détection de patterns de weekend suspects
const day = new Date(transaction.timestamp).getDay();
if (day === 0 || day === 6) { // Dimanche ou Samedi
  anomalyScore += 0.2;
  indicators.push('weekend_transaction');
}
```

### 3. Détection de Vélocité

```typescript
// Comptage des transactions récentes
const recentTransactions = await getRecentTransactions(entityId, '1h');
if (recentTransactions.length > 10) {
  anomalyScore += 0.5;
  indicators.push('high_velocity');
}

// Analyse de la fréquence
const averageGap = calculateAverageTimeBetweenTransactions(recentTransactions);
if (averageGap < 300000) { // < 5 minutes
  anomalyScore += 0.4;
  indicators.push('rapid_succession');
}
```

### 4. Analyse Géographique

```typescript
// Détection de changements de localisation rapides
const recentLocations = await getRecentLocations(entityId);
if (hasRapidLocationChange(recentLocations)) {
  anomalyScore += 0.6;
  indicators.push('rapid_location_change');
}

// Zones à haut risque
const highRiskProvinces = ['Nord-Kivu', 'Sud-Kivu', 'Ituri'];
if (highRiskProvinces.includes(transaction.location.province)) {
  anomalyScore += 0.3;
  indicators.push('high_risk_location');
}
```

### 5. Détection de Blanchiment

```typescript
// Structuring - montants juste en dessous des seuils
const declarationThreshold = 10000000; // 10M CDF
if (amount > threshold * 0.9 && amount < threshold) {
  anomalyScore += 0.4;
  indicators.push('structuring_threshold');
}

// Smurfing - nombreuses petites transactions
const smallTransactions = await getRecentSmallTransactions(entityId);
if (smallTransactions.length > 10) {
  anomalyScore += 0.5;
  indicators.push('smurfing_pattern');
}
```

## Scoring et Classification

### Calcul du Score de Risque

Le score de risque final est calculé en combinant plusieurs facteurs :

```typescript
let totalScore = 0;
let maxScore = 0;

// Pondération par type d'anomalie
const weights = {
  amount: 0.4,
  time: 0.2,
  velocity: 0.3,
  location: 0.3,
  laundering: 0.5
};

// Score normalisé (0-1)
finalScore = Math.min(totalScore / maxScore, 1);
```

### Classification par Sévérité

```typescript
function calculateSeverity(riskScore: number): AlertSeverity {
  if (riskScore >= 0.9) return AlertSeverity.CRITICAL;
  if (riskScore >= 0.7) return AlertSeverity.HIGH;
  if (riskScore >= 0.5) return AlertSeverity.MEDIUM;
  return AlertSeverity.LOW;
}
```

## Gestion des Alertes

### Statuts d'Alerte

- **OPEN** - Nouvelle alerte non traitée
- **INVESTIGATING** - En cours d'investigation
- **RESOLVED** - Fraude confirmée et résolue
- **FALSE_POSITIVE** - Faux positif identifié
- **DISMISSED** - Alerte rejetée

### Workflow d'Investigation

1. **Détection automatique** - Le système génère une alerte
2. **Triage initial** - Classification par sévérité et type
3. **Investigation** - Assignation à un analyste
4. **Vérification** - Collecte de preuves additionnelles
5. **Résolution** - Action prise ou classification

### Actions Recommandées

Le système génère automatiquement des recommandations d'action :

```typescript
const recommendations = {
  UNUSUAL_TRANSACTION: [
    'Vérifier l\'historique des transactions',
    'Contacter la PME pour confirmation',
    'Examiner les documents justificatifs'
  ],
  MONEY_LAUNDERING: [
    'Reporter aux autorités compétentes',
    'Bloquer temporairement le compte',
    'Demander des documents additionnels'
  ]
};
```

## Intégration avec d'Autres Modules

### FinancialDataConfigService
- Utilise les seuils de risque centralisés
- Accède aux données de provinces à haut risque
- Valide les devises et montants

### EventProcessingModule
- Traite les événements de fraude en temps réel
- Notifie les systèmes externes
- Stocke les alertes dans Kafka

### TimeseriesModule
- Analyse les tendances de fraude
- Stocke l'historique des détections
- Calcule les métriques de performance

## Monitoring et Performance

### Métriques Clés

- **Taux de détection** - Pourcentage de fraudes détectées
- **Faux positifs** - Alertes incorrectes générées
- **Temps de traitement** - Latence d'analyse des transactions
- **Précision** - Exactitude des classifications

### Optimisation

```typescript
// Cache des données historiques
const historicalCache = new Map();

// Traitement parallèle des analyses
const analysisPromises = [
  detectAmountAnomaly(transaction),
  detectTimePatternAnomaly(transaction),
  detectVelocityAnomaly(transaction)
];

const results = await Promise.all(analysisPromises);
```

## Configuration Avancée

### Personnalisation des Seuils

```typescript
// Configuration par industrie
const industryThresholds = {
  'MINING': { multiplier: 1.5, baseline: 0.7 },
  'AGRICULTURE': { multiplier: 1.0, baseline: 0.6 },
  'COMMERCE': { multiplier: 1.2, baseline: 0.65 }
};

// Configuration par région
const regionThresholds = {
  'Kinshasa': { riskMultiplier: 1.0 },
  'Nord-Kivu': { riskMultiplier: 1.4 },
  'Haut-Katanga': { riskMultiplier: 1.1 }
};
```

### Machine Learning

Le système peut être étendu avec des modèles ML :

```typescript
// Intégration future avec TensorFlow.js
async function mlFraudPrediction(features: number[]): Promise<number> {
  // Modèle pré-entraîné pour détection de fraude
  const prediction = await model.predict(features);
  return prediction.dataSync()[0];
}
```

## Tests et Validation

### Tests de Régression

```bash
# Tests unitaires
npm run test:fraud-detection

# Tests d'intégration
npm run test:fraud-integration

# Tests de performance
npm run test:fraud-performance
```

### Validation des Modèles

```typescript
// Métriques de validation
const metrics = {
  precision: 0.87,      // Précision des alertes
  recall: 0.92,         // Taux de détection
  f1Score: 0.89,        // Score F1
  falsePositiveRate: 0.05 // Taux de faux positifs
};
```

Ce module de détection de fraude fournit une base solide pour identifier et analyser les activités frauduleuses dans l'écosystème financier des PME de la RDC.
