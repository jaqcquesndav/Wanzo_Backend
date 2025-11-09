import { IsString, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJournalEntryDto {
  @ApiProperty({ description: 'Code du compte comptable' })
  @IsString()
  accountCode!: string;

  @ApiProperty({ description: 'Description de l\'écriture' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Montant au débit' })
  @IsNumber()
  debitAmount!: number;

  @ApiProperty({ description: 'Montant au crédit' })
  @IsNumber()
  creditAmount!: number;

  @ApiProperty({ description: 'Date de l\'écriture' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: 'Référence de la pièce justificative' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Numéro de la pièce' })
  @IsOptional()
  @IsString()
  pieceNumber?: string;
}

export class UpdateJournalEntryDto {
  @ApiPropertyOptional({ description: 'Code du compte comptable' })
  @IsOptional()
  @IsString()
  accountCode?: string;

  @ApiPropertyOptional({ description: 'Description de l\'écriture' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Montant au débit' })
  @IsOptional()
  @IsNumber()
  debitAmount?: number;

  @ApiPropertyOptional({ description: 'Montant au crédit' })
  @IsOptional()
  @IsNumber()
  creditAmount?: number;

  @ApiPropertyOptional({ description: 'Date de l\'écriture' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Référence de la pièce justificative' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Numéro de la pièce' })
  @IsOptional()
  @IsString()
  pieceNumber?: string;
}

export class JournalEntryQueryDto {
  @ApiPropertyOptional({ description: 'Numéro de la page' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Nombre d\'éléments par page' })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filtrer par code de compte' })
  @IsOptional()
  @IsString()
  accountCode?: string;

  @ApiPropertyOptional({ description: 'Date de début' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Recherche dans la description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tri des résultats', enum: ['date', 'amount', 'account'] })
  @IsOptional()
  @IsEnum(['date', 'amount', 'account'])
  sortBy?: 'date' | 'amount' | 'account';

  @ApiPropertyOptional({ description: 'Ordre de tri', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}