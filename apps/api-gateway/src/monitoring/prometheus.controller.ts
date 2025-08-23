import { Controller, Get } from '@nestjs/common';
import { register } from 'prom-client';

@Controller('metrics')
export class PrometheusController {
  @Get()
  async getMetrics(): Promise<string> {
    return await register.metrics();
  }
}
