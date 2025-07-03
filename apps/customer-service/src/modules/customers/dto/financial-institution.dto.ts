import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, IsBoolean, IsArray, IsObject, IsUrl, IsNumber, ValidateNested, IsDate, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { InstitutionType, InstitutionCategory } from '../entities/financial-institution-specific-data.entity';

export class HeadquartersAddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  commune?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class AddressDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HeadquartersAddressDto)
  headquarters?: HeadquartersAddressDto;
}

export class CoordinatesDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

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
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactsDto)
  contacts?: ContactsDto;

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
  website?: string;
  facebookPage?: string;
  linkedinPage?: string;
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
    currentPeriodEnd?: Date;
  };
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
}

export class ApiResponseDto<T> {
  success!: boolean;
  data!: T;
  meta?: Record<string, any>;
}

export class ApiErrorResponseDto {
  success!: boolean;
  error!: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export class PaginationDto {
  page!: number;
  limit!: number;
  total!: number;
  pages!: number;
}
