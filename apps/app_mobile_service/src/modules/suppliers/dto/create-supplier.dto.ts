import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, Min, IsDateString, IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { SupplierCategory } from '../entities/supplier.entity';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
  @IsNumber()
  @Min(0)
  totalPurchases?: number;

  @IsOptional()
  @IsDateString()
  lastPurchaseDate?: string;
}
