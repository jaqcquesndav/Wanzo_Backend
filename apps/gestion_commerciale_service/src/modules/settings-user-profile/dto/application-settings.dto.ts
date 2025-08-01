import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsEmail, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class SocialMediaLinksDto {
  @ApiPropertyOptional({ description: 'Facebook page URL', example: 'https://facebook.com/yourcompany' })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({ description: 'Twitter profile URL', example: 'https://twitter.com/yourcompany' })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({ description: 'LinkedIn profile URL', example: 'https://linkedin.com/company/yourcompany' })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional({ description: 'Instagram profile URL', example: 'https://instagram.com/yourcompany' })
  @IsOptional()
  @IsUrl()
  instagram?: string;
}

export class ApplicationSettingsDto {
  @ApiPropertyOptional({ description: 'The display name of the application or company', example: 'WanzoPro' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'URL of the main company/application logo', example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  companyLogoUrl?: string;

  @ApiPropertyOptional({ description: 'Default language for the application (e.g., en, fr)', example: 'fr' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ description: 'Default currency for the application (e.g., XAF, USD)', example: 'XAF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Default date format (e.g., YYYY-MM-DD, DD/MM/YYYY)', example: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({ description: 'Default time format (e.g., HH:mm, h:mm A)', example: 'HH:mm' })
  @IsOptional()
  @IsString()
  timeFormat?: string;

  @ApiPropertyOptional({ description: 'Primary contact email for the application', example: 'support@wanzopro.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Primary contact phone number for the application', example: '+2376XXXXXXXX' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Main physical address of the company/application', example: '123 Tech Avenue, Douala, Cameroon' })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({ type: () => SocialMediaLinksDto, description: 'Links to social media profiles' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaLinksDto)
  @IsObject() // Ensures that socialMediaLinks is an object if provided
  socialMediaLinks?: SocialMediaLinksDto;

  @ApiPropertyOptional({ description: 'Enable or disable maintenance mode for the application', example: false })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
}
