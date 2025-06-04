import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsNumber, Min, ValidateNested, IsArray, ArrayMinSize, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSaleItemDto } from './create-sale-item.dto';
import { PaymentStatus } from '../entities/sale.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {
  @ApiProperty({
    description: 'Identifiant unique du client (optionnel)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
    required: false
  })
  @IsUUID()
  @IsOptional() // Customer might be anonymous or not yet registered
  customerId?: string;

  @ApiProperty({
    description: 'Date de la vente (optionnel, par défaut: date actuelle)',
    example: '2025-06-04T12:00:00Z',
    format: 'date-time',
    required: false
  })
  @IsDateString()
  @IsOptional() // Defaults to current date in entity
  saleDate?: string;

  // totalAmount will be calculated based on items in the service

  @ApiProperty({
    description: 'Montant payé',
    example: 500.00,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional() // Might not be paid immediately
  amountPaid?: number;

  @ApiProperty({
    description: 'Statut du paiement',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
    required: false,
    default: PaymentStatus.PENDING
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus; // Defaults to PENDING in entity

  @ApiProperty({
    description: 'Identifiant de la méthode de paiement',
    example: 'cash',
    required: false
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string; // E.g., 'cash', 'card_xyz', or UUID to a payment methods table

  @ApiProperty({
    description: 'Notes sur la vente',
    example: 'Livraison à domicile prévue le 05/06/2025',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Identifiant de l\'utilisateur effectuant la vente',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid',
    required: true
  })
  @IsUUID() // Assuming userId will be injected from the authenticated user context by the service/decorator
  @IsNotEmpty() // This should be handled by auth, not directly in DTO from client usually
  userId: string; // Or remove and handle in service based on request.user

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
}
