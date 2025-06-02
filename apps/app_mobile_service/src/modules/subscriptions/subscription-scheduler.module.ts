import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionSchedulerService } from './subscription-scheduler.service';
import { UserSubscription } from './entities/user-subscription.entity';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSubscription]),
    EventsModule,
    ScheduleModule.forRoot(),
  ],
  providers: [SubscriptionSchedulerService],
  exports: [SubscriptionSchedulerService],
})
export class SubscriptionSchedulerModule {}
