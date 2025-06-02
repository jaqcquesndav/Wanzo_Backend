import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { FinancingRecordType, FinancingRecordStatus } from '../entities/financing-record.entity';

export class ListFinancingRecordsDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Max limit to prevent abuse
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Field to sort by', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: "Sort order ('ASC' or 'DESC')", enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Filter by financing type', enum: FinancingRecordType })
  @IsOptional()
  @IsEnum(FinancingRecordType)
  type?: FinancingRecordType;

  @ApiPropertyOptional({ description: 'Filter by financing status', enum: FinancingRecordStatus })
  @IsOptional()
  @IsEnum(FinancingRecordStatus)
  status?: FinancingRecordStatus;

  @ApiPropertyOptional({ description: 'Filter records from this date (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter records up to this date (ISO8601)', example: '2025-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search term for source/purpose or terms' })
  @IsOptional()
  @IsString()
  search?: string;
}
