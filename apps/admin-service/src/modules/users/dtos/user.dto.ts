import { 
  IsString, 
  IsEmail, 
  IsEnum, 
  IsOptional, 
  IsUUID, 
  IsPhoneNumber, 
  IsBoolean, 
  IsArray, 
  IsDateString, 
  ValidateNested,
  MinLength,
  Matches,
  ArrayMinSize,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus, UserType } from '../entities/enums';

// User DTOs
export class UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  userType: UserType;
  customerAccountId?: string;
  status: UserStatus;
  avatar?: string;
  createdAt: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  permissions?: string[];
  departement?: string;
  phoneNumber?: string;
  isTwoFactorEnabled: boolean;
}

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsEnum(UserType)
  userType: UserType;

  @IsOptional()
  @IsString()
  customerAccountId?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsString()
  departement?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
  })
  password: string;

  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsString()
  departement?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled?: boolean;
}

export class UserQueryParamsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsString()
  customerAccountId?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class UsersResponseDto {
  users: UserDto[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// User Session DTOs
export class UserSessionDto {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  lastActive: Date;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

export class UserSessionsQueryDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class UserSessionsResponseDto {
  sessions: UserSessionDto[];
  total: number;
  page: number;
  totalPages: number;
}

// User Activity DTOs
export class UserActivityDto {
  id: string;
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class UserActivityQueryDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UserActivityResponseDto {
  activities: UserActivityDto[];
  total: number;
  page: number;
  totalPages: number;
}

// Password Management DTOs
export class ChangePasswordDto {
  @IsUUID()
  userId: string;

  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}

export class ResetPasswordRequestDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}

// Role Management DTOs
export class RolePermissionsDto {
  @IsString()
  role: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  permissions: string[];
}

export class RolePermissionsUpdateDto {
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class GetAvailablePermissionsResponseDto {
  permissions: { [category: string]: string[] };
}
