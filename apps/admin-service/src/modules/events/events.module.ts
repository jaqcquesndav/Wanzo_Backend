import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ADMIN_KAFKA_PRODUCER_SERVICE, KafkaProducerModule } from './kafka-producer.module';
import { EventsService } from './events.service';
import { MockEventsService } from './mock-events-service';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { CustomerSubscriptionEventsConsumer } from './consumers/customer-subscription-events.consumer';
import { CustomerProfileConsumer } from './consumers/customer-profile.consumer';
import { AdminEventsController } from './admin-events.controller';
import { UsersModule } from '../users/users.module';
import { CompanyModule } from '../company/company.module';
import { CustomersModule } from '../customers/customers.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    ConfigModule,
    KafkaProducerModule,
    forwardRef(() => UsersModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => FinanceModule),
    CompanyModule,
  ],
  controllers: [UserEventsConsumer, CustomerSubscriptionEventsConsumer, CustomerProfileConsumer, AdminEventsController],
  providers: [
    {
      provide: EventsService,
      useFactory: (configService: ConfigService, kafkaClient: any) => {
        const useKafka = configService.get<string>('USE_KAFKA', 'false') === 'true';
        if (useKafka) {
          return new EventsService(kafkaClient, configService);
        } else {
          return new MockEventsService();
        }
      },
      inject: [ConfigService, ADMIN_KAFKA_PRODUCER_SERVICE],
    },
  ],
  exports: [EventsService],
})
export class EventsModule {}
