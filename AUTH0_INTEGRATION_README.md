# Wanzo Backend - Guide d'intégration Auth0 et configuration des frontends

Ce document fournit les informations nécessaires pour configurer Auth0 et les différentes applications frontend qui interagissent avec le backend Wanzo.

## Table des matières

1. [Architecture microservices](#1-architecture-microservices)
2. [Configuration Auth0](#2-configuration-auth0)
3. [Configuration des frontends](#3-configuration-des-frontends)
4. [Flux d'authentification](#4-flux-dauthentification)
5. [Points d'API à configurer](#5-points-dapi-à-configurer)
6. [URLs pour les applications frontend](#6-urls-pour-les-applications-frontend)

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

#### a. Application Web Admin Panel
```
Nom: Wanzo Admin Panel
Type: Regular Web Application
Allowed Callback URLs: http://localhost:5173/admin/callback, https://admin.wanzo.com/callback
Allowed Logout URLs: http://localhost:5173/admin, https://admin.wanzo.com
Allowed Web Origins: http://localhost:5173, https://admin.wanzo.com
```

#### b. Application Web Comptabilité
```
Nom: Wanzo Comptabilité
Type: Regular Web Application
Allowed Callback URLs: http://localhost:5174/accounting/callback, https://accounting.wanzo.com/callback
Allowed Logout URLs: http://localhost:5174/accounting, https://accounting.wanzo.com
Allowed Web Origins: http://localhost:5174, https://accounting.wanzo.com
```

#### c. Application Portefeuille PME
```
Nom: Wanzo Portefeuille PME
Type: Regular Web Application
Allowed Callback URLs: http://localhost:5175/portfolio/sme/callback, https://sme.wanzo.com/callback
Allowed Logout URLs: http://localhost:5175/portfolio/sme, https://sme.wanzo.com
Allowed Web Origins: http://localhost:5175, https://sme.wanzo.com
```

#### d. Application Portefeuille Institution
```
Nom: Wanzo Portefeuille Institution
Type: Regular Web Application
Allowed Callback URLs: http://localhost:5176/portfolio/institution/callback, https://institution.wanzo.com/callback
Allowed Logout URLs: http://localhost:5176/portfolio/institution, https://institution.wanzo.com
Allowed Web Origins: http://localhost:5176, https://institution.wanzo.com
```

#### e. Application Mobile
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

# Management API credentials
AUTH0_MANAGEMENT_API_CLIENT_ID=<MANAGEMENT_API_CLIENT_ID>
AUTH0_MANAGEMENT_API_CLIENT_SECRET=<MANAGEMENT_API_CLIENT_SECRET>
```

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
