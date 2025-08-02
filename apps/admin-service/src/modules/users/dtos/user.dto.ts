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
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus, UserType } from '../entities/enums';
import { PaginatedResponse, APIResponse } from '../../../common/interfaces';

// User DTOs
export class UserDto {
  @ApiProperty({
    description: 'ID unique de l\'utilisateur',
    example: 'user-id-string'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Nom complet de l\'utilisateur',
    example: 'User Name'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur',
    example: 'company_user',
    enum: UserRole
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Type d\'utilisateur',
    example: 'internal',
    enum: UserType
  })
  @IsEnum(UserType)
  userType: UserType;  @ApiProperty({
    description: 'ID du compte client (optionnel, requis si userType est "external")',
    example: 'pme-123',
    required: false
  })
  @IsString()
  @IsOptional()
  customerAccountId?: string;

  @ApiProperty({
    description: 'Nom du client (optionnel, pour les utilisateurs externes)',
    example: 'Customer Company Name',
    required: false
  })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({
    description: 'Type de client (optionnel)',
    example: 'pme',
    required: false
  })
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiProperty({
    description: 'Statut de l\'utilisateur',
    example: 'active',
    enum: UserStatus
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({
    description: 'URL de l\'avatar',
    example: 'url_to_avatar_image.png',
    required: false
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: 'Date de création du compte',
    example: '2025-01-15T10:30:00Z'
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-01-18T11:00:00Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  updatedAt?: string;

  @ApiProperty({
    description: 'Date de dernière connexion',
    example: '2025-01-20T14:45:00Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  lastLogin?: string;  @ApiProperty({
    description: 'Permissions de l\'utilisateur',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', example: 'default' },
        permissions: { type: 'array', items: { type: 'string' }, example: ['view_own_profile', 'edit_own_profile'] }
      }
    },
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  permissions?: {
    applicationId: string;
    permissions: string[];
  }[];

  @ApiProperty({
    description: 'Département',
    example: 'Sales',
    required: false
  })
  @IsString()
  @IsOptional()
  departement?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+243123456789',
    required: false
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Poste / Position',
    example: 'Senior Manager',
    required: false
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({
    description: 'ID Agent',
    example: 'IKH12345',
    required: false
  })
  @IsString()
  @IsOptional()
  idAgent?: string;

  @ApiProperty({
    description: 'Date de fin de validité',
    example: '2026-06-17T00:00:00.000Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  validityEnd?: string;

  @ApiProperty({
    description: 'Informations KYC',
    required: false,
    type: 'object'
  })
  @IsOptional()
  kyc?: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    documents?: Array<{
      type: string;
      verified: boolean;
      uploadedAt: string;
    }>;
  };
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

export class UsersResponseDto implements PaginatedResponse<UserDto> {
  @ApiProperty({ type: [UserDto] })
  items: UserDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
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

export class UserSessionsResponseDto implements PaginatedResponse<UserSessionDto> {
  @ApiProperty({ type: [UserSessionDto] })
  items: UserSessionDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
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

export class UserActivityResponseDto implements PaginatedResponse<UserActivityDto> {
  @ApiProperty({ type: [UserActivityDto] })
  items: UserActivityDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
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
