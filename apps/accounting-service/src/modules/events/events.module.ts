import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { AccountsModule } from '@/modules/accounts/accounts.module';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { EventsService } from './events.service';
import { KafkaProducerModule, ACCOUNTING_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';
import { UserModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    AccountsModule,
    OrganizationModule,
    KafkaProducerModule,
    forwardRef(() => UserModule), // Ajout de UserModule avec forwardRef pour gérer la dépendance circulaire
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
