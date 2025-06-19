# Guide d'intégration du Service Admin avec le Backend Wanzo

Ce document explique comment configurer et intégrer correctement le service d'administration avec l'architecture microservices de Wanzo, en utilisant l'API Gateway, Auth0 pour l'authentification, et les fonctionnalités spécifiques du service admin.

## Architecture de Communication

L'interface d'administration doit suivre le flux suivant pour communiquer avec le backend :

1. **Authentication** : Utilisation d'Auth0 pour l'authentification des utilisateurs administrateurs
2. **API Gateway** : Point d'entrée principal pour toutes les requêtes
3. **Microservices** : Accès aux fonctionnalités spécifiques via les différents microservices

```
┌─────────────┐       ┌────────────┐       ┌───────────────┐
│ Admin UI    │──────▶│  Auth0     │──────▶│ JWT Token     │
└─────────────┘       └────────────┘       └───────────────┘
       │                                            │
       │                                            ▼
       │                                    ┌───────────────┐
       └───────────────────────────────────▶│  API Gateway  │
                                            └───────────────┘
                                                    │
                    ┌────────────────────────┬─────┴─────┬─────────────────────┐
                    ▼                        ▼           ▼                     ▼
            ┌───────────────┐        ┌─────────────┐    ┌───────────────┐     ┌───────────────┐
            │ Admin Service │        │ App Mobile  │    │ Accounting    │     │ Autres        │
            │ (port 3001)   │        │ Service     │    │ Service       │     │ Microservices │
            └───────────────┘        │ (port 3006) │    └───────────────┘     └───────────────┘
                                     └─────────────┘
```

## Structure des URL et Endpoints

### Format des URL

Toutes les requêtes de l'interface d'administration doivent suivre ce format :

```
[BASE_URL]/admin/[ENDPOINT]
```

Où :
- **BASE_URL** : L'URL de base de l'API Gateway
  - Production : `https://api.wanzo.com`
  - Développement : `http://localhost:8000` (API Gateway tourne sur le port 8000)
- **admin** : Le préfixe qui identifie le service admin dans l'API Gateway
- **ENDPOINT** : Le chemin spécifique vers la ressource

Exemples d'URL complètes :
- `http://localhost:8000/admin/auth/login` - Pour se connecter (développement)
- `http://localhost:8000/admin/users` - Pour gérer les utilisateurs (développement)
- `https://api.wanzo.com/admin/dashboard/stats` - Pour accéder aux statistiques du tableau de bord (production)

### Principaux Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/admin/auth/validate-token` | POST | Validation et enrichissement du token JWT |
| `/admin/auth/me` | GET | Récupération du profil administrateur |
| `/admin/users` | GET/POST | Gestion des utilisateurs |
| `/admin/companies` | GET/POST | Gestion des entreprises |
| `/admin/settings` | GET/PUT | Configuration du système |
| `/admin/dashboard/stats` | GET | Statistiques du tableau de bord |
| `/admin/customers` | GET | Liste des clients |
| `/admin/documents` | GET/POST | Gestion des documents |
| `/admin/tokens` | GET/POST | Gestion des tokens et crédits |

## Configuration Requise pour l'Interface d'Administration

### 1. Endpoints et Variables d'Environnement

Votre application frontend d'administration doit être configurée avec les endpoints suivants :

```javascript
// Fichier env.js pour les variables d'environnement

const config = {
  // API Gateway comme point d'entrée principal
  apiGatewayUrl: 'http://localhost:8000', // Port 8000 pour l'API Gateway
  
  // Préfixe pour le service admin
  adminPrefix: 'admin',
  
  // Configuration Auth0
  auth0Domain: 'dev-tezmln0tk0g1gouf.eu.auth0.com',
  auth0ClientId: '43d64kgsVYyCZHEFsax7zlRBVUiraCKL',
  auth0Audience: 'https://api.wanzo.com',
  auth0RedirectUri: 'http://localhost:5173/callback',
  auth0LogoutUri: 'http://localhost:5173',
};

export default config;
```

⚠️ **Important** : Pour le développement, assurez-vous que l'URL de l'API Gateway est correctement configurée avec le port 8000. En production, utilisez le domaine approprié.

### 2. Configuration Auth0

Assurez-vous que votre application d'administration est correctement configurée pour utiliser Auth0 :

1. **Dépendances requises** :
   - `auth0-spa-js`: Pour gérer l'authentification Auth0 dans une application SPA
   - `axios`: Pour les appels API
   - `jwt-decode`: Pour décoder et analyser les JWT tokens

2. **Redirection URIs** :
   - Dans le tableau de bord Auth0, configurez les URI de redirection suivants :
     - Login Callback: `http://localhost:5173/callback` (développement)
     - Logout Callback: `http://localhost:5173` (développement)
     - Login Callback: `https://admin.wanzo.com/callback` (production)
     - Logout Callback: `https://admin.wanzo.com` (production)

