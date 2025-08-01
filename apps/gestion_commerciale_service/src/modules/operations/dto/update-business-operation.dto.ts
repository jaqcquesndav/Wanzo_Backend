import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OperationStatus } from '../entities/business-operation.entity';

export class UpdateBusinessOperationDto {
  @ApiPropertyOptional({ description: 'Description de l\'opération', example: 'Vente de produits informatiques mise à jour' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Date de l\'opération', example: '2023-08-01T12:30:00.000Z' })
  @IsISO8601()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({ description: 'Montant en francs congolais (CDF)', example: 150000.00 })
  @IsOptional()
  amountCdf?: number;

  @ApiPropertyOptional({ description: 'Montant en dollars américains (USD)', example: 75.00 })
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

  @ApiPropertyOptional({ description: 'Statut de l\'opération', enum: OperationStatus, example: OperationStatus.COMPLETED })
  @IsEnum(OperationStatus)
  @IsOptional()
  status?: OperationStatus;

  @ApiPropertyOptional({ description: 'Notes supplémentaires', example: 'Paiement en plusieurs tranches' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Données supplémentaires spécifiques au type d\'opération' })
  @IsOptional()
  additionalData?: any;
}
