import { IsString, IsOptional, IsEmail, IsEnum, IsInt, IsPositive, Min, Max, IsDateString, IsObject, ValidateNested, IsUUID, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType, CustomerStatus, AccountType } from '../entities/customer.entity';
import { DocumentType, DocumentStatus } from '../entities/document.entity';
import { ValidationStepStatus } from '../entities/validation.entity';

// Base Customer DTO for responses
export class CustomerDto {
  id: string;
  name: string;
  type: CustomerType;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: CustomerStatus;
  billingContactName: string;
  billingContactEmail: string;
  tokenAllocation: number;
  accountType: AccountType;
  ownerId?: string;
  ownerEmail?: string;
  validatedAt?: Date;
  validatedBy?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  suspensionReason?: string;
  reactivatedAt?: Date;
  reactivatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PmeSpecificDataDto {
    @IsString()
    @IsOptional()
    industry?: string;

    @IsIn(['micro', 'small', 'medium'])
    @IsOptional()
    size?: 'micro' | 'small' | 'medium';

    @IsInt()
    @IsPositive()
    @IsOptional()
    employeesCount?: number;

    @IsInt()
    @IsOptional()
    yearFounded?: number;

    @IsString()
    @IsOptional()
    registrationNumber?: string;

    @IsString()
    @IsOptional()
    taxId?: string;

    @IsString()
    @IsOptional()
    businessLicense?: string;
}

export class FinancialInstitutionDataDto {
    @IsIn(['bank', 'microfinance', 'insurance', 'investment', 'other'])
    @IsOptional()
    institutionType?: 'bank' | 'microfinance' | 'insurance' | 'investment' | 'other';

    @IsString()
    @IsOptional()
    regulatoryBody?: string;

    @IsString()
    @IsOptional()
    regulatoryLicenseNumber?: string;

    @IsInt()
    @IsPositive()
    @IsOptional()
    branchesCount?: number;

    @IsInt()
    @IsPositive()
    @IsOptional()
    clientsCount?: number;

    @IsInt()
    @IsPositive()
    @IsOptional()
    assetsUnderManagement?: number;
}

// DTO for customer creation
export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEnum(CustomerType)
  type: CustomerType;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsString()
  billingContactName: string;

  @IsEmail()
  billingContactEmail: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsOptional()
  @ValidateNested()
  @Type(() => PmeSpecificDataDto)
  pmeSpecificData?: PmeSpecificDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialInstitutionDataDto)
  financialInstitutionData?: FinancialInstitutionDataDto;
}

// DTO for customer updates
export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  billingContactName?: string;

  @IsEmail()
  @IsOptional()
  billingContactEmail?: string;

  @IsEnum(AccountType)
  @IsOptional()
  accountType?: AccountType;

  @IsOptional()
  @ValidateNested()
  @Type(() => PmeSpecificDataDto)
  pmeSpecificData?: PmeSpecificDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialInstitutionDataDto)
  financialInstitutionData?: FinancialInstitutionDataDto;
}

// DTO for querying customers
export class CustomerQueryParamsDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsIn(['asc', 'desc'])
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

// DTO for customer list response
export class CustomerListResponseDto {
  customers: CustomerDto[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// DTO for customer details response (includes documents, activities, etc.)
export class CustomerDetailsResponseDto {
  customer: CustomerDto & {
    documents?: CustomerDocumentDto[];
    validationHistory?: Array<{
      date: Date;
      action: 'validated' | 'revoked' | 'info_requested' | 'info_submitted';
      by: string;
      notes?: string;
    }>;
  };
  statistics?: {
    tokensUsed: number;
    lastActivity: Date;
    activeSubscriptions: number;
    totalSpent: number;
  };
  activities?: CustomerActivityDto[];
}

// DTO for suspending a customer
export class SuspendCustomerDto {
  @IsString()
  reason: string;
}

// Document DTOs
export class CustomerDocumentDto {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy: string;
  status: DocumentStatus;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewComments?: string;
}

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  type: DocumentType;
}

export class ApproveDocumentDto {
  @IsString()
  @IsOptional()
  comments?: string;
}

export class RejectDocumentDto {
  @IsString()
  reason: string;
}

// Activity DTOs
export class CustomerActivityDto {
    @IsUUID()
    id: string;

    @IsUUID()
    customerId: string;

    @IsString()
    type: string;

    @IsString()
    action: string;

    @IsString()
    description: string;

    @IsUUID()
    performedBy: string;

    @IsString()
    performedByName: string;

    @IsDateString()
    timestamp: string;

    @IsObject()
    @IsOptional()
    details?: Record<string, any>;
}

// Validation DTOs
export class ValidationStepDto {
  id: string;
  name: string;
  description: string;
  status: ValidationStepStatus;
  order?: number;
  requiredDocuments?: DocumentType[];
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

export class ValidationProcessDto {
  id: string;
  customerId: string;
  status: CustomerStatus;
  steps: ValidationStepDto[];
  currentStepIndex: number;
  startedAt: Date;
  lastUpdatedAt: Date;
  completedAt?: Date;
  validatedBy?: string;
  notes?: string[];
}

// Statistics DTO
export class CustomerStatisticsDto {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  byType: {
    pme: number;
    financial: number;
  };
  byAccountType: {
    freemium: number;
    standard: number;
    premium: number;
    enterprise: number;
  };
}
