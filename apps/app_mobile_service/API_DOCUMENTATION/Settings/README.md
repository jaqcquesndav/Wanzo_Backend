# API Paramètres

Cette documentation détaille les endpoints disponibles pour la gestion des paramètres dans l'application Wanzo, y compris les comptes financiers qui font partie des paramètres de l'application.

## Paramètres Généraux

### Structure du modèle Paramètres

```json
{
  "id": "string",                      // Identifiant unique des paramètres
  "companyName": "string",             // Nom de l'entreprise
  "companyAddress": "string",          // Adresse de l'entreprise
  "companyPhone": "string",            // Numéro de téléphone de l'entreprise
  "companyEmail": "string",            // Email de l'entreprise
  "companyLogo": "string",             // URL du logo de l'entreprise
  "taxIdentificationNumber": "string", // Numéro d'identification fiscale
  "rccmNumber": "string",              // Numéro RCCM
  "idNatNumber": "string",             // Numéro d'identification nationale
  "dateFormat": "string",              // Format de date préféré
  "themeMode": "light",                // Mode thème (light, dark, system)
  "language": "fr",                    // Langue préférée
  "showTaxes": true,                   // Afficher les taxes sur les factures
  "defaultTaxRate": 16.0,              // Taux de taxe par défaut en pourcentage
  "invoiceNumberFormat": "string",     // Format de numéro de facture
  "invoicePrefix": "string",           // Préfixe pour les numéros de facture
  "defaultPaymentTerms": "string",     // Conditions de paiement par défaut
  "defaultInvoiceNotes": "string",     // Notes par défaut à afficher sur les factures
  "defaultProductCategory": "string",  // Catégorie de stock par défaut
  "lowStockAlertDays": 7,              // Nombre de jours pour les alertes de stock bas
  "backupEnabled": true,               // Options de sauvegarde activées
  "backupFrequency": 7,                // Fréquence de sauvegarde automatique en jours
  "reportEmail": "string",             // Email pour les rapports automatiques
  "updatedAt": "2023-08-01T12:30:00.000Z" // Date de dernière mise à jour
}
```

## Endpoints pour les Paramètres Généraux

### 1. Récupérer les paramètres actuels

**Endpoint**: `GET /api/v1/settings`

**Description**: Récupère les paramètres actuels de l'utilisateur.

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    // Détails du modèle Paramètres
  }
}
```

### 2. Mettre à jour les paramètres

**Endpoint**: `PUT /api/v1/settings`

**Description**: Met à jour les paramètres de l'utilisateur.

**Corps de la requête**:
```json
{
  "companyName": "string",
  "companyAddress": "string",
  // Autres champs à mettre à jour
}
```

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "message": "Paramètres mis à jour avec succès",
    // Détails mis à jour du modèle Paramètres
  }
}
```

## Comptes Financiers

Les comptes financiers font partie du module de paramètres dans l'application.

### Types de Comptes Financiers

Les types de comptes financiers sont représentés par des chaînes de caractères:

- `bankAccount` - Compte bancaire
- `mobileMoney` - Mobile Money

### Fournisseurs de Mobile Money

Les fournisseurs de Mobile Money sont représentés par des chaînes de caractères:

- `airtelMoney` - Airtel Money
- `orangeMoney` - Orange Money
- `mpesa` - M-PESA

### Structure du modèle Compte Financier

```json
{
  "id": "string",                      // Identifiant unique du compte
  "type": "bankAccount",               // Type de compte (voir liste ci-dessus)
  "accountName": "string",             // Nom personnalisé du compte
  "isDefault": false,                  // Indique si c'est le compte par défaut
  "createdAt": "2023-08-01T12:30:00.000Z", // Date de création
  "updatedAt": "2023-08-01T12:30:00.000Z", // Date de mise à jour
  
  // Champs spécifiques aux comptes bancaires
  "bankInstitution": {                 // Objet d'institution financière (pour les comptes bancaires)
    "id": "string",
    "name": "string",
    "code": "string"
  },
  "bankAccountNumber": "string",       // Numéro de compte bancaire (pour les comptes bancaires)
  "swiftCode": "string",               // Code SWIFT (pour les comptes bancaires)
  
  // Champs spécifiques au Mobile Money
  "mobileMoneyProvider": "airtelMoney", // Fournisseur de Mobile Money (voir liste ci-dessus)
  "phoneNumber": "string",             // Numéro de téléphone du compte Mobile Money
  "accountHolderName": "string"        // Nom du titulaire du compte Mobile Money
}
```

## Endpoints pour les Comptes Financiers

### 1. Récupérer tous les comptes financiers

**Endpoint**: `GET /api/v1/settings/financial-accounts`

**Description**: Récupère la liste de tous les comptes financiers de l'utilisateur.

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "items": [
      // Liste des objets de compte financier
    ]
  }
}
```

### 2. Récupérer un compte financier spécifique

**Endpoint**: `GET /api/v1/settings/financial-accounts/{id}`

**Description**: Récupère les détails d'un compte financier spécifique.

**Paramètres de chemin (Path Params)**:
- `id`: L'identifiant unique du compte financier

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    // Détails du modèle Compte Financier
  }
}
```

### 3. Créer un nouveau compte financier

**Endpoint**: `POST /api/v1/settings/financial-accounts`

**Description**: Crée un nouveau compte financier.

**Corps de la requête**:
```json
{
  "type": "bankAccount",
  "accountName": "string",
  "isDefault": false,
  
  // Pour les comptes bancaires
  "bankInstitution": {
    "id": "string"
  },
  "bankAccountNumber": "string",
  "swiftCode": "string",
  
  // Pour Mobile Money
  "mobileMoneyProvider": "airtelMoney",
  "phoneNumber": "string",
  "accountHolderName": "string"
}
```

**Réponse réussie (201)**:
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "message": "Compte financier créé avec succès",
    // Autres détails du modèle Compte Financier
  }
}
```

### 4. Mettre à jour un compte financier

**Endpoint**: `PUT /api/v1/settings/financial-accounts/{id}`

**Description**: Met à jour un compte financier existant.

**Paramètres de chemin (Path Params)**:
- `id`: L'identifiant unique du compte financier

**Corps de la requête**:
```json
{
  "accountName": "string",
  "isDefault": true,
  // Autres champs à mettre à jour
}
```

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "message": "Compte financier mis à jour avec succès",
    // Détails mis à jour du modèle Compte Financier
  }
}
```

### 5. Supprimer un compte financier

**Endpoint**: `DELETE /api/v1/settings/financial-accounts/{id}`

**Description**: Supprime un compte financier existant.

**Paramètres de chemin (Path Params)**:
- `id`: L'identifiant unique du compte financier

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "message": "Compte financier supprimé avec succès"
  }
}
```

### 6. Définir un compte comme compte par défaut

**Endpoint**: `PUT /api/v1/settings/financial-accounts/{id}/set-default`

**Description**: Définit un compte financier spécifique comme compte par défaut.

**Paramètres de chemin (Path Params)**:
- `id`: L'identifiant unique du compte financier

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "isDefault": true,
    "message": "Compte défini comme compte par défaut"
  }
}
```

### 7. Récupérer les institutions bancaires disponibles

**Endpoint**: `GET /api/v1/settings/bank-institutions`

**Description**: Récupère la liste des institutions bancaires disponibles.

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "code": "string",
        "logoUrl": "string"
      }
    ]
  }
}
```
