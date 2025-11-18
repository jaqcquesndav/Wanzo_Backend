import { IsString, IsNumber, IsEnum, IsOptional, IsObject, ValidateNested, IsEmail, IsUrl, IsUUID, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProspectSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum ProspectStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  REJECTED = 'rejected',
}

/**
 * DTO pour les filtres de recherche de prospects
 */
export class ProspectionFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by sector' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Filter by size', enum: ProspectSize })
  @IsOptional()
  @IsEnum(ProspectSize)
  size?: ProspectSize;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ProspectStatus })
  @IsOptional()
  @IsEnum(ProspectStatus)
  status?: ProspectStatus;

  @ApiPropertyOptional({ description: 'Minimum credit score', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minCreditScore?: number;

  @ApiPropertyOptional({ description: 'Maximum credit score', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxCreditScore?: number;

  @ApiPropertyOptional({ description: 'Filter by financial rating' })
  @IsOptional()
  @IsString()
  financialRating?: string;

  @ApiPropertyOptional({ description: 'Search term for name or sector' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * DTO pour les coordonnées géographiques
 */
export class GeolocationDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometers' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  radiusKm?: number;
}

/**
 * DTO pour les métriques financières dans le contexte prospection
 */
export class ProspectFinancialMetricsDto {
  @ApiProperty({ description: 'Annual revenue (CDF)' })
  @IsNumber()
  annual_revenue!: number;

  @ApiProperty({ description: 'Revenue growth percentage' })
  @IsNumber()
  revenue_growth!: number;

  @ApiProperty({ description: 'Profit margin percentage' })
  @IsNumber()
  profit_margin!: number;

  @ApiProperty({ description: 'Cash flow (CDF)' })
  @IsNumber()
  cash_flow!: number;

  @ApiProperty({ description: 'Debt ratio' })
  @IsNumber()
  debt_ratio!: number;

  @ApiProperty({ description: 'Working capital (CDF)' })
  @IsNumber()
  working_capital!: number;

  @ApiProperty({ description: 'Credit score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  credit_score!: number;

  @ApiProperty({ description: 'Financial rating (AAA, AA, A, BBB, etc.)' })
  @IsString()
  financial_rating!: string;

  @ApiPropertyOptional({ description: 'EBITDA (CDF)' })
  @IsOptional()
  @IsNumber()
  ebitda?: number;
}

/**
 * DTO pour les informations de contact
 */
export class ProspectContactInfoDto {
  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Physical address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;
}

/**
 * DTO pour les informations légales
 */
export class ProspectLegalInfoDto {
  @ApiPropertyOptional({ description: 'Legal form (SARL, SA, SAS, etc.)' })
  @IsOptional()
  @IsString()
  legalForm?: string;

  @ApiPropertyOptional({ description: 'RCCM registration number' })
  @IsOptional()
  @IsString()
  rccm?: string;

  @ApiPropertyOptional({ description: 'Tax identification number' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Year founded' })
  @IsOptional()
  @IsNumber()
  yearFounded?: number;
}

/**
 * DTO principal pour un prospect (company)
 */
export class ProspectDto {
  @ApiProperty({ description: 'Prospect ID' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Business sector' })
  @IsString()
  sector!: string;

  @ApiProperty({ description: 'Company size', enum: ProspectSize })
  @IsEnum(ProspectSize)
  size!: string;

  @ApiProperty({ description: 'Prospect status', enum: ProspectStatus })
  @IsEnum(ProspectStatus)
  status!: string;

  @ApiProperty({ description: 'Financial metrics' })
  @ValidateNested()
  @Type(() => ProspectFinancialMetricsDto)
  financial_metrics!: ProspectFinancialMetricsDto;

  @ApiProperty({ description: 'Contact information' })
  @ValidateNested()
  @Type(() => ProspectContactInfoDto)
  contact_info!: ProspectContactInfoDto;

  @ApiPropertyOptional({ description: 'Latitude of primary location' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude of primary location' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Legal information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProspectLegalInfoDto)
  legal_info?: ProspectLegalInfoDto;

  @ApiPropertyOptional({ description: 'Number of employees' })
  @IsOptional()
  @IsNumber()
  employeeCount?: number;

  @ApiPropertyOptional({ description: 'Company locations' })
  @IsOptional()
  @IsArray()
  locations?: Array<{
    id: string;
    address: string;
    city: string;
    country: string;
    isPrimary: boolean;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;

  @ApiPropertyOptional({ description: 'Company owner' })
  @IsOptional()
  @IsObject()
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };

  @ApiPropertyOptional({ description: 'Contact persons' })
  @IsOptional()
  @IsArray()
  contactPersons?: Array<{
    name: string;
    role: string;
    email: string;
    phone: string;
  }>;

  @ApiProperty({ description: 'Profile completeness percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  profileCompleteness!: number;

  @ApiPropertyOptional({ description: 'Last sync from accounting service' })
  @IsOptional()
  @IsString()
  lastSyncFromAccounting?: string;

  @ApiPropertyOptional({ description: 'Last sync from customer service' })
  @IsOptional()
  @IsString()
  lastSyncFromCustomer?: string;

  @ApiProperty({ description: 'Creation date' })
  @IsString()
  createdAt!: string;

  @ApiProperty({ description: 'Last update date' })
  @IsString()
  updatedAt!: string;
}

/**
 * DTO pour la réponse paginée de prospects
 */
export class ProspectListResponseDto {
  @ApiProperty({ description: 'List of prospects', type: [ProspectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProspectDto)
  data!: ProspectDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  @IsObject()
  meta!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * DTO pour la recherche géographique de prospects
 */
export class NearbyProspectsSearchDto extends GeolocationDto {
  @ApiPropertyOptional({ description: 'Additional filters' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProspectionFiltersDto)
  filters?: ProspectionFiltersDto;
}

/**
 * DTO pour les statistiques de prospection
 */
export class ProspectionStatsDto {
  @ApiProperty({ description: 'Total number of prospects' })
  @IsNumber()
  totalProspects!: number;

  @ApiProperty({ description: 'Distribution by sector' })
  @IsObject()
  bySector!: Record<string, number>;

  @ApiProperty({ description: 'Distribution by size' })
  @IsObject()
  bySize!: Record<string, number>;

  @ApiProperty({ description: 'Distribution by financial rating' })
  @IsObject()
  byFinancialRating!: Record<string, number>;

  @ApiProperty({ description: 'Average credit score' })
  @IsNumber()
  averageCreditScore!: number;

  @ApiProperty({ description: 'Data freshness metrics' })
  @IsObject()
  dataFreshness!: {
    withFreshAccountingData: number;
    withFreshCustomerData: number;
  };

  @ApiProperty({ description: 'Last calculation timestamp' })
  @IsString()
  lastCalculated!: string;
}
