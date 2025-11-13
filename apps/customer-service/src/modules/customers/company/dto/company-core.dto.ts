import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, IsBoolean, IsArray, IsObject, IsUrl, IsNumber, ValidateNested, IsDate, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { 
  AddressDto, 
  CoordinatesDto, 
  LocationDto, 
  BaseContactDto,
  ApiResponseDto, 
  ApiErrorResponseDto, 
  PaginationDto,
  CustomerType, 
  CustomerStatus, 
  AccountType,
  CurrencyType
} from '../../shared';

/**
 * DTO de base pour les contacts d'une entreprise
 */
export class ContactsDto extends BaseContactDto {}

/**
 * DTO pour les informations du propriétaire
 */
export class OwnerDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  shareholding?: number;

  @IsBoolean()
  isMainOwner!: boolean;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

/**
 * DTO pour les associés de l'entreprise
 */
export class AssociateDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  position!: string;

  @IsNumber()
  shareholding!: number;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsEnum(['founder', 'investor', 'partner', 'employee'])
  type!: 'founder' | 'investor' | 'partner' | 'employee';

  @IsOptional()
  @IsString()
  joinDate?: string;
}

/**
 * DTO pour les activités de l'entreprise
 */
export class ActivitiesDto {
  @IsString()
  primaryActivity!: string;

  @IsArray()
  @IsString({ each: true })
  secondaryActivities!: string[];

  @IsOptional()
  @IsString()
  sector?: string;
}

/**
 * DTO pour les activités étendues
 */
export class ActivitiesExtendedDto {
  @IsString()
  primaryActivity!: string;

  @IsArray()
  @IsString({ each: true })
  secondaryActivities!: string[];

  @IsString()
  sector!: string;

  @IsOptional()
  @IsString()
  subsector?: string;

  @IsOptional()
  @IsString()
  businessModel?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetMarkets?: string[];
}

/**
 * DTO pour le capital de l'entreprise
 */
export class CapitalDto {
  @IsNumber()
  amount!: number;

  @IsEnum(CurrencyType)
  currency!: CurrencyType;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  paidUp?: number;
}

/**
 * DTO pour les données financières
 */
export class FinancialsDto {
  @IsOptional()
  @IsNumber()
  annualRevenue?: number;

  @IsOptional()
  @IsNumber()
  monthlyRevenue?: number;

  @IsOptional()
  @IsEnum(CurrencyType)
  currency?: CurrencyType;

  @IsOptional()
  @IsNumber()
  employees?: number;

  @IsOptional()
  @IsString()
  foundingDate?: string;
}

/**
 * DTO pour les affiliations
 */
export class AffiliationsDto {
  @IsOptional()
  @IsArray()
  organizations?: {
    name: string;
    type: string;
    membershipDate?: string;
    status?: string;
  }[];

  @IsOptional()
  @IsArray()
  certifications?: {
    name: string;
    authority: string;
    date?: string;
    expiryDate?: string;
  }[];

  @IsOptional()
  @IsArray()
  partnerships?: {
    partner: string;
    type: string;
    startDate?: string;
    status?: string;
  }[];
}

/**
 * DTO principal pour créer une entreprise
 */
export class CreateCompanyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CustomerType)
  type!: CustomerType;

  @IsEnum(CustomerStatus)
  status!: CustomerStatus;

  @ValidateNested()
  @Type(() => ContactsDto)
  contacts!: ContactsDto;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ValidateNested()
  @Type(() => OwnerDto)
  owner!: OwnerDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssociateDto)
  associates?: AssociateDto[];

  @ValidateNested()
  @Type(() => ActivitiesDto)
  activities!: ActivitiesDto;

  @ValidateNested()
  @Type(() => CapitalDto)
  capital!: CapitalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialsDto)
  financials?: FinancialsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AffiliationsDto)
  affiliations?: AffiliationsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  locations?: LocationDto[];

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @IsOptional()
  @IsObject()
  metadata?: any;
}

/**
 * DTO pour mettre à jour une entreprise
 */
export class UpdateCompanyDto {
  @ApiProperty({ description: 'ID de l\'entreprise à mettre à jour' })
  @IsString()
  @IsUUID()
  companyId!: string;

  @ApiProperty({ description: 'Nouvelles données de l\'entreprise' })
  company!: Partial<CreateCompanyDto>;
}

/**
 * DTO de réponse pour une entreprise
 */
export class CompanyResponseDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CustomerType)
  type!: CustomerType;

  @IsEnum(CustomerStatus)
  status!: CustomerStatus;

  @IsOptional()
  customer?: any;

  @ValidateNested()
  @Type(() => ContactsDto)
  contacts!: ContactsDto;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ValidateNested()
  @Type(() => OwnerDto)
  owner!: OwnerDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssociateDto)
  associates?: AssociateDto[];

  @ValidateNested()
  @Type(() => ActivitiesExtendedDto)
  activities!: ActivitiesExtendedDto;

  @ValidateNested()
  @Type(() => CapitalDto)
  capital!: CapitalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialsDto)
  financials?: FinancialsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AffiliationsDto)
  affiliations?: AffiliationsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  locations?: LocationDto[];

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsObject()
  subscription?: {
    plan?: {
      name?: string;
    };
    status?: string;
    currentPeriodEnd?: Date;
  };

  @IsDate()
  createdAt!: Date;

  @IsDate()
  updatedAt!: Date;

  @IsOptional()
  @IsString()
  createdBy?: string;
}