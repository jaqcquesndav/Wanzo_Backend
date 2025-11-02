import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentOrderType, PaymentOrderStatus } from '../entities/payment-order.entity';

export class BeneficiaryDto {
  @ApiProperty({ description: 'Beneficiary name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Account number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Bank code' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ description: 'IBAN' })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreatePaymentOrderDto {
  @ApiProperty({ description: 'Type of payment order', enum: PaymentOrderType })
  @IsEnum(PaymentOrderType)
  type: PaymentOrderType;

  @ApiProperty({ description: 'Payment amount', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Payment currency', default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Due date for the payment' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Description of the payment order' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Beneficiary information' })
  @ValidateNested()
  @Type(() => BeneficiaryDto)
  beneficiary: BeneficiaryDto;

  @ApiPropertyOptional({ description: 'Related portfolio ID' })
  @IsOptional()
  @IsString()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Related contract reference' })
  @IsOptional()
  @IsString()
  contractReference?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdatePaymentOrderDto {
  @ApiPropertyOptional({ description: 'Payment amount', minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: 'Due date for the payment' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Description of the payment order' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Beneficiary information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BeneficiaryDto)
  beneficiary?: BeneficiaryDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdatePaymentOrderStatusDto {
  @ApiProperty({ description: 'New status for the payment order', enum: PaymentOrderStatus })
  @IsEnum(PaymentOrderStatus)
  status: PaymentOrderStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}