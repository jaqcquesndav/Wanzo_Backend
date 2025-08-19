import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { getUnifiedKafkaConfig } from '@wanzobe/shared/events/unified-kafka-config';

// Define a unique injection token for the Kafka producer client in this service
export const GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE = 'GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE';

/**
 * This module is solely responsible for providing Kafka client to avoid circular dependencies.
 * It contains no business logic and depends only on ConfigModule.
 * Uses unified Kafka configuration for consistency across services.
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Use the unified Kafka configuration
          return getUnifiedKafkaConfig(configService, 'gestion-commerciale-service-producer');
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaProducerModule {}
