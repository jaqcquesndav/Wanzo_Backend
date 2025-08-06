import { IsString, IsNumber, IsOptional, IsEnum, IsDate, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Types de déclaration selon la documentation
export enum DeclarationType {
  // Impôts directs
  IBP = 'IBP', // Impôt sur les Bénéfices et Profits
  IPR = 'IPR', // Impôt sur le Revenu Professionnel
  IRCM = 'IRCM', // Impôt Réel sur le Chiffre d'Affaires
  IRVM = 'IRVM', // Impôt sur les Revenus de Valeurs Mobilières
  IPF = 'IPF', // Impôt Professionnel Forfaitaire
  
  // Taxes indirectes
  TVA = 'TVA', // Taxe sur la Valeur Ajoutée
  TPI = 'TPI', // Taxe pour la Promotion de l'Industrie
  TCR = 'TCR', // Taxe pour la Circulation Routière
  TE = 'TE', // Taxe Environnementale
  TAD = 'TAD', // Taxe Administrative
  TRD = 'TRD', // Taxe de Rémunération Directe
  
  // Cotisations sociales
  CNSS = 'CNSS', // Cotisations Sociales CNSS
  INPP = 'INPP', // Institut National de Préparation Professionnelle
  ONEM = 'ONEM', // Office National de l'Emploi
  
  // Taxes spécifiques
  TSD = 'TSD', // Taxe de Solidarité pour le Développement
  TPU = 'TPU', // Taxe de Publicité
  TSE = 'TSE', // Taxe sur les Spectacles et Événements
  AUTRES = 'AUTRES', // Autres taxes non catégorisées
}

export enum DeclarationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
}

export enum Periodicity {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

export enum AttachmentType {
  JUSTIFICATION = 'justification',
  DECLARATION_FORM = 'declaration_form',
  SUPPORTING_DOCUMENT = 'supporting_document',
  RECEIPT = 'receipt',
}

export class DeclarationAttachmentDto {
  @ApiProperty({ description: 'Identifiant unique de la pièce jointe' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Nom du fichier' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Type de pièce jointe', enum: AttachmentType })
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @ApiProperty({ description: 'URL du fichier' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Date de téléversement' })
  @IsDate()
  @Type(() => Date)
  uploadedAt: Date;

  @ApiProperty({ description: 'Taille du fichier en octets' })
  @IsNumber()
  size: number;
}

export class CreateDeclarationDto {
  @ApiProperty({ description: 'Type de déclaration', enum: DeclarationType })
  @IsEnum(DeclarationType)
  type: DeclarationType;

  @ApiProperty({ description: 'Période de la déclaration (format YYYY-MM ou YYYY-MM-DD)' })
  @IsString()
  period: string;

  @ApiProperty({ description: 'Montant de la déclaration en CDF' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Frais supplémentaires' })
  @IsOptional()
  @IsNumber()
  additionalFees?: number;

  @ApiPropertyOptional({ description: 'Pénalités' })
  @IsOptional()
  @IsNumber()
  penalties?: number;

  @ApiPropertyOptional({ description: 'Notes et commentaires' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDeclarationDto {
  @ApiPropertyOptional({ description: 'Montant de la déclaration en CDF' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Frais supplémentaires' })
  @IsOptional()
  @IsNumber()
  additionalFees?: number;

  @ApiPropertyOptional({ description: 'Pénalités' })
  @IsOptional()
  @IsNumber()
  penalties?: number;

  @ApiPropertyOptional({ description: 'Notes et commentaires' })
  @IsOptional()
  @IsString()
  notes?: string;
  
  @ApiPropertyOptional({ description: 'URL du document de justification' })
  @IsOptional()
  @IsString()
  justificationDocument?: string;
  
  @ApiPropertyOptional({ description: 'URL du formulaire de déclaration' })
  @IsOptional()
  @IsString()
  declarationForm?: string;
}

export class UpdateDeclarationStatusDto {
  @ApiProperty({ description: 'Nouveau statut de la déclaration', enum: DeclarationStatus })
  @IsEnum(DeclarationStatus)
  status: DeclarationStatus;

  @ApiPropertyOptional({ description: 'Raison du rejet (obligatoire si statut = REJECTED)' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'ID du validateur (obligatoire pour validation)' })
  @IsOptional()
  @IsString()
  validatorId?: string;
}

export class DeclarationFilterDto {
  @ApiPropertyOptional({ description: 'Type de déclaration', enum: DeclarationType })
  @IsOptional()
  @IsEnum(DeclarationType)
  type?: DeclarationType;

  @ApiPropertyOptional({ description: 'Catégorie', enum: ['direct_tax', 'indirect_tax', 'social_contribution', 'special_tax'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Statut', enum: DeclarationStatus })
  @IsOptional()
  @IsEnum(DeclarationStatus)
  status?: DeclarationStatus;

  @ApiPropertyOptional({ description: 'Période' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Page', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Éléments par page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number = 20;
}
