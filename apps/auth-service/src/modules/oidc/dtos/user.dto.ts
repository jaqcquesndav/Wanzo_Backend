import { IsString, IsEmail, IsArray, IsOptional, ValidateNested, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  USER = 'user',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  VIEWER = 'viewer',
}

export class PermissionDto {
  @ApiProperty({ description: 'Application identifier' })
  @IsString()
  application!: string;

  @ApiProperty({ description: 'Access level' })
  @IsString()
  access!: string;
}

export class CreateUserDto {
  @ApiProperty({ description: 'User full name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  password!: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ description: 'User permissions', type: [PermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions!: PermissionDto[];

  @ApiPropertyOptional({ description: 'User company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'User profile picture URL' })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User role', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'User permissions', type: [PermissionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions?: PermissionDto[];

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'User profile picture URL' })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}

export class CompanySignupDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  companyName!: string;

  @ApiProperty({ description: 'Admin full name' })
  @IsString()
  adminName!: string;

  @ApiProperty({ description: 'Admin email address' })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ description: 'Admin password' })
  @IsString()
  adminPassword!: string;

  @ApiPropertyOptional({ description: 'Company details' })
  @IsOptional()
  companyDetails?: Record<string, any>;
}