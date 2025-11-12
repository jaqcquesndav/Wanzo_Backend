import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RegulatoryAuthority {
  CENTRAL_BANK = 'central_bank',
  BANKING_COMMISSION = 'banking_commission',
  SECURITIES_COMMISSION = 'securities_commission',
  INSURANCE_COMMISSION = 'insurance_commission',
  MICROFINANCE_AUTHORITY = 'microfinance_authority',
  FINANCIAL_INTELLIGENCE_UNIT = 'financial_intelligence_unit',
  TAX_AUTHORITY = 'tax_authority',
  LABOR_MINISTRY = 'labor_ministry',
  COMMERCE_MINISTRY = 'commerce_ministry',
  FINANCE_MINISTRY = 'finance_ministry'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_REVIEW = 'under_review',
  PENDING_APPROVAL = 'pending_approval',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked'
}

export enum LicenseType {
  BANKING_LICENSE = 'banking_license',
  MICROFINANCE_LICENSE = 'microfinance_license',
  INVESTMENT_LICENSE = 'investment_license',
  INSURANCE_LICENSE = 'insurance_license',
  MONEY_TRANSFER_LICENSE = 'money_transfer_license',
  FOREX_LICENSE = 'forex_license',
  SECURITIES_DEALING_LICENSE = 'securities_dealing_license',
  ASSET_MANAGEMENT_LICENSE = 'asset_management_license',
  CUSTODY_LICENSE = 'custody_license',
  PAYMENT_SERVICES_LICENSE = 'payment_services_license'
}

export enum ReportType {
  MONTHLY_REPORT = 'monthly_report',
  QUARTERLY_REPORT = 'quarterly_report',
  ANNUAL_REPORT = 'annual_report',
  PRUDENTIAL_REPORT = 'prudential_report',
  AML_REPORT = 'aml_report',
  CTF_REPORT = 'ctf_report',
  CAPITAL_ADEQUACY_REPORT = 'capital_adequacy_report',
  LIQUIDITY_REPORT = 'liquidity_report',
  RISK_REPORT = 'risk_report',
  AUDIT_REPORT = 'audit_report',
  INCIDENT_REPORT = 'incident_report'
}

export enum AuditType {
  INTERNAL_AUDIT = 'internal_audit',
  EXTERNAL_AUDIT = 'external_audit',
  REGULATORY_INSPECTION = 'regulatory_inspection',
  COMPLIANCE_REVIEW = 'compliance_review',
  RISK_ASSESSMENT = 'risk_assessment',
  SPECIAL_EXAMINATION = 'special_examination'
}

/**
 * DTO pour une licence ou autorisation
 */
export class LicenseDto {
  @ApiProperty({ description: 'Type de licence', enum: LicenseType })
  @IsEnum(LicenseType)
  type!: LicenseType;

  @ApiProperty({ description: 'Numéro de licence' })
  @IsString()
  licenseNumber!: string;

  @ApiProperty({ description: 'Autorité émettrice', enum: RegulatoryAuthority })
  @IsEnum(RegulatoryAuthority)
  issuingAuthority!: RegulatoryAuthority;

  @ApiProperty({ description: 'Date d\'émission' })
  @IsDateString()
  issueDate!: string;

  @ApiProperty({ description: 'Date d\'expiration' })
  @IsDateString()
  expirationDate!: string;

  @ApiProperty({ description: 'Statut de la licence', enum: ComplianceStatus })
  @IsEnum(ComplianceStatus)
  status!: ComplianceStatus;

