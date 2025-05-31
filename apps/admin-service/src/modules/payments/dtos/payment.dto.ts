import { IsString, IsNumber, IsObject, ValidateNested, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AmountDto {
  @ApiProperty({ description: 'Amount in USD' })
  @IsNumber()
  usd!: number;

  @ApiProperty({ description: 'Amount in CDF' })
  @IsNumber()
  cdf!: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment amount' })
  @ValidateNested()
  @Type(() => AmountDto)
  amount!: AmountDto;

  @ApiProperty({ description: 'Payment method ID' })
  @IsString()
  methodId!: string;

  @ApiProperty({ description: 'Payment description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Invoice ID' })
  @IsString()
  invoiceId!: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PaymentMethodDto {
  @ApiProperty({ description: 'Payment method type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Payment provider' })
  @IsString()
  provider!: string;

  @ApiProperty({ description: 'Payment method details' })
  @IsObject()
  details!: {
    [key: string]: string;
  };
}

export class PaymentFilterDto {
  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by method ID' })
  @IsOptional()
  @IsString()
  methodId?: string;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}