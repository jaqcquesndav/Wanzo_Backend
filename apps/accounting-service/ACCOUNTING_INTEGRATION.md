# Guide d'intégration du Service Accounting avec le Backend Wanzo

Ce document explique comment configurer et intégrer correctement le service de comptabilité avec l'architecture microservices de Wanzo, en utilisant l'API Gateway, Auth0 pour l'authentification, et les fonctionnalités spécifiques du service accounting.

## Architecture de Communication

L'interface de comptabilité doit suivre le flux suivant pour communiquer avec le backend :

1. **Authentication** : Utilisation d'Auth0 pour l'authentification des utilisateurs (employés, experts-comptables).
2. **API Gateway** : Point d'entrée principal pour toutes les requêtes.
3. **Microservices** : Accès aux fonctionnalités comptables via le service dédié.

```
┌─────────────┐       ┌────────────┐       ┌───────────────┐
│ Accounting UI│──────▶│  Auth0     │──────▶│ JWT Token     │
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
            │ Accounting    │        │ Admin Service│    │ App Mobile    │     │ Autres        │
            │ Service       │        │ (port 3001)  │    │ Service       │     │ Microservices │
            │ (port 3002)   │        └─────────────┘    │ (port 3006)   │     └───────────────┘
            └───────────────┘                           └─────────────┘
```

## Structure des URL et Endpoints

### Format des URL

Toutes les requêtes de l'interface de comptabilité doivent suivre ce format :

```
[BASE_URL]/accounting/[ENDPOINT]
```

Où :
- **BASE_URL** : L'URL de base de l'API Gateway
  - Production : `https://api.wanzo.com`
  - Développement : `http://localhost:8000` (API Gateway tourne sur le port 8000)
- **accounting** : Le préfixe qui identifie le service de comptabilité dans l'API Gateway
- **ENDPOINT** : Le chemin spécifique vers la ressource

Exemples d'URL complètes :
- `http://localhost:8000/accounting/invoices` - Pour gérer les factures (développement)
- `https://api.wanzo.com/accounting/reports/financial-summary` - Pour accéder aux rapports financiers (production)

### Principaux Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/accounting/auth/validate-token` | POST | Validation et enrichissement du token JWT |
| `/accounting/auth/me` | GET | Récupération du profil utilisateur comptable |
| `/accounting/invoices` | GET/POST | Gestion des factures |
| `/accounting/payments` | GET/POST | Gestion des paiements |
| `/accounting/charts-of-accounts` | GET/PUT | Gestion des plans comptables |
| `/accounting/reports/financial-summary`| GET | Rapports financiers |
| `/accounting/tax-rates` | GET | Liste des taux de taxe |
| `/accounting/documents` | GET/POST | Gestion des documents comptables |

## Configuration Requise pour l'Interface de Comptabilité

### 1. Endpoints et Variables d'Environnement

Votre application frontend de comptabilité doit être configurée avec les endpoints suivants :

```javascript
// Fichier env.js pour les variables d'environnement

const config = {
  // API Gateway comme point d'entrée principal
  apiGatewayUrl: 'http://localhost:8000', // Port 8000 pour l'API Gateway
  
  // Préfixe pour le service de comptabilité
  accountingPrefix: 'accounting',
  
  // Configuration Auth0
  auth0Domain: 'dev-tezmln0tk0g1gouf.eu.auth0.com',
  auth0ClientId: 'YOUR_CLIENT_ID', // Remplacez par le Client ID approprié
  auth0Audience: 'https://api.wanzo.com',
  auth0RedirectUri: 'http://localhost:5174/callback', // Port différent pour l'UI comptable
  auth0LogoutUri: 'http://localhost:5174',
};

export default config;
```

⚠️ **Important** : Pour le développement, assurez-vous que l'URL de l'API Gateway est correctement configurée avec le port 8000. En production, utilisez le domaine approprié.

### 2. Configuration Auth0

Assurez-vous que votre application de comptabilité est correctement configurée pour utiliser Auth0 :

1. **Dépendances requises** :
   - `auth0-spa-js`: Pour gérer l'authentification Auth0 dans une application SPA
   - `axios`: Pour les appels API

2. **Redirection URIs** :
   - Dans le tableau de bord Auth0, configurez les URI de redirection pour l'application comptable :
     - Login Callback: `http://localhost:5174/callback` (développement)
     - Logout Callback: `http://localhost:5174` (développement)
     - Login Callback: `https://accounting.wanzo.com/callback` (production)
     - Logout Callback: `https://accounting.wanzo.com` (production)

3. **Règles Auth0** :
   - Créez des règles pour assigner les rôles comptables (ex: `accountant`, `auditor`).
   - Assurez-vous que les tokens contiennent les claims `role` et `permissions`.

### 3. Gestion des Tokens JWT

L'application doit gérer les tokens JWT de manière sécurisée, y compris le stockage, le rafraîchissement et l'inclusion dans les en-têtes `Authorization: Bearer <token>`.

### 4. Structure des En-têtes de Requête

```javascript
const getHeaders = async () => {
  const token = await getAccessToken();
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Accounting-Client': 'Wanzo-Accounting-UI/1.0.0'
  };
};
```

### 5. Exemple d'Appel API

Utilisez toujours l'API Gateway comme point d'entrée principal :

```javascript
// api-service.js

export const get = async (endpoint) => {
  try {
    const url = `${config.apiGatewayUrl}/${config.accountingPrefix}/${endpoint}`;
    const headers = await getHeaders();
    
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    // Gérer les erreurs (ex: 401 Unauthorized)
    throw error;
  }
};
```

## Processus d'Authentification et Flux de Token

Le flux d'authentification suit le modèle standard OAuth2/OIDC avec Auth0. Le token JWT obtenu est validé par le `accounting-service` à chaque requête.

1. L'API Gateway (port 8000) reçoit la requête (ex: `/accounting/invoices`).
2. Il identifie le service cible (`accounting-service`) via le préfixe `accounting`.
3. Il retire le préfixe et transmet la requête au `accounting-service` (port 3002).
4. Le `accounting-service` valide le token JWT (signature, expiration, audience) et les permissions de l'utilisateur.
5. Si tout est valide, la requête est traitée.

## Points à vérifier pour assurer une connexion correcte

1. **Vérifiez les tokens** : Assurez-vous que les tokens JWT sont valides, non expirés, et contiennent l'audience `https://api.wanzo.com` ainsi que les rôles appropriés.
2. **Dépannage de l'API Gateway** : En cas d'erreur 401/403, vérifiez la validité du token et les permissions associées.
3. **Tests de bout en bout** : Testez le flux complet depuis l'authentification jusqu'à l'appel d'un endpoint protégé du service de comptabilité.

## Bonnes Pratiques de Sécurité

1. **Utilisez HTTPS** en production.
2. **Implémentez une déconnexion après inactivité**.
3. **Principe du moindre privilège** pour les rôles et permissions.
4. **Journalisez toutes les actions comptables** pour l'audit et la traçabilité.

---

En suivant ces instructions, votre interface de comptabilité devrait pouvoir s'intégrer et communiquer de manière sécurisée avec le backend Wanzo.
