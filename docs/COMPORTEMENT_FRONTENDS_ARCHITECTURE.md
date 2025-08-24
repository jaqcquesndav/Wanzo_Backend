# Comportement des Frontends dans l'Architecture Wanzo

## Vue d'ensemble des Frontends

L'écosystème Wanzo comprend 4 frontends distincts avec des technologies et usages différents :

| Frontend | Technologie | Plateforme | Service Backend | Type d'utilisateur |
|----------|-------------|------------|-----------------|-------------------|
| **Gestion Commerciale** | Flutter | Mobile (iOS/Android) | Gestion Commerciale Service | SME (Entreprises) |
| **Accounting** | React/Vite | Web (Responsive) | Accounting Service | SME + Institutions |
| **Customer (Landing)** | React/Vite | Web (Responsive) | Customer Service | Prospects + Admins |
| **Portfolio** | React/Vite | Web (Responsive) | Portfolio Service | Institutions Financières |

## 🔐 Processus d'Authentification Unifié

### Phase 1 : Configuration Auth0 par Frontend

#### 1.1 Flutter Mobile (Gestion Commerciale)
```dart
// lib/auth/auth0_config.dart
class Auth0Config {
  static const String domain = 'wanzo.eu.auth0.com';
  static const String clientId = 'gestion_commerciale_flutter_client';
  static const String audience = 'https://api.wanzo.com';
  static const List<String> scopes = [
    'openid',
    'profile', 
    'email',
    'company:read',
    'company:manage'
  ];
}

// lib/auth/auth_service.dart
class AuthService {
  late Auth0 auth0;
  
  Future<void> initialize() async {
    auth0 = Auth0(
      domain: Auth0Config.domain,
      clientId: Auth0Config.clientId,
    );
  }
  
  Future<Credentials?> login() async {
    try {
      final credentials = await auth0.webAuthentication().login(
        audience: Auth0Config.audience,
        scopes: Auth0Config.scopes,
      );
      
      // Stocker le token de manière sécurisée
      await _secureStorage.write(
        key: 'access_token', 
        value: credentials.accessToken
      );
      
      return credentials;
    } catch (e) {
      print('Erreur login: $e');
      return null;
    }
  }
  
  Future<UserProfile?> getUserProfile() async {
    final token = await _secureStorage.read(key: 'access_token');
    if (token == null) return null;
    
    try {
      // Appel au backend pour récupérer le profil complet
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/auth/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return UserProfile.fromJson(data);
      }
      
      return null;
    } catch (e) {
      print('Erreur récupération profil: $e');
      return null;
    }
  }
}
```

