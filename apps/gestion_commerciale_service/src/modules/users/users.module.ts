import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '@/modules/users/users.service';
import { UsersController } from '@/modules/users/users.controller';
import { UserActivitiesController } from '@/modules/users/controllers/user-activities.controller';
import { User } from '@/modules/auth/entities/user.entity'; // Réutilisation de l'entité User existante
import { UserActivity } from '@/modules/users/entities/user-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserActivity]),
  ],
  controllers: [UsersController, UserActivitiesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
