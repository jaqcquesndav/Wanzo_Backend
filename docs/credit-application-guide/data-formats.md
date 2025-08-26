# Formats de Données pour les Demandes de Crédit

Ce document détaille les structures de données requises pour la soumission des demandes de crédit et la gestion des contrats dans l'écosystème Wanzo.

## Vue d'Ensemble

Le système de crédit de Wanzo utilise :
- **API REST** pour les interactions client-serveur
- **Kafka Events** pour l'analyse automatique via Adha-AI
- **Format JSON** pour tous les échanges de données
- **UUID v4** pour tous les identifiants
- **ISO 8601** pour les dates et timestamps

## 1. Structure de la Demande de Crédit (Funding Request)

### 1.1 Données Obligatoires

```json
{
  "portfolio_id": "uuid",              // ID du portefeuille (obligatoire)
  "client_id": "uuid",                 // ID du client (obligatoire) 
  "company_name": "string",            // Nom de l'entreprise (obligatoire)
  "product_type": "string",            // Type de produit financier (obligatoire)
  "amount": 1000000.00,                // Montant demandé en nombre décimal (obligatoire)
  "duration": 12                       // Durée du prêt en entier (obligatoire)
}
```

### 1.2 Structure Complète

```json
{
  "portfolio_id": "uuid",              
  "client_id": "uuid",                 
  "company_name": "string",            
  "product_type": "string",            
  "amount": 1000000.00,                
  "currency": "XOF",                   // Devise (optionnel, par défaut "XOF")
  "purpose": "string",                 // Objet du financement (optionnel)
  "duration": 12,                      
  "duration_unit": "months",           // Unité de durée (optionnel, par défaut "months")
  "proposed_start_date": "2025-08-26", // Date de début proposée (optionnel, format ISO 8601)
  "financial_data": {                  // Données financières (optionnel mais recommandé)
    "annual_revenue": 5000000.00,      // Chiffre d'affaires annuel
    "net_profit": 1000000.00,          // Bénéfice net
    "existing_debts": 500000.00,       // Dettes existantes
    "cash_flow": 800000.00,            // Flux de trésorerie
    "assets": 10000000.00,             // Actifs totaux
    "liabilities": 3000000.00          // Passifs totaux
  },
  "proposed_guarantees": [             // Garanties proposées (optionnel)
    {
      "type": "real_estate",           // Type de garantie (voir énumérations)
      "description": "Bâtiment commercial à Dakar",
      "value": 5000000.00,             // Valeur estimée de la garantie
      "currency": "XOF"                // Devise de la garantie
    }
  ]
}
```

### 2. Énumérations et Valeurs Valides

#### 2.1 Statuts des Demandes de Crédit (FundingRequestStatus)
```typescript
enum FundingRequestStatus {
  PENDING = 'pending',           // En attente de traitement
  UNDER_REVIEW = 'under_review', // En cours d'examen
  APPROVED = 'approved',         // Approuvée
  REJECTED = 'rejected',         // Rejetée
  CANCELED = 'canceled',         // Annulée
  DISBURSED = 'disbursed'        // Fonds déboursés
}
```

#### 2.2 Unités de Durée (DurationUnit)
```typescript
enum DurationUnit {
  DAYS = 'days',       // Jours
  WEEKS = 'weeks',     // Semaines  
  MONTHS = 'months',   // Mois (par défaut)
  YEARS = 'years'      // Années
}
```

#### 2.3 Types de Garanties Acceptées
```typescript
enum GuaranteeType {
  REAL_ESTATE = 'real_estate',           // Biens immobiliers
  MOVABLE_PROPERTY = 'movable_property', // Biens mobiliers
  FINANCIAL_SECURITY = 'financial_security', // Titres financiers
  PERSONAL_GUARANTEE = 'personal_guarantee',  // Caution personnelle
  THIRD_PARTY_GUARANTEE = 'third_party_guarantee', // Garantie tierce
  CASH_COLLATERAL = 'cash_collateral',   // Garantie en espèces
  INSURANCE = 'insurance',               // Assurance
  OTHER = 'other'                        // Autre (à préciser)
}
```

#### 2.4 Devises Supportées
```typescript
enum Currency {
  XOF = 'XOF',    // Franc CFA Ouest-Africain (par défaut)
  XAF = 'XAF',    // Franc CFA Centre-Africain
  USD = 'USD',    // Dollar Américain
  EUR = 'EUR',    // Euro
  CDF = 'CDF'     // Franc Congolais
}
```

### 3. Intégration avec Adha-AI

Lorsqu'une demande est créée, le système déclenche automatiquement :

#### 3.1 Événement Kafka (Automatique)
```json
{
  "event_type": "portfolio.analysis.request",
  "timestamp": "2025-08-26T12:34:56Z",
  "data": {
    "funding_request_id": "uuid",
    "analysis_type": "credit_risk_assessment",
    "financial_data": { /* données financières */ },
    "requested_amount": 1000000.00,
    "currency": "XOF",
    "institution_id": "uuid"
  }
}
```

#### 3.2 Réponse Adha-AI (Automatique)
```json
{
  "event_type": "portfolio.analysis.response", 
  "timestamp": "2025-08-26T12:35:30Z",
  "data": {
    "funding_request_id": "uuid",
    "risk_score": 0.75,
    "recommendation": "APPROVE_WITH_CONDITIONS",
    "analysis_details": {
      "debt_to_income_ratio": 0.35,
      "cash_flow_adequacy": "GOOD",
      "collateral_coverage": 1.25
    }
  }
}
```

