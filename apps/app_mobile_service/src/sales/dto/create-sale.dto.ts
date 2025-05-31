import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsNumber, Min, ValidateNested, IsArray, ArrayMinSize, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSaleItemDto } from './create-sale-item.dto';
import { PaymentStatus } from '../entities/sale.entity';

export class CreateSaleDto {
  @IsUUID()
  @IsOptional() // Customer might be anonymous or not yet registered
  customerId?: string;

  @IsDateString()
  @IsOptional() // Defaults to current date in entity
  saleDate?: string;

  // totalAmount will be calculated based on items in the service

  @IsNumber()
  @Min(0)
  @IsOptional() // Might not be paid immediately
  amountPaid?: number;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus; // Defaults to PENDING in entity

  @IsString()
  @IsOptional()
  paymentMethodId?: string; // E.g., 'cash', 'card_xyz', or UUID to a payment methods table

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID() // Assuming userId will be injected from the authenticated user context by the service/decorator
  @IsNotEmpty() // This should be handled by auth, not directly in DTO from client usually
  userId: string; // Or remove and handle in service based on request.user

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
