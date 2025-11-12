import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CurrencyType } from '../../shared';

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

/**
 * DTO pour les données d'actifs
 */
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
    enum: CurrencyType 
  })
  @IsOptional()
  @IsEnum(CurrencyType)
  devise?: CurrencyType;

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

  @ApiPropertyOptional({ description: 'Localisation physique' })
  @IsOptional()
  @IsString()
  localisation?: string;

  @ApiPropertyOptional({ description: 'Marque ou fabricant' })
  @IsOptional()
  @IsString()
  marque?: string;

  @ApiPropertyOptional({ description: 'Modèle spécifique' })
  @IsOptional()
  @IsString()
  modele?: string;

  @ApiPropertyOptional({ description: 'Numéro de série' })
  @IsOptional()
  @IsString()
  numeroSerie?: string;

  @ApiPropertyOptional({ 
    description: 'Statut de propriété',
    enum: PropertyStatus 
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  statutPropriete?: PropertyStatus;

  @ApiPropertyOptional({ description: 'Coût mensuel si en location/leasing' })
  @IsOptional()
  @IsNumber()
  coutMensuel?: number;

  @ApiPropertyOptional({ description: 'Date d\'expiration du contrat' })
  @IsOptional()
  @IsISO8601()
  dateExpirationContrat?: string;

  @ApiPropertyOptional({ description: 'Fournisseur ou vendeur' })
  @IsOptional()
  @IsString()
  fournisseur?: string;

  @ApiPropertyOptional({ description: 'Durée de garantie (en mois)' })
  @IsOptional()
  @IsNumber()
  dureeGarantie?: number;

  @ApiPropertyOptional({ description: 'Date de fin de garantie' })
  @IsOptional()
  @IsISO8601()
  dateFinGarantie?: string;

  @ApiPropertyOptional({ description: 'Coûts de maintenance annuels' })
  @IsOptional()
  @IsNumber()
  coutMaintenanceAnnuel?: number;

  @ApiPropertyOptional({ description: 'Valeur de dépréciation annuelle' })
  @IsOptional()
  @IsNumber()
  depreciationAnnuelle?: number;

  @ApiPropertyOptional({ description: 'Valeur d\'assurance' })
  @IsOptional()
  @IsNumber()
  valeurAssurance?: number;

  @ApiPropertyOptional({ description: 'Compagnie d\'assurance' })
  @IsOptional()
  @IsString()
  compagnieAssurance?: string;

  @ApiPropertyOptional({ description: 'Numéro de police d\'assurance' })
  @IsOptional()
  @IsString()
  numeroPoliceAssurance?: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration de l\'assurance' })
  @IsOptional()
  @IsISO8601()
  dateExpirationAssurance?: string;

  @ApiPropertyOptional({ description: 'Observations et notes additionnelles' })
  @IsOptional()
  @IsString()
  observations?: string;
}

/**
 * DTO pour la mise à jour des actifs
 */
export class UpdateAssetDataDto extends PartialType(AssetDataDto) {}

/**
 * DTO de réponse pour les actifs
 */
export class AssetResponseDto extends AssetDataDto {
  @ApiProperty({ description: 'Identifiant unique de l\'actif' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ description: 'ID de l\'entreprise propriétaire' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Date de création' })
  @IsOptional()
  @IsISO8601()
  createdAt?: string;

  @ApiPropertyOptional({ description: 'Date de dernière mise à jour' })
  @IsOptional()
  @IsISO8601()
  updatedAt?: string;
}

/**
 * DTO pour créer un actif
 */
export class CreateAssetDto {
  @ApiProperty({ description: 'ID de l\'entreprise' })
  @IsString()
  companyId!: string;

  @ApiProperty({ description: 'Données de l\'actif' })
  asset!: AssetDataDto;
}

/**
 * DTO pour mettre à jour un actif  
 */
export class UpdateAssetDto {
  @ApiProperty({ description: 'ID de l\'entreprise propriétaire de l\'actif' })
  @IsString()
  @IsUUID()
  companyId!: string;

  @ApiProperty({ description: 'ID de l\'actif à mettre à jour' })
  @IsString()
  assetId!: string;

  @ApiProperty({ description: 'Nouvelles données de l\'actif' })
  asset!: UpdateAssetDataDto;
}