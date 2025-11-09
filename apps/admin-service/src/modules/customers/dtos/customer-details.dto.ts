import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsArray } from 'class-validator';

/**
 * DTO pour les documents client
 */
export class CustomerDocumentDto {
  @ApiProperty({ description: 'Document ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Document type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File URL' })
  @IsString()
  fileUrl: string;

  @ApiProperty({ description: 'Upload timestamp' })
  @IsDateString()
  uploadedAt: Date;

  @ApiProperty({ description: 'Uploaded by user ID' })
  @IsString()
  uploadedBy: string;

  @ApiProperty({ description: 'Document status' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Review timestamp' })
  @IsOptional()
  @IsDateString()
  reviewedAt?: Date;

  @ApiPropertyOptional({ description: 'Reviewed by user ID' })
  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @ApiPropertyOptional({ description: 'Review comments' })
  @IsOptional()
  @IsString()
  reviewComments?: string;
}

/**
 * DTO pour les activités client
 */
export class CustomerActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Activity type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Activity action' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Activity description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Performed by user ID' })
  @IsString()
  performedBy: string;

  @ApiProperty({ description: 'Performed by user name' })
  @IsString()
  performedByName: string;

  @ApiProperty({ description: 'Activity timestamp' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Activity performed at (alias for timestamp)' })
  @IsDateString()
  performedAt: Date;

  @ApiPropertyOptional({ description: 'Additional details' })
  @IsOptional()
  details?: Record<string, unknown>;
}

/**
 * DTO pour les processus de validation
 */
export class ValidationProcessDto {
  @ApiProperty({ description: 'Process ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Process type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Process status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Started by user ID' })
  @IsString()
  startedBy: string;

  @ApiProperty({ description: 'Start timestamp' })
  @IsDateString()
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Completed by user ID' })
  @IsOptional()
  @IsString()
  completedBy?: string;

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  @IsOptional()
  @IsDateString()
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Process steps' })
  @IsOptional()
  @IsArray()
  steps?: any[];
}

/**
 * DTO de base pour un client (legacy DTO pour compatibilité)
 */
export class CustomerDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Customer type' })
  @IsEnum(['pme', 'financial'])
  type: 'pme' | 'financial';

  @ApiProperty({ description: 'Customer email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Customer phone' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Customer address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Customer city' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Customer country' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Customer status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Billing contact name' })
  @IsString()
  billingContactName: string;

  @ApiProperty({ description: 'Billing contact email' })
  @IsString()
  billingContactEmail: string;

  @ApiProperty({ description: 'Token allocation' })
  @IsNumber()
  tokenAllocation: number;

  @ApiProperty({ description: 'Account type' })
  @IsString()
  accountType: string;

  @ApiProperty({ description: 'Owner ID' })
  @IsString()
  ownerId: string;

  @ApiProperty({ description: 'Owner email' })
  @IsString()
  ownerEmail: string;

  @ApiPropertyOptional({ description: 'Validation timestamp' })
  @IsOptional()
  @IsDateString()
  validatedAt?: Date;

  @ApiPropertyOptional({ description: 'Validated by user ID' })
  @IsOptional()
  @IsString()
  validatedBy?: string;

  @ApiPropertyOptional({ description: 'Suspension timestamp' })
  @IsOptional()
  @IsDateString()
  suspendedAt?: Date;

  @ApiPropertyOptional({ description: 'Suspended by user ID' })
  @IsOptional()
  @IsString()
  suspendedBy?: string;

  @ApiPropertyOptional({ description: 'Suspension reason' })
  @IsOptional()
  @IsString()
  suspensionReason?: string;

  @ApiPropertyOptional({ description: 'Reactivation timestamp' })
  @IsOptional()
  @IsDateString()
  reactivatedAt?: Date;

  @ApiPropertyOptional({ description: 'Reactivated by user ID' })
  @IsOptional()
  @IsString()
  reactivatedBy?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsDateString()
  updatedAt: Date;
}