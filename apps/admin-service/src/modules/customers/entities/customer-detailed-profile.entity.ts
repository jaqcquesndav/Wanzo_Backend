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
 * Interface pour CompanyProfile structuré (100% compatible avec customer-service)
 */
export interface CompanyProfileStructured {
  // Identification légale
  registrationNumber?: string; // RCCM
  tradeName?: string;
  incorporationDate?: string;
  
  // Forme juridique et classification
  legalForm?: string;
  industry?: string;
  size?: string;
  sector?: string;
  
  // Documents légaux
  rccm?: string;
  taxId?: string;
  natId?: string;
  
  // Adresse détaillée
  address?: {
    street: string;
    commune?: string;
    city: string;
    province: string;
    country: string;
    postalCode?: string;
  };
  
  // Activités structurées
  activities?: {
    primary: string;
    secondary: string[];
    details: Array<{
      id: string;
      name: string;
      sector: string;
      isMain: boolean;
      startDate: string;
      endDate?: string;
      revenue?: {
        amount: number;
        currency: string;
        period: string;
      };
      isActive: boolean;
    }>;
  };
  
  // Capital structuré
  capital?: {
    isApplicable: boolean;
    authorized: number;
    paidUp: number;
    currency: string;
    shares: {
      total: number;
      value: number;
    };
  };
  
  // Données financières structurées
  financials?: {
    annualRevenue: number;
    revenueCurrency: string;
    lastFinancialYear: string;
    netIncome?: number;
    totalAssets?: number;
    equity?: number;
    employeeCount?: number;
  };
  
  // Affiliations structurées
  affiliations?: {
    cnss?: string;
    inpp?: string;
    onem?: string;
    intraCoop?: string;
    interCoop?: string;
    partners?: string[];
  };
  
  // Propriétaire principal
  owner?: {
    id?: string;
    name?: string;
    gender?: string;
    email?: string;
    phone?: string;
    hasOtherJob?: boolean;
    cv?: string;
    linkedin?: string;
    facebook?: string;
  };
  
  // Associés
  associates?: Array<{
    id: string;
    name: string;
    type: 'individual' | 'company';
    gender?: string;
    role: string;
    shares: number;
    percentage: number;
    email?: string;
    phone?: string;
    joinDate: string;
    isActive: boolean;
  }>;
  
  // Emplacements
  locations?: Array<{
    id: string;
    name: string;
    type: 'headquarters' | 'branch' | 'warehouse' | 'factory' | 'store';
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  
  // Contacts clés
  contactPersons?: Array<{
    id: string;
    name: string;
    position: string;
    department?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
    isActive: boolean;
  }>;
  
  // Licences et certifications
  licenses?: Array<{
    id: string;
    type: string;
    number: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
    status: 'active' | 'expired' | 'suspended' | 'revoked';
    isActive: boolean;
  }>;
  
  // Réseaux sociaux
  socialMedia?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  
  // Métadonnées
  yearFounded?: number;
  employeeCount?: number;
  lastVerifiedAt?: string;
}

/**
 * Interface pour InstitutionProfile structuré (100% compatible avec customer-service v2.0)
 * Alignée avec InstitutionCoreEntity - Nomenclature française
 */
export interface InstitutionProfileStructured {
  // === IDENTIFICATION INSTITUTIONNELLE (Conforme v2.0) ===
  denominationSociale: string;
  sigle: string;
  typeInstitution: 'BANQUE' | 'MICROFINANCE' | 'COOPEC' | 'FOND_GARANTIE' | 'ENTREPRISE_FINANCIERE' | 'FOND_CAPITAL_INVESTISSEMENT' | 'FOND_IMPACT' | 'AUTRE';
  sousCategorie: string;
  dateCreation: string;
  paysOrigine: string;
  statutJuridique: string;
  
  // === INFORMATIONS RÉGLEMENTAIRES ===
  autoritéSupervision: 'bcc' | 'arca' | 'asmf' | 'other';
  numeroAgrement: string;
  dateAgrement: string;
  validiteAgrement: string;
  numeroRCCM: string;
  numeroNIF: string;
  
  // === ACTIVITÉS AUTORISÉES ===
  activitesAutorisees: string[];
  
