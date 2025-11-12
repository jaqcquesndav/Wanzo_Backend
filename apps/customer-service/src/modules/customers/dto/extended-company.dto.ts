import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString, ValidateNested, IsArray, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { 
  CoordinatesDto, 
  CurrencyType 
} from '../shared';
import { LegalFormOHADA, CompanyType } from '../entities/enterprise-identification-form.entity';

// CoordinatesDto maintenant importé de shared

// DTOs pour GeneralInfo
export class HeadquartersDto {
  @IsString()
  address!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  commune?: string;

  @IsString()
  province!: string;

  @IsString()
  country!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export class MainContactDto {
  @IsString()
  name!: string;

  @IsString()
  position!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  alternativePhone?: string;
}

export class DigitalPresenceDto {
  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  twitter?: string;
}

export class GeneralInfoDto {
  @IsString()
  companyName!: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsEnum(LegalFormOHADA)
  legalForm!: LegalFormOHADA;

  @IsEnum(CompanyType)
  companyType!: CompanyType;

  @IsString()
  sector!: string;

  @IsOptional()
  @IsDateString()
  foundingDate?: string;

  @ValidateNested()
  @Type(() => HeadquartersDto)
  headquarters!: HeadquartersDto;

  @ValidateNested()
  @Type(() => MainContactDto)
  mainContact!: MainContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DigitalPresenceDto)
  digitalPresence?: DigitalPresenceDto;
}

// DTOs pour LegalInfo
export class BusinessLicenseDto {
  @IsString()
  number!: string;

  @IsString()
  issuedBy!: string;

  @IsDateString()
  issuedDate!: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class OperatingLicenseDto {
  @IsString()
  type!: string;

  @IsString()
  number!: string;

  @IsString()
  issuedBy!: string;

  @IsDateString()
  issuedDate!: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class TaxComplianceDto {
  @IsBoolean()
  isUpToDate!: boolean;

  @IsOptional()
  @IsDateString()
  lastFilingDate?: string;

  @IsOptional()
  @IsDateString()
  nextFilingDue?: string;
}

export class LegalStatusDto {
  @IsBoolean()
  hasLegalIssues!: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issues?: string[];

  @IsBoolean()
  hasGovernmentContracts!: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contractTypes?: string[];
}

export class LegalInfoDto {
  @IsOptional()
  @IsString()
  rccm?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  employerNumber?: string;

  @IsOptional()
  @IsString()
  socialSecurityNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessLicenseDto)
  businessLicense?: BusinessLicenseDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingLicenseDto)
  operatingLicenses?: OperatingLicenseDto[];

  @ValidateNested()
  @Type(() => TaxComplianceDto)
  taxCompliance!: TaxComplianceDto;

  @ValidateNested()
  @Type(() => LegalStatusDto)
  legalStatus!: LegalStatusDto;
}

// DTOs pour PatrimonyAndMeans
export class ShareholderDto {
  @IsString()
  name!: string;

  @IsEnum(['individual', 'corporate'])
  type!: 'individual' | 'corporate';

  @IsNumber()
  sharePercentage!: number;

  @IsNumber()
  paidAmount!: number;
}

export class ShareCapitalDto {
  @IsNumber()
  authorizedCapital!: number;

  @IsNumber()
  paidUpCapital!: number;

  @IsEnum(CurrencyType)
  currency!: CurrencyType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShareholderDto)
  shareholders!: ShareholderDto[];
}

export class RealEstateDto {
  @IsEnum(['office', 'warehouse', 'factory', 'store', 'land'])
  type!: 'office' | 'warehouse' | 'factory' | 'store' | 'land';

  @IsString()
  address!: string;

  @IsNumber()
  surface!: number;

  @IsNumber()
  value!: number;

  @IsString()
  currency!: string;

  @IsBoolean()
  isOwned!: boolean;

  @IsOptional()
  @IsNumber()
  monthlyRent?: number;
}

export class EquipmentDto {
  @IsString()
  category!: string;

  @IsString()
  description!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitValue!: number;

  @IsNumber()
  totalValue!: number;

  @IsString()
  currency!: string;

  @IsDateString()
  acquisitionDate!: string;

  @IsEnum(['new', 'good', 'fair', 'poor'])
  condition!: 'new' | 'good' | 'fair' | 'poor';
}

export class VehicleDto {
  @IsEnum(['car', 'truck', 'motorcycle', 'other'])
  type!: 'car' | 'truck' | 'motorcycle' | 'other';

  @IsString()
  brand!: string;

  @IsString()
  model!: string;

  @IsNumber()
  year!: number;

  @IsNumber()
  value!: number;

  @IsString()
  currency!: string;

  @IsBoolean()
  isOwned!: boolean;
}

export class KeyPersonnelDto {
  @IsString()
  name!: string;

  @IsString()
  position!: string;

  @IsNumber()
  experience!: number;

  @IsString()
  education!: string;

  @IsBoolean()
  isShareholder!: boolean;
}

export class HumanResourcesDto {
  @IsNumber()
  totalEmployees!: number;

  @IsNumber()
  permanentEmployees!: number;

