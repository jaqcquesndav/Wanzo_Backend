import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class DocumentFolderDto {
  @ApiProperty({
    description: 'Unique identifier of the document folder',
    example: 'folder_123'
  })
  id: string;

  @ApiProperty({
    description: 'Name of the folder',
    example: 'Tax Documents'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ID of the company that owns this folder',
    example: 'comp_abc'
  })
  @IsUUID()
  companyId: string;

  @ApiProperty({
    description: 'ID of the parent folder (if nested)',
    example: 'folder_456',
    required: false
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({
    description: 'Date when the folder was created',
    example: '2024-03-15T10:00:00Z'
  })
  createdAt: Date;
}

export class CreateDocumentFolderDto {
  @ApiProperty({
    description: 'Name of the folder',
    example: 'Tax Documents'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ID of the company that owns this folder',
    example: 'comp_abc'
  })
  @IsUUID()
  companyId: string;

  @ApiProperty({
    description: 'ID of the parent folder (if nested)',
    example: 'folder_456',
    required: false
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateDocumentFolderDto {
  @ApiProperty({
    description: 'New name for the folder',
    example: 'Tax Documents 2023',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'ID of the parent folder (if changing location)',
    example: 'folder_789',
    required: false
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class DocumentFolderResponseDto {
  @ApiProperty({
    description: 'Document folder object',
    type: DocumentFolderDto
  })
  data: DocumentFolderDto;
}

export class DocumentFoldersListResponseDto {
  @ApiProperty({
    description: 'Array of document folder objects',
    type: [DocumentFolderDto]
  })
  data: DocumentFolderDto[];
}

export class FolderQueryParamsDto {
  @ApiProperty({
    description: 'ID of the parent folder',
    required: false
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({
    description: 'Search term to filter folders by name',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;
}
