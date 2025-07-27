import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { FinancialProduct } from './entities/financial-product.entity';
import { FundingRequest } from './entities/funding-request.entity';
import { Contract } from './entities/contract.entity';
import { Disbursement } from './entities/disbursement.entity';
import { Repayment } from './entities/repayment.entity';
import { Guarantee } from './entities/guarantee.entity';
import { PortfolioService } from './services/portfolio.service';
import { FinancialProductService } from './services/financial-product.service';
import { FundingRequestService } from './services/funding-request.service';
import { PortfolioController } from './controllers/portfolio.controller';
import { FinancialProductController } from './controllers/financial-product.controller';
import { FundingRequestController } from './controllers/funding-request.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portfolio, 
      FinancialProduct, 
      FundingRequest, 
      Contract, 
      Disbursement, 
      Repayment, 
      Guarantee
    ]),
  ],
  providers: [
    PortfolioService,
    FinancialProductService,
    FundingRequestService,
  ],
  controllers: [
    PortfolioController,
    FinancialProductController,
    FundingRequestController,
  ],
  exports: [
    PortfolioService,
    FinancialProductService,
    FundingRequestService,
  ],
})
export class PortfoliosModule {}