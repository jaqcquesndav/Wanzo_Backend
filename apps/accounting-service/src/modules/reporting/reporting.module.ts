import { Module } from '@nestjs/common';
import { ReportingService } from './services/reporting.service'; // Adjusted path
import { ReportingController } from './reporting.controller';
import { CompanyModule } from '../company/company.module';
import { JournalsModule } from '../journals/journals.module';
import { AccountsModule } from '../accounts/accounts.module';
import { FiscalYearsModule } from '../fiscal-years/fiscal-years.module'; // Added import

@Module({
  imports: [
    CompanyModule, // To get company settings like fiscal year and accounting standard
    JournalsModule, // To access journal entries
    AccountsModule, // To access chart of accounts
    FiscalYearsModule, // Added FiscalYearsModule
  ],
  providers: [ReportingService],
  controllers: [ReportingController],
})
export class ReportingModule {}
