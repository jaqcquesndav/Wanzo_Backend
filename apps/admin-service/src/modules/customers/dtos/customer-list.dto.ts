import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { AdminCustomerProfileDto } from './admin-customer-profile.dto';

/**
 * DTO pour les paramètres de requête de la liste des clients
 */
export class CustomerQueryParamsDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Filter by customer type' })
  @IsOptional()
  @IsString()
  type?: 'pme' | 'financial';

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * DTO pour la réponse de la liste des clients
 */
export class CustomerListResponseDto {
  @ApiProperty({ type: [AdminCustomerProfileDto], description: 'List of customer profiles' })
  items: AdminCustomerProfileDto[];

  @ApiProperty({ description: 'Total number of items' })
  totalCount: number;

  @ApiProperty({ description: 'Total number of items (alias)' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

/**
 * DTO pour les statistiques des clients
 */
export class CustomerStatisticsDto {
  @ApiProperty({ description: 'Total number of customers' })
  total: number;

  @ApiProperty({ description: 'Total number of customers (alias)' })
  totalCustomers: number;

  @ApiProperty({ description: 'Number of active customers' })
  active: number;

  @ApiProperty({ description: 'Number of inactive customers' })
  inactive: number;

  @ApiProperty({ description: 'Number of pending customers' })
  pending: number;

  @ApiProperty({ description: 'Number of suspended customers' })
  suspended: number;

  @ApiProperty({ description: 'Customers by type' })
  byType: {
    pme: number;
    financial: number;
  };

  @ApiProperty({ description: 'Customers by type (alias)' })
  customersByType?: {
    pme: number;
    financial: number;
  };

  @ApiProperty({ description: 'Customers by status' })
  customersByStatus?: {
    active: number;
    inactive: number;
    pending: number;
    suspended: number;
    flagged: number;
    archived: number;
  };

  @ApiProperty({ description: 'Customers by account type' })
  byAccountType: {
    freemium: number;
    standard: number;
    premium: number;
    enterprise: number;
  };

  @ApiProperty({ description: 'Customers requiring attention' })
  customersRequiringAttention?: number;

  @ApiProperty({ description: 'Compliance distribution' })
  complianceDistribution?: {
    high: number;
    medium: number;
    low: number;
    critical: number;
  };

  @ApiProperty({ description: 'Average profile completeness' })
  averageCompleteness?: number;

  @ApiProperty({ description: 'Urgent reviews needed' })
  urgentReviews?: number;

  @ApiProperty({ description: 'Profiles needing resync' })
  profilesNeedingResync?: number;

  @ApiProperty({ description: 'Recently updated profiles' })
  recentlyUpdated?: number;

  @ApiProperty({ description: 'Average sync latency' })
  avgSyncLatency?: number;

  @ApiProperty({ description: 'Pending actions' })
  pendingActions?: number;

  @ApiProperty({ description: 'System alerts' })
  systemAlerts?: number;
}