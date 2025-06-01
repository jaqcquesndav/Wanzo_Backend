import { IsString, IsOptional, IsEmail, IsUrl, IsObject, IsISO8601, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;
}

export class CompanyProfileDto {
  id: string;
  name: string;
  registrationNumber: string;
  taxId: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactEmail: string;
  phoneNumber: string;
  website: string;
  logoUrl: string;
  industry: string;
  foundedDate: string;
  description: string;
  updatedAt: Date;
  createdAt: Date;
}

export class UpdateCompanyProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsISO8601()
  @IsOptional()
  foundedDate?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CompanyProfileResponseDto {
  data: CompanyProfileDto;
}

export class CompanyUpdateResponseDto {
  data: CompanyProfileDto;
  message: string;
}
