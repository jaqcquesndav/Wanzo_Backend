import { IsBoolean, IsOptional, IsString, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyDataSharingPreferences, DataSharingPreferenceKey } from '../entities/company.entity';

export class CompanyDataSharingPreferencesDto implements CompanyDataSharingPreferences {
  @ApiPropertyOptional({
    description: 'Allow using mobile app data (transactions, attachments) for AI accounting suggestions.',
    example: true,
    enum: DataSharingPreferenceKey,
  })
  @IsOptional()
  @IsBoolean()
  [DataSharingPreferenceKey.ALLOW_MOBILE_DATA_FOR_AI]?: boolean;

  @ApiPropertyOptional({
    description: 'Allow using accounting web app chat data (messages, attachments) for AI accounting suggestions.',
    example: true,
    enum: DataSharingPreferenceKey,
  })
  @IsOptional()
  @IsBoolean()
  [DataSharingPreferenceKey.ALLOW_CHAT_DATA_FOR_AI]?: boolean;

  // Add other DTO properties for other preferences as they are defined
}

export class CreateCompanyDto {
  @ApiProperty({ description: 'Name of the company', example: 'Wanzo Technologies' })
  @IsString()
  name!: string; // Added definite assignment assertion

  @ApiPropertyOptional({ description: 'Initial data sharing preferences for the company' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyDataSharingPreferencesDto)
  dataSharingPreferences?: CompanyDataSharingPreferencesDto;

  @ApiPropertyOptional({ description: 'Current fiscal year for the company', example: '2025' })
  @IsOptional()
  @IsString()
  currentFiscalYear?: string;

  @ApiPropertyOptional({ description: 'Other metadata (e.g., accountingStandard: \'SYSCOHADA\')' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Name of the company' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Data sharing preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyDataSharingPreferencesDto)
  dataSharingPreferences?: CompanyDataSharingPreferencesDto;

  @ApiPropertyOptional({ description: 'Current fiscal year for the company' })
  @IsOptional()
  @IsString()
  currentFiscalYear?: string;

  @ApiPropertyOptional({ description: 'Other metadata for the company' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
