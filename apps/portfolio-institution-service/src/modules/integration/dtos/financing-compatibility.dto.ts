import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, IsDate, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO de compatibilité pour mapper les données de financing entre
 * gestion_commerciale_service et portfolio-institution-service
 * 
 * Ce DTO assure la compatibilité granulaire au niveau des données métier
 */

export enum FinancingTypeMapping {
  BUSINESS_LOAN = 'businessLoan',
  EQUIPMENT_LOAN = 'equipmentLoan',
  WORKING_CAPITAL = 'workingCapital',
  EXPANSION_LOAN = 'expansionLoan',
  LINE_OF_CREDIT = 'lineOfCredit',
}

export enum FinancingStatusMapping {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'underReview',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Mapper les statuts entre gestion_commerciale et portfolio-institution
 */
export const StatusMappingGCToPI = {
  'draft': 'DRAFT',
  'submitted': 'SUBMITTED',
  'underReview': 'UNDER_REVIEW',
  'approved': 'APPROVED',
  'rejected': 'REJECTED',
  'disbursed': 'DISBURSED',
  'completed': 'CLOSED',
  'cancelled': 'CANCELED',
};

export const StatusMappingPIToGC = {
  'DRAFT': 'draft',
  'SUBMITTED': 'submitted',
  'UNDER_REVIEW': 'underReview',
  'PENDING': 'underReview',
  'ANALYSIS': 'underReview',
  'APPROVED': 'approved',
  'REJECTED': 'rejected',
  'CANCELED': 'cancelled',
  'DISBURSED': 'disbursed',
  'ACTIVE': 'disbursed',
  'CLOSED': 'completed',
  'DEFAULTED': 'completed',
  'RESTRUCTURED': 'approved',
  'CONSOLIDATED': 'approved',
  'IN_LITIGATION': 'underReview',
};

class BusinessInformationCompatDto {
  @ApiProperty({ description: 'Business name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Registration number' })
  @IsString()
  registrationNumber!: string;

  @ApiProperty({ description: 'Business address' })
  @IsString()
  address!: string;

  @ApiProperty({ description: 'Years in business' })
  @IsNumber()
  @Min(0)
  yearsInBusiness!: number;

  @ApiProperty({ description: 'Number of employees' })
  @IsNumber()
  @Min(0)
  numberOfEmployees!: number;

  @ApiProperty({ description: 'Annual revenue' })
  @IsNumber()
  @Min(0)
  annualRevenue!: number;
}

class FinancialInformationCompatDto {
  @ApiProperty({ description: 'Monthly revenue' })
  @IsNumber()
  @Min(0)
  monthlyRevenue!: number;

  @ApiProperty({ description: 'Monthly expenses' })
  @IsNumber()
  @Min(0)
  monthlyExpenses!: number;

  @ApiPropertyOptional({ description: 'Existing debts total' })
  @IsOptional()
  @IsNumber()
  existingDebts?: number;

  @ApiPropertyOptional({ description: 'Cash flow' })
  @IsOptional()
  @IsNumber()
  cashFlow?: number;

  @ApiPropertyOptional({ description: 'Total assets' })
  @IsOptional()
  @IsNumber()
  assets?: number;

  @ApiPropertyOptional({ description: 'Total liabilities' })
  @IsOptional()
  @IsNumber()
  liabilities?: number;
}

class CreditScoreCompatDto {
  @ApiProperty({ description: 'Credit score (1-100)' })
  @IsNumber()
  @Min(1)
  @Min(100)
  creditScore!: number;

  @ApiPropertyOptional({ description: 'Credit score calculated at' })
  @IsOptional()
  @IsDate()
  calculatedAt?: Date;

  @ApiPropertyOptional({ description: 'Credit score valid until' })
  @IsOptional()
  @IsDate()
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Model version' })
  @IsOptional()
  @IsString()
  modelVersion?: string;

  @ApiPropertyOptional({ description: 'Risk level (LOW, MEDIUM, HIGH)' })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel?: string;

