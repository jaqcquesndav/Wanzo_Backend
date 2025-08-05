import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsNumber, Min, ValidateNested, IsArray, ArrayMinSize, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateSaleItemDto } from './update-sale-item.dto';
import { SaleStatus } from '../entities/sale.entity';

/**
 * DTO pour la mise à jour d'une vente
 * Basé sur la documentation API (API_DOCUMENTATION/Sales/README.md)
 * 
 * Note: Nous n'utilisons pas PartialType(CreateSaleDto) car cela crée des
 * incompatibilités de type avec UpdateSaleItemDto
 */
export class UpdateSaleDto {
  @ApiProperty({
    description: 'Date de la vente',
    example: '2023-08-01T12:30:00.000Z',
    format: 'date-time',
    required: false
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({
    description: 'Date d\'échéance',
    example: '2023-08-15T12:30:00.000Z',
    format: 'date-time',
    required: false
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({
    description: 'Identifiant du client',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
    required: false
  })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: 'Nom du client',
    example: 'Jean Dupont',
    required: false
  })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({
    description: 'Articles de la vente à mettre à jour',
    type: [UpdateSaleItemDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => UpdateSaleItemDto)
  items?: UpdateSaleItemDto[];

  @ApiProperty({
    description: 'Méthode de paiement',
    example: 'cash',
    required: false
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({
    description: 'Référence de paiement',
    example: 'TRANS-123456',
    required: false
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiProperty({
    description: 'Notes sur la vente',
    example: 'Livraison à domicile prévue',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Taux de change',
    example: 2000.00,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  exchangeRate?: number;
  
  @ApiProperty({
    description: 'Statut de la vente',
    enum: SaleStatus,
    example: 'completed',
    required: false
  })
  @IsString()
  @IsOptional()
  status?: SaleStatus;

  @ApiProperty({
    description: 'Montant payé en francs congolais',
    example: 50000.00,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amountPaidInCdf?: number;
}
