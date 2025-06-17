# Guide d'authentification Admin Service avec Auth0 pour les développeurs frontend

Ce document explique en détail comment implémenter l'authentification et l'autorisation pour l'Admin Service en utilisant Auth0.

## Processus d'authentification pour l'Admin Service

### 1. Configuration Auth0 spécifique pour l'Admin Service

```javascript
// Configuration Auth0 pour l'Admin Service
const adminAuth0Config = {
  domain: 'dev-tezmln0tk0g1gouf.eu.auth0.com',
  clientId: 'hi5QJL06qQvMidq8ZZvqp2HWs0AiWhBI', // Client ID spécifique à l'Admin
  audience: 'https://api.wanzo.com',
  redirectUri: 'http://localhost:3000/admin/callback', // Page de callback admin
  scope: 'openid profile email read:admin write:admin' // Scopes spécifiques admin
};
```

### 2. Flux d'authentification Admin

1. **Redirection vers Auth0 avec contexte Admin**
   ```javascript
   const loginAsAdmin = async () => {
     await auth0.loginWithRedirect({
       ...adminAuth0Config,
       appState: { returnTo: '/admin/dashboard' } // Où rediriger après auth
     });
   };
   ```

2. **Traitement du callback**
   ```javascript
   const handleAdminCallback = async () => {
     // Gérer la redirection Auth0
     const { appState } = await auth0.handleRedirectCallback();
     
     // Vérifier si l'utilisateur a le rôle admin
     const user = await auth0.getUser();
     const isAdmin = user['https://api.wanzo.com/roles']?.includes('admin');
     
     if (!isAdmin) {
       // Rediriger vers une page d'erreur si pas admin
       window.location.href = '/unauthorized';
       return;
     }
     
     // Rediriger vers la page admin demandée
     window.location.href = appState?.returnTo || '/admin/dashboard';
   };
   ```

3. **Vérification du rôle Admin**
   ```javascript
   const checkAdminAccess = async () => {
     const user = await auth0.getUser();
     
     // Vérifier les rôles dans les custom claims du token
     const userRoles = user['https://api.wanzo.com/roles'] || [];
     const isAdmin = userRoles.includes('admin');
     
     if (!isAdmin) {
       // Rediriger ou afficher erreur
       throw new Error('Accès administrateur requis');
     }
     
     return true;
   };
   ```

### 3. Appels API à l'Admin Service

```javascript
// Créer un client API spécifique pour l'Admin Service
const adminApiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1/admin', // Via API Gateway
});

// Intercepteur pour ajouter le token JWT
adminApiClient.interceptors.request.use(async (config) => {
  if (await auth0.isAuthenticated()) {
    const token = await auth0.getTokenSilently(adminAuth0Config);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Exemple d'appel API admin
const getUsersList = async () => {
  try {
    await checkAdminAccess(); // Vérifier les droits côté client
    const response = await adminApiClient.get('/users');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    // Gérer les erreurs d'authentification/autorisation
    if (error.response?.status === 401) {
      await auth0.loginWithRedirect(adminAuth0Config);
    } else if (error.response?.status === 403) {
      // Pas les permissions nécessaires
      window.location.href = '/unauthorized';
    }
    throw error;
  }
};
```

## Instructions spécifiques pour les développeurs frontend

### Organisation du code frontend

1. **Structure recommandée**
   ```
   /src
     /auth
       auth0-provider.js  // Configuration Auth0
       admin-auth.js      // Logique d'authentification admin
       use-admin-auth.js  // Hook React pour l'auth admin
     /api
       admin-api.js       // Client API pour l'admin service
     /pages
       /admin
         /callback        // Page de callback admin
         /dashboard       // Dashboard admin
         /users           // Gestion des utilisateurs
         ...
     /components
       /admin
         AdminLayout.js   // Layout avec vérification auth admin
         ...
   ```

