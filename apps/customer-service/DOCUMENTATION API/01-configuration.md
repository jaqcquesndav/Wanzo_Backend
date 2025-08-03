# Configuration de base de l'API

## URL de base

Pour l'environnement de développement, toutes les requêtes API doivent être adressées à l'API Gateway sur le port 8000 avec le préfixe `land` :

```
http://localhost:8000/land/api/v1
```

*Configuration automatique dans le code source via `VITE_API_URL`*

## Headers obligatoires

Toutes les requêtes incluent automatiquement les headers suivants via le service `ApiService` :

| Header | Description | Gestion |
|--------|-------------|---------|
| `Authorization` | Token d'authentification Bearer | Automatique via `getToken()` |
| `Content-Type` | Type de contenu | `application/json` (sauf upload) |
| `Accept` | Format de réponse | `application/json` |

**Note importante** : L'authentification Bearer est automatiquement gérée par le service API. Tous les endpoints nécessitent une authentification valide.

Pour les uploads de fichiers, le `Content-Type` est automatiquement défini à `multipart/form-data`.

## Format des réponses

### Structure standard (basée sur `ApiResponse<T>`)

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
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
