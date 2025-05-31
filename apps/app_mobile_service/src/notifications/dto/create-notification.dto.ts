import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { NotificationType, NotificationData } from '../entities/notification.entity';

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

  @ApiProperty({ description: 'Body/content of the notification', example: 'Check out our latest feature that does X, Y, and Z.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ 
    description: 'Optional data payload for client-side actions or context',
    example: { entityType: 'feature', entityId: 'feature-xyz' }
  })
  @IsObject()
  @IsOptional()
  data?: NotificationData;
}
