import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ description: 'Setting key' })
  @IsString()
  key!: string;

  @ApiProperty({ description: 'Setting value' })
  @IsObject()
  value!: any;

  @ApiPropertyOptional({ description: 'Setting description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Public visibility' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateSettingDto {
  @ApiProperty({ description: 'Setting value' })
  @IsObject()
  value!: any;

  @ApiPropertyOptional({ description: 'Setting description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Public visibility' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}