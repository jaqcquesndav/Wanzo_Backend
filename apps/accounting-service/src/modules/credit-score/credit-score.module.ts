import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CreditScoreService } from './services/credit-score.service';
import { CreditScoringService } from './services/credit-scoring.service';
import { CreditEventsService } from './services/credit-events.service';
import { RealTimeCreditMonitoringService } from './services/credit-monitoring.service';
import { CreditScoreController } from './controllers/credit-score.controller';
import { JournalsModule } from '../journals/journals.module';

@Module({
  imports: [
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
