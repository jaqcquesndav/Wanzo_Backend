# API Documentation: Customer Profile Management (Admin Service)

> **Version:** v2.1  
> **Last Updated:** November 2025  
> **Service:** Admin Service  
> **Controller:** `AdminCustomerProfilesController`  
> **Entity:** `CustomerDetailedProfile`  
> **Scope:** Admin KYC & Compliance Management for PME and FINANCIAL_INSTITUTION

Cette documentation reflète **l'implémentation réelle** du code source de l'admin-service. Les structures de données sont basées sur les DTOs et entités actuelles.

## 🎯 **Types de Customers - Implémentation Réelle**

### **Interface Unifiée avec Structures Spécialisées**
L'admin-service gère **DEUX types de customers** via `CustomerDetailedProfile` avec des structures de données **complètement différentes** :

#### **PME (Petites et Moyennes Entreprises)**
```typescript
customerType: 'PME'
profileType: ProfileType.COMPANY

// Structure de données PME (companyProfile)
companyProfile: {
  legalForm: string;           // Forme juridique (SARL, SAS, etc.)
  industry: string;            // Secteur d'activité
  size: string;               // Taille entreprise
  rccm: string;               // 🔥 CRITIQUE - Numéro RCCM
  taxId: string;              // 🔥 CRITIQUE - ID fiscal
  natId: string;              // 🔥 CRITIQUE - ID national
  activities: {               // Activités déclarées
    primary: string;
    secondary: string[];
  };
  capital: {                  // Structure du capital
    isApplicable: boolean;
    amount: number;
    currency: 'USD' | 'CDF' | 'EUR';
  };
  owner: {                    // 🔥 CRITIQUE - Propriétaire principal
    name: string;
    role: string;
    contactInfo: any;
  };
  associates: Array<{         // 🔥 CRITIQUE - Associés
    name: string;
    role: string;
    sharePercentage: number;
  }>;
  locations: Array<{          // Localisations géographiques
    name: string;
    address: string;
    coordinates: { lat: number; lng: number; };
  }>;
  yearFounded: number;
  employeeCount: number;
  financials: {               // Données financières de base
    revenue: number;
    netIncome: number;
    totalAssets: number;
    equity: number;
  };
}
```

#### **FINANCIAL_INSTITUTION (Institutions Financières)**
```typescript
customerType: 'FINANCIAL_INSTITUTION'
profileType: ProfileType.INSTITUTION

// Structure de données Institution (institutionProfile)
institutionProfile: {
  denominationSociale: string;      // Dénomination sociale officielle
  sigleLegalAbrege: string;        // Sigle légal abrégé
  type: string;                    // Type d'institution
  category: string;                // Catégorie réglementaire
  licenseNumber: string;           // 🔥 CRITIQUE - Numéro de licence
  establishedFdate: string;        // Date d'établissement
  typeInstitution: string;         // Type spécifique institution
  autorisationExploitation: string; // 🔥 CRITIQUE - Autorisation d'exploitation
  dateOctroi: string;              // Date d'octroi autorisation
  autoriteSupervision: string;     // 🔥 CRITIQUE - Autorité de supervision
  dateAgrement: string;            // Date d'agrément
  regulatoryInfo: {                // 🔥 CRITIQUE - Informations réglementaires
    complianceStatus: string;
    lastAuditDate: string;
    reportingRequirements: string[];
    riskAssessment: string;
  };
  capitalStructure: {              // Structure du capital
    authorizedCapital: number;
    paidUpCapital: number;
    shareholders: Array<{
      name: string;
      percentage: number;
    }>;
  };
  leadership: {                    // 🔥 CRITIQUE - Direction
    ceo: { name: string; background: string; };
    board: Array<{ name: string; role: string; }>;
  };
  branches: Array<{                // Succursales
    name: string;
    address: string;
    manager: string;
  }>;
  services: string[];              // Services offerts
  certifications: string[];        // Certifications obtenues
  creditRating: {                  // Notation crédit
    agency: string;
    rating: string;
    lastUpdate: string;
  };
}
```

