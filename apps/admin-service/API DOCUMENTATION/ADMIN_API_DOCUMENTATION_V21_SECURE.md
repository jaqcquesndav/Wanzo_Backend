# 🔐 Documentation API Admin-Service v2.1 - SÉCURISÉE

## 🎯 **ARCHITECTURE SÉCURISÉE ADMIN-BUSINESS**

Cette documentation décrit la **nouvelle architecture sécurisée** du microservice Admin, conçue pour **respecter la séparation stricte** entre les données administratives et commerciales.

### 📋 **PRINCIPES DE SÉCURITÉ**

✅ **AUTORISÉ POUR ADMIN (KYC & ADMINISTRATION SYSTÈME)** :
- **Profils clients COMPLETS** (identification, adresses, contacts, dirigeants)
- **Documents KYC** et validation d'identité complète
- **Consommation tokens** et métriques d'utilisation détaillées
- **Abonnements et plans** (actifs, historique, facturation plateforme)
- **Utilisateurs clients** et gestion des accès
- **Patrimoine et actifs** (pour validation capacité KYC)
- **Informations légales** (RCCM, licences, autorisations)
- **Données financières de base** (capital, structure - pour KYC)
- **Monitoring système** et métriques plateforme
- **Actions administratives** (validation, suspension, conformité)

❌ **INTERDIT POUR ADMIN (OPÉRATIONS COMMERCIALES)** :
- **Transactions commerciales** des clients (ventes, achats)
- **Chiffres d'affaires** et revenus commerciaux clients
- **Inventaires produits commerciaux** des clients
- **Données comptables opérationnelles** commerciales
- **Stratégies business** et données confidentielles commerciales
- **Analytics de performance commerciale** des clients

---

## 🌐 **INFORMATIONS GÉNÉRALES**

- **Base URL (via API Gateway)**: `http://localhost:8000/admin/api/v1`
- **Base URL (directe - admin-service)**: `http://localhost:3001`
- **Version API**: v2.1 (sécurisée)
- **Port API Gateway**: 8000
- **Port Microservice Admin**: 3001 (interne)

### 🔄 **Architecture de Routing**

**Flux de requête complet:**

1. **Client → API Gateway**  
   `http://localhost:8000/admin/api/v1/customer-profiles`

2. **API Gateway détecte le prefix**  
   Prefix configuré: `admin/api/v1`

3. **API Gateway coupe le prefix**  
   Route vers admin-service: `http://localhost:3001/customer-profiles`

4. **Admin-service reçoit**  
   Controller `@Controller('customer-profiles')` traite la requête

**⚠️ IMPORTANT**: Les routes documentées ci-dessous utilisent la **Base URL complète via API Gateway**. Le préfixe `/admin/api/v1` est automatiquement retiré par l'API Gateway avant d'atteindre admin-service.

### 🔑 **Authentification**

**Headers requis** :
```http
Authorization: Bearer <token_jwt_auth0>
Content-Type: application/json
```

**Format de réponse uniforme** :
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-09T10:30:00Z",
    "version": "v2.1"
  }
}
```

---

## 🚀 **ENDPOINTS ADMIN SÉCURISÉS**

### 📋 **TABLE DE ROUTING COMPLÈTE**

| URL Client (API Gateway) | Prefix Détecté | Prefix Coupé | URL Admin-Service | Controller |
|--------------------------|----------------|--------------|-------------------|------------|
| `http://localhost:8000/admin/api/v1/customer-profiles` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/customer-profiles` | `@Controller('customer-profiles')` |
| `http://localhost:8000/admin/api/v1/institutions` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/institutions` | `@Controller('institutions')` |
| `http://localhost:8000/admin/api/v1/companies` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/companies` | `@Controller('companies')` |
| `http://localhost:8000/admin/api/v1/customers` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/customers` | `@Controller('customers')` |
| `http://localhost:8000/admin/api/v1/users` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/users` | `@Controller('users')` |
| `http://localhost:8000/admin/api/v1/system` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/system` | `@Controller('system')` |
| `http://localhost:8000/admin/api/v1/accounting` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/accounting` | `@Controller('accounting')` |
| `http://localhost:8000/admin/api/v1/subscription-payments` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/subscription-payments` | `@Controller('subscription-payments')` |
| `http://localhost:8000/admin/api/v1/finance` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/finance` | `@Controller('finance')` |
| `http://localhost:8000/admin/api/v1/dashboard` | `admin/api/v1` | ✂️ Oui | `http://localhost:3001/dashboard` | `@Controller('dashboard')` |

