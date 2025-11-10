# 🎯 Guide de Workflow Frontend-Backend Admin KYC v2.1

## 🔍 **LOGIQUE MÉTIER CORRIGÉE**

### **Séparation KYC/Administration vs Commercial**

```
┌─────────────────────────────────────────────────────────────┐
│                    DONNÉES ADMIN (KYC)                     │
│  ✅ AUTORISÉES - Nécessaires pour validation et gestion     │
├─────────────────────────────────────────────────────────────┤
│ • Profils clients COMPLETS (identification, adresses)       │
│ • Documents KYC et validation d'identité                   │
│ • Consommation tokens et métriques d'utilisation           │
│ • Abonnements, plans, facturation plateforme               │
│ • Utilisateurs clients et gestion des accès                │
│ • Patrimoine et actifs (validation capacité)               │
│ • Informations légales et réglementaires                   │
│ • Contacts, dirigeants, structure capitalistique           │
│ • Métriques système et monitoring plateforme               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 DONNÉES COMMERCIALES                        │
│  ❌ INTERDITES - Operations business des clients            │
├─────────────────────────────────────────────────────────────┤
│ • Ventes et transactions commerciales clients              │
│ • Chiffres d'affaires et revenus commerciaux               │
│ • Inventaires produits commerciaux clients                 │
│ • Données comptables opérationnelles commerciales          │
│ • Stratégies business et données confidentielles           │
│ • Analytics de performance commerciale                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 **ARCHITECTURE FRONTEND RECOMMANDÉE**

### **1. Structure des Composants Admin**

```typescript
// ====== TABLEAU DE BORD PRINCIPAL ======
<AdminDashboard />
├── <KYCOverviewCards />           // Statuts validation, profils en attente
├── <TokenUsageMetrics />          // Consommation globale tokens
├── <SubscriptionStats />          // Répartition abonnements
├── <PlatformHealthMetrics />      // Santé système
├── <CustomerProfilesTable />      // Liste profils clients
└── <AlertsPanel />                // Alertes KYC et système

// ====== PROFIL CLIENT DÉTAILLÉ ======
<CustomerProfileView customerId={id} />
├── <ProfileHeader />              // Nom, type, statut admin
├── <KYCValidationPanel />         // Documents, validation identité
├── <ContactInformation />         // Adresses, contacts, dirigeants
├── <LegalInformation />           // RCCM, licences, autorisations
├── <SubscriptionDetails />        // Plan actuel, tokens, utilisation
├── <UsersManagement />            // Utilisateurs client, accès
├── <AssetValidation />            // Patrimoine, capacité financière
├── <ComplianceStatus />           // Conformité réglementaire
├── <AdminActions />               // Valider, suspendre, noter
└── <ActivityHistory />            // Historique actions admin

// ====== GESTION TOKENS & ABONNEMENTS ======
<TokenManagement />
├── <GlobalTokenMetrics />         // Vue d'ensemble consommation
├── <CustomerTokenUsage />         // Détail par client
├── <SubscriptionOverview />       // Tous les abonnements actifs
├── <PlanUpgrades />               // Demandes d'upgrade
└── <UsagePredictions />           // Prédictions utilisation

// ====== VALIDATION KYC ======
<KYCValidationCenter />
├── <PendingValidations />         // Profils en attente
├── <DocumentReview />             // Révision documents
├── <IdentityVerification />       // Vérification identité
├── <ComplianceChecks />           // Vérifications conformité
└── <ValidationWorkflow />         // Workflow de validation
```

### **2. Store/État Global Recommandé**

```typescript
interface AdminAppState {
  // ====== PROFILS CLIENTS ======
  customers: {
    profiles: AdminCustomerProfile[];
    currentProfile: AdminCustomerProfileDetails | null;
    filters: CustomerFilters;
    pagination: PaginationState;
    loading: boolean;
    error: string | null;
  };

  // ====== TOKENS & ABONNEMENTS ======
  platform: {
    tokenMetrics: TokenConsumptionMetrics;
    subscriptions: SubscriptionOverview[];
    planUsage: PlanUsageStats;
    billing: PlatformBillingStats;
  };

  // ====== KYC & VALIDATION ======
  kyc: {
    pendingValidations: KYCValidationTask[];
    documentsToReview: DocumentReviewTask[];
    complianceAlerts: ComplianceAlert[];
    validationWorkflow: ValidationWorkflowState;
  };

  // ====== SYSTÈME & MONITORING ======
  system: {
    platformHealth: SystemHealthMetrics;
    userActivity: UserActivityStats;
    apiUsage: APIUsageMetrics;
    alerts: SystemAlert[];
  };

