import { Module, Logger } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service'; 
import { ExternalAIModule } from '../external-ai/external-ai.module'; 
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    ConfigModule, 
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE', 
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get<string>('KAFKA_CLIENT_ID', 'accounting-producer'),
              brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            consumer: {
              groupId: configService.get<string>('KAFKA_PRODUCER_CLIENT_CONSUMER_GROUP_ID', 'accounting-producer-client-group'),
            },
            producer: {
              allowAutoTopicCreation: configService.get<boolean>('KAFKA_ALLOW_AUTO_TOPIC_CREATION', true),
            }
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ExternalAIModule, 
    CompanyModule,    
  ],
  providers: [KafkaConsumerService, KafkaProducerService, Logger],
  exports: [KafkaProducerService], 
})
export class KafkaModule {}
