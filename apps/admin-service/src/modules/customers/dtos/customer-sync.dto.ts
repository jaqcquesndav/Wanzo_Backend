import { CompanyProfileStructured, InstitutionProfileStructured, PatrimoineStructured } from '../entities/customer-detailed-profile.entity';

/**
 * DTO pour la synchronisation complète du profil Company depuis customer-service
 */
export class CompanyCoreFullSyncDto {
  customerId!: string;
  customerType: 'PME' = 'PME';
  
  // Informations de base
  name!: string;
  email!: string;
  phone?: string;
  logo?: string;
  address?: any;
  status!: string;
  accountType?: string;
  description?: string;
  
  // Nouveaux champs critiques
  billingContactName?: string;
  billingContactEmail?: string;
  stripeCustomerId?: string;
  ownerId?: string;
  ownerEmail?: string;
  preferences?: Record<string, any>;
  
  // Profil company complet
  companyProfile!: CompanyProfileStructured;
  
  // Profil étendu
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
  
  // Complétude du profil
  profileCompleteness!: {
    percentage: number;
    missingFields: string[];
    completedSections: string[];
    sections?: any;
    missingCriticalFields?: string[];
    lastCalculated?: string;
  };
  
  // Métadonnées de sync
  lastProfileUpdate!: string;
  dataVersion?: string;
  syncVersion?: string;
}

/**
 * DTO pour la synchronisation complète du profil Institution depuis customer-service
 */
export class InstitutionCoreFullSyncDto {
  customerId!: string;
  customerType: 'FINANCIAL_INSTITUTION' = 'FINANCIAL_INSTITUTION';
  
  // Informations de base
  name!: string;
  email!: string;
  phone?: string;
  logo?: string;
  address?: any;
  status!: string;
  accountType?: string;
  description?: string;
  
  // Nouveaux champs critiques
  billingContactName?: string;
  billingContactEmail?: string;
  stripeCustomerId?: string;
  ownerId?: string;
  ownerEmail?: string;
  preferences?: Record<string, any>;
  
  // Profil institution complet
  institutionProfile!: InstitutionProfileStructured;
  
  // Profil réglementaire
  regulatoryProfile?: {
    complianceStatus?: string;
    lastAuditDate?: string;
    reportingRequirements?: any[];
    riskAssessment?: string;
  };
  
  // Complétude du profil
  profileCompleteness!: {
    percentage: number;
    missingFields: string[];
    completedSections: string[];
    sections?: any;
    missingCriticalFields?: string[];
    lastCalculated?: string;
  };
  
  // Métadonnées de sync
  lastProfileUpdate!: string;
  dataVersion?: string;
  syncVersion?: string;
}

/**
 * DTO pour la synchronisation des actifs (CompanyAssets)
 */
export class CompanyAssetsSyncDto {
  customerId!: string;
  syncType!: 'full' | 'incremental' | 'partial';
  timestamp!: string;
  
  assets!: Array<{
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
  
  // Résumé agrégé
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
}

/**
 * DTO pour la synchronisation des stocks (CompanyStocks)
 */
export class CompanyStocksSyncDto {
  customerId!: string;
  syncType!: 'full' | 'incremental' | 'partial';
  timestamp!: string;
  
  stocks!: Array<{
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
  
  // Résumé agrégé
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
}

/**
 * DTO pour la synchronisation complète du patrimoine
 */
export class PatrimoineSyncDto {
  customerId!: string;
  syncType!: 'full' | 'incremental';
  timestamp!: string;
  
  patrimoine!: PatrimoineStructured;
}

/**
 * DTO pour la synchronisation des branches d'institution
 */
export class InstitutionBranchesSyncDto {
  customerId!: string;
  timestamp!: string;
  
  branches!: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
    country: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    manager?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    isActive: boolean;
    establishedDate?: string;
    employeeCount?: number;
    servicesOffered?: string[];
  }>;
}

/**
 * DTO pour la synchronisation du leadership d'institution
 */
export class InstitutionLeadershipSyncDto {
  customerId!: string;
  timestamp!: string;
  
  leadership!: Array<{
    id: string;
    name: string;
    position: string;
    department?: string;
    email?: string;
    phone?: string;
    appointmentDate?: string;
    isActive: boolean;
    biography?: string;
    education?: string[];
    experience?: string[];
  }>;
}

/**
 * DTO pour la mise à jour incrémentale des champs
 */
export class CustomerProfileIncrementalUpdateDto {
  customerId!: string;
  timestamp!: string;
  updateType!: 'field_update' | 'partial_sync';
  
  updatedFields!: Record<string, any>;
  fieldPaths!: string[]; // Ex: ['companyProfile.capital.paidUp', 'address.city']
}

/**
 * DTO pour la notification de changements critiques
 */
export class CriticalChangesNotificationDto {
  customerId!: string;
  requestId!: string;
  timestamp!: string;
  
  changes!: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    reason?: string;
  }>;
  
  syncType!: 'immediate' | 'deferred' | 'requires_approval';
  requiresApproval?: boolean;
  priority!: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * DTO pour la demande de revalidation
 */
export class RevalidationRequestDto {
  customerId!: string;
  requestId!: string;
  timestamp!: string;
  
  reason!: string;
  priority!: 'low' | 'medium' | 'high' | 'urgent';
  changedFields?: string[];
  requiresAdminAction?: boolean;
}

/**
 * DTO de réponse pour la synchronisation
 */
export class SyncResponseDto {
  success!: boolean;
  customerId!: string;
  syncType!: string;
  timestamp!: string;
  
  fieldsUpdated?: string[];
  errors?: Array<{
    field: string;
    error: string;
  }>;
  
  warnings?: string[];
  nextScheduledSync?: string;
}
