import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Définition des types d'utilisateurs et rôles
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  CUSTOMER_SUPPORT = 'customer_support',
  CONTENT_MANAGER = 'content_manager',
  GROWTH_FINANCE = 'growth_finance',
  CTO = 'cto',
  COMPANY_USER = 'company_user'
}

export enum UserType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

// DTO pour les documents KYC
export class KycDocumentDto {
  @ApiProperty({
    description: 'Type de document',
    example: 'id_card',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Indique si le document a été vérifié',
    example: true,
  })
  @IsOptional()
  verified?: boolean;

  @ApiProperty({
    description: 'Date de téléchargement du document',
    example: '2025-01-10T14:20:00Z',
  })
  @IsDateString()
  @IsOptional()
  uploadedAt?: string;
}

// DTO pour les informations KYC
export class KycInfoDto {
  @ApiProperty({
    description: 'Statut de la vérification KYC',
    example: 'verified',
    enum: ['pending', 'verified', 'rejected'],
  })
  @IsString()
  status: 'pending' | 'verified' | 'rejected';

  @ApiProperty({
    description: 'Date de vérification',
    example: '2025-01-15T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  verifiedAt?: string;

  @ApiProperty({
    description: 'Documents de vérification KYC',
    type: [KycDocumentDto],
  })
  @ValidateNested({ each: true })
  @Type(() => KycDocumentDto)
  @IsOptional()
  documents?: KycDocumentDto[];
}

// DTO pour le profil utilisateur
export class UserProfileDto {
  @ApiProperty({
    description: 'Identifiant unique de l\'utilisateur',
    example: 'google-oauth2|113531686121267070489',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Nom complet de l\'utilisateur',
    example: 'Jacques Ndavaro',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Adresse e-mail de l\'utilisateur',
    example: 'jacquesndav@gmail.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur',
    example: 'super_admin',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Type d\'utilisateur',
    example: 'internal',
    enum: UserType,
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description: 'URL de la photo de profil',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocIL0yfuobxXVunH5BCpbWnpdLSHUsVuD7jtucw_o7UFsafLpyCj=s96-c',
  })
  @IsString()
  @IsOptional()
  picture?: string;

  @ApiProperty({
    description: 'ID du compte client (pour les utilisateurs externes)',
    example: null,
  })
  @IsString()
  @IsOptional()
  customerAccountId?: string | null;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+243123456789',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'ID Agent',
    example: 'IKH12345',
  })
  @IsString()
  @IsOptional()
  idAgent?: string;

  @ApiProperty({
    description: 'Date de fin de validité',
    example: '2026-06-17T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  validityEnd?: string;

  @ApiProperty({
    description: 'Date de création',
    example: '2024-01-10T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-06-15T14:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  updatedAt?: string;

  @ApiProperty({
    description: 'Date de dernière connexion',
    example: '2025-06-17T14:29:09.437Z',
  })
  @IsDateString()
  @IsOptional()
  lastLogin?: string;

  @ApiProperty({
    description: 'Permissions de l\'utilisateur',
    example: ['users:read', 'users:write', 'settings:read', 'settings:write'],
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiProperty({
    description: 'Informations KYC',
    type: KycInfoDto,
  })
  @ValidateNested()
  @Type(() => KycInfoDto)
  @IsOptional()
  kyc?: KycInfoDto;

  @ApiProperty({
    description: 'Langue préférée',
    example: 'fr',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    description: 'Fuseau horaire',
    example: 'Africa/Kinshasa',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}
