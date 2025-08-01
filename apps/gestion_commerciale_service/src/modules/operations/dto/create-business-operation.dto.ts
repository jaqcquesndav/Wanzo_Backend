import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsDate, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { OperationType, OperationStatus, PaymentMethod } from '../entities/business-operation.entity';

export class CreateBusinessOperationDto {
  @ApiProperty({ description: 'Type d\'opération', enum: OperationType, example: 'sale' })
  @IsEnum(OperationType)
  @IsNotEmpty()
  type: OperationType;

  @ApiProperty({ description: 'Date de l\'opération', example: '2023-08-01T12:30:00.000Z' })
  @IsISO8601()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ description: 'Description de l\'opération', example: 'Vente de produits informatiques' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'ID de l\'entité associée (vente, dépense, etc.)', example: 'sale-123456' })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiProperty({ description: 'Montant en francs congolais (CDF)', example: 150000.00 })
  @IsNumber()
  @IsNotEmpty()
  amountCdf: number;

  @ApiPropertyOptional({ description: 'Montant en dollars américains (USD)', example: 75.00 })
  @IsNumber()
  @IsOptional()
  amountUsd?: number;

  @ApiPropertyOptional({ description: 'ID de la partie liée (client, fournisseur)', example: 'customer-456789' })
  @IsString()
  @IsOptional()
  relatedPartyId?: string;

  @ApiPropertyOptional({ description: 'Nom de la partie liée', example: 'Entreprise ABC' })
  @IsString()
  @IsOptional()
  relatedPartyName?: string;

  @ApiPropertyOptional({ description: 'Statut de l\'opération', enum: OperationStatus, example: 'completed', default: 'pending' })
  @IsEnum(OperationStatus)
  @IsOptional()
  status?: OperationStatus = OperationStatus.PENDING;

  @ApiPropertyOptional({ description: 'Méthode de paiement', enum: PaymentMethod, example: 'cash' })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'ID de la catégorie (pour les dépenses)', example: 'category-123' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Nombre de produits (pour les ventes)', example: 5 })
  @IsNumber()
  @IsOptional()
  productCount?: number;

  @ApiPropertyOptional({ description: 'Notes supplémentaires', example: 'Paiement en plusieurs tranches' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Données supplémentaires spécifiques au type d\'opération' })
  @IsOptional()
  additionalData?: any;
}
