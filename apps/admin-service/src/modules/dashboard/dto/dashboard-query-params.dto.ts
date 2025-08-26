import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Date de début pour les calculs',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Date de fin pour les calculs',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Période pour les calculs',
    example: 'monthly',
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
  })
  @IsOptional()
  @IsString()
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @ApiPropertyOptional({
    description: 'ID de l\'entreprise pour filtrer les données',
    example: 'company-uuid'
  })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Type de métrique spécifique à récupérer',
    example: 'revenue'
  })
  @IsOptional()
  @IsString()
  metricType?: string;

  @ApiPropertyOptional({
    description: 'Groupement des données par période',
    example: 'month'
  })
  @IsOptional()
  @IsString()
  groupBy?: string;
}
