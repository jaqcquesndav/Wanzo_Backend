import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsPositive } from 'class-validator';

export class CreateSaleItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number; // Price at the time of sale, can be validated against product price or set by system

  // totalPrice will be calculated in the service: quantity * unitPrice
}
