import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Node } from './entities/node.entity';
import { Edge } from './entities/edge.entity';
import { Metric } from '../timeseries/entities/metric.entity';
import { GraphService } from './graph.service';
import { FinancialRiskGraphService } from './services/financial-risk-graph.service';
import { GraphAnalysisController } from './controllers/graph-analysis.controller';
import { FinancialRiskController } from './controllers/financial-risk.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Node, Edge, Metric]),
    ConfigModule,
  ],
  providers: [GraphService, FinancialRiskGraphService],
  controllers: [GraphAnalysisController, FinancialRiskController],
  exports: [GraphService, FinancialRiskGraphService],
})
export class GraphModule {}