import { IsString, IsEmail, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';

export enum CustomerType {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  CORPORATE = 'CORPORATE',
  SME = 'SME'
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

/**
 * DTO pour créer un client
 */
export class CreateCustomerDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsPhoneNumber('CD') // Code pays RDC
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  businessSector?: string;
}

/**
 * DTO pour mettre à jour un client
 */
export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('CD')
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  businessSector?: string;
}

/**
 * DTO pour la recherche de clients
 */
export class SearchCustomerDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsString()
  businessSector?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

/**
 * DTO pour la création en lot de clients
 */
export class BulkCreateCustomerDto {
  customers!: CreateCustomerDto[];
}

/**
 * DTO pour l'export de données clients
 */
export class ExportCustomerDto {
  @IsOptional()
  @IsEnum(['json', 'csv', 'excel'])
  format?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

/**
 * DTO pour les requêtes de recherche de clients
 */
export class CustomerQueryDto {
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}