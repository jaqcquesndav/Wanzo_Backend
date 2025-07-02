import { IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO pour les requêtes de mise à jour de client venant d'autres services
 */
export class CustomerUpdateRequestDto {
  @IsUUID()
  customerId!: string;
  
  @IsString()
  requestingService!: string;
  
  @IsUUID()
  requestId!: string;
  
  @ValidateNested()
  @Type(() => CustomerUpdateFieldsDto)
  updateFields!: CustomerUpdateFieldsDto;
}

/**
 * DTO pour les champs de mise à jour autorisés
 */
export class CustomerUpdateFieldsDto {
  @IsOptional()
  @IsString()
  name?: string;
  
  @IsOptional()
  @IsString()
  email?: string;
  
  @IsOptional()
  @IsString()
  phone?: string;
  
  @IsOptional()
  @IsString()
  address?: string;
  
  @IsOptional()
  @IsString()
  city?: string;
  
  @IsOptional()
  @IsString()
  country?: string;
  
  @IsOptional()
  preferences?: Record<string, any>;
}

/**
 * Enum pour les types d'actions administratives
 */
export enum AdminCustomerActionType {
  VALIDATE = 'validate',
  SUSPEND = 'suspend',
  REACTIVATE = 'reactivate',
  UPDATE_LIMITS = 'update_limits',
}

/**
 * DTO pour les actions administratives sur un client
 */
export class AdminCustomerActionDto {
  @IsUUID()
  customerId!: string;
  
  @IsUUID()
  adminId!: string;
  
  @IsEnum(AdminCustomerActionType)
  action!: AdminCustomerActionType;
  
  @IsOptional()
  @IsString()
  reason?: string;
  
  @IsOptional()
  details?: Record<string, any>;
}
