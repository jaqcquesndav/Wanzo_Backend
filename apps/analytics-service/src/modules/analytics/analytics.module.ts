import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { DataCollectionModule } from '../data-collection/data-collection.module';

@Module({
  imports: [DataCollectionModule],
  controllers: [AnalyticsController],
  providers: [],
})
export class AnalyticsModule {}
