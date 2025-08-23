# Documentation - Gestion du Premier Signup

## Problème Résolu

Après un signup Auth0, l'application essayait automatiquement de récupérer les données utilisateur avec `GET /users/me`, mais ce user n'existait pas encore côté backend car il venait juste d'être créé sur Auth0, générant des erreurs 404.

## Solution Implémentée

### 1. **Détection du Premier Utilisateur**

Dans `Callback.tsx`, nous détectons si c'est un premier signup :

```typescript
// Vérifier si c'est un signup (premier login)
const isFirstTimeUser = payload.email_verified === false || 
                       payload['https://auth0.com/claims/is_new_user'] === true ||
                       !payload.updated_at ||
                       new Date(payload.iat * 1000).getTime() === new Date(payload.updated_at).getTime();

if (isFirstTimeUser) {
  sessionStorage.setItem('auth0_first_time_user', 'true');
  console.log('[Auth0 Callback] Premier utilisateur détecté, création côté backend');
}
```

### 2. **Création du Premier Utilisateur**

Nouveau service `userApiService.createFirstTimeUser()` :

```typescript
async createFirstTimeUser(userData: {
  email: string;
  name: string;
  picture?: string;
  userType?: 'sme' | 'financial_institution';
  companyName?: string;
}): Promise<UserResponse> {
  const response = await api.post<ApiResponse<UserResponse>>('/users', {
    ...userData,
    isFirstTimeUser: true, // Indique au backend que c'est le premier user (owner/admin)
  });
  return response.data;
}
```

### 3. **Logique Intelligente dans useUser**

Dans `enrichUserData()`, gestion automatique du cas 404 :

```typescript
catch (apiError: any) {
  if (apiError?.status === 404) {
    console.log('👤 Utilisateur non trouvé côté backend, création du premier utilisateur...');
    
    // Créer l'utilisateur côté backend pour la première fois
    const newUser = await userApiService.createFirstTimeUser({
      email: initialUser.email,
      name: initialUser.name || initialUser.email || 'Utilisateur',
      picture: initialUser.picture,
      userType: 'sme', // Par défaut
    });
    
    // Fusion avec les données Auth0
    enrichedUser = { ...initialUser, ...newUser };
    
    // Nettoyer le flag après création
    sessionStorage.removeItem('auth0_first_time_user');
  }
}
```

## Flux Complet

1. **Signup Auth0** → Utilisateur créé sur Auth0
2. **Callback Auth0** → Détection premier utilisateur + flag sessionStorage
3. **useUser.enrichUserData()** → Tentative `GET /users/me`
4. **404 détecté** → Appel automatique `POST /users` avec `isFirstTimeUser: true`
5. **Backend** → Création utilisateur + entreprise vide avec l'utilisateur comme owner/admin
6. **Frontend** → Données fusionnées Auth0 + Backend, flag nettoyé

## Avantages

- ✅ **Automatique** : Aucune intervention manuelle nécessaire
- ✅ **Robuste** : Fallback sur mocks en cas d'échec
- ✅ **Backend-Ready** : Le flag `isFirstTimeUser: true` informe le backend
- ✅ **Une seule fois** : Le flag est nettoyé après création
- ✅ **Seamless UX** : L'utilisateur ne voit aucune erreur

## Backend Requirements

Le backend doit :

1. Avoir un endpoint `POST /users` qui accepte `isFirstTimeUser: true`
2. Créer automatiquement une entreprise vide quand `isFirstTimeUser: true`
3. Assigner l'utilisateur comme owner/admin de cette entreprise
4. Retourner les données utilisateur dans le format `UserResponse`

## Configuration Backend Attendue

```json
{
  "isFirstTimeUser": true,
  "email": "user@example.com",
  "name": "Jean Dupont",
  "picture": "https://...",
  "userType": "sme"
}
```

Le backend devrait créer :
- Un utilisateur avec role "admin/owner"
- Une entreprise vide associée
- Les relations appropriées
