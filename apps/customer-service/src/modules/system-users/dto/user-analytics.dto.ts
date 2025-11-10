import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserEngagementDto {
  @ApiProperty({ description: 'Date de dernière connexion' })
  lastLoginDate!: string;

  @ApiProperty({ description: 'Série de connexions consécutives' })
  loginStreak!: number;

  @ApiProperty({ description: 'Nombre total de connexions' })
  totalLogins!: number;

  @ApiProperty({ description: 'Durée moyenne de session (secondes)' })
  averageSessionDuration!: number;

  @ApiProperty({ description: 'Nombre de fonctionnalités utilisées' })
  featuresUsed!: number;

  @ApiProperty({ description: 'Nombre de documents traités' })
  documentsProcessed!: number;
}

export class UserUsageDto {
  @ApiProperty({ description: 'Utilisation de l\'abonnement (0-1)' })
  subscriptionUtilization!: number;

  @ApiProperty({ description: 'Fonctionnalités favorites' })
  @IsArray()
  favoriteFeatures!: string[];

  @ApiPropertyOptional({ description: 'Activité mensuelle' })
  @IsOptional()
  monthlyActivity?: {
    documentsAnalyzed?: number;
    reportsGenerated?: number;
    aiConversations?: number;
  };
}

export class UserProgressDto {
  @ApiProperty({ description: 'Complétude du profil (0-1)' })
  profileCompleteness!: number;

  @ApiProperty({ description: 'Niveau de vérification' })
  verificationLevel!: string;

  @ApiProperty({ description: 'Progression de l\'onboarding (0-1)' })
  onboardingProgress!: number;

  @ApiProperty({ description: 'Niveau de compétence' })
  skillLevel!: string;
}

export class UserAnalyticsResponseDto {
  @ApiProperty({ description: 'Métriques d\'engagement' })
  engagement!: UserEngagementDto;

  @ApiProperty({ description: 'Données d\'utilisation' })
  usage!: UserUsageDto;

  @ApiProperty({ description: 'Progression utilisateur' })
  progress!: UserProgressDto;
}

export enum AuditAction {
  PROFILE_UPDATE = 'profile_update',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_CHANGE = 'email_change',
  PHONE_VERIFICATION = 'phone_verification',
  DOCUMENT_UPLOAD = 'document_upload',
  COMPANY_CREATE = 'company_create',
  COMPANY_UPDATE = 'company_update',
  SUBSCRIPTION_CHANGE = 'subscription_change',
  PERMISSION_CHANGE = 'permission_change'
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending'
}

export class AuditLogEntryDto {
  @ApiProperty({ description: 'ID de l\'entrée d\'audit' })
  id!: string;

  @ApiProperty({ 
    description: 'Action effectuée',
    enum: AuditAction 
  })
  action!: AuditAction;

  @ApiPropertyOptional({ description: 'Détails de l\'action' })
  @IsOptional()
  details?: {
    fieldsChanged?: string[];
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    location?: string;
    metadata?: Record<string, any>;
  };

  @ApiProperty({ description: 'Date et heure de l\'action' })
  timestamp!: string;

  @ApiProperty({ 
    description: 'Statut de l\'action',
    enum: AuditStatus 
  })
  status!: AuditStatus;
}

export class AuditLogQueryDto {
  @ApiPropertyOptional({ description: 'Limite du nombre d\'entrées' })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Décalage pour pagination' })
  @IsOptional()
  @IsNumber()
  offset?: number;

  @ApiPropertyOptional({ 
    description: 'Filtrer par action',
    enum: AuditAction 
  })
  @IsOptional()
  action?: AuditAction;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export enum SecurityAlertType {
  UNUSUAL_LOCATION = 'unusual_location',
  MULTIPLE_DEVICES = 'multiple_devices',
  RAPID_REQUESTS = 'rapid_requests',
  PERMISSION_ESCALATION = 'permission_escalation'
}

export enum SecurityAlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export class SecurityAlertDto {
  @ApiProperty({ 
    description: 'Type d\'alerte',
    enum: SecurityAlertType 
  })
  type!: SecurityAlertType;

  @ApiProperty({ 
    description: 'Niveau de sévérité',
    enum: SecurityAlertSeverity 
  })
  severity!: SecurityAlertSeverity;

  @ApiProperty({ description: 'Description de l\'alerte' })
  description!: string;

  @ApiProperty({ description: 'Date et heure de l\'alerte' })
  timestamp!: string;

  @ApiProperty({ description: 'Action recommandée' })
  recommended_action!: string;

  @ApiProperty({ description: 'Résolu automatiquement' })
  auto_resolved!: boolean;
}