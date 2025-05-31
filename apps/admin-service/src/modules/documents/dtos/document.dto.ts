import { IsString, IsEnum, IsOptional, IsDate, IsObject, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType, DocumentStatus } from '../entities/document.entity';

export class CreateDocumentDto {
  @IsUUID()
  companyId!: string;

  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  name!: string;

  @IsString()
  cloudinaryId!: string;

  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateDocumentStatusDto {
  @IsEnum(DocumentStatus)
  status!: DocumentStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class DocumentFilterDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsString()
  search?: string;
}