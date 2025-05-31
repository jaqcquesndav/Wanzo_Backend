import { Module } from '@nestjs/common';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { JournalsModule } from '../journals/journals.module';
import { TaxesModule } from '../taxes/taxes.module';
import { TreasuryModule } from '../treasury/treasury.module';

@Module({
  imports: [
    AccountsModule,
    JournalsModule,
    TaxesModule,
    TreasuryModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}