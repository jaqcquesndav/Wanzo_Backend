import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { FinancialProduct } from './entities/financial-product.entity';
import { FundingRequest } from './entities/funding-request.entity';
import { CreditRequest } from './entities/credit-request.entity';
import { CreditDistribution } from './entities/credit-distribution.entity';
import { Contract } from './entities/contract.entity';
import { Disbursement } from './entities/disbursement.entity';
import { TraditionalDisbursement } from './entities/traditional-disbursement.entity';
import { Repayment } from './entities/repayment.entity';
import { Guarantee } from './entities/guarantee.entity';
import { PaymentSchedule } from './entities/payment-schedule.entity';
import { Document } from './entities/document.entity';
import { PortfolioService } from './services/portfolio.service';
import { FinancialProductService } from './services/financial-product.service';
import { FundingRequestService } from './services/funding-request.service';
import { CreditRequestService } from './services/credit-request.service';
import { ContractService } from './services/contract.service';
import { DisbursementService } from './services/disbursement.service';
import { RepaymentService } from './services/repayment.service';
import { PaymentScheduleService } from './services/payment-schedule.service';
import { DocumentService } from './services/document.service';
import { AccountValidationService } from './services/account-validation.service';
import { PortfolioPaymentInfoService } from './services/portfolio-payment-info.service';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioProductsController } from './controllers/portfolio-products.controller';
import { PortfolioSettingsController } from './controllers/portfolio-settings.controller';
import { FinancialProductController } from './controllers/financial-product.controller';
import { FundingRequestController } from './controllers/funding-request.controller';
import { CreditRequestController } from './controllers/credit-request.controller';
import { ContractController } from './controllers/contract.controller';
import { DisbursementController } from './controllers/disbursement.controller';
import { RepaymentController } from './controllers/repayment.controller';
import { PaymentScheduleController } from './controllers/payment-schedule.controller';
import { DocumentController } from './controllers/document.controller';
import { PortfolioPaymentInfoController } from './controllers/portfolio-payment-info.controller';
import { FundingRequestConsumerService } from './consumers/funding-request.consumer';
import { EventsModule } from '../events/events.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portfolio, 
      FinancialProduct, 
      FundingRequest,
      CreditRequest,
      CreditDistribution,
      Contract, 
      Disbursement,
      TraditionalDisbursement,
      Repayment, 
      Guarantee,
      PaymentSchedule,
      Document
    ]),
    EventsModule,
    MulterModule.register({
      dest: './uploads',
    })
  ],
  providers: [
    PortfolioService,
    FinancialProductService,
    FundingRequestService,
    CreditRequestService,
    ContractService,
    DisbursementService,
    RepaymentService,
    PaymentScheduleService,
    DocumentService,
    AccountValidationService,
    PortfolioPaymentInfoService,
    FundingRequestConsumerService,
  ],
  controllers: [
    PortfolioController,
    PortfolioProductsController,
    PortfolioSettingsController,
    FinancialProductController,
    FundingRequestController,
    CreditRequestController,
    ContractController,
    DisbursementController,
    RepaymentController,
    PaymentScheduleController,
    DocumentController,
    PortfolioPaymentInfoController
  ],
  exports: [
    PortfolioService,
    FinancialProductService,
    FundingRequestService,
    CreditRequestService,
    ContractService,
    DisbursementService,
    RepaymentService,
    PaymentScheduleService,
    DocumentService,
    AccountValidationService,
    PortfolioPaymentInfoService,
  ],
})
export class PortfoliosModule {}
