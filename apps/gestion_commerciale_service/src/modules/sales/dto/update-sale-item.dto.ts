import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, Min, IsPositive, IsOptional } from 'class-validator';

/**
 * DTO pour la mise à jour d'un article de vente
 * Basé sur la documentation API (API_DOCUMENTATION/Sales/README.md)
 * 
 * Note: Nous n'étendons pas de PartialType(CreateSaleItemDto) pour éviter
 * les problèmes de compatibilité de types entre les DTOs
 */
export class UpdateSaleItemDto {
  @ApiProperty({
    description: 'Identifiant unique de l\'article de vente (obligatoire pour articles existants)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
    required: false
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Identifiant unique du produit (obligatoire pour nouveaux articles)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
    required: false
  })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiProperty({
    description: 'Nom du produit (obligatoire pour nouveaux articles)',
    example: 'Stylo à bille bleu',
    required: false
  })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiProperty({
    description: 'Quantité du produit vendu (obligatoire pour nouveaux articles)',
    example: 2,
    minimum: 1,
    required: false
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Prix unitaire au moment de la vente (obligatoire pour nouveaux articles)',
    example: 750.00,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

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
    description: 'Code de la devise',
    example: 'USD',
    required: false
  })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiProperty({
    description: 'Taux de taxe en pourcentage',
    example: 16.00,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiProperty({
    description: 'Notes sur l\'article',
    example: 'Couleur spéciale commandée',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
