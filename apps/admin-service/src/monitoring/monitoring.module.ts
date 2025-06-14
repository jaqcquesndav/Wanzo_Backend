import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusController } from './prometheus.controller';
import { PrometheusService } from './prometheus.service';

@Module({
  imports: [ConfigModule],
  controllers: [PrometheusController],
  providers: [PrometheusService],
  exports: [PrometheusService],
})
export class MonitoringModule {}