  // ====== INTERFACE ======
  ui: {
    sidebarOpen: boolean;
    activeModule: 'dashboard' | 'customers' | 'kyc' | 'tokens' | 'system';
    notifications: Notification[];
    theme: 'light' | 'dark';
  };
}
```

### **3. Services API Client**

```typescript
class AdminKYCAPI {
  // ====== PROFILS CLIENTS ======
  async getCustomerProfiles(filters: CustomerFilters): Promise<AdminCustomerProfileListDto>
  async getCustomerDetails(customerId: string): Promise<AdminCustomerProfileDetailsDto>
  async validateCustomerKYC(customerId: string): Promise<AdminCustomerProfileDto>
  async suspendCustomer(customerId: string, reason: string): Promise<AdminCustomerProfileDto>
  async updateAdminNotes(customerId: string, notes: string): Promise<AdminCustomerProfileDto>

  // ====== TOKENS & ABONNEMENTS ======
  async getTokenConsumption(customerId?: string): Promise<TokenConsumptionData>
  async getSubscriptionDetails(customerId: string): Promise<SubscriptionDetailsDto>
  async getCustomerUsers(customerId: string): Promise<CustomerUsersDto>
  async updateTokenAllocation(customerId: string, tokens: number): Promise<void>

  // ====== KYC & DOCUMENTS ======
  async getPendingKYCValidations(): Promise<KYCValidationTask[]>
  async reviewDocument(documentId: string, decision: 'approve' | 'reject', notes: string): Promise<void>
  async requestAdditionalDocuments(customerId: string, documents: string[]): Promise<void>

  // ====== MONITORING ======
  async getDashboardMetrics(): Promise<AdminDashboardStatsDto>
  async getSystemHealth(): Promise<SystemHealthDto>
  async getPlatformUsageStats(): Promise<PlatformUsageDto>
}
```

---

## 🔄 **WORKFLOWS OPÉRATIONNELS**

### **Workflow 1 : Validation KYC Nouveau Client**

```typescript
// 1. Admin reçoit notification nouveau profil
const newProfile = await adminAPI.getCustomerDetails(customerId);

// 2. Révision profil complet
const kyc = {
  identity: newProfile.profile.companyProfile || newProfile.profile.institutionProfile,
  documents: newProfile.documents,
  contacts: newProfile.profile.address,
  legal: newProfile.profile.regulatoryProfile,
  financial: newProfile.profile.patrimoine // Pour validation capacité
};

// 3. Validation documents
for (const doc of kyc.documents) {
  await adminAPI.reviewDocument(doc.id, 'approve', 'Document conforme');
}

// 4. Validation finale
await adminAPI.validateCustomerKYC(customerId);

// 5. Configuration tokens/abonnement
await adminAPI.updateTokenAllocation(customerId, 1000);
```

### **Workflow 2 : Monitoring Consommation Client**

```typescript
// 1. Vue d'ensemble tokens
const tokenStats = await adminAPI.getTokenConsumption();

// 2. Alerte sur usage anormal
if (tokenStats.someCustomer.usageIncrease > 200%) {
  // Investiguer utilisation
  const customerDetails = await adminAPI.getCustomerDetails(customerId);
  const usage = customerDetails.profile.tokenConsumption;
  const users = await adminAPI.getCustomerUsers(customerId);
  
  // Analyser patterns d'usage
  const suspiciousActivity = usage.usageHistory.filter(u => u.tokensUsed > threshold);
}

// 3. Ajustement allocation si nécessaire
await adminAPI.updateTokenAllocation(customerId, newAllocation);
```

### **Workflow 3 : Gestion Abonnements**

```typescript
// 1. Profil client avec abonnement
const profile = await adminAPI.getCustomerDetails(customerId);
const subscription = profile.profile.subscriptions;

// 2. Analyse utilisation vs plan
const usagePercentage = subscription.planUsagePercentage;
const features = subscription.planFeatures;

// 3. Recommandation upgrade si nécessaire
if (usagePercentage > 90%) {
  // Suggérer upgrade
  const recommendedPlan = calculateRecommendedPlan(subscription.currentPlan, usage);
  // Notification client via système
}

// 4. Gestion renouvellement
if (subscription.planEndDate < oneMonthFromNow && !subscription.autoRenewal) {
  // Alerte renouvellement nécessaire
}
```

### **Workflow 4 : Conformité Réglementaire**

```typescript
// 1. Audit conformité périodique
const allProfiles = await adminAPI.getCustomerProfiles({
  complianceRating: 'low',
  requiresAttention: true
});

// 2. Révision profils flaggés
for (const profile of allProfiles.items) {
  const details = await adminAPI.getCustomerDetails(profile.customerId);
  
  // Vérification documents expirés
  const expiredDocs = details.documents.filter(doc => 
    doc.expirationDate < new Date()
  );
  
  if (expiredDocs.length > 0) {
    await adminAPI.requestAdditionalDocuments(
      profile.customerId, 
      expiredDocs.map(d => d.type)
    );
  }
}