  // === INFORMATIONS OPÉRATIONNELLES ===
  siegeSocial: string;
  nombreAgences: number;
  villesProvincesCouvertes: string[];
  presenceInternationale: boolean;
  
  // === CAPACITÉS FINANCIÈRES ===
  capitalSocialMinimum: number;
  capitalSocialActuel: number;
  fondsPropresMontant: number;
  totalBilan: number;
  chiffreAffairesAnnuel: number;
  devise: 'USD' | 'CDF' | 'EUR';
  
  // === CLIENTÈLE ET MARCHÉ ===
  segmentClientelePrincipal: string;
  nombreClientsActifs: number;
  portefeuilleCredit: number;
  depotsCollectes: number;
  
  // === SERVICES OFFERTS À WANZO (Nouveau v2.0) ===
  servicesCredit?: string[];
  servicesInvestissement?: string[];
  servicesGarantie?: string[];
  servicesTransactionnels?: string[];
  servicesConseil?: string[];
  
  // === PARTENARIAT WANZO (Nouveau v2.0) ===
  motivationPrincipale?: string;
  servicesPrioritaires?: string[];
  segmentsClienteleCibles?: string[];
  volumeAffairesEnvisage?: string;
  
  // === CONDITIONS COMMERCIALES (Nouveau v2.0) ===
  grillesTarifaires?: string;
  conditionsPreferentielles?: string;
  delaisTraitement?: string;
  criteresEligibilite?: string;
  
  // === CAPACITÉ D'ENGAGEMENT (Nouveau v2.0) ===
  montantMaximumDossier?: number;
  enveloppeGlobale?: number;
  secteursActivitePrivilegies?: string[];
  zonesGeographiquesPrioritaires?: string[];
  
  // === DOCUMENTS (Nouveau v2.0) ===
  documentsLegaux?: string[];
  documentsFinanciers?: string[];
  documentsOperationnels?: string[];
  documentsCompliance?: string[];
  
  // === CHAMPS LEGACY (Rétrocompatibilité) ===
  legalName?: string;
  sigleLegalAbrege?: string;
  brandName?: string;
  type?: string;
  category?: string;
  sector?: 'PRIVE' | 'PUBLIC' | 'PUBLIC_PRIVE';
  ownership?: 'PRIVATE' | 'PUBLIC' | 'GOVERNMENT' | 'COOPERATIVE' | 'MIXED';
  licenseNumber?: string;
  autorisationExploitation?: string;
  dateOctroi?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  taxIdentificationNumber?: string;
  businessRegistrationNumber?: string;
  establishedDate?: string;
  operationsStartDate?: string;
  authorizedCapital?: number;
  paidUpCapital?: number;
  baseCurrency?: string;
  totalBranches?: number;
  totalEmployees?: number;
  totalCustomers?: number;
  
  // === ADRESSE STRUCTURÉE ===
  address?: {
    headOffice: string;
    city: string;
    province: string;
    country: string;
    postalCode?: string;
  };
  
  // === CONTACT ===
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  
  // === LEADERSHIP ===
  ceo?: {
    name: string;
    email?: string;
    phone?: string;
  };
  chairman?: {
    name: string;
  };
  complianceOfficer?: {
    name: string;
    email?: string;
  };
  
  // Localisation GPS
  coordonneesGeographiques?: {
    latitude: number;
    longitude: number;
  };
  
  // Informations réglementaires
  regulatoryInfo?: {
    complianceStatus?: string;
    lastAuditDate?: string;
    reportingRequirements?: any[];
    riskAssessment?: string;
  };
  
  // Présence digitale
  facebookPage?: string;
  linkedinPage?: string;
  socialMediaLinks?: {
    twitter?: string;
    youtube?: string;
  };
  
  // Identité institutionnelle
  mission?: string;
  vision?: string;
  coreValues?: string[];
  
  // Couleurs de marque
  brandColors?: {
    primary?: string;
    secondary?: string;
  };
  
  // Structure du capital
  capitalStructure?: any;
  
  // Branches
  branches?: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  
  // Contacts principaux
  contacts?: {
    general?: {
      phone: string;
      email: string;
    };
    support?: {
      phone?: string;
      email?: string;
    };
  };
  
  // Leadership
  leadership?: Array<{
    id: string;
    name: string;
    position: string;
    department?: string;
    email?: string;
    phone?: string;
  }>;
  
