
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsIn, IsArray, ValidateNested, IsISO8601, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

// Enums based on documentation
const SystemStatus = ['healthy', 'degraded', 'unhealthy'] as const;
const ServiceStatus = ['operational', 'degraded', 'down'] as const;
const LogLevel = ['info', 'warning', 'error', 'critical'] as const;
const AlertStatus = ['active', 'resolved', 'all'] as const;
const DbType = ['postgres', 'mongodb', 'redis', 'other'] as const;
const AiModelType = ['text', 'image', 'voice', 'embedding', 'other'] as const;
const PerformancePeriod = ['hour', 'day', 'week', 'month'] as const;

// Sub-DTOs for SystemHealth
class ApiHealthDto {
  @ApiProperty({ enum: ServiceStatus })
  @IsIn(ServiceStatus)
  status: 'operational' | 'degraded' | 'down';

  @ApiProperty()
  @IsNumber()
  responseTime: number;

  @ApiProperty()
  @IsNumber()
  errorRate: number;
}

class DatabaseHealthDto {
  @ApiProperty({ enum: ServiceStatus })
  @IsIn(ServiceStatus)
  status: 'operational' | 'degraded' | 'down';

  @ApiProperty()
  @IsNumber()
  connections: number;

  @ApiProperty()
  @IsNumber()
  queryTime: number;
}

class CacheHealthDto {
    @ApiProperty({ enum: ServiceStatus })
    @IsIn(ServiceStatus)
    status: 'operational' | 'degraded' | 'down';

    @ApiProperty()
    @IsNumber()
    hitRate: number;

    @ApiProperty()
    @IsNumber()
    memoryUsage: number;
}

class StorageHealthDto {
    @ApiProperty({ enum: ServiceStatus })
    @IsIn(ServiceStatus)
    status: 'operational' | 'degraded' | 'down';

    @ApiProperty()
    @IsNumber()
    capacity: number;

    @ApiProperty()
    @IsNumber()
    used: number;

    @ApiProperty()
    @IsNumber()
    available: number;
}

class AiHealthDto {
    @ApiProperty({ enum: ServiceStatus })
    @IsIn(ServiceStatus)
    status: 'operational' | 'degraded' | 'down';

    @ApiProperty()
    @IsNumber()
    responseTime: number;

    @ApiProperty()
    @IsNumber()
    errorRate: number;
}

class ServicesHealthDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => ApiHealthDto)
  api: ApiHealthDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DatabaseHealthDto)
  database: DatabaseHealthDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CacheHealthDto)
  cache: CacheHealthDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => StorageHealthDto)
  storage: StorageHealthDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AiHealthDto)
  ai: AiHealthDto;
}

class MemoryHealthDto {
    @ApiProperty()
    @IsNumber()
    total: number;

    @ApiProperty()
    @IsNumber()
    used: number;

    @ApiProperty()
    @IsNumber()
    free: number;
}

class CpuHealthDto {
    @ApiProperty()
    @IsNumber()
    usage: number;

    @ApiProperty()
    @IsNumber()
    cores: number;
}

// Main DTOs
export class SystemHealthDto {
  @ApiProperty({ enum: SystemStatus })
  @IsIn(SystemStatus)
  status: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty()
  @IsNumber()
  uptime: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ServicesHealthDto)
  services: ServicesHealthDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => MemoryHealthDto)
  memory: MemoryHealthDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CpuHealthDto)
  cpu: CpuHealthDto;
}

export class SystemLogDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsISO8601()
  timestamp: string;

  @ApiProperty({ enum: LogLevel })
  @IsIn(LogLevel)
  level: 'info' | 'warning' | 'error' | 'critical';

  @ApiProperty()
  @IsString()
  service: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class SystemAlertDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsISO8601()
  timestamp: string;

  @ApiProperty({ enum: LogLevel })
  @IsIn(LogLevel)
  level: 'info' | 'warning' | 'error' | 'critical';

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  service: string;

  @ApiProperty()
  @IsBoolean()
  isResolved: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601()
  resolvedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resolvedBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class ApiPerformanceMetricDto {
  @ApiProperty()
  @IsString()
  endpoint: string;

  @ApiProperty()
  @IsString()
  method: string;

  @ApiProperty()
  @IsNumber()
  averageResponseTime: number;

  @ApiProperty()
  @IsNumber()
  p95ResponseTime: number;

  @ApiProperty()
  @IsNumber()
  requestCount: number;

  @ApiProperty()
  @IsNumber()
  errorCount: number;

  @ApiProperty()
  @IsNumber()
  errorRate: number;

  @ApiProperty()
  @IsISO8601()
  timestamp: string;
}

