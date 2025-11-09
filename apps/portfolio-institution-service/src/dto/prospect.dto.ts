import { IsString, IsOptional, IsEmail, IsNumber, IsArray, IsEnum, IsDateString, Min, Max } from 'class-validator';

/**
 * Statuts disponibles pour les prospects
 */
export enum ProspectStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost'
}

/**
 * Niveaux de priorité
 */
export enum ProspectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Tailles d'entreprise
 */
export enum CompanySize {
  SMALL = 'small',      // < 50 employés
  MEDIUM = 'medium',    // 50-250 employés
  LARGE = 'large',      // 250-1000 employés
  ENTERPRISE = 'enterprise' // > 1000 employés
}

/**
 * Sources de prospects
 */
export enum ProspectSource {
  MANUAL = 'manual',
  WEBSITE = 'website',
  REFERRAL = 'referral',
  COLD_CALL = 'cold_call',
  EVENT = 'event',
  SOCIAL_MEDIA = 'social_media',
  ADVERTISEMENT = 'advertisement'
}

/**
 * DTO pour créer un nouveau prospect
 */
export class CreateProspectDto {
  @IsString()
  companyName!: string;

  @IsString()
  industry!: string;

  @IsEnum(CompanySize)
  size!: CompanySize;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsString()
  contactPerson!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(ProspectPriority)
  priority?: ProspectPriority;

  @IsOptional()
  @IsEnum(ProspectSource)
  source?: ProspectSource;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: Date;
}

/**
 * DTO pour mettre à jour un prospect
 */
export class UpdateProspectDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(ProspectStatus)
  status?: ProspectStatus;

  @IsOptional()
  @IsEnum(ProspectPriority)
  priority?: ProspectPriority;

  @IsOptional()
  @IsEnum(ProspectSource)
  source?: ProspectSource;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: Date;
}

/**
 * DTO de réponse pour un prospect
 */
export class ProspectResponseDto {
  id!: string;
  companyName!: string;
  industry!: string;
  size!: string;
  revenue?: number;
  contactEmail!: string;
  contactPhone?: string;
  contactPerson!: string;
  address?: string;
  status!: string;
  priority!: string;
  source!: string;
  assignedTo?: string;
  notes!: string;
  tags!: string[];
  lastContactDate?: Date | null;
  nextFollowUpDate?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * DTO pour les requêtes de recherche et filtrage
 */
export class ProspectQueryDto {
  @IsOptional()
  @IsEnum(ProspectStatus)
  status?: ProspectStatus;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @IsOptional()
  @IsEnum(ProspectPriority)
  priority?: ProspectPriority;

  @IsOptional()
  @IsEnum(ProspectSource)
  source?: ProspectSource;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO pour changer le statut d'un prospect
 */
export class ChangeProspectStatusDto {
  @IsEnum(ProspectStatus)
  status!: ProspectStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO pour assigner un prospect
 */
export class AssignProspectDto {
  @IsString()
  assignedTo!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO pour ajouter des notes
 */
export class AddNotesDto {
  @IsString()
  notes!: string;
}

/**
 * DTO pour les statistiques de prospection
 */
export class ProspectStatsResponseDto {
  totalProspects!: number;
  byStatus!: Record<string, number>;
  byIndustry!: Record<string, number>;
  byPriority!: Record<string, number>;
  recentProspects!: number;
  conversionRate!: number;
}