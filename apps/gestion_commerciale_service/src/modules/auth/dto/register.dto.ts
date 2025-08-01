import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nom de l\'entreprise',
    example: 'Acme Corporation',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({
    description: 'Email de l\'administrateur',
    example: 'admin@acme.com',
    required: true
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({
    description: 'Mot de passe de l\'administrateur (minimum 8 caractères)',
    example: 'Password123!',
    required: true,
    minLength: 8
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Admin password must be at least 8 characters long' })
  adminPassword: string;

  @ApiProperty({
    description: 'Nom de l\'administrateur',
    example: 'John Doe',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  adminName: string; // This could be split into firstName/lastName if preferred

  @ApiProperty({
    description: 'Numéro de téléphone de l\'administrateur',
    example: '+33612345678',
    required: false
  })
  @IsOptional()
  @IsString()
  adminPhone?: string;

  // Add any other fields that might be part of the RegistrationRequest
  // For example, if the company has a type or sector chosen at registration:
  // @IsOptional()
  // @IsString()
  // companySector?: string;
}
