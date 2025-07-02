import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional } from 'class-validator';

export class PurchaseTokenDto {
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @IsString()
  @IsOptional()
  currency?: string;
}
