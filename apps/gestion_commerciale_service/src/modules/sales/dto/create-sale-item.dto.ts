import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleItemDto {
  @ApiProperty({
    description: 'Identifiant unique du produit',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
    required: true
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Nom du produit',
    example: 'Stylo à bille bleu',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({
    description: 'Quantité du produit vendu',
    example: 2,
    minimum: 1,
    required: true
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Prix unitaire au moment de la vente',
    example: 750.00,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    description: 'Remise appliquée sur l\'article',
    example: 50.00,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({
    description: 'Code de la devise (optionnel)',
    example: 'USD',
    required: false
  })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiProperty({
    description: 'Taux de taxe en pourcentage (optionnel)',
    example: 16.00,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiProperty({
    description: 'Notes sur l\'article (optionnel)',
    example: 'Couleur spéciale commandée',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
