import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsInt, 
  IsUrl, 
  IsUUID,
  Min
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus, DocumentType } from '../entities/document.entity';
import { PaginatedResponse, APIResponse } from '../../../common/interfaces';

export class DocumentDto {
  @ApiProperty({
    description: 'Unique identifier of the document',
    example: 'doc_123'
  })
  id: string;

  @ApiProperty({
    description: 'ID of the company that owns this document',
    example: 'comp_abc'
  })
  companyId: string;

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
    description: 'MIME type of the document file',
    example: 'application/pdf'
  })
  mimeType: string;

  @ApiProperty({
    description: 'Size of the document file in bytes',
    example: 102400
  })
  fileSize: number;

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

export class UpdateDocumentStatusDto {
  @ApiProperty({
    description: 'New status for the document',
    example: 'verified',
    enum: DocumentStatus
  })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;
}

export class DocumentsResponseDto implements PaginatedResponse<DocumentDto> {
  @ApiProperty({
    description: 'Array of document objects',
    type: [DocumentDto]
  })
  items: DocumentDto[];

  @ApiProperty({
    description: 'Total number of documents'
  })
  totalCount: number;

  @ApiProperty({
    description: 'Current page number'
  })
  page: number;

  @ApiProperty({
    description: 'Total number of pages'
  })
  totalPages: number;
}

export class DocumentResponseDto {
  @ApiProperty({
    description: 'Document object',
    type: DocumentDto
  })
  data: DocumentDto;
}

export class DocumentUploadResponseDto {
  @ApiProperty({
    description: 'ID of the newly created document',
    example: 'doc_789'
  })
  id: string;

  @ApiProperty({
    description: 'Name of the uploaded file',
    example: 'Tax_Certificate.pdf'
  })
  fileName: string;

  @ApiProperty({
    description: 'URL to access the uploaded file',
    example: 'https://storage.wanzo.com/documents/doc_789/Tax_Certificate.pdf'
  })
  fileUrl: string;

  @ApiProperty({
    description: 'Type of the document',
    example: 'taxNumber',
    enum: DocumentType
  })
  type: DocumentType;

  @ApiProperty({
    description: 'Status of the document',
    example: 'pending',
    enum: DocumentStatus
  })
  status: DocumentStatus;

  @ApiProperty({
    description: 'Date when the document was uploaded',
    example: '2024-06-15T09:45:00Z'
  })
  uploadedAt: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Document uploaded successfully'
  })
  message: string;
}
