import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';
import { PrometheusService } from './prometheus.service';

@Controller()
export class PrometheusController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get('/metrics')
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return await register.metrics();
  }
}
