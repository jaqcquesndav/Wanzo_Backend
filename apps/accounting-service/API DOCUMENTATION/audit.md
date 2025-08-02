# Audit API Documentation

Ce document décrit les endpoints API d'Audit pour l'application Wanzo Compta. L'audit se concentre sur la validation des exercices comptables par des auditeurs certifiés.

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

## Workflow d'Audit

L'audit d'un exercice comptable suit ce processus :

1. **Demande de token** : L'auditeur demande un token en fournissant ses informations
2. **Validation du token** : Le token reçu par email est validé  
3. **Audit de l'exercice** : L'exercice comptable est marqué comme audité
4. **Historique** : L'historique des audits est conservé

## Endpoints

### Demander un Token d'Audit

Permet à un auditeur certifié de demander un token pour effectuer l'audit d'un exercice comptable.

**URL:** `/audit/request-token`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "name": "Jean Dupont",
  "registrationNumber": "AUD-123456"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Token d'audit généré et envoyé par email"
}
```

### Valider un Token d'Audit

Valide un token d'audit avant de procéder à l'audit d'un exercice comptable.

**URL:** `/audit/validate-token`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**
```json
{
  "token": "audit-token-xyz123"
}
```

**Response:** `200 OK`

```json
{
  "valid": true,
  "message": "Token valide"
}
```

**Response:** `400 Bad Request`

```json
{
  "valid": false,
  "message": "Token invalide ou expiré"
}
```

### Auditer un Exercice Comptable

Marque un exercice comptable comme audité après validation du token.

**URL:** `/audit/fiscal-year/{fiscalYearId}`

**Method:** `POST`

**Authentication Required:** Yes

**Parameters:**
- `fiscalYearId` (string, required): L'ID de l'exercice comptable à auditer

**Request Body:**
```json
{
  "auditorCredentials": {
    "name": "Jean Dupont",
    "registrationNumber": "AUD-123456",
    "token": "audit-token-xyz123"
  },
  "comments": "Comptabilité conforme aux normes SYSCOHADA"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Exercice comptable audité avec succès",
  "fiscalYear": {
    "id": "fy_2024_001",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "status": "closed",
    "code": "FY2024",
    "auditStatus": {
      "isAudited": true,
      "auditor": {
        "name": "Jean Dupont",
        "registrationNumber": "AUD-123456"
      },
      "auditedAt": "2024-06-15T10:30:45Z",
      "comments": "Comptabilité conforme aux normes SYSCOHADA"
    }
  }
}
```

### Obtenir l'Historique d'Audit

Récupère l'historique des audits pour un exercice comptable spécifique.

**URL:** `/audit/history/{fiscalYearId}`

**Method:** `GET`

**Authentication Required:** Yes

**Parameters:**
- `fiscalYearId` (string, required): L'ID de l'exercice comptable

**Response:** `200 OK`

```json
{
  "fiscalYearId": "fy_2024_001",
  "audits": [
    {
      "id": "audit-123",
      "date": "2024-06-15T10:30:45Z",
      "auditor": {
        "name": "Jean Dupont",
        "registrationNumber": "AUD-123456"
      },
      "status": "approved",
      "comments": "Comptabilité conforme aux normes SYSCOHADA"
    }
  ]
}
```

### Lister tous les Audits

Récupère la liste de tous les audits effectués avec filtres optionnels.

**URL:** `/audit/list`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**
- `startDate` (optional) - Date de début (YYYY-MM-DD)
- `endDate` (optional) - Date de fin (YYYY-MM-DD)
- `auditorId` (optional) - ID de l'auditeur
- `status` (optional) - Statut ('pending', 'approved', 'rejected')
- `page` (optional) - Numéro de page (défaut: 1)
- `pageSize` (optional) - Taille de page (défaut: 20)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "audits": [
      {
        "id": "audit-123",
        "fiscalYear": {
          "id": "fy_2024_001",
          "code": "FY2024",
          "startDate": "2024-01-01",
          "endDate": "2024-12-31"
        },
        "date": "2024-06-15T10:30:45Z",
        "auditor": {
          "name": "Jean Dupont",
          "registrationNumber": "AUD-123456"
        },
        "status": "approved",
        "comments": "Comptabilité conforme aux normes SYSCOHADA"
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```
```

## Data Structures

### AuditorCredentials

```typescript
interface AuditorCredentials {
  name: string;
  registrationNumber: string;
  token?: string;
}
```

### AuditValidation

```typescript
interface AuditValidation {
  success: boolean;
  message: string;
  errors?: string[];
}
```

### FiscalYearAudit

```typescript
interface FiscalYearAudit {
  id: string;
  date: string; // ISO 8601 format
  auditor: {
    name: string;
    registrationNumber: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
}
```

### AuditHistory

```typescript
interface AuditHistoryResponse {
  fiscalYearId: string;
  audits: FiscalYearAudit[];
}
```

## Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Session expirée ou privilèges insuffisants"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "error": "Token invalide ou données manquantes"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Exercice comptable non trouvé"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "error": "Seuls les auditeurs certifiés peuvent effectuer cette action"
}
```

**Conflict (409):**
```json
{
  "success": false,
  "error": "Cet exercice comptable a déjà été audité"
}
```

## Notes d'Implémentation

### Sécurité
- Les tokens d'audit ont une durée de vie limitée (24h)
- Seuls les utilisateurs avec le rôle 'auditor' peuvent demander des tokens
- La validation du numéro de matricule se fait auprès du registre des auditeurs

### Workflow
1. L'auditeur doit d'abord demander un token via `/audit/request-token`
2. Le token est envoyé par email à l'adresse associée au matricule
3. L'auditeur utilise ce token pour valider l'audit via `/audit/fiscal-year/{id}`
4. Une fois audité, l'exercice comptable devient définitivement verrouillé

### Contraintes
- Un exercice comptable ne peut être audité que s'il est fermé (`status: 'closed'`)
- Un exercice déjà audité ne peut pas être re-audité
- Seul un auditeur certifié peut effectuer un audit
