import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Admin password must be at least 8 characters long' })
  adminPassword: string;

  @IsNotEmpty()
  @IsString()
  adminName: string; // This could be split into firstName/lastName if preferred

  @IsOptional()
  @IsString()
  adminPhone?: string;

  // Add any other fields that might be part of the RegistrationRequest
  // For example, if the company has a type or sector chosen at registration:
  // @IsOptional()
  // @IsString()
  // companySector?: string;
}
