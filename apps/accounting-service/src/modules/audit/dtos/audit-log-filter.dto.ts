import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuditLogFilterDto {
  @ApiProperty({ required: false, description: 'Retrieve a specific audit log by its ID' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ required: false, description: "Type of entity to filter logs (e.g., 'journal-entry', 'account', 'fiscal-year')" })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ required: false, description: 'ID of the specific entity to filter logs' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ required: false, description: 'Start date for the period (format: YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for the period (format: YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Filter logs by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, description: "Export format ('csv', 'excel', 'pdf')" })
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'excel', 'pdf'])
  export?: string;
}
