import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardService } from './services/dashboard.service';
import { TraditionalDashboardService } from './services/traditional-dashboard.service';
import { OHADAMetricsService } from './services/ohada-metrics.service';
import { OHADAOrchestrationService } from './services/ohada-orchestration.service';
import { OHADACalculatorService } from './calculators/ohada-calculator.service';
import { OHADAMappingService } from './services/ohada-mapping.service';
import { DashboardPreferencesService } from './services/dashboard-preferences.service';
import { DashboardController } from './controllers/dashboard.controller';
import { InstitutionModule } from '../institution/institution.module';
import { ProspectionModule } from '../prospection/prospection.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import { FinancialProduct } from '../portfolios/entities/financial-product.entity';
import { FundingRequest } from '../portfolios/entities/funding-request.entity';
import { Contract } from '../portfolios/entities/contract.entity';
import { Repayment } from '../portfolios/entities/repayment.entity';
import { OHADAMetric, OHADASnapshot } from './entities/ohada-metric.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portfolio,
      FinancialProduct,
      FundingRequest,
      Contract,
      Repayment,
      OHADAMetric,
      OHADASnapshot
    ]),
    ScheduleModule.forRoot(), // Pour les tâches cron
    InstitutionModule,
    ProspectionModule,
    PortfoliosModule,
  ],
  providers: [
    // Services legacy
    DashboardService, 
    TraditionalDashboardService,
    
    // Nouveaux services OHADA
    OHADAMetricsService,
    OHADAOrchestrationService,
    OHADACalculatorService,
    OHADAMappingService,
    DashboardPreferencesService
  ],
  controllers: [DashboardController],
  exports: [
    DashboardService, 
    TraditionalDashboardService,
    OHADAMetricsService,
    OHADAOrchestrationService,
    DashboardPreferencesService
  ],
})
export class DashboardModule {}
