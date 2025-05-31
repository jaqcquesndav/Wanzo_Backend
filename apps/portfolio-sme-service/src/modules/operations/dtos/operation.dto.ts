import { IsString, IsEnum, IsNumber, IsDate, IsOptional, IsUUID, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OperationType, OperationStatus } from '../entities/operation.entity';

class AttachmentDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName!: string;

  @ApiProperty({ description: 'Cloudinary URL' })
  @IsString()
  cloudinaryUrl!: string;

  @ApiPropertyOptional({ description: 'File description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateOperationDto {
  @ApiProperty({ description: 'Operation type', enum: OperationType })
  @IsEnum(OperationType)
  type!: OperationType;

  @ApiProperty({ description: 'Portfolio ID' })
  @IsUUID()
  portfolioId!: string;

  @ApiPropertyOptional({ description: 'Product ID (for credit operations)' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Equipment ID (for leasing operations)' })
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @ApiProperty({ description: 'Emission date' })
  @IsDate()
  @Type(() => Date)
  dateEmission!: Date;

  @ApiProperty({ description: 'Rate or yield percentage' })
  @IsNumber()
  rateOrYield!: number;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  quantity!: number;

  @ApiProperty({ description: 'Duration in months' })
  @IsNumber()
  duration!: number;

  @ApiProperty({ description: 'Operation description' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Requested amount (for credit operations)' })
  @IsOptional()
  @IsNumber()
  requestedAmount?: number;

  @ApiPropertyOptional({ description: 'Initial payment (for leasing operations)' })
  @IsOptional()
  @IsNumber()
  initialPayment?: number;

  @ApiPropertyOptional({ description: 'Attachments', type: [AttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateOperationDto {
  @ApiPropertyOptional({ description: 'Operation status', enum: OperationStatus })
  @IsOptional()
  @IsEnum(OperationStatus)
  status?: OperationStatus;

  @ApiPropertyOptional({ description: 'Rate or yield percentage' })
  @IsOptional()
  @IsNumber()
  rateOrYield?: number;

  @ApiPropertyOptional({ description: 'Duration in months' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Operation description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class OperationFilterDto {
  @ApiPropertyOptional({ description: 'Filter by type', enum: OperationType })
  @IsOptional()
  @IsEnum(OperationType)
  type?: OperationType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: OperationStatus })
  @IsOptional()
  @IsEnum(OperationStatus)
  status?: OperationStatus;

  @ApiPropertyOptional({ description: 'Filter by portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}