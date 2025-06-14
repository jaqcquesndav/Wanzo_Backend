import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    SharedModule,
    forwardRef(() => AuthModule), // If AuthModule provides services needed here, or vice-versa for circular deps
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService], // Updated exports
})
export class SubscriptionsModule {}
