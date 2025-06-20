import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class ActivityFilterDto {
  @ApiProperty({ description: "Filter by entity type (e.g., 'journal-entry', 'account')", required: false })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ description: 'Filter by entity ID', required: false })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Filter by user ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: "Filter by action type (e.g., 'create', 'update')", required: false })
  @IsOptional()
  @IsString()
  actionType?: string;

  @ApiProperty({ description: 'Start date for filter (format: YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for filter (format: YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: "Export format ('csv', 'excel', 'pdf')", required: false })
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'excel', 'pdf'])
  export?: string;
}
