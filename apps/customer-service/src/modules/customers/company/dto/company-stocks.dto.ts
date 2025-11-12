import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CurrencyType } from '../../shared';

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

/**
 * DTO pour les données de stock
 */
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

  @ApiProperty({ description: 'Valeur totale du stock' })
  @IsNumber()
  valeurTotaleStock!: number;

  @ApiProperty({ 
    description: 'Devise',
    enum: CurrencyType 
  })
  @IsEnum(CurrencyType)
  devise!: CurrencyType;

  @ApiPropertyOptional({ 
    description: 'État du stock',
    enum: StockState 
  })
  @IsOptional()
  @IsEnum(StockState)
  etatStock?: StockState;

  @ApiPropertyOptional({ description: 'Date d\'entrée en stock' })
  @IsOptional()
  @IsISO8601()
  dateEntreeStock?: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration' })
  @IsOptional()
  @IsISO8601()
  dateExpiration?: string;

  @ApiPropertyOptional({ description: 'Numéro de lot' })
  @IsOptional()
  @IsString()
  numeroLot?: string;

  @ApiPropertyOptional({ description: 'Fournisseur principal' })
  @IsOptional()
  @IsString()
  fournisseurPrincipal?: string;

  @ApiPropertyOptional({ description: 'Référence fournisseur' })
  @IsOptional()
  @IsString()
  referenceFournisseur?: string;

  @ApiPropertyOptional({ description: 'Emplacement dans l\'entrepôt' })
  @IsOptional()
  @IsString()
  emplacementEntrepot?: string;

  @ApiPropertyOptional({ description: 'Code-barres ou QR code' })
  @IsOptional()
  @IsString()
  codeBarres?: string;

  @ApiPropertyOptional({ description: 'Rotation du stock (par an)' })
  @IsOptional()
  @IsNumber()
  rotationStock?: number;

  @ApiPropertyOptional({ description: 'Durée moyenne de stockage (jours)' })
  @IsOptional()
  @IsNumber()
  dureeMoyenneStockage?: number;

  @ApiPropertyOptional({ description: 'Coût de stockage mensuel' })
  @IsOptional()
  @IsNumber()
  coutStockageMensuel?: number;

  @ApiPropertyOptional({ description: 'Quantité réservée' })
  @IsOptional()
  @IsNumber()
  quantiteReservee?: number;

  @ApiPropertyOptional({ description: 'Quantité disponible' })
  @IsOptional()
  @IsNumber()
  quantiteDisponible?: number;

  @ApiPropertyOptional({ description: 'Dernière mise à jour inventaire' })
  @IsOptional()
  @IsISO8601()
  derniereMiseAJourInventaire?: string;

  @ApiPropertyOptional({ description: 'Responsable du stock' })
  @IsOptional()
  @IsString()
  responsableStock?: string;

  @ApiPropertyOptional({ description: 'Observations et notes' })
  @IsOptional()
  @IsString()
  observations?: string;
}

/**
 * DTO pour la mise à jour des stocks
 */
export class UpdateStockDataDto extends PartialType(StockDataDto) {}

/**
 * DTO de réponse pour les stocks
 */
export class StockResponseDto extends StockDataDto {
  @ApiProperty({ description: 'Identifiant unique du stock' })
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
 * DTO pour créer un stock
 */
export class CreateStockDto {
  @ApiProperty({ description: 'ID de l\'entreprise' })
  @IsString()
  companyId!: string;

  @ApiProperty({ description: 'Données du stock' })
  stock!: StockDataDto;
}

/**
 * DTO pour mettre à jour un stock
 */
export class UpdateStockDto {
  @ApiProperty({ description: 'ID de l\'entreprise propriétaire du stock' })
  @IsString()
  @IsUUID()
  companyId!: string;

  @ApiProperty({ description: 'ID du stock à mettre à jour' })
  @IsString()
  stockId!: string;

  @ApiProperty({ description: 'Nouvelles données du stock' })
  stock!: UpdateStockDataDto;
}

/**
 * DTO pour les mouvements de stock
 */
export class StockMovementDto {
  @ApiProperty({ description: 'ID du stock concerné' })
  @IsString()
  stockId!: string;

  @ApiProperty({ description: 'Type de mouvement' })
  @IsEnum(['entree', 'sortie', 'transfert', 'ajustement'])
  typeMouvement!: 'entree' | 'sortie' | 'transfert' | 'ajustement';

  @ApiProperty({ description: 'Quantité du mouvement' })
  @IsNumber()
  quantite!: number;

  @ApiPropertyOptional({ description: 'Motif du mouvement' })
  @IsOptional()
  @IsString()
  motif?: string;

  @ApiPropertyOptional({ description: 'Référence document (bon, facture...)' })
  @IsOptional()
  @IsString()
  referenceDocument?: string;

  @ApiPropertyOptional({ description: 'Responsable du mouvement' })
  @IsOptional()
  @IsString()
  responsable?: string;

  @ApiPropertyOptional({ description: 'Date du mouvement' })
  @IsOptional()
  @IsISO8601()
  dateMouvement?: string;
}