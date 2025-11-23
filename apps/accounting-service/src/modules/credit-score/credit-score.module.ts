import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CreditScoringService } from './services/credit-scoring.service';
import { CreditEventsService } from './services/credit-events.service';
import { RealTimeCreditMonitoringService } from './services/credit-monitoring.service';
import { CreditScoreController } from './controllers/credit-score.controller';
import { CompanyCreditScore } from './entities/company-score.entity';
import { RealTimeCreditMonitoring } from './entities/credit-monitoring.entity';
import { JournalsModule } from '../journals/journals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyCreditScore, RealTimeCreditMonitoring]),
    JournalsModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [CreditScoringService, CreditEventsService, RealTimeCreditMonitoringService],
  controllers: [CreditScoreController],
  exports: [CreditScoringService, CreditEventsService, RealTimeCreditMonitoringService],
})
export class CreditScoreModule {}