**✅ ARCHITECTURE PROPRE**: Tous les controllers utilisent des routes simples sans préfixe `admin/` redondant. L'API Gateway gère la sécurité et le routing avec le préfixe `/admin/api/v1`.

---

## 🚀 **ENDPOINTS ADMIN SÉCURISÉS**

### 📊 **1. GESTION DES PROFILS CLIENTS (ADMIN-SAFE)**

#### **GET** `/admin/api/v1/customer-profiles`
**Liste les profils clients avec données admin autorisées**

**Paramètres de requête** :
```typescript
{
  page?: number = 1,
  limit?: number = 10,
  customerType?: 'PME' | 'FINANCIAL_INSTITUTION',
  adminStatus?: 'under_review' | 'validated' | 'flagged' | 'suspended' | 'archived',
  complianceRating?: 'high' | 'medium' | 'low' | 'critical',
  requiresAttention?: boolean,
  needsResync?: boolean,
  reviewPriority?: 'low' | 'medium' | 'high' | 'urgent',
  search?: string
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "customerId": "uuid",
        "name": "Entreprise XYZ",
        "email": "contact@xyz.com",
        "phone": "+243123456789", // Complet pour KYC
        "customerType": "PME",
        "profileType": "company",
        "status": "active",
        "adminStatus": "validated",
        "complianceRating": "high",
        "profileCompleteness": 95,
        "reviewPriority": "medium",
        "requiresAttention": false,
        "lastSyncAt": "2025-11-09T08:30:00Z",
        "financialMetrics": {
          "declaredCapital": 50000000,        // Capital déclaré pour KYC
          "totalAssetsValue": 125000000,      // Valeur actifs pour validation capacité
          "totalAssetsCount": 15,
          "totalStockValue": 25000000,        // Valeur stocks pour validation activité
          "totalStockItems": 250,
          "lastAssetsUpdate": "2025-11-08T14:20:00Z"
        },
        "tokenConsumption": {
          "totalTokensAllocated": 10000,
          "tokensUsed": 7500,
          "tokensRemaining": 2500,
          "lastUsageDate": "2025-11-09T08:15:00Z",
          "monthlyUsage": 2200,
          "averageDailyUsage": 73
        },
        "subscriptions": {
          "currentPlan": "Enterprise",
          "planStartDate": "2025-01-01T00:00:00Z",
          "planEndDate": "2025-12-31T23:59:59Z",
          "planStatus": "active",
          "planFeatures": ["unlimited_api_calls", "priority_support", "advanced_analytics"],
          "billingCycle": "yearly",
          "autoRenewal": true,
          "planUsagePercentage": 75
        },
        "users": {
          "totalUsers": 12,
          "activeUsers": 10,
          "lastLoginDate": "2025-11-09T07:30:00Z"
        },
        "alerts": [],
        "riskProfile": {
          "riskLevel": "low",
          "overallRiskScore": 25
        }
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

#### **GET** `/admin/api/v1/customer-profiles/{customerId}`
**Détails d'un profil client spécifique**

**Réponse** :
```json
{
  "success": true,
  "data": {
    "profile": {
      // Même structure que ci-dessus avec plus de détails
      "insights": {
        "insights": ["Profil complet", "Documents à jour"],
        "recommendations": ["Révision trimestrielle recommandée"],
        "lastGenerated": "2025-11-09T09:00:00Z"
      },
      "address": {
        "street": "123 Avenue Kasa-Vubu",
        "city": "Kinshasa",
        "state": "Kinshasa",
        "country": "RDC",
        "postalCode": "10001"
      },
      "companyProfile": {
        "legalForm": "SARL",
        "industry": "Technology",
        "size": "medium",
        "rccm": "CD/KIN/RCCM/12345",
        "taxId": "A1234567890",
        "natId": "12345678901234567890",
        "capital": {
          "authorizedCapital": 100000000,
          "paidUpCapital": 100000000,
          "currency": "CDF"
        },
        "owner": {
          "name": "Jean Mbaku",
          "title": "CEO",
          "nationalId": "123456789012345",
          "phoneNumber": "+243987654321"
        },
        "yearFounded": 2020,
        "employeeCount": 45
      },
      "patrimoine": {
        "totalAssetsValue": 125000000,
        "assets": [
          {
            "type": "equipment",
            "description": "Équipements informatiques",
            "value": 15000000,
            "acquisitionDate": "2023-01-15"
          },
          {
            "type": "real_estate", 
            "description": "Bureau principal",
            "value": 80000000,
            "acquisitionDate": "2020-06-01"
          }
        ],
        "stocks": [
          {
            "category": "raw_materials",
            "description": "Matières premières",
            "quantity": 150,
            "unitValue": 50000,
            "totalValue": 7500000
          }
        ],
        "lastValuationDate": "2025-10-01T00:00:00Z"
      }
    },
    "statistics": {
      "documentsCount": 8,
      "activitiesCount": 25,
      "lastActivity": "2025-11-08T16:45:00Z"
    },
    "recentActivities": [
      {
        "id": "uuid",
        "type": "admin_action",
        "action": "status_update",
        "description": "Statut mis à jour vers validé",
        "performedAt": "2025-11-08T16:45:00Z",
        "performedBy": "admin_user_id"
      }
    ],
    "documents": [
      {
        "id": "uuid",
        "type": "kyc",
        "fileName": "document_kyc.pdf",
        "status": "approved",
        "uploadedAt": "2025-11-01T10:30:00Z"
      }
    ]
  }
}
```

### ⚡ **2. ACTIONS ADMINISTRATIVES**

#### **PUT** `/admin/api/v1/customer-profiles/{customerId}/validate`
**Valide un profil client**

**Corps de requête** : Aucun

**Réponse** :
```json
{
  "success": true,
  "data": {
    // Profil mis à jour avec adminStatus: "validated"
  }
}
```

#### **PUT** `/admin/api/v1/customer-profiles/{customerId}/suspend`
**Suspend un profil client**

**Corps de requête** :
```json
{
  "reason": "Non-conformité réglementaire"
}
```

#### **PUT** `/admin/api/v1/customer-profiles/{customerId}/reactivate`
**Réactive un profil suspendu**

#### **PUT** `/admin/api/v1/customer-profiles/{customerId}/admin-status`
**Met à jour le statut administratif**

**Corps de requête** :
```json
{
  "adminStatus": "flagged",
  "complianceRating": "medium",
  "adminNotes": "Révision requise pour mise à jour KYC",
  "riskFlags": ["outdated_documents"],
  "reviewPriority": "high"
}
```

### 📈 **3. MONITORING ET STATISTIQUES**

#### **GET** `/admin/api/v1/customer-profiles/dashboard/statistics`
**Tableau de bord admin avec métriques**

**Réponse** :
```json
{
  "success": true,
  "data": {
    "totalProfiles": 1250,
    "profilesByType": {
      "PME": 800,
      "FINANCIAL_INSTITUTION": 450
    },
    "profilesByAdminStatus": {
      "under_review": 45,
      "validated": 1100,
      "flagged": 15,
      "suspended": 8,
      "archived": 82
    },
    "profilesByComplianceRating": {
      "high": 800,
      "medium": 350,
      "low": 85,
      "critical": 15
    },
    "averageCompleteness": 87.5,
    "urgentProfiles": 12,
    "profilesNeedingResync": 5,
    "recentlyUpdated": 28,
    "systemHealth": {
      "syncLatency": 2.5, // minutes
      "pendingActions": 8,
      "systemAlerts": 2
    }
  }
}
```

---

## 🔒 **SÉCURITÉ ET RESTRICTIONS**

### **ENDPOINTS INTERDITS POUR ADMIN (COMMERCIAL OPERATIONS)**

```typescript
❌ GET /admin/api/v1/customers/{id}/sales-data      // Données ventes commerciales
❌ GET /admin/api/v1/customers/{id}/revenue-analytics // Analytics revenus commerciaux
❌ GET /admin/api/v1/customers/{id}/commercial-inventory // Inventaires commerciaux clients
❌ GET /admin/api/v1/customers/{id}/business-transactions // Transactions commerciales
❌ PUT /admin/api/v1/customers/{id}/commercial-data // Modification données commerciales
❌ GET /admin/api/v1/customers/{id}/competitive-analysis // Analyses concurrentielles
```

### **ENDPOINTS AUTORISÉS POUR ADMIN (KYC & SYSTÈME)**

```typescript
✅ GET /admin/api/v1/customer-profiles           // Profils complets pour KYC
✅ GET /admin/api/v1/customers/{id}/kyc-documents    // Documents validation identité
✅ GET /admin/api/v1/customers/{id}/token-consumption // Consommation tokens système
✅ GET /admin/api/v1/customers/{id}/subscription     // Abonnements plateforme
✅ GET /admin/api/v1/customers/{id}/users           // Utilisateurs client
✅ GET /admin/api/v1/customers/{id}/assets          // Patrimoine pour validation KYC
✅ PUT /admin/api/v1/customers/{id}/admin-status    // Statuts administratifs
✅ POST /admin/api/v1/customers/{id}/kyc-validation // Actions validation KYC
```

### **DONNÉES COMPLÈTES POUR KYC**

**Données KYC complètes (non anonymisées)** :
- Numéros de téléphone : `+243123456789` ✅
- Adresses complètes : Rue, ville, code postal ✅  
- Informations légales : RCCM, licences, autorisations ✅
- Dirigeants et contacts : Noms, fonctions, coordonnées ✅
- Structure capitalistique : Capital autorisé, libéré ✅

**Métriques financières autorisées (pour validation KYC)** :
- Valeurs d'actifs ✅ (validation capacité)
- Valeurs de stocks ✅ (validation activité)
- Capital déclaré ✅ (vérification conformité)
- Patrimoine total ✅ (évaluation solvabilité)
- Chiffre d'affaires déclaré ✅ (validation taille entreprise)

**Données système et abonnements** :
- Consommation tokens ✅ (complète)
- Historique abonnements ✅ (facturation plateforme)
- Utilisateurs et accès ✅ (gestion sécurité)
- Métriques d'utilisation ✅ (monitoring système)

---

## 🎨 **GUIDE D'INTÉGRATION FRONTEND**

### **1. Architecture React/Vue Recommandée**

```typescript
// Store/State Management
interface AdminCustomerState {
  profiles: AdminCustomerProfile[]
  currentProfile: AdminCustomerProfileDetails | null
  dashboardStats: AdminDashboardStats
  filters: AdminProfileFilters
  loading: boolean
  error: string | null
}