#### 1.2 React/Vite Web (Accounting, Customer, Portfolio)
```typescript
// src/auth/auth0Config.ts
import { Auth0ClientOptions } from '@auth0/auth0-spa-js';

export const auth0Configs: Record<string, Auth0ClientOptions> = {
  accounting: {
    domain: 'wanzo.eu.auth0.com',
    clientId: 'accounting_web_client',
    audience: 'https://api.wanzo.com',
    scope: 'openid profile email organization:read organization:manage',
    redirectUri: window.location.origin,
  },
  customer: {
    domain: 'wanzo.eu.auth0.com', 
    clientId: 'customer_web_client',
    audience: 'https://api.wanzo.com',
    scope: 'openid profile email customer:read customer:manage',
    redirectUri: window.location.origin,
  },
  portfolio: {
    domain: 'wanzo.eu.auth0.com',
    clientId: 'portfolio_web_client', 
    audience: 'https://api.wanzo.com',
    scope: 'openid profile email institution:read institution:manage',
    redirectUri: window.location.origin,
  },
};

// src/auth/AuthProvider.tsx
import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Configs } from './auth0Config';

interface AuthProviderProps {
  children: React.ReactNode;
  appType: 'accounting' | 'customer' | 'portfolio';
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, appType }) => {
  const config = auth0Configs[appType];
  
  return (
    <Auth0Provider {...config}>
      {children}
    </Auth0Provider>
  );
};

// src/hooks/useWanzoAuth.ts
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface WanzoUserProfile {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isOwner: boolean; // Premier utilisateur/propriétaire
  };
  entity: {
    id: string;
    name: string;
    type: 'SME' | 'INSTITUTION';
    // Autres propriétés selon le service
  };
}

export const useWanzoAuth = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    loginWithRedirect, 
    logout, 
    getAccessTokenSilently,
    user 
  } = useAuth0();
  
  const [wanzoProfile, setWanzoProfile] = useState<WanzoUserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  useEffect(() => {
    const getProfile = async () => {
      if (!isAuthenticated || !user) {
        setProfileLoading(false);
        return;
      }
      
      try {
        const token = await getAccessTokenSilently();
        
        // Configuration de l'API client avec le token
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Récupération du profil complet depuis le backend
        const response = await apiClient.get('/auth/profile');
        setWanzoProfile(response.data);
        
      } catch (error) {
        console.error('Erreur récupération profil Wanzo:', error);
        
        // Gestion des erreurs spécifiques
        if (error.response?.status === 401) {
          // Token invalide ou entité non associée
          logout({ returnTo: window.location.origin });
        }
      } finally {
        setProfileLoading(false);
      }
    };
    
    getProfile();
  }, [isAuthenticated, user, getAccessTokenSilently]);
  
  return {
    // Auth0 states
    isAuthenticated,
    isLoading: isLoading || profileLoading,
    loginWithRedirect,
    logout,
    auth0User: user,
    
    // Wanzo specific
    wanzoProfile,
    isOwner: wanzoProfile?.user?.isOwner ?? false,
    entity: wanzoProfile?.entity,
    
    // Helper methods
    getToken: getAccessTokenSilently,
  };
};
```

## 🎯 Comportement Spécifique par Frontend

### 1. Frontend Gestion Commerciale (Flutter Mobile)

#### Flux d'authentification
```dart
// lib/screens/login_screen.dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthService _authService = GetIt.instance<AuthService>();
  bool _isLoading = false;
  
  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    
    try {
      final credentials = await _authService.login();
      
      if (credentials != null) {
        // Récupérer le profil utilisateur avec l'entreprise
        final profile = await _authService.getUserProfile();
        
        if (profile != null && profile.company != null) {
          // Naviguer vers le dashboard principal
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => DashboardScreen()),
          );
        } else {
          // Utilisateur sans entreprise associée
          _showCompanyAssociationDialog();
        }
      }
    } catch (e) {
      _showErrorDialog('Erreur de connexion: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }
  
  void _showCompanyAssociationDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('Entreprise non associée'),
        content: Text(
          'Votre compte n\'est pas encore associé à une entreprise. '
          'Veuillez contacter votre administrateur ou compléter '
          'votre inscription.'
        ),
        actions: [
          TextButton(
            onPressed: () => _authService.logout(),
            child: Text('Se déconnecter'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => CompanyRegistrationScreen()),
              );
            },
            child: Text('Inscription entreprise'),
          ),
        ],
      ),
    );
  }
}

// lib/models/user_profile.dart
class UserProfile {
  final User user;
  final Company? company;
  
  UserProfile({required this.user, this.company});
  
  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      user: User.fromJson(json['user']),
      company: json['company'] != null ? Company.fromJson(json['company']) : null,
    );
  }
  
  bool get hasCompany => company != null;
  bool get isOwner => user.isOwner ?? false;
}

class Company {
  final String id;
  final String name;
  final String registrationNumber;
  final String type;
  final String country;
  final String ownerId; // Premier utilisateur/propriétaire
  
  Company({
    required this.id,
    required this.name,
    required this.registrationNumber,
    required this.type,
    required this.country,
    required this.ownerId,
  });
  
  factory Company.fromJson(Map<String, dynamic> json) {
    return Company(
      id: json['id'],
      name: json['name'],
      registrationNumber: json['registrationNumber'],
      type: json['type'],
      country: json['country'],
      ownerId: json['ownerId'],
    );
  }
}
```

