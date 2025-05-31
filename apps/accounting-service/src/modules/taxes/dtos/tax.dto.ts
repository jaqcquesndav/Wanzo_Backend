import { IsString, IsEnum, IsDate, IsNumber, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxType, DeclarationStatus, DeclarationPeriodicity } from '../entities/tax-declaration.entity';

export class CreateTaxDeclarationDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  @IsEnum(TaxType)
  type!: TaxType;

  @ApiProperty({ description: 'Declaration period (e.g. 2024-03 for March 2024)' })
  @IsString()
  period!: string;

  @ApiProperty({ description: 'Declaration periodicity', enum: DeclarationPeriodicity })
  @IsEnum(DeclarationPeriodicity)
  periodicity!: DeclarationPeriodicity;

  @ApiProperty({ description: 'Document number' })
  @IsString()
  documentNumber!: string;

  @ApiProperty({ description: 'Due date' })
  @IsDate()
  @Type(() => Date)
  dueDate!: Date;

  @ApiProperty({ description: 'Taxable base amount' })
  @IsNumber()
  taxableBase!: number;

  @ApiProperty({ description: 'Tax rate (percentage)' })
  @IsNumber()
  taxRate!: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateTaxDeclarationStatusDto {
  @ApiProperty({ description: 'Declaration status', enum: DeclarationStatus })
  @IsEnum(DeclarationStatus)
  status!: DeclarationStatus;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class TaxDeclarationFilterDto {
  @ApiPropertyOptional({ description: 'Filter by fiscal year' })
  @IsOptional()
  @IsString()
  fiscalYear?: string;

  @ApiPropertyOptional({ description: 'Filter by type', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  type?: TaxType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: DeclarationStatus })
  @IsOptional()
  @IsEnum(DeclarationStatus)
  status?: DeclarationStatus;

  @ApiPropertyOptional({ description: 'Filter by period' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Filter by periodicity', enum: DeclarationPeriodicity })
  @IsOptional()
  @IsEnum(DeclarationPeriodicity)
  periodicity?: DeclarationPeriodicity;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}