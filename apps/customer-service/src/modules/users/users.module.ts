import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from './controllers/user.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { UserService } from './services/user.service';
import { User } from './entities/user.entity';
import { UserActivity } from './entities/user-activity.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { Customer } from '../customers/entities/customer.entity';
import { Sme } from '../customers/entities/sme.entity';
import { SmeSpecificData } from '../customers/entities/sme-specific-data.entity';
import { CloudinaryModule } from '../cloudinary';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserActivity, Customer, Sme, SmeSpecificData]),
    KafkaModule,
    CloudinaryModule,
  ],
  controllers: [UserController, AdminUserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
