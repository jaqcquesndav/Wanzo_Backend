import { Module } from '@nestjs/common';
import { ReportService } from './services/report.service';
import { PerformanceService } from './services/performance.service';
import { ReportController } from './controllers/report.controller';
import { PerformanceController } from './controllers/performance.controller';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { OperationsModule } from '../operations/operations.module';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [
    PortfoliosModule,
    OperationsModule,
    AssetsModule,
  ],
  providers: [ReportService, PerformanceService],
  controllers: [ReportController, PerformanceController],
  exports: [ReportService, PerformanceService],
})
export class ReportsModule {}