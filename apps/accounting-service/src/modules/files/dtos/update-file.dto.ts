import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { FileEntityType, FileCategory } from '../entities/file.entity';

export class UpdateFileDto {
  @ApiProperty({ description: 'New description for the file', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'New category for the file', enum: FileCategory, required: false })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiProperty({ description: 'New entity type for the file', enum: FileEntityType, required: false })
  @IsOptional()
  @IsEnum(FileEntityType)
  entityType?: FileEntityType;

  @ApiProperty({ description: 'New entity ID for the file', required: false })
  @IsOptional()
  @IsUUID()
  entityId?: string;
}
