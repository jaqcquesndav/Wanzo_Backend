import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  action!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class ActivityFilterDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}