import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ExternalUserEventsConsumer } from './consumers/external-user-events.consumer';
import { SystemUsersModule } from '../system-users/system-users.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    // Kafka client configuration for consuming events
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'customer-service-consumer',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: 'customer-service-group',
          },
        },
      },
    ]),
    // Import modules for dependency injection
    SystemUsersModule,
    CustomersModule,
  ],
  providers: [
    ExternalUserEventsConsumer,
  ],
  exports: [
    ExternalUserEventsConsumer,
  ],
})
export class EventsModule {}