2. **Protéger les routes Admin**
   ```jsx
   // AdminRoute.js - Composant pour protéger les routes admin
   const AdminRoute = ({ component: Component, ...rest }) => {
     const { isAuthenticated, isAdmin, isLoading } = useAdminAuth();
     
     if (isLoading) return <LoadingSpinner />;
     
     return (
       <Route {...rest} render={props => 
         isAuthenticated && isAdmin ? (
           <Component {...props} />
         ) : (
           <Redirect to="/unauthorized" />
         )
       } />
     );
   };
   ```

### Intégration avec l'API Admin Service

1. **Endpoints importants**
   - `GET /api/v1/admin/users` - Liste des utilisateurs
   - `POST /api/v1/admin/users` - Créer un utilisateur
   - `GET /api/v1/admin/dashboard/stats` - Statistiques pour le dashboard
   - `GET /api/v1/admin/company/:id` - Détails d'une entreprise

2. **Gestion des réponses de l'API**
   ```javascript
   // Exemple de hook pour l'API admin
   const useAdminUsers = () => {
     const { getAdminToken } = useAdminAuth();
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
     
     const fetchUsers = async () => {
       try {
         setLoading(true);
         const token = await getAdminToken();
         const response = await fetch('http://localhost:8000/api/v1/admin/users', {
           headers: {
             Authorization: `Bearer ${token}`
           }
         });
         
         if (!response.ok) {
           throw new Error(`Erreur API: ${response.status}`);
         }
         
         const data = await response.json();
         setUsers(data);
       } catch (err) {
         setError(err.message);
       } finally {
         setLoading(false);
       }
     };
     
     useEffect(() => {
       fetchUsers();
     }, []);
     
     return { users, loading, error, refetch: fetchUsers };
   };
   ```

### Points clés pour la sécurité

1. **Vérifications doubles**
   - Vérifier les rôles admin côté client ET côté serveur
   - Ne jamais faire confiance uniquement à l'UI pour la sécurité

2. **Gestion de session**
   - Implémenter un timeout de session pour les interfaces admin
   - Prévoir une déconnexion automatique après inactivité

3. **Limitation des permissions**
   - Demander uniquement les scopes nécessaires
   - Utiliser des tokens avec durée de vie plus courte pour l'admin

4. **Indicateurs d'activité**
   - Ajouter des indicateurs visuels pour confirmer que l'utilisateur est connecté en tant qu'admin
   - Afficher le nom/email de l'administrateur connecté

## Exemple complet d'intégration (React)

```jsx
// AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../auth/use-admin-auth';
import { adminApiClient } from '../api/admin-api';

const AdminDashboard = () => {
  const { user, isAdmin, getAdminToken } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        // Vérification côté client
        if (!isAdmin) {
          window.location.href = '/unauthorized';
          return;
        }
        
        const token = await getAdminToken();
        const response = await adminApiClient.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Erreur dashboard admin:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminDashboard();
  }, [isAdmin, getAdminToken]);
  
  if (loading) return <div>Chargement du dashboard admin...</div>;
  
  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Dashboard Administrateur</h1>
        <div className="admin-user-info">
          Connecté en tant que: {user.email} (Administrateur)
        </div>
      </header>
      
      {/* Contenu du dashboard */}
      <div className="admin-stats">
        <div className="stat-card">
          <h3>Utilisateurs totaux</h3>
          <div className="stat-value">{stats?.userCount || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Entreprises actives</h3>
          <div className="stat-value">{stats?.activeCompanies || 0}</div>
        </div>
        
        {/* Autres statistiques */}
      </div>
      
      {/* Actions rapides */}
      <div className="admin-quick-actions">
        <button onClick={() => window.location.href = '/admin/users'}>
          Gérer les utilisateurs
        </button>
        <button onClick={() => window.location.href = '/admin/companies'}>
          Gérer les entreprises
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

## Points d'accès à l'Admin Service

- Documentation API : http://localhost:3001/api-docs
- Base URL API Gateway : http://localhost:8000/api/v1/admin
- URL Admin directe : http://localhost:3001/api

## Assistance et ressources supplémentaires

Pour toute question concernant l'intégration de l'authentification avec l'Admin Service, veuillez contacter l'équipe backend ou consulter la documentation additionnelle dans le dossier `docs` du projet.