// API Client
class AdminCustomerAPI {
  async getProfiles(filters: AdminProfileFilters): Promise<AdminCustomerProfileListDto>
  async getProfileDetails(customerId: string): Promise<AdminCustomerProfileDetailsDto>
  async validateProfile(customerId: string): Promise<AdminCustomerProfileDto>
  async suspendProfile(customerId: string, reason: string): Promise<AdminCustomerProfileDto>
  async updateAdminStatus(customerId: string, data: AdminProfileActionDto): Promise<AdminCustomerProfileDto>
  async getDashboardStats(): Promise<AdminDashboardStatsDto>
}
```

### **2. Composants Frontend Types**

```typescript
// Tableau de bord principal
<AdminDashboard />
  ├── <StatisticsCards />
  ├── <ProfilesTable />
  └── <AlertsPanel />

// Détails profil
<ProfileDetails customerId={id} />
  ├── <ProfileHeader />
  ├── <AdminActions />
  ├── <ComplianceStatus />
  ├── <RecentActivities />
  └── <DocumentsList />

// Actions admin
<AdminActionPanel />
  ├── <ValidateButton />
  ├── <SuspendButton />
  ├── <StatusUpdateForm />
  └── <NotesEditor />
```

### **3. Workflow Frontend Recommandé**

```typescript
// 1. Chargement initial
useEffect(() => {
  adminAPI.getDashboardStats().then(setDashboardStats)
  adminAPI.getProfiles(defaultFilters).then(setProfiles)
}, [])

