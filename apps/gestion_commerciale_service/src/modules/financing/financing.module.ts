import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { FinancingService } from './financing.service';
import { FinancingController } from './financing.controller';
import { CreditScoreXGBoostController } from './controllers/xgboost-credit.controller';
import { FinancingRecord } from './entities/financing-record.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for JWTGuard and CurrentUser decorator dependencies
import { CreditScoreEventConsumerService } from './services/credit-event-consumer.service';
import { CreditScoreApiService } from './services/credit-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancingRecord]),
    AuthModule, // Add AuthModule to imports
    HttpModule, // For CreditScoreApiService HTTP calls
  ],
  controllers: [FinancingController, CreditScoreXGBoostController],
  providers: [FinancingService, CreditScoreEventConsumerService, CreditScoreApiService],
})
export class FinancingModule {}
