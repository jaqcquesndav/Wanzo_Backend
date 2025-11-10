import { IsString, IsEnum, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VerificationMethod {
  SMS = 'sms',
  CALL = 'call'
}

export class InitiatePhoneVerificationDto {
  @ApiProperty({ description: 'Numéro de téléphone à vérifier' })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ 
    description: 'Méthode de vérification',
    enum: VerificationMethod,
    default: VerificationMethod.SMS
  })
  @IsEnum(VerificationMethod)
  method!: VerificationMethod;
}

export class ConfirmPhoneVerificationDto {
  @ApiProperty({ description: 'ID de vérification reçu lors de l\'initiation' })
  @IsUUID()
  verificationId!: string;

  @ApiProperty({ description: 'Code de vérification reçu par SMS/appel' })
  @IsString()
  code!: string;
}

export class PhoneVerificationResponseDto {
  @ApiProperty({ description: 'ID de vérification' })
  verificationId!: string;

  @ApiProperty({ description: 'Numéro de téléphone' })
  phoneNumber!: string;

  @ApiProperty({ description: 'Méthode utilisée' })
  method!: VerificationMethod;

  @ApiProperty({ description: 'Date d\'expiration' })
  expiresAt!: string;

  @ApiProperty({ description: 'Tentatives restantes' })
  attemptsRemaining!: number;
}

export class PhoneVerificationConfirmResponseDto {
  @ApiProperty({ description: 'Numéro de téléphone' })
  phoneNumber!: string;

  @ApiProperty({ description: 'Statut de vérification' })
  verified!: boolean;

  @ApiProperty({ description: 'Date de vérification' })
  verifiedAt!: string;
}

export enum DocumentType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license',
  RESIDENCE_PERMIT = 'residence_permit',
  OTHER = 'other'
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export class UploadIdentityDocumentDto {
  @ApiProperty({ 
    description: 'Type de document',
    enum: DocumentType 
  })
  @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiProperty({ description: 'Numéro du document' })
  @IsString()
  number!: string;

  @ApiPropertyOptional({ description: 'Date d\'émission (ISO 8601)' })
  @IsOptional()
  @IsString()
  issuedDate?: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration (ISO 8601)' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Autorité d\'émission' })
  @IsOptional()
  @IsString()
  issuingAuthority?: string;
}

export class IdentityDocumentResponseDto {
  @ApiProperty({ description: 'ID du document' })
  id!: string;

  @ApiProperty({ description: 'Type de document' })
  type!: DocumentType;

  @ApiProperty({ description: 'Numéro du document' })
  number!: string;

  @ApiPropertyOptional({ description: 'URL du document uploadé' })
  @IsOptional()
  documentUrl?: string;

  @ApiProperty({ description: 'Statut de vérification' })
  status!: DocumentStatus;

  @ApiProperty({ description: 'Date d\'upload' })
  uploadedAt!: string;

  @ApiPropertyOptional({ description: 'Temps de traitement estimé' })
  @IsOptional()
  estimatedProcessingTime?: string;
}

export class DocumentVerificationStatusDto {
  @ApiProperty({ description: 'Statut de vérification' })
  status!: DocumentStatus;

  @ApiPropertyOptional({ description: 'Date de vérification' })
  @IsOptional()
  verifiedAt?: string;

  @ApiPropertyOptional({ description: 'Vérifié par' })
  @IsOptional()
  verifiedBy?: string;

  @ApiPropertyOptional({ description: 'Niveau de confiance (0-1)' })
  @IsOptional()
  confidence?: number;

  @ApiPropertyOptional({ description: 'Détails de vérification' })
  @IsOptional()
  details?: {
    documentQuality?: string;
    faceMatch?: boolean;
    dataConsistency?: boolean;
  };
}

export class AvatarUploadResponseDto {
  @ApiProperty({ description: 'URL de la nouvelle photo de profil' })
  picture!: string;

  @ApiPropertyOptional({ description: 'Miniatures générées' })
  @IsOptional()
  thumbnails?: {
    small?: string;
    medium?: string;
  };

  @ApiProperty({ description: 'Date d\'upload' })
  uploadedAt!: string;
}

export class UserSessionDto {
  @ApiProperty({ description: 'ID de session' })
  id!: string;

  @ApiProperty({ description: 'Informations sur l\'appareil' })
  device!: string;

  @ApiProperty({ description: 'Adresse IP' })
  ipAddress!: string;

  @ApiProperty({ description: 'Localisation' })
  location!: string;

  @ApiProperty({ description: 'Session actuelle' })
  isCurrent!: boolean;

  @ApiProperty({ description: 'Dernière activité' })
  lastActivity!: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt!: string;
}

export class Enable2FADto {
  @ApiProperty({ 
    description: 'Méthode 2FA',
    enum: ['app', 'sms'],
    default: 'app'
  })
  @IsEnum(['app', 'sms'])
  method!: 'app' | 'sms';

  @ApiPropertyOptional({ description: 'Générer des codes de sauvegarde' })
  @IsOptional()
  @IsBoolean()
  backupCodes?: boolean;
}

export class Enable2FAResponseDto {
  @ApiPropertyOptional({ description: 'QR Code pour l\'app authenticator' })
  @IsOptional()
  qrCode?: string;

  @ApiPropertyOptional({ description: 'Secret pour configuration manuelle' })
  @IsOptional()
  secret?: string;

  @ApiPropertyOptional({ description: 'Codes de sauvegarde' })
  @IsOptional()
  backupCodes?: string[];

  @ApiProperty({ description: '2FA activé' })
  enabled!: boolean;

  @ApiProperty({ description: 'Nécessite confirmation' })
  requiresConfirmation!: boolean;
}