### **Frontend Admin - Gestion Unifiée**
```typescript
// 🎯 Interface unifiée - Admin voit TOUS les customers
GET /admin/customer-profiles

// 🔍 Filtrage par type
GET /admin/customer-profiles?customerType=PME
GET /admin/customer-profiles?customerType=FINANCIAL_INSTITUTION

// 📊 Statistiques par type
GET /admin/customer-profiles/dashboard/statistics
// Retourne: { profilesByType: { PME: 1200, FINANCIAL_INSTITUTION: 300 } }

// 🔎 Détails spécialisés selon le type
GET /admin/customer-profiles/{customerId}
// PME → retourne companyProfile avec RCCM, capital, associés
// INSTITUTION → retourne institutionProfile avec licence, supervision
```

## 🏗️ **Architecture Overview**

### **Data Synchronization Model**
- **Customer profiles originate in `customer-service`** and are synchronized to `admin-service` via Kafka
- **Admin service provides KYC/compliance management** but cannot create/delete customers
- **Bidirectional communication**: Admin actions trigger events back to customer-service
- **Real-time sync**: Profile updates flow continuously via Kafka events

### **Data Separation (Security Architecture)**
```
✅ ADMIN ACCESS (KYC & System Management):
├── Complete customer profiles & identification data
├── KYC documents, validation status, compliance ratings
├── Token consumption, subscriptions, system usage metrics
├── User management, access controls, security settings
├── Financial structure data (for KYC validation)
└── Administrative notes, risk flags, review status

❌ RESTRICTED ACCESS (Commercial Operations):
├── Commercial transactions & sales data
├── Product inventories & commercial strategies
├── Operational accounting & business financials
└── Confidential business intelligence
```

## 📋 **Structures de Données Réelles (Code Source)**

