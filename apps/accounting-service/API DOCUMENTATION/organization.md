# Organisation (Entreprise) API Documentation

Ce document décrit les endpoints API pour la gestion de l'organisation (entreprise) dans l'application Wanzo Compta.

## URL de Base

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentification

Tous les endpoints nécessitent une authentification avec un token Bearer.

**Headers:**
```
Authorization: Bearer <token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
```

## Endpoints

### Obtenir les Informations de l'Organisation

Récupère les informations de l'organisation connectée.

**URL:** `/organization`

**Méthode:** `GET`

**Authentification Requise:** Oui

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "org-123",
    "name": "ZERO PANNE",
    "entrepreneurName": "KAKULE NDAVARO Jacques",
    "associates": "Nick AZARIA MICHAEL, MWANABUTE SHAULA Christian, KATEMBO KANIKI Joseph, Prosper LOBOBO OMEKANDA",
    "registrationNumber": "CD/GOM/RCCM/22-B-00008",
    "taxId": "4876",
    "cnssNumber": "",
    "inppNumber": "",
    "onemNumber": "",
    "address": "",
    "city": "GOMA",
    "country": "RD Congo",
    "phone": "",
    "entrepreneurPhone": "243-972-252-499",
    "email": "info@zeropanne.com",
    "entrepreneurEmail": "jacques@zeropanne.com",
    "website": "https://zeropanne.com",
    "legalForm": "SARL",
    "capital": "10000 USD",
    "currency": "USD",
    "logo": "https://example.com/logos/zeropanne.png",
    "industry": "Services informatiques",
    "description": "Réparation et maintenance informatique"
  }
}
```

### Mettre à Jour les Informations de l'Organisation

Met à jour les informations de l'organisation connectée.

**URL:** `/organization`

**Méthode:** `PUT`

**Authentification Requise:** Oui

**Headers:**
```
Authorization: Bearer <token>
```

**Corps de la Requête:**

```json
{
  "name": "ZERO PANNE TECHNOLOGIES",
  "entrepreneurPhone": "243-972-252-500",
  "email": "contact@zeropanne.com",
  "address": "123 Avenue du Commerce",
  "description": "Réparation, maintenance informatique et services cloud"
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "org-123",
    "name": "ZERO PANNE TECHNOLOGIES",
    "entrepreneurName": "KAKULE NDAVARO Jacques",
    "associates": "Nick AZARIA MICHAEL, MWANABUTE SHAULA Christian, KATEMBO KANIKI Joseph, Prosper LOBOBO OMEKANDA",
    "registrationNumber": "CD/GOM/RCCM/22-B-00008",
    "taxId": "4876",
    "cnssNumber": "",
    "inppNumber": "",
    "onemNumber": "",
    "address": "123 Avenue du Commerce",
    "city": "GOMA",
    "country": "RD Congo",
    "phone": "",
    "entrepreneurPhone": "243-972-252-500",
    "email": "contact@zeropanne.com",
    "entrepreneurEmail": "jacques@zeropanne.com",
    "website": "https://zeropanne.com",
    "legalForm": "SARL",
    "capital": "10000 USD",
    "currency": "USD",
    "logo": "https://example.com/logos/zeropanne.png",
    "industry": "Services informatiques",
    "description": "Réparation, maintenance informatique et services cloud"
  }
}
```

### Mettre à Jour le Logo de l'Organisation

Met à jour le logo de l'organisation.

**URL:** `/organization/logo`

**Méthode:** `POST`

**Authentification Requise:** Oui

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Corps de la Requête:**
Form data avec le fichier du logo

**Réponse:**

```json
{
  "success": true,
  "data": {
    "logo": "https://example.com/logos/zeropanne-new.png"
  }
}
```

### Obtenir les Paramètres Fiscaux de l'Organisation

Récupère les paramètres fiscaux de l'organisation.

**URL:** `/organization/fiscal-settings`

**Méthode:** `GET`

**Authentification Requise:** Oui

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "vatRegistered": true,
    "vatNumber": "12345VAT",
    "vatRate": 16,
    "taxPaymentFrequency": "monthly",
    "fiscalYearStart": {
      "month": 1,
      "day": 1
    },
    "taxationSystem": "normal"
  }
}
```

### Mettre à Jour les Paramètres Fiscaux de l'Organisation

Met à jour les paramètres fiscaux de l'organisation.

**URL:** `/organization/fiscal-settings`

**Méthode:** `PUT`

**Authentification Requise:** Oui

**Headers:**
```
Authorization: Bearer <token>
```

**Corps de la Requête:**

```json
{
  "vatRegistered": true,
  "vatNumber": "12345VAT",
  "vatRate": 16,
  "taxPaymentFrequency": "monthly",
  "fiscalYearStart": {
    "month": 1,
    "day": 1
  },
  "taxationSystem": "normal"
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "vatRegistered": true,
    "vatNumber": "12345VAT",
    "vatRate": 16,
    "taxPaymentFrequency": "monthly",
    "fiscalYearStart": {
      "month": 1,
      "day": 1
    },
    "taxationSystem": "normal"
  }
}
```

