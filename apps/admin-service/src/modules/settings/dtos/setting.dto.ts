import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateSettingDto {
  @IsString()
  key!: string;

  @IsObject()
  value!: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateSettingDto {
  @IsObject()
  value!: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}