import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsNumber, Min, ValidateNested, IsArray, ArrayMinSize, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSaleItemDto } from './create-sale-item.dto';
import { SaleStatus } from '../entities/sale.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {
  @ApiProperty({
    description: 'Date de la vente',
    example: '2023-08-01T12:30:00.000Z',
    format: 'date-time',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Date d\'échéance (optionnel)',
    example: '2023-08-15T12:30:00.000Z',
    format: 'date-time',
    required: false
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({
    description: 'Identifiant du client (optionnel)',
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
    required: true
  })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    description: 'Articles de la vente',
    type: [CreateSaleItemDto],
    required: true
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiProperty({
    description: 'Méthode de paiement',
    example: 'cash',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({
    description: 'Référence de paiement (optionnel)',
    example: 'TRANS-123456',
    required: false
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiProperty({
    description: 'Notes sur la vente (optionnel)',
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
    required: true
  })
  @IsNumber()
  @IsPositive()
  exchangeRate: number;
}
