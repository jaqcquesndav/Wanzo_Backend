import { IsString, IsArray, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ClientType {
  CONFIDENTIAL = 'confidential',
  PUBLIC = 'public',
}

export class CreateClientDto {
  @ApiProperty({ description: 'Client name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Client type', enum: ClientType })
  @IsEnum(ClientType)
  type!: ClientType;

  @ApiProperty({ description: 'Allowed redirect URIs', type: [String] })
  @IsArray()
  redirectUris!: string[];

  @ApiProperty({ description: 'Allowed OAuth scopes', type: [String] })
  @IsArray()
  allowedScopes!: string[];

  @ApiPropertyOptional({ description: 'Client logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Client description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Whether user consent is required' })
  @IsBoolean()
  consentRequired!: boolean;
}

export class UpdateClientDto {
  @ApiPropertyOptional({ description: 'Client name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Allowed redirect URIs', type: [String] })
  @IsOptional()
  @IsArray()
  redirectUris?: string[];

  @ApiPropertyOptional({ description: 'Allowed OAuth scopes', type: [String] })
  @IsOptional()
  @IsArray()
  allowedScopes?: string[];

  @ApiPropertyOptional({ description: 'Client logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Client description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether user consent is required' })
  @IsOptional()
  @IsBoolean()
  consentRequired?: boolean;
}