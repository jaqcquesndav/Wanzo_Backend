import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { RelatedEntityType } from '../entities/document.entity';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Original name of the uploaded file', example: 'invoice_march.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({ description: 'Size of the file in bytes', example: 102400 })
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty({ description: 'URL where the file is stored', example: 'https://storage.example.com/documents/invoice_march.pdf' })
  @IsString()
  @IsNotEmpty()
  storageUrl: string;

  @ApiProperty({ description: 'Category or type of the document', example: 'Invoice' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({
    description: 'Type of the entity this document is related to',
    enum: RelatedEntityType,
    example: RelatedEntityType.EXPENSE,
    required: false,
  })
  @IsOptional()
  @IsEnum(RelatedEntityType)
  relatedToEntityType?: RelatedEntityType;

  @ApiProperty({ description: 'ID of the entity this document is related to', example: 'f1c5c9c0-1b1a-4e2a-8c0a-9a3d2a1b0c0e', required: false })
  @IsOptional()
  @IsUUID()
  relatedToEntityId?: string;

  @ApiProperty({ description: 'Optional description for the document', example: 'Monthly electricity bill for March 2025', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Tags for easier searching and categorization', example: ['invoice', 'utility', 'march2025'], isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((tag: any) => tag)
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  // All fields are optional for update
}

export class ListDocumentsDto {
  @ApiProperty({ description: 'Page number for pagination', example: 1, required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page', example: 10, required: false, default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ description: 'Filter by document type', example: 'Invoice', required: false })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiProperty({ description: 'Filter by related entity type', enum: RelatedEntityType, example: RelatedEntityType.EXPENSE, required: false })
  @IsOptional()
  @IsEnum(RelatedEntityType)
  relatedToEntityType?: RelatedEntityType;

  @ApiProperty({ description: 'Filter by related entity ID', example: 'f1c5c9c0-1b1a-4e2a-8c0a-9a3d2a1b0c0e', required: false })
  @IsOptional()
  @IsUUID()
  relatedToEntityId?: string;

  @ApiProperty({ description: 'Search by tag', example: 'utility', required: false })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ description: 'Search term for file name or description', example: 'electricity bill', required: false })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({ description: 'Sort by field', example: 'uploadedAt', required: false, default: 'uploadedAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'uploadedAt';

  @ApiProperty({ description: 'Sort order', example: 'DESC', required: false, default: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
