import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSession, UserActivity, RolePermission } from './entities/user-related.entity';
import { UsersService } from './services';
import { AdminUsersController, UsersController, RolesController } from './controllers';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, UserActivity, RolePermission]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [AdminUsersController, UsersController, RolesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