// 3. Mise à jour statuts conformité
await adminAPI.updateComplianceRating(customerId, 'medium');
```

---

## 📊 **MÉTRIQUES ET KPI ADMIN**

### **Dashboard Principal**

```typescript
interface AdminDashboardKPIs {
  // ====== KYC & VALIDATION ======
  kycMetrics: {
    pendingValidations: number;        // Profils en attente validation
    validatedToday: number;            // Validations aujourd'hui
    averageValidationTime: number;     // Temps moyen validation (heures)
    rejectionRate: number;             // Taux de rejet (%)
    documentsToReview: number;         // Documents en attente révision
  };

  // ====== TOKENS & UTILISATION ======
  tokenMetrics: {
    totalTokensAllocated: number;      // Total tokens alloués
    totalTokensConsumed: number;       // Total tokens consommés
    averageUsagePerCustomer: number;   // Usage moyen par client
    topConsumers: CustomerTokenUsage[]; // Top 10 consommateurs
    projectedMonthlyUsage: number;     // Projection utilisation mensuelle
  };

  // ====== ABONNEMENTS ======
  subscriptionMetrics: {
    totalActiveSubscriptions: number;   // Abonnements actifs
    subscriptionsByPlan: PlanDistribution; // Répartition par plan
    churnRate: number;                 // Taux de résiliation (%)
    upgradeRequests: number;           // Demandes d'upgrade en attente
    renewalsDueThisMonth: number;      // Renouvellements dus ce mois
  };

  // ====== SYSTÈME ======
  systemMetrics: {
    totalActiveUsers: number;          // Utilisateurs actifs plateforme
    apiCallsToday: number;            // Appels API aujourd'hui
    systemUptime: number;             // Uptime système (%)
    averageResponseTime: number;      // Temps réponse moyen (ms)
    criticalAlerts: number;           // Alertes critiques actives
  };
}
```

### **Alertes et Notifications**

```typescript
interface AdminAlertTypes {
  // ====== KYC ======
  'kyc-document-expired': {
    customerId: string;
    documentType: string;
    expirationDate: Date;
  };
  
  'kyc-validation-overdue': {
    customerId: string;
    daysPending: number;
  };

  // ====== TOKENS ======
  'token-usage-spike': {
    customerId: string;
    increasePercentage: number;
    timeframe: string;
  };
  
  'token-allocation-low': {
    customerId: string;
    remainingTokens: number;
    projectedDepletion: Date;
  };

  // ====== SYSTÈME ======
  'system-performance-degraded': {
    metric: string;
    currentValue: number;
    threshold: number;
  };
  
  'subscription-renewal-due': {
    customerId: string;
    planName: string;
    renewalDate: Date;
  };
}
```

---

## 🛡️ **SÉCURITÉ ET CONTRÔLES D'ACCÈS**

### **Niveaux d'Accès Admin**

```typescript
interface AdminPermissions {
  // ====== KYC & VALIDATION ======
  'kyc:view': boolean;           // Voir profils clients
  'kyc:validate': boolean;       // Valider profils KYC
  'kyc:reject': boolean;         // Rejeter validations
  'kyc:request-docs': boolean;   // Demander documents additionnels

  // ====== TOKENS ======
  'tokens:view': boolean;        // Voir consommation tokens
  'tokens:allocate': boolean;    // Allouer tokens
  'tokens:monitor': boolean;     // Monitoring usage

  // ====== ABONNEMENTS ======
  'subscriptions:view': boolean; // Voir abonnements
  'subscriptions:modify': boolean; // Modifier plans
  'subscriptions:billing': boolean; // Accès facturation

  // ====== SYSTÈME ======
  'system:monitor': boolean;     // Monitoring système
  'system:admin': boolean;       // Administration système
  'system:alerts': boolean;      // Gestion alertes
}
```

### **Audit Trail**

```typescript
interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'customer' | 'subscription' | 'token' | 'system';
  targetId: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}

// Toutes les actions admin sont tracées pour audit
const auditTrail = [
  {
    action: 'kyc:validate',
    targetType: 'customer',
    targetId: 'customer-123',
    details: { previousStatus: 'pending', newStatus: 'validated' }
  },
  {
    action: 'tokens:allocate',
    targetType: 'customer', 
    targetId: 'customer-123',
    details: { previousAllocation: 500, newAllocation: 1000 }
  }
];
```

---

## 📈 **MÉTRIQUES DE PERFORMANCE**

### **Objectifs KPI**

```typescript
const adminKPITargets = {
  kycValidationTime: {
    target: '< 24 heures',
    current: '18 heures',
    trend: 'improving'
  },
  
  documentReviewTime: {
    target: '< 4 heures',
    current: '2.5 heures', 
    trend: 'stable'
  },
  
  customerSatisfactionKYC: {
    target: '> 90%',
    current: '94%',
    trend: 'stable'
  },
  
  tokenUsageAccuracy: {
    target: '< 5% variance',
    current: '2.3% variance',
    trend: 'improving'
  }
};
```

---

**🎯 Ce workflow guide le développement d'une interface admin puissante, sécurisée et efficace pour la gestion KYC et l'administration système, en respectant parfaitement la séparation des responsabilités entre administration et opérations commerciales.**