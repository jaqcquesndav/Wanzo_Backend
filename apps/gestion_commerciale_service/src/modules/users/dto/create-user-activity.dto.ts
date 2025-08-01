import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityType } from '../entities/user-activity.entity';

export class CreateUserActivityDto {
  @ApiProperty({
    description: 'ID de l\'utilisateur associé à l\'activité',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Type d\'activité',
    enum: ActivityType,
    example: ActivityType.LOGIN
  })
  @IsEnum(ActivityType)
  @IsNotEmpty()
  activityType: ActivityType;

  @ApiProperty({
    description: 'Description de l\'activité',
    example: 'Connexion réussie',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Module concerné par l\'activité',
    example: 'auth',
    required: false
  })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiProperty({
    description: 'Identifiant de l\'enregistrement concerné',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @IsString()
  @IsOptional()
  recordId?: string;

  @ApiProperty({
    description: 'Adresse IP de l\'utilisateur',
    example: '192.168.1.1',
    required: false
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({
    description: 'Informations sur l\'appareil utilisé',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false
  })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({
    description: 'Métadonnées supplémentaires',
    example: { oldValue: 'user1', newValue: 'user2' },
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
