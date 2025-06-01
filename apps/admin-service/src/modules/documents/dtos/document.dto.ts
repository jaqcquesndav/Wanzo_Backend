import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsInt, 
  IsUrl, 
  IsObject, 
  IsBoolean,
  IsISO8601,
  IsUUID
} from 'class-validator';
import { DocumentStatus, DocumentType } from '../entities';

export class DocumentDto {
  id: string;
  companyId: string;
  name: string;
  type: DocumentType;
  size: number;
  url: string;
  status: DocumentStatus;
  uploadedBy: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  folderId?: string;
  description?: string;
  mimeType?: string;
  thumbnail?: string;
  isPublic: boolean;
  expiresAt?: Date;
}

export class CreateDocumentDto {
  @IsString()
  companyId: string;

  @IsString()
  name: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class DocumentQueryParamsDto {
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class DocumentFolderDto {
  id: string;
  name: string;
  companyId: string;
  parentFolderId?: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateDocumentFolderDto {
  @IsString()
  name: string;

  @IsString()
  companyId: string;

  @IsOptional()
  @IsUUID()
  parentFolderId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateDocumentFolderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  parentFolderId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class FolderQueryParamsDto {
  @IsOptional()
  @IsUUID()
  parentFolderId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class DocumentUploadResponseDto {
  data: DocumentDto;
  message: string;
}

export class DocumentResponseDto {
  data: DocumentDto;
}

export class DocumentsListResponseDto {
  data: DocumentDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export class DocumentFolderResponseDto {
  data: DocumentFolderDto;
}

export class DocumentFoldersListResponseDto {
  data: DocumentFolderDto[];
}
