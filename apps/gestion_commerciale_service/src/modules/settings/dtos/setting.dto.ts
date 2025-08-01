import { IsString, IsBoolean, IsOptional, IsObject, IsEnum, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SettingCategory } from '../entities/setting.entity';

export class CreateSettingDto {
  @ApiProperty({
    description: 'Clé du paramètre',
    example: 'invoice_prefix'
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Catégorie du paramètre',
    enum: SettingCategory,
    example: SettingCategory.INVOICE
  })
  @IsEnum(SettingCategory)
  @IsOptional()
  category?: SettingCategory = SettingCategory.GENERAL;

  @ApiProperty({
    description: 'Valeur du paramètre (en JSON)',
    example: { prefix: 'FACT-', startNumber: 1000 }
  })
  @IsObject()
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({
    description: 'Description du paramètre',
    example: 'Préfixe et numéro de départ pour les factures'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Visibilité publique du paramètre',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;
}

export class UpdateSettingDto {
  @ApiProperty({
    description: 'Valeur du paramètre (en JSON)',
    example: { prefix: 'FACT-', startNumber: 2000 }
  })
  @IsObject()
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({
    description: 'Description du paramètre',
    example: 'Préfixe et numéro de départ pour les factures'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Visibilité publique du paramètre',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// DTOs pour les paramètres spécifiques
export class InvoiceSettingsDto {
  @ApiProperty({
    description: 'Préfixe des factures',
    example: 'FACT-'
  })
  @IsString()
  prefix: string;

  @ApiProperty({
    description: 'Numéro de départ des factures',
    example: 1000
  })
  @IsNotEmpty()
  startNumber: number;

  @ApiPropertyOptional({
    description: 'Notes par défaut à afficher sur les factures',
    example: 'Merci pour votre confiance'
  })
  @IsOptional()
  @IsString()
  defaultNotes?: string;

  @ApiPropertyOptional({
    description: 'Conditions de paiement par défaut (en jours)',
    example: 30
  })
  @IsOptional()
  paymentTerms?: number;
}

export class GeneralSettingsDto {
  @ApiProperty({
    description: 'Nom de l\'application',
    example: 'Gestion Commerciale Pro'
  })
  @IsString()
  applicationName: string;

  @ApiProperty({
    description: 'Devise par défaut',
    example: 'EUR'
  })
  @IsString()
  defaultCurrency: string;

  @ApiPropertyOptional({
    description: 'Fuseau horaire par défaut',
    example: 'Europe/Paris'
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Format de date par défaut',
    example: 'DD/MM/YYYY'
  })
  @IsOptional()
  @IsString()
  dateFormat?: string;
}

export class SecuritySettingsDto {
  @ApiProperty({
    description: 'Durée de validité du token JWT (en minutes)',
    example: 60
  })
  @IsNotEmpty()
  tokenExpiration: number;

  @ApiPropertyOptional({
    description: 'Nombre maximal de tentatives de connexion',
    example: 5
  })
  @IsOptional()
  maxLoginAttempts?: number;

  @ApiPropertyOptional({
    description: 'Durée du verrouillage du compte après échec (en minutes)',
    example: 30
  })
  @IsOptional()
  lockoutDuration?: number;

  @ApiPropertyOptional({
    description: 'Exiger l\'authentification à deux facteurs',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  require2FA?: boolean;
}
