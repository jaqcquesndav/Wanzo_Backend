import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsBoolean, IsNumber, Min, Max, IsArray, IsNotEmpty } from 'class-validator';
import { AdminStatus, ComplianceRating, ProfileType } from '../entities/customer-detailed-profile.entity';

/**
 * DTO ADMIN-KYC pour les profils clients
 * RESPECTE la séparation KYC/Administration vs Commercial - Admin a accès aux données de GESTION SYSTÈME et KYC
 * 
 * DONNÉES AUTORISÉES POUR ADMIN (KYC & GESTION SYSTÈME) :
 * ✅ Profils clients COMPLETS (identification, KYC, documents, adresses)
 * ✅ Consommation tokens, abonnements, plans d'utilisation
 * ✅ Utilisateurs et gestion des accès client
 * ✅ Métriques d'utilisation système et plateforme
 * ✅ Données de conformité, validation, statuts administratifs
 * ✅ Informations financières de base (capital, structures - pour KYC)
 * ✅ Patrimoine et actifs (pour validation KYC entreprise)
 * ✅ Contacts, adresses, informations légales complètes
 * 
 * DONNÉES INTERDITES POUR ADMIN (COMMERCIAL PUR) :
 * ❌ Ventes et transactions commerciales des clients
 * ❌ Inventaires produits commerciaux des clients  
 * ❌ Chiffres d'affaires et performances commerciales
 * ❌ Données comptables opérationnelles commerciales
 * ❌ Stratégies business et données confidentielles commerciales
 */
