# Implémentation Technique du Service Auth0

Ce document décrit l'implémentation technique du service Auth0 dans le projet Wanzo Backend. Il détaille la structure du code, les fonctionnalités disponibles et les configurations nécessaires.

## Structure du Service

Le service Auth0 est implémenté dans le microservice `auth-service` et est composé des fichiers suivants :

- `src/config/auth0.config.ts` : Interface et configuration Auth0
- `src/modules/auth0/auth0.module.ts` : Module NestJS pour Auth0
- `src/modules/auth0/services/auth0.service.ts` : Service principal avec toutes les fonctionnalités
- `src/modules/auth0/strategies/auth0.strategy.ts` : Stratégie d'authentification Auth0

## Configuration Auth0

### Interface de Configuration

```typescript
// src/config/auth0.config.ts
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
```

### Applications Auth0 Requises

Pour que le service d'authentification fonctionne correctement, vous devez configurer **deux applications distinctes** dans le dashboard Auth0 :

1. **Application Web Regular (Principale)** :
   ```
   Type: Regular Web Application
   Utilisation: Authentification générale des utilisateurs
   Configuration:
     - Allowed Callback URLs: http://localhost:5173/auth/callback
     - Allowed Logout URLs: http://localhost:5173
     - Allowed Web Origins: http://localhost:5173
   Variables d'environnement associées:
     - AUTH0_CLIENT_ID
     - AUTH0_CLIENT_SECRET
   ```

2. **Application Machine-to-Machine (Management API)** :
   ```
   Type: Machine to Machine Application
   Authorized API: Auth0 Management API
   Utilisation: Gestion des utilisateurs, rôles et règles
   Permissions requises:
     - read:users
     - create:users
     - update:users
     - delete:users
     - read:roles
     - create:roles
     - create:role_members
     - read:user_idp_tokens
   Variables d'environnement associées:
     - AUTH0_MANAGEMENT_API_CLIENT_ID
     - AUTH0_MANAGEMENT_API_CLIENT_SECRET
   ```

> **Important** : Les identifiants de ces deux applications sont différents et doivent être configurés correctement dans le fichier `.env`. La confusion entre ces identifiants est une source fréquente d'erreurs.

### Variables d'Environnement Requises

Le fichier `.env` doit contenir les variables suivantes :

```properties
# Configuration Auth0 principale
AUTH0_DOMAIN=dev-tezmln0tk0g1gouf.eu.auth0.com
AUTH0_CLIENT_ID=LmG0NAGcv37KBb1IZk4uQefrbmx7ANi3
AUTH0_CLIENT_SECRET=-Jb5FXqG54PwXAYYkepnTKBFRHs4UUdH2cJjqrO0N7fKLh_ZsCjogglmrxjUpHh_
AUTH0_AUDIENCE=https://api.kiota.com
AUTH0_CALLBACK_URL=http://localhost:5173/auth/callback
AUTH0_LOGOUT_URL=http://localhost:5173

# Configuration pour l'API Management Auth0
AUTH0_MANAGEMENT_API_AUDIENCE=https://dev-tezmln0tk0g1gouf.eu.auth0.com/api/v2/
AUTH0_MANAGEMENT_API_CLIENT_ID=LmG0NAGcv37KBb1IZk4uQefrbmx7ANi3
AUTH0_MANAGEMENT_API_CLIENT_SECRET=-Jb5FXqG54PwXAYYkepnTKBFRHs4UUdH2cJjqrO0N7fKLh_ZsCjogglmrxjUpHh_
```

## Fonctionnalités du Service Auth0

Le service Auth0 (`auth0.service.ts`) fournit les fonctionnalités suivantes :

### 1. Validation des Tokens

```typescript
async validateToken(token: string): Promise<any>
```
- Vérifie la validité d'un token en appelant l'endpoint `/userinfo` d'Auth0
- Retourne les informations de l'utilisateur si le token est valide
- Lance une `UnauthorizedException` si le token est invalide ou expiré

### 2. Échange de Code d'Autorisation

