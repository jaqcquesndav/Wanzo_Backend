import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyType } from '../../shared';

export enum ServiceCategory {
  BANKING = 'banking',
  CREDIT = 'credit',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
  INSURANCE = 'insurance',
  DIGITAL = 'digital',
  TRANSFER = 'transfer',
  FOREIGN_EXCHANGE = 'foreign_exchange',
  TRADE_FINANCE = 'trade_finance',
  ASSET_MANAGEMENT = 'asset_management',
  ADVISORY = 'advisory',
  CUSTODY = 'custody'
}

export enum ServiceType {
  // Banking Services
  CURRENT_ACCOUNT = 'current_account',
  SAVINGS_ACCOUNT = 'savings_account',
  FIXED_DEPOSIT = 'fixed_deposit',
  OVERDRAFT = 'overdraft',
  
  // Credit Services
  PERSONAL_LOAN = 'personal_loan',
  BUSINESS_LOAN = 'business_loan',
  MORTGAGE = 'mortgage',
  MICROFINANCE = 'microfinance',
  REVOLVING_CREDIT = 'revolving_credit',
  
  // Digital Services
  MOBILE_BANKING = 'mobile_banking',
  INTERNET_BANKING = 'internet_banking',
  CARD_SERVICES = 'card_services',
  POS_SERVICES = 'pos_services',
  ATM_SERVICES = 'atm_services',
  
  // Transfer Services
  DOMESTIC_TRANSFER = 'domestic_transfer',
  INTERNATIONAL_TRANSFER = 'international_transfer',
  MOBILE_MONEY = 'mobile_money',
  REMITTANCE = 'remittance',
  
  // Investment Services
  MUTUAL_FUNDS = 'mutual_funds',
  BONDS = 'bonds',
  STOCKS = 'stocks',
  PENSION_FUNDS = 'pension_funds',
  
  // Insurance Services
  LIFE_INSURANCE = 'life_insurance',
  HEALTH_INSURANCE = 'health_insurance',
  PROPERTY_INSURANCE = 'property_insurance',
  BUSINESS_INSURANCE = 'business_insurance',
  
  // Other Services
  SAFE_DEPOSIT_BOX = 'safe_deposit_box',
  FOREIGN_EXCHANGE = 'foreign_exchange',
  LETTERS_OF_CREDIT = 'letters_of_credit',
  GUARANTEES = 'guarantees'
}

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  UNDER_DEVELOPMENT = 'under_development',
  DISCONTINUED = 'discontinued'
}

export enum ServiceAvailability {
  BRANCH_ONLY = 'branch_only',
  ONLINE_ONLY = 'online_only',
  MOBILE_ONLY = 'mobile_only',
  ALL_CHANNELS = 'all_channels',
  PHONE_ONLY = 'phone_only'
}

/**
 * DTO pour les frais d'un service
 */
export class ServiceFeeDto {
  @ApiProperty({ description: 'Type de frais' })
  @IsString()
  feeType!: string; // setup, monthly, transaction, percentage, etc.

  @ApiProperty({ description: 'Montant des frais' })
  @IsNumber()
  amount!: number;

  @ApiProperty({ description: 'Devise', enum: CurrencyType })
  @IsEnum(CurrencyType)
  currency!: CurrencyType;

  @ApiPropertyOptional({ description: 'Pourcentage (si applicable)' })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiPropertyOptional({ description: 'Montant minimum' })
  @IsOptional()
  @IsNumber()
  minimumAmount?: number;

  @ApiPropertyOptional({ description: 'Montant maximum' })
  @IsOptional()
  @IsNumber()
  maximumAmount?: number;

  @ApiPropertyOptional({ description: 'Fréquence de facturation' })
  @IsOptional()
  @IsString()
  frequency?: string; // one-time, daily, monthly, quarterly, annually

  @ApiPropertyOptional({ description: 'Description des frais' })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO pour les conditions d'éligibilité
 */
export class EligibilityDto {
  @ApiPropertyOptional({ description: 'Âge minimum' })
  @IsOptional()
  @IsNumber()
  minimumAge?: number;

  @ApiPropertyOptional({ description: 'Âge maximum' })
  @IsOptional()
  @IsNumber()
  maximumAge?: number;

  @ApiPropertyOptional({ description: 'Revenu minimum requis' })
  @IsOptional()
  @IsNumber()
  minimumIncome?: number;

