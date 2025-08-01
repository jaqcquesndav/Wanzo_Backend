import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsPositive } from 'class-validator';
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
  unitPrice: number; // Price at the time of sale, can be validated against product price or set by system

  // totalPrice will be calculated in the service: quantity * unitPrice
}
