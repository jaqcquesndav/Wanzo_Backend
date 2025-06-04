import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsUUID, IsUrl, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Identifiant de la catégorie du produit',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false
  })
  @IsString() // Assuming categoryId is a string (e.g., UUID or ObjectId)
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Identifiant de l\'unité de mesure du produit',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    required: false
  })
  @IsString() // Assuming unitId is a string
  @IsOptional()
  unitId?: string;

  @ApiProperty({
    description: 'Prix d\'achat du produit',
    example: 500.00,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({
    description: 'Prix de vente du produit',
    example: 750.00,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiProperty({
    description: 'Quantité en stock',
    example: 100,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  quantityInStock: number;
  @ApiProperty({
    description: 'Niveau de réapprovisionnement',
    example: 10,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @ApiProperty({
    description: 'Identifiant du fournisseur',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    required: false
  })
  @IsString() // Assuming supplierId is a string
  @IsOptional()
  supplierId?: string;

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
}