  // Services offerts
  services?: {
    main: string[];
    digital?: string[];
    specialized?: string[];
  };
  
  // Informations financières
  financialInfo?: {
    totalAssets?: number;
    equity?: number;
    profitability?: number;
  };
  
  // Présence digitale détaillée
  digitalPresence?: {
    hasOnlineBanking?: boolean;
    hasMobileApp?: boolean;
    hasAPI?: boolean;
  };
  
  // Partenariats
  partnerships?: Array<{
    name: string;
    type: string;
    since?: string;
  }>;
  
  // Certifications
  certifications?: Array<{
    name: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
  }>;
  
  // Notation de crédit
  creditRating?: {
    rating?: string;
    agency?: string;
    lastUpdate?: string;
  };
  
  // Métriques de performance
  performanceMetrics?: {
    customerSatisfaction?: number;
    npsScore?: number;
    marketShare?: number;
  };
  
  // Heures d'opération
  operatingHours?: {
    weekdays?: string;
    saturdays?: string;
    sundays?: string;
  };
  
  // Flags de statut
  isActive?: boolean;
  isVerified?: boolean;
  isPubliclyListed?: boolean;
  
  // Notes internes
  internalNotes?: string;
  
  // Dernière vérification
  lastVerifiedAt?: string;
}

/**
 * Interface pour Patrimoine structuré (Assets & Stocks)
 */
export interface PatrimoineStructured {
  // Actifs détaillés
  assets: Array<{
    // Identification
    id: string;
    name: string;
    category: 'real_estate' | 'vehicles' | 'equipment' | 'furniture' | 'technology' | 'intangible' | 'financial' | 'other';
    type: string;
    state: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor' | 'damaged' | 'obsolete';
    
    // Identification unique
    serialNumber?: string;
    modelNumber?: string;
    brand?: string;
    manufacturer?: string;
    manufacturingYear?: number;
    
    // Valeurs
    acquisitionCost: number;
    currentValue: number;
    marketValue?: number;
    insuranceValue?: number;
    bookValue?: number;
    currency: string;
    acquisitionDate: string;
    lastValuationDate?: string;
    
    // Amortissement
    depreciationRate?: number;
    depreciationMethod?: 'straight_line' | 'declining_balance' | 'units_of_production';
    usefulLifeYears?: number;
    accumulatedDepreciation: number;
    
    // Localisation
    location?: string;
    building?: string;
    floor?: string;
    room?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    
    // Responsabilité
    assignedTo?: string;
    department?: string;
    custodian?: string;
    custodianContact?: string;
    
    // Maintenance
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    maintenanceCost: number;
    maintenanceSchedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'as_needed';
    maintenanceProvider?: string;
    
    // Assurance
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceExpiryDate?: string;
    insurancePremium?: number;
    
    // Statut
    status: 'available' | 'in_use' | 'maintenance' | 'repair' | 'disposed' | 'sold' | 'lost' | 'stolen';
    isActive: boolean;
    disposalDate?: string;
    disposalReason?: string;
    disposalValue?: number;
    
    // Documents
    documents?: Array<{
      id: string;
      type: string;
      name: string;
      path: string;
      uploadDate: string;
      expiryDate?: string;
    }>;
    
    // Garantie
    warrantyProvider?: string;
    warrantyStartDate?: string;
    warrantyEndDate?: string;
    
    // Métadonnées
    createdAt: string;
    updatedAt: string;
  }>;
  
