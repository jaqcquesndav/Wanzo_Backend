import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const ADHA_AI_KAFKA_SERVICE = 'ADHA_AI_KAFKA_SERVICE';

// Mock Kafka client for development without Kafka broker
class MockKafkaClient {
  connect() { return Promise.resolve(); }
  emit() { return { toPromise: () => Promise.resolve() }; }
  subscribeToResponseOf() {}
}

/**
 * Module partagé pour fournir les services communs entre ChatModule et AdhaAIIntegrationModule
 * Cela aide à résoudre les dépendances circulaires en mettant les services partagés dans un module tiers
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ADHA_AI_KAFKA_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const noKafka = configService.get<string>('NO_KAFKA') === 'true';
          
          if (noKafka) {
            console.log('NO_KAFKA environment variable set to true, using mock Kafka client');
            return { 
              customClass: MockKafkaClient 
            };
          }
          
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'portfolio-institution-adha-ai-client',
                brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
                connectionTimeout: 3000,
                retry: { retries: 3 }
              },
              consumer: {
                groupId: 'portfolio-institution-adha-ai-group',
              },
              producer: {
                allowAutoTopicCreation: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class SharedServicesModule {}
