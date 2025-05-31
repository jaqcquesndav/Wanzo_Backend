import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsUserProfileService } from './settings-user-profile.service';
import { SettingsUserProfileController } from './settings-user-profile.controller';
import { UserProfile } from './entities/user-profile.entity';
import { AppSettings } from './entities/app-settings.entity';
import { NotificationSettings } from './entities/notification-settings.entity';
import { BusinessSector } from './entities/business-sector.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';
import { ApplicationSettings } from './entities/application-settings.entity'; // Import ApplicationSettings

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfile,
      AppSettings,
      NotificationSettings,
      BusinessSector,
      User, // Imported User entity for the service to use UserRepository
      ApplicationSettings, // Add ApplicationSettings entity
    ]),
    AuthModule, // For JwtAuthGuard, CurrentUser decorator, and User entity access
  ],
  controllers: [SettingsUserProfileController],
  providers: [SettingsUserProfileService],
  exports: [SettingsUserProfileService], // Export service if it needs to be used by other modules
})
export class SettingsUserProfileModule {}
