import { IsString, IsOptional, IsEnum, IsUUID, IsObject, ValidateNested, IsNumber, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DocumentType, DocumentStatus } from '../entities/document.entity';

export class DocumentMetadataDto {
  @ApiPropertyOptional({ description: 'ID de l\'utilisateur qui a téléchargé le document' })
  @IsOptional()
  @IsString()
  uploaded_by?: string;

  @ApiPropertyOptional({ description: 'Date de téléchargement', type: Date })
  @IsOptional()
  @IsDateString()
  upload_date?: string;

  @ApiPropertyOptional({ description: 'Tags associés au document', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Date d\'expiration du document', type: Date })
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @ApiPropertyOptional({ description: 'Champs personnalisés', type: Object })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}

export class CreateDocumentDto {
  @ApiProperty({ description: 'Nom du document' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Description du document' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Type de document', 
    enum: DocumentType,
    example: DocumentType.CONTRACT
  })
  @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiPropertyOptional({ description: 'ID de la demande de financement associée' })
  @IsOptional()
  @IsUUID()
  funding_request_id?: string;

  @ApiPropertyOptional({ description: 'ID du contrat associé' })
  @IsOptional()
  @IsUUID()
  contract_id?: string;

  @ApiPropertyOptional({ description: 'ID du déboursement associé' })
  @IsOptional()
  @IsUUID()
  disbursement_id?: string;

  @ApiPropertyOptional({ description: 'ID du remboursement associé' })
  @IsOptional()
  @IsUUID()
  repayment_id?: string;

  @ApiPropertyOptional({ description: 'Version du document' })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiPropertyOptional({ description: 'Métadonnées du document', type: DocumentMetadataDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DocumentMetadataDto)
  metadata?: DocumentMetadataDto;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'Nom du document' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description du document' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Type de document', 
    enum: DocumentType
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({ 
    description: 'Statut du document', 
    enum: DocumentStatus
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: 'Version du document' })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiPropertyOptional({ description: 'Métadonnées du document', type: DocumentMetadataDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DocumentMetadataDto)
  metadata?: DocumentMetadataDto;
}

export class DocumentFilterDto {
  @ApiPropertyOptional({ description: 'Type de document', enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({ description: 'Statut du document', enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: 'ID de la demande de financement associée' })
  @IsOptional()
  @IsUUID()
  funding_request_id?: string;

  @ApiPropertyOptional({ description: 'ID du contrat associé' })
  @IsOptional()
  @IsUUID()
  contract_id?: string;

  @ApiPropertyOptional({ description: 'ID du déboursement associé' })
  @IsOptional()
  @IsUUID()
  disbursement_id?: string;

  @ApiPropertyOptional({ description: 'ID du remboursement associé' })
  @IsOptional()
  @IsUUID()
  repayment_id?: string;

  @ApiPropertyOptional({ description: 'Terme de recherche' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Champ de tri', example: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Ordre de tri', enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO pour la réponse du document
 */
export class DocumentResponseDto {
  @ApiProperty({ description: 'ID unique du document' })
  id!: string;

  @ApiProperty({ description: 'Nom du document' })
  name!: string;

  @ApiPropertyOptional({ description: 'Description du document' })
  description?: string;

  @ApiProperty({ 
    description: 'Type de document', 
    enum: DocumentType,
    example: DocumentType.CONTRACT
  })
  type!: DocumentType;

  @ApiProperty({ 
    description: 'Statut du document', 
    enum: DocumentStatus,
    example: DocumentStatus.ACTIVE
  })
  status!: DocumentStatus;

  @ApiPropertyOptional({ description: 'Chemin du fichier' })
  file_path?: string;

  @ApiPropertyOptional({ description: 'Taille du fichier en octets' })
  file_size?: number;

  @ApiPropertyOptional({ description: 'Type MIME du fichier' })
  mime_type?: string;

  @ApiPropertyOptional({ description: 'ID de la demande de financement associée' })
  funding_request_id?: string;

  @ApiPropertyOptional({ description: 'ID du contrat associé' })
  contract_id?: string;

  @ApiPropertyOptional({ description: 'ID du déboursement associé' })
  disbursement_id?: string;

  @ApiPropertyOptional({ description: 'ID du remboursement associé' })
  repayment_id?: string;

  @ApiPropertyOptional({ description: 'Version du document' })
  version?: number;

  @ApiPropertyOptional({ description: 'Métadonnées du document', type: DocumentMetadataDto })
  metadata?: DocumentMetadataDto;

  @ApiProperty({ description: 'Date de création du document' })
  created_at!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour du document' })
  updated_at!: Date;
}
