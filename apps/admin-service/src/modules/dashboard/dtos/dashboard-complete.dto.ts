import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponse, APIResponse } from '../../../common/interfaces';
import { AdhaMetricsDto } from './adha-metrics.dto';

/**
 * User Statistics as per documentation
 */
export class UserStatisticsDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Number of active users' })
  activeUsers: number;

  @ApiProperty({ description: 'Number of new users today' })
  newUsersToday: number;

  @ApiProperty({ description: 'Distribution of users by role' })
  usersByRole: {
    super_admin: number;
    cto: number;
    growth_finance: number;
    customer_support: number;
    content_manager: number;
    company_admin: number;
    company_user: number;
  };

  @ApiProperty({ description: 'Distribution of users by country' })
  usersByCountry: {
    RDC: number;
    Rwanda: number;
    Kenya: number;
    France: number;
    Other: number;
  };

  @ApiProperty({ description: 'User growth over time' })
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * System Metrics as per documentation
 */
export class SystemMetricsDto {
  @ApiProperty({ description: 'Server health metrics' })
  serverHealth: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    uptime: number;
    activeConnections: number;
    responseTime: number;
  };

  @ApiProperty({ description: 'Database metrics' })
  databaseMetrics: {
    postgresql: {
      connectionPoolSize: number;
      activeConnections: number;
      queryPerformance: number;
      storageUsage: number;
    };
    neo4j: {
      activeConnections: number;
      queryPerformance: number;
      storageUsage: number;
    };
    timescale: {
      activeConnections: number;
      compressionRatio: number;
      retentionPeriod: number;
      storageUsage: number;
    };
  };

  @ApiProperty({ description: 'API metrics' })
  apiMetrics: {
    totalRequests: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    requestsByEndpoint: Record<string, number>;
  };
}

/**
 * Revenue Statistics as per documentation
 */
export class RevenueStatisticsDto {
  @ApiProperty({ description: 'Current month revenue' })
  currentMonthRevenue: number;

  @ApiProperty({ description: 'Previous month revenue' })
  previousMonthRevenue: number;

  @ApiProperty({ description: 'Year to date revenue' })
  yearToDateRevenue: number;

  @ApiProperty({ description: 'Projected annual revenue' })
  projectedAnnualRevenue: number;

  @ApiProperty({ description: 'Revenue by subscription tier' })
  revenueBySubscriptionTier: {
    basic: number;
    standard: number;
    premium: number;
  };

  @ApiProperty({ description: 'Revenue by country' })
  revenueByCountry: {
    RDC: number;
    Rwanda: number;
    Kenya: number;
    France: number;
    Other: number;
  };

  @ApiProperty({ description: 'Monthly revenue trend' })
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

/**
 * Token Statistics as per documentation
 */
export class TokenStatisticsDto {
  @ApiProperty({ description: 'Total tokens issued' })
  totalTokensIssued: number;

  @ApiProperty({ description: 'Tokens in circulation' })
  tokensInCirculation: number;

  @ApiProperty({ description: 'Average monthly consumption' })
  averageMonthlyConsumption: number;

  @ApiProperty({ description: 'Consumption by service' })
  consumptionByService: {
    chat: number;
    document_analysis: number;
    market_intelligence: number;
    other: number;
  };

  @ApiProperty({ description: 'Consumption trend over time' })
  consumptionTrend: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Recent Activities as per documentation
 */
export class RecentActivitiesDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  userName: string;

  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiProperty({ description: 'Timestamp of the activity' })
  timestamp: string;

  @ApiProperty({ description: 'Additional details' })
  details: Record<string, any>;
}

/**
 * Complete Dashboard Data as per documentation
 */
export class DashboardCompleteDataDto {
  @ApiProperty({ description: 'User statistics' })
  userStatistics: UserStatisticsDto;

  @ApiProperty({ description: 'System metrics' })
  systemMetrics: SystemMetricsDto;

  @ApiProperty({ description: 'Revenue statistics' })
  revenueStatistics: RevenueStatisticsDto;

  @ApiProperty({ description: 'Token statistics' })
  tokenStatistics: TokenStatisticsDto;

  @ApiPropertyOptional({ description: 'ADHA Credit AI metrics' })
  adhaMetrics?: AdhaMetricsDto;

  @ApiProperty({ description: 'Recent activities' })
  recentActivities: RecentActivitiesDto[];
}

/**
 * Dashboard Configuration DTOs
 */
export class DashboardConfigurationDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Dashboard layout configuration' })
  layout: Array<{
    widgetId: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;

  @ApiProperty({ description: 'Widget configurations' })
  widgets: Array<{
    id: string;
    type: string;
    settings: Record<string, any>;
  }>;
}

/**
 * Update Dashboard Configuration DTO
 */
export class UpdateDashboardConfigurationDto {
  @ApiProperty({ description: 'Dashboard layout configuration' })
  layout: Array<{
    widgetId: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;

  @ApiProperty({ description: 'Widget configurations' })
  widgets: Array<{
    id: string;
    type: string;
    settings: Record<string, any>;
  }>;
}

/**
 * API Response wrappers using standard interfaces
 */
export type DashboardDataAPIResponse = APIResponse<DashboardCompleteDataDto>;
export type DashboardConfigurationAPIResponse = APIResponse<DashboardConfigurationDto>;
