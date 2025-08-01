import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsUUID, IsUrl, ValidateNested, IsArray, ArrayMinSize, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../enums/product-category.enum';
import { MeasurementUnit } from '../enums/measurement-unit.enum';

export class AttributeDto {
  @ApiProperty({
    description: 'Nom de l\'attribut',
    example: 'Couleur',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Valeur de l\'attribut',
    example: 'Rouge',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Nom du produit',
    example: 'Smartphone XYZ',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description détaillée du produit',
    example: 'Smartphone haut de gamme avec écran OLED 6.5 pouces',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Numéro de référence unique du produit (Stock Keeping Unit)',
    example: 'PROD-12345',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: 'Code-barres du produit',
    example: '5901234123457',
    required: false
  })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({
    description: 'Catégorie du produit',
    example: 'food',
    enum: ProductCategory,
    required: true
  })
  @IsEnum(ProductCategory)
  @IsNotEmpty()
  category: ProductCategory;

  @ApiProperty({
    description: 'Unité de mesure du produit',
    example: 'piece',
    enum: MeasurementUnit,
    required: true
  })
  @IsEnum(MeasurementUnit)
  @IsNotEmpty()
  unit: MeasurementUnit;

  @ApiProperty({
    description: 'Prix d\'achat en Francs Congolais',
    example: 500.00,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  costPriceInCdf: number;

  @ApiProperty({
    description: 'Prix de vente en Francs Congolais',
    example: 750.00,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  sellingPriceInCdf: number;

  @ApiProperty({
    description: 'Quantité en stock',
    example: 100.0,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  stockQuantity: number;
  @ApiProperty({
    description: 'Niveau d\'alerte de stock bas',
    example: 10.0,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  alertThreshold?: number;

  @ApiProperty({
    description: 'IDs des fournisseurs',
    example: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'],
    type: [String],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supplierIds?: string[];

  @ApiProperty({
    description: 'URL de l\'image du produit',
    example: 'https://example.com/images/product123.jpg',
    required: false
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'Liste des attributs spécifiques du produit',
    example: [{ name: 'Couleur', value: 'Rouge' }, { name: 'Taille', value: 'M' }],
    required: false,
    type: [AttributeDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  @IsOptional()
  attributes?: AttributeDto[];
  
  @ApiProperty({
    description: 'Tags pour le produit',
    example: ['promotion', 'nouveauté'],
    type: [String],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
  
  @ApiProperty({
    description: 'Taux de taxe en pourcentage',
    example: 16.0,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;
}
