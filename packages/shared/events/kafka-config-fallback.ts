import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const getKafkaConfigWithFallback = (configService: ConfigService): KafkaOptions => {
  const useKafka = configService.get<string>('USE_KAFKA', 'false') === 'true';
  
  // If USE_KAFKA is false, use a dummy transport
  if (!useKafka) {
    console.log('Kafka is disabled. Using dummy transport.');
    return {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'dummy-client',
          brokers: [], // Empty broker list
        },
        consumer: {
          groupId: 'dummy-group',
        },
      },
    };
  }
  
  // If USE_KAFKA is true, use the normal Kafka configuration
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get<string>('KAFKA_CLIENT_ID', 'default-client'),
        brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
        ssl: configService.get<boolean>('KAFKA_SSL', false),
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'wanzo-backend'),
        allowAutoTopicCreation: true,
      },
    },
  };
};
