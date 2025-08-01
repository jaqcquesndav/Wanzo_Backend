import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { OperationType, OperationStatus } from '../entities/business-operation.entity';

export class ListBusinessOperationsDto {
  @ApiPropertyOptional({ description: 'Filtrer par type d\'opération', enum: OperationType })
  @IsEnum(OperationType)
  @IsOptional()
  type?: OperationType;

  @ApiPropertyOptional({ description: 'Date de début (format: YYYY-MM-DD)', example: '2023-08-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (format: YYYY-MM-DD)', example: '2023-08-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID du client ou fournisseur lié', example: 'customer-123' })
  @IsString()
  @IsOptional()
  relatedPartyId?: string;

  @ApiPropertyOptional({ description: 'Statut de l\'opération', enum: OperationStatus })
  @IsEnum(OperationStatus)
  @IsOptional()
  status?: OperationStatus;

  @ApiPropertyOptional({ description: 'Montant minimum', example: 1000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Montant maximum', example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Champ de tri', example: 'date', enum: ['date', 'amount', 'relatedPartyName', 'status'] })
  @IsString()
  @IsOptional()
  sortBy?: string = 'date';

  @ApiPropertyOptional({ description: 'Ordre de tri', example: 'desc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Numéro de page pour la pagination', example: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre d\'éléments par page', example: 10 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
