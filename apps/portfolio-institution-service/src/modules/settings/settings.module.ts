import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Setting } from './entities/setting.entity';
import { ApiKey } from './entities/api-key.entity';
import { Webhook } from './entities/webhook.entity';
import { SystemLog } from './entities/system-log.entity';
import { SystemMaintenance } from './entities/system-maintenance.entity';

// Services
import { SettingService } from './services/setting.service';
import { ApiKeyService } from './services/api-key.service';
import { WebhookService } from './services/webhook.service';
import { SystemService } from './services/system.service';

// Controllers
import { SettingController } from './controllers/setting.controller';
import { ApiKeyController } from './controllers/api-key.controller';
import { WebhookController } from './controllers/webhook.controller';
import { SystemController } from './controllers/system.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Setting,
      ApiKey,
      Webhook,
      SystemLog,
      SystemMaintenance
    ])
  ],
  providers: [
    SettingService,
    ApiKeyService,
    WebhookService,
    SystemService
  ],
  controllers: [
    SettingController,
    ApiKeyController,
    WebhookController,
    SystemController
  ],
  exports: [
    SettingService,
    ApiKeyService,
    WebhookService,
    SystemService
  ],
})
export class SettingsModule {}
