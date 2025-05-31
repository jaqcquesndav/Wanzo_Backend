import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => this.db.pingCheck('database'),
      async (): Promise<HealthIndicatorResult> => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      async (): Promise<HealthIndicatorResult> => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
      async (): Promise<HealthIndicatorResult> => this.healthService.checkAuthService(),
      async (): Promise<HealthIndicatorResult> => this.healthService.checkAnalyticsService(),
      async (): Promise<HealthIndicatorResult> => this.healthService.checkAdminService(),
    ]);
  }
}