```typescript
async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any>
```
- Échange un code d'autorisation + code_verifier contre des tokens (access_token, refresh_token, id_token)
- Utilise le flux Authorization Code avec PKCE
- Retourne les tokens si l'échange réussit

### 3. Rafraîchissement de Token

```typescript
async refreshToken(refreshToken: string): Promise<any>
```
- Utilise un refresh_token pour obtenir un nouveau access_token
- Gère les erreurs comme l'expiration du refresh_token

### 4. Gestion du Token API Management

```typescript
async getManagementApiToken(): Promise<string>
```
- Obtient un token pour l'API Management Auth0
- Implémente un mécanisme de cache pour éviter des demandes répétées
- Utilise les identifiants de l'API Management configurés dans `.env`
- Ajoute une marge de sécurité de 5 minutes avant l'expiration du token

### 5. Création d'Utilisateurs

```typescript
async createUser(userData: {
  email: string;
  password: string;
  name: string;
  companyId?: string;
  user_metadata?: any;
  app_metadata?: any;
  connection?: string;
  role?: string;
  metadata?: Record<string, any>;
}): Promise<any>
```
- Crée un nouvel utilisateur dans Auth0
- Prend en charge les métadonnées personnalisées
- Assigne automatiquement un rôle si spécifié
- Utilise la connexion "Username-Password-Authentication" par défaut

### 6. Gestion des Rôles

```typescript
async getRoles(): Promise<any[]>
async getUserRoles(userId: string): Promise<string[]>
async assignRoleToUser(userId: string, roleIdOrName: string): Promise<void>
async createRole(name: string, description: string): Promise<any>
```
- Récupère tous les rôles disponibles
- Récupère les rôles d'un utilisateur spécifique
- Assigne un rôle à un utilisateur (par ID ou nom de rôle)
- Crée un nouveau rôle dans Auth0

### 7. Configuration des Règles Auth0

```typescript
async createOrUpdateTokenEnrichmentRule(): Promise<any>
```
- Crée ou met à jour une règle pour enrichir les tokens JWT
- Ajoute des métadonnées comme app_source, user_type, company_id, institution_id
- Détermine le service applicable en fonction du type d'utilisateur

### 8. Création de Compte Initial

```typescript
async createInitialAccount(data: {
  name: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  companyDetails: Record<string, any>;
}): Promise<{ user: Record<string, any>; companyId: string; }>
```
- Crée un compte administrateur initial avec le rôle "superadmin"
- Génère un ID d'entreprise unique
- Ajoute des métadonnées pour identifier le propriétaire de l'entreprise

## Amélioration et Optimisation du Service

La récente mise à jour du service a résolu plusieurs problèmes :

1. **Élimination des fonctions dupliquées** : Fusion des fonctions dupliquées pour `getManagementApiToken()`, `createUser()` et `assignRoleToUser()`.

2. **Correction des erreurs de typage** : Ajout de types explicites pour éviter les erreurs "implicitly has an 'any' type".

3. **Amélioration des fonctionnalités** :
   - `assignRoleToUser()` peut maintenant accepter un ID de rôle ou un nom de rôle
   - `createUser()` unifie les fonctionnalités de création d'utilisateur avec différentes métadonnées

4. **Gestion optimisée du token Management API** : 
   - Utilisation correcte des identifiants Management API dédiés
   - Cache des tokens avec marge de sécurité pour éviter les interruptions de service

## Bonnes Pratiques Implémentées

1. **Journalisation structurée** : Utilisation du système de journalisation NestJS pour tracer les opérations

2. **Gestion d'erreurs** : Méthode `handleAxiosError()` pour un traitement cohérent des erreurs d'API

3. **Cache des tokens** : Réduction des appels à l'API Auth0 pour une meilleure performance

4. **Types TypeScript** : Utilisation de types explicites pour une meilleure maintenabilité

5. **Isolation de la configuration** : Séparation des paramètres de configuration dans un module dédié

## Vérification de la Configuration

Pour vérifier que votre configuration Auth0 est correcte, suivez ces étapes :

