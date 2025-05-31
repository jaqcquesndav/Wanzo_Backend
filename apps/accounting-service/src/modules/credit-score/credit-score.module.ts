import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CreditScoreService } from './services/credit-score.service';
import { CreditScoreMLService } from './services/credit-score-ml.service';
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
  providers: [CreditScoreService, CreditScoreMLService],
  controllers: [CreditScoreController],
  exports: [CreditScoreService, CreditScoreMLService],
})
export class CreditScoreModule {}