### Obtenir les Coordonnées Bancaires de l'Organisation

Récupère les coordonnées bancaires de l'organisation.

**URL:** `/organization/bank-details`

**Méthode:** `GET`

**Authentification Requise:** Oui

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse:**

```json
{
  "success": true,
  "data": [
    {
      "id": "bank-1",
      "bankName": "Equity Bank",
      "accountNumber": "1234567890",
      "iban": "",
      "swift": "EQBLCDKI",
      "currency": "USD",
      "isPrimary": true
    },
    {
      "id": "bank-2",
      "bankName": "Rawbank",
      "accountNumber": "0987654321",
      "iban": "",
      "swift": "RAWBCDKI",
      "currency": "CDF",
      "isPrimary": false
    }
  ]
}
```

### Ajouter des Coordonnées Bancaires

Ajoute de nouvelles coordonnées bancaires pour l'organisation.

**URL:** `/organization/bank-details`

**Méthode:** `POST`

**Authentification Requise:** Oui

**Headers:**
```
Authorization: Bearer <token>
```

**Corps de la Requête:**

```json
{
  "bankName": "BCDC",
  "accountNumber": "5555666677",
  "iban": "",
  "swift": "BCDCCDKI",
  "currency": "EUR",
  "isPrimary": false
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "bank-3",
    "bankName": "BCDC",
    "accountNumber": "5555666677",
    "iban": "",
    "swift": "BCDCCDKI",
    "currency": "EUR",
    "isPrimary": false
  }
}
```

### Mettre à Jour des Coordonnées Bancaires

Met à jour les coordonnées bancaires existantes.

**URL:** `/organization/bank-details/:id`

**Méthode:** `PUT`

**Authentification Requise:** Oui

**Headers:**
```
Authorization: Bearer <token>
```

**Paramètres URL:**
- `id` - ID des coordonnées bancaires à mettre à jour

**Corps de la Requête:**

```json
{
  "accountNumber": "5555666699",
  "isPrimary": true
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "bank-3",
    "bankName": "BCDC",
    "accountNumber": "5555666699",
    "iban": "",
    "swift": "BCDCCDKI",
    "currency": "EUR",
    "isPrimary": true
  }
}
```

### Supprimer des Coordonnées Bancaires

Supprime des coordonnées bancaires existantes.

**URL:** `/organization/bank-details/:id`

**Méthode:** `DELETE`

**Authentification Requise:** Oui

**Headers:**
```
Authorization: Bearer <token>
```

**Paramètres URL:**
- `id` - ID des coordonnées bancaires à supprimer

**Réponse:**

```json
{
  "success": true,
  "message": "Bank details successfully deleted"
}
```

## Erreurs Possibles

**400 Bad Request**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid organization data",
  "details": [
    "Name is required",
    "Email must be a valid email address"
  ]
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions to update organization details"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Bank details not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Structures de Données

### Organisation

```typescript
interface Organization {
  id: string;
  name: string;                     // Nom de l'entreprise
  entrepreneurName: string;         // Nom de l'entrepreneur
  associates?: string;              // Autres associés
  registrationNumber: string;       // RCCM
  taxId: string;                    // Numéro impôt
  cnssNumber?: string;              // Numéro affiliation CNSS
  inppNumber?: string;              // Numéro affiliation INPP
  onemNumber?: string;              // Numéro affiliation ONEM
  address: string;
  city: string;
  country: string;
  phone: string;                    // Téléphone entreprise
  entrepreneurPhone?: string;       // Téléphone entrepreneur
  email: string;                    // Email entreprise
  entrepreneurEmail?: string;       // Email entrepreneur
  website: string;
  legalForm: string;
  capital: string;
  currency: string;                 // Code de devise (USD, CDF, etc.)
  logo?: string;
  industry?: string;                // Secteur d'activité
  description?: string;
}
```

### Paramètres Fiscaux

```typescript
interface FiscalSettings {
  vatRegistered: boolean;            // Assujetti à la TVA
  vatNumber?: string;                // Numéro de TVA
  vatRate: number;                   // Taux de TVA (%)
  taxPaymentFrequency: string;       // Fréquence de paiement des impôts
  fiscalYearStart: {                 // Début de l'année fiscale
    month: number;                   // Mois (1-12)
    day: number;                     // Jour (1-31)
  };
  taxationSystem: string;            // Système d'imposition
}
```

### Coordonnées Bancaires

```typescript
interface BankDetails {
  id: string;
  bankName: string;                 // Nom de la banque
  accountNumber: string;            // Numéro de compte
  iban?: string;                    // IBAN
  swift?: string;                   // Code SWIFT/BIC
  currency: string;                 // Devise du compte
  isPrimary: boolean;               // Compte principal
}
```
