# Adha Context API Documentation

Ce document présente les endpoints API liés à la gestion des sources de contexte Adha, incluant le CRUD, le téléchargement de fichiers, et le filtrage.

## 1. Récupération des sources de contexte

### `GET /api/adha-context/sources`

Récupère la liste des sources de contexte avec support de pagination et filtrage.

**Paramètres de requête:**

```
search: string               // Recherche textuelle
type: AdhaContextType        // Type de source (etude_marche, reglementation, etc.)
domaine: string[]            // Filtre par domaine(s)
zoneType: ZoneCibleType      // Filtre par type de zone (pays, ville, province)
zoneValue: string            // Filtre par valeur de zone (ex: "RDC")
niveau: string               // Filtre par niveau (ex: "Débutant", "Expert")
active: "true" | "false"     // Filtre par statut d'activation
tags: string[]               // Filtre par tags
expire: "true" | "false"     // Filtre sources expirées/non-expirées
dateValidite: string         // Date ISO pour filtrer par validité
page: number                 // Numéro de page (pagination)
pageSize: number             // Nombre d'éléments par page
```

**Réponse (Succès 200 OK):**

```json
{
  "data": [
    {
      "id": "source-id-1",
      "titre": "Étude de marché agriculture RDC 2025",
      "description": "Analyse complète du secteur agricole en RDC",
      "type": "etude_marche",
      "domaine": ["agriculture", "économie"],
      "zoneCible": [
        {"type": "pays", "value": "RDC"},
        {"type": "ville", "value": "Kinshasa"}
      ],
      "niveau": "Expert",
      "canExpire": true,
      "dateDebut": "2025-01-01T00:00:00.000Z",
      "dateFin": "2025-12-31T23:59:59.999Z",
      "url": "https://cloudinary.com/url/document.pdf",
      "downloadUrl": "https://cloudinary.com/url/document.pdf",
      "coverImageUrl": "https://cloudinary.com/url/thumbnail.jpg",
      "tags": ["marché", "agriculture", "RDC", "analyse"],
      "active": true,
      "createdAt": "2025-06-15T10:30:00.000Z",
      "updatedAt": "2025-06-15T10:30:00.000Z"
    }
    // ...autres sources
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 42,
    "totalPages": 5
  }
}
```

## 2. Création d'une source de contexte

### `POST /api/adha-context/sources`

Crée une nouvelle source de contexte.

**Corps de la requête:**

```json
{
  "titre": "Étude de marché agriculture RDC 2025",
  "description": "Analyse complète du secteur agricole en RDC",
  "type": "etude_marche",
  "domaine": ["agriculture", "économie"],
  "zoneCible": [
    {"type": "pays", "value": "RDC"},
    {"type": "ville", "value": "Kinshasa"}
  ],
  "niveau": "Expert",
  "canExpire": true,
  "dateDebut": "2025-01-01T00:00:00.000Z",
  "dateFin": "2025-12-31T23:59:59.999Z",
  "url": "https://cloudinary.com/url/document.pdf",
  "tags": ["marché", "agriculture", "RDC", "analyse"],
  "active": true
}
```

**Réponse (Succès 201 Created):**

```json
{
  "id": "nouveau-source-id",
  "titre": "Étude de marché agriculture RDC 2025",
  "description": "Analyse complète du secteur agricole en RDC",
  "type": "etude_marche",
  "domaine": ["agriculture", "économie"],
  "zoneCible": [
    {"type": "pays", "value": "RDC"},
    {"type": "ville", "value": "Kinshasa"}
  ],
  "niveau": "Expert",
  "canExpire": true,
  "dateDebut": "2025-01-01T00:00:00.000Z",
  "dateFin": "2025-12-31T23:59:59.999Z",
  "url": "https://cloudinary.com/url/document.pdf",
  "downloadUrl": "https://cloudinary.com/url/document.pdf",
  "coverImageUrl": "https://cloudinary.com/url/thumbnail.jpg",
  "tags": ["marché", "agriculture", "RDC", "analyse"],
  "active": true,
  "createdAt": "2025-06-16T14:30:00.000Z",
  "updatedAt": "2025-06-16T14:30:00.000Z"
}
```

## 3. Récupération d'une source de contexte spécifique

### `GET /api/adha-context/sources/{id}`

Récupère les détails d'une source de contexte spécifique.

**Paramètres:**

- `id` (chemin): ID unique de la source de contexte

**Réponse (Succès 200 OK):**

```json
{
  "id": "source-id-1",
  "titre": "Étude de marché agriculture RDC 2025",
  "description": "Analyse complète du secteur agricole en RDC",
  "type": "etude_marche",
  "domaine": ["agriculture", "économie"],
  "zoneCible": [
    {"type": "pays", "value": "RDC"},
    {"type": "ville", "value": "Kinshasa"}
  ],
  "niveau": "Expert",
  "canExpire": true,
  "dateDebut": "2025-01-01T00:00:00.000Z",
  "dateFin": "2025-12-31T23:59:59.999Z",
  "url": "https://cloudinary.com/url/document.pdf",
  "downloadUrl": "https://cloudinary.com/url/document.pdf",
  "coverImageUrl": "https://cloudinary.com/url/thumbnail.jpg",
  "tags": ["marché", "agriculture", "RDC", "analyse"],
  "active": true,
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-15T10:30:00.000Z"
}
```