### 1. Vérifier les Applications dans le Dashboard Auth0

1. Connectez-vous à votre [Dashboard Auth0](https://manage.auth0.com/)
2. Allez à `Applications > Applications`
3. Vérifiez que vous avez les deux applications suivantes :
   - Une application **Regular Web Application** pour l'authentification des utilisateurs
   - Une application **Machine-to-Machine** pour l'API Management

### 2. Vérifier les Permissions de l'Application Machine-to-Machine

1. Sélectionnez l'application Machine-to-Machine
2. Allez à l'onglet `APIs`
3. Cliquez sur `Auth0 Management API`
4. Vérifiez que toutes les permissions nécessaires sont accordées :
   ```
   read:users, create:users, update:users, delete:users,
   read:roles, create:roles, read:role_members, create:role_members
   ```

### 3. Tester la Configuration avec l'API Management

Exécutez ce code de test pour vérifier que votre configuration de l'API Management fonctionne :

```typescript
// Test de la configuration de l'API Management
async function testManagementApiConfig() {
  try {
    // Cette méthode tente d'obtenir un token Management API
    const token = await auth0Service.getManagementApiToken();
    console.log('✅ Configuration de l\'API Management correcte');
    
    // Test de récupération des rôles pour vérifier les permissions
    const roles = await auth0Service.getRoles();
    console.log(`✅ Permissions correctes, ${roles.length} rôles récupérés`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de configuration de l\'API Management:', error.message);
    return false;
  }
}
```

## Utilisation dans d'autres Services

Pour utiliser ce service Auth0 dans d'autres microservices :

1. Importez la configuration Auth0 dans votre module :
```typescript
import { Auth0Module } from './modules/auth0/auth0.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    Auth0Module,
    // ...
  ],
})
export class AppModule {}
```

2. Injectez le service dans vos contrôleurs ou services :
```typescript
constructor(private readonly auth0Service: Auth0Service) {}
```

3. Utilisez les méthodes du service :
```typescript
// Exemple : créer un nouvel utilisateur
const newUser = await this.auth0Service.createUser({
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe',
  role: 'manager',
  companyId: 'company-123',
});
```

## Dépannage

### Problèmes Courants

1. **Token expiré ou invalide** :
   - Vérifiez la validité du token avec `validateToken()`
   - Rafraîchissez le token avec `refreshToken()` si nécessaire

2. **Erreurs d'autorisation avec l'API Management** :
   - Vérifiez que les identifiants Management API sont corrects
   - Assurez-vous que l'application a toutes les permissions nécessaires

3. **Erreurs lors de l'assignation de rôles** :
   - Vérifiez que le rôle existe dans Auth0 avant d'essayer de l'assigner
   - Assurez-vous que l'ID utilisateur est correct

4. **Erreurs de création d'utilisateur** :
   - Vérifiez que l'email n'est pas déjà utilisé
   - Assurez-vous que le mot de passe respecte les règles de complexité d'Auth0

5. **Confusion entre les applications Auth0** :
   - Problème: Utilisation des mauvais identifiants (clientId/clientSecret) pour les opérations de gestion
   - Solution: Vérifiez que `AUTH0_CLIENT_ID`/`AUTH0_CLIENT_SECRET` sont bien ceux de l'application Web Regular
   - Solution: Vérifiez que `AUTH0_MANAGEMENT_API_CLIENT_ID`/`AUTH0_MANAGEMENT_API_CLIENT_SECRET` sont bien ceux de l'application Machine-to-Machine

6. **Erreurs "insufficient scope"** :
   - Problème: L'application Machine-to-Machine n'a pas toutes les permissions requises
   - Solution: Dans le dashboard Auth0, vérifiez et mettez à jour les permissions de l'application

7. **Les règles Auth0 ne s'appliquent pas** :
   - Vérifiez que la règle est activée dans le dashboard Auth0
   - Assurez-vous que l'ordre d'exécution des règles est correct
   - Validez la syntaxe JavaScript de la règle
