import { Controller, Get } from '@nestjs/common';
import { register } from 'prom-client';

@Controller()
export class PrometheusController {
  @Get('/metrics')
  async getMetrics(): Promise<string> {
    return await register.metrics();
  }
}
