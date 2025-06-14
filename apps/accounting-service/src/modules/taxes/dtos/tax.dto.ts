import { IsString, IsEnum, IsDate, IsNumber, IsOptional, IsObject, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeclarationType, DeclarationStatus, DeclarationPeriodicity } from '../entities/tax-declaration.entity';

export class CreateTaxDeclarationDto {
  @ApiProperty({ description: 'Fiscal year ID' })
  @IsUUID()
  fiscalYearId!: string;

  @ApiProperty({ description: 'Tax type', enum: DeclarationType })
  @IsEnum(DeclarationType)
  type!: DeclarationType;

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

  @ApiProperty({ description: 'Company ID' })
  @IsUUID()
  companyId!: string;
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

  @ApiPropertyOptional({ description: 'Paid At' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Paid By' })
  @IsOptional()
  @IsString()
  paidBy?: string;
}

export class UpdateTaxDeclarationDto {
  @ApiPropertyOptional({ enum: DeclarationType, description: 'Type of tax declaration' })
  @IsOptional()
  @IsEnum(DeclarationType)
  type?: DeclarationType;

  @ApiPropertyOptional({ description: 'Fiscal year ID' })
  @IsOptional()
  @IsUUID()
  fiscalYearId?: string;

  @ApiPropertyOptional({ description: 'Declaration period (e.g. 2024-03 for March 2024)' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Declaration periodicity', enum: DeclarationPeriodicity })
  @IsOptional()
  @IsEnum(DeclarationPeriodicity)
  periodicity?: DeclarationPeriodicity;

  @ApiPropertyOptional({ description: 'Document number' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Taxable base amount' })
  @IsOptional()
  @IsNumber()
  taxableBase?: number;

  @ApiPropertyOptional({ description: 'Tax rate (percentage)' })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Journal Entry ID' })
  @IsOptional()
  @IsUUID()
  journalEntryId?: string;

  @ApiPropertyOptional({ description: 'Paid At' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Paid By' })
  @IsOptional()
  @IsString()
  paidBy?: string;

  @ApiPropertyOptional({ description: 'Payment Reference' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Rejection Reason' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class TaxFilterDto {
  @ApiPropertyOptional({ description: 'Filter by fiscal year ID' })
  @IsOptional()
  @IsUUID()
  fiscalYearId?: string;

  @ApiPropertyOptional({ description: 'Filter by tax type', enum: DeclarationType })
  @IsOptional()
  @IsEnum(DeclarationType)
  type?: DeclarationType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: DeclarationStatus })
  @IsOptional()
  @IsEnum(DeclarationStatus)
  status?: DeclarationStatus;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Search term for description or reference' })
  @IsOptional()
  @IsString()
  search?: string;
}