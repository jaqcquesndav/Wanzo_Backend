import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationsSettingsDto {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  enableEmailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications' })
  @IsOptional()
  @IsBoolean()
  enableSmsNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable in-app notifications' })
  @IsOptional()
  @IsBoolean()
  enableInAppNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Journal validation settings' })
  @IsOptional()
  journal_validation?: { email?: boolean; sms?: boolean; };

  @ApiPropertyOptional({ description: 'Notification email address' })
  @IsOptional()
  @IsString()
  notificationEmail?: string;

  @ApiPropertyOptional({ description: 'Notification phone number' })
  @IsOptional()
  @IsString()
  notificationPhone?: string;

  @ApiPropertyOptional({ description: 'Notification frequency' })
  @IsOptional()
  @IsString()
  notificationFrequency?: string;
}
