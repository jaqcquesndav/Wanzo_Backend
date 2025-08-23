import { IsString, IsOptional, IsEmail } from 'class-validator';

export class SyncUserDto {
  @IsString()
  auth0Id!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  userType?: string; // 'sme' or 'financial_institution'

  @IsOptional()
  metadata?: Record<string, any>;
}
