import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean, IsISO8601, IsObject, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType, CustomerStatus, DocumentType, DocumentStatus } from '../entities';

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;
}

export class CustomerDto {
  id: string;
  type: CustomerType;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  registrationNumber?: string;
  status: CustomerStatus;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  dateOfBirth?: Date;
  nationality?: string;
  taxId?: string;
  isOnboarded: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerListResponseDto {
  data: CustomerDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export class CustomerDetailsResponseDto {
  data: CustomerDto & {
    documents?: CustomerDocumentDto[];
  };
}

export class CreateCustomerDto {
  @IsEnum(CustomerType)
  type: CustomerType;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsISO8601()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  taxId?: string;
}

export class UpdateCustomerDto {
  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsISO8601()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsBoolean()
  @IsOptional()
  isOnboarded?: boolean;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  phoneVerified?: boolean;
}

export class CustomerQueryParamsDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  sortBy?: string;

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;

  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @IsString()
  @IsOptional()
  search?: string;
}

export class CustomerDocumentDto {
  id: string;
  customerId: string;
  type: DocumentType;
  name: string;
  fileUrl: string;
  status: DocumentStatus;
  verifiedAt?: Date;
  rejectionReason?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  type: DocumentType;

  @IsISO8601()
  @IsOptional()
  expiryDate?: string;
}

export class VerifyDocumentDto {
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class CustomerEmailVerificationDto {
  @IsUUID()
  token: string;
}

export class CustomerPhoneVerificationDto {
  @IsString()
  code: string;
}