  @IsNumber()
  temporaryEmployees!: number;

  @IsNumber()
  consultants!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyPersonnelDto)
  keyPersonnel!: KeyPersonnelDto[];
}

export class PatrimonyAndMeansDto {
  @ValidateNested()
  @Type(() => ShareCapitalDto)
  shareCapital!: ShareCapitalDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RealEstateDto)
  realEstate?: RealEstateDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentDto)
  equipment?: EquipmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleDto)
  vehicles?: VehicleDto[];

  @ValidateNested()
  @Type(() => HumanResourcesDto)
  humanResources!: HumanResourcesDto;
}

// DTOs pour Specificities
export class InvestorDto {
  @IsString()
  name!: string;

  @IsEnum(['angel', 'vc', 'accelerator', 'family_office', 'other'])
  type!: 'angel' | 'vc' | 'accelerator' | 'family_office' | 'other';

  @IsNumber()
  amount!: number;

  @IsDateString()
  date!: string;
}

export class FundraisingDto {
  @IsBoolean()
  hasRaised!: boolean;

  @IsOptional()
  @IsNumber()
  totalRaised?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvestorDto)
  investors?: InvestorDto[];
}

export class IntellectualPropertyDto {
  @IsEnum(['patent', 'trademark', 'copyright', 'trade_secret'])
  type!: 'patent' | 'trademark' | 'copyright' | 'trade_secret';

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsEnum(['pending', 'registered', 'expired'])
  status!: 'pending' | 'registered' | 'expired';
}

export class ResearchPartnershipDto {
  @IsString()
  institution!: string;

  @IsEnum(['university', 'research_center', 'corporate_lab'])
  type!: 'university' | 'research_center' | 'corporate_lab';

  @IsString()
  projectTitle!: string;
}

export class InnovationDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntellectualPropertyDto)
  intellectualProperty?: IntellectualPropertyDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologyStack?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResearchPartnershipDto)
  researchPartnership?: ResearchPartnershipDto[];
}

export class StartupSpecificitiesDto {
  @IsEnum(['idea', 'prototype', 'mvp', 'early_revenue', 'growth', 'expansion'])
  stage!: 'idea' | 'prototype' | 'mvp' | 'early_revenue' | 'growth' | 'expansion';

  @ValidateNested()
  @Type(() => FundraisingDto)
  fundraising!: FundraisingDto;

  @ValidateNested()
  @Type(() => InnovationDto)
  innovation!: InnovationDto;
}

// DTOs pour Traditional Specificities
export class MilestoneDto {
  @IsNumber()
  year!: number;

  @IsString()
  milestone!: string;

  @IsString()
  impact!: string;
}

export class OperatingHistoryDto {
  @IsNumber()
  yearsInBusiness!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  majorMilestones!: MilestoneDto[];
}

export class MarketPositionDto {
  @IsOptional()
  @IsNumber()
  marketShare?: number;

  @IsOptional()
  @IsString()
  competitorAnalysis?: string;

  @IsArray()
  @IsString({ each: true })
  competitiveAdvantages!: string[];
}

export class SupplierDto {
  @IsString()
  name!: string;

  @IsEnum(['exclusive', 'preferred', 'regular'])
  relationship!: 'exclusive' | 'preferred' | 'regular';

  @IsNumber()
  yearsOfRelationship!: number;

  @IsBoolean()
  isLocal!: boolean;
}

export class CustomerBaseDto {
  @IsNumber()
  totalCustomers!: number;

  @IsNumber()
  repeatCustomerRate!: number;

  @IsNumber()
  averageCustomerValue!: number;

  @IsArray()
  @IsEnum(['b2b', 'b2c', 'government'], { each: true })
  customerTypes!: ('b2b' | 'b2c' | 'government')[];
}

export class TraditionalSpecificitiesDto {
  @ValidateNested()
  @Type(() => OperatingHistoryDto)
  operatingHistory!: OperatingHistoryDto;

  @ValidateNested()
  @Type(() => MarketPositionDto)
  marketPosition!: MarketPositionDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierDto)
  supplierNetwork!: SupplierDto[];

  @ValidateNested()
  @Type(() => CustomerBaseDto)
  customerBase!: CustomerBaseDto;
}

export class SpecificitiesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => StartupSpecificitiesDto)
  startup?: StartupSpecificitiesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TraditionalSpecificitiesDto)
  traditional?: TraditionalSpecificitiesDto;
}

// DTOs pour Performance
export class RevenueDto {
  @IsNumber()
  year!: number;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsBoolean()
  isProjected!: boolean;
}

export class ProfitabilityDto {
  @IsNumber()
  year!: number;

  @IsNumber()
  grossProfit!: number;

  @IsNumber()
  netProfit!: number;

  @IsString()
  currency!: string;

  @ValidateNested()
  margins!: {
    gross: number;
    net: number;
  };
}

export class MonthlyCashFlowDto {
  @IsString()
  month!: string;

  @IsNumber()
  inflow!: number;

  @IsNumber()
  outflow!: number;

  @IsNumber()
  netFlow!: number;
}

