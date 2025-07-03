# Authentification

## Vue d'ensemble

L'authentification dans l'application Wanzo est gérée via Auth0. Ce service sécurisé fournit des tokens JWT qui doivent être inclus dans toutes les requêtes API.

## Flux d'authentification

### 1. Inscription et connexion via Auth0

L'application front-end utilise la bibliothèque Auth0 PKCE pour gérer l'authentification. Voici le flux d'authentification typique :

1. L'utilisateur clique sur "Se connecter" ou "S'inscrire"
2. Il est redirigé vers la page de connexion/inscription Auth0
3. Après une authentification réussie, Auth0 redirige l'utilisateur vers l'application avec un code d'autorisation
4. L'application échange ce code contre des tokens d'accès et de rafraîchissement
5. Ces tokens sont stockés en sécurité dans le localStorage

```javascript
// Exemple d'initialisation d'Auth0 dans le front-end (utilisation de auth0pkce.ts)
const auth0Client = await createAuth0Client({
  domain: 'wanzo.auth0.com',
  clientId: 'YOUR_CLIENT_ID',
  audience: 'https://api.wanzo.tech',
  redirectUri: window.location.origin,
  useRefreshTokens: true,
  cacheLocation: 'localstorage'
});
```

### 2. Tokens JWT

Chaque requête à l'API doit inclure un token d'accès JWT dans l'en-tête Authorization :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Le token contient des informations importantes :
- `sub` : Identifiant unique de l'utilisateur
- `email` : Email de l'utilisateur
- `permissions` : Autorisations accordées à l'utilisateur
- `exp` : Date d'expiration du token

### 3. Gestion des tokens

#### Structure du token stocké

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "v1.1ref2342BZSFSD...",
  "expiresAt": 1625097600000
}
```

#### Vérification de l'expiration

Avant chaque requête API, l'application vérifie si le token d'accès est expiré :

```javascript
// Vérification de la validité du token
const isTokenValid = () => {
  const expiresAt = localStorage.getItem('expiresAt');
  return Date.now() < parseInt(expiresAt);
};
```

### 4. Rafraîchissement des tokens

Lorsque le token d'accès expire, l'application utilise le token de rafraîchissement pour obtenir un nouveau token d'accès sans que l'utilisateur n'ait à se reconnecter :

```javascript
// Exemple de rafraîchissement du token
const refreshToken = async () => {
  try {
    await auth0Client.checkSession();
    const token = await auth0Client.getTokenSilently();
    localStorage.setItem('accessToken', token);
    const expiresIn = 86400; // 24 heures
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem('expiresAt', expiresAt.toString());
    return token;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token', error);
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  }
};
```

## Création de compte et gestion des profils

### Création automatique du profil

Lors de la première connexion d'un utilisateur, un profil utilisateur est automatiquement créé dans la base de données. Le token contient les informations de base de l'utilisateur (email, nom, etc.).

### Utilisateur administrateur

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

La déconnexion implique plusieurs étapes :
1. Suppression des tokens du localStorage
2. Redirection vers l'URL de déconnexion d'Auth0
3. Redirection vers la page d'accueil de l'application

```javascript
// Exemple de déconnexion
const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('expiresAt');
  
  window.location.href = `https://wanzo.auth0.com/v2/logout?client_id=YOUR_CLIENT_ID&returnTo=${window.location.origin}`;
};
```

## Sécurité et bonnes pratiques

- Tous les tokens sont stockés dans le localStorage mais pourraient être migrés vers des cookies HttpOnly pour une meilleure sécurité
- Les tokens ont une durée de vie limitée (généralement 24h)
- Les tokens de rafraîchissement permettent une expérience utilisateur fluide
- Toutes les communications utilisent HTTPS
- Les permissions sont vérifiées côté serveur pour chaque requête
