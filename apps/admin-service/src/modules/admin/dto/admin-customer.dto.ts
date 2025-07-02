import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Enum pour les types d'actions administratives sur les clients
 */
export enum CustomerAdminActionType {
  VALIDATE = 'validate',
  SUSPEND = 'suspend',
  REACTIVATE = 'reactivate',
  UPDATE_LIMITS = 'update_limits',
}

/**
 * DTO pour les actions administratives sur un client
 */
export class AdminCustomerActionDto {
  @ApiProperty({
    description: 'ID de l\'administrateur effectuant l\'action',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsNotEmpty()
  @IsUUID()
  adminId!: string;

  @ApiPropertyOptional({
    description: 'Raison de l\'action (obligatoire pour suspension)',
    example: 'Non-respect des conditions d\'utilisation'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Détails supplémentaires sur l\'action',
    example: { notes: 'Suite à plusieurs signalements', reviewer: 'Équipe conformité' }
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}

/**
 * DTO pour la mise à jour des données d'un client par l'administrateur
 */
export class AdminCustomerUpdateDto {
  @ApiPropertyOptional({
    description: 'Nom du client',
    example: 'Enterprise Solutions Inc.'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Email du client',
    example: 'contact@enterprise-solutions.com'
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone',
    example: '+33123456789'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Adresse',
    example: '123 Business Avenue'
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Ville',
    example: 'Paris'
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Pays',
    example: 'France'
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Allocation de tokens',
    example: 10000
  })
  @IsOptional()
  tokenAllocation?: number;

  @ApiPropertyOptional({
    description: 'Type de compte',
    example: 'premium',
    enum: ['freemium', 'standard', 'premium', 'enterprise']
  })
  @IsOptional()
  @IsEnum(['freemium', 'standard', 'premium', 'enterprise'])
  accountType?: string;

  @ApiPropertyOptional({
    description: 'Préférences du client',
    example: { notificationEnabled: true, language: 'fr' }
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}