### **AdminCustomerProfileDto - Structure Complète**
```typescript
// 🔥 STRUCTURE RÉELLE basée sur src/modules/customers/dtos/admin-customer-profile.dto.ts
interface AdminCustomerProfileDto {
  // ===============================================
  // IDENTIFICATION DE BASE
  // ===============================================
  id: string;                          // Profile unique identifier
  customerId: string;                  // Customer ID from customer-service
  name: string;                        // Nom entreprise/institution
  email: string;                       // Email de contact
  phone?: string;                      // Téléphone (anonymisé : +243****6789)
  customerType: 'PME' | 'FINANCIAL_INSTITUTION';
  profileType: ProfileType;            // COMPANY | INSTITUTION
  logo?: string;                       // URL du logo
  status: string;                      // active, inactive, etc.
  accountType?: string;                // standard, premium, enterprise

  // ===============================================
  // ADRESSES (KYC REQUIS)
  // ===============================================
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    coordinates?: { latitude: number; longitude: number; };
  };

  // ===============================================
  // PROFILS DÉTAILLÉS SPÉCIFIQUES
  // ===============================================
  companyProfile?: {                   // 🏢 POUR PME UNIQUEMENT
    legalForm?: string;                // SARL, SAS, SPRL, etc.
    industry?: string;                 // Secteur d'activité
    size?: string;                     // micro, small, medium
    rccm?: string;                     // 🔥 CRITIQUE - Numéro RCCM
    taxId?: string;                    // 🔥 CRITIQUE - ID fiscal
    natId?: string;                    // 🔥 CRITIQUE - ID national
    activities?: any;                  // Activités déclarées
    capital?: any;                     // Structure du capital
    financials?: any;                  // Données financières de base
    owner?: any;                       // 🔥 CRITIQUE - Propriétaire principal
    associates?: any[];                // 🔥 CRITIQUE - Associés
    locations?: any[];                 // Localisations
    yearFounded?: number;
    employeeCount?: number;
  };

  institutionProfile?: {               // 🏦 POUR FINANCIAL_INSTITUTION UNIQUEMENT
    denominationSociale?: string;      // Dénomination sociale officielle
    sigleLegalAbrege?: string;        // Sigle légal abrégé  
    type?: string;                     // Type d'institution
    category?: string;                 // Catégorie réglementaire
    licenseNumber?: string;            // 🔥 CRITIQUE - Numéro de licence
    establishedDate?: string;          // Date d'établissement
    typeInstitution?: string;          // Type spécifique
    autorisationExploitation?: string; // 🔥 CRITIQUE - Autorisation
    dateOctroi?: string;              // Date d'octroi
    autoriteSupervision?: string;      // 🔥 CRITIQUE - Autorité supervision
    dateAgrement?: string;            // Date d'agrément
    regulatoryInfo?: any;             // 🔥 CRITIQUE - Info réglementaires
    capitalStructure?: any;           // Structure du capital
    branches?: any[];                 // Succursales
    leadership?: any;                 // 🔥 CRITIQUE - Direction
    services?: any;                   // Services offerts
    certifications?: any;             // Certifications
    creditRating?: any;               // Notation crédit
  };

  extendedProfile?: any;               // Profil étendu
  regulatoryProfile?: any;             // Profil réglementaire
  patrimoine?: any;                    // Patrimoine/actifs

  // ===============================================
  // DONNÉES ADMINISTRATIVES (COEUR ADMIN)
  // ===============================================
  adminStatus: AdminStatus;            // under_review, validated, flagged, etc.
  complianceRating: ComplianceRating;  // high, medium, low, critical
  profileCompleteness: number;         // 0-100%
  adminNotes?: string;                 // Notes administratives
  riskFlags?: string[];                // Drapeaux de risque
  reviewPriority: 'low' | 'medium' | 'high' | 'urgent';
  requiresAttention: boolean;          // Nécessite attention admin

  // ===============================================
  // MÉTADONNÉES DE SYNCHRONISATION
  // ===============================================
  needsResync: boolean;                // Nécessite resynchronisation
  lastSyncAt: Date;                    // Dernière synchro Kafka
  lastReviewedAt?: Date;               // Dernière révision admin
  reviewedBy?: string;                 // ID admin qui a révisé

  // ===============================================
  // GESTION SYSTÈME (AUTORISÉ ADMIN)
  // ===============================================
  tokenConsumption?: {                 // Consommation tokens
    totalTokensAllocated?: number;
    tokensUsed?: number;
    tokensRemaining?: number;
    lastUsageDate?: string;
    monthlyUsage?: number;
    averageDailyUsage?: number;
  };

  subscriptions?: {                    // Abonnements
    currentPlan?: string;
    planStartDate?: string;
    planEndDate?: string;
    planStatus?: 'active' | 'suspended' | 'expired';
    planFeatures?: string[];
    billingCycle?: 'monthly' | 'yearly';
  };

  users?: {                           // Utilisateurs client
    totalUsers?: number;
    activeUsers?: number;
    lastLoginDate?: string;
    recentActivity?: Array<{
      userId: string;
      userName: string;
      lastLogin: string;
      role: string;
      status: 'active' | 'inactive' | 'suspended';
    }>;
  };

  platformUsage?: any;                // Métriques utilisation plateforme
  financialMetrics?: any;             // Métriques financières (pour KYC)
  alerts?: any[];                     // Alertes système
  validationStatus?: any;             // Statut validation
  riskProfile?: any;                  // Profil de risque
  insights?: any;                     // Insights générés

  createdAt: Date;                    // Date création
  updatedAt: Date;                    // Dernière mise à jour
}
```

### **AdminCustomerProfileListDto**
```typescript
interface AdminCustomerProfileListDto {
  items: AdminCustomerProfileDto[];    // Liste des profils
  total: number;                       // Total des éléments
  page: number;                        // Page courante
  limit: number;                       // Éléments par page
  totalPages: number;                  // Nombre total de pages
}
```

