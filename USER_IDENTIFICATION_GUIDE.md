# Identification des utilisateurs et de leurs rôles dans l'architecture Wanzo

Dans l'architecture microservices de Wanzo Backend, l'identification de l'application d'origine d'un utilisateur et la détermination de son rôle sont des éléments cruciaux pour la sécurité et le bon fonctionnement du système. Voici comment ces mécanismes sont mis en œuvre.

## 1. Identification de l'application d'origine

### 1.1 Via le client_id Auth0

Dans notre intégration avec Auth0, chaque application frontend a son propre `client_id` unique :

- **Admin Panel**: client_id spécifique à l'application d'administration
- **Comptabilité**: client_id spécifique à l'application de comptabilité
- **Portefeuille PME**: client_id spécifique à l'application de gestion des PME
- **Portefeuille Institution**: client_id spécifique à l'application de gestion des institutions
- **Application Mobile**: client_id spécifique à l'application mobile

Lorsqu'un utilisateur s'authentifie via Auth0, le `client_id` de l'application est inclus dans le token JWT. Ce `client_id` est ensuite validé dans notre stratégie JWT, comme on peut le voir dans le fichier `jwt.strategy.ts` :

```typescript
// Extrait du JWT payload qui contient le client_id
interface JwtPayload {
  // ...autres propriétés
  client_id: string;
  aud: string;
  // ...autres propriétés
}

// Dans la méthode validate, le client_id est extrait et inclus dans l'objet utilisateur
async validate(payload: JwtPayload): Promise<boolean | Record<string, any>> {
  // ...validation
  return {
    // ...autres propriétés
    clientId: payload.client_id,
    // ...autres propriétés
  };
}
```

### 1.2 Via l'audience (aud) du token

L'audience (`aud`) du token JWT indique pour quel service l'accès est destiné. Par exemple, les tokens destinés à l'API peuvent avoir une audience comme `https://api.wanzo.com`.

### 1.3 Via le préfixe de route dans l'API Gateway

Dans le service API Gateway, les routes sont préfixées selon l'application concernée :

```typescript
// Extrait de route-resolver.service.ts
this.routes = [
  {
    service: 'admin',
    baseUrl: this.configService.get('ADMIN_SERVICE_URL', 'http://localhost:3001'),
    prefix: 'admin',
    // ...
  },
  {
    service: 'app_mobile',
    baseUrl: this.configService.get('APP_MOBILE_SERVICE_URL', 'http://localhost:3006'),
    prefix: 'mobile',
    // ...
  },
  // ...autres services
];
```

Chaque requête est donc routée vers le microservice approprié en fonction de son préfixe, ce qui permet également d'identifier l'application d'origine.

## 2. Détermination du rôle de l'utilisateur

### 2.1 Rôles assignés dans Auth0

Les rôles sont assignés aux utilisateurs dans Auth0 et sont inclus dans le token JWT via une règle personnalisée. Cette règle ajoute le rôle de l'utilisateur au token JWT :

```javascript
// Exemple de règle Auth0 qui ajoute le rôle au token
function (user, context, callback) {
  // Récupération des rôles depuis Auth0
  const assignedRoles = (context.authorization || {}).roles || [];
  
  // Ajout des rôles au token
  context.accessToken['https://api.wanzo.com/role'] = assignedRoles[0] || 'user';
  
  callback(null, user, context);
}
```

### 2.2 Validation des rôles dans les microservices

Chaque microservice valide les rôles à l'aide du guard `RolesGuard` :

```typescript
// Exemple d'implémentation du RolesGuard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### 2.3 Mappage des utilisateurs selon le service

Les différents services ont des définitions de rôles spécifiques, comme indiqué dans le document USER_TYPES_README.md :

- **Admin-Service**: SUPER_ADMIN, CTO, GROWTH_FINANCE, etc.
- **App_mobile_service**: OWNER, ADMIN, MANAGER, ACCOUNTANT, etc.
- **Portfolio-institution-service**: ADMIN, MANAGER, ANALYST, VIEWER

Le mappage entre le rôle Auth0 et le rôle spécifique au service est effectué dans la stratégie JWT de chaque service.

## 3. Workflow complet d'identification

1. **Authentification**: L'utilisateur s'authentifie via Auth0 dans une application frontend spécifique
2. **Génération du token**: Auth0 génère un JWT contenant:
   - Le `client_id` de l'application
   - L'`audience` de l'API
   - Le `rôle` de l'utilisateur
   - Les `permissions` associées
   - L'`identifiant` de l'utilisateur (sub)
   - Autres métadonnées (companyId, etc.)
3. **Validation à l'API Gateway**: L'API Gateway reçoit la requête et:
   - Vérifie la validité du token JWT
   - Détermine le service destinataire en fonction du préfixe de la route
   - Ajoute les informations utilisateur à la requête
4. **Traitement par le microservice**: Le microservice:
   - Valide les rôles et permissions requises via les guards
   - Applique la logique métier appropriée
   - Peut enrichir les données utilisateur avec des informations spécifiques au domaine

## 4. Amélioration suggérée: métadonnées supplémentaires

Pour améliorer encore l'identification de l'application d'origine, nous recommandons d'ajouter une métadonnée spécifique dans les tokens JWT:

```javascript
// Règle Auth0 améliorée
function (user, context, callback) {
  // Déterminer l'application source basée sur le client_id
  let appSource = "unknown";
  
  if (context.clientID === "<ADMIN_CLIENT_ID>") {
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
  context.accessToken['https://api.wanzo.com/app_source'] = appSource;
  
  // Continuer avec les autres enrichissements de token
  // ...
  
  callback(null, user, context);
}
```

Cette métadonnée pourra ensuite être utilisée dans les logs et pour les décisions d'autorisation plus fines.

## 5. Intégration avec le modèle de données utilisateur

Pour une identification complète, le système associe l'identifiant Auth0 à un enregistrement utilisateur dans la base de données qui contient:

- Le type d'utilisateur (INTERNAL/EXTERNAL)
- Le statut du compte (ACTIVE/PENDING/SUSPENDED/INACTIVE)
- Les métadonnées spécifiques au domaine (companyId, institutionId, etc.)
- Les préférences utilisateur
- L'historique des connexions

Cette approche multi-niveaux garantit une identification précise de l'utilisateur, de son application d'origine et de ses droits d'accès.
