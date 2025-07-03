import { Module } from '@nestjs/common';
import { PrometheusController } from './prometheus.controller';
import { PrometheusService } from './prometheus.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusInterceptor } from './prometheus.interceptor';

@Module({
  controllers: [PrometheusController],
  providers: [
    PrometheusService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusInterceptor,
    }
  ],
  exports: [PrometheusService],
})
export class MonitoringModule {}
