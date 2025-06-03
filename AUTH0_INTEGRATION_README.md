# Wanzo Backend - Guide d'intégration Auth0 et configuration des frontends

Ce document fournit les informations nécessaires pour configurer Auth0 et les différentes applications frontend qui interagissent avec le backend Wanzo.

## Table des matières

1. [Architecture microservices](#1-architecture-microservices)
2. [Configuration Auth0](#2-configuration-auth0)
3. [Configuration des frontends](#3-configuration-des-frontends)
4. [Flux d'authentification](#4-flux-dauthentification)
5. [Points d'API à configurer](#5-points-dapi-à-configurer)
6. [URLs pour les applications frontend](#6-urls-pour-les-applications-frontend)
7. [Configuration du backend](#7-configuration-du-backend)
8. [Types d'utilisateurs et rôles](#8-types-dutilisateurs-et-rôles)
9. [Relations entre applications Auth0 et microservices](#9-relations-entre-applications-auth0-et-microservices)

## 1. Architecture microservices

L'architecture Wanzo Backend est composée des microservices suivants :

- **API Gateway** (`api-gateway`) : Point d'entrée centralisé pour toutes les requêtes
- **Auth Service** (`auth-service`) : Gestion de l'authentification et des autorisations
- **Admin Service** (`admin-service`) : Fonctionnalités administratives pour les utilisateurs internes
- **App Mobile Service** (`app_mobile_service`) : Services pour l'application mobile
- **Accounting Service** (`accounting-service`) : Gestion de la comptabilité
- **Portfolio SME Service** (`portfolio-sme-service`) : Gestion des portefeuilles PME
- **Portfolio Institution Service** (`portfolio-institution-service`) : Gestion des portefeuilles institutions
- **Analytics Service** (`analytics-service`) : Service d'analyse de données

Les services communiquent entre eux via HTTP REST et sont configurés pour utiliser Auth0 comme fournisseur d'identité centralisé.

## 2. Configuration Auth0

### 2.1. Créer un tenant Auth0

1. Rendez-vous sur [Auth0 Dashboard](https://auth0.com) et créez un nouveau tenant
2. Nommez votre tenant (par exemple `wanzo-kiota`)
3. Choisissez la région la plus proche de votre public cible

### 2.2. Configurer les Applications dans Auth0

Vous devrez créer plusieurs applications pour gérer les différentes interfaces frontend :

#### a. Application pour le Service d'Authentification (auth-service)
```
Nom: Wanzo Auth Service
Type: Regular Web Application
Allowed Callback URLs: http://localhost:3000/auth/callback, https://api.wanzo.com/auth/callback
Allowed Logout URLs: http://localhost:3000, https://api.wanzo.com
Allowed Web Origins: http://localhost:3000, https://api.wanzo.com
```

#### b. Application Web Admin Panel
```
Nom: Wanzo Admin Panel
Type: Regular Web Application
Allowed Callback URLs: http://localhost:5173/admin/callback, https://admin.wanzo.com/callback
Allowed Logout URLs: http://localhost:5173/admin, https://admin.wanzo.com
Allowed Web Origins: http://localhost:5173, https://admin.wanzo.com
```

#### c. Application Web Comptabilité
```
Nom: Wanzo Comptabilité
Type: Regular Web Application
Allowed Callback URLs: http://localhost:5174/accounting/callback, https://accounting.wanzo.com/callback
Allowed Logout URLs: http://localhost:5174/accounting, https://accounting.wanzo.com
Allowed Web Origins: http://localhost:5174, https://accounting.wanzo.com
```

#### d. Application Portefeuille PME
```
Nom: Wanzo Portefeuille PME
Type: Regular Web Application
Allowed Callback URLs: http://localhost:5175/portfolio/sme/callback, https://sme.wanzo.com/callback
Allowed Logout URLs: http://localhost:5175/portfolio/sme, https://sme.wanzo.com
Allowed Web Origins: http://localhost:5175, https://sme.wanzo.com
```

#### e. Application Portefeuille Institution
```
Nom: Wanzo Portefeuille Institution
Type: Regular Web Application
Allowed Callback URLs: http://localhost:5176/portfolio/institution/callback, https://institution.wanzo.com/callback
Allowed Logout URLs: http://localhost:5176/portfolio/institution, https://institution.wanzo.com
Allowed Web Origins: http://localhost:5176, https://institution.wanzo.com
```

#### f. Application Mobile
```
Nom: Wanzo Mobile App
Type: Native Application
Allowed Callback URLs: com.wanzo.app://callback
Allowed Logout URLs: com.wanzo.app://logout
```

### 2.3. Créer une API dans Auth0

```
Nom: Wanzo Backend API
Identifiant: https://api.wanzo.com
Permissions (scopes):
- openid
- profile
- email
- admin:full
- users:manage
- settings:manage
- mobile:read
- mobile:write
- analytics:read
- analytics:write
- accounting:read
- accounting:write
- portfolio:read
- portfolio:write
- institution:manage
```

### 2.4. Configurer les Rôles

Créez les rôles suivants dans Auth0 :
- admin
- superadmin
- user
- manager
- accountant
- viewer
- owner
- cashier
- sales
- inventory_manager
- staff
- customer_support
- analyst
- content_manager
- growth_finance
- cto

### 2.5. Règles Auth0

Créez une règle pour assigner automatiquement des permissions basées sur les rôles :

```javascript
function (user, context, callback) {
  const namespace = 'https://api.wanzo.com/';
  const assignedRoles = (context.authorization || {}).roles || [];

  let permissions = [];
  
  // Assignez des permissions basées sur les rôles
  if (assignedRoles.includes('admin') || assignedRoles.includes('superadmin')) {
    permissions = [
      'admin:full',
      'users:manage',
      'settings:manage',
      'analytics:read',
      'analytics:write',
      'accounting:read',
      'accounting:write',
      'portfolio:read',
      'portfolio:write',
      'institution:manage'
    ];
  } 
  else if (assignedRoles.includes('accountant')) {
    permissions = [
      'accounting:read',
      'accounting:write'
    ];
  }
  else if (assignedRoles.includes('manager')) {
    permissions = [
      'users:manage',
      'analytics:read',
      'portfolio:read',
      'portfolio:write'
    ];
  }
  else if (assignedRoles.includes('analyst')) {
    permissions = [
      'analytics:read',
      'analytics:write',
      'portfolio:read'
    ];
  }
  else if (assignedRoles.includes('viewer')) {
    permissions = [
      'analytics:read',
      'portfolio:read',
      'accounting:read'
    ];
  }
  else if (assignedRoles.includes('owner')) {
    permissions = [
      'mobile:read',
      'mobile:write',
      'users:manage'
    ];
  }
  else {
    permissions = [
      'mobile:read'
    ];
  }

  // Ajouter les permissions au token
  context.accessToken[namespace + 'permissions'] = permissions;
  context.accessToken[namespace + 'companyId'] = user.app_metadata.companyId || '';
  
  callback(null, user, context);
}
```

### 2.6. Créer une application Machine-to-Machine

```
Nom: Wanzo Management API Client
Type: Machine to Machine
Authorized API: Auth0 Management API
Permissions: 
- read:users
- create:users
- update:users
- delete:users
- read:roles
- create:role_members
- read:user_idp_tokens
```

### 2.7. Règle Auth0 pour l'identification de l'application source

Pour identifier précisément l'application source d'un utilisateur, ajoutez cette règle dans Auth0 :

```javascript
function (user, context, callback) {
  const namespace = 'https://api.wanzo.com/';
    // Déterminer l'application source basée sur le client_id
  let appSource = "unknown";
  
  if (context.clientID === "<AUTH_SERVICE_CLIENT_ID>") {
    appSource = "auth-service";
  } else if (context.clientID === "<ADMIN_CLIENT_ID>") {
    appSource = "admin-panel";
  } else if (context.clientID === "<ACCOUNTING_CLIENT_ID>") {
    appSource = "accounting-app";
  } else if (context.clientID === "<SME_CLIENT_ID>") {
    appSource = "sme-portfolio";
  } else if (context.clientID === "<INSTITUTION_CLIENT_ID>") {
    appSource = "institution-portfolio";
  } else if (context.clientID === "<MOBILE_CLIENT_ID>") {
    appSource = "mobile-app";
  }
  
  // Ajouter la source au token
  context.accessToken[namespace + 'app_source'] = appSource;
  
  // Continuer avec l'assignation des permissions basée sur les rôles
  const assignedRoles = (context.authorization || {}).roles || [];
  
  // Ajouter le rôle principal au token
  context.accessToken[namespace + 'role'] = assignedRoles[0] || 'user';
  
  // Ajouter tous les rôles au token
  context.accessToken[namespace + 'roles'] = assignedRoles;
  
  // Continuer avec les permissions comme dans la règle existante
  // ...
  
  callback(null, user, context);
}
```

Cette règle enrichit le token JWT avec l'information de l'application source, ce qui permet d'identifier facilement d'où provient l'utilisateur lors de chaque requête.

## 3. Configuration des frontends

### 3.1. Configuration pour l'application web Admin

```javascript
// Configuration Auth0 pour l'admin panel
const authConfig = {
  domain: 'wanzo-kiota.auth0.com',
  clientId: '<ADMIN_CLIENT_ID>',
  audience: 'https://api.wanzo.com',
  redirectUri: window.location.origin + '/admin/callback',
  logoutRedirectUri: window.location.origin + '/admin',
  scope: 'openid profile email admin:full users:manage settings:manage'
};

// URL de l'API
const apiUrl = 'https://api.wanzo.com';
```

### 3.2. Configuration pour l'application web Comptabilité

```javascript
// Configuration Auth0 pour l'application comptabilité
const authConfig = {
  domain: 'wanzo-kiota.auth0.com',
  clientId: '<ACCOUNTING_CLIENT_ID>',
  audience: 'https://api.wanzo.com',
  redirectUri: window.location.origin + '/accounting/callback',
  logoutRedirectUri: window.location.origin + '/accounting',
  scope: 'openid profile email accounting:read accounting:write'
};

// URL de l'API
const apiUrl = 'https://api.wanzo.com';
```

### 3.3. Configuration pour l'application Portefeuille PME

```javascript
// Configuration Auth0 pour l'application Portefeuille PME
const authConfig = {
  domain: 'wanzo-kiota.auth0.com',
  clientId: '<SME_CLIENT_ID>',
  audience: 'https://api.wanzo.com',
  redirectUri: window.location.origin + '/portfolio/sme/callback',
  logoutRedirectUri: window.location.origin + '/portfolio/sme',
  scope: 'openid profile email portfolio:read portfolio:write'
};

// URL de l'API
const apiUrl = 'https://api.wanzo.com';
```

### 3.4. Configuration pour l'application Portefeuille Institution

```javascript
// Configuration Auth0 pour l'application Portefeuille Institution
const authConfig = {
  domain: 'wanzo-kiota.auth0.com',
  clientId: '<INSTITUTION_CLIENT_ID>',
  audience: 'https://api.wanzo.com',
  redirectUri: window.location.origin + '/portfolio/institution/callback',
  logoutRedirectUri: window.location.origin + '/portfolio/institution',
  scope: 'openid profile email portfolio:read portfolio:write institution:manage'
};

// URL de l'API
const apiUrl = 'https://api.wanzo.com';
```

### 3.5. Configuration pour l'application Mobile

```javascript
// Configuration Auth0 pour l'application mobile (React Native)
const authConfig = {
  domain: 'wanzo-kiota.auth0.com',
  clientId: '<MOBILE_CLIENT_ID>',
  audience: 'https://api.wanzo.com',
  redirectUri: 'com.wanzo.app://callback',
  logoutRedirectUri: 'com.wanzo.app://logout',
  scope: 'openid profile email mobile:read mobile:write'
};

// URL de l'API
const apiUrl = 'https://api.wanzo.com';
```

## 4. Flux d'authentification

### 4.1. Flux pour les applications web
- Utilisez le flux Authorization Code avec PKCE
- Lors de la connexion, redirigez les utilisateurs vers la page de connexion Auth0
- Après authentification, Auth0 redirige vers l'URL de callback configurée
- Récupérez et stockez les tokens (access_token, id_token, refresh_token)
- Utilisez l'access_token pour les appels API

### 4.2. Flux pour l'application mobile
- Utilisez le flux Authorization Code avec PKCE
- Utilisez la bibliothèque Auth0 React Native pour gérer l'authentification
- Gérez les URI de redirection pour la plateforme mobile

## 5. Points d'API à configurer

Pour faciliter l'intégration, vous devrez exposer ces points d'API dans votre service d'authentification :

1. `/auth/login` - Authentification des utilisateurs
2. `/auth/register` - Enregistrement des nouveaux utilisateurs
3. `/auth/refresh-token` - Rafraîchissement des tokens expirés
4. `/auth/me` - Récupération des informations de l'utilisateur connecté
5. `/auth/logout` - Déconnexion de l'utilisateur
6. `/auth/roles` - Récupération des rôles disponibles
7. `/auth/permissions` - Récupération des permissions de l'utilisateur

## 6. URLs pour les applications frontend

### 6.1. App web Admin
- **Développement**: http://localhost:5173
- **Production**: https://admin.wanzo.com

### 6.2. App web Comptabilité
- **Développement**: http://localhost:5174
- **Production**: https://accounting.wanzo.com

### 6.3. App web Portefeuille PME
- **Développement**: http://localhost:5175
- **Production**: https://sme.wanzo.com

### 6.4. App web Portefeuille Institution
- **Développement**: http://localhost:5176
- **Production**: https://institution.wanzo.com

### 6.5. App Mobile
- **URL du schéma**: com.wanzo.app://
- **API Gateway**: https://api.wanzo.com

## 7. Configuration du backend

Vous devez mettre à jour le fichier `.env` dans chaque service pour inclure les informations d'Auth0 :

```bash
# Auth0 configuration
AUTH0_DOMAIN=wanzo-kiota.auth0.com
AUTH0_CLIENT_ID=<AUTH_SERVICE_CLIENT_ID>
AUTH0_CLIENT_SECRET=<AUTH_SERVICE_CLIENT_SECRET>
AUTH0_AUDIENCE=https://api.wanzo.com
AUTH0_ISSUER_URL=https://wanzo-kiota.auth0.com/
AUTH0_JWKS_URI=https://wanzo-kiota.auth0.com/.well-known/jwks.json

# Management API credentials - Important pour les opérations de gestion des utilisateurs et rôles
AUTH0_MANAGEMENT_API_AUDIENCE=https://wanzo-kiota.auth0.com/api/v2/
AUTH0_MANAGEMENT_API_CLIENT_ID=<MANAGEMENT_API_CLIENT_ID>
AUTH0_MANAGEMENT_API_CLIENT_SECRET=<MANAGEMENT_API_CLIENT_SECRET>
```

### 7.1. Configuration spécifique du service d'authentification (auth-service)

Le microservice `auth-service` joue un rôle central dans l'architecture et nécessite une configuration particulière avec **deux applications Auth0 distinctes** :

#### 7.1.1. Application Web Regular pour l'authentification générale

Cette application est utilisée pour l'authentification des utilisateurs et les opérations générales :

```bash
# Configuration principale pour l'auth-service
AUTH0_DOMAIN=wanzo-kiota.auth0.com
AUTH0_CLIENT_ID=<AUTH_SERVICE_CLIENT_ID>             # ID de l'application "Wanzo Auth Service"
AUTH0_CLIENT_SECRET=<AUTH_SERVICE_CLIENT_SECRET>     # Secret de l'application "Wanzo Auth Service"
AUTH0_AUDIENCE=https://api.wanzo.com
AUTH0_CALLBACK_URL=http://localhost:3000/auth/callback
AUTH0_LOGOUT_URL=http://localhost:3000

# URLs des services pour la communication inter-services
ADMIN_SERVICE_URL=http://localhost:3001
APP_MOBILE_SERVICE_URL=http://localhost:3006
PORTFOLIO_SME_SERVICE_URL=http://localhost:3004
PORTFOLIO_INSTITUTION_SERVICE_URL=http://localhost:3005
ACCOUNTING_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3002
```

#### 7.1.2. Application Machine-to-Machine pour l'API Management

Cette application est nécessaire pour gérer programmatiquement les utilisateurs, rôles et règles :

```bash
# Configuration pour l'API Management Auth0
AUTH0_MANAGEMENT_API_AUDIENCE=https://wanzo-kiota.auth0.com/api/v2/
AUTH0_MANAGEMENT_API_CLIENT_ID=<MANAGEMENT_API_CLIENT_ID>         # ID de l'application "Wanzo Management API Client"
AUTH0_MANAGEMENT_API_CLIENT_SECRET=<MANAGEMENT_API_CLIENT_SECRET> # Secret de l'application "Wanzo Management API Client"
```

#### 7.1.3. Configuration NestJS pour Auth0

Dans le fichier `apps/auth-service/src/config/auth0.config.ts`, assurez-vous que la configuration suivante est correctement définie :

```typescript
export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
  audience: string;
  callbackUrl: string;
  logoutUrl: string;
  managementApiAudience: string;
  managementApiClientId: string;
  managementApiClientSecret: string;
  managementApiScopes: string[];
}

export default registerAs('auth0', (): Auth0Config => ({
  domain: process.env.AUTH0_DOMAIN || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  audience: process.env.AUTH0_AUDIENCE || 'https://api.wanzo.com',
  callbackUrl: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/auth/callback',
  logoutUrl: process.env.AUTH0_LOGOUT_URL || 'http://localhost:3000',
  managementApiAudience: process.env.AUTH0_MANAGEMENT_API_AUDIENCE || 'https://wanzo-kiota.auth0.com/api/v2/',
  managementApiClientId: process.env.AUTH0_MANAGEMENT_API_CLIENT_ID || '',
  managementApiClientSecret: process.env.AUTH0_MANAGEMENT_API_CLIENT_SECRET || '',
  managementApiScopes: [
    'read:users',
    'create:users',
    'update:users',
    'delete:users',
    'read:roles',
    'create:roles',
    'create:role_members',
    'delete:role_members',
    'read:user_idp_tokens'
  ],
}));
```

#### 7.1.4. Vérification de la configuration

Pour vérifier que la configuration de l'auth-service est correcte, vous pouvez exécuter :

```bash
cd apps/auth-service
npm run start:dev
```

Puis tester un endpoint basique comme `/auth/health` qui devrait retourner un statut 200 si le service est correctement configuré.

### 7.2. Implémentation du service Auth0 dans le backend

Le service Auth0 du backend (`auth-service`) comprend plusieurs fonctionnalités pour interagir avec l'API Auth0 :

#### 7.2.1. Fonctionnalités principales du service Auth0

- **Validation des tokens** : Vérifie la validité des tokens JWT émis par Auth0
- **Échange de code** : Convertit les codes d'autorisation en tokens d'accès
- **Rafraîchissement des tokens** : Utilise les refresh tokens pour obtenir de nouveaux access tokens
- **Gestion des utilisateurs** : Création, mise à jour et suppression d'utilisateurs
- **Gestion des rôles** : Attribution de rôles aux utilisateurs
- **Configuration des règles** : Mise en place de règles pour enrichir les tokens JWT

#### 7.2.2. Gestion des utilisateurs via l'API Management

Pour gérer les utilisateurs et les rôles dans Auth0, le service utilise l'API Management d'Auth0. Cette API nécessite des identifiants spécifiques configurés dans le fichier `.env` :

```bash
AUTH0_MANAGEMENT_API_AUDIENCE=https://wanzo-kiota.auth0.com/api/v2/
AUTH0_MANAGEMENT_API_CLIENT_ID=<MANAGEMENT_API_CLIENT_ID>
AUTH0_MANAGEMENT_API_CLIENT_SECRET=<MANAGEMENT_API_CLIENT_SECRET>
```

Les opérations courantes incluent :

- **Création d'utilisateurs** : `createUser(userData)` permet de créer un nouvel utilisateur avec des métadonnées personnalisées
- **Attribution de rôles** : `assignRoleToUser(userId, roleIdOrName)` attribue un rôle à un utilisateur par ID ou nom
- **Récupération des rôles** : `getRoles()` et `getUserRoles(userId)` permettent de lister les rôles disponibles ou attribués
- **Enrichissement des tokens** : `createOrUpdateTokenEnrichmentRule()` configure les règles pour ajouter des métadonnées aux tokens JWT

#### 7.2.3. Cache des tokens Management API

Le service implémente un mécanisme de cache pour les tokens de l'API Management afin d'éviter des appels répétés :

```typescript
private managementTokenCache: { token: string; expiresAt: number } | null = null;
```

Ce cache stocke le token et sa date d'expiration, avec une marge de sécurité pour s'assurer que le token reste valide pendant les opérations.

## 8. Types d'utilisateurs et rôles

Wanzo Backend prend en charge plusieurs types d'utilisateurs avec différents rôles :

### 8.1. Types d'utilisateurs système
- **Utilisateurs internes** (INTERNAL) : Employés/personnel de la plateforme Kiota
- **Utilisateurs externes** (EXTERNAL) : Utilisateurs clients (PME et institutions)

### 8.2. Statuts des utilisateurs
- **Actif** (ACTIVE) : Compte entièrement actif
- **En attente** (PENDING) : En attente de validation/approbation
- **Suspendu** (SUSPENDED) : Temporairement désactivé
- **Inactif** (INACTIVE) : Définitivement désactivé

### 8.3. Rôles des utilisateurs internes (Admin-Service)
- **Super Admin** (SUPER_ADMIN) : Niveau d'accès le plus élevé
- **CTO** (CTO) : Administrateur technique
- **Finance de croissance** (GROWTH_FINANCE) : Département financier
- **Support client** (CUSTOMER_SUPPORT) : Équipe de support
- **Gestionnaire de contenu** (CONTENT_MANAGER) : Gestion de contenu
- **Admin d'entreprise** (COMPANY_ADMIN) : Admin pour les entreprises clientes
- **Utilisateur d'entreprise** (COMPANY_USER) : Utilisateur régulier dans les entreprises clientes

### 8.4. Rôles des utilisateurs PME (app_mobile_service)
- **Propriétaire** (OWNER) : Propriétaire/super admin de l'entreprise
- **Admin** (ADMIN) : Administrateur de l'entreprise
- **Manager** (MANAGER) : Gestionnaire de département/équipe
- **Comptable** (ACCOUNTANT) : Personnel financier
- **Caissier** (CASHIER) : Gère les transactions en espèces
- **Ventes** (SALES) : Personnel de vente
- **Gestionnaire d'inventaire** (INVENTORY_MANAGER) : Gestion des stocks
- **Personnel** (STAFF) : Personnel général
- **Support client** (CUSTOMER_SUPPORT) : Support client

### 8.5. Rôles des utilisateurs d'institutions (portfolio-institution-service)
- **Admin** (ADMIN) : Administrateur de l'institution
- **Manager** (MANAGER) : Gestionnaire de département/équipe
- **Analyste** (ANALYST) : Analyste financier
- **Observateur** (VIEWER) : Accès en lecture seule

## 9. Relations entre applications Auth0 et microservices

Pour clarifier les relations entre les applications Auth0 et les différents microservices, voici un tableau récapitulatif :

| Microservice | Application Auth0 | Type | Utilisation |
|--------------|-------------------|------|-------------|
| auth-service | Wanzo Auth Service | Regular Web Application | Authentification centrale et émission de tokens |
| auth-service | Wanzo Management API Client | Machine-to-Machine | Gestion des utilisateurs, rôles et règles |
| admin-service | Wanzo Admin Panel | Regular Web Application | Interface administrateur pour les utilisateurs internes |
| accounting-service | Wanzo Comptabilité | Regular Web Application | Application comptabilité |
| portfolio-sme-service | Wanzo Portefeuille PME | Regular Web Application | Gestion des portefeuilles PME |
| portfolio-institution-service | Wanzo Portefeuille Institution | Regular Web Application | Gestion des portefeuilles institutions |
| app_mobile_service | Wanzo Mobile App | Native Application | Application mobile |

### 9.1. Particularité du microservice auth-service

Le microservice `auth-service` se distingue des autres services par sa double configuration :

1. **Il utilise sa propre application Regular Web Application** (`Wanzo Auth Service`)
   - Pour l'authentification générale des utilisateurs
   - Pour la validation et l'émission de tokens
   - Pour l'échange de codes d'autorisation contre des tokens

2. **Il utilise une application Machine-to-Machine** (`Wanzo Management API Client`)
   - Pour la gestion programmatique des utilisateurs (création, mise à jour)
   - Pour la gestion des rôles et permissions
   - Pour configurer les règles Auth0

Cette double configuration est nécessaire car le service d'authentification sert à la fois d'intermédiaire pour l'authentification des utilisateurs et d'outil de gestion pour les administrateurs système.

### 9.2. Schéma des flux d'authentification

```
┌───────────────┐     1. Login Request     ┌───────────────┐
│               │────────────────────────▶│               │
│  Frontend     │                          │  Auth0 UI     │
│  Applications │◀───────────────────────┐│  (Hosted Page) │
│               │    2. Authorization Code│               │
└───────┬───────┘                         └───────────────┘
        │
        │ 3. Exchange Code for Token
        ▼
┌───────────────┐     4. Validate Token     ┌───────────────┐
│               │────────────────────────▶│               │
│  auth-service │                          │  Auth0 API     │
│  Microservice │◀───────────────────────┐│               │
│               │     5. Token Response    │               │
└───────┬───────┘                         └───────────────┘
        │
        │ 6. Valid Token
        ▼
┌───────────────┐
│  Other        │
│  Microservices │
│  API Gateway   │
│               │
└───────────────┘
```
