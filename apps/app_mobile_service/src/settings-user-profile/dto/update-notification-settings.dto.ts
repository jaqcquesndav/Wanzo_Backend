import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsArray, IsEnum } from 'class-validator';
import { NotificationType } from '../entities/notification-settings.entity'; // Adjust path as needed

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ description: 'Globally enable or disable all notifications', example: true })
  @IsOptional()
  @IsBoolean()
  enableAllNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable/disable new sale notifications', example: true })
  @IsOptional()
  @IsBoolean()
  newSaleNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable/disable stock alert notifications', example: false })
  @IsOptional()
  @IsBoolean()
  stockAlertNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable/disable promotional updates', example: true })
  @IsOptional()
  @IsBoolean()
  promotionalUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Enable/disable account activity alerts', example: true })
  @IsOptional()
  @IsBoolean()
  accountActivityAlerts?: boolean;

  @ApiPropertyOptional({
    description: 'Preferred channels for critical alerts',
    example: ['email', 'sms'],
    enum: NotificationType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  criticalAlertChannels?: NotificationType[];
}
