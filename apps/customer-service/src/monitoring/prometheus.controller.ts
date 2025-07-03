import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrometheusService } from './prometheus.service';
import { PrometheusInterceptor } from './prometheus.interceptor';
import { Registry } from 'prom-client';

@ApiTags('monitoring')
@Controller('metrics')
export class PrometheusController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics in text format' })
  getMetrics() {
    return this.prometheusService.getRegister().metrics();
  }
  
  // Static method to create and return a PrometheusInterceptor instance
  static getPrometheusInterceptor(register: Registry) {
    const prometheusService = new PrometheusService();
    prometheusService.setRegister(register);
    return new PrometheusInterceptor(prometheusService);
  }
}
