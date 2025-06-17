# Authentication API Documentation

Ce document décrit les points d'API et le flux d'authentification pour l'application Wanzo Admin, qui utilise Auth0 comme fournisseur d'identité principal.

## Architecture d'authentification

L'application Wanzo Admin utilise un flux d'authentification basé sur Auth0. Le frontend communique directement avec Auth0 pour l'authentification initiale, puis utilise le token JWT reçu pour authentifier les requêtes API vers le backend.

### Flux d'authentification

1. L'utilisateur est redirigé vers la page d'authentification hébergée par Auth0
2. Après authentification réussie, Auth0 redirige vers l'application avec un code d'autorisation
3. Ce code est échangé contre un token JWT contenant les informations utilisateur
4. Le token est stocké dans le localStorage et utilisé pour authentifier les requêtes API

### Structure du token JWT

Le token JWT fourni par Auth0 contient les informations suivantes :

```json
{
  "https://api.wanzo.com/role": "superadmin",
  "given_name": "Jacques",
  "family_name": "Ndavaro",
  "nickname": "jacquesndav",
  "name": "Jacques Ndavaro",
  "picture": "https://lh3.googleusercontent.com/a/ACg8ocIL0yfuobxXVunH5BCpbWnpdLSHUsVuD7jtucw_o7UFsafLpyCj=s96-c",
  "updated_at": "2025-06-17T14:29:09.437Z",
  "email": "jacquesndav@gmail.com",
  "email_verified": true,
  "iss": "https://dev-tezmln0tk0g1gouf.eu.auth0.com/",
  "aud": "43d64kgsVYyCZHEFsax7zlRBVUiraCKL",
  "sub": "google-oauth2|113531686121267070489",
  "iat": 1750170554,
  "exp": 1750206554,
  "sid": "s0ZxN_wbZNKDXl2XXsZ3X7O6fXrDcJJx",
  "nonce": "TEd0UDVQa092YjJrY1l2LTl6M0lDOS5nUktWQlRCYVZmNWNmWk5wclVEWA=="
}
```

## Endpoints d'API Backend

### 1. Validation du Token et Enrichissement du Profil

#### `POST /auth/validate-token`

Valide le token JWT fourni par Auth0 et enrichit le profil utilisateur avec des informations supplémentaires stockées dans le backend.

**Request Headers:**

```
Authorization: Bearer {token.jwt.from.auth0}
```

**Response (Success 200 OK):**

```json
{
  "isValid": true,
  "user": {
    "id": "google-oauth2|113531686121267070489",
    "name": "Jacques Ndavaro",
    "email": "jacquesndav@gmail.com",
    "role": "super_admin",
    "userType": "internal",
    "picture": "https://lh3.googleusercontent.com/a/ACg8ocIL0yfuobxXVunH5BCpbWnpdLSHUsVuD7jtucw_o7UFsafLpyCj=s96-c",
    "customerAccountId": null,
    "phoneNumber": "+243123456789",
    "idAgent": "IKH12345",
    "validityEnd": "2026-06-17T00:00:00.000Z",
    "kyc": {
      "status": "verified",
      "verifiedAt": "2025-01-15T10:30:00Z",
      "documents": [
        {
          "type": "id_card",
          "verified": true,
          "uploadedAt": "2025-01-10T14:20:00Z"
        }
      ]
    }
  }
}
```

**Response (Error 401 Unauthorized):**

```json
{
  "isValid": false,
  "error": "Token invalide ou expiré"
}
```

### 2. Récupérer le Profil Utilisateur

#### `GET /auth/me`

Récupère les informations complètes du profil utilisateur à partir du backend.

**Request Headers:**

```
Authorization: Bearer {token.jwt.from.auth0}
```

**Response (Success 200 OK):**

