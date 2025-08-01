import { IsEnum, IsOptional, IsUUID, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityType } from '../entities/user-activity.entity';
import { Type } from 'class-transformer';

export class ListUserActivitiesDto {
  @ApiProperty({
    description: 'Numéro de page',
    default: 1,
    minimum: 1,
    required: false,
    example: 1
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    default: 10,
    minimum: 1,
    maximum: 100,
    required: false,
    example: 10
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @ApiProperty({
    description: 'Champ à utiliser pour le tri',
    required: false,
    example: 'createdAt'
  })
  @IsString()
  @IsOptional()
  sortBy: string = 'createdAt';

  @ApiProperty({
    description: 'Ordre de tri (asc/desc)',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsString()
  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';
  @ApiProperty({
    description: 'Filtrer par ID d\'utilisateur',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Filtrer par type d\'activité',
    enum: ActivityType,
    required: false,
    example: ActivityType.LOGIN
  })
  @IsEnum(ActivityType)
  @IsOptional()
  activityType?: ActivityType;

  @ApiProperty({
    description: 'Filtrer par module',
    required: false,
    example: 'auth'
  })
  @IsOptional()
  module?: string;

  @ApiProperty({
    description: 'Filtrer par date de début',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @IsOptional()
  startDate?: Date;

  @ApiProperty({
    description: 'Filtrer par date de fin',
    required: false,
    example: '2023-12-31T23:59:59Z'
  })
  @IsOptional()
  endDate?: Date;
}
