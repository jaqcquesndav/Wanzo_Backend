import { IsString, IsEnum, IsDate, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Types de rapports selon la documentation API
 */
export enum ApiReportType {
  BALANCE = 'balance',
  INCOME = 'income',
  CASHFLOW = 'cashflow',
  EQUITY_CHANGES = 'equity-changes',
  NOTES = 'notes',
  RECONCILIATION = 'reconciliation',
  ANALYTICAL = 'analytical',
  SOCIAL = 'social',
  STATISTICS = 'statistics',
  TRIAL_BALANCE = 'trial-balance',
  GENERAL_LEDGER = 'general-ledger',
  JOURNAL_BOOK = 'journal-book',
}

/**
 * Formats d'export selon la documentation API
 */
export enum ApiReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
}

/**
 * DTO pour les filtres analytiques
 */
export class ApiReportFiltersDto {
  @ApiPropertyOptional({ description: 'ID du compte analytique' })
  @IsOptional()
  @IsString()
  analytical_account_id?: string;

  @ApiPropertyOptional({ description: 'ID du centre de coût' })
  @IsOptional()
  @IsString()
  cost_center_id?: string;

  // Autres filtres spécifiques
  [key: string]: any;
}

/**
 * DTO pour les informations de l'organisation
 */
export class ApiOrganizationDto {
  @ApiProperty({ description: 'Nom de l\'organisation' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Adresse de l\'organisation' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Numéro d\'immatriculation' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Identifiant fiscal' })
  @IsOptional()
  @IsString()
  taxId?: string;
}

/**
 * DTO pour la génération de rapport selon la documentation API
 */
export class ApiGenerateReportDto {
  @ApiProperty({ description: 'Type de rapport', enum: ApiReportType })
  @IsEnum(ApiReportType)
  type!: ApiReportType;

  @ApiPropertyOptional({ description: 'Format des données', enum: ApiReportFormat, default: ApiReportFormat.JSON })
  @IsOptional()
  @IsEnum(ApiReportFormat)
  format?: ApiReportFormat = ApiReportFormat.JSON;

  @ApiProperty({ description: 'Date de fin de période (YYYY-MM-DD)' })
  @IsString()
  date!: string;

  @ApiPropertyOptional({ description: 'Inclure les données comparatives de la période précédente', default: false })
  @IsOptional()
  @IsBoolean()
  comparative?: boolean = false;

  @ApiPropertyOptional({ description: 'Code de la devise (ex: USD, CDF)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Inclure les notes analytiques', default: false })
  @IsOptional()
  @IsBoolean()
  includeNotes?: boolean = false;

  @ApiPropertyOptional({ description: 'Filtres additionnels pour les rapports analytiques ou spécifiques' })
  @IsOptional()
  @Type(() => ApiReportFiltersDto)
  filters?: ApiReportFiltersDto;
}

/**
 * DTO pour l'exportation de rapport selon la documentation API
 */
export class ApiExportReportDto {
  @ApiProperty({ description: 'Type de rapport', enum: ApiReportType })
  @IsEnum(ApiReportType)
  type!: ApiReportType;

  @ApiProperty({ description: 'Format d\'exportation', enum: ApiReportFormat })
  @IsEnum(ApiReportFormat)
  format!: ApiReportFormat;

  @ApiProperty({ description: 'Données JSON du rapport à exporter' })
  @IsObject()
  data!: Record<string, any>;

  @ApiProperty({ description: 'Titre du rapport' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Informations sur l\'organisation' })
  @Type(() => ApiOrganizationDto)
  organization!: ApiOrganizationDto;

  @ApiProperty({ description: 'Nom ou email de l\'utilisateur qui a généré le rapport' })
  @IsString()
  generatedBy!: string;

  @ApiPropertyOptional({ description: 'Le rapport est-il audité', default: false })
  @IsOptional()
  @IsBoolean()
  isAudited?: boolean = false;

  @ApiProperty({ description: 'Devise du rapport' })
  @IsString()
  currency!: string;
}
