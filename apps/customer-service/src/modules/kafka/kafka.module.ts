import { Module, forwardRef } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerEventsProducer } from './producers/customer-events.producer';
import { TokenUsageConsumer } from './consumers/token-usage.consumer';
import { UserActivityConsumer } from './consumers/user-activity.consumer';
import { ExternalRequestsConsumer } from './consumers/external-requests.consumer';
import { TokensModule } from '../tokens/tokens.module';
import { SystemUsersModule } from '../system-users/system-users.module';
import { CustomersModule } from '../customers/customers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    forwardRef(() => TokensModule),
    forwardRef(() => SystemUsersModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => SubscriptionsModule),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get<string>('KAFKA_CLIENT_ID') || 'customer-service',
              brokers: [configService.get<string>('KAFKA_BROKERS') || 'localhost:9092'],
            },
            consumer: {
              groupId: configService.get<string>('KAFKA_GROUP_ID') || 'customer-service-consumer',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
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
