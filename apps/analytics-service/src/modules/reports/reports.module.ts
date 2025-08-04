import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { DataCollectionModule } from '../data-collection/data-collection.module';

@Module({
  imports: [DataCollectionModule],
  controllers: [ReportsController],
  providers: [],
})
export class ReportsModule {}
