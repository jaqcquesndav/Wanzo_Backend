import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { User } from './entities/user.entity';
import { UserActivity } from './entities/user-activity.entity';
import { UserPreference } from './entities/user-preference.entity';
import { UserSession } from './entities/user-session.entity';

// Services
import { UserService } from './services/user.service';
import { UserActivityService } from './services/user-activity.service';
import { UserPreferenceService } from './services/user-preference.service';
import { UserSessionService } from './services/user-session.service';

// Controllers
import { UserController } from './controllers/user.controller';
import { AdminUserController } from './controllers/admin-user.controller';

// Events Module
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserActivity,
      UserPreference,
      UserSession
    ]),
    EventsModule, // Add EventsModule to provide EventsService
  ],
  providers: [
    UserService,
    UserActivityService,
    UserPreferenceService,
    UserSessionService
  ],
  controllers: [
    UserController,
    AdminUserController
  ],
  exports: [
    UserService,
    UserActivityService,
    UserPreferenceService,
    UserSessionService
  ],
})
export class UsersModule {}
