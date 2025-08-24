# Diagrammes de Flux - Interaction Frontends/Backends

## 🔄 Vue d'ensemble de l'écosystème

```mermaid
graph TB
    subgraph "Frontends"
        FM[📱 Flutter Mobile<br/>Gestion Commerciale]
        FW1[🌐 React Web<br/>Accounting]
        FW2[🌐 React Web<br/>Customer Landing]
        FW3[🌐 React Web<br/>Portfolio]
    end
    
    subgraph "Auth0"
        A0[🔐 Auth0 IdP<br/>JWT Tokens]
    end
    
    subgraph "API Gateway"
        GW[🌐 API Gateway<br/>Port 8000]
    end
    
    subgraph "Backend Services"
        GCS[🏢 Gestion Commerciale<br/>Service]
        AS[📊 Accounting<br/>Service]
        CS[👥 Customer<br/>Service]
        PS[🏦 Portfolio<br/>Service]
    end
    
    subgraph "Data Layer"
        K[📤 Kafka<br/>Events]
        DB[(🗄️ Databases)]
    end
    
    FM -.->|Login/Logout| A0
    FW1 -.->|Login/Logout| A0
    FW2 -.->|Login/Logout| A0
    FW3 -.->|Login/Logout| A0
    
    FM -->|Bearer Token| GW
    FW1 -->|Bearer Token| GW
    FW2 -->|Bearer Token| GW
    FW3 -->|Bearer Token| GW
    
    GW --> GCS
    GW --> AS
    GW --> CS
    GW --> PS
    
    GCS <--> K
    AS <--> K
    CS <--> K
    PS <--> K
    
    GCS --> DB
    AS --> DB
    CS --> DB
    PS --> DB
    
    classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef auth fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef gateway fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef data fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    
    class FM,FW1,FW2,FW3 frontend
    class A0 auth
    class GW gateway
    class GCS,AS,CS,PS backend
    class K,DB data
```

## 🏢 Flux SME - Frontend Gestion Commerciale (Flutter)

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur SME
    participant FM as 📱 Flutter Mobile
    participant A0 as 🔐 Auth0
    participant GW as 🌐 API Gateway
    participant GCS as 🏢 Gestion Commerciale
    participant K as 📤 Kafka
    participant CS as 👥 Customer Service
    
    Note over U,CS: Phase 1: Authentification
    U->>FM: Ouvre l'app
    FM->>A0: Login request
    A0->>U: Authentification (biométrie/PIN)
    U->>A0: Credentials
    A0->>FM: JWT Token + Refresh Token
    FM->>FM: Stockage sécurisé tokens
    
    Note over U,CS: Phase 2: Récupération du profil
    FM->>GW: GET /gestion-commerciale/auth/profile<br/>Bearer {token}
    GW->>GCS: Forward request + token
    GCS->>GCS: Validation JWT Strategy
    GCS->>GCS: Extract userId from token
    GCS->>GCS: authService.getUserProfileWithOrganization()
    
    alt Company existe localement
        GCS->>GCS: Retour user + company data
        GCS->>GW: 200 OK + UserProfile
        GW->>FM: UserProfile complet
        FM->>FM: Navigation vers Dashboard
    else Company manquante
        GCS->>K: Emit OrganizationSyncRequest
        GCS->>CS: Via Kafka (organizationId: userId)
        CS->>K: Emit OrganizationSyncResponse
        GCS->>K: Receive sync response
        GCS->>GCS: createOrUpdate company locale
        GCS->>GW: 200 OK + UserProfile
        GW->>FM: UserProfile complet
        FM->>FM: Navigation vers Dashboard
    end
    
    Note over U,CS: Phase 3: Utilisation
    FM->>GW: API calls avec Bearer token
    GW->>GCS: Forward avec CompanyAuthGuard
    GCS->>GCS: Injection @CurrentCompany()
    GCS->>FM: Données avec contexte company