#### Dashboard avec gestion du rôle owner
```dart
// lib/screens/dashboard_screen.dart
class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<UserProfile?>(
      future: GetIt.instance<AuthService>().getUserProfile(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        
        final profile = snapshot.data;
        if (profile == null || !profile.hasCompany) {
          return LoginScreen(); // Retour au login si pas de profil
        }
        
        return Scaffold(
          appBar: AppBar(
            title: Text('${profile.company!.name}'),
            actions: [
              if (profile.isOwner)
                IconButton(
                  icon: Icon(Icons.admin_panel_settings),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => AdminScreen()),
                  ),
                ),
              IconButton(
                icon: Icon(Icons.logout),
                onPressed: () => GetIt.instance<AuthService>().logout(),
              ),
            ],
          ),
          body: _buildDashboardContent(profile),
          bottomNavigationBar: _buildBottomNavigation(profile),
        );
      },
    );
  }
  
  Widget _buildDashboardContent(UserProfile profile) {
    return Column(
      children: [
        // Header avec info entreprise
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.blue.shade600, Colors.blue.shade800],
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Bienvenue, ${profile.user.firstName}',
                style: TextStyle(color: Colors.white, fontSize: 20),
              ),
              Text(
                profile.company!.name,
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
              if (profile.isOwner)
                Chip(
                  label: Text('Propriétaire'),
                  backgroundColor: Colors.orange,
                  labelStyle: TextStyle(color: Colors.white),
                ),
            ],
          ),
        ),
        
        // Contenu principal selon les permissions
        Expanded(
          child: _buildMainContent(profile),
        ),
      ],
    );
  }
  
  Widget _buildMainContent(UserProfile profile) {
    return GridView.count(
      crossAxisCount: 2,
      padding: EdgeInsets.all(16),
      children: [
        _buildDashboardCard(
          'Ventes',
          Icons.trending_up,
          Colors.green,
          () => Navigator.push(context, MaterialPageRoute(builder: (context) => SalesScreen())),
        ),
        _buildDashboardCard(
          'Clients',
          Icons.people,
          Colors.blue,
          () => Navigator.push(context, MaterialPageRoute(builder: (context) => ClientsScreen())),
        ),
        _buildDashboardCard(
          'Produits',
          Icons.inventory,
          Colors.orange,
          () => Navigator.push(context, MaterialPageRoute(builder: (context) => ProductsScreen())),
        ),
        if (profile.isOwner)
          _buildDashboardCard(
            'Administration',
            Icons.settings,
            Colors.red,
            () => Navigator.push(context, MaterialPageRoute(builder: (context) => AdminScreen())),
          ),
      ],
    );
  }
}
```

### 2. Frontend Accounting (React/Vite Web)

#### Composant d'authentification et routing
```typescript
// src/App.tsx
import { useWanzoAuth } from './hooks/useWanzoAuth';
import { AuthProvider } from './auth/AuthProvider';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { EntityAssociation } from './pages/EntityAssociation';

function AppContent() {
  const { isAuthenticated, isLoading, wanzoProfile, isOwner } = useWanzoAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  if (!wanzoProfile?.entity) {
    return <EntityAssociation />;
  }
  
  return (
    <Dashboard 
      userProfile={wanzoProfile} 
      isOwner={isOwner}
    />
  );
}

export function App() {
  return (
    <AuthProvider appType="accounting">
      <AppContent />
    </AuthProvider>
  );
}

// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { WanzoUserProfile } from '../types/auth';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { AccountingOverview } from '../components/AccountingOverview';
import { AdminPanel } from '../components/AdminPanel';

interface DashboardProps {
  userProfile: WanzoUserProfile;
  isOwner: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, isOwner }) => {
  const [activeView, setActiveView] = useState<string>('overview');
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        userProfile={userProfile}
        isOwner={isOwner}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          userName={`${userProfile.user.firstName} ${userProfile.user.lastName}`}
          entityName={userProfile.entity.name}
          isOwner={isOwner}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {activeView === 'overview' && <AccountingOverview entity={userProfile.entity} />}
          {activeView === 'transactions' && <TransactionsView entity={userProfile.entity} />}
          {activeView === 'reports' && <ReportsView entity={userProfile.entity} />}
          {activeView === 'admin' && isOwner && <AdminPanel entity={userProfile.entity} />}
        </main>
      </div>
    </div>
  );
};

// src/components/Header.tsx
import { useWanzoAuth } from '../hooks/useWanzoAuth';
import { Badge } from './Badge';

interface HeaderProps {
  userName: string;
  entityName: string;
  isOwner: boolean;
}

export const Header: React.FC<HeaderProps> = ({ userName, entityName, isOwner }) => {
  const { logout } = useWanzoAuth();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Comptabilité - {entityName}
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-600">
              Connecté en tant que {userName}
            </span>
            {isOwner && (
              <Badge variant="warning" size="sm">
                Propriétaire
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => logout({ returnTo: window.location.origin })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
};
```

