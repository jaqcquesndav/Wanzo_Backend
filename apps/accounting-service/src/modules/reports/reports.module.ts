import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './services/report.service';
import { FinancialStatementsService } from './services/financial-statements.service';
import { ReportController } from './controllers/report.controller';
import { FinancialStatementsController } from './controllers/financial-statements.controller';
import { JournalsModule } from '../journals/journals.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    JournalsModule,
    AccountsModule,
  ],
  providers: [ReportService, FinancialStatementsService],
  controllers: [ReportController, FinancialStatementsController],
  exports: [ReportService, FinancialStatementsService],
})
export class ReportsModule {}