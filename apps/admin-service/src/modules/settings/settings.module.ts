import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { 
  AdminProfile, 
  SecuritySetting, 
  SystemSetting,
  ActiveSession,
  LoginHistory,
  NotificationPreference,
  ApplicationSetting 
} from './entities/settings.entity';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { AdminSettingsController } from './controllers/admin-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminProfile, 
      SecuritySetting, 
      SystemSetting,
      ActiveSession,
      LoginHistory,
      NotificationPreference,
      ApplicationSetting
    ]),
    MulterModule.register({
      dest: './uploads/avatars',
    }),
    AuthModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  controllers: [SettingsController, AdminSettingsController],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
