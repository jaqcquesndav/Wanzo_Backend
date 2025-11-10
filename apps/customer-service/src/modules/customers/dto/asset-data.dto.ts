import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AssetType {
  IMMOBILIER = 'immobilier',
  VEHICULE = 'vehicule', 
  EQUIPEMENT = 'equipement',
  AUTRE = 'autre'
}

export enum AssetState {
  NEUF = 'neuf',
  EXCELLENT = 'excellent',
  BON = 'bon', 
  MOYEN = 'moyen',
  MAUVAIS = 'mauvais',
  DETERIORE = 'deteriore'
}

export enum PropertyStatus {
  PROPRE = 'propre',
  LOCATION = 'location',
  LEASING = 'leasing',
  EMPRUNT = 'emprunt'
}

export class AssetDataDto {
  @ApiProperty({ description: 'Désignation de l\'actif' })
  @IsString()
  designation!: string;

  @ApiProperty({ 
    description: 'Type d\'actif',
    enum: AssetType 
  })
  @IsEnum(AssetType)
  type!: AssetType;

  @ApiPropertyOptional({ description: 'Description détaillée de l\'actif' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Prix d\'achat original' })
  @IsOptional()
  @IsNumber()
  prixAchat?: number;

  @ApiPropertyOptional({ description: 'Valeur actuelle estimée' })
  @IsOptional()
  @IsNumber()
  valeurActuelle?: number;

  @ApiPropertyOptional({ 
    description: 'Devise',
    enum: ['USD', 'CDF', 'EUR'],
    default: 'USD'
  })
  @IsOptional()
  @IsString()
  devise?: 'USD' | 'CDF' | 'EUR';

  @ApiPropertyOptional({ description: 'Date d\'acquisition (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  dateAcquisition?: string;

  @ApiPropertyOptional({ 
    description: 'État actuel de l\'actif',
    enum: AssetState 
  })
  @IsOptional()
  @IsEnum(AssetState)
  etatActuel?: AssetState;

  @ApiPropertyOptional({ description: 'Localisation de l\'actif' })
  @IsOptional()
  @IsString()
  localisation?: string;

  @ApiPropertyOptional({ description: 'Numéro de série' })
  @IsOptional()
  @IsString()
  numeroSerie?: string;

  @ApiPropertyOptional({ description: 'Marque' })
  @IsOptional()
  @IsString()
  marque?: string;

  @ApiPropertyOptional({ description: 'Modèle' })
  @IsOptional()
  @IsString()
  modele?: string;

  @ApiPropertyOptional({ description: 'Quantité' })
  @IsOptional()
  @IsNumber()
  quantite?: number;

  @ApiPropertyOptional({ description: 'Unité de mesure' })
  @IsOptional()
  @IsString()
  unite?: string;

  @ApiPropertyOptional({ 
    description: 'Statut de propriété',
    enum: PropertyStatus 
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  proprietaire?: PropertyStatus;

  @ApiPropertyOptional({ description: 'Observations' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateAssetDataDto {
  @ApiPropertyOptional({ description: 'Désignation de l\'actif' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ 
    description: 'Type d\'actif',
    enum: AssetType 
  })
  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;

  @ApiPropertyOptional({ description: 'Description détaillée de l\'actif' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Prix d\'achat original' })
  @IsOptional()
  @IsNumber()
  prixAchat?: number;

  @ApiPropertyOptional({ description: 'Valeur actuelle estimée' })
  @IsOptional()
  @IsNumber()
  valeurActuelle?: number;

  @ApiPropertyOptional({ 
    description: 'Devise',
    enum: ['USD', 'CDF', 'EUR']
  })
  @IsOptional()
  @IsString()
  devise?: 'USD' | 'CDF' | 'EUR';

  @ApiPropertyOptional({ description: 'Date d\'acquisition (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  dateAcquisition?: string;

  @ApiPropertyOptional({ 
    description: 'État actuel de l\'actif',
    enum: AssetState 
  })
  @IsOptional()
  @IsEnum(AssetState)
  etatActuel?: AssetState;

  @ApiPropertyOptional({ description: 'Localisation de l\'actif' })
  @IsOptional()
  @IsString()
  localisation?: string;

  @ApiPropertyOptional({ description: 'Numéro de série' })
  @IsOptional()
  @IsString()
  numeroSerie?: string;

  @ApiPropertyOptional({ description: 'Marque' })
  @IsOptional()
  @IsString()
  marque?: string;

  @ApiPropertyOptional({ description: 'Modèle' })
  @IsOptional()
  @IsString()
  modele?: string;

  @ApiPropertyOptional({ description: 'Quantité' })
  @IsOptional()
  @IsNumber()
  quantite?: number;

  @ApiPropertyOptional({ description: 'Unité de mesure' })
  @IsOptional()
  @IsString()
  unite?: string;

  @ApiPropertyOptional({ 
    description: 'Statut de propriété',
    enum: PropertyStatus 
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  proprietaire?: PropertyStatus;

  @ApiPropertyOptional({ description: 'Observations' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class AssetResponseDto extends AssetDataDto {
  @ApiProperty({ description: 'ID unique de l\'actif' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updatedAt!: Date;
}