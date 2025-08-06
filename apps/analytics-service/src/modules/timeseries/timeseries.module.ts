import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TimeseriesService } from './timeseries.service';
import { TimeseriesData } from './entities/timeseries-data.entity';
import timeseriesConfig from '../../config/timeseries.config';
import { TimeseriesRiskService } from './services/timeseries-risk.service';

@Module({
  imports: [
    ConfigModule.forFeature(timeseriesConfig),
    TypeOrmModule.forFeature([TimeseriesData]),
  ],
  providers: [TimeseriesService, TimeseriesRiskService],
  exports: [TimeseriesService, TimeseriesRiskService],
})
export class TimeseriesModule {}