```

## 🌐 Flux Institution - Frontend Portfolio (React Web)

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur Institution
    participant FW as 🌐 React Portfolio
    participant A0 as 🔐 Auth0
    participant GW as 🌐 API Gateway
    participant PS as 🏦 Portfolio Service
    participant K as 📤 Kafka
    participant CS as 👥 Customer Service
    
    Note over U,CS: Phase 1: Authentification Auth0
    U->>FW: Navigate to app
    FW->>A0: loginWithRedirect()
    A0->>U: Auth0 Universal Login
    U->>A0: Email/Password
    A0->>FW: JWT Token (via callback)
    FW->>FW: useAuth0 hook storage
    
    Note over U,CS: Phase 2: Validation et profil
    FW->>FW: useWanzoAuth hook triggered
    FW->>A0: getAccessTokenSilently()
    A0->>FW: Fresh JWT token
    FW->>GW: GET /portfolio/auth/profile<br/>Bearer {token}
    GW->>PS: Forward request
    PS->>PS: JWT Strategy validation
    PS->>PS: getUserProfileWithOrganization(userId)
    
    alt Institution existe et type=INSTITUTION
        PS->>PS: findByIdSafe(userId)
        PS->>GW: 200 OK + Institution profile
        GW->>FW: UserProfile avec institution
        FW->>FW: setState + render Dashboard
    else Institution manquante
        PS->>K: Emit CustomerSyncRequest<br/>{customerId: userId, type: 'INSTITUTION'}
        PS->>CS: Via Kafka customer sync
        CS->>K: Emit CustomerSyncResponse<br/>{found: true, customerData: {...}}
        PS->>K: Receive filtered INSTITUTION data
        PS->>PS: createOrUpdate institution locale
        PS->>GW: 200 OK + Institution profile
        GW->>FW: UserProfile avec institution
        FW->>FW: setState + render Dashboard
    else User not INSTITUTION type
        PS->>GW: 401 Unauthorized
        GW->>FW: 401 Error
        FW->>FW: Show "Accès non autorisé"
        FW->>FW: Redirect to /customer
    end
    
    Note over U,CS: Phase 3: Dashboard Institution
    FW->>GW: Multiple API calls
    GW->>PS: InstitutionAuthGuard validation
    PS->>PS: @CurrentInstitution() injection
    PS->>FW: Portfolio data avec contexte
```

## 📱 Flux Customer Landing - Création d'entité

```mermaid
sequenceDiagram
    participant U as 👤 Prospect
    participant FW as 🌐 React Customer
    participant A0 as 🔐 Auth0
    participant GW as 🌐 API Gateway
    participant CS as 👥 Customer Service
    participant K as 📤 Kafka
    participant GCS as 🏢 Gestion Commerciale
    participant PS as 🏦 Portfolio Service
    
    Note over U,PS: Phase 1: Prospect sans entité
    U->>FW: Visit landing page
    FW->>A0: Login (nouveau compte)
    A0->>U: Signup/Login flow
    U->>A0: Create account
    A0->>FW: JWT Token
    FW->>GW: GET /customer/auth/profile
    GW->>CS: Check user profile
    CS->>GW: 404 - No customer entity
    GW->>FW: No entity found
    FW->>FW: Show EntityCreationWizard
    
    Note over U,PS: Phase 2: Création entité
    U->>FW: Fill entity form (SME/INSTITUTION)
    FW->>FW: Entity type selection
    U->>FW: Submit entity data
    FW->>GW: POST /customer/customers<br/>{type: 'SME'/'INSTITUTION', ownerId: auth0.sub}
    GW->>CS: Create new customer
    CS->>CS: Validate + Create customer
    CS->>CS: Set ownerId = auth0User.sub
    CS->>K: Emit CustomerCreatedEvent
    
    par Synchronisation automatique
        K->>GCS: CustomerEvent (if SME)
        GCS->>GCS: Create Company
        K->>PS: CustomerEvent (if INSTITUTION)  
        PS->>PS: Create Institution (filtered)
    end
    
    CS->>GW: 201 Created + customer data
    GW->>FW: Success response
    
    Note over U,PS: Phase 3: Redirection intelligente
    alt SME créé
        FW->>FW: window.location = '/gestion-commerciale'
        FW->>FM: Redirect to mobile app
    else INSTITUTION créé
        FW->>FW: window.location = '/portfolio'
        FW->>FW: Redirect to portfolio app
    end
```

