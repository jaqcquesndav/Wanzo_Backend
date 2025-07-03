import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, IsBoolean, IsArray, IsObject, IsUrl, IsNumber, ValidateNested, IsDate, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType, CustomerStatus, AccountType } from '../entities/customer.entity';

export class AddressDto {
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

export class ContactsDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  altPhone?: string;
}

export class OwnerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  hasOtherJob?: boolean;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  facebook?: string;
}

export class AssociateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsNumber()
  shares?: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CoordinatesDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

export class LocationDto {
  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export class ActivitiesDto {
  @IsOptional()
  @IsString()
  primary?: string;

  @IsOptional()
  @IsArray()
  secondary?: string[];
}

export class CapitalDto {
  @IsOptional()
  @IsBoolean()
  isApplicable?: boolean;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class FinancialsDto {
  @IsOptional()
  @IsNumber()
  revenue?: number;

  @IsOptional()
  @IsNumber()
  netIncome?: number;

  @IsOptional()
  @IsNumber()
  totalAssets?: number;

  @IsOptional()
  @IsNumber()
  equity?: number;
}

export class AffiliationsDto {
  @IsOptional()
  @IsString()
  cnss?: string;

  @IsOptional()
  @IsString()
  inpp?: string;

  @IsOptional()
  @IsString()
  onem?: string;

  @IsOptional()
  @IsString()
  intraCoop?: string;

  @IsOptional()
  @IsString()
  interCoop?: string;

  @IsOptional()
  @IsArray()
  partners?: string[];
}

export class CreateCompanyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  legalForm?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  size?: string;

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
  @Type(() => OwnerDto)
  owner?: OwnerDto;
}

export class UpdateCompanyDto {
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
  @IsString()
  rccm?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssociateDto)
  associates?: AssociateDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ActivitiesDto)
  activities?: ActivitiesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CapitalDto)
  capital?: CapitalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialsDto)
  financials?: FinancialsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AffiliationsDto)
  affiliations?: AffiliationsDto;
}

export class CompanyResponseDto {
  id!: string;
  name!: string;
  logo?: string;
  description?: string;
  legalForm?: string;
  industry?: string;
  size?: string;
  website?: string;
  facebookPage?: string;
  rccm?: string;
  taxId?: string;
  natId?: string;
  address?: AddressDto;
  locations?: LocationDto[];
  contacts?: ContactsDto;
  owner?: OwnerDto;
  associates?: AssociateDto[];
  activities?: ActivitiesDto;
  capital?: CapitalDto;
  financials?: FinancialsDto;
  affiliations?: AffiliationsDto;
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
