# Configuration de base de l'API

## URL de base

Pour l'environnement de développement, toutes les requêtes API doivent être adressées à l'API Gateway sur le port 8000 avec le préfixe `land` :

```
http://localhost:8000/land/
```

Pour l'environnement de production, l'URL de base est :

```
https://api.wanzo.tech/land/
```

## Headers obligatoires

Toutes les requêtes doivent inclure les headers suivants :

| Header | Description | Exemple |
|--------|-------------|---------|
| `Authorization` | Token d'authentification au format Bearer | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `Content-Type` | Type de contenu de la requête | `application/json` |
| `Accept` | Format de réponse accepté | `application/json` |
| `X-Client-Version` | Version du client | `2.5.0` |

Pour les requêtes qui impliquent l'upload de fichiers (logo, CV, etc.), utilisez :
```
Content-Type: multipart/form-data
```

## Format des réponses

Toutes les réponses de l'API suivent la structure suivante :

### Réponse réussie

```json
{
  "success": true,
  "data": {
    // Données de la réponse spécifiques à chaque endpoint
  },
  "meta": {
    // Métadonnées (pagination, etc.) si applicable
  }
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur",
    "details": {
      // Détails supplémentaires sur l'erreur (facultatif)
    }
  }
}
```

## Pagination

Pour les endpoints qui retournent des listes, la pagination est supportée via les paramètres de requête `page` et `limit` :

```
GET /land/api/v1/companies?page=1&limit=10
```

La réponse inclut des métadonnées de pagination :

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "pages": 5
    }
  }
}
```

## Filtrage et tri

Le filtrage est supporté via des paramètres de requête spécifiques à chaque ressource :

```
GET /land/api/v1/companies?industry=Technology&size=small
```

Le tri est supporté via les paramètres `sort` et `order` :

```
GET /land/api/v1/companies?sort=createdAt&order=desc
```

## Versionnement

Le versionnement de l'API est géré via le préfixe de l'URL (`v1`). Les changements majeurs incompatibles avec les versions précédentes entraîneront un changement de version.
