import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  async check() {
    // Simplified health check - only memory, no external dependencies
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 1000 * 1024 * 1024), // 1GB - increased threshold
    ]);
  }

  @Get('simple')
  @ApiOperation({ summary: 'Simple health check' })
  async simple() {
    // Fallback simple endpoint that always works
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
