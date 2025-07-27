import { IsString, IsBoolean, IsOptional, IsISO8601, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SystemInfoResponseDto {
  @ApiProperty({ description: 'Environment' })
  environment!: string;

  @ApiProperty({ description: 'System version' })
  version!: string;

  @ApiProperty({ description: 'Last update date' })
  lastUpdate!: Date;

  @ApiProperty({ description: 'Storage information' })
  storage!: {
    totalSize: number;
    usedSize: number;
    percentage: number;
  };

  @ApiProperty({ description: 'Maintenance information' })
  maintenance!: {
    scheduled: boolean;
    startTime?: Date;
    endTime?: Date;
    message?: string;
  };

  @ApiProperty({ description: 'System limits' })
  limits!: {
    maxUploadSize: number;
    maxUsers: number;
    maxPortfolios: number;
    apiRateLimit: number;
  };
}

export class SystemLogFilterDto {
  @ApiPropertyOptional({ description: 'Log level filter' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Service filter' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ description: 'Text search' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  limit?: number;
}

export class MaintenanceScheduleDto {
  @ApiProperty({ description: 'Maintenance start time (ISO format)' })
  @IsISO8601()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ description: 'Maintenance end time (ISO format)' })
  @IsISO8601()
  @IsNotEmpty()
  endTime!: string;

  @ApiProperty({ description: 'Maintenance message' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Whether to notify users' })
  @IsOptional()
  @IsBoolean()
  notifyUsers?: boolean;
}
