import { IsBoolean, IsOptional, IsUUID, IsArray, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDataSharingConfigDto {
  @ApiProperty({ description: 'Enable/disable data sharing' })
  @IsBoolean()
  sharingEnabled!: boolean;

  @ApiPropertyOptional({ description: 'Types of data to share' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDataTypes?: string[];

  @ApiPropertyOptional({ description: 'Institution ID to share with' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({ description: 'Consent expiration date' })
  @IsOptional()
  @IsDateString()
  consentExpiresAt?: string;

  @ApiPropertyOptional({ description: 'Data sharing preferences' })
  @IsOptional()
  sharingPreferences?: Record<string, any>;
}

export class DataSharingStatusDto {
  @ApiProperty({ description: 'Data sharing enabled status' })
  sharingEnabled!: boolean;

  @ApiProperty({ description: 'Allowed data types' })
  allowedDataTypes?: string[];

  @ApiProperty({ description: 'Connected institution ID' })
  institutionId?: string;

  @ApiProperty({ description: 'Consent expiration date' })
  consentExpiresAt?: Date;

  @ApiProperty({ description: 'Data sharing preferences' })
  sharingPreferences?: Record<string, any>;
}