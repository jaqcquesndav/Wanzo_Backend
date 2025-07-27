import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsUUID, IsOptional, IsString, IsBoolean, IsObject, IsDateString, IsPhoneNumber, Length } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'User first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    description: 'User role',
    enum: UserRole,
    example: UserRole.VIEWER
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ 
    description: 'User account status',
    enum: UserStatus,
    default: UserStatus.PENDING,
    example: UserStatus.PENDING
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiProperty({ description: 'Institution ID the user belongs to' })
  @IsUUID()
  institutionId: string;

  @ApiPropertyOptional({ description: 'Auth0 user ID' })
  @IsString()
  @IsOptional()
  auth0Id?: string;

  @ApiPropertyOptional({ description: 'Is email verified', default: false })
  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Is two-factor authentication enabled', default: false })
  @IsBoolean()
  @IsOptional()
  isTwoFactorEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata for the user' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiProperty({ description: 'User phone number' })
  phone: string;

  @ApiProperty({ 
    description: 'User role',
    enum: UserRole
  })
  role: UserRole;

  @ApiProperty({ 
    description: 'User account status',
    enum: UserStatus
  })
  status: UserStatus;

  @ApiProperty({ description: 'Profile picture URL' })
  profilePicture: string;

  @ApiProperty({ description: 'Institution ID the user belongs to' })
  institutionId: string;

  @ApiProperty({ description: 'Kiota ID' })
  kiotaId: string;

  @ApiProperty({ description: 'Is email verified' })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Is two-factor authentication enabled' })
  isTwoFactorEnabled: boolean;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Last login date' })
  lastLogin: Date;
}

export class UserSearchFilterDto {
  @ApiPropertyOptional({ description: 'Search term for name or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by user role',
    enum: UserRole
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ 
    description: 'Filter by user status',
    enum: UserStatus
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filter by institution ID' })
  @IsUUID()
  @IsOptional()
  institutionId?: string;

  @ApiPropertyOptional({ description: 'Created after date' })
  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @ApiPropertyOptional({ description: 'Created before date' })
  @IsDateString()
  @IsOptional()
  createdBefore?: string;
}

export class ChangeUserStatusDto {
  @ApiProperty({ 
    description: 'New user status',
    enum: UserStatus
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UserActivityResponseDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Activity type' })
  type: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'IP address' })
  ipAddress: string;

  @ApiProperty({ description: 'User agent' })
  userAgent: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class UserPreferenceDto {
  @ApiProperty({ description: 'Preference category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Preference key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Preference value' })
  @IsString()
  value: string;
}

export class UserSessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Is session active' })
  isActive: boolean;

  @ApiProperty({ description: 'IP address' })
  ipAddress: string;

  @ApiProperty({ description: 'User agent' })
  userAgent: string;

  @ApiProperty({ description: 'Device type' })
  deviceType: string;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Expires date' })
  expiresAt: Date;

  @ApiProperty({ description: 'Last activity date' })
  lastActivity: Date;
}
