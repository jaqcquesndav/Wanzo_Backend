import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsObject, ValidateNested, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TraditionalFundingType, PaymentOrderStatus, PortfolioType } from '../entities/payment-order.entity';

export class CreatePaymentOrderDto {
  @ApiProperty({ description: 'Portfolio type', enum: PortfolioType, default: PortfolioType.TRADITIONAL })
  @IsEnum(PortfolioType)
  portfolioType: PortfolioType = PortfolioType.TRADITIONAL;

  @ApiProperty({ description: 'Type of funding for traditional portfolio', enum: TraditionalFundingType })
  @IsEnum(TraditionalFundingType)
  fundingType: TraditionalFundingType;

  @ApiProperty({ description: 'Payment amount', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Company/Beneficiary name' })
  @IsString()
  company: string;

  @ApiProperty({ description: 'Reference number for the payment' })
  @IsString()
  reference: string;

  @ApiPropertyOptional({ description: 'Description of the payment order' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Related contract reference' })
  @IsString()
  contractReference: string;

  @ApiProperty({ description: 'Product name/type' })
  @IsString()
  product: string;

  @ApiPropertyOptional({ description: 'Related credit request ID' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiProperty({ description: 'Related portfolio ID' })
  @IsString()
  portfolioId: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdatePaymentOrderDto {
  @ApiPropertyOptional({ description: 'Type of funding for traditional portfolio', enum: TraditionalFundingType })
  @IsOptional()
  @IsEnum(TraditionalFundingType)
  fundingType?: TraditionalFundingType;

  @ApiPropertyOptional({ description: 'Payment amount', minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: 'Payment date' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Company/Beneficiary name' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: 'Description of the payment order' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Product name/type' })
  @IsOptional()
  @IsString()
  product?: string;

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

  @ApiPropertyOptional({ description: 'Comments for status change' })
  @IsOptional()
  @IsString()
  comments?: string;
}