import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsDateString, IsUUID, MinLength, MaxLength, IsPhoneNumber } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: 'First name of the user', example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name of the user', example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number of the user', example: '+1234567890' })
  @IsOptional()
  // @IsPhoneNumber(null) // You can specify a region for phone number validation if needed, e.g., 'US'
  @IsString() // Using IsString for now, can be made more specific
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Address of the user', example: '123 Main St, Anytown' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'URL of the user profile picture', example: 'http://example.com/profile.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  profilePictureUrl?: string;

  @ApiPropertyOptional({ description: 'Date of birth of the user (YYYY-MM-DD)', example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string; // Using string for DTO, will be converted to Date in service/entity

  @ApiPropertyOptional({ description: 'Preferred language (e.g., en, fr)', example: 'fr' })
  @IsOptional()
  @IsString()
  languagePreference?: string;

  @ApiPropertyOptional({ description: 'Timezone (e.g., Africa/Douala)', example: 'Europe/Paris' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Business name', example: 'JD Enterprises' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ description: 'ID of the business sector', example: 'uuid-for-retail-sector' })
  @IsOptional()
  @IsUUID()
  businessSectorId?: string;

  @ApiPropertyOptional({ description: 'Description of the business', example: 'Selling goods and services.' })
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @ApiPropertyOptional({ description: 'Business website URL', example: 'http://jdenterprises.com' })
  @IsOptional()
  @IsUrl()
  website?: string;
}