## 🔐 Flux de Validation Token Backend

```mermaid
graph TD
    A[📥 Requête avec Bearer Token] --> B{Token valide?}
    B -->|Non| C[❌ 401 Unauthorized]
    B -->|Oui| D[🔍 Extract userId from JWT]
    
    D --> E[📋 AuthService.getUserProfileWithOrganization]
    E --> F{Entity existe localement?}
    
    F -->|Oui| G[✅ Entity trouvée]
    F -->|Non| H[📤 Kafka Sync Request]
    
    H --> I[⏳ Attente Customer Service]
    I --> J{Response reçue?}
    
    J -->|Timeout| K[❌ 503 Service Unavailable]
    J -->|Entity found| L[🔄 Create/Update entity locale]
    J -->|Entity not found| M[❌ 404 Entity Not Found]
    
    L --> G
    G --> N[🛡️ Security Guard Validation]
    N --> O{Type compatible?}
    
    O -->|SME + CompanyService| P[✅ @CurrentCompany injection]
    O -->|INSTITUTION + PortfolioService| Q[✅ @CurrentInstitution injection]
    O -->|Mismatch| R[❌ 403 Forbidden]
    
    P --> S[📱 Controller avec contexte]
    Q --> S
    S --> T[📊 Business Logic]
    T --> U[📤 Response avec données]
    
    classDef success fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef error fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef process fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class G,L,P,Q,S,T,U success
    class C,K,M,R error
    class A,D,E,H,I,N process
    class B,F,J,O decision
```

## 📊 Matrice des Permissions par Frontend

| Frontend | Type Utilisateur | Service Backend | Guards | Contexte Injecté |
|----------|------------------|-----------------|--------|------------------|
| **Flutter Gestion Commerciale** | SME Owner/User | Gestion Commerciale | CompanyAuthGuard | @CurrentCompany |
| **React Accounting** | SME/Institution Owner/User | Accounting | OrganizationAuthGuard | @CurrentOrganization |
| **React Customer** | Prospect/Admin | Customer | Public/AdminGuard | @CurrentUser |
| **React Portfolio** | Institution Owner/User | Portfolio | InstitutionAuthGuard | @CurrentInstitution |

## 🎯 Gestion des Erreurs par Frontend

### Flutter Mobile
```dart
class ApiErrorHandler {
  static void handle(DioError error, BuildContext context) {
    switch (error.response?.statusCode) {
      case 401:
        _showUnauthorizedDialog(context);
        break;
      case 403:
        _showAccessDeniedDialog(context);
        break;
      case 404:
        _showEntityNotFoundDialog(context);
        break;
      default:
        _showGenericErrorDialog(context, error.message);
    }
  }
}
```

### React Web
```typescript
const useApiErrorHandler = () => {
  const { logout } = useWanzoAuth();
  
  return useCallback((error: AxiosError) => {
    switch (error.response?.status) {
      case 401:
        logout({ returnTo: window.location.origin });
        break;
      case 403:
        toast.error('Accès non autorisé à cette ressource');
        break;
      case 404:
        toast.error('Entité non trouvée. Contactez le support.');
        break;
      default:
        toast.error('Erreur de communication avec le serveur');
    }
  }, [logout]);
};
```

Cette architecture garantit une expérience utilisateur fluide avec une sécurité robuste et une gestion d'erreurs appropriée pour chaque plateforme ! 🚀
