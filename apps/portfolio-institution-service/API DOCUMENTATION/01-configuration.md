# Configuration de base

Ce document décrit la configuration de base de l'API Wanzo Portfolio Institution, notamment les URLs, les headers et le format des réponses.

## URL de base

Toutes les requêtes API doivent être préfixées par l'URL de base correspondant à l'environnement utilisé :

- **Développement** : `http://localhost:8000/api`
- **Production** : `https://api.wanzo-portfolio.com/api`

**IMPORTANT** : Ne pas inclure `api/v1/` dans les chemins d'accès. L'API Gateway s'occupe de la gestion des versions.

## Headers

### Headers de requête

Toutes les requêtes doivent inclure les headers suivants :

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token_jwt}
```

Pour les requêtes qui impliquent l'upload de fichiers, utilisez :

```
Content-Type: multipart/form-data
Authorization: Bearer {token_jwt}
```

### Headers de réponse

Les réponses incluent généralement les headers suivants :

```
Content-Type: application/json
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Pragma: no-cache
Expires: 0
Surrogate-Control: no-store
```

## Format des réponses

### Réponse standard

Toutes les réponses réussies suivent ce format JSON :

```json
{
  "success": true,
  "data": {
    // Les données demandées
  }
}
```

### Réponse paginée

Les réponses qui retournent une liste d'éléments sont généralement paginées et suivent ce format :

```json
{
  "success": true,
  "data": {
    "items": [
      // Liste d'éléments
    ],
    "pagination": {
      "total": 100,       // Nombre total d'éléments
      "page": 1,          // Page courante
      "limit": 10,        // Nombre d'éléments par page
      "pages": 10         // Nombre total de pages
    }
  }
}
```

### Réponse d'erreur

Les réponses d'erreur suivent ce format :

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",         // Code d'erreur spécifique
    "message": "Message d'erreur", // Description de l'erreur
    "details": {                  // Détails supplémentaires (optionnel)
      "field": "email",
      "reason": "Email invalide"
    }
  }
}
```

## Paramètres de requête communs

### Pagination

Pour les endpoints qui supportent la pagination, vous pouvez utiliser les paramètres suivants :

- `page` : Numéro de la page (défaut : 1)
- `limit` : Nombre d'éléments par page (défaut : 10, max : 100)

Exemple : `/api/users?page=2&limit=20`

### Filtrage

De nombreux endpoints supportent le filtrage avec les paramètres suivants :

- `search` : Recherche textuelle générale
- `sort` : Champ sur lequel trier
- `order` : Ordre de tri (`asc` ou `desc`)
- Filtres spécifiques selon les endpoints

Exemple : `/api/companies?search=tech&sort=name&order=asc`

### Inclusions

Certains endpoints permettent d'inclure des ressources associées :

- `include` : Liste de ressources à inclure, séparées par des virgules

Exemple : `/api/portfolios/traditional/123?include=contracts,client`

## Formats de date

Toutes les dates sont fournies et attendues au format ISO 8601 :

```
YYYY-MM-DDTHH:mm:ss.sssZ
```

Exemple : `2025-07-24T14:30:00.000Z`

## Limites de requêtes

L'API implémente des limites de taux pour éviter les abus :

- 100 requêtes par minute par utilisateur pour la plupart des endpoints
- 10 requêtes par minute pour les endpoints d'authentification

En cas de dépassement, l'API retournera une réponse avec le code d'erreur HTTP 429 (Too Many Requests) :

```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Trop de requêtes, veuillez réessayer plus tard",
    "details": {
      "retryAfter": 60,
      "limit": 100,
      "remaining": 0,
      "resetAt": "2025-07-24T14:35:00.000Z"
    }
  }
}
```

## Versionnement

L'API utilise le versionnement via l'API Gateway. Vous n'avez pas besoin d'inclure la version dans vos URL (`api/v1/`) car l'API Gateway s'occupe de cette gestion en fonction des en-têtes ou d'autres critères.

## CORS

L'API implémente une politique CORS qui permet aux applications clientes approuvées d'accéder à l'API. En développement, toutes les origines sont généralement autorisées.

## Sécurité

- Toutes les communications doivent utiliser HTTPS en production
- Les tokens JWT ont une durée de validité limitée (voir la documentation d'authentification)
- L'authentification à deux facteurs (2FA) est disponible et recommandée pour les comptes sensibles
