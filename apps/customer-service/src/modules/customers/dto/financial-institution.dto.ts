import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, IsBoolean, IsArray, IsObject, IsUrl, IsNumber, ValidateNested, IsDate, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { 
  AddressDto, 
  CoordinatesDto, 
  LocationDto, 
  BaseContactDto, 
  ApiResponseDto, 
  ApiErrorResponseDto, 
  PaginationDto,
  InstitutionType, 
  InstitutionCategory,
  CurrencyType,
  RegulatoryStatus
} from '../shared';

// HeadquartersAddressDto - spécialisé pour les institutions financières
export class HeadquartersAddressDto extends AddressDto {}

// AddressDto et CoordinatesDto maintenant importés de shared

export class BranchDto {
  @IsString()
  name!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => HeadquartersAddressDto)
  address?: HeadquartersAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @IsOptional()
  @IsString()
  manager?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  openingHours?: string;
}

export class GeneralContactDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CustomerServiceContactDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;
}

export class InvestorRelationsContactDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ContactsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneralContactDto)
  general?: GeneralContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerServiceContactDto)
  customerService?: CustomerServiceContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvestorRelationsContactDto)
  investorRelations?: InvestorRelationsContactDto;
}

export class CeoDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;
}

export class ExecutiveTeamMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class BoardMemberDto {
  @IsString()
  name!: string;

  @IsString()
  position!: string;

  @IsOptional()
  @IsString()
  organization?: string;
}

export class LeadershipDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CeoDto)
  ceo?: CeoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExecutiveTeamMemberDto)
  executiveTeam?: ExecutiveTeamMemberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoardMemberDto)
  boardMembers?: BoardMemberDto[];
}

export class ServicesDto {
  @IsOptional()
  @IsArray()
  personalBanking?: string[];

  @IsOptional()
  @IsArray()
  businessBanking?: string[];

  @IsOptional()
  @IsArray()
  specializedServices?: string[];
}

export class RegulatoryComplianceDto {
  @IsOptional()
  @IsBoolean()
  bcc?: boolean;

  @IsOptional()
  @IsBoolean()
  fatca?: boolean;

  @IsOptional()
  @IsBoolean()
  aml?: boolean;
}

export class FinancialInfoDto {
  @IsOptional()
  @IsNumber()
  assets?: number;

  @IsOptional()
  @IsNumber()
  capital?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  yearFounded?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegulatoryComplianceDto)
  regulatoryCompliance?: RegulatoryComplianceDto;
}

export class CreditRatingDto {
  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsString()
  outlook?: string;

  @IsOptional()
  @IsISO8601()
  lastUpdated?: string;
}

export class AppLinksDto {
  @IsOptional()
  @IsUrl()
  android?: string;

  @IsOptional()
  @IsUrl()
  ios?: string;
}

export class DigitalPresenceDto {
  @IsOptional()
  @IsBoolean()
  hasMobileBanking?: boolean;

  @IsOptional()
  @IsBoolean()
  hasInternetBanking?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppLinksDto)
  appLinks?: AppLinksDto;
}

export class BrandColorsDto {
  @IsOptional()
  @IsString()
  primary?: string;

  @IsOptional()
  @IsString()
  secondary?: string;

  @IsOptional()
  @IsString()
  accent?: string;

  @IsOptional()
  @IsString()
  background?: string;

  @IsOptional()
  @IsString()
  text?: string;
}

export class CreateFinancialInstitutionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(InstitutionType)
  type?: InstitutionType;

  @IsOptional()
  @IsEnum(InstitutionCategory)
  category?: InstitutionCategory;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsISO8601()
  establishedDate?: string;

  @IsOptional()
  @IsEnum(RegulatoryStatus)
  regulatoryStatus?: RegulatoryStatus;

  @IsOptional()
  @IsISO8601()
  licenseExpiryDate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BrandColorsDto)
  brandColors?: BrandColorsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactsDto)
  contacts?: ContactsDto;

  // NOUVEAUX CHAMPS v2.1 - Conformité documentation
  @IsOptional()
  @IsString()
  denominationSociale?: string;

  @IsOptional()
  @IsString()
  sigleLegalAbrege?: string;

  @IsOptional()
  @IsString()
  typeInstitution?: string;

  @IsOptional()
  @IsString()
  autorisationExploitation?: string;

  @IsOptional()
  @IsISO8601()
  dateOctroi?: string;

  @IsOptional()
  @IsString()
  autoriteSupervision?: string;

  @IsOptional()
  @IsISO8601()
  dateAgrement?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordonneesGeographiques?: CoordinatesDto;

  @IsOptional()
  @IsObject()
  capaciteFinanciere?: {
    capitalSocial?: number;
    fondsPropresDeclares?: number;
    limitesOperationnelles?: string[];
    monnaieReference?: CurrencyType;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  zonesCouverture?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  typeOperation?: string[];

  @IsOptional()
  @IsEnum(['actif', 'suspendu', 'en_arret', 'liquidation'])
  statutOperationnel?: 'actif' | 'suspendu' | 'en_arret' | 'liquidation';

  @IsOptional()
  @ValidateNested()
  @Type(() => LeadershipDto)
  leadership?: LeadershipDto;
}

export class UpdateFinancialInstitutionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  facebookPage?: string;

  @IsOptional()
  @IsUrl()
  linkedinPage?: string;

  @IsOptional()
  @IsEnum(RegulatoryStatus)
  regulatoryStatus?: RegulatoryStatus;

  @IsOptional()
  @IsISO8601()
  licenseExpiryDate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BrandColorsDto)
  brandColors?: BrandColorsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LeadershipDto)
  leadership?: LeadershipDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ServicesDto)
  services?: ServicesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialInfoDto)
  financialInfo?: FinancialInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditRatingDto)
  creditRating?: CreditRatingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DigitalPresenceDto)
  digitalPresence?: DigitalPresenceDto;
}

export class FinancialInstitutionResponseDto {
  id!: string;
  name!: string;
  logo?: string;
  description?: string;
  type?: string;
  category?: string;
  licenseNumber?: string;
  establishedDate?: Date;
  regulatoryStatus?: RegulatoryStatus;
  licenseExpiryDate?: Date;
  brandColors?: BrandColorsDto;
  website?: string;
  facebookPage?: string;
  linkedinPage?: string;
  
  // NOUVEAUX CHAMPS v2.1 - Conformité documentation
  denominationSociale?: string;
  sigleLegalAbrege?: string;
  typeInstitution?: string;
  autorisationExploitation?: string;
  dateOctroi?: Date;
  autoriteSupervision?: string;
  dateAgrement?: Date;
  coordonneesGeographiques?: CoordinatesDto;
  capaciteFinanciere?: {
    capitalSocial?: number;
    fondsPropresDeclares?: number;
    limitesOperationnelles?: string[];
    monnaieReference?: CurrencyType;
  };
  zonesCouverture?: string[];
  typeOperation?: string[];
  statutOperationnel?: 'actif' | 'suspendu' | 'en_arret' | 'liquidation';
  address?: AddressDto;
  branches?: BranchDto[];
  contacts?: ContactsDto;
  leadership?: LeadershipDto;
  services?: ServicesDto;
  financialInfo?: FinancialInfoDto;
  creditRating?: CreditRatingDto;
  digitalPresence?: DigitalPresenceDto;
  subscription?: {
    plan?: {
      name?: string;
    };
    status?: string;
    endDate?: Date;
  };
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
}

// ApiResponseDto, ApiErrorResponseDto et PaginationDto maintenant importés de shared
