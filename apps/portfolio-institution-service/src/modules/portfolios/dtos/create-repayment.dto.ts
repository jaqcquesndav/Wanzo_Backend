import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsUUID, IsArray, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RepaymentType } from '../entities/repayment.entity';

export class CreateRepaymentDto {
  @ApiProperty({ description: 'Contract ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  contractId!: string;

  @ApiProperty({ description: 'Payment amount', example: 50000, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ description: 'Payment date', example: '2024-01-15T10:00:00Z' })
  @IsDateString()
  paymentDate!: Date;

  @ApiProperty({ description: 'Payment method', example: 'mobile_money' })
  @IsString()
  paymentMethod!: string;

  @ApiProperty({ description: 'Payment type', enum: RepaymentType, example: RepaymentType.STANDARD })
  @IsEnum(RepaymentType)
  paymentType!: RepaymentType;

  @ApiPropertyOptional({ description: 'Transaction ID from payment provider', example: 'TXN-123456' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Transaction date', example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  transactionDate?: Date;

  @ApiPropertyOptional({ description: 'Schedule IDs to pay (for specific schedules)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  scheduleIds?: string[];

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Payment received via Airtel Money' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Attachments (receipts, etc.)' })
  @IsOptional()
  attachments?: any[];
}

export class UpdateRepaymentDto {
  @ApiPropertyOptional({ description: 'Payment amount' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: 'Payment date' })
  @IsOptional()
  @IsDateString()
  paymentDate?: Date;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RepaymentFilterDto {
  @ApiPropertyOptional({ description: 'Filter by portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Filter by contract ID' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional({ description: 'Filter by client ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['pending', 'processing', 'completed', 'failed', 'partial'] })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed', 'partial'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search text' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
