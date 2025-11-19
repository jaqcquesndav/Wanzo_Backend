import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';
import { AccountingSettings } from './entities/accounting-settings.entity';
import { Currency } from './entities/currency.entity';
import { DataSharingSettings } from './entities/data-sharing-settings.entity';
import { DataSource } from './entities/data-source.entity';
import { UserSettings } from './entities/user-settings.entity';
import { IntegrationsSettings } from './entities/integrations-settings.entity';
import { EventsModule } from '@/modules/events/events.module';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { FiscalYearsModule } from '@/modules/fiscal-years/fiscal-years.module';
import { AccountsModule } from '@/modules/accounts/accounts.module';
import { JournalsModule } from '@/modules/journals/journals.module';
import { Organization } from '@/modules/organization/entities/organization.entity';
import { FiscalYear } from '@/modules/fiscal-years/entities/fiscal-year.entity';
import { Account } from '@/modules/accounts/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountingSettings,
      Currency,
      DataSharingSettings,
      DataSource,
      UserSettings,
      IntegrationsSettings,
      Organization,
      FiscalYear,
      Account,
    ]),
    EventsModule,
    OrganizationModule,
    FiscalYearsModule,
    AccountsModule,
    JournalsModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
