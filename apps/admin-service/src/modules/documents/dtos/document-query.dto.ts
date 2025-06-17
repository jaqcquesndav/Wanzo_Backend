import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, Min, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentStatus, DocumentType } from '../entities/document.entity';

export class DocumentQueryParamsDto {
  @ApiProperty({
    description: 'Search term for document name',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Document type filter',
    enum: DocumentType,
    required: false
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiProperty({
    description: 'Document status filter',
    enum: DocumentStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiProperty({
    description: 'Start date for filtering by upload date',
    required: false
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering by upload date',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    default: 10
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Type of document',
    enum: DocumentType,
    example: DocumentType.RCCM
  })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({
    description: 'ID of the company that owns this document',
    example: 'comp_abc'
  })
  @IsUUID()
  companyId: string;

  @ApiProperty({
    description: 'ID of the folder containing this document (optional)',
    example: 'folder_xyz',
    required: false
  })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiProperty({
    description: 'Description of the document',
    example: 'RCCM certificate for 2023',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDocumentDto {
  @ApiProperty({
    description: 'Type of document',
    enum: DocumentType,
    example: DocumentType.RCCM,
    required: false
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiProperty({
    description: 'Description of the document',
    example: 'RCCM certificate for 2023 (updated)',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Status of the document',
    enum: DocumentStatus,
    example: DocumentStatus.VERIFIED,
    required: false
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiProperty({
    description: 'ID of the folder containing this document',
    example: 'folder_xyz',
    required: false
  })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}

export class DocumentQueryResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the document',
    example: 'doc_123'
  })
  id: string;

  @ApiProperty({
    description: 'Type of document',
    example: 'rccm',
    enum: DocumentType
  })
  type: DocumentType;

  @ApiProperty({
    description: 'Name of the document file',
    example: 'RCCM_Certificate.pdf'
  })
  fileName: string;

  @ApiProperty({
    description: 'URL to access the document file',
    example: 'https://storage.wanzo.com/documents/doc_123/RCCM_Certificate.pdf'
  })
  fileUrl: string;

  @ApiProperty({
    description: 'Status of the document',
    example: 'verified',
    enum: DocumentStatus
  })
  status: DocumentStatus;

  @ApiProperty({
    description: 'Date when the document was uploaded',
    example: '2024-03-15T10:00:00Z'
  })
  uploadedAt: Date;
}

export class PaginationDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  currentPage: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5
  })
  totalPages: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 47
  })
  totalItems: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10
  })
  itemsPerPage: number;
}

export class DocumentsListResponseDto {
  @ApiProperty({
    description: 'Array of document objects',
    type: [DocumentQueryResponseDto]
  })
  data: DocumentQueryResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationDto
  })
  pagination: PaginationDto;
}