### **AdminDashboardStatsDto**
```typescript
interface AdminDashboardStatsDto {
  totalProfiles: number;
  profilesByType: { 
    PME: number; 
    FINANCIAL_INSTITUTION: number; 
  };
  profilesByAdminStatus: { 
    under_review: number; 
    validated: number; 
    flagged: number; 
    suspended: number; 
    archived: number; 
    requires_attention: number; 
  };
  profilesByComplianceRating: { 
    high: number; 
    medium: number; 
    low: number; 
    critical: number; 
  };
  averageCompleteness: number;
  urgentProfiles: number;
  profilesNeedingResync: number;
  recentlyUpdated: number;
  systemHealth: { 
    syncLatency: number; 
    pendingActions: number; 
    systemAlerts: number; 
  };
}
```

## 🔗 **Endpoints Réels (Code Source)**

### **1. Liste des Profils Clients - Interface Unifiée**
```http
GET /admin/customer-profiles
```

**Implémentation réelle :**
- **Controller:** `AdminCustomerProfilesController.listProfiles()`
- **Service:** `CustomersService.findAll()`
- **Response DTO:** `AdminCustomerProfileListDto`
- **Authentication:** Bearer Token + `JwtBlacklistGuard`
- **Authorization:** Rôle Admin requis

**Paramètres de requête (AdminProfileQueryDto) :**
```typescript
interface AdminProfileQueryDto {
  page?: number;                           // Page (défaut: 1)
  limit?: number;                          // Éléments/page (défaut: 10, max: 100)
  customerType?: 'PME' | 'FINANCIAL_INSTITUTION'; // 🔥 Filtrage par type
  adminStatus?: AdminStatus;               // under_review, validated, etc.
  complianceRating?: ComplianceRating;     // high, medium, low, critical
  requiresAttention?: boolean;             // Profils nécessitant attention
  needsResync?: boolean;                   // Profils à resynchroniser
  minCompleteness?: number;                // Complétude minimum (0-100)
  reviewPriority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;                         // Recherche par nom/email
}
```

