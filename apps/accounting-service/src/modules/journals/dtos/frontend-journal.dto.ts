import { IsString, IsEnum, IsDate, IsNumber, IsArray, ValidateNested, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Définitions des types pour correspondre au frontend
export enum FrontendJournalType {
  SALES = 'sales',
  PURCHASES = 'purchases',
  BANK = 'bank',
  CASH = 'cash',
  GENERAL = 'general'
}

export enum FrontendJournalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  POSTED = 'posted'
}

export enum FrontendJournalSource {
  MANUAL = 'manual',
  AGENT = 'agent'
}

export enum FrontendValidationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected'
}

export class FrontendJournalLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Account ID' })
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'Account code' })
  @IsOptional()
  @IsString()
  accountCode?: string;

  @ApiPropertyOptional({ description: 'Account name' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({ description: 'Debit amount' })
  @IsNumber()
  debit!: number;

  @ApiProperty({ description: 'Credit amount' })
  @IsNumber()
  credit!: number;

  @ApiProperty({ description: 'Line description' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'VAT code' })
  @IsOptional()
  @IsString()
  vatCode?: string;

  @ApiPropertyOptional({ description: 'VAT amount' })
  @IsOptional()
  @IsNumber()
  vatAmount?: number;

  @ApiPropertyOptional({ description: 'Analytic code' })
  @IsOptional()
  @IsString()
  analyticCode?: string;
}

export class FrontendAttachmentDto {
  @ApiProperty({ description: 'Attachment ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Attachment name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Attachment URL' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'Local URL' })
  @IsOptional()
  @IsString()
  localUrl?: string;

  @ApiProperty({ description: 'Attachment status', enum: ['pending', 'uploading', 'uploaded', 'error'] })
  @IsString()
  status!: 'pending' | 'uploading' | 'uploaded' | 'error';
}

export class CreateFrontendJournalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Journal date' })
  @IsString()
  date!: string;

  @ApiProperty({ description: 'Journal type', enum: FrontendJournalType })
  @IsEnum(FrontendJournalType)
  journalType!: FrontendJournalType;

  @ApiProperty({ description: 'Journal description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Journal reference' })
  @IsString()
  reference!: string;

  @ApiPropertyOptional({ description: 'Total debit' })
  @IsOptional()
  @IsNumber()
  totalDebit?: number;

  @ApiPropertyOptional({ description: 'Total credit' })
  @IsOptional()
  @IsNumber()
  totalCredit?: number;

  @ApiPropertyOptional({ description: 'Total VAT' })
  @IsOptional()
  @IsNumber()
  totalVat?: number;

  @ApiPropertyOptional({ description: 'Journal status', enum: FrontendJournalStatus })
  @IsOptional()
  @IsEnum(FrontendJournalStatus)
  status?: FrontendJournalStatus;

  @ApiPropertyOptional({ description: 'Source of the entry', enum: FrontendJournalSource })
  @IsOptional()
  @IsEnum(FrontendJournalSource)
  source?: FrontendJournalSource;

  @ApiPropertyOptional({ description: 'Agent ID' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Validation status', enum: FrontendValidationStatus })
  @IsOptional()
  @IsEnum(FrontendValidationStatus)
  validationStatus?: FrontendValidationStatus;

  @ApiPropertyOptional({ description: 'Validated by' })
  @IsOptional()
  @IsString()
  validatedBy?: string;

  @ApiPropertyOptional({ description: 'Validated at' })
  @IsOptional()
  @IsString()
  validatedAt?: string;

  @ApiProperty({ description: 'Journal lines', type: [FrontendJournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrontendJournalLineDto)
  lines!: FrontendJournalLineDto[];

  @ApiPropertyOptional({ description: 'Attachments', type: [FrontendAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrontendAttachmentDto)
  attachments?: FrontendAttachmentDto[];
  
  @ApiPropertyOptional({ description: 'Fiscal Year ID' })
  @IsOptional()
  @IsString()
  fiscalYearId?: string;
}

// Conversion functions between frontend and backend types
export function convertFrontendJournalToBackend(frontendJournal: CreateFrontendJournalDto): any {
  return {
    fiscalYear: frontendJournal.fiscalYearId || '', // Important field for backend
    type: frontendJournal.journalType,
    reference: frontendJournal.reference,
    date: new Date(frontendJournal.date),
    description: frontendJournal.description,
    lines: frontendJournal.lines.map(line => ({
      accountId: line.accountId,
      debit: line.debit,
      credit: line.credit,
      description: line.description,
      vatCode: line.vatCode,
      vatAmount: line.vatAmount,
      analyticCode: line.analyticCode
    }))
  };
}

export function convertBackendJournalToFrontend(backendJournal: any): any {
  return {
    id: backendJournal.id,
    date: backendJournal.date instanceof Date ? backendJournal.date.toISOString() : backendJournal.date,
    journalType: backendJournal.journalType || backendJournal.type,
    description: backendJournal.description,
    reference: backendJournal.reference || '',
    totalDebit: backendJournal.totalDebit,
    totalCredit: backendJournal.totalCredit,
    totalVat: backendJournal.totalVat || 0,
    status: backendJournal.status,
    source: backendJournal.source || 'manual',
    agentId: backendJournal.agentId,
    validationStatus: backendJournal.validationStatus,
    validatedBy: backendJournal.validatedBy,
    validatedAt: backendJournal.validatedAt instanceof Date ? backendJournal.validatedAt.toISOString() : backendJournal.validatedAt,
    lines: backendJournal.lines.map(line => ({
      id: line.id,
      accountId: line.accountId,
      accountCode: line.accountCode || '',
      accountName: line.accountName || '',
      debit: line.debit,
      credit: line.credit,
      description: line.description || '',
      vatCode: line.vatCode,
      vatAmount: line.vatAmount,
      analyticCode: line.analyticCode
    })),
    attachments: backendJournal.attachments ? backendJournal.attachments.map(attachment => ({
      id: attachment.id,
      name: attachment.name,
      url: attachment.url,
      localUrl: attachment.localUrl,
      status: attachment.status
    })) : []
  };
}
