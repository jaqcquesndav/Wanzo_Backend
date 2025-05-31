import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsUUID, IsOptional, IsArray, ArrayNotEmpty, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  motif: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true })
  attachmentUrls?: string[];

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  // userId and companyId will be set from the authenticated user context in the service
}