**Exemples d'utilisation :**
```bash
# 🏢 Voir seulement les PME
GET /admin/customer-profiles?customerType=PME

# 🏦 Voir seulement les institutions financières  
GET /admin/customer-profiles?customerType=FINANCIAL_INSTITUTION

# ⚠️ Profils nécessitant attention admin
GET /admin/customer-profiles?requiresAttention=true

# 🔍 Recherche par nom
GET /admin/customer-profiles?search=Acme

# 📊 Profils peu complétés
GET /admin/customer-profiles?minCompleteness=50
```
**Réponse (200 OK) :**
```json
{
  "items": [
    {
      // ===============================================
      // EXEMPLE 1 : INSTITUTION FINANCIÈRE
      // ===============================================
      "id": "prof_uuid_123",
      "customerId": "cust_uuid_456", 
      "name": "Banque Centrale Congolaise",
      "email": "contact@bcc.cd",
      "phone": "+243*****6789",
      "customerType": "FINANCIAL_INSTITUTION",
      "profileType": "INSTITUTION",
      "logo": "https://cdn.wanzo.com/logos/bcc.png",
      "status": "active",
      "accountType": "enterprise",
      
      // Adresse complète (KYC requis)
      "address": {
        "street": "Boulevard du 30 Juin",
        "city": "Kinshasa",
        "state": "Kinshasa",
        "country": "RDC",
        "postalCode": "12345"
      },

      // 🏦 PROFIL INSTITUTION SPÉCIFIQUE
      "institutionProfile": {
        "denominationSociale": "Banque Centrale Congolaise",
        "sigleLegalAbrege": "BCC",
        "type": "banque_centrale",
        "category": "institution_supervision",
        "licenseNumber": "BCC-2024-001",        // 🔥 CRITIQUE
        "establishedDate": "1997-08-15",
        "typeInstitution": "central_bank",
        "autorisationExploitation": "MIN-FINANCES-2024-BCC", // 🔥 CRITIQUE
        "dateOctroi": "2024-01-15",
        "autoriteSupervision": "Ministère des Finances",      // 🔥 CRITIQUE
        "dateAgrement": "2024-02-01",
        "regulatoryInfo": {                    // 🔥 CRITIQUE
          "complianceStatus": "compliant",
          "lastAuditDate": "2024-10-15",
          "reportingRequirements": ["monthly_reporting", "risk_assessment"],
          "riskAssessment": "low"
        },
        "capitalStructure": {
          "authorizedCapital": 1000000000,
          "paidUpCapital": 800000000,
          "shareholders": [
            { "name": "État Congolais", "percentage": 100 }
          ]
        },
        "leadership": {                        // 🔥 CRITIQUE
          "ceo": {
            "name": "Dr. Malangu Kabedi-Mbuyi",
            "background": "Économiste, 20 ans d'expérience bancaire"
          },
          "board": [
            { "name": "Jean Kapinga", "role": "Vice-Gouverneur" },
            { "name": "Marie Tshala", "role": "Directeur Général" }
          ]
        },
        "branches": [
          { "name": "Siège Central", "address": "Kinshasa Centre", "manager": "Pierre Mukendi" },
          { "name": "Succursale Lubumbashi", "address": "Avenue Mobutu", "manager": "Marie Kalonji" }
        ],
        "services": ["supervision_bancaire", "emission_monnaie", "regulation_financiere"],
        "certifications": ["ISO_27001", "Basel_III_Compliant"],
        "creditRating": {
          "agency": "Moody's",
          "rating": "B2",
          "lastUpdate": "2024-09-01"
        }
      },

      // Données administratives
      "adminStatus": "validated",
      "complianceRating": "high",
      "profileCompleteness": 95,
      "adminNotes": "Institution supervisée - KYC complet validé le 2024-03-15",
      "riskFlags": ["regulatory_institution"],
      "reviewPriority": "high",
      "requiresAttention": false,
      "needsResync": false,
      "lastSyncAt": "2024-11-09T14:30:00Z",
      "lastReviewedAt": "2024-11-08T10:15:00Z",
      "reviewedBy": "admin_uuid_789",

      // Gestion système (autorisé admin)
      "tokenConsumption": {
        "totalTokensAllocated": 50000,
        "tokensUsed": 12000,
        "tokensRemaining": 38000,
        "lastUsageDate": "2024-11-09T08:45:00Z",
        "monthlyUsage": 5000,
        "averageDailyUsage": 167
      },
      "subscriptions": {
        "currentPlan": "Institution Supervision Plan",
        "planStartDate": "2024-01-01T00:00:00Z",
        "planEndDate": "2024-12-31T23:59:59Z",
        "planStatus": "active",
        "planFeatures": ["regulatory_tools", "priority_support", "advanced_analytics"],
        "billingCycle": "yearly",
        "autoRenewal": true
      },
      "users": {
        "totalUsers": 25,
        "activeUsers": 23,
        "lastLoginDate": "2024-11-09T09:30:00Z"
      },

      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-11-09T14:30:00Z"
    },
    {
      // ===============================================
      // EXEMPLE 2 : PME
      // ===============================================
      "id": "prof_uuid_124",
      "customerId": "cust_uuid_457",
      "name": "SARL Tech Innovation Congo",
      "email": "contact@techinnovation.cd",
      "phone": "+243*****1234",
      "customerType": "PME",
      "profileType": "COMPANY",
      "logo": "https://cdn.wanzo.com/logos/tech-innovation.png",
      "status": "active",
      "accountType": "premium",

      "address": {
        "street": "Avenue de la Paix, Q. Industriel",
        "city": "Lubumbashi",
        "state": "Haut-Katanga", 
        "country": "RDC",
        "postalCode": "10101"
      },

      // 🏢 PROFIL PME SPÉCIFIQUE
      "companyProfile": {
        "legalForm": "SARL",
        "industry": "technology",
        "size": "medium",
        "rccm": "CD/LSH/RCCM/24-B-00123",      // 🔥 CRITIQUE
        "taxId": "A2401234567N",               // 🔥 CRITIQUE  
        "natId": "01-234-N56789",              // 🔥 CRITIQUE
        "activities": {
          "primary": "Développement logiciel",
          "secondary": ["Formation informatique", "Maintenance IT"]
        },
        "capital": {                           // 🔥 CRITIQUE
          "isApplicable": true,
          "amount": 50000,
          "currency": "USD"
        },
        "owner": {                            // 🔥 CRITIQUE
          "name": "Jean-Baptiste Mukendi",
          "role": "Gérant Principal",
          "contactInfo": { "email": "jb.mukendi@techinnovation.cd" }
        },
        "associates": [                       // 🔥 CRITIQUE
          { "name": "Marie Kabongo", "role": "Associée", "sharePercentage": 40 },
          { "name": "Pierre Mwamba", "role": "Associé Technique", "sharePercentage": 30 },
          { "name": "Jean-Baptiste Mukendi", "role": "Gérant", "sharePercentage": 30 }
        ],
        "locations": [
          { 
            "name": "Siège Social", 
            "address": "Avenue de la Paix, Lubumbashi", 
            "coordinates": { "lat": -11.6668, "lng": 27.4797 }
          }
        ],
        "yearFounded": 2019,
        "employeeCount": 15,
        "financials": {                       // Pour KYC uniquement
          "revenue": 120000,
          "netIncome": 25000,
          "totalAssets": 85000,
          "equity": 65000
        }
      },

      "adminStatus": "under_review",
      "complianceRating": "medium", 
      "profileCompleteness": 78,
      "adminNotes": "PME en croissance - Documents RCCM à revalider",
      "riskFlags": ["new_business"],
      "reviewPriority": "medium",
      "requiresAttention": true,
      "needsResync": false,
      "lastSyncAt": "2024-11-09T13:15:00Z",

      "tokenConsumption": {
        "totalTokensAllocated": 5000,
        "tokensUsed": 1200,
        "tokensRemaining": 3800,
        "monthlyUsage": 400,
        "averageDailyUsage": 13
      },
      "subscriptions": {
        "currentPlan": "PME Growth Plan",
        "planStatus": "active"
      },
      "users": {
        "totalUsers": 5,
        "activeUsers": 4
      },

      "createdAt": "2024-03-20T00:00:00Z",
      "updatedAt": "2024-11-09T13:15:00Z"
    }
  ],
  "total": 1500,
  "page": 1,
  "limit": 10,
  "totalPages": 150
}
                "upgradeEligible": false,
                "planUsagePercentage": 67
              },
              "users": {
                "totalUsers": 15,
                "activeUsers": 12,
                "lastLoginDate": "2024-11-09T09:30:00Z",
                "userRoles": [
                  { "role": "admin", "count": 2 },
                  { "role": "manager", "count": 4 },
                  { "role": "user", "count": 9 }
                ]
              },
```