## 4. Mise à jour d'une source de contexte

### `PUT /api/adha-context/sources/{id}`

Met à jour une source de contexte existante.

**Paramètres:**

- `id` (chemin): ID unique de la source de contexte

**Corps de la requête:**

```json
{
  "titre": "Étude de marché agriculture RDC 2025 - Version mise à jour",
  "description": "Analyse complète du secteur agricole en RDC avec données actualisées",
  "tags": ["marché", "agriculture", "RDC", "analyse", "2025"],
  "active": false
  // Tout autre champ à mettre à jour
}
```

**Réponse (Succès 200 OK):**

```json
{
  "id": "source-id-1",
  "titre": "Étude de marché agriculture RDC 2025 - Version mise à jour",
  "description": "Analyse complète du secteur agricole en RDC avec données actualisées",
  "type": "etude_marche",
  "domaine": ["agriculture", "économie"],
  "zoneCible": [
    {"type": "pays", "value": "RDC"},
    {"type": "ville", "value": "Kinshasa"}
  ],
  "niveau": "Expert",
  "canExpire": true,
  "dateDebut": "2025-01-01T00:00:00.000Z",
  "dateFin": "2025-12-31T23:59:59.999Z",
  "url": "https://cloudinary.com/url/document.pdf",
  "downloadUrl": "https://cloudinary.com/url/document.pdf",
  "coverImageUrl": "https://cloudinary.com/url/thumbnail.jpg",
  "tags": ["marché", "agriculture", "RDC", "analyse", "2025"],
  "active": false,
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-16T15:45:00.000Z"
}
```

## 5. Suppression d'une source de contexte

### `DELETE /api/adha-context/sources/{id}`

Supprime une source de contexte.

**Paramètres:**

- `id` (chemin): ID unique de la source de contexte

**Réponse (Succès 204 No Content)**

## 6. Téléchargement de fichier pour une source de contexte

### `POST /api/adha-context/upload`

Télécharge un fichier pour une source de contexte et génère automatiquement une miniature.

**Corps de la requête:**

- Format: multipart/form-data
- Champ `file`: Le fichier à télécharger

**Réponse (Succès 200 OK):**

```json
{
  "url": "https://cloudinary.com/url/document.pdf",
  "coverImageUrl": "https://cloudinary.com/url/thumbnail.jpg"
}
```

## 7. Activation/Désactivation d'une source de contexte

### `PATCH /api/adha-context/sources/{id}/toggle-active`

Active ou désactive une source de contexte (pour déploiement comme contexte IA).

**Paramètres:**

- `id` (chemin): ID unique de la source de contexte

**Corps de la requête:**

```json
{
  "active": true
}
```

**Réponse (Succès 200 OK):**

```json
{
  "id": "source-id-1",
  "active": true,
  "updatedAt": "2025-06-16T16:30:00.000Z"
}
```

## 8. Obtenir les suggestions de tags

### `GET /api/adha-context/tag-suggestions`

Récupère la liste des suggestions de tags disponibles.

**Réponse (Succès 200 OK):**

```json
{
  "tags": [
    "marché",
    "statistiques",
    "juridique",
    "innovation",
    "RDC",
    "Kinshasa",
    "agriculture",
    "industrie",
    "banque",
    "startup",
    "énergie",
    "mines",
    "commerce",
    "santé",
    "éducation",
    "export",
    "import",
    "PME",
    "financement",
    "formation",
    "loi",
    "fiscalité",
    "prix",
    "tendance",
    "analyse",
    "benchmark",
    "licence",
    "propriété intellectuelle",
    "open data",
    "public",
    "privé",
    "zone économique",
    "province",
    "ville",
    "Afrique",
    "international"
  ]
}
```

## 9. Obtenir les suggestions de zones cibles

### `GET /api/adha-context/zone-suggestions`

Récupère la liste des suggestions de zones cibles disponibles.

**Réponse (Succès 200 OK):**

```json
{
  "zones": [
    {"type": "pays", "value": "RDC"},
    {"type": "ville", "value": "Kinshasa"},
    {"type": "province", "value": "Kinshasa"},
    {"type": "province", "value": "Haut-Katanga"},
    {"type": "province", "value": "Kasaï"}
  ]
}
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide (données manquantes ou incorrectes) |
| 401  | Non authentifié |
| 403  | Non autorisé |
| 404  | Ressource non trouvée |
| 409  | Conflit (ex: ressource existante) |
| 500  | Erreur serveur interne |
