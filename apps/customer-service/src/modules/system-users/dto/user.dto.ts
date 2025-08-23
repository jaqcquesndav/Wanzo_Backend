import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, IsBoolean, IsArray, IsObject, IsISO8601, ValidateNested, IsDate, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserType, IdType, IdStatus } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  givenName?: string;

  @IsOptional()
  @IsString()
  familyName?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  financialInstitutionId?: string;

  @IsOptional()
  @IsBoolean()
  isCompanyOwner?: boolean;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(IdType)
  idType?: IdType;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsISO8601()
  birthdate?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  permissions?: string[];

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsInt()
  tokenBalance?: number;

  @IsOptional()
  @IsInt()
  tokenTotal?: number;

  @IsOptional()
  @IsBoolean()
  isFirstTimeUser?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  givenName?: string;

  @IsOptional()
  @IsString()
  familyName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsObject()
  settings?: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    preferences?: {
      theme?: string;
      language?: string;
      currency?: string;
    };
  };

  @IsOptional()
  @IsString()
  language?: string;
}

export class VerifyPhoneDto {
  @IsString()
  phone!: string;

  @IsString()
  code!: string;
}

export class UploadIdentityDocumentDto {
  @IsEnum(IdType)
  idType!: IdType;

  // Le document lui-même sera traité via multipart/form-data
}

export class UserPreferencesDto {
  @IsObject()
  notifications!: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  emailVerified!: boolean;
  name!: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  phone?: string;
  phoneVerified!: boolean;
  address?: string;
  idNumber?: string;
  idType?: string;
  idStatus?: string;
  role!: string;
  birthdate?: string;
  bio?: string;
  userType!: string;
  companyId?: string;
  financialInstitutionId?: string;
  isCompanyOwner!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  settings?: Record<string, any>;
  language?: string;
  permissions?: string[];
  plan?: string;
  tokenBalance?: number;
  tokenTotal?: number;
}

export class ApiResponseDto<T> {
  success!: boolean;
  data!: T;
  meta?: Record<string, any>;
}

export class ApiErrorResponseDto {
  success!: boolean;
  error!: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export class PaginationDto {
  page!: number;
  limit!: number;
  total!: number;
  pages!: number;
}
