import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export class CreateUserDto {
  @IsEmail()
  email: string | undefined;

  @IsNotEmpty()
  @IsString()
  name: string | undefined;

  @IsNotEmpty()
  @IsString()
  password: string | undefined;

  // Enum pour le rôle
  @IsEnum(UserRole)
  role: UserRole | undefined;

  // Permissions peut être un tableau facultatif
  @IsOptional()
  permissions?: string[];

  // companyId facultatif
  @IsOptional()
  companyId?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  permissions?: string[];

  @IsOptional()
  companyId?: string;
}
