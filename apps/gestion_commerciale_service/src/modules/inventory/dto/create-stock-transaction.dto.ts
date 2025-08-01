import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsDate, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StockTransactionType } from '../enums/stock-transaction-type.enum';

export class CreateStockTransactionDto {
  @ApiProperty({
    description: 'ID du produit concerné',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid',
    required: true
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Type de transaction',
    example: 'purchase',
    enum: StockTransactionType,
    required: true
  })
  @IsEnum(StockTransactionType)
  @IsNotEmpty()
  type: StockTransactionType;

  @ApiProperty({
    description: 'Quantité (positive ou négative selon le type)',
    example: 10.0,
    minimum: 0.01,
    required: true
  })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({
    description: 'Date de la transaction',
    example: '2023-08-01T12:30:00.000Z',
    type: 'string',
    format: 'date-time',
    required: true
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({
    description: 'ID de référence (vente, achat, etc.)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    required: false
  })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({
    description: 'Notes additionnelles',
    example: 'Réception de commande fournisseur #123',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Prix unitaire d\'achat',
    example: 5000.00,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCostPrice?: number;

  @ApiProperty({
    description: 'ID de l\'emplacement de stock',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    required: false
  })
  @IsString()
  @IsOptional()
  locationId?: string;
}
