import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { FinancingService } from './financing.service';
import { FinancingController } from './financing.controller';
import { CreditScoreXGBoostController } from './controllers/xgboost-credit.controller';
import { FinancingRecord } from './entities/financing-record.entity';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';
import { EventsModule } from '../events/events.module';
import { CreditScoreEventConsumerService } from './services/credit-event-consumer.service';
import { PortfolioEventsConsumerService } from './consumers/portfolio-events.consumer';
import { FundingRequestAcknowledgmentConsumerService } from './consumers/funding-request-acknowledgment.consumer';
import { CreditScoreApiService } from './services/credit-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancingRecord]),
    AuthModule,
    CompanyModule,
    EventsModule,
    HttpModule,
  ],
  controllers: [FinancingController, CreditScoreXGBoostController],
  providers: [
    FinancingService, 
    CreditScoreEventConsumerService, 
    PortfolioEventsConsumerService,
    FundingRequestAcknowledgmentConsumerService,
    CreditScoreApiService
  ],
})
export class FinancingModule {}
