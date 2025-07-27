import { IsString, IsArray, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiKeyStatus } from '../entities/api-key.entity';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API key name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'API key permissions' })
  @IsArray()
  permissions!: string[];
}

export class UpdateApiKeyDto {
  @ApiPropertyOptional({ description: 'API key name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'API key status', enum: ApiKeyStatus })
  @IsOptional()
  @IsEnum(ApiKeyStatus)
  status?: ApiKeyStatus;

  @ApiPropertyOptional({ description: 'API key permissions' })
  @IsOptional()
  @IsArray()
  permissions?: string[];
}

export class ApiKeyResponseDto {
  @ApiProperty({ description: 'API key ID' })
  id!: string;

  @ApiProperty({ description: 'API key name' })
  name!: string;

  @ApiProperty({ description: 'API key' })
  key!: string;

  @ApiProperty({ description: 'API key permissions' })
  permissions!: string[];

  @ApiProperty({ description: 'API key status', enum: ApiKeyStatus })
  status!: ApiKeyStatus;

  @ApiProperty({ description: 'API key creation date' })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Last used date' })
  lastUsed?: Date;
}
