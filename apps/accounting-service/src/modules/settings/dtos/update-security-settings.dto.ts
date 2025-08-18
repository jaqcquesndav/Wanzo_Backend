import { IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSecuritySettingsDto {
  @ApiPropertyOptional({ description: 'Enable two-factor authentication' })
  @IsOptional()
  @IsBoolean()
  enableTwoFactorAuth?: boolean;

  @ApiPropertyOptional({ description: 'Two-factor authentication enabled' })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Require password change frequency in days' })
  @IsOptional()
  @IsNumber()
  passwordChangeFrequency?: number;

  @ApiPropertyOptional({ description: 'Session timeout in minutes' })
  @IsOptional()
  @IsNumber()
  sessionTimeout?: number;

  @ApiPropertyOptional({ description: 'Enable IP whitelist' })
  @IsOptional()
  @IsBoolean()
  enableIpWhitelist?: boolean;

  @ApiPropertyOptional({ description: 'Allowed IP addresses' })
  @IsOptional()
  @IsString()
  allowedIpAddresses?: string;
}
