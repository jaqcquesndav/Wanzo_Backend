import { Module, forwardRef } from '@nestjs/common';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { SubscriptionEventsConsumer } from './consumers/subscription-events.consumer';
import { TokenEventsConsumer } from './consumers/token-events.consumer';
import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { EventsCoreModule } from './events-core.module';

/**
 * EventsModule uses EventsCoreModule for its core functionality
 * and handles the circular dependencies with AuthModule.
 */
@Module({
  imports: [
    EventsCoreModule,
    SharedModule,
    forwardRef(() => AuthModule),
  ],
  providers: [UserEventsConsumer, SubscriptionEventsConsumer, TokenEventsConsumer],
  exports: [EventsCoreModule],
})
export class EventsModule {}
