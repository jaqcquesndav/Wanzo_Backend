import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSession, UserActivity, RolePermission } from './entities/user-related.entity';
import { UsersService } from './services';
import { AdminUsersController } from './controllers/admin.users.controller';
import { UsersController } from './controllers/users.controller';
import { MulterModule } from '@nestjs/platform-express';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to get access to JwtBlacklistGuard
import { HttpModule } from '@nestjs/axios';

@Module({  imports: [
    TypeOrmModule.forFeature([User, UserSession, UserActivity, RolePermission]),
    MulterModule.register({
      dest: './uploads',
    }),
    forwardRef(() => EventsModule), // Use forwardRef to break circular dependency
    AuthModule, // Import AuthModule to get access to JwtBlacklistGuard and JwtService
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [AdminUsersController, UsersController],
  providers: [UsersService], // Remove UserEventsHandler
  exports: [UsersService],
})
export class UsersModule {}
