import { IsString, IsOptional, IsDateString, IsEnum, IsUUID, IsObject, IsBoolean, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Query parameters DTOs
export class DashboardQueryParamsDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['last7days', 'last30days', 'monthToDate', 'custom'])
  dateRange?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class WidgetQueryParamsDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}

// User statistics DTOs
export class UserStatisticsDto {
  @IsNumber()
  totalUsers: number;

  @IsNumber()
  activeUsers: number;

  @IsNumber()
  newUsersToday: number;

  @IsObject()
  usersByRole: Record<string, number>;

  @IsObject()
  usersByCountry: Record<string, number>;

  @IsArray()
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
}

// System metrics DTOs
export class DatabaseMetricsDto {
  @IsOptional()
  postgresql?: {
    connectionPoolSize: number;
    activeConnections: number;
    queryPerformance: number;
    storageUsage: number;
  };

  @IsOptional()
  neo4j?: {
    activeConnections: number;
    queryPerformance: number;
    storageUsage: number;
  };

  @IsOptional()
  timescale?: {
    activeConnections: number;
    compressionRatio: number;
    retentionPeriod: number;
    storageUsage: number;
  };
}

export class ApiMetricsDto {
  @IsNumber()
  totalRequests: number;

  @IsNumber()
  requestsPerMinute: number;

  @IsNumber()
  averageResponseTime: number;

  @IsNumber()
  errorRate: number;

  @IsOptional()
  @IsObject()
  requestsByEndpoint?: Record<string, number>;
}

export class ServerHealthDto {
  @IsNumber()
  cpuUsage: number;

  @IsNumber()
  memoryUsage: number;

  @IsNumber()
  diskUsage: number;

  @IsNumber()
  uptime: number;

  @IsNumber()
  activeConnections: number;

  @IsNumber()
  responseTime: number;
}

export class SystemMetricsDto {
  @ValidateNested()
  @Type(() => ServerHealthDto)
  serverHealth: ServerHealthDto;

  @ValidateNested()
  @Type(() => DatabaseMetricsDto)
  databaseMetrics: DatabaseMetricsDto;

  @ValidateNested()
  @Type(() => ApiMetricsDto)
  apiMetrics: ApiMetricsDto;
}

// Revenue statistics DTOs
export class RevenueStatisticsDto {
  @IsNumber()
  currentMonthRevenue: number;

  @IsNumber()
  previousMonthRevenue: number;

  @IsNumber()
  yearToDateRevenue: number;

  @IsNumber()
  projectedAnnualRevenue: number;

  @IsObject()
  revenueBySubscriptionTier: Record<string, number>;

  @IsObject()
  revenueByCountry: Record<string, number>;

  @IsArray()
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

// Token statistics DTOs
export class TokenStatisticsDto {
  @IsNumber()
  totalTokensIssued: number;

  @IsNumber()
  tokensInCirculation: number;

  @IsNumber()
  averageMonthlyConsumption: number;

  @IsObject()
  consumptionByService: Record<string, number>;

  @IsArray()
  consumptionTrend: Array<{
    date: string;
    count: number;
  }>;
}

// Activity DTOs
export class ActivityDto {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details?: Record<string, any>;
}

// Dashboard data response DTOs
export class DashboardDataDto {
  @ValidateNested()
  @Type(() => UserStatisticsDto)
  userStatistics: UserStatisticsDto;

  @ValidateNested()
  @Type(() => SystemMetricsDto)
  systemMetrics: SystemMetricsDto;

  @ValidateNested()
  @Type(() => RevenueStatisticsDto)
  revenueStatistics: RevenueStatisticsDto;

  @ValidateNested()
  @Type(() => TokenStatisticsDto)
  tokenStatistics: TokenStatisticsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  recentActivities: ActivityDto[];
}

// Widget DTOs
export class WidgetContentDto {
  [key: string]: any;
}

export class WidgetDataDto {
  @IsString()
  widgetId: string;

  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsArray()
  content: WidgetContentDto[];
}

// Layout DTOs
export class LayoutItemDto {
  @IsString()
  widgetId: string;

  @IsNumber()
  @Min(0)
  x: number;

  @IsNumber()
  @Min(0)
  y: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  w: number;

  @IsNumber()
  @Min(1)
  h: number;
}

export class WidgetSettingsDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsObject()
  settings: Record<string, any>;
}

export class DashboardConfigurationDto {
  @IsString()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutItemDto)
  layout: LayoutItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetSettingsDto)
  widgets: WidgetSettingsDto[];
}

// Create, update DTOs
export class CreateWidgetDto {
  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class UpdateWidgetDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateDashboardLayoutDto {
  @IsString()
  layoutType: string;

  @IsObject()
  preferences: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutItemDto)
  layout?: LayoutItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetSettingsDto)
  widgets?: WidgetSettingsDto[];
}

export class CreateActivityLogDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsBoolean()
  isHighPriority?: boolean;
}

export class ActivityLogQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Response DTOs
export class DashboardResponseDto {
  data: DashboardDataDto;
}

export class WidgetResponseDto {
  data: WidgetDataDto;
}

export class WidgetListDto {
  id: string;
  title: string;
  type: string;
  isVisible: boolean;
  sortOrder: number;
  configuration?: Record<string, any>;
}

export class WidgetsResponseDto {
  widgets: WidgetListDto[];
}

export class ActivityLogListResponseDto {
  logs: ActivityDto[];
  total: number;
  page: number;
  pages: number;
}

export class StatisticsQueryParamsDto {
  @IsOptional()
  @IsString()
  @IsEnum(['daily', 'weekly', 'monthly'])
  period?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SalesStatisticsDto {
  totalSales: number;
  averageOrderValue: number;
  salesByRegion: Array<{
    region: string;
    amount: number;
  }>;
}

export class UserEngagementStatisticsDto {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDurationMinutes: number;
}