  @ApiPropertyOptional({ description: 'Confidence score (0-1)' })
  @IsOptional()
  @IsNumber()
  confidenceScore?: number;

  @ApiPropertyOptional({ description: 'Score components' })
  @IsOptional()
  @IsObject()
  components?: {
    cashFlowQuality: number;
    businessStability: number;
    financialHealth: number;
    paymentBehavior: number;
    growthTrend: number;
  };

  @ApiPropertyOptional({ description: 'Score explanation' })
  @IsOptional()
  @IsString({ each: true })
  explanation?: string[];

  @ApiPropertyOptional({ description: 'Recommendations' })
  @IsOptional()
  @IsString({ each: true })
  recommendations?: string[];
}

/**
 * DTO pour synchroniser une demande de financement
 * de gestion_commerciale vers portfolio-institution
 */
export class SyncFinancingRequestDto {
  @ApiProperty({ description: 'Source request ID from gestion_commerciale' })
  @IsUUID()
  sourceRequestId!: string;

  @ApiProperty({ description: 'User ID (owner)' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Business/Company ID' })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Financing type', enum: FinancingTypeMapping })
  @IsEnum(FinancingTypeMapping)
  type!: FinancingTypeMapping;

  @ApiProperty({ description: 'Request amount' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  currency!: string;

  @ApiProperty({ description: 'Term in months' })
  @IsNumber()
  @Min(1)
  term!: number;

  @ApiProperty({ description: 'Financing purpose' })
  @IsString()
  purpose!: string;

  @ApiPropertyOptional({ description: 'Institution ID in portfolio-institution-service' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({ description: 'Portfolio ID in portfolio-institution-service' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiProperty({ description: 'Current status', enum: FinancingStatusMapping })
  @IsEnum(FinancingStatusMapping)
  status!: FinancingStatusMapping;

  @ApiProperty({ description: 'Business information' })
  @ValidateNested()
  @Type(() => BusinessInformationCompatDto)
  businessInformation!: BusinessInformationCompatDto;

  @ApiProperty({ description: 'Financial information' })
  @ValidateNested()
  @Type(() => FinancialInformationCompatDto)
  financialInformation!: FinancialInformationCompatDto;

  @ApiPropertyOptional({ description: 'Credit score information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditScoreCompatDto)
  creditScore?: CreditScoreCompatDto;

  @ApiPropertyOptional({ description: 'Application date' })
  @IsOptional()
  @IsDate()
  applicationDate?: Date;

  @ApiPropertyOptional({ description: 'Last status update date' })
  @IsOptional()
  @IsDate()
  lastStatusUpdateDate?: Date;

  @ApiPropertyOptional({ description: 'Approval date' })
  @IsOptional()
  @IsDate()
  approvalDate?: Date;

  @ApiPropertyOptional({ description: 'Disbursement date' })
  @IsOptional()
  @IsDate()
  disbursementDate?: Date;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO pour mapper une CreditRequest de portfolio-institution
 * vers FinancingRecord de gestion_commerciale
 */
export class CreditRequestToFinancingDto {
  @ApiProperty({ description: 'Credit request ID' })
  @IsUUID()
  creditRequestId!: string;

  @ApiProperty({ description: 'Member/Client ID' })
  @IsUUID()
  memberId!: string;

  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Request amount' })
  @IsNumber()
  requestAmount!: number;

  @ApiProperty({ description: 'Interest rate' })
  @IsNumber()
  interestRate!: number;

  @ApiProperty({ description: 'Financing purpose' })
  @IsString()
  financingPurpose!: string;

  @ApiProperty({ description: 'Number of schedules' })
  @IsNumber()
  schedulesCount!: number;

  @ApiProperty({ description: 'Periodicity' })
  @IsString()
  periodicity!: string;

  @ApiProperty({ description: 'Current status' })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ description: 'Portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Currency' })
  @IsOptional()
  @IsString()
  currency?: string;
}