export class AdminCustomerProfileDto {
  @ApiProperty({ description: 'Profile unique identifier' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Original customer ID from customer-service' })
  @IsUUID()
  customerId: string;

  // ===============================================
  // INFORMATIONS DE BASE (KYC & IDENTIFICATION)
  // ===============================================
  
  @ApiProperty({ description: 'Customer name or company name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Customer contact email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Customer contact phone (complete for KYC)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Customer type (PME or FINANCIAL_INSTITUTION)' })
  @IsString()
  customerType: 'PME' | 'FINANCIAL_INSTITUTION';

  @ApiProperty({ description: 'Profile type', enum: ProfileType })
  @IsEnum(ProfileType)
  profileType: ProfileType;

  @ApiPropertyOptional({ description: 'Customer logo URL' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ description: 'Customer status (active, inactive, etc.)' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Account type (standard, premium, enterprise)' })
  @IsOptional()
  @IsString()
  accountType?: string;

  // ===============================================
  // ADRESSES ET CONTACTS (NÉCESSAIRES POUR KYC)
  // ===============================================
  
  @ApiPropertyOptional({ description: 'Complete address information for KYC validation' })
  @IsOptional()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };

  // ===============================================
  // PROFILS DÉTAILLÉS (ESSENTIELS POUR KYC)
  // ===============================================
  
  @ApiPropertyOptional({ description: 'Complete company profile for PME KYC validation' })
  @IsOptional()  
  companyProfile?: {
    legalForm?: string;
    industry?: string;
    size?: string;
    rccm?: string; // Numéro RCCM - critique pour KYC
    taxId?: string; // ID fiscal - critique pour KYC
    natId?: string; // ID national - critique pour KYC
    activities?: any; // Activités déclarées
    capital?: any; // Structure du capital - nécessaire pour KYC
    financials?: any; // Données financières de base pour validation
    affiliations?: any; // Affiliations et partenariats
    owner?: any; // Propriétaire principal - critique pour KYC
    associates?: any[]; // Associés - nécessaire pour KYC
    locations?: any[]; // Localisations - validation géographique
    yearFounded?: number;
    employeeCount?: number;
    contactPersons?: any[]; // Personnes de contact - KYC
    socialMedia?: any; // Présence digitale pour validation
  };

  @ApiPropertyOptional({ description: 'Complete institution profile for financial institutions KYC' })
  @IsOptional()
  institutionProfile?: {
    denominationSociale?: string;
    sigleLegalAbrege?: string;
    type?: string;
    category?: string;
    licenseNumber?: string; // Numéro de licence - CRITIQUE pour KYC institutions
    establishedDate?: string;
    typeInstitution?: string;
    autorisationExploitation?: string; // Autorisation d'exploitation
    dateOctroi?: string;
    autoriteSupervision?: string; // Autorité de supervision
    dateAgrement?: string;
    coordonneesGeographiques?: any;
    regulatoryInfo?: any; // Informations réglementaires - CRITIQUE
    website?: string;
    brandColors?: any;
    facebookPage?: string;
    linkedinPage?: string;
    capitalStructure?: any; // Structure du capital - KYC essentiel
    branches?: any[]; // Succursales - validation géographique
    contacts?: any; // Contacts officiels
    leadership?: any; // Direction - KYC personnel clé
    services?: any; // Services offerts - validation activité
    financialInfo?: any; // Informations financières pour KYC
    digitalPresence?: any;
    partnerships?: any; // Partenariats - validation réseau
    certifications?: any; // Certifications - validation conformité
    creditRating?: any; // Notation crédit - évaluation risque
    performanceMetrics?: any; // Métriques de performance
  };

  @ApiPropertyOptional({ description: 'Extended profile data including identification forms' })
  @IsOptional()
  extendedProfile?: {
    generalInfo?: any;
    legalInfo?: any; // Informations légales - CRITIQUE pour KYC
    patrimonyAndMeans?: any; // Patrimoine et moyens - validation capacité
    specificities?: any;
    performance?: any;
    completionPercentage?: number;
    isComplete?: boolean;
    identification?: any; // Données d'identification complètes
    lastIdentificationUpdate?: string;
  };

  @ApiPropertyOptional({ description: 'Regulatory profile for compliance validation' })
  @IsOptional()
  regulatoryProfile?: {
    complianceStatus?: string;
    lastAuditDate?: string;
    reportingRequirements?: any[];
    riskAssessment?: string;
  };

  @ApiPropertyOptional({ description: 'Asset portfolio for enterprise validation' })
  @IsOptional()
  patrimoine?: {
    assets: any[]; // Actifs - validation patrimoine entreprise
    stocks: any[]; // Stocks - validation activité
    totalAssetsValue: number; // Valeur totale - validation capacité
    lastValuationDate?: string;
    assetsSummary?: any;
    stocksSummary?: any;
    lastAssetsUpdate?: string;
    lastStocksUpdate?: string;
  };

  // ===============================================
  // INFORMATIONS ADMINISTRATIVES (COEUR ADMIN)
  // ===============================================
  
  @ApiProperty({ description: 'Admin status', enum: AdminStatus })
  @IsEnum(AdminStatus)
  adminStatus: AdminStatus;

  @ApiProperty({ description: 'Compliance rating', enum: ComplianceRating })
  @IsEnum(ComplianceRating)
  complianceRating: ComplianceRating;

  @ApiProperty({ description: 'Profile completeness percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  profileCompleteness: number;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Risk flags' })
  @IsOptional()
  @IsArray()
  riskFlags?: string[];

  @ApiProperty({ description: 'Review priority level' })
  @IsString()
  reviewPriority: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty({ description: 'Requires admin attention flag' })
  @IsBoolean()
  requiresAttention: boolean;

  // ===============================================
  // MÉTADONNÉES DE SYNCHRONISATION
  // ===============================================
  
  @ApiProperty({ description: 'Needs resync flag' })
  @IsBoolean()
  needsResync: boolean;

  @ApiProperty({ description: 'Last sync timestamp' })
  @IsDateString()
  lastSyncAt: Date;

  @ApiPropertyOptional({ description: 'Last review timestamp' })
  @IsOptional()
  @IsDateString()
  lastReviewedAt?: Date;

  @ApiPropertyOptional({ description: 'Reviewer ID' })
  @IsOptional()
  @IsUUID()
  reviewedBy?: string;

  // ===============================================
  // CONSOMMATION TOKENS & ABONNEMENTS (GESTION SYSTÈME)
  // ===============================================
  
  @ApiPropertyOptional({ description: 'Token consumption and usage metrics' })
  @IsOptional()
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

  @ApiPropertyOptional({ description: 'Subscription and plans information' })
  @IsOptional()
  subscriptions?: {
    currentPlan?: string;
    planStartDate?: string;
    planEndDate?: string;
    planStatus?: string;
    planFeatures?: string[];
    billingCycle?: string;
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

  @ApiPropertyOptional({ description: 'Customer users and access management' })
  @IsOptional()
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

  @ApiPropertyOptional({ description: 'Platform usage and system metrics' })
  @IsOptional()
  platformUsage?: {
    totalApiCalls?: number;
    lastApiCall?: string;
    mostUsedEndpoints?: Array<{
      endpoint: string;
      callCount: number;
    }>;
    dataStorageUsed?: number; // en MB
    bandwidthUsed?: number; // en MB
    errorRate?: number; // pourcentage
    responseTimeAvg?: number; // en ms
    uptime?: number; // pourcentage
  };

  // ===============================================
  // MÉTRIQUES FINANCIÈRES INSTITUTIONS (v2.0)
  // ===============================================
  
  @ApiPropertyOptional({ description: 'Financial metrics for institutions (v2.0)' })
  @IsOptional()
  financialMetrics?: {
    capitalSocialMinimum?: number;
    capitalSocialActuel?: number;
    fondsPropresMontant?: number;
    totalBilan?: number;
    chiffreAffairesAnnuel?: number;
    devise?: string;
    nombreClientsActifs?: number;
    portefeuilleCredit?: number;
    depotsCollectes?: number;
    lastUpdated?: string;
  };

  // ===============================================
  // MÉTRIQUES D'INVENTAIRE (COMPANY - PATRIMOINE)
  // ===============================================
  
  @ApiPropertyOptional({ description: 'Inventory metrics for company patrimoine (KYC validation)' })
  @IsOptional()
  inventoryMetrics?: {
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

  @ApiPropertyOptional({ description: 'System alerts' })
  @IsOptional()
  @IsArray()
  alerts?: Array<{
    type: string;
    level: string;
    message: string;
    createdAt: string;
    acknowledged: boolean;
  }>;

  @ApiPropertyOptional({ description: 'Validation status summary' })
  @IsOptional()
  validationStatus?: {
    identificationComplete?: boolean;
    validatedBy?: string;
    validationDate?: string;
    completionPercentage?: number;
  };

  @ApiPropertyOptional({ description: 'Risk profile summary' })
  @IsOptional()
  riskProfile?: {
    overallRiskScore?: number;
    riskLevel?: string;
    riskFactors?: string[];
    lastAssessment?: string;
  };

  @ApiPropertyOptional({ description: 'Generated insights' })
  @IsOptional()
  insights?: {
    insights?: string[];
    recommendations?: string[];
    opportunities?: string[];
    alerts?: string[];
    lastGenerated?: string;
  };

  // ===============================================
  // TIMESTAMPS
  // ===============================================
  
  @ApiProperty({ description: 'Profile creation timestamp' })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ description: 'Profile last update timestamp' })
  @IsDateString()
  updatedAt: Date;
}

/**
 * DTO pour les listes de profils admin avec pagination
 */
export class AdminCustomerProfileListDto {
  @ApiProperty({ type: [AdminCustomerProfileDto] })
  items: AdminCustomerProfileDto[];

  @ApiProperty({ description: 'Total number of profiles' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

/**
 * DTO pour approuver un document
 */
export class ApproveDocumentDto {
  @ApiPropertyOptional({ description: 'Approval comments' })
  @IsOptional()
  @IsString()
  comments?: string;
}

/**
 * DTO pour rejeter un document
 */
export class RejectDocumentDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional comments' })
  @IsOptional()
  @IsString()
  comments?: string;
}

/**
 * DTO ADMIN-SAFE pour les détails d'un profil client
 * Inclut les données associées autorisées pour admin
 */
export class AdminCustomerProfileDetailsDto {
  @ApiProperty({ type: AdminCustomerProfileDto })
  profile: AdminCustomerProfileDto;

  @ApiPropertyOptional({ description: 'Statistics summary' })
  @IsOptional()
  statistics?: {
    documentsCount?: number;
    activitiesCount?: number;
    lastActivity?: string;
    subscriptionsCount?: number;
    plansUsage?: any; // TODO: Définir structure plans/usage
  };

  @ApiPropertyOptional({ description: 'Recent activities (admin-relevant only)' })
  @IsOptional()
  @IsArray()
  recentActivities?: Array<{
    id: string;
    type: string;
    action: string;
    description: string;
    performedAt: Date;
    performedBy?: string;
  }>;

  @ApiPropertyOptional({ description: 'Admin documents (non-commercial)' })
  @IsOptional()
  @IsArray()
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    status: string;
    uploadedAt: Date;
    // Note: Pas les URLs directes pour sécurité
  }>;
}

/**
 * DTO pour les actions admin sur les profils
 */
export class AdminProfileActionDto {
  @ApiProperty({ description: 'New admin status', enum: AdminStatus })
  @IsEnum(AdminStatus)
  adminStatus: AdminStatus;

  @ApiProperty({ description: 'New compliance rating', enum: ComplianceRating })
  @IsEnum(ComplianceRating)
  complianceRating: ComplianceRating;

  @ApiPropertyOptional({ description: 'Admin notes for the action' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Risk flags to add or update' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFlags?: string[];

  @ApiProperty({ description: 'Review priority', enum: ['low', 'medium', 'high', 'urgent'] })
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  reviewPriority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * DTO pour les paramètres de requête admin
 */
export class AdminProfileQueryDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by customer type' })
  @IsOptional()
  @IsString()
  customerType?: 'PME' | 'FINANCIAL_INSTITUTION';

  @ApiPropertyOptional({ description: 'Filter by admin status', enum: AdminStatus })
  @IsOptional()
  @IsEnum(AdminStatus)
  adminStatus?: AdminStatus;

  @ApiPropertyOptional({ description: 'Filter by compliance rating', enum: ComplianceRating })
  @IsOptional()
  @IsEnum(ComplianceRating)
  complianceRating?: ComplianceRating;

  @ApiPropertyOptional({ description: 'Filter profiles needing attention' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  requiresAttention?: boolean;

  @ApiPropertyOptional({ description: 'Filter profiles needing resync' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  needsResync?: boolean;

  @ApiPropertyOptional({ description: 'Minimum profile completeness percentage' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minCompleteness?: number;

  @ApiPropertyOptional({ description: 'Filter by review priority' })
  @IsOptional()
  @IsString()
  reviewPriority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * DTO pour les statistiques admin (données agrégées autorisées)
 */
export class AdminDashboardStatsDto {
  @ApiProperty({ description: 'Total number of customer profiles' })
  totalProfiles: number;

  @ApiProperty({ description: 'Profiles by customer type' })
  profilesByType: {
    PME: number;
    FINANCIAL_INSTITUTION: number;
  };

  @ApiProperty({ description: 'Profiles by admin status' })
  profilesByAdminStatus: {
    under_review: number;
    validated: number;
    flagged: number;
    suspended: number;
    archived: number;
    requires_attention: number;
  };

  @ApiProperty({ description: 'Profiles by compliance rating' })
  profilesByComplianceRating: {
    high: number;
    medium: number;
    low: number;
    critical: number;
  };

  @ApiProperty({ description: 'Average profile completeness' })
  averageCompleteness: number;

  @ApiProperty({ description: 'Profiles requiring immediate attention' })
  urgentProfiles: number;

  @ApiProperty({ description: 'Profiles needing resync' })
  profilesNeedingResync: number;

  @ApiProperty({ description: 'Recently updated profiles (last 24h)' })
  recentlyUpdated: number;

  @ApiProperty({ description: 'System health indicators' })
  systemHealth: {
    syncLatency: number; // en minutes
    pendingActions: number;
    systemAlerts: number;
  };
}