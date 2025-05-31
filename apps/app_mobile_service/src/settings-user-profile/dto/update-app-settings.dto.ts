import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdateAppSettingsDto {
  @ApiPropertyOptional({ description: 'Theme preference', example: 'dark', enum: ['light', 'dark', 'system'] })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system'])
  theme?: string;

  @ApiPropertyOptional({ description: 'Language preference', example: 'fr' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Enable/disable marketing emails', example: true })
  @IsOptional()
  @IsBoolean()
  receiveMarketingEmails?: boolean;

  @ApiPropertyOptional({ description: 'Enable/disable beta features', example: false })
  @IsOptional()
  @IsBoolean()
  enableBetaFeatures?: boolean;

  // Add other updatable app settings fields as needed
}
