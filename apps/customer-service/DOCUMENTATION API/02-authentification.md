# Authentification

## Vue d'ensemble

L'authentification dans l'application Wanzo est gérée via **Auth0 avec le protocole PKCE** et stockage sécurisé local. Tous les appels API incluent automatiquement le Bearer token.

## Implémentation actuelle

### Stockage sécurisé

**Service** : `utils/storage.ts`

```typescript
// Clés de stockage centralisées
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token', 
  USER: 'cached_user',
  STATE: 'auth_state',
  CODE_VERIFIER: 'code_verifier',
  USER_TYPE: 'auth_user_type',
  APP_ID: 'auth_app_id',
  RETURN_TO: 'auth_return_to',
} as const;

// Fonction d'accès centralisée avec priorité Auth0
export function getToken(): string | null {
  // Priorité aux tokens Auth0 stockés par le callback
  const auth0Token = localStorage.getItem('auth0_token');
  if (auth0Token) {
    return auth0Token;
  }
  
  // Fallback vers l'ancien système si nécessaire
  return secureStorage.getItem('ACCESS_TOKEN');
}
```

### Configuration Auth0 centralisée

**Service** : `config/auth0.ts`

```typescript
// Configuration Auth0 centralisée via variables d'environnement
export const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
export const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
export const AUTH0_CALLBACK_URL = import.meta.env.VITE_AUTH0_CALLBACK_URL;
export const AUTH0_LOGOUT_URL = import.meta.env.VITE_AUTH0_LOGOUT_URL || 'http://localhost:5173';
```

### Injection automatique des tokens

**Service** : `ApiService.getAuthHeaders()`

```typescript
private getAuthHeaders(isFormData = false): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  headers['Accept'] = 'application/json';
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
```

**Résultat** : Toutes les requêtes API incluent automatiquement :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Flux d'authentification

### 1. Auth0 PKCE Flow

**Configuration Auth0** : `config/auth0.ts`
- Domain : Configuration via `VITE_AUTH0_DOMAIN`
- Client ID : Configuration via `VITE_AUTH0_CLIENT_ID`
- Callback URL : Configuration via `VITE_AUTH0_CALLBACK_URL`
- Logout URL : Configuration via `VITE_AUTH0_LOGOUT_URL`
- PKCE Flow pour sécurité renforcée (Code Challenge + Code Verifier)

**Démarrage de l'authentification** : `utils/auth0pkce.ts`

