import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WidgetType, WidgetCategory } from '../interfaces/dashboard.interface';

export class WidgetConfigDto {
  @ApiProperty({ description: 'ID du widget', enum: WidgetType })
  @IsEnum(WidgetType)
  id: WidgetType;

  @ApiProperty({ description: 'Titre du widget' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description du widget' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Catégorie du widget', enum: WidgetCategory })
  @IsEnum(WidgetCategory)
  category: WidgetCategory;

  @ApiProperty({ description: 'Visible par défaut' })
  @IsBoolean()
  defaultVisible: boolean;

  @ApiProperty({ description: 'Position du widget' })
  @IsNumber()
  position: number;

  @ApiPropertyOptional({ description: 'Configuration du widget' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class WidgetPreferenceDto {
  @ApiProperty({ description: 'Visibilité du widget' })
  @IsBoolean()
  visible: boolean;

  @ApiProperty({ description: 'Position du widget' })
  @IsNumber()
  position: number;

  @ApiPropertyOptional({ description: 'Configuration du widget' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class SelectorPositionDto {
  @ApiProperty({ description: 'Position X' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Position Y' })
  @IsNumber()
  y: number;

  @ApiProperty({ description: 'État minimisé' })
  @IsBoolean()
  minimized: boolean;
}

export class DashboardPreferencesDto {
  @ApiProperty({ description: 'ID de l\'utilisateur' })
  @IsString()
  userId: string;

  @ApiProperty({ 
    description: 'Préférences des widgets', 
    type: 'object',
    additionalProperties: { type: 'object' }
  })
  @IsObject()
  widgets: Record<WidgetType, WidgetPreferenceDto>;

  @ApiPropertyOptional({ description: 'Position du sélecteur', type: SelectorPositionDto })
  @ValidateNested()
  @Type(() => SelectorPositionDto)
  @IsOptional()
  selectorPosition?: SelectorPositionDto;

  @ApiProperty({ description: 'Dernière mise à jour' })
  @IsString()
  lastUpdated: string;
}

export class UpdateWidgetPreferenceDto {
  @ApiProperty({ description: 'Visibilité du widget' })
  @IsBoolean()
  visible: boolean;

  @ApiProperty({ description: 'Position du widget' })
  @IsNumber()
  position: number;

  @ApiPropertyOptional({ description: 'Configuration du widget' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class DashboardPreferencesResponseDto {
  @ApiProperty({ description: 'Succès de la requête' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Préférences du dashboard', type: DashboardPreferencesDto })
  @ValidateNested()
  @Type(() => DashboardPreferencesDto)
  data: DashboardPreferencesDto;
}

export class UpdateWidgetResponseDto {
  @ApiProperty({ description: 'Succès de la requête' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Message de confirmation' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Détails de mise à jour' })
  @IsObject()
  data: {
    userId: string;
    widgetId: string;
    visible: boolean;
    position: number;
    updatedAt: string;
  };
}

export class ResetPreferencesResponseDto {
  @ApiProperty({ description: 'Succès de la requête' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Message de confirmation' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Préférences par défaut', type: DashboardPreferencesDto })
  @ValidateNested()
  @Type(() => DashboardPreferencesDto)
  data: DashboardPreferencesDto;
}
