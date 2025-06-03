# Guide de Configuration Auth0 pour Wanzo Backend

Ce guide détaille les étapes nécessaires pour configurer Auth0 correctement pour le projet Wanzo Backend.

## Prérequis

- Un compte Auth0 (vous pouvez en créer un gratuitement sur [auth0.com](https://auth0.com))
- Accès à la ligne de commande pour configurer les variables d'environnement
- Node.js et npm installés pour exécuter le backend

## Étapes de Configuration

### 1. Créer un Tenant Auth0

1. Connectez-vous à [Auth0 Dashboard](https://auth0.com)
2. Créez un nouveau tenant (ex: `wanzo-kiota`)
3. Sélectionnez la région appropriée (Europe recommandée pour ce projet)

### 2. Créer une Application Web (Regular Web Application)

1. Dans le dashboard Auth0, allez à `Applications > Applications`
2. Cliquez sur `Create Application`
3. Nommez l'application "Wanzo Auth Service"
4. Sélectionnez `Regular Web Application` comme type
5. Dans l'onglet `Settings`, configurez les URLs suivantes:
   - Allowed Callback URLs: `http://localhost:5173/auth/callback, http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:5173, http://localhost:3000`
   - Allowed Web Origins: `http://localhost:5173, http://localhost:3000`
6. Sauvegardez les changements
7. Notez le `Domain`, `Client ID` et `Client Secret` pour la configuration du fichier `.env`

### 3. Créer une API

1. Allez à `Applications > APIs`
2. Cliquez sur `Create API`
3. Configurez l'API :
   - Name: "Wanzo API"
   - Identifier: `https://api.kiota.com` (utilisé comme audience)
   - Signing Algorithm: RS256
4. Dans l'onglet `Permissions`, ajoutez les permissions suivantes:
   - `read:users`
   - `create:users`
   - `update:users`
   - `delete:users`
   - `read:roles`
   - `create:role_members`
   - `admin:full`
   - `users:manage`
   - `settings:manage`
   - `mobile:read`
   - `mobile:write`
   - `analytics:read`
   - `analytics:write`
   - `accounting:read`
   - `accounting:write`
   - `portfolio:read`
   - `portfolio:write`
   - `institution:manage`
5. Sauvegardez les changements

### 4. Créer les Rôles Nécessaires

1. Allez à `User Management > Roles`
2. Créez les rôles suivants (un par un):
   - `admin`
   - `superadmin`
   - `user`
   - `manager`
   - `accountant`
   - `viewer`
   - `owner`
   - `cashier`
   - `sales`
   - `inventory_manager`
   - `staff`
   - `customer_support`
   - `analyst`
   - `content_manager`
   - `growth_finance`
   - `cto`

### 5. Configurer une Application Machine-to-Machine pour l'API Management

1. Allez à `Applications > Applications`
2. Cliquez sur `Create Application`
3. Nommez l'application "Wanzo Management API Client"
4. Sélectionnez `Machine to Machine Application` comme type
5. Sélectionnez l'API "Auth0 Management API"
6. Sélectionnez les permissions suivantes:
   - `read:users`
   - `create:users`
   - `update:users`
   - `delete:users`
   - `read:roles`
   - `create:roles`
   - `update:roles`
   - `delete:roles`
   - `create:role_members`
   - `read:role_members`
   - `delete:role_members`
   - `read:user_idp_tokens`
7. Sauvegardez les changements
8. Notez le `Client ID` et `Client Secret` pour la configuration des variables d'environnement

### 6. Créer une Règle pour l'Enrichissement des Tokens

1. Allez à `Auth Pipeline > Rules`
2. Cliquez sur `Create Rule`
3. Sélectionnez le template "Empty rule"
4. Nommez la règle "Enrich JWT with App Source and User Type"
5. Utilisez le code suivant comme base (adaptez selon vos besoins):

```javascript
function (user, context, callback) {
  const namespace = 'https://api.kiota.com/';
  
  // 1. Identifier l'application source basée sur le client_id
  const clientId = context.clientID;
  const appSourceMap = {
    '<AUTH_SERVICE_CLIENT_ID>': 'auth-service',
    // Ajouter d'autres client IDs ici quand ils seront créés
  };
  
  // 2. Ajouter les métadonnées supplémentaires au token
  context.accessToken[namespace + 'app_source'] = appSourceMap[clientId] || 'unknown';
  context.accessToken[namespace + 'user_type'] = user.app_metadata?.user_type || 'external';
  context.accessToken[namespace + 'company_id'] = user.app_metadata?.company_id || null;
  context.accessToken[namespace + 'institution_id'] = user.app_metadata?.institution_id || null;
  
  // 3. Déterminer le service applicable en fonction du type d'utilisateur
  let applicable_service;
  
  if (user.app_metadata?.user_type === 'internal') {
    applicable_service = 'admin-service';
  } else if (user.app_metadata?.institution_id) {
    applicable_service = 'portfolio-institution-service';
  } else if (user.app_metadata?.company_id) {
    applicable_service = 'app-mobile-service';
  } else {
    applicable_service = 'unknown';
  }
  
  context.accessToken[namespace + 'applicable_service'] = applicable_service;
  
  callback(null, user, context);
}
```

6. Sauvegardez la règle

### 7. Configurer les Variables d'Environnement

Créez un fichier `.env` dans le dossier `apps/auth-service/` avec les variables suivantes:

```properties
# Auth0 Configuration Principale
AUTH0_DOMAIN=<votre-tenant>.auth0.com
AUTH0_CLIENT_ID=<client-id-de-application-web>
AUTH0_CLIENT_SECRET=<client-secret-de-application-web>
AUTH0_AUDIENCE=https://api.kiota.com
AUTH0_CALLBACK_URL=http://localhost:5173/auth/callback
AUTH0_LOGOUT_URL=http://localhost:5173

# Configuration pour l'API Management Auth0
AUTH0_MANAGEMENT_API_AUDIENCE=https://<votre-tenant>.auth0.com/api/v2/
AUTH0_MANAGEMENT_API_CLIENT_ID=<client-id-de-application-m2m>
AUTH0_MANAGEMENT_API_CLIENT_SECRET=<client-secret-de-application-m2m>

# URLs des services pour la communication inter-services
ADMIN_SERVICE_URL=http://localhost:3001
APP_MOBILE_SERVICE_URL=http://localhost:3006
PORTFOLIO_SME_SERVICE_URL=http://localhost:3004
PORTFOLIO_INSTITUTION_SERVICE_URL=http://localhost:3005
ACCOUNTING_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3002
```

Remplacez les valeurs `<...>` par vos informations spécifiques d'Auth0.

## Vérification de la Configuration

Après avoir configuré Auth0 et le fichier `.env`, vous pouvez vérifier que tout fonctionne correctement :

1. Démarrez le service d'authentification :
   ```bash
   cd apps/auth-service
   npm run start:dev
   ```

2. Testez l'endpoint de validation de token (avec un token valide) :
   ```bash
   curl -X POST http://localhost:3000/auth/validate-token \
     -H "Content-Type: application/json" \
     -d '{"token": "votre-token-jwt"}'
   ```

3. Vérifiez les logs pour vous assurer qu'il n'y a pas d'erreurs lors de l'initialisation.

## Dépannage

### Problèmes Courants

1. **Erreur "Invalid token"** :
   - Vérifiez que votre token est valide et non expiré
   - Assurez-vous que l'audience du token correspond à celle configurée

2. **Erreur "Invalid client"** :
   - Vérifiez que les identifiants Client ID et Client Secret sont corrects
   - Vérifiez que l'application a les redirections autorisées correctes

3. **Erreur "Insufficient scope"** :
   - Vérifiez que l'application Management API a toutes les permissions nécessaires

4. **Les rôles ne s'appliquent pas** :
   - Vérifiez que les rôles existent dans Auth0
   - Vérifiez que les utilisateurs sont correctement assignés aux rôles

### Ressources Utiles

- [Documentation Auth0](https://auth0.com/docs)
- [Documentation NestJS Auth0](https://docs.nestjs.com/security/authentication)
- [API Management Auth0](https://auth0.com/docs/api/management/v2)

## Intégration avec les Frontends

Pour l'intégration avec les différentes applications frontend, consultez le document `AUTH0_INTEGRATION_README.md` qui fournit des détails spécifiques sur la configuration des applications clientes.

## Implémentation Technique

Pour une description détaillée de l'implémentation technique du service Auth0 dans le backend, consultez le document `AUTH0_TECHNICAL_IMPLEMENTATION.md`.