  @ApiPropertyOptional({ description: 'Conditions spéciales' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @ApiPropertyOptional({ description: 'Restrictions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  @ApiPropertyOptional({ description: 'Capital minimum requis' })
  @IsOptional()
  @IsNumber()
  minimumCapitalRequirement?: number;

  @ApiPropertyOptional({ description: 'Frais de licence annuels' })
  @IsOptional()
  @IsNumber()
  annualFees?: number;

  @ApiPropertyOptional({ description: 'Date de dernière inspection' })
  @IsOptional()
  @IsDateString()
  lastInspectionDate?: string;

  @ApiPropertyOptional({ description: 'Prochaine inspection prévue' })
  @IsOptional()
  @IsDateString()
  nextInspectionDate?: string;

  @ApiPropertyOptional({ description: 'Remarques' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO pour un rapport réglementaire
 */
export class RegulatoryReportDto {
  @ApiProperty({ description: 'Type de rapport', enum: ReportType })
  @IsEnum(ReportType)
  reportType!: ReportType;

  @ApiProperty({ description: 'Période du rapport' })
  @IsString()
  reportingPeriod!: string;

  @ApiProperty({ description: 'Date de soumission' })
  @IsDateString()
  submissionDate!: string;

  @ApiProperty({ description: 'Date limite de soumission' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ description: 'Autorité destinataire', enum: RegulatoryAuthority })
  @IsEnum(RegulatoryAuthority)
  reportingAuthority!: RegulatoryAuthority;

  @ApiProperty({ description: 'Statut du rapport', enum: ComplianceStatus })
  @IsEnum(ComplianceStatus)
  status!: ComplianceStatus;

  @ApiPropertyOptional({ description: 'URL du document soumis' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Taille du fichier (en Ko)' })
  @IsOptional()
  @IsNumber()
  fileSizeKB?: number;

  @ApiPropertyOptional({ description: 'Soumis en retard' })
  @IsOptional()
  @IsBoolean()
  isLateSubmission?: boolean;

  @ApiPropertyOptional({ description: 'Jours de retard' })
  @IsOptional()
  @IsNumber()
  daysLate?: number;

  @ApiPropertyOptional({ description: 'Commentaires de l\'autorité' })
  @IsOptional()
  @IsString()
  authorityComments?: string;

  @ApiPropertyOptional({ description: 'Actions correctives requises' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  correctiveActions?: string[];

  @ApiPropertyOptional({ description: 'Date de validation par l\'autorité' })
  @IsOptional()
  @IsDateString()
  validationDate?: string;

  @ApiPropertyOptional({ description: 'Personne responsable de la soumission' })
  @IsOptional()
  @IsString()
  submittedBy?: string;

  @ApiPropertyOptional({ description: 'Email de la personne responsable' })
  @IsOptional()
  @IsEmail()
  submitterEmail?: string;
}

/**
 * DTO pour un audit ou inspection
 */
export class AuditDto {
  @ApiProperty({ description: 'Type d\'audit', enum: AuditType })
  @IsEnum(AuditType)
  auditType!: AuditType;

  @ApiProperty({ description: 'Date d\'audit' })
  @IsDateString()
  auditDate!: string;

  @ApiProperty({ description: 'Date de fin d\'audit' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Autorité ou organisme auditeur' })
  @IsOptional()
  @IsString()
  auditor?: string;

  @ApiPropertyOptional({ description: 'Référence de l\'audit' })
  @IsOptional()
  @IsString()
  auditReference?: string;

  @ApiProperty({ description: 'Domaines audités' })
  @IsArray()
  @IsString({ each: true })
  areasAudited!: string[];

  @ApiProperty({ description: 'Résultat global', enum: ComplianceStatus })
  @IsEnum(ComplianceStatus)
  overallResult!: ComplianceStatus;

  @ApiPropertyOptional({ description: 'Score global (1-10)' })
  @IsOptional()
  @IsNumber()
  overallScore?: number;

  @ApiPropertyOptional({ description: 'Observations majeures' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  majorFindings?: string[];

  @ApiPropertyOptional({ description: 'Observations mineures' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  minorFindings?: string[];

  @ApiPropertyOptional({ description: 'Recommandations' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];

  @ApiPropertyOptional({ description: 'Plan d\'action corrective' })
  @IsOptional()
  @IsString()
  correctiveActionPlan?: string;

  @ApiPropertyOptional({ description: 'Date limite pour les actions correctives' })
  @IsOptional()
  @IsDateString()
  correctiveActionDeadline?: string;

  @ApiPropertyOptional({ description: 'Actions correctives terminées' })
  @IsOptional()
  @IsBoolean()
  correctiveActionsCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Date de suivi prévue' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ description: 'Rapport d\'audit (URL)' })
  @IsOptional()
  @IsString()
  auditReportUrl?: string;

  @ApiPropertyOptional({ description: 'Coût de l\'audit' })
  @IsOptional()
  @IsNumber()
  auditCost?: number;
}

/**
 * DTO pour une obligation de conformité
 */
export class ComplianceObligationDto {
  @ApiProperty({ description: 'Nom de l\'obligation' })
  @IsString()
  obligationName!: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Autorité réglementaire', enum: RegulatoryAuthority })
  @IsEnum(RegulatoryAuthority)
  regulatoryAuthority!: RegulatoryAuthority;

  @ApiProperty({ description: 'Fréquence' })
  @IsString()
  frequency!: string; // daily, weekly, monthly, quarterly, annually, as-needed

  @ApiProperty({ description: 'Statut de conformité', enum: ComplianceStatus })
  @IsEnum(ComplianceStatus)
  complianceStatus!: ComplianceStatus;

  @ApiPropertyOptional({ description: 'Date de dernière vérification' })
  @IsOptional()
  @IsDateString()
  lastCheckedDate?: string;

  @ApiPropertyOptional({ description: 'Prochaine échéance' })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiPropertyOptional({ description: 'Personne responsable' })
  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @ApiPropertyOptional({ description: 'Département responsable' })
  @IsOptional()
  @IsString()
  responsibleDepartment?: string;

  @ApiPropertyOptional({ description: 'Pénalité en cas de non-conformité' })
  @IsOptional()
  @IsString()
  penaltyForNonCompliance?: string;

  @ApiPropertyOptional({ description: 'Documents requis' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Actions de mise en conformité' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  complianceActions?: string[];
}

/**
 * DTO principal pour la conformité réglementaire
 */
export class RegulatoryComplianceDto {
  @ApiProperty({ description: 'Licences et autorisations' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LicenseDto)
  licenses!: LicenseDto[];

  @ApiPropertyOptional({ description: 'Rapports réglementaires' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegulatoryReportDto)
  regulatoryReports?: RegulatoryReportDto[];

  @ApiPropertyOptional({ description: 'Audits et inspections' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditDto)
  audits?: AuditDto[];

  @ApiPropertyOptional({ description: 'Obligations de conformité' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComplianceObligationDto)
  complianceObligations?: ComplianceObligationDto[];

  @ApiPropertyOptional({ description: 'Score de conformité global (1-10)' })
  @IsOptional()
  @IsNumber()
  overallComplianceScore?: number;

  @ApiPropertyOptional({ description: 'Niveau de risque réglementaire' })
  @IsOptional()
  @IsString()
  riskLevel?: string; // low, medium, high, critical

  @ApiPropertyOptional({ description: 'Date de dernière évaluation' })
  @IsOptional()
  @IsDateString()
  lastAssessmentDate?: string;

  @ApiPropertyOptional({ description: 'Prochaine évaluation prévue' })
  @IsOptional()
  @IsDateString()
  nextAssessmentDate?: string;

  @ApiPropertyOptional({ description: 'Responsable de la conformité' })
  @IsOptional()
  @IsString()
  complianceOfficer?: string;

  @ApiPropertyOptional({ description: 'Email du responsable conformité' })
  @IsOptional()
  @IsEmail()
  complianceOfficerEmail?: string;

  @ApiPropertyOptional({ description: 'Remarques générales' })
  @IsOptional()
  @IsString()
  generalNotes?: string;
}

/**
 * DTO pour créer des données de conformité
 */
export class CreateRegulatoryComplianceDto {
  @ApiProperty({ description: 'ID de l\'institution financière' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Données de conformité réglementaire' })
  @ValidateNested()
  @Type(() => RegulatoryComplianceDto)
  compliance!: RegulatoryComplianceDto;
}

/**
 * DTO pour mettre à jour des données de conformité
 */
export class UpdateRegulatoryComplianceDto {
  @ApiProperty({ description: 'ID des données de conformité à mettre à jour' })
  @IsString()
  complianceId!: string;

  @ApiProperty({ description: 'Nouvelles données de conformité' })
  @ValidateNested()
  @Type(() => RegulatoryComplianceDto)
  compliance!: Partial<RegulatoryComplianceDto>;
}

/**
 * DTO de réponse pour la conformité réglementaire
 */
export class RegulatoryComplianceResponseDto extends RegulatoryComplianceDto {
  @ApiProperty({ description: 'Identifiant unique des données de conformité' })
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
 * DTO pour le tableau de bord de conformité
 */
export class ComplianceDashboardDto {
  @ApiProperty({ description: 'ID de l\'institution' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Nombre total de licences' })
  @IsNumber()
  totalLicenses!: number;

  @ApiProperty({ description: 'Licences actives' })
  @IsNumber()
  activeLicenses!: number;

  @ApiProperty({ description: 'Licences expirant bientôt' })
  @IsNumber()
  licensesExpiringSoon!: number;

  @ApiProperty({ description: 'Rapports en retard' })
  @IsNumber()
  overdueReports!: number;

  @ApiProperty({ description: 'Rapports soumis ce mois' })
  @IsNumber()
  reportsSubmittedThisMonth!: number;

  @ApiProperty({ description: 'Score de conformité moyen' })
  @IsNumber()
  averageComplianceScore!: number;

  @ApiProperty({ description: 'Audits en cours' })
  @IsNumber()
  ongoingAudits!: number;

  @ApiPropertyOptional({ description: 'Actions correctives en attente' })
  @IsOptional()
  @IsNumber()
  pendingCorrectiveActions?: number;

  @ApiPropertyOptional({ description: 'Date de dernière mise à jour' })
  @IsOptional()
  @IsString()
  lastUpdated?: string;
}