3. **Types de Grant** :
   - Activez les types "Authorization Code" et "Refresh Token"
   - Vérifiez que l'audience `https://api.wanzo.com` est configurée correctement

4. **Règles Auth0** :
   - Créez une règle pour assigner les rôles d'administrateur
   - Assurez-vous que les tokens contiennent les claims `role` et `permissions`

### 3. Gestion des Tokens JWT

L'application d'administration doit gérer correctement les tokens JWT :

1. **Stockage sécurisé** : Stockez les tokens dans `localStorage` ou `sessionStorage` selon vos besoins de sécurité
2. **Rafraîchissement automatique** : Implémentez la logique pour rafraîchir les tokens expirés
3. **Envoi dans les en-têtes** : Incluez le token dans l'en-tête `Authorization: Bearer <token>` pour toutes les requêtes API

Voici un exemple de gestionnaire de tokens :

```javascript
// auth-service.js

export const getAccessToken = async () => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) return null;
  
  // Vérifier si le token a expiré
  const decodedToken = jwt_decode(token);
  const currentTime = Date.now() / 1000;
  
  if (decodedToken.exp < currentTime) {
    // Token expiré, essayer de le rafraîchir
    const refreshed = await refreshToken();
    if (!refreshed) {
      // Rediriger vers la page de connexion
      return null;
    }
    return localStorage.getItem('auth_token');
  }
  
  return token;
};
```

### 4. Structure des En-têtes de Requête

Pour toutes les requêtes API, incluez les en-têtes suivants :

```javascript
const getHeaders = async () => {
  const token = await getAccessToken();
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Admin-Client': 'Wanzo-Admin-Dashboard/1.0.0'
  };
};
```

### 5. Exemple d'Appel API

Utilisez toujours l'API Gateway comme point d'entrée principal :

```javascript
// api-service.js

import axios from 'axios';
import config from './config';
import { getHeaders } from './auth-service';

export const get = async (endpoint) => {
  try {
    // Construire l'URL complète avec le préfixe du service admin
    const url = `${config.apiGatewayUrl}/${config.adminPrefix}/${endpoint}`;
    const headers = await getHeaders();
    
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Token invalide ou expiré
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }
    throw error;
  }
};

export const post = async (endpoint, data) => {
  try {
    const url = `${config.apiGatewayUrl}/${config.adminPrefix}/${endpoint}`;
    const headers = await getHeaders();
    
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      window.location.href = '/login';
    }
    throw error;
  }
};
```

## Processus d'Authentification et Flux de Token

### 1. Flux d'Authentification

1. **Connexion** :
   - L'utilisateur est redirigé vers Auth0 pour l'authentification
   - Après une authentification réussie, Auth0 renvoie un token JWT
   - Le token est stocké localement et utilisé pour les requêtes API

2. **Validation du token** :
   - URL : `POST /admin/auth/validate-token`
   - En-tête : Contient le token JWT dans l'en-tête Authorization
   - Réponse : Renvoie les informations de profil enrichies et confirme la validité du token

3. **Obtention du profil** :
   - URL : `GET /admin/auth/me`
   - En-tête : Contient le token JWT dans l'en-tête Authorization
   - Réponse : Renvoie les informations du profil administrateur

### 2. Traitement du Token par l'API Gateway et les Microservices

1. L'API Gateway (port 8000) reçoit la requête (ex: `/admin/users`).
2. Il identifie le service cible (`admin-service`) en fonction du préfixe (`admin`).
3. Il retire le préfixe de l'URL (transforme `/admin/users` en `/users`).
4. Il transmet la requête au service admin-service (port 3001).
5. Le service admin-service valide le token JWT :
   - Vérification qu'il n'est pas dans la liste noire (TokenBlacklist)
   - Validation avec Auth0 via la stratégie JWT configurée (signature, émetteur, audience, expiration)
6. Si le token est valide, la requête est traitée et la réponse est renvoyée à l'API Gateway.
7. L'API Gateway renvoie cette réponse au client (interface d'administration).

### 3. Gestion des Erreurs d'Authentification

| Code | Description | Action à prendre |
|------|-------------|------------------|
| 401 | Token invalide ou expiré | Rafraîchir le token ou rediriger vers la page de connexion |
| 403 | Permissions insuffisantes | Vérifier les rôles et les permissions de l'utilisateur |
| 422 | Données de requête invalides | Vérifier le format des données envoyées |
| 500 | Erreur serveur | Contacter l'équipe support ou réessayer plus tard |

## Fonctionnement du Routage dans l'API Gateway

### Mécanisme de Routage

L'API Gateway (port 8000) sert de point d'entrée unique pour toutes les requêtes et les route vers les services appropriés en fonction du préfixe d'URL.

1. **Identification du service**:
   ```
   https://api.wanzo.com/admin/users
                     ^^^^^
                    Préfixe qui identifie le service admin
   ```

2. **Transformation de l'URL**:
   - URL reçue par l'API Gateway: `/admin/users`
   - URL transmise au service: `/users`

