import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StockCategory {
  MATIERE_PREMIERE = 'matiere_premiere',
  PRODUIT_SEMI_FINI = 'produit_semi_fini',
  PRODUIT_FINI = 'produit_fini',
  FOURNITURE = 'fourniture',
  EMBALLAGE = 'emballage',
  AUTRE = 'autre'
}

export enum StockState {
  EXCELLENT = 'excellent',
  BON = 'bon',
  MOYEN = 'moyen',
  DETERIORE = 'deteriore',
  PERIME = 'perime'
}

export class StockDataDto {
  @ApiProperty({ description: 'Désignation du stock' })
  @IsString()
  designation!: string;

  @ApiProperty({ 
    description: 'Catégorie de stock',
    enum: StockCategory 
  })
  @IsEnum(StockCategory)
  categorie!: StockCategory;

  @ApiPropertyOptional({ description: 'Description détaillée du stock' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Quantité en stock' })
  @IsNumber()
  quantiteStock!: number;

  @ApiProperty({ description: 'Unité de mesure' })
  @IsString()
  unite!: string;

  @ApiPropertyOptional({ description: 'Seuil minimum' })
  @IsOptional()
  @IsNumber()
  seuilMinimum?: number;

  @ApiPropertyOptional({ description: 'Seuil maximum' })
  @IsOptional()
  @IsNumber()
  seuilMaximum?: number;

  @ApiProperty({ description: 'Coût unitaire' })
  @IsNumber()
  coutUnitaire!: number;

  @ApiProperty({ description: 'Valeur totale du stock (calculée automatiquement)' })
  @IsNumber()
  valeurTotaleStock!: number;

  @ApiProperty({ 
    description: 'Devise',
    enum: ['USD', 'CDF', 'EUR'],
    default: 'USD'
  })
  @IsString()
  devise!: 'USD' | 'CDF' | 'EUR';

  @ApiPropertyOptional({ description: 'Date du dernier inventaire (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  dateDernierInventaire?: string;

  @ApiPropertyOptional({ description: 'Durée de rotation moyenne (en jours)' })
  @IsOptional()
  @IsNumber()
  dureeRotationMoyenne?: number;

  @ApiPropertyOptional({ description: 'Date de péremption (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  datePeremption?: string;

  @ApiPropertyOptional({ description: 'Emplacement de stockage' })
  @IsOptional()
  @IsString()
  emplacement?: string;

  @ApiPropertyOptional({ description: 'Conditions de stockage' })
  @IsOptional()
  @IsString()
  conditionsStockage?: string;

  @ApiPropertyOptional({ description: 'Fournisseur principal' })
  @IsOptional()
  @IsString()
  fournisseurPrincipal?: string;

  @ApiPropertyOptional({ description: 'Numéro de lot' })
  @IsOptional()
  @IsString()
  numeroLot?: string;

  @ApiPropertyOptional({ description: 'Code article' })
  @IsOptional()
  @IsString()
  codeArticle?: string;

  @ApiProperty({ 
    description: 'État du stock',
    enum: StockState 
  })
  @IsEnum(StockState)
  etatStock!: StockState;

  @ApiPropertyOptional({ description: 'Observations' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateStockDataDto {
  @ApiPropertyOptional({ description: 'Désignation du stock' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ 
    description: 'Catégorie de stock',
    enum: StockCategory 
  })
  @IsOptional()
  @IsEnum(StockCategory)
  categorie?: StockCategory;

  @ApiPropertyOptional({ description: 'Description détaillée du stock' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Quantité en stock' })
  @IsOptional()
  @IsNumber()
  quantiteStock?: number;

  @ApiPropertyOptional({ description: 'Unité de mesure' })
  @IsOptional()
  @IsString()
  unite?: string;

  @ApiPropertyOptional({ description: 'Seuil minimum' })
  @IsOptional()
  @IsNumber()
  seuilMinimum?: number;

  @ApiPropertyOptional({ description: 'Seuil maximum' })
  @IsOptional()
  @IsNumber()
  seuilMaximum?: number;

  @ApiPropertyOptional({ description: 'Coût unitaire' })
  @IsOptional()
  @IsNumber()
  coutUnitaire?: number;

  @ApiPropertyOptional({ description: 'Valeur totale du stock' })
  @IsOptional()
  @IsNumber()
  valeurTotaleStock?: number;

  @ApiPropertyOptional({ 
    description: 'Devise',
    enum: ['USD', 'CDF', 'EUR']
  })
  @IsOptional()
  @IsString()
  devise?: 'USD' | 'CDF' | 'EUR';

  @ApiPropertyOptional({ description: 'Date du dernier inventaire (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  dateDernierInventaire?: string;

  @ApiPropertyOptional({ description: 'Durée de rotation moyenne (en jours)' })
  @IsOptional()
  @IsNumber()
  dureeRotationMoyenne?: number;

  @ApiPropertyOptional({ description: 'Date de péremption (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  datePeremption?: string;

  @ApiPropertyOptional({ description: 'Emplacement de stockage' })
  @IsOptional()
  @IsString()
  emplacement?: string;

  @ApiPropertyOptional({ description: 'Conditions de stockage' })
  @IsOptional()
  @IsString()
  conditionsStockage?: string;

  @ApiPropertyOptional({ description: 'Fournisseur principal' })
  @IsOptional()
  @IsString()
  fournisseurPrincipal?: string;

  @ApiPropertyOptional({ description: 'Numéro de lot' })
  @IsOptional()
  @IsString()
  numeroLot?: string;

  @ApiPropertyOptional({ description: 'Code article' })
  @IsOptional()
  @IsString()
  codeArticle?: string;

  @ApiPropertyOptional({ 
    description: 'État du stock',
    enum: StockState 
  })
  @IsOptional()
  @IsEnum(StockState)
  etatStock?: StockState;

  @ApiPropertyOptional({ description: 'Observations' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class StockResponseDto extends StockDataDto {
  @ApiProperty({ description: 'ID unique du stock' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updatedAt!: Date;
}