### 3. Frontend Customer (Landing - React/Vite Web)

#### Gestion spécifique pour prospects et création d'entités
```typescript
// src/pages/CustomerLanding.tsx
import { useWanzoAuth } from '../hooks/useWanzoAuth';
import { EntityCreationWizard } from '../components/EntityCreationWizard';
import { ProspectDashboard } from '../components/ProspectDashboard';
import { AdminDashboard } from '../components/AdminDashboard';

export const CustomerLanding: React.FC = () => {
  const { isAuthenticated, wanzoProfile, isOwner } = useWanzoAuth();
  
  if (!isAuthenticated) {
    return <PublicLanding />;
  }
  
  // Utilisateur authentifié mais sans entité = prospect
  if (!wanzoProfile?.entity) {
    return <EntityCreationWizard />;
  }
  
  // Utilisateur avec entité
  if (isOwner) {
    return <AdminDashboard userProfile={wanzoProfile} />;
  }
  
  return <ProspectDashboard userProfile={wanzoProfile} />;
};

// src/components/EntityCreationWizard.tsx
import { useState } from 'react';
import { apiClient } from '../api/client';
import { useWanzoAuth } from '../hooks/useWanzoAuth';

type EntityType = 'SME' | 'INSTITUTION';

interface EntityFormData {
  type: EntityType;
  name: string;
  registrationNumber: string;
  licenseNumber?: string; // Pour institutions seulement
  country: string;
  email: string;
  phone: string;
  address: string;
}

export const EntityCreationWizard: React.FC = () => {
  const { auth0User, getToken } = useWanzoAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<EntityFormData>({
    type: 'SME',
    name: '',
    registrationNumber: '',
    country: '',
    email: auth0User?.email || '',
    phone: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const token = await getToken();
      
      const payload = {
        ...formData,
        ownerId: auth0User?.sub, // ID Auth0 du premier utilisateur
        ownerEmail: auth0User?.email,
        ownerName: auth0User?.name,
      };
      
      const response = await apiClient.post('/customers', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.status === 201) {
        // Redirection vers le service approprié
        if (formData.type === 'SME') {
          window.location.href = '/gestion-commerciale';
        } else {
          window.location.href = '/portfolio';
        }
      }
      
    } catch (error) {
      console.error('Erreur création entité:', error);
      // Gestion d'erreur
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Créer votre entité
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Étape {step} sur 3
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 && (
            <EntityTypeSelection 
              selectedType={formData.type}
              onTypeChange={(type) => setFormData(prev => ({ ...prev, type }))}
              onNext={() => setStep(2)}
            />
          )}
          
          {step === 2 && (
            <EntityDetailsForm 
              formData={formData}
              onChange={setFormData}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          
          {step === 3 && (
            <EntityConfirmation 
              formData={formData}
              onConfirm={handleSubmit}
              onBack={() => setStep(2)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

### 4. Frontend Portfolio (React/Vite Web)

#### Spécifique aux institutions financières
```typescript
// src/pages/PortfolioDashboard.tsx
import { useWanzoAuth } from '../hooks/useWanzoAuth';
import { InstitutionHeader } from '../components/InstitutionHeader';
import { PortfolioOverview } from '../components/PortfolioOverview';
import { RegulatoryCompliance } from '../components/RegulatoryCompliance';
import { ClientPortfolios } from '../components/ClientPortfolios';

