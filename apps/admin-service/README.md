# Guide d'intégration du Frontend Admin avec le Backend Wanzo

Ce document explique comment configurer l'application frontend React+Vite pour qu'elle communique correctement avec l'architecture microservices de Wanzo, en se concentrant sur l'authentification via Auth0 et l'interaction avec l'admin-service à travers l'API Gateway.

## Architecture de Communication

Le frontend d'administration suit le flux suivant pour communiquer avec le backend :

1. **Authentification** : L'utilisateur s'authentifie via Auth0
2. **Gestion des Tokens** : Les tokens JWT sont stockés et gérés de manière sécurisée
3. **API Gateway** : Toutes les requêtes API sont acheminées via l'API Gateway
4. **Admin Service** : Les fonctionnalités spécifiques d'administration sont accessibles via le microservice admin-service

```
┌───────────────┐       ┌────────────┐       ┌───────────────┐
│ React+Vite    │──────▶│  Auth0     │──────▶│ JWT Token     │
│ Admin Frontend│       └────────────┘       │ (avec scopes  │
└───────────────┘                            │  admin)       │
       │                                     └───────────────┘
       │                                            │
       │                                            ▼
       │                                    ┌───────────────┐
       └───────────────────────────────────▶│  API Gateway  │
                                            └───────────────┘
                                                    │
                    ┌────────────────────────┬─────┴─────┐
                    ▼                        ▼           ▼
            ┌───────────────┐        ┌─────────────┐    ┌───────────────┐
            │ Auth Service  │        │ Admin Service│    │ Autres        │
            │ (port 3000)   │        │ (port 3001) │    │ Microservices │
            └───────────────┘        └─────────────┘    └───────────────┘
```

## Configuration du Frontend

### 1. Configuration des Variables d'Environnement

Créez un fichier `.env` à la racine de votre projet React+Vite avec la configuration suivante :

```
# Configuration de l'API Gateway
VITE_API_GATEWAY_URL=http://localhost:8000/api

# URLs des services directs (à utiliser uniquement si nécessaire)
VITE_AUTH_SERVICE_URL=http://localhost:3000/api
VITE_ADMIN_SERVICE_URL=http://localhost:3001/api

# Configuration Auth0
VITE_AUTH0_DOMAIN=dev-tezmln0tk0g1gouf.eu.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id_here
VITE_AUTH0_AUDIENCE=https://api.wanzo.com
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_AUTH0_LOGOUT_URI=http://localhost:5173
VITE_AUTH0_SCOPE="openid profile email admin:full users:manage settings:manage"
```

⚠️ **Important** : Pour le déploiement en production, mettez à jour toutes les URL avec vos domaines de production.

### 2. Installation des Dépendances Requises

Ajoutez les packages suivants à votre projet React+Vite :

```bash
npm install @auth0/auth0-react axios jwt-decode react-router-dom
```

### 3. Intégration avec Auth0

#### Configuration du Provider Auth0

Créez un composant `AuthProvider.tsx` pour envelopper votre application :

```tsx
// src/auth/AuthProvider.tsx
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState: any) => {
    navigate(appState?.returnTo || '/dashboard');
  };

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: import.meta.env.VITE_AUTH0_SCOPE
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};
};
```

#### Intégration dans l'Application

Dans votre fichier principal d'application, enveloppez vos composants avec l'AuthProvider :

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### 4. Configuration du Service API

Créez un service API qui inclut automatiquement les tokens d'authentification :

```tsx
// src/services/api.ts
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

// Créer une instance axios
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Hook pour obtenir une instance API authentifiée
export const useApi = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  // Ajouter le token aux requêtes si l'utilisateur est authentifié
  apiClient.interceptors.request.use(
    async (config) => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Erreur lors de l\'obtention du token:', error);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return {
    // Méthodes API génériques
    get: <T>(endpoint: string) => apiClient.get<T>(endpoint),
    post: <T>(endpoint: string, data: any) => apiClient.post<T>(endpoint, data),
    put: <T>(endpoint: string, data: any) => apiClient.put<T>(endpoint, data),
    delete: <T>(endpoint: string) => apiClient.delete<T>(endpoint),
    
    // Méthodes API spécifiques à l'administration
    getUsers: () => apiClient.get('/admin/users'),
    getSettings: () => apiClient.get('/admin/settings'),
    getCompanies: () => apiClient.get('/admin/companies'),
    getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),
    // Ajoutez d'autres méthodes spécifiques à l'administration selon vos besoins
  };
};
```

### 5. Protection des Routes d'Administration

Créez un composant de garde d'authentification pour protéger les routes d'administration :

```tsx
// src/auth/ProtectedRoute.tsx
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredScopes?: string[];
}

export const ProtectedRoute = ({ 
  children, 
  requiredScopes = [] 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth0();
  
  // Afficher un indicateur de chargement
  if (isLoading) {
    return <div>Chargement...</div>;
  }
  
  // Vérifier l'authentification
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Vérifier les autorisations si nécessaire
  if (requiredScopes.length > 0) {
    const userScopes = (user?.['https://api.wanzo.com/scopes'] || '').split(' ');
    const hasRequiredScopes = requiredScopes.every(scope => 
      userScopes.includes(scope)
    );
    
    if (!hasRequiredScopes) {
      return <Navigate to="/non-autorise" replace />;
    }
  }
  
  return <>{children}</>;
};
```

### 6. Composants de Connexion et Déconnexion

Créez des composants de connexion et déconnexion :

