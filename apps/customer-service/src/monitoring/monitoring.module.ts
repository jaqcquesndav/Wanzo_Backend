import { Module } from '@nestjs/common';
import { PrometheusController } from './prometheus.controller';

@Module({
  controllers: [PrometheusController],
  exports: [PrometheusController],
})
export class MonitoringModule {}
