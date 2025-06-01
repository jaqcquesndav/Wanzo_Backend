import { IsString, IsOptional, IsDateString, IsEnum, IsUUID, IsObject, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardQueryParamsDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsDateString()
  dateRange?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;
}

export class WidgetQueryParamsDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}

export class KpiDto {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  newCustomersToday: number;
}

export class ChartDataPointDto {
  date?: string;
  month?: string;
  count?: number;
  amount?: number;
}

export class ChartDataDto {
  userSignups: ChartDataPointDto[];
  revenueTrend: ChartDataPointDto[];
}

export class ActivityDto {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export class QuickStatsDto {
  pendingApprovals: number;
  openSupportTickets: number;
}

export class DashboardDataDto {
  kpis: KpiDto;
  charts: ChartDataDto;
  recentActivities: ActivityDto[];
  quickStats: QuickStatsDto;
}

export class DashboardResponseDto {
  data: DashboardDataDto;
}

export class WidgetContentDto {
  message: string;
  timestamp: string;
}

export class WidgetDataDto {
  widgetId: string;
  title: string;
  type: string;
  content: WidgetContentDto[] | Record<string, any>[];
}

export class WidgetResponseDto {
  data: WidgetDataDto;
}

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

export class CreateActivityLogDto {
  @IsString()
  type: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
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
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class ActivityLogListResponseDto {
  logs: ActivityDto[];
  total: number;
  page: number;
  pages: number;
}
