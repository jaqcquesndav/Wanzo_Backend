import { Module } from '@nestjs/common';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { InstitutionModule } from '../institution/institution.module';
import { ProspectionModule } from '../prospection/prospection.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [
    InstitutionModule,
    ProspectionModule,
    PortfoliosModule,
    OperationsModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}