```typescript
// Génération sécurisée du code verifier et challenge
export async function startAuth0PKCE(mode: 'login' | 'signup', domain: string, clientId: string, callbackUrl: string) {
  const codeVerifier = base64UrlEncode(window.crypto.getRandomValues(new Uint8Array(32)));
  const codeChallenge = await sha256(codeVerifier);
  const state = base64UrlEncode(window.crypto.getRandomValues(new Uint8Array(16)));
  
  // Stockage sécurisé en session
  sessionStorage.setItem('auth0_code_verifier', codeVerifier);
  sessionStorage.setItem('auth0_state', state);
  
  // Redirection vers Auth0 avec paramètres PKCE
  window.location.href = `https://${domain}/authorize?${params.toString()}`;
}
```

**Callback et échange de tokens** : `pages/auth/Callback.tsx`

```typescript
// Échange du code d'autorisation contre les tokens
fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    client_id: AUTH0_CLIENT_ID,
    code_verifier: codeVerifier, // PKCE
    code,
    redirect_uri: AUTH0_CALLBACK_URL,
  })
})
```

### 2. Gestion des utilisateurs avec hook useUser

**Hook** : `hooks/useUser.ts`

Le hook `useUser` gère automatiquement :
- ✅ Initialisation immédiate avec données Auth0
- ✅ Enrichissement en arrière-plan via l'API backend
- ✅ Synchronisation après connexion
- ✅ Gestion des erreurs et retry automatique
- ✅ Nettoyage lors de la déconnexion

```typescript
export function useUser() {
  // États de l'utilisateur
  const [user, setUser] = useState<User | null>(null);
  const [isEnrichingData, setIsEnrichingData] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Initialisation immédiate depuis Auth0
  const initializeUserFromAuth0 = useCallback(() => {
    const token = getToken();
    const auth0UserData = localStorage.getItem('auth0_user');
    
    if (auth0UserData && token) {
      const auth0User = JSON.parse(auth0UserData);
      const userWithDefaults = {
        ...auth0User,
        id: auth0User.sub || auth0User.id || '',
        name: auth0User.name || auth0User.nickname || auth0User.email || 'Utilisateur',
        email: auth0User.email || 'N/A',
        picture: auth0User.picture || generateAvatarUrl(auth0User.name || auth0User.email)
      };
      setUser(userWithDefaults);
      setIsAuthenticated(true);
      return userWithDefaults;
    }
    
    setUser(null);
    setIsAuthenticated(false);
    return null;
  }, []);
  
  // Synchronisation après connexion Auth0
  const syncProfileAfterLogin = useCallback(async () => {
    const auth0User = initializeUserFromAuth0();
    if (auth0User) {
      notifyAuthChange();
      // Enrichissement en arrière-plan
      setTimeout(async () => {
        try {
          await loadUserProfile();
        } catch (error) {
          console.warn('Enrichissement échoué, conservation des données Auth0');
        }
      }, 500);
    }
  }, [initializeUserFromAuth0]);
}
```

### 3. Stratégie de fallback et UserService

**Service** : `services/user.ts`

```typescript
async getProfile(): Promise<User> {
  // 1. Récupération immédiate des données Auth0 (localStorage)
  const storedAuth0User = localStorage.getItem('auth0_user');
  const auth0User = storedAuth0User ? JSON.parse(storedAuth0User) : {};
  
  // 2. Construction utilisateur de base
  const baseUser: User = {
    id: auth0User.sub || auth0User.id || `local-${Date.now()}`,
    email: auth0User.email || 'N/A',
    name: auth0User.name || auth0User.nickname || auth0User.email || 'Utilisateur',
    picture: auth0User.picture || generateAvatarUrl(auth0User.name || auth0User.email),
    phone: auth0User.phone || 'N/A',
    address: auth0User.address || 'N/A',
    role: auth0User.roles?.[0] || auth0User['https://ksuit.app/roles']?.[0] || '',
    idNumber: auth0User.idNumber || 'N/A',
    idStatus: auth0User.idStatus || undefined,
    createdAt: auth0User.updated_at || new Date().toISOString(),
  };
  
  // 3. Tentative d'enrichissement backend (avec timeout 10s)
  const token = getToken();
  if (!token) {
    return baseUser;
  }
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 10000);
    });
    
    const backendUserPromise = api.get<User>('/users/me');
    const backendUser = await Promise.race([backendUserPromise, timeoutPromise]);
    
    // Fusion des données avec validation
    const mergedUser = { 
      ...baseUser, 
      ...backendUser,
      id: backendUser.id || baseUser.id,
      name: backendUser.name || baseUser.name,
      email: backendUser.email || baseUser.email,
      picture: backendUser.picture || baseUser.picture,
      role: backendUser.role || baseUser.role
    };
    
    // Mise à jour du cache localStorage
    localStorage.setItem('auth0_user', JSON.stringify(mergedUser));
    return mergedUser;
    
  } catch (error) {
    console.warn('Backend user profile fetch failed. Using Auth0 data only.', error);
    return baseUser;
  }
}
```

**Architecture de fallback** :
- **Priorité 1** : Données Auth0 (localStorage) - Toujours disponibles immédiatement
- **Priorité 2** : Enrichissement backend - Si API disponible (timeout 10s)
- **Fallback** : Retour aux données Auth0 si backend indisponible
- **Cache** : Mise à jour du localStorage avec les données fusionnées

## Sécurité

### Headers automatiques

Tous les endpoints incluent automatiquement :
- `Authorization: Bearer ${token}`
- `Content-Type: application/json`
- `Accept: application/json`

### Gestion d'erreurs

- **401 Unauthorized** : Redirection vers Auth0
- **403 Forbidden** : Permissions insuffisantes
- **Token expiré** : Refresh automatique via Auth0

### Stockage sécurisé

**Fonctionnalités** :
- Wrapper sécurisé pour localStorage/sessionStorage
- Gestion centralisée des clés de stockage
- Nettoyage automatique lors de la déconnexion
- Protection contre les erreurs de stockage

## Endpoints protégés

**Tous les endpoints API nécessitent une authentification** :
- `/users/*` - Gestion des utilisateurs
- `/companies/*` - Gestion des entreprises  
- `/financial-institutions/*` - Institutions financières
- `/subscriptions/*` - Abonnements
- `/tokens/*` - Gestion des tokens
- `/payments/*` - Paiements

**Configuration automatique** : Aucune configuration manuelle nécessaire, l'authentification est gérée automatiquement par `ApiService`.

L'utilisateur qui crée le compte est automatiquement désigné comme administrateur de l'entreprise ou de l'institution financière.

```json
// Exemple de structure du token pour un nouvel utilisateur
{
  "sub": "auth0|60c72b6f6b35c5006907b123",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://cdn.auth0.com/avatars/jd.png",
  "isCompanyOwner": true,
  "permissions": ["admin:company"]
}
```

### Détermination du type de client

Lorsque l'utilisateur complète son profil via le formulaire CompanyFormModal ou FinancialInstitutionFormModal, le système détermine automatiquement le type de client à créer (PME ou Institution financière) en fonction des informations fournies dans le formulaire.

Ce type est enregistré dans le profil utilisateur via le champ `userType` qui peut prendre les valeurs `sme` (pour les PME) ou `financial_institution`.

## Déconnexion

La déconnexion est gérée automatiquement via le Header et implique plusieurs étapes sécurisées :

**Implémentation** : `components/layout/Header.tsx`

```typescript
function handleLogout() {
  console.log('🔓 Déconnexion en cours...');
  
  // 1. Nettoyer tous les tokens Auth0 du localStorage
  localStorage.removeItem('auth0_user');
  localStorage.removeItem('auth0_token');
  localStorage.removeItem('auth0_id_token');
  localStorage.removeItem('auth0_refresh_token');
  localStorage.removeItem('auth0_expires_in');
  localStorage.removeItem('auth0_token_type');
  localStorage.removeItem('auth0_error');
  
  // 2. Nettoyer la session
  sessionStorage.removeItem('auth0_code_verifier');
  sessionStorage.removeItem('auth0_state');
  sessionStorage.removeItem('auth0_just_logged_in');
  sessionStorage.removeItem('auth0_redirect_after_login');
  
  // 3. Fermer les menus ouverts
  setProfileMenuOpen(false);
  setAppsOpen(false);
  
  // 4. Déclencher l'événement de changement d'authentification
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  
  // 5. Redirection vers le logout Auth0 global
  const domain = AUTH0_DOMAIN;
  const clientId = AUTH0_CLIENT_ID;
  const returnTo = AUTH0_LOGOUT_URL;
  
  window.location.href = `https://${domain}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(returnTo)}`;
}
```

**Nettoyage automatique dans useUser** :
- Écoute des événements de déconnexion
- Réinitialisation complète de l'état utilisateur
- Arrêt des processus d'enrichissement en cours

## Intégration UI automatique

### Header intelligent

**Composant** : `components/layout/Header.tsx`

Le Header utilise le hook `useUser` pour :
- ✅ Afficher automatiquement le profil utilisateur connecté
- ✅ Gérer l'état de chargement pendant l'enrichissement des données
- ✅ Afficher un menu déroulant avec les options de profil
- ✅ Gérer la déconnexion sécurisée
- ✅ Se mettre à jour automatiquement après connexion/déconnexion

```typescript
export function Header() {
  const { user, isEnrichingData, isAuthenticated, syncProfileAfterLogin } = useUser();
  
  // Fusion des données Auth0 avec celles du backend
  const displayUser = React.useMemo(() => {
    const stored = localStorage.getItem('auth0_user');
    const auth0User = stored ? JSON.parse(stored) : null;
    
    // Le hook useUser retourne déjà les données fusionnées optimales
    return user || auth0User;
  }, [user]);
  
  // Écoute des événements d'authentification pour mise à jour immédiate
  useEffect(() => {
    const handleAuthEvent = () => {
      const storedUser = localStorage.getItem('auth0_user');
      if (storedUser) {
        syncProfileAfterLogin();
      }
    };
    
    window.addEventListener(AUTH_EVENT, handleAuthEvent);
    return () => window.removeEventListener(AUTH_EVENT, handleAuthEvent);
  }, [syncProfileAfterLogin]);
  
  return (
    // UI qui s'adapte automatiquement à l'état d'authentification
    {isAuthenticated ? (
      <UserProfileMenu user={displayUser} isEnriching={isEnrichingData} />
    ) : (
      <AuthButtons />
    )}
  );
}
```

### Événements d'authentification

**Système d'événements** : `hooks/useUser.ts`

```typescript
// Événement personnalisé pour synchronisation globale
export const AUTH_EVENT = 'auth_state_changed';

export function notifyAuthChange() {
  const event = new CustomEvent(AUTH_EVENT);
  window.dispatchEvent(event);
}
```

Les composants peuvent écouter `AUTH_EVENT` pour réagir aux changements d'authentification automatiquement.

## Sécurité et bonnes pratiques

### Protection PKCE
- ✅ Code Verifier généré aléatoirement (32 bytes)
- ✅ Code Challenge basé sur SHA256
- ✅ State parameter pour protection CSRF
- ✅ Stockage sécurisé en sessionStorage (temporaire)

### Gestion des tokens
- ✅ Tokens stockés dans localStorage (migration vers cookies HttpOnly recommandée)
- ✅ Tokens avec durée de vie limitée 
- ✅ Refresh tokens pour expérience utilisateur fluide
- ✅ Nettoyage automatique lors de la déconnexion

### Robustesse
- ✅ Timeout automatique (10s) pour les requêtes backend
- ✅ Retry automatique en cas d'échec (max 2 tentatives)
- ✅ Fallback immédiat vers les données Auth0
- ✅ Gestion des erreurs sans blocage de l'UI
- ✅ Protection contre les boucles infinies dans les useEffect
