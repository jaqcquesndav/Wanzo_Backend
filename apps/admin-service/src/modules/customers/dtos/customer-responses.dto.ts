import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse, APIResponse } from '../../../common/interfaces';
import { CustomerDto } from './customer.dto';

/**
 * Paginated response for customer list endpoint
 */
export class CustomerListResponseDto implements PaginatedResponse<CustomerDto> {
  @ApiProperty({ type: [CustomerDto], description: 'List of customers' })
  items: CustomerDto[];

  @ApiProperty({ description: 'Total number of customers' })
  totalCount: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

/**
 * Detailed customer response with additional information
 */
export class CustomerDetailsResponseDto {
  @ApiProperty({ type: CustomerDto, description: 'Customer details' })
  customer: CustomerDto;

  @ApiProperty({ description: 'Customer documents' })
  documents: any[];

  @ApiProperty({ description: 'Customer validation history' })
  validationHistory: any[];

  @ApiProperty({ description: 'Customer activity log' })
  activityLog: any[];
}

/**
 * Customer document DTO
 */
export class CustomerDocumentDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'Document type' })
  type: string;

  @ApiProperty({ description: 'Document filename' })
  fileName: string;

  @ApiProperty({ description: 'Document URL' })
  fileUrl: string;

  @ApiProperty({ description: 'Document MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'Document file size' })
  fileSize: number;

  @ApiProperty({ description: 'Document status' })
  status: string;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: string;
}

/**
 * Upload document DTO
 */
export class UploadDocumentDto {
  @ApiProperty({ description: 'Document type' })
  type: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Document file' })
  file: Express.Multer.File;
}

/**
 * Approve document DTO
 */
export class ApproveDocumentDto {
  @ApiProperty({ description: 'Approval comments' })
  comments?: string;
}

/**
 * Reject document DTO
 */
export class RejectDocumentDto {
  @ApiProperty({ description: 'Rejection reason' })
  reason: string;

  @ApiProperty({ description: 'Additional comments' })
  comments?: string;
}

/**
 * Suspend customer DTO
 */
export class SuspendCustomerDto {
  @ApiProperty({ description: 'Suspension reason' })
  reason: string;
}

/**
 * Customer activity DTO
 */
export class CustomerActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Activity type' })
  type: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'Activity timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'User who performed the activity' })
  performedBy: string;
}

/**
 * Customer statistics DTO
 */
export class CustomerStatisticsDto {
  @ApiProperty({ description: 'Total number of customers' })
  totalCustomers: number;

  @ApiProperty({ description: 'Active customers' })
  activeCustomers: number;

  @ApiProperty({ description: 'Pending validation customers' })
  pendingValidation: number;

  @ApiProperty({ description: 'Suspended customers' })
  suspendedCustomers: number;

  @ApiProperty({ description: 'Customers by type' })
  customersByType: {
    pme: number;
    financial: number;
  };

  @ApiProperty({ description: 'Customer growth data' })
  growthData: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * Customer query parameters DTO
 */
export class CustomerQueryParamsDto {
  @ApiProperty({ required: false, description: 'Page number for pagination' })
  page?: number;

  @ApiProperty({ required: false, description: 'Number of items per page' })
  limit?: number;

  @ApiProperty({ required: false, description: 'Field to sort by' })
  sortBy?: string;

  @ApiProperty({ required: false, description: 'Sort order (asc or desc)' })
  sortOrder?: string;

  @ApiProperty({ required: false, description: 'Filter by customer type' })
  type?: string;

  @ApiProperty({ required: false, description: 'Filter by customer status' })
  status?: string;

  @ApiProperty({ required: false, description: 'Search term' })
  search?: string;
}

/**
 * API Response types for customers
 */
export type CustomerAPIResponse = APIResponse<CustomerDto>;
export type CustomerListAPIResponse = APIResponse<CustomerListResponseDto>;
export type CustomerDetailsAPIResponse = APIResponse<CustomerDetailsResponseDto>;
