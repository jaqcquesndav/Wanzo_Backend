import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { GraphModule } from '../graph/graph.module';
import { TimeseriesModule } from '../timeseries/timeseries.module';

@Module({
  imports: [GraphModule, TimeseriesModule],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}