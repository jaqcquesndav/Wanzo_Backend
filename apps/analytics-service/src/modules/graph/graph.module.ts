import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Node } from './entities/node.entity';
import { Edge } from './entities/edge.entity';
import { Metric } from '../timeseries/entities/metric.entity';
import { GraphService } from './graph.service';
import { FinancialRiskGraphService } from './services/financial-risk-graph.service';
import { RealDataGraphService } from './services/real-data-graph.service';
import { GraphAnalysisController } from './controllers/graph-analysis.controller';
import { FinancialRiskController } from './controllers/financial-risk.controller';
import { RealDataAnalyticsController } from './controllers/real-data-analytics.controller';
import { IntegrationModule } from '../integration/integration.module';
import { TimeseriesModule } from '../timeseries/timeseries.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Node, Edge, Metric]),
    ConfigModule,
    IntegrationModule,
    TimeseriesModule,
  ],
  providers: [GraphService, FinancialRiskGraphService, RealDataGraphService],
  controllers: [GraphAnalysisController, FinancialRiskController, RealDataAnalyticsController],
  exports: [GraphService, FinancialRiskGraphService, RealDataGraphService],
})
export class GraphModule {}
