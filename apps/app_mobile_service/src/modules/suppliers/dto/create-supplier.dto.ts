import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, Min, IsDateString, IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SupplierCategory } from '../entities/supplier.entity';

export class CreateSupplierDto {
  @ApiProperty({
    description: 'Nom du fournisseur',
    example: 'Acme Supplies Corp',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Nom de la personne de contact',
    example: 'Jean Dupont',
    required: false
  })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiProperty({
    description: 'Adresse email du fournisseur',
    example: 'contact@acme-supplies.com',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Numéro de téléphone du fournisseur',
    example: '+33123456789',
    required: false
  })
  @IsOptional()
  @IsPhoneNumber(undefined) // Specify region or leave undefined for general validation
  phoneNumber?: string;

  @ApiProperty({
    description: 'Adresse postale du fournisseur',
    example: '123 Rue de Commerce, 75001 Paris, France',
    required: false
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Catégorie du fournisseur',
    enum: SupplierCategory,
    example: SupplierCategory.REGULAR,
    default: SupplierCategory.REGULAR,
    required: false
  })
  @IsOptional()
  @IsEnum(SupplierCategory)
  category?: SupplierCategory;

  @ApiProperty({
    description: 'Montant total des achats effectués auprès de ce fournisseur',
    example: 5000.50,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPurchases?: number;

  @ApiProperty({
    description: 'Date du dernier achat effectué auprès de ce fournisseur',
    example: '2023-06-15T14:30:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  lastPurchaseDate?: string;
}
