# Documentation de l'API Prospection

Cette section détaille les endpoints de l'API liés à la prospection commerciale dans la plateforme Wanzo Portfolio Institution. Ces endpoints permettent de gérer les opportunités commerciales, les campagnes de prospection et l'analyse des leads potentiels.

## Opportunités de prospection

### Liste des opportunités

Récupère la liste des opportunités de prospection avec pagination et filtrage.

#### Requête

```
GET /prospection/opportunities
```

#### Paramètres de requête

| Paramètre     | Type   | Description | Requis |
|---------------|--------|-------------|--------|
| status        | string | Statut de l'opportunité ('new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost') | Non |
| portfolioType | string | Type de portefeuille ('traditional', 'investment', 'leasing') | Non |
| assignedTo    | string | ID de l'utilisateur assigné | Non |
| minAmount     | number | Montant minimum | Non |
| maxAmount     | number | Montant maximum | Non |
| sector        | string | Secteur d'activité | Non |
| page          | number | Numéro de page pour la pagination | Non |
| limit         | number | Nombre d'éléments par page | Non |

#### Réponse

```json
{
  "data": [
    {
      "id": "opp-123456",
      "companyId": "comp-789012",
      "companyName": "TechInnovation SA",
      "type": "traditional",
      "amount": 500000,
      "probability": 75,
      "expectedCloseDate": "2025-09-15",
      "status": "proposal",
      "assignedTo": "user-345678",
      "notes": "Client potentiel intéressé par un financement d'expansion",
      "created_at": "2025-06-15T10:30:00Z",
      "updated_at": "2025-07-10T14:45:30Z"
    },
    {
      "id": "opp-123457",
      "companyId": "comp-789013",
      "companyName": "GreenEnergy SAS",
      "type": "investment",
      "amount": 750000,
      "probability": 60,
      "expectedCloseDate": "2025-10-01",
      "status": "qualified",
      "assignedTo": "user-345679",
      "notes": "Entreprise prometteuse dans le secteur des énergies renouvelables",
      "created_at": "2025-06-20T11:15:00Z",
      "updated_at": "2025-07-15T09:30:00Z"
    }
  ],
  "meta": {
    "total": 24,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Paramètres de filtre incorrects |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

### Détails d'une opportunité

Récupère les informations détaillées d'une opportunité de prospection spécifique.

#### Requête

```
GET /prospection/opportunities/:id
```

#### Paramètres

| Paramètre | Type   | Description |
|-----------|--------|-------------|
| id        | string | Identifiant de l'opportunité |

#### Réponse

```json
{
  "id": "opp-123456",
  "companyId": "comp-789012",
  "companyName": "TechInnovation SA",
  "type": "traditional",
  "amount": 500000,
  "probability": 75,
  "expectedCloseDate": "2025-09-15",
  "status": "proposal",
  "assignedTo": "user-345678",
  "notes": "Client potentiel intéressé par un financement d'expansion",
  "activities": [
    {
      "id": "act-123456",
      "type": "call",
      "date": "2025-06-20T10:30:00Z",
      "description": "Premier appel de présentation",
      "createdBy": "user-345678"
    },
    {
      "id": "act-123457",
      "type": "meeting",
      "date": "2025-07-05T14:00:00Z",
      "description": "Réunion pour présentation détaillée des solutions de financement",
      "createdBy": "user-345678"
    }
  ],
  "documents": [
    {
      "id": "doc-123456",
      "name": "Présentation commerciale",
      "type": "presentation",
      "url": "https://api.wanzo.com/storage/opportunities/presentation-123456.pdf",
      "uploadedAt": "2025-06-25T11:45:00Z",
      "uploadedBy": "user-345678"
    },
    {
      "id": "doc-123457",
      "name": "Proposition financière",
      "type": "proposal",
      "url": "https://api.wanzo.com/storage/opportunities/proposal-123457.pdf",
      "uploadedAt": "2025-07-10T09:30:00Z",
      "uploadedBy": "user-345678"
    }
  ],
  "created_at": "2025-06-15T10:30:00Z",
  "updated_at": "2025-07-10T14:45:30Z"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Opportunité non trouvée |
| 500  | Erreur serveur interne |

### Création d'une opportunité

Crée une nouvelle opportunité de prospection.

#### Requête

```
POST /prospection/opportunities
```

#### Corps de la requête

```json
{
  "companyId": "comp-789014",
  "type": "leasing",
  "amount": 350000,
  "probability": 60,
  "expectedCloseDate": "2025-10-15",
  "status": "new",
  "assignedTo": "user-345678",
  "notes": "Potentiel client pour leasing d'équipements industriels"
}
```

#### Réponse

```json
{
  "id": "opp-123458",
  "companyId": "comp-789014",
  "companyName": "IndustrialSolutions SARL",
  "type": "leasing",
  "amount": 350000,
  "probability": 60,
  "expectedCloseDate": "2025-10-15",
  "status": "new",
  "assignedTo": "user-345678",
  "notes": "Potentiel client pour leasing d'équipements industriels",
  "created_at": "2025-07-24T11:30:00Z",
  "updated_at": "2025-07-24T11:30:00Z"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données manquantes ou incorrectes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Entreprise (companyId) non trouvée |
| 500  | Erreur serveur interne |

### Mise à jour d'une opportunité

Met à jour les informations d'une opportunité existante.

#### Requête

```
PUT /prospection/opportunities/:id
```

#### Paramètres

| Paramètre | Type   | Description |
|-----------|--------|-------------|
| id        | string | Identifiant de l'opportunité |

#### Corps de la requête

```json
{
  "amount": 400000,
  "probability": 70,
  "status": "qualified",
  "expectedCloseDate": "2025-10-01",
  "notes": "Client très intéressé suite à la première présentation"
}
```

#### Réponse

```json
{
  "id": "opp-123458",
  "companyId": "comp-789014",
  "companyName": "IndustrialSolutions SARL",
  "type": "leasing",
  "amount": 400000,
  "probability": 70,
  "expectedCloseDate": "2025-10-01",
  "status": "qualified",
  "assignedTo": "user-345678",
  "notes": "Client très intéressé suite à la première présentation",
  "created_at": "2025-07-24T11:30:00Z",
  "updated_at": "2025-07-24T15:45:00Z"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données incorrectes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Opportunité non trouvée |
| 500  | Erreur serveur interne |

### Suppression d'une opportunité

Supprime une opportunité de prospection.

#### Requête

```
DELETE /prospection/opportunities/:id
```

#### Paramètres

| Paramètre | Type   | Description |
|-----------|--------|-------------|
| id        | string | Identifiant de l'opportunité |

#### Réponse

```
204 No Content
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Opportunité non trouvée |
| 500  | Erreur serveur interne |

### Ajout d'une activité

Ajoute une nouvelle activité à une opportunité existante.

#### Requête

```
POST /prospection/opportunities/:opportunityId/activities
```

#### Paramètres

| Paramètre     | Type   | Description |
|---------------|--------|-------------|
| opportunityId | string | Identifiant de l'opportunité |

#### Corps de la requête

```json
{
  "type": "meeting",
  "date": "2025-07-30T14:00:00Z",
  "description": "Réunion de présentation détaillée de notre offre de leasing"
}
```

#### Réponse

```json
{
  "id": "act-123458",
  "opportunityId": "opp-123458",
  "type": "meeting",
  "date": "2025-07-30T14:00:00Z",
  "description": "Réunion de présentation détaillée de notre offre de leasing",
  "createdBy": "user-345678",
  "created_at": "2025-07-24T16:15:00Z"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données manquantes ou incorrectes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Opportunité non trouvée |
| 500  | Erreur serveur interne |

### Ajout d'un document

Ajoute un document à une opportunité existante.

#### Requête

```
POST /prospection/opportunities/:opportunityId/documents
```

#### Paramètres

| Paramètre     | Type   | Description |
|---------------|--------|-------------|
| opportunityId | string | Identifiant de l'opportunité |

#### Corps de la requête

```json
{
  "name": "Proposition commerciale",
  "type": "proposal",
  "url": "https://api.wanzo.com/storage/opportunities/proposal-123458.pdf"
}
```

#### Réponse

```json
{
  "id": "doc-123458",
  "opportunityId": "opp-123458",
  "name": "Proposition commerciale",
  "type": "proposal",
  "url": "https://api.wanzo.com/storage/opportunities/proposal-123458.pdf",
  "uploadedAt": "2025-07-24T16:30:00Z",
  "uploadedBy": "user-345678"
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données manquantes ou incorrectes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Opportunité non trouvée |
| 500  | Erreur serveur interne |

## Campagnes de prospection

### Liste des campagnes

Récupère la liste des campagnes de prospection avec pagination et filtrage.

#### Requête

```
GET /prospection/campaigns
```

#### Paramètres de requête

| Paramètre | Type   | Description | Requis |
|-----------|--------|-------------|--------|
| status    | string | Statut de la campagne ('draft', 'active', 'completed', 'cancelled') | Non |
| type      | string | Type de campagne ('email', 'call', 'event', 'other') | Non |
| page      | number | Numéro de page pour la pagination | Non |
| limit     | number | Nombre d'éléments par page | Non |

#### Réponse

```json
{
  "data": [
    {
      "id": "camp-123456",
      "name": "Campagne PME Technologie Q3 2025",
      "description": "Campagne de prospection ciblant les PME du secteur technologique",
      "type": "email",
      "status": "active",
      "startDate": "2025-07-01T00:00:00Z",
      "endDate": "2025-09-30T23:59:59Z",
      "target": {
        "sectors": ["Technology", "Software", "IT Services"],
        "regions": ["Île-de-France", "Rhône-Alpes"],
        "minRevenue": 500000,
        "maxRevenue": 5000000,
        "companySize": "medium"
      },
      "metrics": {
        "reached": 150,
        "responded": 45,
        "converted": 12,
        "roi": 3.2
      },
      "created_at": "2025-06-15T10:30:00Z",
      "updated_at": "2025-07-20T14:45:30Z"
    },
    {
      "id": "camp-123457",
      "name": "Événement Financement Vert 2025",
      "description": "Événement de présentation des solutions de financement pour projets écologiques",
      "type": "event",
      "status": "draft",
      "startDate": "2025-10-15T00:00:00Z",
      "endDate": "2025-10-15T23:59:59Z",
      "target": {
        "sectors": ["Energy", "CleanTech", "Agriculture"],
        "regions": ["Toute la France"],
        "minRevenue": 1000000,
        "maxRevenue": 50000000,
        "companySize": "all"
      },
      "metrics": {
        "reached": 0,
        "responded": 0,
        "converted": 0,
        "roi": 0
      },
      "created_at": "2025-07-10T11:15:00Z",
      "updated_at": "2025-07-15T09:30:00Z"
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Paramètres de filtre incorrects |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

## Recherche de leads

Recherche et évalue des leads potentiels basés sur des critères spécifiques.

### Requête

```
POST /prospection/leads/search
```

### Corps de la requête

```json
{
  "sector": ["Technology", "Finance"],
  "region": ["Île-de-France", "Provence-Alpes-Côte d'Azur"],
  "minRevenue": 1000000,
  "maxRevenue": 10000000,
  "companySize": "medium",
  "growthRate": 5,
  "creditScore": 75
}
```

### Réponse

```json
{
  "leads": [
    {
      "id": "lead-123456",
      "companyName": "InnovTech Solutions",
      "sector": "Technology",
      "region": "Île-de-France",
      "revenue": 5000000,
      "employees": 45,
      "foundedYear": 2018,
      "growthRate": 12,
      "creditScore": 82,
      "contactInfo": {
        "name": "Sophie Martin",
        "position": "Directrice Financière",
        "email": "s.martin@innovtech.example",
        "phone": "+33 1 23 45 67 89"
      },
      "lastContact": null,
      "score": 87,
      "recommendation": "Excellent candidat pour financement de croissance"
    },
    {
      "id": "lead-123457",
      "companyName": "FintechPro",
      "sector": "Finance",
      "region": "Île-de-France",
      "revenue": 3500000,
      "employees": 30,
      "foundedYear": 2019,
      "growthRate": 15,
      "creditScore": 79,
      "contactInfo": {
        "name": "Thomas Dubois",
        "position": "CEO",
        "email": "t.dubois@fintechpro.example",
        "phone": "+33 1 98 76 54 32"
      },
      "lastContact": "2025-05-15T14:30:00Z",
      "score": 85,
      "recommendation": "Potentiel élevé pour solutions d'investissement"
    }
  ],
  "total": 15,
  "averageScore": 76.5
}
```

### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Critères de recherche incorrects |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |

## Statistiques de prospection

Récupère les statistiques de prospection pour une période donnée.

### Requête

```
GET /prospection/stats?period=:period
```

### Paramètres de requête

| Paramètre | Type   | Description | Requis |
|-----------|--------|-------------|--------|
| period    | string | Période d'analyse ('week', 'month', 'quarter', 'year') | Oui |

### Réponse

```json
{
  "period": "month",
  "newOpportunities": 24,
  "qualifiedOpportunities": 18,
  "wonOpportunities": 6,
  "lostOpportunities": 3,
  "conversionRate": 25,
  "averageDealSize": 450000,
  "totalPotentialValue": 10800000,
  "averageSalesCycle": 45,
  "topPerformers": [
    {
      "userId": "user-123456",
      "name": "Jean Dupont",
      "opportunities": 8,
      "closed": 3,
      "value": 1500000
    },
    {
      "userId": "user-123457",
      "name": "Marie Martin",
      "opportunities": 7,
      "closed": 2,
      "value": 1200000
    }
  ],
  "byType": {
    "traditional": 12,
    "investment": 8,
    "leasing": 4
  },
  "byStage": {
    "new": 6,
    "qualified": 12,
    "proposal": 4,
    "negotiation": 2
  }
}
```

### Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Période invalide |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 500  | Erreur serveur interne |
