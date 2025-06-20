import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { FileEntityType, FileCategory } from '../entities/file.entity';

export class UploadFileDto {
  @ApiProperty({
    description: "Type of entity the file is related to ('journal-entry', 'account', 'company', 'fiscal-year')",
    enum: FileEntityType,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileEntityType)
  entityType?: FileEntityType;

  @ApiProperty({
    description: 'ID of the entity the file is related to',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiProperty({
    description: "Category of the file ('invoice', 'receipt', 'statement', 'contract', 'other')",
    enum: FileCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiProperty({
    description: 'Description of the file',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
