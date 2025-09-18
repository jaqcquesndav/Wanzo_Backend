import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
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
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 1 * 1024 * 1024 * 1024), // 1GB
      () => this.memory.checkRSS('memory_rss', 1.5 * 1024 * 1024 * 1024), // 1.5GB
      // Removed external service checks to avoid circular dependencies and timeouts
    ]);
  }

  @Get('simple')
  @ApiOperation({ summary: 'Simple health check without dependencies' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async simpleCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'portfolio-institution-service',
    };
  }
}