```json
{
  "id": "google-oauth2|113531686121267070489",
  "name": "Jacques Ndavaro",
  "email": "jacquesndav@gmail.com",
  "role": "super_admin",
  "userType": "internal",
  "picture": "https://lh3.googleusercontent.com/a/ACg8ocIL0yfuobxXVunH5BCpbWnpdLSHUsVuD7jtucw_o7UFsafLpyCj=s96-c",
  "customerAccountId": null,
  "phoneNumber": "+243123456789",
  "idAgent": "IKH12345",
  "validityEnd": "2026-06-17T00:00:00.000Z",
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2025-06-15T14:30:00Z",
  "lastLogin": "2025-06-17T14:29:09.437Z",
  "permissions": ["users:read", "users:write", "settings:read", "settings:write"],
  "kyc": {
    "status": "verified",
    "verifiedAt": "2025-01-15T10:30:00Z",
    "documents": [
      {
        "type": "id_card",
        "verified": true,
        "uploadedAt": "2025-01-10T14:20:00Z"
      }
    ]
  }
}
```

**Response (Error 401 Unauthorized):**

```json
{
  "error": "Non authentifié"
}
```

### 3. Mettre à Jour le Profil Utilisateur

#### `PUT /auth/me`

Met à jour le profil utilisateur dans le backend.

**Request Headers:**

```
Authorization: Bearer {token.jwt.from.auth0}
```

**Request Body:**

```json
{
  "phoneNumber": "+243987654321",
  "language": "fr",
  "timezone": "Africa/Kinshasa"
}
```

**Response (Success 200 OK):**

```json
{
  "id": "google-oauth2|113531686121267070489",
  "name": "Jacques Ndavaro",
  "email": "jacquesndav@gmail.com",
  "role": "super_admin",
  "userType": "internal",
  "picture": "https://lh3.googleusercontent.com/a/ACg8ocIL0yfuobxXVunH5BCpbWnpdLSHUsVuD7jtucw_o7UFsafLpyCj=s96-c",
  "customerAccountId": null,
  "phoneNumber": "+243987654321",
  "idAgent": "IKH12345",
  "validityEnd": "2026-06-17T00:00:00.000Z",
  "language": "fr",
  "timezone": "Africa/Kinshasa",
  "updatedAt": "2025-06-17T15:45:00Z"
}
```

**Response (Error 401 Unauthorized):**

```json
{
  "error": "Non authentifié"
}
```

### 4. Invalidation de Session

#### `POST /auth/invalidate-session`

Invalide la session actuelle côté backend (sans déconnecter l'utilisateur d'Auth0).

**Request Headers:**

```
Authorization: Bearer {token.jwt.from.auth0}
```

**Response (Success 200 OK):**

```json
{
  "message": "Session invalidée avec succès"
}
```

## Endpoints d'Admin pour la Gestion des Utilisateurs

### 1. Créer un Utilisateur

#### `POST /admin/users`

Crée un nouvel utilisateur dans le système. Cela peut également créer un utilisateur dans Auth0 si l'option `createInAuth0` est définie à `true`.

**Request Headers:**

```
Authorization: Bearer {token.jwt.from.auth0}
```

**Request Body:**

```json
{
  "name": "Nouvel Utilisateur",
  "email": "nouvel.utilisateur@example.com",
  "role": "customer_support",
  "userType": "internal",
  "phoneNumber": "+243123456789",
  "createInAuth0": true,
  "sendInvitation": true
}
```

**Response (Success 201 Created):**

```json
{
  "id": "new-user-id",
  "name": "Nouvel Utilisateur",
  "email": "nouvel.utilisateur@example.com",
  "role": "customer_support",
  "userType": "internal",
  "createdAt": "2025-06-17T16:00:00Z"
}
```

**Response (Error 400 Bad Request):**

```json
{
  "error": "Email déjà utilisé"
}
```

### 2. Modifier les Rôles d'un Utilisateur

#### `PUT /admin/users/{userId}/roles`

Modifie les rôles d'un utilisateur existant.

**Request Headers:**

```
Authorization: Bearer {token.jwt.from.auth0}
```

**Request Body:**

```json
{
  "role": "content_manager",
  "updateInAuth0": true
}
```

**Response (Success 200 OK):**

