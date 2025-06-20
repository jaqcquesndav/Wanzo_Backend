import { IsString, IsOptional, IsObject, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
  @IsString()
  userId!: string;

  @IsString()
  actionType!: string;

  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class ActivityFilterDto {
  @ApiProperty({ required: false, description: "Filter by entity type (e.g., 'journal-entry', 'account')" })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ required: false, description: 'Filter by entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ required: false, description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, description: "Filter by action type (e.g., 'create', 'update')" })
  @IsOptional()
  @IsString()
  actionType?: string;

  @ApiProperty({ required: false, description: 'Start date for filter (format: YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for filter (format: YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: "Export format ('csv', 'excel', 'pdf')" })
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'excel', 'pdf'])
  export?: string;
}