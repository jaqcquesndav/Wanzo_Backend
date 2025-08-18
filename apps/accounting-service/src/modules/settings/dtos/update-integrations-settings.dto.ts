import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIntegrationsSettingsDto {
  @ApiPropertyOptional({ description: 'Enable bank integration' })
  @IsOptional()
  @IsBoolean()
  enableBankIntegration?: boolean;

  @ApiPropertyOptional({ description: 'Enable payment gateway integration' })
  @IsOptional()
  @IsBoolean()
  enablePaymentGateway?: boolean;

  @ApiPropertyOptional({ description: 'Enable API access' })
  @IsOptional()
  @IsBoolean()
  enableApiAccess?: boolean;

  @ApiPropertyOptional({ description: 'KsPay integration settings' })
  @IsOptional()
  ksPay?: { enabled?: boolean; apiKey?: string; };

  @ApiPropertyOptional({ description: 'API key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Webhook URL' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'External service configurations' })
  @IsOptional()
  externalServices?: Record<string, any>;
}
