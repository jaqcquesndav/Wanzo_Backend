import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from './controllers/user.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { UserService } from './services/user.service';
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
  ],
  controllers: [UserController, AdminUserController],
  providers: [UserService],
  exports: [UserService],
})
export class SystemUsersModule {}
