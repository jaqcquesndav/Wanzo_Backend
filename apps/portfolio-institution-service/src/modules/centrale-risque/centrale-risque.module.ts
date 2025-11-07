import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { 
  CreditRisk,
  LeasingRisk,
  InvestmentRisk,
  RiskEntry,
  RiskAlert,
  PaymentIncident,
  CompanyEngagement,
  CreditScoreHistory,
  Collateral,
  CompanyLoan,
  FinancialTransaction
} from './entities';

// Services
import { 
  RiskApiService,
  CentraleRisqueApiService,
  CentraleRisqueStorageService,
  CentraleRisqueService 
} from './services';
import { PortfolioCreditScoreEventConsumerService } from './services/credit-consumer.service';

// Controllers
import { 
  RiskController,
  CentraleRisqueController 
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditRisk,
      LeasingRisk,
      InvestmentRisk,
      RiskEntry,
      RiskAlert,
      PaymentIncident,
      CompanyEngagement,
      CreditScoreHistory,
      Collateral,
      CompanyLoan,
      FinancialTransaction
    ])
  ],
  providers: [
    RiskApiService,
    CentraleRisqueApiService,
    CentraleRisqueStorageService,
    CentraleRisqueService,
    PortfolioCreditScoreEventConsumerService
  ],
  controllers: [
    RiskController,
    CentraleRisqueController
  ],
  exports: [
    RiskApiService,
    CentraleRisqueApiService,
    CentraleRisqueService
  ]
})
export class CentraleRisqueModule {}