### **2. Détails d'un Profil Client Spécifique**
```http
GET /admin/customer-profiles/{customerId}
```

**Implémentation réelle :**
- **Controller:** `AdminCustomerProfilesController.getProfileDetails()`
- **Service:** `CustomersService.findOne()`
- **Response DTO:** `AdminCustomerProfileDetailsDto`
- **Paramètres:** `customerId` (UUID requis)

**Réponse (200 OK) :**
```json
{
  "profile": {
    // Structure AdminCustomerProfileDto complète (voir ci-dessus)
    "id": "prof_uuid_123",
    "customerId": "cust_uuid_456",
    "name": "Banque Centrale Congolaise",
    "customerType": "FINANCIAL_INSTITUTION",
    "institutionProfile": { /* structure complète */ },
    // ... toutes les propriétés
  },
  "statistics": {
    "documentsCount": 15,
    "activitiesCount": 42,
    "lastActivity": "2024-11-09T10:30:00Z",
    "subscriptionsCount": 2
  },
  "recentActivities": [
    {
      "id": "act_123",
      "type": "kyc_validation",
      "action": "document_approved",
      "description": "Licence bancaire approuvée",
      "performedAt": "2024-11-09T10:30:00Z",
      "performedBy": "admin_user_456"
    }
  ],
  "documents": [
    {
      "id": "doc_789",
      "type": "licence",
      "fileName": "licence_bancaire_bcc.pdf",
      "status": "approved",
      "uploadedAt": "2024-11-08T14:20:00Z"
    }
  ]
}
```

