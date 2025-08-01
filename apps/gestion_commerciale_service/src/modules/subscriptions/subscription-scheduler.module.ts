import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionSchedulerService } from './subscription-scheduler.service';
import { EventsModule } from '../events/events.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    SharedModule,
    EventsModule,
    ScheduleModule.forRoot(),
  ],
  providers: [SubscriptionSchedulerService],
  exports: [SubscriptionSchedulerService],
})
export class SubscriptionSchedulerModule {}