export class DatabaseMetricDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: DbType })
  @IsIn(DbType)
  type: 'postgres' | 'mongodb' | 'redis' | 'other';

  @ApiProperty({ enum: ServiceStatus })
  @IsIn(ServiceStatus)
  status: 'operational' | 'degraded' | 'down';

  @ApiProperty()
  @IsNumber()
  size: number;

  @ApiProperty()
  @IsNumber()
  connections: number;

  @ApiProperty()
  @IsNumber()
  queryCount: number;

  @ApiProperty()
  @IsNumber()
  averageQueryTime: number;

  @ApiProperty()
  @IsNumber()
  slowQueries: number;
}

export class AiModelConfigDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  provider: string;

  @ApiProperty({ enum: AiModelType })
  @IsIn(AiModelType)
  type: 'text' | 'image' | 'voice' | 'embedding' | 'other';

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsNumber()
  tokensPerRequest: number;

  @ApiProperty()
  @IsNumber()
  costPerToken: number;

  @ApiProperty()
  @IsNumber()
  maxTokens: number;

  @ApiProperty()
  @IsNumber()
  temperature: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiEndpoint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiVersion?: string;
}

// DTOs for request bodies
export class ResolveSystemAlertDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;
}

export class UpdateAiModelConfigDto extends PartialType(AiModelConfigDto) {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    tokensPerRequest?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    maxTokens?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    temperature?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    apiEndpoint?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    apiVersion?: string;
}

export class SetMaintenanceModeDto {
  @ApiProperty()
  @IsBoolean()
  enable: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601()
  estimatedEndTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;
}

// DTOs for query parameters
export class GetSystemLogsQueryDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @ApiProperty({ required: false, enum: LogLevel })
    @IsOptional()
    @IsIn(LogLevel)
    level?: 'info' | 'warning' | 'error' | 'critical';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    service?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiProperty({ required: false, default: 50 })
    @IsOptional()
    @IsNumber()
    limit?: number;
}

export class GetSystemAlertsQueryDto {
    @ApiProperty({ required: false, enum: AlertStatus, default: 'active' })
    @IsOptional()
    @IsIn(AlertStatus)
    status?: 'active' | 'resolved' | 'all';

    @ApiProperty({ required: false, enum: LogLevel })
    @IsOptional()
    @IsIn(LogLevel)
    level?: 'info' | 'warning' | 'error' | 'critical';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    service?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiProperty({ required: false, default: 20 })
    @IsOptional()
    @IsNumber()
    limit?: number;
}

export class GetApiPerformanceQueryDto {
    @ApiProperty({ required: false, enum: PerformancePeriod, default: 'day' })
    @IsOptional()
    @IsIn(PerformancePeriod)
    period?: 'hour' | 'day' | 'week' | 'month';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    endpoint?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    method?: string;
}

// Response DTOs with pagination
export class SystemLogsResponseDto {
    @ApiProperty({ type: [SystemLogDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SystemLogDto)
    logs: SystemLogDto[];

    @ApiProperty()
    @IsNumber()
    totalCount: number;

    @ApiProperty()
    @IsNumber()
    page: number;

    @ApiProperty()
    @IsNumber()
    totalPages: number;
}

export class SystemAlertsResponseDto {
    @ApiProperty({ type: [SystemAlertDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SystemAlertDto)
    alerts: SystemAlertDto[];

    @ApiProperty()
    @IsNumber()
    totalCount: number;

    @ApiProperty()
    @IsNumber()
    page: number;

    @ApiProperty()
    @IsNumber()
    totalPages: number;
}

export class ApiPerformanceResponseDto {
    @ApiProperty({ type: [ApiPerformanceMetricDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ApiPerformanceMetricDto)
    metrics: ApiPerformanceMetricDto[];

    @ApiProperty()
    @IsObject()
    summary: {
        totalRequests: number;
        totalErrors: number;
        overallErrorRate: number;
        averageResponseTime: number;
    };
}

export class DatabaseMetricsResponseDto {
    @ApiProperty({ type: [DatabaseMetricDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DatabaseMetricDto)
    databases: DatabaseMetricDto[];
}

export class AiModelsResponseDto {
    @ApiProperty({ type: [AiModelConfigDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AiModelConfigDto)
    models: AiModelConfigDto[];
}

export class MaintenanceStatusResponseDto {
    @ApiProperty()
    @IsBoolean()
    inMaintenance: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsISO8601()
    estimatedEndTime: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    message: string | null;
}

export class SetMaintenanceModeResponseDto extends MaintenanceStatusResponseDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    enabledBy?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    enabledAt?: string;
}

export class SystemStatusResponseDto {
    @ApiProperty()
    @IsString()
    status: string;

    @ApiProperty()
    @IsString()
    version: string;

    @ApiProperty()
    @IsNumber()
    uptime: number;

    @ApiProperty()
    @IsISO8601()
    timestamp: string;

    @ApiProperty()
    @IsObject()
    services: {
        api: string;
        database: string;
        ai: string;
        payments: string;
    };
}
