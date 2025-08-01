import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Setting } from './entities/setting.entity';

// Services
import { SettingService } from './services/setting.service';

// Controllers
import { SettingController } from './controllers/setting.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Setting,
    ])
  ],
  providers: [
    SettingService,
  ],
  controllers: [
    SettingController,
  ],
  exports: [
    SettingService,
  ],
})
export class SettingsModule {}