```tsx
// src/components/LoginButton.tsx
import { useAuth0 } from '@auth0/auth0-react';

export const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <button 
      onClick={() => loginWithRedirect()}
      className="btn btn-primary"
    >
      Connexion
    </button>
  );
};

// src/components/LogoutButton.tsx
import { useAuth0 } from '@auth0/auth0-react';

export const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <button 
      onClick={() => logout({ 
        logoutParams: { 
          returnTo: window.location.origin 
        } 
      })}
      className="btn btn-secondary"
    >
      Déconnexion
    </button>
  );
};
```

### 7. Exemple d'Utilisation

Voici comment utiliser ces composants dans votre application :

```tsx
// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { LoginButton } from './components/LoginButton';
import { LogoutButton } from './components/LogoutButton';
import { ProtectedRoute } from './auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NonAutorise from './pages/NonAutorise';

function App() {
  const { isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>Tableau de Bord d'Administration Wanzo</h1>
        {isAuthenticated ? <LogoutButton /> : <LoginButton />}
      </header>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/non-autorise" element={<NonAutorise />} />
        <Route path="/auth/callback" element={<div>Traitement de la connexion...</div>} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/utilisateurs" element={
          <ProtectedRoute requiredScopes={['admin:full', 'users:manage']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/parametres" element={
          <ProtectedRoute requiredScopes={['admin:full', 'settings:manage']}>
            <Settings />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
```

## Effectuer des Appels API

Exemple d'appels API au service d'administration via l'API Gateway :

```tsx
// src/pages/UserManagement.tsx
import { useState, useEffect } from 'react';
import { useApi } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  // Ajoutez d'autres propriétés utilisateur
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.getUsers();
        setUsers(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        setError(err.message || 'Impossible de charger les utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [api]);

  return (
    <div className="user-management">
      <h2>Gestion des Utilisateurs</h2>
      
      {loading && <div>Chargement des utilisateurs...</div>}
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && (
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => /* gérer l'édition */}>Modifier</button>
                  <button onClick={() => /* gérer la suppression */}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;
```

## Dépannage

### Problèmes Courants avec Auth0

1. **L'authentification échoue ou boucle** :
   - Vérifiez la configuration Auth0 dans vos variables d'environnement
   - Assurez-vous que l'URI de redirection correspond exactement à celle configurée dans Auth0
   - Vérifiez que l'audience est correctement définie sur `https://api.wanzo.com`

2. **Tokens manquants ou erreurs d'autorisation** :
   - Confirmez que l'utilisateur possède les autorisations requises (`admin:full`, `users:manage`, `settings:manage`)
   - Vérifiez si le token a expiré et doit être rafraîchi
   - Assurez-vous que le token est correctement attaché aux requêtes API

3. **Erreurs CORS** :
   - Le backend est configuré pour autoriser les requêtes depuis des origines spécifiques, notamment :
     - `http://localhost:3000`
     - `http://localhost:3001`
     - `http://localhost:3002`
     - `http://localhost:3003`
     - `http://localhost:4000`
   - Si votre application Vite fonctionne sur un port différent, mettez à jour la configuration CORS dans le backend

### Débogage des Appels API

1. **Connexion à l'API Gateway** :
   - Si les appels API échouent, consultez la console pour les messages d'erreur détaillés
   - Utilisez les outils de développement du navigateur pour inspecter les requêtes réseau
   - Vérifiez que l'URL de l'API Gateway est correcte

2. **Validation des Tokens** :
   - Vous pouvez vérifier le contenu des tokens sur [jwt.io](https://jwt.io)
   - Confirmez que le token contient l'audience et les autorisations correctes

3. **En-têtes de Requête** :
   - Assurez-vous que l'en-tête Authorization est correctement formaté : `Bearer <token>`
   - Vérifiez que Content-Type est défini sur `application/json`

## Considérations pour le Déploiement

Ajustez vos variables d'environnement en fonction de l'environnement de déploiement :

- **Développement** : Utilisez les URL localhost
- **Pré-production** : Utilisez les URL du serveur de pré-production
- **Production** : Utilisez les noms de domaine de production

Pour chaque environnement, mettez à jour :
- Les points d'accès API
- La configuration Auth0
- Les paramètres CORS sur le backend

## Fonctionnalités Spécifiques du Tableau de Bord Admin

Le tableau de bord d'administration de Wanzo fournit plusieurs fonctionnalités clés :

1. **Gestion des Utilisateurs** :
   - Création, modification et suppression des comptes utilisateurs
   - Attribution et gestion des rôles et permissions
   - Validation et vérification des comptes

2. **Gestion des Entreprises** :
   - Configuration des entreprises clientes
   - Gestion des abonnements et des plans tarifaires
   - Paramètres spécifiques à chaque entreprise

3. **Tableaux de Bord et Métriques** :
   - Visualisation des KPIs principaux
   - Graphiques d'activité et d'utilisation
   - Rapports d'analyse de performance

4. **Paramètres Système** :
   - Configuration globale de la plateforme
   - Gestion des intégrations tierces
   - Réglages de sécurité et conformité

## Support

Si vous rencontrez des problèmes lors de l'intégration du frontend avec le service d'administration :

1. **Support Backend** :
   - Pour les problèmes spécifiques à l'API ou au service, contactez l'équipe backend
   - Pour les problèmes d'authentification, consultez l'administrateur Auth0

2. **Développement Frontend** :
   - Consultez la documentation React+Vite pour les questions spécifiques au framework
   - Consultez la documentation du SDK React Auth0 pour les détails d'implémentation de l'authentification

---

En suivant ce guide, votre frontend d'administration React+Vite devrait s'intégrer avec succès à l'architecture backend de Wanzo, en utilisant Auth0 pour l'authentification et l'API Gateway pour accéder aux fonctionnalités du service d'administration.
