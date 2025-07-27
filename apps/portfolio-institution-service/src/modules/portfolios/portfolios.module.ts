import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { FinancialProduct } from './entities/financial-product.entity';
import { FundingRequest } from './entities/funding-request.entity';
import { Contract } from './entities/contract.entity';
import { Disbursement } from './entities/disbursement.entity';
import { Repayment } from './entities/repayment.entity';
import { Guarantee } from './entities/guarantee.entity';
import { PaymentSchedule } from './entities/payment-schedule.entity';
import { Document } from './entities/document.entity';
import { PortfolioService } from './services/portfolio.service';
import { FinancialProductService } from './services/financial-product.service';
import { FundingRequestService } from './services/funding-request.service';
import { ContractService } from './services/contract.service';
import { DisbursementService } from './services/disbursement.service';
import { RepaymentService } from './services/repayment.service';
import { PaymentScheduleService } from './services/payment-schedule.service';
import { DocumentService } from './services/document.service';
import { PortfolioController } from './controllers/portfolio.controller';
import { FinancialProductController } from './controllers/financial-product.controller';
import { FundingRequestController } from './controllers/funding-request.controller';
import { ContractController } from './controllers/contract.controller';
import { DisbursementController } from './controllers/disbursement.controller';
import { RepaymentController } from './controllers/repayment.controller';
import { PaymentScheduleController } from './controllers/payment-schedule.controller';
import { DocumentController } from './controllers/document.controller';
import { EventsModule } from '../events/events.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portfolio, 
      FinancialProduct, 
      FundingRequest, 
      Contract, 
      Disbursement, 
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
    ContractService,
    DisbursementService,
    RepaymentService,
    PaymentScheduleService,
    DocumentService
  ],
  controllers: [
    PortfolioController,
    FinancialProductController,
    FundingRequestController,
    ContractController,
    DisbursementController,
    RepaymentController,
    PaymentScheduleController,
    DocumentController
  ],
  exports: [
    PortfolioService,
    FinancialProductService,
    FundingRequestService,
    ContractService,
    DisbursementService,
    RepaymentService,
    PaymentScheduleService,
    DocumentService
  ],
})
export class PortfoliosModule {}