### **3. Actions Administratives**

#### **3.1. Validation d'un Profil**
```http
PUT /admin/customer-profiles/{customerId}/validate
```

**Implémentation réelle :**
- **Controller:** `AdminCustomerProfilesController.validateProfile()`
- **Service:** `CustomersService.validateCustomer()`
- **Action:** Marque le profil comme validé après révision KYC

#### **3.2. Suspension d'un Profil**
```http
PUT /admin/customer-profiles/{customerId}/suspend
```

**Body requis :**
```json
{
  "reason": "Non-conformité réglementaire détectée"
}
```

#### **3.3. Réactivation d'un Profil**
```http
PUT /admin/customer-profiles/{customerId}/reactivate
```

#### **3.4. Mise à jour Statut Administratif**
```http
PUT /admin/customer-profiles/{customerId}/admin-status
```

**Body (AdminProfileActionDto) :**
```json
{
  "adminStatus": "flagged",
  "complianceRating": "low",
  "adminNotes": "Vérifications supplémentaires requises",
  "riskFlags": ["suspicious_activity"],
  "reviewPriority": "high"
}
```

### **4. Statistiques Dashboard**
```http
GET /admin/customer-profiles/dashboard/statistics
```

**Implémentation réelle :**
- **Controller:** `AdminCustomerProfilesController.getDashboardStats()`
- **Service:** `CustomersService.getStatistics()`
- **Response DTO:** `AdminDashboardStatsDto`

**Réponse (200 OK) :**
```json
{
  "totalProfiles": 1500,
  "profilesByType": {
    "PME": 1200,
    "FINANCIAL_INSTITUTION": 300
  },
  "profilesByAdminStatus": {
    "under_review": 150,
    "validated": 1200,
    "flagged": 80,
    "suspended": 45,
    "archived": 25,
    "requires_attention": 120
  },
  "profilesByComplianceRating": {
    "high": 800,
    "medium": 500,
    "low": 150,
    "critical": 50
  },
  "averageCompleteness": 82,
  "urgentProfiles": 25,
  "profilesNeedingResync": 12,
  "recentlyUpdated": 45,
  "systemHealth": {
    "syncLatency": 2.5,
    "pendingActions": 8,
    "systemAlerts": 3
  }
}
                "licenseNumber": "LIC-2024-FIN-001",
                "establishedDate": "2020-03-15T00:00:00Z",
                "typeInstitution": "MICROFINANCE",
                "regulatoryInfo": {
                  "complianceStatus": "compliant",
                  "lastAuditDate": "2024-09-15T00:00:00Z"
                }
              },
              "createdAt": "2024-01-15T10:00:00Z",
              "updatedAt": "2024-11-09T14:30:00Z"
            }
          ],
          "total": 150,
          "page": 1,
          "limit": 10,
          "totalPages": 15
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid query parameters
    *   `401 Unauthorized`: Missing or invalid authentication
    *   `403 Forbidden`: Insufficient permissions
    *   `500 Internal Server Error`: Server error

### 1.2. Get Customer Profile Details (Admin View)
*   **HTTP Method:** `GET`
*   **URL:** `/admin/customer-profiles/{customerId}`
*   **Description:** Returns detailed customer profile with admin-relevant data, statistics, and recent activities.
*   **Path Parameters:**
    *   `customerId` (required, UUID): Customer unique identifier
*   **Response:**
    *   `200 OK`:
        ```json
        {