export class CashFlowDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MonthlyCashFlowDto)
  monthly!: MonthlyCashFlowDto[];
}

export class PreviousApplicationDto {
  @IsString()
  institution!: string;

  @IsNumber()
  amount!: number;

  @IsEnum(['approved', 'rejected', 'pending'])
  result!: 'approved' | 'rejected' | 'pending';

  @IsDateString()
  date!: string;
}

export class FinancingNeedsDto {
  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsArray()
  @IsString({ each: true })
  purpose!: string[];

  @IsString()
  timeframe!: string;

  @IsBoolean()
  hasAppliedBefore!: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviousApplicationDto)
  previousApplications?: PreviousApplicationDto[];
}

export class FinancialPerformanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevenueDto)
  revenue!: RevenueDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfitabilityDto)
  profitability!: ProfitabilityDto[];

  @ValidateNested()
  @Type(() => CashFlowDto)
  cashFlow!: CashFlowDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancingNeedsDto)
  financingNeeds?: FinancingNeedsDto;
}

// DTOs pour Performance (suite)
export class ProductivityDto {
  @IsOptional()
  @IsNumber()
  outputPerEmployee?: number;

  @IsOptional()
  @IsNumber()
  revenuePerEmployee?: number;

  @IsOptional()
  @IsNumber()
  utilizationRate?: number;
}

export class QualityDto {
  @IsOptional()
  @IsNumber()
  defectRate?: number;

  @IsOptional()
  @IsNumber()
  customerSatisfaction?: number;

  @IsOptional()
  @IsNumber()
  returnRate?: number;
}

export class EfficiencyDto {
  @IsOptional()
  @IsNumber()
  orderFulfillmentTime?: number;

  @IsOptional()
  @IsNumber()
  inventoryTurnover?: number;

  @IsOptional()
  @IsNumber()
  costPerUnit?: number;
}

export class OperationalPerformanceDto {
  @ValidateNested()
  @Type(() => ProductivityDto)
  productivity!: ProductivityDto;

  @ValidateNested()
  @Type(() => QualityDto)
  quality!: QualityDto;

  @ValidateNested()
  @Type(() => EfficiencyDto)
  efficiency!: EfficiencyDto;
}

export class GrowthDto {
  @IsNumber()
  customerGrowthRate!: number;

  @IsArray()
  @IsString({ each: true })
  marketExpansion!: string[];

  @IsNumber()
  newProductsLaunched!: number;
}

export class OnlinePresenceDto {
  @IsBoolean()
  website!: boolean;

  @IsBoolean()
  ecommerce!: boolean;

  @IsArray()
  @IsString({ each: true })
  socialMedia!: string[];
}

export class DigitalDto {
  @ValidateNested()
  @Type(() => OnlinePresenceDto)
  onlinePresence!: OnlinePresenceDto;

  @IsOptional()
  @IsNumber()
  digitalSales?: number;
}

export class MarketPerformanceDto {
  @ValidateNested()
  @Type(() => GrowthDto)
  growth!: GrowthDto;

  @ValidateNested()
  @Type(() => DigitalDto)
  digital!: DigitalDto;
}

export class PerformanceDto {
  @ValidateNested()
  @Type(() => FinancialPerformanceDto)
  financial!: FinancialPerformanceDto;

  @ValidateNested()
  @Type(() => OperationalPerformanceDto)
  operational!: OperationalPerformanceDto;

  @ValidateNested()
  @Type(() => MarketPerformanceDto)
  market!: MarketPerformanceDto;
}

// DTO principal pour créer/mettre à jour le formulaire d'identification étendu
export class CreateExtendedIdentificationDto {
  @ValidateNested()
  @Type(() => GeneralInfoDto)
  generalInfo!: GeneralInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LegalInfoDto)
  legalInfo?: LegalInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatrimonyAndMeansDto)
  patrimonyAndMeans?: PatrimonyAndMeansDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpecificitiesDto)
  specificities?: SpecificitiesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PerformanceDto)
  performance?: PerformanceDto;
}

export class UpdateExtendedIdentificationDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneralInfoDto)
  generalInfo?: GeneralInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LegalInfoDto)
  legalInfo?: LegalInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatrimonyAndMeansDto)
  patrimonyAndMeans?: PatrimonyAndMeansDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpecificitiesDto)
  specificities?: SpecificitiesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PerformanceDto)
  performance?: PerformanceDto;
}

// DTOs de réponse
export class CompletionStatusDto {
  overallCompletion!: number;
  generalInfo!: boolean;
  legalInfo!: boolean;
  patrimonyAndMeans!: boolean;
  specificities!: boolean;
  performance!: boolean;
}

export class ExtendedCompanyResponseDto {
  id!: string;
  customerId!: string;
  generalInfo!: GeneralInfoDto;
  legalInfo?: LegalInfoDto;
  patrimonyAndMeans?: PatrimonyAndMeansDto;
  specificities?: SpecificitiesDto;
  performance?: PerformanceDto;
  completionPercentage!: number;
  completionStatus!: CompletionStatusDto;
  createdAt!: string;
  updatedAt!: string;
}

export class ValidationResultDto {
  isValid!: boolean;
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
}