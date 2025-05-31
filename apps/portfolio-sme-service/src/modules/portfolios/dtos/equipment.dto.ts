import { IsString, IsNumber, IsBoolean, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEquipmentDto {
  @ApiProperty({ description: 'Portfolio ID' })
  @IsUUID()
  portfolioId!: string;

  @ApiProperty({ description: 'Equipment name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Equipment category' })
  @IsString()
  category!: string;

  @ApiProperty({ description: 'Equipment price' })
  @IsNumber()
  price!: number;

  @ApiProperty({ description: 'Equipment specifications' })
  @IsObject()
  specifications!: {
    dimensions?: string;
    power?: string;
    weight?: string;
    fuel?: string;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Equipment condition (new, used)' })
  @IsString()
  condition!: string;

  @ApiProperty({ description: 'Maintenance included' })
  @IsBoolean()
  maintenanceIncluded!: boolean;

  @ApiProperty({ description: 'Insurance required' })
  @IsBoolean()
  insuranceRequired!: boolean;

  @ApiProperty({ description: 'Equipment image URL' })
  @IsString()
  imageUrl!: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateEquipmentDto {
  @ApiPropertyOptional({ description: 'Equipment name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Equipment price' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Equipment specifications' })
  @IsOptional()
  @IsObject()
  specifications?: {
    dimensions?: string;
    power?: string;
    weight?: string;
    fuel?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({ description: 'Equipment condition' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ description: 'Maintenance included' })
  @IsOptional()
  @IsBoolean()
  maintenanceIncluded?: boolean;

  @ApiPropertyOptional({ description: 'Insurance required' })
  @IsOptional()
  @IsBoolean()
  insuranceRequired?: boolean;

  @ApiPropertyOptional({ description: 'Equipment image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Equipment availability' })
  @IsOptional()
  @IsBoolean()
  availability?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class EquipmentFilterDto {
  @ApiPropertyOptional({ description: 'Filter by portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by condition' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ description: 'Filter by availability' })
  @IsOptional()
  @IsBoolean()
  availability?: boolean;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}