// 2. Sélection profil
const handleProfileSelect = (customerId: string) => {
  adminAPI.getProfileDetails(customerId).then(setCurrentProfile)
}

// 3. Actions admin
const handleValidateProfile = async (customerId: string) => {
  await adminAPI.validateProfile(customerId)
  // Refresh data
  refreshProfileData()
}

// 4. Filtrage/Recherche
const handleFiltersChange = (filters: AdminProfileFilters) => {
  adminAPI.getProfiles(filters).then(setProfiles)
}
```

---

## 🛡️ **MIGRATION DEPUIS L'ANCIEN SYSTÈME**

### **Mapping Endpoints**

| Ancien Endpoint | Nouveau Endpoint | Status |
|-----------------|------------------|---------|
| `GET /customers` | `GET /admin/api/v1/customer-profiles` | ✅ Migré |
| `GET /customers/{id}` | `GET /admin/api/v1/customer-profiles/{id}` | ✅ Migré |
| `POST /customers` | ❌ **SUPPRIMÉ** | Utiliser customer-service |
| `PUT /customers/{id}` | ❌ **SUPPRIMÉ** | Utiliser customer-service |
| `PUT /customers/{id}/validate` | `PUT /admin/api/v1/customer-profiles/{id}/validate` | ✅ Migré |
| `PUT /customers/{id}/suspend` | `PUT /admin/api/v1/customer-profiles/{id}/suspend` | ✅ Migré |

### **Mapping DTOs**

| Ancien DTO | Nouveau DTO | Changements |
|------------|-------------|-------------|
| `CustomerDto` | `AdminCustomerProfileDto` | ❌ Supprimé données commerciales |
| `CustomerListResponseDto` | `AdminCustomerProfileListDto` | ✅ Structure similaire |
| `CustomerDetailsResponseDto` | `AdminCustomerProfileDetailsDto` | ✅ Plus de données admin |

---

## 🚨 **ALERTES ET MONITORING**

### **Types d'Alertes Système**

```typescript
interface SystemAlert {
  type: 'compliance' | 'sync' | 'security' | 'performance'
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  customerId?: string
  createdAt: Date
  acknowledged: boolean
}
```

### **Métriques de Performance**

- **Latence de sync** : < 5 minutes (objectif)
- **Taux de conformité** : > 95% (objectif)
- **Profils nécessitant attention** : < 5% (objectif)
- **Disponibilité API** : > 99.9% (objectif)

---

## 📝 **NOTES DE VERSION v2.1**

### **✅ Nouvelles Fonctionnalités**
- Contrôleur admin sécurisé avec séparation données business/admin
- DTOs admin-safe avec anonymisation automatique
- Tableau de bord avec métriques de gestion
- Système d'alertes et monitoring intégré
- API compatible avec les workflows frontend modernes

### **🔄 Changements Breaking**
- Suppression des endpoints de création/modification clients
- Restructuration complète des DTOs de réponse
- Nouvelles URLs avec préfixe `/admin/customer-profiles`
- Authentification Auth0 obligatoire pour tous les endpoints

### **⚠️ Migrations Requises**
- Frontend : Utiliser nouveaux endpoints et DTOs
- Intégration : Séparer les appels admin/business vers services appropriés
- Monitoring : Adapter aux nouvelles métriques et alertes

---

## 🆘 **SUPPORT ET CONTACT**

**Équipe de développement** : DevOps Wanzo  
**Documentation technique** : [Confluence Internal]  
**Issues et bugs** : [JIRA Admin-Service]  
**Canal Slack** : #admin-service-support

---

**🔐 Cette documentation respecte les standards de sécurité Wanzo v2.1**