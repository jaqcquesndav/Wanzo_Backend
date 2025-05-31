import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Node } from './entities/node.entity';
import { Edge } from './entities/edge.entity';
import { Metric } from '../timeseries/entities/metric.entity';
import { GraphService } from './graph.service';
import { GraphAnalyticsService } from './services/graph-analytics.service';
import { GraphAnalyticsController } from './controllers/graph-analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Node, Edge, Metric]),
  ],
  providers: [GraphService, GraphAnalyticsService],
  controllers: [GraphAnalyticsController],
  exports: [GraphService, GraphAnalyticsService],
})
export class GraphModule {}