  @ApiPropertyOptional({ description: 'Score de crédit minimum' })
  @IsOptional()
  @IsNumber()
  minimumCreditScore?: number;

  @ApiPropertyOptional({ description: 'Emploi requis' })
  @IsOptional()
  @IsBoolean()
  employmentRequired?: boolean;

  @ApiPropertyOptional({ description: 'Résidence dans le pays requise' })
  @IsOptional()
  @IsBoolean()
  residencyRequired?: boolean;

  @ApiPropertyOptional({ description: 'Documents requis' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Critères spéciaux' })
  @IsOptional()
  @IsString()
  specialCriteria?: string;
}

/**
 * DTO pour les limites d'un service
 */
export class ServiceLimitDto {
  @ApiPropertyOptional({ description: 'Limite de transaction quotidienne' })
  @IsOptional()
  @IsNumber()
  dailyTransactionLimit?: number;

  @ApiPropertyOptional({ description: 'Limite de transaction mensuelle' })
  @IsOptional()
  @IsNumber()
  monthlyTransactionLimit?: number;

  @ApiPropertyOptional({ description: 'Montant minimum par transaction' })
  @IsOptional()
  @IsNumber()
  minimumTransactionAmount?: number;

  @ApiPropertyOptional({ description: 'Montant maximum par transaction' })
  @IsOptional()
  @IsNumber()
  maximumTransactionAmount?: number;

  @ApiPropertyOptional({ description: 'Solde minimum requis' })
  @IsOptional()
  @IsNumber()
  minimumBalance?: number;

  @ApiPropertyOptional({ description: 'Solde maximum autorisé' })
  @IsOptional()
  @IsNumber()
  maximumBalance?: number;

  @ApiProperty({ description: 'Devise des limites', enum: CurrencyType })
  @IsEnum(CurrencyType)
  currency!: CurrencyType;
}

/**
 * DTO pour les canaux de distribution
 */
export class DistributionChannelDto {
  @ApiProperty({ description: 'Nom du canal' })
  @IsString()
  channelName!: string;

  @ApiProperty({ description: 'Type de canal' })
  @IsString()
  channelType!: string; // branch, online, mobile, phone, agent

  @ApiProperty({ description: 'Canal disponible' })
  @IsBoolean()
  isAvailable!: boolean;

  @ApiPropertyOptional({ description: 'Horaires de disponibilité' })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional({ description: 'Frais spécifiques au canal' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceFeeDto)
  channelFee?: ServiceFeeDto;
}

/**
 * DTO principal pour un service financier
 */
export class FinancialServiceDto {
  @ApiProperty({ description: 'Code unique du service' })
  @IsString()
  serviceCode!: string;

  @ApiProperty({ description: 'Nom du service' })
  @IsString()
  serviceName!: string;

  @ApiProperty({ description: 'Catégorie du service', enum: ServiceCategory })
  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @ApiProperty({ description: 'Type de service', enum: ServiceType })
  @IsEnum(ServiceType)
  type!: ServiceType;

  @ApiProperty({ description: 'Statut du service', enum: ServiceStatus })
  @IsEnum(ServiceStatus)
  status!: ServiceStatus;

  @ApiProperty({ description: 'Disponibilité du service', enum: ServiceAvailability })
  @IsEnum(ServiceAvailability)
  availability!: ServiceAvailability;

  @ApiProperty({ description: 'Description du service' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Description détaillée' })
  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @ApiPropertyOptional({ description: 'Avantages du service' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional({ description: 'Caractéristiques principales' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Taux d\'intérêt (si applicable)' })
  @IsOptional()
  @IsNumber()
  interestRate?: number;

  @ApiPropertyOptional({ description: 'Taux d\'intérêt minimum' })
  @IsOptional()
  @IsNumber()
  minimumInterestRate?: number;

  @ApiPropertyOptional({ description: 'Taux d\'intérêt maximum' })
  @IsOptional()
  @IsNumber()
  maximumInterestRate?: number;

  @ApiPropertyOptional({ description: 'Période de taux d\'intérêt' })
  @IsOptional()
  @IsString()
  interestRatePeriod?: string; // daily, monthly, annually

  @ApiPropertyOptional({ description: 'Frais du service' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFeeDto)
  fees?: ServiceFeeDto[];

  @ApiPropertyOptional({ description: 'Conditions d\'éligibilité' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EligibilityDto)
  eligibility?: EligibilityDto;

  @ApiPropertyOptional({ description: 'Limites du service' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceLimitDto)
  limits?: ServiceLimitDto;

  @ApiPropertyOptional({ description: 'Canaux de distribution' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DistributionChannelDto)
  distributionChannels?: DistributionChannelDto[];

  @ApiPropertyOptional({ description: 'Date de lancement' })
  @IsOptional()
  @IsDateString()
  launchDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (si applicable)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Durée du service (en mois)' })
  @IsOptional()
  @IsNumber()
  termInMonths?: number;

  @ApiPropertyOptional({ description: 'Renouvellement automatique' })
  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @ApiPropertyOptional({ description: 'Période de grâce (en jours)' })
  @IsOptional()
  @IsNumber()
  gracePeriodDays?: number;

  @ApiPropertyOptional({ description: 'Service populaire' })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ description: 'Service recommandé' })
  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @ApiPropertyOptional({ description: 'Service pour nouveaux clients' })
  @IsOptional()
  @IsBoolean()
  isForNewCustomers?: boolean;

  @ApiPropertyOptional({ description: 'Conditions générales (URL ou texte)' })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Contact pour plus d\'informations' })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiPropertyOptional({ description: 'URL de documentation' })
  @IsOptional()
  @IsString()
  documentationUrl?: string;

  @ApiPropertyOptional({ description: 'Remarques internes' })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}

/**
 * DTO pour créer un service financier
 */
export class CreateFinancialServiceDto {
  @ApiProperty({ description: 'ID de l\'institution financière' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Données du service' })
  @ValidateNested()
  @Type(() => FinancialServiceDto)
  service!: FinancialServiceDto;
}

/**
 * DTO pour mettre à jour un service financier
 */
export class UpdateFinancialServiceDto {
  @ApiProperty({ description: 'ID du service à mettre à jour' })
  @IsString()
  serviceId!: string;

  @ApiProperty({ description: 'Nouvelles données du service' })
  @ValidateNested()
  @Type(() => FinancialServiceDto)
  service!: Partial<FinancialServiceDto>;
}

/**
 * DTO de réponse pour un service financier
 */
export class FinancialServiceResponseDto extends FinancialServiceDto {
  @ApiProperty({ description: 'Identifiant unique du service' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'ID de l\'institution' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Date de création' })
  @IsString()
  createdAt!: string;

  @ApiProperty({ description: 'Date de mise à jour' })
  @IsString()
  updatedAt!: string;
}

/**
 * DTO pour le catalogue des services d'une institution
 */
export class ServiceCatalogDto {
  @ApiProperty({ description: 'ID de l\'institution' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Liste des services par catégorie' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinancialServiceResponseDto)
  services!: FinancialServiceResponseDto[];

  @ApiPropertyOptional({ description: 'Nombre total de services' })
  @IsOptional()
  @IsNumber()
  totalServices?: number;

  @ApiPropertyOptional({ description: 'Services actifs' })
  @IsOptional()
  @IsNumber()
  activeServices?: number;

  @ApiPropertyOptional({ description: 'Date de dernière mise à jour' })
  @IsOptional()
  @IsString()
  lastUpdated?: string;
}

/**
 * DTO pour les statistiques des services
 */
export class ServiceStatsDto {
  @ApiProperty({ description: 'ID du service' })
  @IsString()
  serviceId!: string;

  @ApiProperty({ description: 'Nombre de clients utilisant le service' })
  @IsNumber()
  activeUsers!: number;

  @ApiProperty({ description: 'Volume de transactions mensuelles' })
  @IsNumber()
  monthlyTransactionVolume!: number;

  @ApiProperty({ description: 'Revenus générés ce mois' })
  @IsNumber()
  monthlyRevenue!: number;

  @ApiProperty({ description: 'Taux de satisfaction client' })
  @IsNumber()
  customerSatisfactionRate!: number;

  @ApiPropertyOptional({ description: 'Évolution par rapport au mois précédent (%)' })
  @IsOptional()
  @IsNumber()
  growthRate?: number;

  @ApiPropertyOptional({ description: 'Date de dernière mise à jour des stats' })
  @IsOptional()
  @IsString()
  lastUpdated?: string;
}

// Aliases pour compatibilité avec les contrôleurs
export { FinancialServiceDto as InstitutionServicesDataDto };
export { CreateFinancialServiceDto as CreateInstitutionServicesDto };
export { UpdateFinancialServiceDto as UpdateInstitutionServicesDto };
export { FinancialServiceResponseDto as InstitutionServicesResponseDto };