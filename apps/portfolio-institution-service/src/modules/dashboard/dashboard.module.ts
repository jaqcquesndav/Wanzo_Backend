import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './services/dashboard.service';
import { TraditionalDashboardService } from './services/traditional-dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { InstitutionModule } from '../institution/institution.module';
import { ProspectionModule } from '../prospection/prospection.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import { FinancialProduct } from '../portfolios/entities/financial-product.entity';
import { FundingRequest } from '../portfolios/entities/funding-request.entity';
import { Contract } from '../portfolios/entities/contract.entity';
import { Repayment } from '../portfolios/entities/repayment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portfolio,
      FinancialProduct,
      FundingRequest,
      Contract,
      Repayment
    ]),
    InstitutionModule,
    ProspectionModule,
    PortfoliosModule,
  ],
  providers: [DashboardService, TraditionalDashboardService],
  controllers: [DashboardController],
  exports: [DashboardService, TraditionalDashboardService],
})
export class DashboardModule {}