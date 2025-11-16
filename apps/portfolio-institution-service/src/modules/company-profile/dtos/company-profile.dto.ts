import { IsString, IsNumber, IsOptional, IsObject, IsArray, IsBoolean, IsUUID, IsEnum, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO pour les événements Kafka depuis customer-service
 */
export class CustomerCompanyProfileEventDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  customerType!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  companyProfile?: {
    legalForm?: string;
    industry?: string;
    size?: string;
    rccm?: string;
    taxId?: string;
    natId?: string;
    activities?: string[];
    capital?: {
      amount: number;
      currency: string;
    };
    financials?: any;
    affiliations?: any;
    owner?: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    associates?: Array<{
      id: string;
      name: string;
      shares: number;
      role: string;
    }>;
    locations?: Array<{
      id: string;
      address: string;
      city: string;
      country: string;
      isPrimary: boolean;
    }>;
    yearFounded?: number;
    employeeCount?: number;
    contactPersons?: Array<{
      name: string;
      role: string;
      email: string;
      phone: string;
    }>;
    socialMedia?: {
      facebook?: string;
      linkedin?: string;
      twitter?: string;
      [key: string]: any;
    };
  };

  @IsOptional()
  @IsNumber()
  profileCompleteness?: number;

  @IsOptional()
  @IsString()
  lastProfileUpdate?: string;
}

/**
 * DTO pour les données financières depuis accounting-service
 */
export class AccountingFinancialDataDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  companyName!: string;

  @IsNumber()
  totalRevenue!: number;

  @IsNumber()
  annual_revenue!: number;

  @IsNumber()
  netProfit!: number;

  @IsNumber()
  totalAssets!: number;

  @IsNumber()
  totalLiabilities!: number;

  @IsNumber()
  cashFlow!: number;

  @IsNumber()
  debt_ratio!: number;

  @IsNumber()
  working_capital!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  credit_score!: number;

  @IsString()
  financial_rating!: string;

  @IsNumber()
  revenue_growth!: number;

  @IsNumber()
  profit_margin!: number;

  @IsOptional()
  @IsNumber()
  ebitda?: number;

  @IsString()
  lastUpdated!: string;
}

/**
 * DTO pour la réponse API du profil complet
 */
export class CompanyProfileResponseDto {
  @IsUUID()
  id!: string;

  // Données primaires (accounting-service)
  @IsString()
  companyName!: string;

  @IsString()
  sector!: string;

  @IsNumber()
  totalRevenue!: number;

  @IsNumber()
  annualRevenue!: number;

  @IsNumber()
  netProfit!: number;

  @IsNumber()
  totalAssets!: number;

  @IsNumber()
  totalLiabilities!: number;

  @IsNumber()
  cashFlow!: number;

  @IsNumber()
  debtRatio!: number;

  @IsNumber()
  workingCapital!: number;

  @IsNumber()
  creditScore!: number;

  @IsString()
  financialRating!: string;

  @IsNumber()
  revenueGrowth!: number;

  @IsNumber()
  profitMargin!: number;

  @IsOptional()
  @IsNumber()
  ebitda?: number;

  @IsNumber()
  employeeCount!: number;

  @IsString()
  companySize!: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  // Données secondaires (customer-service)
  @IsOptional()
  @IsString()
  legalForm?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  rccm?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  natId?: string;

  @IsOptional()
  @IsNumber()
  yearFounded?: number;

  @IsOptional()
  @IsObject()
  capital?: {
    amount: number;
    currency: string;
  };

  @IsOptional()
  @IsObject()
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };

  @IsOptional()
  @IsArray()
  associates?: Array<{
    id: string;
    name: string;
    shares: number;
    role: string;
  }>;

  @IsOptional()
  @IsArray()
  locations?: Array<{
    id: string;
    address: string;
    city: string;
    country: string;
    isPrimary: boolean;
  }>;

  @IsOptional()
  @IsArray()
  contactPersons?: Array<{
    name: string;
    role: string;
    email: string;
    phone: string;
  }>;

  @IsOptional()
  @IsObject()
  affiliations?: {
    cnss?: string;
    inpp?: string;
    [key: string]: any;
  };

  @IsOptional()
  @IsObject()
  socialMedia?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    [key: string]: any;
  };

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  customerServiceStatus?: string;

  // Métadonnées
  @IsOptional()
  @IsString()
  lastSyncFromAccounting?: string;

  @IsOptional()
  @IsString()
  lastSyncFromCustomer?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  profileCompleteness!: number;

  @IsBoolean()
  isAccountingDataFresh!: boolean;

  @IsBoolean()
  isCustomerDataFresh!: boolean;

  @IsString()
  createdAt!: string;

  @IsString()
  updatedAt!: string;
}

/**
 * DTO pour la demande de synchronisation manuelle
 */
export class SyncCompanyProfileDto {
  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsEnum(['accounting', 'customer', 'both'])
  source?: 'accounting' | 'customer' | 'both';

  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

/**
 * DTO pour la réponse de synchronisation
 */
export class SyncResponseDto {
  @IsBoolean()
  success!: boolean;

  @IsString()
  message!: string;

  @IsOptional()
  @IsObject()
  syncDetails?: {
    accountingSynced: boolean;
    customerSynced: boolean;
    fieldsUpdated: string[];
    conflicts: Array<{
      field: string;
      accountingValue: any;
      customerValue: any;
      resolvedWith: 'accounting' | 'customer';
    }>;
  };

  @IsOptional()
  @IsObject()
  profile?: CompanyProfileResponseDto;
}

/**
 * DTO pour les filtres de recherche de profils
 */
export class CompanyProfileSearchDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minCreditScore?: number;

  @IsOptional()
  @IsNumber()
  @Max(100)
  maxCreditScore?: number;

  @IsOptional()
  @IsString()
  financialRating?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsString()
  rccm?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * DTO pour les statistiques des profils
 */
export class CompanyProfileStatsDto {
  @IsNumber()
  totalProfiles!: number;

  @IsNumber()
  profilesWithFreshAccountingData!: number;

  @IsNumber()
  profilesWithFreshCustomerData!: number;

  @IsNumber()
  averageCompleteness!: number;

  @IsObject()
  bySector!: Record<string, number>;

  @IsObject()
  bySize!: Record<string, number>;

  @IsObject()
  byFinancialRating!: Record<string, number>;

  @IsString()
  lastCalculated!: string;
}
