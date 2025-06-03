import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, Min, IsDateString, IsNotEmpty, IsPhoneNumber, IsUrl } from 'class-validator';
import { SupplierCategory } from '../entities/supplier.entity';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsPhoneNumber(undefined) // Specify region or leave undefined for general validation
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(SupplierCategory)
  category?: SupplierCategory;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  businessSector?: string;

  // totalPurchases will be managed by the system, not set on creation
  // lastPurchaseDate will be managed by the system
}