export const PortfolioDashboard: React.FC = () => {
  const { wanzoProfile, isOwner } = useWanzoAuth();
  
  if (!wanzoProfile?.entity || wanzoProfile.entity.type !== 'INSTITUTION') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 mb-6">
            Cette application est réservée aux institutions financières.
          </p>
          <button 
            onClick={() => window.location.href = '/customer'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retourner à l'accueil
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <InstitutionHeader 
        institution={wanzoProfile.entity}
        user={wanzoProfile.user}
        isOwner={isOwner}
      />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PortfolioOverview institution={wanzoProfile.entity} />
            <ClientPortfolios institution={wanzoProfile.entity} />
          </div>
          
          <div>
            <RegulatoryCompliance 
              institution={wanzoProfile.entity}
              canManage={isOwner}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// src/components/InstitutionHeader.tsx
interface InstitutionHeaderProps {
  institution: {
    id: string;
    name: string;
    licenseNumber: string;
    regulatoryStatus: string;
  };
  user: {
    firstName: string;
    lastName: string;
    isOwner: boolean;
  };
  isOwner: boolean;
}

export const InstitutionHeader: React.FC<InstitutionHeaderProps> = ({ 
  institution, 
  user, 
  isOwner 
}) => {
  const { logout } = useWanzoAuth();
  
  return (
    <header className="bg-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div>
              <h1 className="text-xl font-semibold">
                {institution.name}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-indigo-200">
                <span>Licence: {institution.licenseNumber}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  institution.regulatoryStatus === 'ACTIVE' 
                    ? 'bg-green-600 text-green-100' 
                    : 'bg-yellow-600 text-yellow-100'
                }`}>
                  {institution.regulatoryStatus}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </div>
              {isOwner && (
                <div className="text-xs text-indigo-200">
                  Administrateur principal
                </div>
              )}
            </div>
            
            <button
              onClick={() => logout({ returnTo: window.location.origin })}
              className="px-3 py-2 text-sm bg-indigo-800 hover:bg-indigo-700 rounded-md transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
```

## 🔗 Communication avec les Backends

### Configuration API par Frontend

```typescript
// shared/src/api/apiConfig.ts
export const API_CONFIGS = {
  gestionCommerciale: {
    baseURL: 'http://localhost:8000/gestion-commerciale',
    timeout: 10000,
  },
  accounting: {
    baseURL: 'http://localhost:8000/accounting',
    timeout: 10000,
  },
  customer: {
    baseURL: 'http://localhost:8000/customer',
    timeout: 10000,
  },
  portfolio: {
    baseURL: 'http://localhost:8000/portfolio',
    timeout: 10000,
  },
};

// shared/src/api/client.ts
import axios, { AxiosInstance } from 'axios';
import { API_CONFIGS } from './apiConfig';

export const createApiClient = (service: keyof typeof API_CONFIGS): AxiosInstance => {
  const client = axios.create(API_CONFIGS[service]);
  
  // Intercepteur pour ajouter le token automatiquement
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
  // Intercepteur pour gérer les erreurs d'authentification
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
  
  return client;
};
```

## 🎯 Points Clés du Processus

### 1. Gestion du Premier Utilisateur (Owner)
- **Création d'entité** : Le premier utilisateur devient automatiquement "owner"
- **Permissions étendues** : Accès aux fonctions d'administration
- **Association permanente** : Lien entre Auth0 ID et entité via `ownerId`

### 2. Validation Backend des Tokens
```typescript
// Backend JWT Strategy (exemple)
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      algorithms: ['RS256'],
    });
  }
  
  async validate(payload: any) {
    // Validation du token et récupération du profil complet
    const userProfile = await this.authService.getUserProfileWithOrganization(payload.sub);
    
    if (!userProfile.entity) {
      throw new UnauthorizedException('Utilisateur non associé à une entité');
    }
    
    return userProfile;
  }
}
```

### 3. Redirection Intelligente
- **SME** → Gestion Commerciale (Mobile/Web)
- **Institution** → Portfolio (Web uniquement)
- **Prospect** → Customer Landing (Création d'entité)
- **Admin** → Interface d'administration appropriée

Cette architecture assure une expérience utilisateur cohérente tout en respectant les spécificités de chaque plateforme et type d'utilisateur ! 🚀
