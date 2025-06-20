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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountingSettings,
      Currency,
      DataSharingSettings,
      DataSource,
      UserSettings,
      IntegrationsSettings,
    ]),
    EventsModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