  // Stocks détaillés
  stocks: Array<{
    // Identification
    id: string;
    sku: string;
    name: string;
    category: 'raw_materials' | 'work_in_progress' | 'finished_goods' | 'supplies' | 'spare_parts' | 'consumables';
    subcategory?: string;
    brand?: string;
    manufacturer?: string;
    
    // Quantités
    quantity: number;
    unit: string;
    reorderLevel: number;
    maximumLevel: number;
    reservedQuantity: number;
    availableQuantity: number;
    
    // Coûts
    unitCost: number;
    averageCost: number;
    lastCost: number;
    sellingPrice?: number;
    currency: string;
    totalValue: number;
    
    // Localisation
    warehouse?: string;
    zone?: string;
    aisle?: string;
    shelf?: string;
    bin?: string;
    
    // Statut
    status: 'active' | 'inactive' | 'discontinued' | 'obsolete';
    state: 'good' | 'damaged' | 'expired' | 'quarantine' | 'returned';
    isActive: boolean;
    trackInventory: boolean;
    
    // Dates
    manufacturingDate?: string;
    expiryDate?: string;
    lastReceivedDate?: string;
    lastSoldDate?: string;
    lastCountDate?: string;
    
    // Fournisseur
    primarySupplier?: string;
    supplierSku?: string;
    leadTimeDays?: number;
    minimumOrderQuantity?: number;
    economicOrderQuantity?: number;
    
    // Codes
    barcode?: string;
    qrCode?: string;
    internalCode?: string;
    
    // Dimensions
    weight?: number;
    weightUnit?: string;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: string;
    volume?: number;
    volumeUnit?: string;
    
    // Qualité
    qualityGrade?: string;
    lastQualityCheck?: string;
    requiresInspection: boolean;
    
    // Analyse ABC
    abcClassification?: 'A' | 'B' | 'C';
    turnoverRate?: 'fast' | 'medium' | 'slow';
    
    // Métadonnées
    createdAt: string;
    updatedAt: string;
  }>;
  
  // Résumés agrégés
  assetsSummary: {
    totalValue: number;
    currency: string;
    count: number;
    byCategory: Record<string, {
      count: number;
      value: number;
    }>;
    depreciationRate: number;
    lastValuationDate?: string;
    lastAssetsUpdate: string;
  };
  
  stocksSummary: {
    totalValue: number;
    currency: string;
    totalItems: number;
    lowStockItemsCount: number;
    outOfStockItemsCount: number;
    lastStockUpdate: string;
    rotationMetrics?: {
      averageTurnoverRate: number;
      fastMovingItems: number;
      slowMovingItems: number;
    };
  };
  
  // Totaux
  totalAssetsValue: number;
  totalStocksValue: number;
  totalPatrimoineValue: number;
  lastValuationDate: string;
}

/**
 * Entité CustomerDetailedProfile enrichie - 100% compatible avec customer-service
 * Version 2.1 - Résout tous les problèmes d'incompatibilité
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
  // NOUVEAUX CHAMPS CRITIQUES (Phase 1 - Correctifs)
  // =====================================================
  
  // Billing & Facturation
  @Column({ nullable: true })
  billingContactName?: string;
  
  @Column({ nullable: true })
  billingContactEmail?: string;
  
  @Column({ nullable: true })
  stripeCustomerId?: string;
  
  // Propriétaire
  @Column({ nullable: true })
  ownerId?: string;
  
  @Column({ nullable: true })
  ownerEmail?: string;
  
  // Workflow Rejet
  @Column({ nullable: true })
  rejectedAt?: Date;
  
  @Column({ nullable: true })
  rejectedBy?: string;
  
  @Column({ nullable: true })
  rejectionReason?: string;
  
  // Préférences
  @Column('jsonb', { nullable: true })
  preferences?: Record<string, any>;
  
  // Description
  @Column({ type: 'text', nullable: true })
  description?: string;
  
  // Vérification
  @Column({ nullable: true })
  lastVerifiedAt?: Date;

  // =====================================================
  // PROFIL DÉTAILLÉ (spécifique au type de client)
  // VERSION ENRICHIE - 100% COMPATIBLE
  // =====================================================
  
  /**
   * Profil détaillé pour les entreprises (PME) - Structure enrichie
   */
  @Column('jsonb', { nullable: true })
  companyProfile?: CompanyProfileStructured;

  /**
   * Profil détaillé pour les institutions financières - Structure enrichie
   */
  @Column('jsonb', { nullable: true })
  institutionProfile?: InstitutionProfileStructured;

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
   * Patrimoine structuré pour les entreprises - VERSION ENRICHIE
   */
  @Column('jsonb', { nullable: true })
  patrimoine?: PatrimoineStructured;

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
   * Métriques financières extraites (pour indexation rapide)
   */
  @Column('jsonb', { nullable: true })
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

