import { Module } from '@nestjs/common';
import { CustomerEventsProducer } from './producers/customer-events.producer';
import { TokenUsageConsumer } from './consumers/token-usage.consumer';
import { UserActivityConsumer } from './consumers/user-activity.consumer';
import { ExternalRequestsConsumer } from './consumers/external-requests.consumer';

@Module({
  providers: [
    CustomerEventsProducer,
    TokenUsageConsumer,
    UserActivityConsumer,
    ExternalRequestsConsumer
  ],
  exports: [
    CustomerEventsProducer,
    TokenUsageConsumer,
    UserActivityConsumer,
    ExternalRequestsConsumer
  ],
})
export class KafkaModule {}
