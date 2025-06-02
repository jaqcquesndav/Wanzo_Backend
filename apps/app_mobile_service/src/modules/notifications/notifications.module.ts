import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard and CurrentUser

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    AuthModule, // Provides User entity and auth guards
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // Export service if it needs to be used by other modules (e.g., to create notifications)
})
export class NotificationsModule {}
