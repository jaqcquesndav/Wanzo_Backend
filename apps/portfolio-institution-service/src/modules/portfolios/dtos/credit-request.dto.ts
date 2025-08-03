import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditRequestStatus, Periodicity, ScheduleType } from '../entities/credit-request.entity';

export class CreateCreditRequestDto {
  @ApiProperty({ description: 'Member ID' })
  @IsUUID()
  memberId!: string;

  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Reception date' })
  @IsDateString()
  receptionDate!: string;

  @ApiProperty({ description: 'Request amount' })
  @IsNumber()
  requestAmount!: number;

  @ApiProperty({ description: 'Periodicity', enum: Periodicity })
  @IsEnum(Periodicity)
  periodicity!: Periodicity;

  @ApiProperty({ description: 'Interest rate' })
  @IsNumber()
  interestRate!: number;

  @ApiProperty({ description: 'Reason for credit request' })
  @IsString()
  reason!: string;

  @ApiProperty({ description: 'Schedule type', enum: ScheduleType })
  @IsEnum(ScheduleType)
  scheduleType!: ScheduleType;

  @ApiProperty({ description: 'Number of schedules' })
  @IsNumber()
  schedulesCount!: number;

  @ApiPropertyOptional({ description: 'Number of deferred payments' })
  @IsOptional()
  @IsNumber()
  deferredPaymentsCount?: number;

  @ApiPropertyOptional({ description: 'Grace period in months' })
  @IsOptional()
  @IsNumber()
  gracePeriod?: number;

  @ApiProperty({ description: 'Financing purpose' })
  @IsString()
  financingPurpose!: string;

  @ApiProperty({ description: 'Credit manager ID' })
  @IsUUID()
  creditManagerId!: string;

  @ApiPropertyOptional({ description: 'Is group credit request' })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({ description: 'Portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Currency', default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateCreditRequestDto {
  @ApiPropertyOptional({ description: 'Request amount' })
  @IsOptional()
  @IsNumber()
  requestAmount?: number;

  @ApiPropertyOptional({ description: 'Periodicity', enum: Periodicity })
  @IsOptional()
  @IsEnum(Periodicity)
  periodicity?: Periodicity;

  @ApiPropertyOptional({ description: 'Interest rate' })
  @IsOptional()
  @IsNumber()
  interestRate?: number;

  @ApiPropertyOptional({ description: 'Reason for credit request' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Schedule type', enum: ScheduleType })
  @IsOptional()
  @IsEnum(ScheduleType)
  scheduleType?: ScheduleType;

  @ApiPropertyOptional({ description: 'Number of schedules' })
  @IsOptional()
  @IsNumber()
  schedulesCount?: number;

  @ApiPropertyOptional({ description: 'Number of deferred payments' })
  @IsOptional()
  @IsNumber()
  deferredPaymentsCount?: number;

  @ApiPropertyOptional({ description: 'Grace period in months' })
  @IsOptional()
  @IsNumber()
  gracePeriod?: number;

  @ApiPropertyOptional({ description: 'Financing purpose' })
  @IsOptional()
  @IsString()
  financingPurpose?: string;

  @ApiPropertyOptional({ description: 'Credit manager ID' })
  @IsOptional()
  @IsUUID()
  creditManagerId?: string;

  @ApiPropertyOptional({ description: 'Is group credit request' })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({ description: 'Status', enum: CreditRequestStatus })
  @IsOptional()
  @IsEnum(CreditRequestStatus)
  status?: CreditRequestStatus;

  @ApiPropertyOptional({ description: 'Portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Currency' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreditRequestFilterDto {
  @ApiPropertyOptional({ description: 'Filter by portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: CreditRequestStatus })
  @IsOptional()
  @IsEnum(CreditRequestStatus)
  status?: CreditRequestStatus;

  @ApiPropertyOptional({ description: 'Filter by client/member ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by product type' })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (start)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (end)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search text' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'requestAmount', 'memberId'] })
  @IsOptional()
  @IsEnum(['createdAt', 'requestAmount', 'memberId'])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;
}
