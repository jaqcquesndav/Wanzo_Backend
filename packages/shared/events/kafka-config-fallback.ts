import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const getKafkaConfigWithFallback = (configService: ConfigService): KafkaOptions => {
  const useKafka = configService.get<string>('USE_KAFKA', 'false') === 'true';
  
  // Define consumer group ID with a fallback
  const consumerGroupId = configService.get<string>('KAFKA_CONSUMER_GROUP_ID', 'wanzo-default-group');
  
  // If USE_KAFKA is false, use a dummy transport
  if (!useKafka) {
    console.log('Kafka is disabled. Using dummy transport.');
    return {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'dummy-client',
          brokers: ['localhost:9092'], // Add a dummy broker to prevent errors
        },
        consumer: {
          groupId: consumerGroupId || 'dummy-group', // Use the environment variable or fallback
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
        groupId: consumerGroupId, // Always use the same variable for consistency
        allowAutoTopicCreation: true,
      },
    },
  };
};
