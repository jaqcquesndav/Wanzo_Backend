# Documentation de l'API Institution

Cette section détaille les endpoints de l'API liés à la gestion des institutions financières dans la plateforme Wanzo Portfolio Institution. Ces endpoints permettent de gérer les informations institutionnelles, les gestionnaires, et les documents réglementaires.

## Récupération des informations de l'institution

Récupère les informations détaillées concernant l'institution financière actuellement connectée.

### Requête

```
GET /portfolio/api/v1/institution
```

### Réponse

```json
{
  "id": "inst-123456",
  "name": "Banque Exemple SA",
  "type": "bank",
  "status": "active",
  "license_number": "LIC-789012",
  "license_type": "universal_banking",
  "address": "123 Avenue Financière, 75008 Paris, France",
  "phone": "+33 1 23 45 67 89",
  "email": "contact@banque-exemple.fr",
  "website": "https://www.banque-exemple.fr",
  "legal_representative": "Marie Dupont",
  "tax_id": "FR12345678901",
  "regulatory_status": "regulated",
  "documents": [
    {
      "name": "Licence bancaire",
      "type": "license",
      "url": "https://api.wanzo.com/storage/documents/licence-123.pdf"
    },
    {
      "name": "Certificat de conformité",
      "type": "certificate",
      "url": "https://api.wanzo.com/storage/documents/certif-456.pdf"
    }
  ],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-07-20T14:15:30Z"
}
```

### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Institution non trouvée |
| 500  | Erreur serveur interne |

## Mise à jour des informations de l'institution

Met à jour les informations de l'institution financière.

### Requête

```
PUT /portfolio/api/v1/institution
```

### Corps de la requête

```json
{
  "name": "Nouvelle Banque Exemple SA",
  "address": "456 Boulevard Financier, 75008 Paris, France",
  "phone": "+33 1 98 76 54 32",
  "email": "nouveau-contact@banque-exemple.fr",
  "website": "https://www.nouvelle-banque-exemple.fr",
  "legal_representative": "Jean Martin"
}
```

### Réponse

La réponse renvoie l'objet institution complet avec les informations mises à jour:

```json
{
  "id": "inst-123456",
  "name": "Nouvelle Banque Exemple SA",
  "type": "bank",
  "status": "active",
  "license_number": "LIC-789012",
  "license_type": "universal_banking",
  "address": "456 Boulevard Financier, 75008 Paris, France",
  "phone": "+33 1 98 76 54 32",
  "email": "nouveau-contact@banque-exemple.fr",
  "website": "https://www.nouvelle-banque-exemple.fr",
  "legal_representative": "Jean Martin",
  "tax_id": "FR12345678901",
  "regulatory_status": "regulated",
  "documents": [...],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-07-24T09:45:12Z"
}
```

### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données invalides ou manquantes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Institution non trouvée |
| 500  | Erreur serveur interne |

## Gestionnaires de l'institution

### Récupération des gestionnaires

Récupère la liste de tous les gestionnaires associés à l'institution.

#### Requête

```
GET /portfolio/api/v1/institution/managers
```

#### Réponse

```json
[
  {
    "id": "mgr-123456",
    "institution_id": "inst-123456",
    "user_id": "user-789012",
    "role": "admin",
    "created_at": "2025-01-16T09:00:00Z"
  },
  {
    "id": "mgr-123457",
    "institution_id": "inst-123456",
    "user_id": "user-789013",
    "role": "manager",
    "created_at": "2025-01-20T14:30:00Z"
  }
]
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

### Ajout d'un gestionnaire

Ajoute un nouveau gestionnaire à l'institution.

#### Requête

```
POST /portfolio/api/v1/institution/managers
```

#### Corps de la requête

```json
{
  "user_id": "user-789014",
  "role": "manager"
}
```

#### Réponse

```json
{
  "id": "mgr-123458",
  "institution_id": "inst-123456",
  "user_id": "user-789014",
  "role": "manager",
  "created_at": "2025-07-24T10:15:30Z"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données invalides ou manquantes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Utilisateur non trouvé |
| 409  | Conflit - L'utilisateur est déjà gestionnaire de cette institution |
| 500  | Erreur serveur interne |

### Mise à jour d'un gestionnaire

Met à jour le rôle d'un gestionnaire existant.

#### Requête

```
PUT /portfolio/api/v1/institution/managers/:id
```

#### Paramètres

| Paramètre | Type   | Description |
|-----------|--------|-------------|
| id        | string | Identifiant du gestionnaire |

#### Corps de la requête

```json
{
  "role": "admin"
}
```

#### Réponse

```json
{
  "id": "mgr-123457",
  "institution_id": "inst-123456",
  "user_id": "user-789013",
  "role": "admin",
  "created_at": "2025-01-20T14:30:00Z"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données invalides |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Gestionnaire non trouvé |
| 500  | Erreur serveur interne |

### Suppression d'un gestionnaire

Supprime un gestionnaire de l'institution.

#### Requête

```
DELETE /portfolio/api/v1/institution/managers/:id
```

#### Paramètres

| Paramètre | Type   | Description |
|-----------|--------|-------------|
| id        | string | Identifiant du gestionnaire |

#### Réponse

```
204 No Content
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Gestionnaire non trouvé |
| 500  | Erreur serveur interne |

## Documents institutionnels

### Téléversement d'un document

Téléverse un nouveau document institutionnel (licence, certificat, etc.).

#### Requête

```
POST /portfolio/api/v1/institution/documents
```

#### Corps de la requête

Format multipart/form-data:
- file: Le fichier à téléverser
- type: Le type de document ('license', 'agreement', 'certificate', 'other')
- name: Le nom du document
- description: (Optionnel) Une description du document

#### Réponse

```json
{
  "id": "doc-123456",
  "url": "https://api.wanzo.com/storage/documents/institution-doc-123456.pdf"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Fichier invalide ou métadonnées manquantes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 413  | Entité trop volumineuse - Fichier trop volumineux |
| 415  | Type de média non supporté |
| 500  | Erreur serveur interne |

### Récupération des documents

Récupère tous les documents associés à l'institution.

#### Requête

```
GET /portfolio/api/v1/institution/documents
```

#### Réponse

```json
[
  {
    "id": "doc-123456",
    "name": "Licence bancaire 2025",
    "type": "license",
    "url": "https://api.wanzo.com/storage/documents/licence-123.pdf",
    "size": 2048576,
    "uploadDate": "2025-01-15T11:30:00Z",
    "description": "Licence d'exploitation bancaire valide jusqu'au 31/12/2027"
  },
  {
    "id": "doc-123457",
    "name": "Certificat de conformité LCB-FT",
    "type": "certificate",
    "url": "https://api.wanzo.com/storage/documents/certif-456.pdf",
    "size": 1024768,
    "uploadDate": "2025-02-10T09:15:30Z",
    "description": "Certification de conformité aux règles LCB-FT"
  }
]
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

## Validation d'une institution

Valide et active une institution nouvellement créée en fournissant les informations réglementaires requises.

### Requête

```
POST /portfolio/api/v1/institution/validate
```

### Corps de la requête

```json
{
  "license_number": "LIC-789012",
  "tax_id": "FR12345678901",
  "regulatory_status": "regulated",
  "legal_representative": "Marie Dupont"
}
```

### Réponse

```json
{
  "status": "success",
  "message": "Institution validée avec succès"
}
```

### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données manquantes ou invalides |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 409  | Conflit - Institution déjà validée |
| 422  | Entité non traitable - Échec de la validation (raisons détaillées dans la réponse) |
| 500  | Erreur serveur interne |
