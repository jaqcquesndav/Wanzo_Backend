import { IsString, IsEnum, IsDate, IsNumber, IsOptional, IsObject, IsUUID, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeclarationType, DeclarationStatus, DeclarationPeriodicity } from '../entities/tax-declaration.entity';

export class CreateTaxDeclarationDto {
  @ApiProperty({ description: 'Type of tax declaration', enum: DeclarationType })
  @IsEnum(DeclarationType)
  type!: DeclarationType;

  @ApiProperty({ description: 'Declaration period (e.g. 2024-03 for March 2024)' })
  @IsString()
  period!: string;

  @ApiProperty({ description: 'Tax amount' })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ description: 'Array of attachment IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  // Additional fields not in API doc but needed for implementation
  @ApiPropertyOptional({ description: 'Fiscal year ID' })
  @IsOptional()
  @IsUUID()
  fiscalYearId?: string;

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

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class UpdateTaxDeclarationDto {
  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Array of attachment IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  // Additional fields not in API doc but needed for implementation
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

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Journal Entry ID' })
  @IsOptional()
  @IsUUID()
  journalEntryId?: string;
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

export class TaxFilterDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;

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

  @ApiPropertyOptional({ description: 'Filter by period (YYYY-MM format)' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Filter by periodicity', enum: DeclarationPeriodicity })
  @IsOptional()
  @IsEnum(DeclarationPeriodicity)
  periodicity?: DeclarationPeriodicity;

  @ApiPropertyOptional({ description: 'Search term for reference or other fields' })
  @IsOptional()
  @IsString()
  search?: string;

  // Internal use
  companyId?: string;
}