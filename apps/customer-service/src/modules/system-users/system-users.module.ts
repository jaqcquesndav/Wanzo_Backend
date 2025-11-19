import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { UserController } from './controllers/user.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { UserStateManagementController } from './controllers/user-state-management.controller';
import { UserService } from './services/user.service';
import { UserStateManagerService } from './services/user-state-manager.service';
import { UserSyncManagerService } from './services/user-sync-manager.service';
import { User } from './entities/user.entity';
import { UserActivity } from './entities/user-activity.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { Customer } from '../customers/entities/customer.entity';
// Note: Sme entity moved to CompanyModule - use CompanyCoreEntity instead

import { CloudinaryModule } from '../cloudinary';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserActivity, Customer]),
    forwardRef(() => KafkaModule),
    CloudinaryModule,
    ScheduleModule.forRoot(), // Pour les cron jobs
  ],
  controllers: [
    UserController,
    AdminUserController,
    UserStateManagementController,
  ],
  providers: [
    UserService,
    UserStateManagerService,
    UserSyncManagerService,
  ],
  exports: [
    UserService,
    UserStateManagerService,
    UserSyncManagerService,
  ],
})
export class SystemUsersModule {}
