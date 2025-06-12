import { IsOptional, IsString, IsEmail, IsUrl, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountingMode } from '../entities/organization.entity';

class ProductDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  category!: string;
}

class ServiceDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  category!: string;
}

class ProductsAndServicesDto {
  @ApiProperty({ type: [ProductDto] })
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products!: ProductDto[];

  @ApiProperty({ type: [ServiceDto] })
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services!: ServiceDto[];
}

class BusinessHoursDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  monday?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tuesday?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wednesday?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thursday?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  friday?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  saturday?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sunday?: string;
}

class SocialMediaDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  twitter?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instagram?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  legalForm?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  capital?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: AccountingMode })
  @IsString()
  @IsOptional()
  accountingMode?: AccountingMode;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: ProductsAndServicesDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ProductsAndServicesDto)
  @IsOptional()
  productsAndServices?: ProductsAndServicesDto;

  @ApiPropertyOptional({ type: BusinessHoursDto })
  @IsObject()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  @IsOptional()
  businessHours?: BusinessHoursDto;

  @ApiPropertyOptional({ type: SocialMediaDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  @IsOptional()
  socialMedia?: SocialMediaDto;
}
