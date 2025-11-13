import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ProfileType {
  COMPANY = 'company',
  INSTITUTION = 'institution'
}

export enum AdminStatus {
  UNDER_REVIEW = 'under_review',
  VALIDATED = 'validated',
  FLAGGED = 'flagged',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
  REQUIRES_ATTENTION = 'requires_attention'
}

export enum ComplianceRating {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  CRITICAL = 'critical'
}

/**
 * Entité pour stocker les profils clients détaillés synchronisés depuis customer-service
 * Cette entité évite la redondance et centralise les données pour l'admin-service
 */
@Entity('customer_detailed_profiles')
@Index(['customerId'], { unique: true })
@Index(['customerType'])
@Index(['lastSyncFromCustomerService'])
@Index(['profileCompleteness'])
export class CustomerDetailedProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  customerId!: string;

  @Column({
    type: 'enum',
    enum: ['PME', 'FINANCIAL_INSTITUTION']
  })
  customerType!: 'PME' | 'FINANCIAL_INSTITUTION';

  @Column({
    type: 'enum',
    enum: ProfileType
  })
  profileType!: ProfileType;

  @Column('jsonb')
  profileData!: any;

  @Column('decimal', { precision: 5, scale: 2 })
  profileCompleteness!: number;

  @Column({
    type: 'enum',
    enum: AdminStatus,
    default: AdminStatus.UNDER_REVIEW
  })
  adminStatus!: AdminStatus;

  @Column({
    type: 'enum',
    enum: ComplianceRating
  })
  complianceRating!: ComplianceRating;

  @Column({ nullable: true })
  adminNotes?: string;

  @Column('simple-array', { nullable: true })
  riskFlags?: string[];

  @Column({ default: false })
  needsResync!: boolean;

  @Column()
  lastSyncAt!: Date;

  @Column({ nullable: true })
  lastReviewedAt?: Date;

  @Column({ nullable: true })
  reviewedBy?: string;

  // =====================================================
  // INFORMATIONS DE BASE (synchronisées)
  // =====================================================
  
  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column('jsonb', { nullable: true })
  address?: any;

  @Column()
  status!: string;

  @Column({ nullable: true })
  accountType?: string;

  // =====================================================
  // PROFIL DÉTAILLÉ (spécifique au type de client)
  // =====================================================
  
  /**
   * Profil détaillé pour les entreprises (PME)
   */
  @Column('jsonb', { nullable: true })
  companyProfile?: {
    legalForm?: string;
    industry?: string;
    size?: string;
    rccm?: string;
    taxId?: string;
    natId?: string;
    activities?: any;
    capital?: any;
    financials?: any;
    affiliations?: any;
    owner?: any;
    associates?: any[];
    locations?: any[];
    yearFounded?: number;
    employeeCount?: number;
    contactPersons?: any[];
    socialMedia?: any;
  };

  /**
   * Profil détaillé pour les institutions financières
   */
  @Column('jsonb', { nullable: true })
  institutionProfile?: {
    denominationSociale?: string;
    sigleLegalAbrege?: string;
    type?: string;
    category?: string;
    licenseNumber?: string;
    establishedDate?: string;
    typeInstitution?: string;
    autorisationExploitation?: string;
    dateOctroi?: string;
    autoriteSupervision?: string;
    dateAgrement?: string;
    coordonneesGeographiques?: any;
    regulatoryInfo?: any;
    website?: string;
    brandColors?: any;
    facebookPage?: string;
    linkedinPage?: string;
    capitalStructure?: any;
    branches?: any[];
    contacts?: any;
    leadership?: any;
    services?: any;
    financialInfo?: any;
    digitalPresence?: any;
    partnerships?: any;
    certifications?: any;
    creditRating?: any;
    performanceMetrics?: any;
  };

  // =====================================================
  // PROFILS ÉTENDUS
  // =====================================================
  
  /**
   * Profil étendu pour les entreprises (formulaire d'identification)
   */
  @Column('jsonb', { nullable: true })
  extendedProfile?: {
    generalInfo?: any;
    legalInfo?: any;
    patrimonyAndMeans?: any;
    specificities?: any;
    performance?: any;
    completionPercentage?: number;
    isComplete?: boolean;
    identification?: any;
    lastIdentificationUpdate?: string;
  };

  /**
   * Profil réglementaire pour les institutions financières
   */
  @Column('jsonb', { nullable: true })
  regulatoryProfile?: {
    complianceStatus?: string;
    lastAuditDate?: string;
    reportingRequirements?: any[];
    riskAssessment?: string;
  };

  /**
   * Patrimoine pour les entreprises
   */
  @Column('jsonb', { nullable: true })
  patrimoine?: {
    assets: any[];
    stocks: any[];
    totalAssetsValue: number;
    lastValuationDate?: string;
    assetsSummary?: any;
    stocksSummary?: any;
    lastAssetsUpdate?: string;
    lastStocksUpdate?: string;
  };

  // =====================================================
  // MÉTADONNÉES ET COMPLÉTUDE
  // =====================================================
  
  /**
   * Complétude du profil (métadonnées détaillées)
   */
  @Column('jsonb', { nullable: true })
  profileCompletenessDetails?: {
    percentage: number;
    missingFields: string[];
    completedSections: string[];
    sections?: any;
    missingCriticalFields?: string[];
    lastCalculated?: string;
  };

  /**
   * Métadonnées de synchronisation
   */
  @Column('jsonb')
  syncMetadata!: {
    lastSyncFromCustomerService: string;
    dataSource: string;
    syncVersion?: string;
    lastUpdateNotified?: string;
    updatedFields?: string[];
    updateContext?: any;
  };



  // =====================================================
  // SYNCHRONISATION ET PLANIFICATION
  // =====================================================
  
  /**
   * État de synchronisation
   */
  @Column({
    type: 'enum',
    enum: ['synced', 'pending_sync', 'sync_scheduled', 'sync_failed'],
    default: 'synced'
  })
  syncStatus!: 'synced' | 'pending_sync' | 'sync_scheduled' | 'sync_failed';

  /**
   * Prochaine synchronisation programmée
   */
  @Column({ nullable: true })
  nextScheduledSync?: Date;

  /**
   * Erreurs de synchronisation
   */
  @Column('jsonb', { nullable: true })
  syncErrors?: Array<{
    timestamp: string;
    error: string;
    details?: any;
  }>;

  // =====================================================
  // NOUVELLES PROPRIÉTÉS POUR V2.1
  // =====================================================
  
  /**
   * Données spécialisées par type (v2.1)
   */
  @Column('jsonb', { nullable: true })
  specificData?: any;

  /**
   * Version des données
   */
  @Column({ nullable: true })
  dataVersion?: string;

  /**
   * Métriques financières
   */
  @Column('jsonb', { nullable: true })
  financialMetrics?: {
    totalAssetsValue?: number;
    assetsCount?: number;
    depreciationRate?: number;
    lastAssetsUpdate?: string;
    totalStockValue?: number;
    totalItems?: number;
    lowStockItemsCount?: number;
    lastStockUpdate?: string;
    rotationMetrics?: any;
  };

  /**
   * Métriques d'inventaire
   */
  @Column('jsonb', { nullable: true })
  inventoryMetrics?: any;

  /**
   * Alertes système
   */
  @Column('jsonb', { nullable: true })
  alerts?: Array<{
    type: string;
    level: string;
    message: string;
    data?: any;
    createdAt: string;
    acknowledged: boolean;
  }>;

  /**
   * Statut de validation
   */
  @Column('jsonb', { nullable: true })
  validationStatus?: {
    identificationComplete?: boolean;
    validatedBy?: string;
    validationDate?: string;
    completionPercentage?: number;
  };

  /**
   * Profil de risque
   */
  @Column('jsonb', { nullable: true })
  riskProfile?: {
    overallRiskScore?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    riskFactors?: string[];
    recommendations?: string[];
    lastAssessment?: string;
  };

  /**
   * Insights générés automatiquement
   */
  @Column('jsonb', { nullable: true })
  insights?: {
    insights?: string[];
    recommendations?: string[];
    opportunities?: string[];
    alerts?: string[];
    lastGenerated?: string;
  };

  /**
   * Changements critiques en attente
   */
  @Column('jsonb', { nullable: true })
  criticalChanges?: Array<{
    requestId: string;
    changes: any[];
    syncType: string;
    requiresApproval?: boolean;
    status: string;
    createdAt: string;
  }>;

  /**
   * Revalidation programmée
   */
  @Column('jsonb', { nullable: true })
  revalidationScheduled?: {
    reason: string;
    priority: string;
    requestId: string;
    scheduledAt: string;
    status: string;
  };

  /**
   * Priorité de révision
   */
  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  })
  reviewPriority!: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * Nécessite attention administrative
   */
  @Column({ default: false })
  requiresAttention!: boolean;

  /**
   * Consommation de tokens
   */
  @Column('jsonb', { nullable: true })
  tokenConsumption?: {
    totalTokensAllocated?: number;
    tokensUsed?: number;
    tokensRemaining?: number;
    lastUsageDate?: string;
    monthlyUsage?: number;
    usageHistory?: Array<{
      date: string;
      tokensUsed: number;
      service: string;
    }>;
    averageDailyUsage?: number;
  };

  /**
   * Abonnements et plans
   */
  @Column('jsonb', { nullable: true })
  subscriptions?: {
    currentPlan?: string;
    planStartDate?: string;
    planEndDate?: string;
    planStatus?: 'active' | 'suspended' | 'expired' | 'cancelled';
    planFeatures?: string[];
    billingCycle?: 'monthly' | 'yearly';
    autoRenewal?: boolean;
    subscriptionHistory?: Array<{
      planName: string;
      startDate: string;
      endDate: string;
      status: string;
    }>;
    upgradeEligible?: boolean;
    planUsagePercentage?: number;
  };

  /**
   * Utilisateurs du client
   */
  @Column('jsonb', { nullable: true })
  users?: {
    totalUsers?: number;
    activeUsers?: number;
    lastLoginDate?: string;
    userRoles?: Array<{
      role: string;
      count: number;
    }>;
    recentActivity?: Array<{
      userId: string;
      userName: string;
      lastLogin: string;
      role: string;
      status: 'active' | 'inactive' | 'suspended';
    }>;
    accessPermissions?: string[];
    securitySettings?: {
      twoFactorEnabled?: boolean;
      passwordPolicy?: string;
      sessionTimeout?: number;
    };
  };

  /**
   * Utilisation de la plateforme
   */
  @Column('jsonb', { nullable: true })
  platformUsage?: {
    totalApiCalls?: number;
    lastApiCall?: string;
    mostUsedEndpoints?: Array<{
      endpoint: string;
      callCount: number;
    }>;
    dataStorageUsed?: number;
    bandwidthUsed?: number;
    errorRate?: number;
    responseTimeAvg?: number;
    uptime?: number;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // =====================================================
  // MÉTHODES UTILITAIRES
  // =====================================================
  
  /**
   * Vérifie si le profil nécessite une attention administrative
   */
  requiresAdminAttention(): boolean {
    return this.adminStatus === AdminStatus.FLAGGED ||
           this.adminStatus === AdminStatus.SUSPENDED ||
           this.profileCompleteness < 70 ||
           this.complianceRating === ComplianceRating.CRITICAL;
  }

  /**
   * Vérifie si le profil est conforme
   */
  isCompliant(): boolean {
    return this.complianceRating === ComplianceRating.HIGH ||
           this.complianceRating === ComplianceRating.MEDIUM;
  }

  /**
   * Retourne un résumé du profil pour les vues admin
   */
  getAdminSummary() {
    return {
      id: this.id,
      customerId: this.customerId,
      customerType: this.customerType,
      profileType: this.profileType,
      name: this.name,
      email: this.email,
      status: this.status,
      adminStatus: this.adminStatus,
      complianceRating: this.complianceRating,
      profileCompleteness: this.profileCompleteness,
      riskFlags: this.riskFlags,
      requiresAttention: this.requiresAdminAttention(),
      isCompliant: this.isCompliant(),
      lastSyncAt: this.lastSyncAt,
      needsResync: this.needsResync,
    };
  }
}