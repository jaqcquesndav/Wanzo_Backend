import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OperationType } from '../entities/business-operation.entity';

export class ExportOperationsDto {
  @ApiPropertyOptional({ description: 'Type d\'opération', enum: OperationType, example: OperationType.SALE })
  @IsEnum(OperationType)
  @IsOptional()
  type?: OperationType;

  @ApiProperty({ description: 'Date de début', example: '2023-08-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Date de fin', example: '2023-08-31' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ description: 'ID du client ou fournisseur lié', example: 'customer-123' })
  @IsString()
  @IsOptional()
  relatedPartyId?: string;

  @ApiPropertyOptional({ description: 'Statut de l\'opération', example: 'completed' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Format d\'export', enum: ['pdf', 'excel'], example: 'pdf' })
  @IsString()
  @IsNotEmpty()
  format: 'pdf' | 'excel';

  @ApiPropertyOptional({ description: 'Inclure les détails des opérations', example: true })
  @IsOptional()
  includeDetails?: boolean = false;

  @ApiPropertyOptional({ description: 'Regroupement', enum: ['date', 'type', 'party'], example: 'date' })
  @IsString()
  @IsOptional()
  groupBy?: 'date' | 'type' | 'party' = 'date';
}
