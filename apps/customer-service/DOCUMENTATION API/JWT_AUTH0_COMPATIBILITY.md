# 🔐 JWT Auth0 Compatibility Guide

## Vue d'ensemble

Ce document décrit le format et la configuration des tokens JWT Auth0 requis pour l'authentification entre le frontend et le backend Wanzo.

## 📋 Configuration Auth0 Frontend

### Configuration Requise

```javascript
// Configuration Auth0 dans le frontend
const auth0Config = {
  domain: "dev-tezmln0tk0g1gouf.eu.auth0.com",
  clientId: "i8DvOQOYSobZGhHPlbTWZ7CWd5QMZIw2",
  audience: "https://api.wanzo.com", // CRITIQUE pour obtenir un JWT
  scope: "openid profile email",
  responseType: "token id_token", // ou "code" pour PKCE
  cacheLocation: "localstorage"
}
```

### ⚠️ Points Critiques

1. **Audience Parameter** : Obligatoire pour recevoir un JWT au lieu d'un token opaque
2. **Domain** : Doit correspondre exactement à celui configuré dans le backend
3. **Scope** : Minimum `openid profile email` pour les informations utilisateur

## 🎯 Format Token JWT Attendu

### Structure du Header HTTP

```
Authorization: Bearer <jwt_token>
```

### Claims JWT Requis

```json
{
  // Standard JWT claims
  "iss": "https://dev-tezmln0tk0g1gouf.eu.auth0.com/",
  "aud": "https://api.wanzo.com",
  "sub": "auth0|user_id_unique",
  "iat": 1692808800,
  "exp": 1692812400,
  
  // User information
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  
  // Custom claims (optionnel)
  "https://dev-tezmln0tk0g1gouf.eu.auth0.com/roles": ["user", "premium"],
  "permissions": ["read:profile", "write:profile"]
}
```

### Algorithme de Signature

- **Algorithme** : RS256
- **Validation** : Via JWKS endpoint Auth0
- **Endpoint JWKS** : `https://dev-tezmln0tk0g1gouf.eu.auth0.com/.well-known/jwks.json`

## 🚀 Implémentation Frontend

### Auth0 SPA SDK

```javascript
import { createAuth0Client } from '@auth0/auth0-spa-js';

// 1. Initialisation
const auth0 = await createAuth0Client({
  domain: 'dev-tezmln0tk0g1gouf.eu.auth0.com',
  clientId: 'i8DvOQOYSobZGhHPlbTWZ7CWd5QMZIw2',
  audience: 'https://api.wanzo.com', // ESSENTIEL pour JWT
  scope: 'openid profile email'
});

// 2. Login
await auth0.loginWithRedirect();

// 3. Récupération du token après login
const token = await auth0.getTokenSilently({
  audience: 'https://api.wanzo.com',
  scope: 'openid profile email'
});

// 4. Utilisation dans les requêtes API
const response = await fetch('http://localhost:8000/land/api/v1/companies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});
```

### Fonction Utilitaire Recommandée

```javascript
/**
 * Récupère un token JWT valide d'Auth0
 * @returns {Promise<string>} JWT token
 */
async function getAuthToken() {
  try {
    return await auth0.getTokenSilently({
      audience: 'https://api.wanzo.com'
    });
  } catch (error) {
    console.error('Erreur récupération token:', error);
    throw new Error('Impossible de récupérer le token d\'authentification');
  }
}

/**
 * Effectue une requête API authentifiée
 * @param {string} url - URL de l'API
 * @param {Object} options - Options fetch
 * @returns {Promise<Response>} Response
 */
async function authenticatedFetch(url, options = {}) {
  const token = await getAuthToken();
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
}
```

## 🔍 Validation Backend

### Configuration Backend

Le backend valide automatiquement les tokens via :

```typescript
// JWT Strategy Configuration
{
  secretOrKeyProvider: passportJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://dev-tezmln0tk0g1gouf.eu.auth0.com/.well-known/jwks.json`,
  }),
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  audience: 'https://api.wanzo.com',
  issuer: 'https://dev-tezmln0tk0g1gouf.eu.auth0.com/',
  algorithms: ['RS256'],
}
```

### Processus de Validation

1. **Extraction** : Token extrait du header `Authorization: Bearer <token>`
2. **Vérification signature** : Via clés publiques JWKS
3. **Validation claims** :
   - `iss` = `https://dev-tezmln0tk0g1gouf.eu.auth0.com/`
   - `aud` = `https://api.wanzo.com`
   - `exp` > temps actuel
4. **Enrichissement** : Données utilisateur ajoutées au contexte

## ❌ Erreurs Communes

### Token Opaque au lieu de JWT

```javascript
// ❌ FAUX - produit un token opaque
const auth0 = createAuth0Client({
  domain: 'dev-tezmln0tk0g1gouf.eu.auth0.com',
  clientId: 'i8DvOQOYSobZGhHPlbTWZ7CWd5QMZIw2'
  // audience manquant = token opaque
});

// ✅ CORRECT - produit un JWT
const auth0 = createAuth0Client({
  domain: 'dev-tezmln0tk0g1gouf.eu.auth0.com',
  clientId: 'i8DvOQOYSobZGhHPlbTWZ7CWd5QMZIw2',
  audience: 'https://api.wanzo.com' // JWT token
});
```

### Format Header Incorrect

```javascript
// ❌ FAUX
headers: {
  'Authorization': jwt_token,         // Manque "Bearer "
  'Token': `Bearer ${jwt_token}`,     // Mauvais header
  'Auth': `Bearer ${jwt_token}`       // Mauvais header
}

// ✅ CORRECT
headers: {
  'Authorization': `Bearer ${jwt_token}`
}
```

## 🧪 Tests et Debugging

### Vérification du Token JWT

1. **Copiez le token** reçu du frontend
2. **Décodez sur** [jwt.io](https://jwt.io)
3. **Vérifiez** :
   - Header : `"alg": "RS256"`
   - Payload : Claims requis présents
   - Audience : `https://api.wanzo.com`
   - Issuer : `https://dev-tezmln0tk0g1gouf.eu.auth0.com/`

### Test de Connectivité

```bash
# Test endpoint avec token
curl -X POST \
  http://localhost:8000/land/api/v1/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Test Company","type":"SME"}'
```

### Codes d'Erreur Courants

- **401 Unauthorized** : Token invalide, expiré ou malformé
- **403 Forbidden** : Token valide mais permissions insuffisantes
- **400 Bad Request** : Format de requête incorrect

## 📚 Références

- [Auth0 SPA SDK Documentation](https://auth0.com/docs/libraries/auth0-spa-js)
- [JWT.io Token Debugger](https://jwt.io)
- [Auth0 JWKS Endpoint](https://dev-tezmln0tk0g1gouf.eu.auth0.com/.well-known/jwks.json)

## 🔄 Mise à Jour

- **Dernière mise à jour** : 23 Août 2025
- **Version** : 1.0
- **Auteur** : Équipe Wanzo Backend

---

> ⚠️ **Important** : Ce document doit être mis à jour si la configuration Auth0 change (domain, audience, etc.)