  /**
   * Données de partenariat Wanzo (v2.0)
   */
  @Column('jsonb', { nullable: true })
  partnershipData?: {
    motivationPrincipale?: string;
    servicesPrioritaires?: string[];
    segmentsClienteleCibles?: string[];
    volumeAffairesEnvisage?: string;
    servicesOfferts?: {
      credit?: string[];
      investissement?: string[];
      garantie?: string[];
      transactionnels?: string[];
      conseil?: string[];
    };
    conditionsCommerciales?: {
      grillesTarifaires?: string;
      conditionsPreferentielles?: string;
      delaisTraitement?: string;
      criteresEligibilite?: string;
      montantMaximumDossier?: number;
      enveloppeGlobale?: number;
    };
    ciblagePrioritaire?: {
      secteurs?: string[];
      zones?: string[];
    };
    lastUpdated?: string;
  };

  /**
   * Données opérationnelles (v2.0)
   */
  @Column('jsonb', { nullable: true })
  operationalData?: {
    nombreAgences?: number;
    villesProvincesCouvertes?: string[];
    presenceInternationale?: boolean;
    activitesAutorisees?: string[];
    lastUpdated?: string;
  };

  /**
   * Métadonnées de synchronisation ENRICHIES
   */
  @Column('jsonb')
  syncMetadata!: {
    // Synchronisation de base
    lastSyncFromCustomerService: string;
    dataSource: string;
    syncVersion?: string;
    lastUpdateNotified?: string;
    updatedFields?: string[];
    updateContext?: any;
    
    // Version du profil institution (v2.0)
    lastFullSyncVersion?: string;
    institutionProfileVersion?: string;
    
    // Historique de sync (10 derniers)
    syncHistory?: Array<{
      timestamp: string;
      event: string;
      fieldsUpdated: string[];
      newFieldsV2?: string[];
      status: 'success' | 'failed' | 'partial';
      errorMessage?: string;
    }>;
    
    // Checksums pour détection de drift
    dataChecksum?: string;
    lastChecksumValidation?: string;
    
    // Conflits détectés
    conflictsDetected?: Array<{
      field: string;
      customerServiceValue: any;
      adminServiceValue: any;
      detectedAt: string;
      resolved: boolean;
      resolution?: 'customer_service_wins' | 'admin_service_wins' | 'manual';
    }>;
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
  @Column({ nullable: true, default: '2.1.0' })
  dataVersion?: string;

  /**
   * Métriques d'inventaire (pour patrimoine company)
   */
  @Column('jsonb', { nullable: true })
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
      dataVersion: this.dataVersion,
    };
  }

  /**
   * Vérifie si les données nécessitent une resynchronisation
   */
  needsResynchronization(): boolean {
    if (this.needsResync) return true;
    
    const lastSync = new Date(this.lastSyncAt);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    // Resync si > 24h
    return hoursSinceSync > 24;
  }

  /**
   * Met à jour les métriques d'inventaire depuis le patrimoine
   */
  updateFinancialMetricsFromPatrimoine(): void {
    if (!this.patrimoine) return;
    
    this.inventoryMetrics = {
      totalAssetsValue: this.patrimoine.totalAssetsValue,
      assetsCount: this.patrimoine.assetsSummary.count,
      depreciationRate: this.patrimoine.assetsSummary.depreciationRate,
      lastAssetsUpdate: this.patrimoine.assetsSummary.lastAssetsUpdate,
      totalStockValue: this.patrimoine.totalStocksValue,
      totalItems: this.patrimoine.stocksSummary.totalItems,
      lowStockItemsCount: this.patrimoine.stocksSummary.lowStockItemsCount,
      lastStockUpdate: this.patrimoine.stocksSummary.lastStockUpdate,
      rotationMetrics: this.patrimoine.stocksSummary.rotationMetrics,
    };
  }

  /**
   * Ajoute un événement dans l'historique de sync
   */
  addSyncEvent(event: {
    event: string;
    fieldsUpdated: string[];
    status: 'success' | 'failed' | 'partial';
    errorMessage?: string;
  }): void {
    if (!this.syncMetadata.syncHistory) {
      this.syncMetadata.syncHistory = [];
    }
    
    this.syncMetadata.syncHistory.unshift({
      timestamp: new Date().toISOString(),
      ...event,
    });
    
    // Garde seulement les 10 derniers événements
    if (this.syncMetadata.syncHistory.length > 10) {
      this.syncMetadata.syncHistory = this.syncMetadata.syncHistory.slice(0, 10);
    }
  }
}
