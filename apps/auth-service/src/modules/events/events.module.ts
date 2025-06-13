import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzo/shared/events/kafka-config';
import { Transport } from '@nestjs/microservices'; // Import Transport
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { EventsService } from '@/modules/events/events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBlacklist } from '@wanzo/shared/security/token-blacklist.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([TokenBlacklist]),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_KAFKA_PRODUCER_SERVICE', // Renamed token for clarity
        useFactory: (configService: ConfigService) => {
          const baseKafkaConfig = getKafkaConfig(configService);
          return {
            transport: Transport.KAFKA, // Explicitly set transport
            options: {
              ...baseKafkaConfig.options!,
              client: {
                ...baseKafkaConfig.options!.client!,
                clientId: 'auth-service-producer', // Specific clientId for this producer
              },
              // Consumer config is not strictly needed for a producer-only client,
              // but getKafkaConfig includes it. We can keep it or remove it.
              // For consistency with getKafkaConfig, let's keep it unless it causes issues.
              consumer: {
                ...baseKafkaConfig.options!.consumer!,
                // groupId can be specific if this client ever acts as a consumer, or a generic one.
                // For a pure producer, it's less critical but good to define.
                groupId: `auth-service-producer-group`, // Or use a more generic one if preferred
              }
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [EventsService, UserEventsConsumer],
  exports: [EventsService],
})
export class EventsModule {}