3. **Circuit Breaker**:
   L'API Gateway implémente un pattern Circuit Breaker qui empêche les requêtes d'être envoyées à un service indisponible.

4. **Load Balancing**:
   Si plusieurs instances d'un service sont disponibles, l'API Gateway répartit les requêtes entre elles.

### Exemple concret de flux de requête

Prenons l'exemple d'une requête pour récupérer la liste des utilisateurs:

1. Le client envoie: `GET http://localhost:8000/admin/users?role=manager`
2. L'API Gateway:
   - Identifie le préfixe `admin`
   - Détermine que la requête doit être envoyée au service `admin-service`
   - Transforme l'URL en retirant le préfixe: `/users?role=manager`
   - Transfère la requête à: `http://localhost:3001/users?role=manager`
3. Le service admin-service:
   - Reçoit la requête comme si elle était adressée directement à lui
   - Vérifie l'authentification via le token JWT
   - Traite la requête et renvoie la réponse
4. L'API Gateway renvoie la réponse au client

### Gestion des erreurs

Si un service est indisponible ou répond avec une erreur:
- **Circuit ouvert**: L'API Gateway peut bloquer temporairement les requêtes vers un service défaillant
- **Timeout**: Une requête peut expirer si le service prend trop de temps à répondre
- **Retry**: Dans certains cas, l'API Gateway peut réessayer une requête ayant échoué

Cette architecture permet une grande flexibilité et scalabilité tout en simplifiant l'accès pour les clients qui n'ont besoin de connaître qu'un seul point d'entrée.

## Points à vérifier pour assurer une connexion correcte

1. **Vérifiez les tokens** :
   - Assurez-vous que les tokens JWT sont correctement reçus d'Auth0
   - Vérifiez que les tokens contiennent bien l'audience `https://api.wanzo.com`
   - Confirmez que le token est envoyé avec chaque requête API
   - Vérifiez que les claims de rôle (role) et permissions sont présents

2. **Dépannage de l'API Gateway** :
   - Si vous recevez des erreurs 401, vérifiez que le token est valide et non expiré
   - Si vous recevez des erreurs 403, vérifiez les permissions de l'utilisateur administrateur
   - Si vous rencontrez des problèmes de CORS, assurez-vous que les en-têtes appropriés sont configurés côté serveur

3. **Tests de bout en bout** :
   - Testez le flux complet : authentification → obtention du token → appel API
   - Vérifiez le rafraîchissement du token : laissez le token expirer et confirmez qu'il est automatiquement rafraîchi
   - Testez la déconnexion : assurez-vous que les tokens sont correctement supprimés

## Environnements de déploiement

Adaptez vos configurations selon l'environnement :

| Environnement | API Gateway URL | Interface Admin URL | Configuration |
|---------------|-----------------|---------------------|---------------|
| Développement | `http://localhost:8000` | `http://localhost:5173` | Utilisez des variables d'environnement locales |
| Test | `https://api-test.wanzo.com` | `https://admin-test.wanzo.com` | Configuration spécifique aux tests |
| Production | `https://api.wanzo.com` | `https://admin.wanzo.com` | Configuration de production sécurisée |

Pour le développement sur un appareil physique (téléphone/tablette), remplacez `localhost` par l'adresse IP de votre machine sur le réseau local (ex: `http://192.168.1.100:8000`).

Créez des profils de configuration séparés pour chaque environnement.

## Bonnes Pratiques de Sécurité

1. **Ne stockez pas d'informations sensibles** dans le localStorage ou sessionStorage.
2. **Utilisez HTTPS** pour toutes les communications en production.
3. **Implémentez une déconnexion après inactivité** pour les sessions administrateur.
4. **Limitez les permissions** accordées aux différents rôles administrateurs.
5. **Journalisez toutes les actions administratives** pour audit et traçabilité.
6. **Mettez en place une authentification à deux facteurs** pour les comptes administrateurs.

## Assistance et dépannage

Si vous rencontrez des problèmes de connexion :

1. **Logs et débogage** :
   - Activez les logs détaillés dans l'interface d'administration
   - Vérifiez les logs du serveur pour les erreurs d'authentification ou d'autorisation

2. **Outils de débogage** :
   - Utilisez les outils de développement du navigateur pour inspecter les requêtes et réponses
   - Utilisez Postman ou Insomnia pour tester les API indépendamment de l'interface
   - Vérifiez les tokens JWT sur [jwt.io](https://jwt.io) pour confirmer leur validité

3. **Support** :
   - Pour les problèmes d'authentification : contactez l'équipe Auth0 ou l'administrateur Auth0
   - Pour les problèmes d'API : contactez l'équipe backend

---

En suivant ces instructions, votre interface d'administration devrait pouvoir se connecter correctement au backend Wanzo, en utilisant Auth0 pour l'authentification et l'API Gateway pour accéder aux différents microservices.
