import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsDateString, IsUUID, MinLength, MaxLength, IsPhoneNumber, IsEmail, IsBoolean } from 'class-validator';
import { UpdateUserProfileDto } from './update-user-profile.dto'; // Import to potentially extend or reference

export class UpdateUserByAdminDto {
  @ApiPropertyOptional({ description: "User's first name", example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: "User's last name", example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: "User's phone number", example: '+1234567890' })
  @IsOptional()
  // @IsPhoneNumber(null) // Add region-specific validation if needed
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({ description: "URL of the user's profile picture", example: 'http://example.com/profile.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  profilePictureUrl?: string;

  @ApiPropertyOptional({ description: "User's address", example: '123 Main St, Anytown' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "User's date of birth (YYYY-MM-DD)", example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: "User's preferred language (e.g., en, fr)", example: 'fr' })
  @IsOptional()
  @IsString()
  languagePreference?: string;

  @ApiPropertyOptional({ description: "User's timezone (e.g., Africa/Douala)", example: 'Europe/Paris' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Business name associated with the user', example: 'JD Enterprises' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ description: 'ID of the business sector for the user', example: 'uuid-for-retail-sector' })
  @IsOptional()
  @IsUUID()
  businessSectorId?: string;

  @ApiPropertyOptional({ description: 'Description of the user related business', example: 'Selling goods and services.' })
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @ApiPropertyOptional({ description: 'User related business website URL', example: 'http://jdenterprises.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: "User's email address", example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Set user account active or inactive status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
