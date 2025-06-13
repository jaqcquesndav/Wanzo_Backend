import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';
import { AccountingSettings } from '@/modules/settings/entities/accounting-settings.entity';
import { Currency } from '@/modules/settings/entities/currency.entity';
import { DataSharingSettings } from '@/modules/settings/entities/data-sharing-settings.entity';
import { DataSource as SettingsDataSource } from '@/modules/settings/entities/data-source.entity';
import { EventsModule } from '@/modules/events/events.module';

@Module({  imports: [
    TypeOrmModule.forFeature([
      AccountingSettings,
      Currency,
      DataSharingSettings,
      SettingsDataSource,
    ]),
    EventsModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
