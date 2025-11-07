import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardService } from './services/dashboard.service';
import { AccountingOrchestrationService } from './services/accounting-orchestration.service';
import { AccountingCalculatorService } from './calculators/accounting-calculator.service';
import { DashboardController } from './controllers/dashboard.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { JournalsModule } from '../journals/journals.module';
import { CreditScoreModule } from '../credit-score/credit-score.module';
import { Account } from '../accounts/entities/account.entity';
import { Journal } from '../journals/entities/journal.entity';
import { JournalLine } from '../journals/entities/journal-line.entity';
import { FiscalYear } from '../fiscal-years/entities/fiscal-year.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Journal,
      JournalLine,
      FiscalYear,
    ]),
    ScheduleModule.forRoot(),
    AccountsModule,
    JournalsModule,
    CreditScoreModule,
  ],
  providers: [
    DashboardService,
    AccountingOrchestrationService,
    AccountingCalculatorService,
  ],
  controllers: [DashboardController],
  exports: [
    DashboardService,
    AccountingOrchestrationService,
    AccountingCalculatorService,
  ],
})
export class DashboardModule {}