```json
{
  "id": "user-id",
  "name": "Utilisateur Modifié",
  "email": "utilisateur@example.com",
  "role": "content_manager",
  "userType": "internal",
  "updatedAt": "2025-06-17T16:15:00Z"
}
```

## Flux Frontend avec Auth0

### Configuration Auth0

```javascript
// Configuration Auth0 pour Wanzo Admin
const auth0Config = {
  domain: 'dev-tezmln0tk0g1gouf.eu.auth0.com',
  clientId: '43d64kgsVYyCZHEFsax7zlRBVUiraCKL',
  audience: 'https://api.wanzo.com',
  redirectUri: 'http://localhost:5173/auth/callback',
  scope: 'openid profile email'
};
```

### Processus d'Authentification

1. **Redirection vers Auth0**
   ```javascript
   // Via Auth0Provider et useAuth0 hook
   const { loginWithRedirect } = useAuth0();
   
   const login = async () => {
     await loginWithRedirect({
       appState: { returnTo: '/dashboard' }
     });
   };
   ```

2. **Callback et Récupération du Token**
   ```javascript
   // Dans la page de callback
   const { handleRedirectCallback, getUser, getTokenSilently } = useAuth0();
   
   useEffect(() => {
     const handleAuth0Callback = async () => {
       try {
         const { appState } = await handleRedirectCallback();
         const token = await getTokenSilently();
         const user = await getUser();
         
         // Valider le token côté backend et enrichir le profil
         const response = await fetch('/api/auth/validate-token', {
           headers: {
             Authorization: `Bearer ${token}`
           }
         });
         
         const data = await response.json();
         if (data.isValid) {
           // Stocker les informations enrichies dans le store local
           authStore.login(data.user, token);
           navigate(appState?.returnTo || '/dashboard');
         }
       } catch (error) {
         console.error('Erreur lors du traitement du callback:', error);
       }
     };
     
     handleAuth0Callback();
   }, []);
   ```

3. **Utilisation du Token pour les Appels API**
   ```javascript
   // Intercepteur Axios pour ajouter le token à toutes les requêtes
   axiosInstance.interceptors.request.use(async (config) => {
     try {
       const token = await getTokenSilently();
       config.headers.Authorization = `Bearer ${token}`;
       return config;
     } catch (error) {
       console.error('Erreur lors de la récupération du token:', error);
       return Promise.reject(error);
     }
   });
   ```

## Types et Interfaces

### AuthUser

```typescript
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  userType: 'internal' | 'external';
  picture?: string;
  customerAccountId?: string | null;
  phoneNumber?: string;
  idAgent?: string;
  validityEnd?: string;
  permissions?: string[];
  kyc?: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    documents?: Array<{
      type: string;
      verified: boolean;
      uploadedAt: string;
    }>;
  };
}
```

### UserRole

```typescript
type UserRole = 
  | 'super_admin' 
  | 'company_admin' 
  | 'customer_support' 
  | 'content_manager' 
  | 'growth_finance'
  | 'cto';
```

## Codes d'Erreur

| Code | Description                                        |
|------|----------------------------------------------------|
| 400  | Bad Request - La requête est malformée ou invalide |
| 401  | Unauthorized - Authentification requise            |
| 403  | Forbidden - Permissions insuffisantes              |
| 404  | Not Found - Ressource non trouvée                  |
| 409  | Conflict - La ressource existe déjà                |
| 422  | Unprocessable Entity - Erreurs de validation       |
| 429  | Too Many Requests - Limite de taux dépassée        |
| 500  | Internal Server Error - Erreur serveur interne     |

## Notes Supplémentaires

1. L'authentification principale est gérée par Auth0, mais le backend effectue également une validation du token et peut enrichir les informations utilisateur.
2. Les jetons JWT ont une durée de validité de 10 heures par défaut.
3. Le frontend utilise le localStorage pour stocker le token et le rafraîchit automatiquement lorsque nécessaire.
4. Pour la déconnexion complète, l'utilisateur doit être déconnecté à la fois du frontend et d'Auth0.
