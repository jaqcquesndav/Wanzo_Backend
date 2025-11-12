import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyType } from '../../shared';

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_REVIEW = 'under_review',
  PENDING = 'pending',
  EXEMPTED = 'exempted'
}

export enum RegulatoryFramework {
  BASEL_III = 'basel_iii',
  IFRS = 'ifrs',
  SOLVENCY_II = 'solvency_ii',
  MiFID_II = 'mifid_ii',
  PSD2 = 'psd2',
  GDPR = 'gdpr',
  AML_CFT = 'aml_cft',
  FATCA = 'fatca',
  CRS = 'crs',
  LOCAL_BANKING_LAW = 'local_banking_law',
  CENTRAL_BANK_REGULATIONS = 'central_bank_regulations',
  INSURANCE_REGULATIONS = 'insurance_regulations',
  CAPITAL_MARKET_REGULATIONS = 'capital_market_regulations'
}

export enum AuditType {
  INTERNAL_AUDIT = 'internal_audit',
  EXTERNAL_AUDIT = 'external_audit',
  REGULATORY_INSPECTION = 'regulatory_inspection',
  COMPLIANCE_REVIEW = 'compliance_review',
  RISK_ASSESSMENT = 'risk_assessment',
  IT_AUDIT = 'it_audit',
  OPERATIONAL_AUDIT = 'operational_audit',
  FINANCIAL_AUDIT = 'financial_audit'
}

export enum ReportingFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually',
  ON_DEMAND = 'on_demand',
  WHEN_REQUIRED = 'when_required'
}

/**
 * DTO pour les informations de conformité réglementaire
 */
export class RegulatoryComplianceDto {
  @ApiProperty({ description: 'Code de conformité' })
  @IsString()
  complianceCode!: string;

  @ApiProperty({ description: 'Nom de l\'exigence réglementaire' })
  @IsString()
  requirementName!: string;

  @ApiProperty({ description: 'Cadre réglementaire', enum: RegulatoryFramework })
  @IsEnum(RegulatoryFramework)
  framework!: RegulatoryFramework;

  @ApiProperty({ description: 'Statut de conformité', enum: ComplianceStatus })
  @IsEnum(ComplianceStatus)
  status!: ComplianceStatus;

  @ApiProperty({ description: 'Description détaillée' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Autorité réglementaire' })
  @IsOptional()
  @IsString()
  regulatoryAuthority?: string;

  @ApiPropertyOptional({ description: 'Date d\'entrée en vigueur' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: 'Date d\'échéance' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Date de dernière évaluation' })
  @IsOptional()
  @IsDateString()
  lastAssessmentDate?: string;

  @ApiPropertyOptional({ description: 'Date de prochaine évaluation' })
  @IsOptional()
  @IsDateString()
  nextAssessmentDate?: string;

  @ApiPropertyOptional({ description: 'Niveau de risque' })
  @IsOptional()
  @IsString()
  riskLevel?: string; // LOW, MEDIUM, HIGH, CRITICAL

  @ApiPropertyOptional({ description: 'Score de conformité (0-100)' })
  @IsOptional()
  @IsNumber()
  complianceScore?: number;

  @ApiPropertyOptional({ description: 'Documents requis' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Documents soumis' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  submittedDocuments?: string[];

  @ApiPropertyOptional({ description: 'Responsable de la conformité' })
  @IsOptional()
  @IsString()
  responsibleOfficer?: string;

  @ApiPropertyOptional({ description: 'Fréquence de reporting', enum: ReportingFrequency })
  @IsOptional()
  @IsEnum(ReportingFrequency)
  reportingFrequency?: ReportingFrequency;

  @ApiPropertyOptional({ description: 'Coût de conformité' })
  @IsOptional()
  @IsNumber()
  complianceCost?: number;

  @ApiPropertyOptional({ description: 'Devise du coût', enum: CurrencyType })
  @IsOptional()
  @IsEnum(CurrencyType)
  costCurrency?: CurrencyType;

  @ApiPropertyOptional({ description: 'Pénalités en cas de non-conformité' })
  @IsOptional()
  @IsString()
  penalties?: string;

  @ApiPropertyOptional({ description: 'Actions correctives' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  correctiveActions?: string[];

  @ApiPropertyOptional({ description: 'Commentaires' })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ description: 'Références légales' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  legalReferences?: string[];

  @ApiPropertyOptional({ description: 'Conformité automatisée' })
  @IsOptional()
  @IsBoolean()
  isAutomated?: boolean;

  @ApiPropertyOptional({ description: 'Nécessite approbation externe' })
  @IsOptional()
  @IsBoolean()
  requiresExternalApproval?: boolean;
}

/**
 * DTO pour créer une exigence réglementaire
 */
export class CreateRegulatoryComplianceDto {
  @ApiProperty({ description: 'ID de l\'institution financière' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Données de conformité réglementaire' })
  @ValidateNested()
  @Type(() => RegulatoryComplianceDto)
  regulatory!: RegulatoryComplianceDto;
}

/**
 * DTO pour mettre à jour une exigence réglementaire
 */
export class UpdateRegulatoryComplianceDto {
  @ApiProperty({ description: 'ID de l\'exigence à mettre à jour' })
  @IsString()
  regulatoryId!: string;

  @ApiProperty({ description: 'Nouvelles données de conformité' })
  @ValidateNested()
  @Type(() => RegulatoryComplianceDto)
  regulatory!: Partial<RegulatoryComplianceDto>;
}

/**
 * DTO de réponse pour une exigence réglementaire
 */
export class RegulatoryComplianceResponseDto extends RegulatoryComplianceDto {
  @ApiProperty({ description: 'Identifiant unique de l\'exigence' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'ID de l\'institution' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Date de création' })
  @IsString()
  createdAt!: string;

  @ApiProperty({ description: 'Date de mise à jour' })
  @IsString()
  updatedAt!: string;
}

/**
 * DTO pour un audit
 */
export class AuditDto {
  @ApiProperty({ description: 'Type d\'audit', enum: AuditType })
  @IsEnum(AuditType)
  auditType!: AuditType;

  @ApiProperty({ description: 'Date de l\'audit' })
  @IsDateString()
  auditDate!: string;

  @ApiProperty({ description: 'Auditeur' })
  @IsString()
  auditor!: string;

  @ApiProperty({ description: 'Portée de l\'audit' })
  @IsArray()
  @IsString({ each: true })
  scope!: string[];

  @ApiPropertyOptional({ description: 'Résultats de l\'audit' })
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional({ description: 'Recommandations' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];

  @ApiPropertyOptional({ description: 'Score global' })
  @IsOptional()
  @IsNumber()
  overallScore?: number;

  @ApiProperty({ description: 'Statut de l\'audit' })
  @IsString()
  status!: string; // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
}

// Aliases pour compatibilité avec les contrôleurs
export { RegulatoryComplianceDto as InstitutionRegulatoryDataDto };
export { CreateRegulatoryComplianceDto as CreateInstitutionRegulatoryDto };
export { UpdateRegulatoryComplianceDto as UpdateInstitutionRegulatoryDto };
export { RegulatoryComplianceResponseDto as InstitutionRegulatoryResponseDto };