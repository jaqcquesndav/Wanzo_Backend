import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsUUID, IsUrl } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationData } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to whom the notification belongs', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Type of the notification', enum: NotificationType, example: NotificationType.INFO })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: 'Title of the notification', example: 'New Feature Alert' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Message content of the notification', example: 'Check out our latest feature that does X, Y, and Z.' })
  @IsString()
  @IsNotEmpty()
  message: string;
  
  @ApiPropertyOptional({
    description: 'Action route for navigation when tapped',
    example: '/sales/123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsOptional()
  actionRoute?: string;

  @ApiPropertyOptional({ 
    description: 'Optional data payload for client-side actions or context',
    example: { entityType: 'feature', entityId: 'feature-xyz' }
  })
  @IsObject()
  @IsOptional()
  additionalData?: NotificationData;
}
