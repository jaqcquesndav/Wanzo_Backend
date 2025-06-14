import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { AccountsModule } from '@/modules/accounts/accounts.module';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { EventsService } from './events.service';
import { KafkaProducerModule, ACCOUNTING_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';

@Module({
  imports: [
    ConfigModule,
    AccountsModule,
    OrganizationModule,
    KafkaProducerModule,
  ],  providers: [
    UserEventsConsumer,
    {
      provide: EventsService,
      useFactory: (kafkaClient) => {
        return new EventsService(kafkaClient);
      },
      inject: [ACCOUNTING_KAFKA_PRODUCER_SERVICE],
    },
  ],
  exports: [EventsService],
})
export class EventsModule {}