### Statuts d'une Demande de Crédit

Une demande de crédit peut avoir les statuts suivants :

- `pending` - En attente d'examen
- `under_review` - En cours d'examen
- `approved` - Approuvée
- `rejected` - Rejetée
- `canceled` - Annulée
- `disbursed` - Déboursée (contrat créé)

## 2. Structure du Contrat (Contract)

Lorsqu'une demande de crédit est approuvée, un contrat peut être créé avec les données suivantes :

```json
{
  "fundingRequestId": "uuid",         // ID de la demande de financement (obligatoire)
  "startDate": "2025-08-01",          // Date de début du contrat (obligatoire)
  "endDate": "2026-08-01",            // Date de fin du contrat (optionnel, calculée automatiquement si non fournie)
  "interestRate": 10.5,               // Taux d'intérêt (obligatoire)
  "interestType": "fixed",            // Type d'intérêt (optionnel, valeurs: "fixed", "variable")
  "frequency": "monthly",             // Fréquence de paiement (obligatoire, valeurs: "monthly", "quarterly", "biannual", "annual")
  "specialTerms": "string",           // Conditions spéciales (optionnel)
  "amortizationType": "constant",     // Type d'amortissement (obligatoire, valeurs: "constant", "degressive", "balloon", "bullet", "custom")
  "gracePeriod": 3,                   // Période de grâce en nombre de périodes (optionnel)
  "balloonPayment": 200000.00,        // Paiement ballon à la fin (optionnel, utilisé avec amortizationType "balloon")
  "guarantees": [                     // Garanties (optionnel, peut reprendre les garantees proposées ou les modifier)
    {
      "type": "real_estate",
      "description": "Bâtiment commercial à Dakar",
      "value": 5000000.00,
      "currency": "XOF",
      "status": "validated"           // Statut de la garantie
    }
  ]
}
```

### Statuts d'un Contrat

Un contrat peut avoir les statuts suivants :

- `draft` - Brouillon
- `active` - Actif
- `suspended` - Suspendu
- `restructured` - Restructuré
- `litigation` - En contentieux
- `defaulted` - En défaut
- `completed` - Terminé
- `canceled` - Annulé

### Types d'Amortissement

- `constant` - Amortissement constant (échéances égales)
- `degressive` - Amortissement dégressif (principal constant, intérêts variables)
- `balloon` - Amortissement avec paiement ballon à la fin
- `bullet` - Amortissement in fine (principal payé intégralement à la fin)
- `custom` - Amortissement personnalisé (nécessite un échéancier détaillé)

## 3. Structure de l'Échéancier de Paiement

L'échéancier de paiement est généré automatiquement lors de la création du contrat, mais il peut être consulté via l'API :

```json
[
  {
    "installment_number": 1,           // Numéro d'échéance
    "due_date": "2025-09-01",          // Date d'échéance
    "principal_amount": 80000.00,      // Montant en principal
    "interest_amount": 8750.00,        // Montant des intérêts
    "total_amount": 88750.00,          // Montant total
    "remaining_amount": 88750.00,      // Montant restant à payer
    "status": "pending"                // Statut de l'échéance
  },
  // ... autres échéances
]
```

### Statuts d'une Échéance

- `pending` - En attente de paiement
- `partially_paid` - Partiellement payée
- `paid` - Intégralement payée
- `late` - En retard
- `defaulted` - En défaut

## 4. Structure d'un Déboursement

```json
{
  "contract_id": "uuid",              // ID du contrat (obligatoire)
  "amount": 1000000.00,               // Montant déboursé (obligatoire)
  "disbursement_date": "2025-08-10",  // Date du déboursement (obligatoire)
  "disbursement_method": "bank_transfer", // Méthode de déboursement (obligatoire)
  "transaction_reference": "string",  // Référence de la transaction (optionnel)
  "notes": "string",                  // Notes (optionnel)
  "bank_details": {                   // Détails bancaires (optionnel)
    "bank_name": "string",
    "account_number": "string",
    "account_name": "string"
  }
}
```

## 5. Structure d'un Remboursement

```json
{
  "contract_id": "uuid",              // ID du contrat (obligatoire)
  "payment_date": "2025-09-01",       // Date du paiement (obligatoire)
  "amount": 88750.00,                 // Montant payé (obligatoire)
  "payment_method": "bank_transfer",  // Méthode de paiement (obligatoire)
  "transaction_reference": "string",  // Référence de la transaction (optionnel)
  "notes": "string",                  // Notes (optionnel)
  "allocation": [                     // Allocation du paiement (optionnel, si non fourni, allocation automatique)
    {
      "schedule_id": "uuid",          // ID de l'échéance
      "amount": 88750.00              // Montant alloué à cette échéance
    }
  ]
}
```

## Validation des Données

Toutes les données envoyées à l'API sont validées selon les règles suivantes :

1. Les champs marqués comme obligatoires doivent être présents et non nuls.
2. Les types de données doivent correspondre à ceux indiqués (string, number, array, etc.).
3. Les montants doivent être positifs.
4. Les dates doivent être au format ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SSZ).
5. Les identifiants (UUID) doivent être au format UUID v4.
