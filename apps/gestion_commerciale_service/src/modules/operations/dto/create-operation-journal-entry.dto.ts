import { IsString, IsOptional, IsDateString, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOperationJournalEntryDto {
  @ApiProperty({ description: 'User ID performing the operation', example: 'user-uuid-123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Type of operation performed', example: 'CREATE_PRODUCT' })
  @IsString()
  @IsNotEmpty()
  operationType: string;

  @ApiProperty({ description: 'Resource affected by the operation', example: 'Product' })
  @IsString()
  @IsNotEmpty()
  resourceAffected: string;

  @ApiPropertyOptional({ description: 'ID of the affected resource', example: 'product-uuid-456' })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiProperty({ description: 'Status of the operation', example: 'SUCCESS' })
  @IsString()
  @IsNotEmpty()
  status: string; // e.g., 'SUCCESS', 'FAILURE'

  @ApiPropertyOptional({ description: 'Detailed information about the operation', type: 'object', example: { oldValue: {}, newValue: {} } })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  @ApiPropertyOptional({ description: 'IP address of the user performing the operation', example: '192.168.1.1' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent of the client', example: 'Mozilla/5.0 (...)' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Timestamp of the operation. Defaults to current time if not provided.', example: '2023-10-27T10:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  timestamp?: Date;
}
