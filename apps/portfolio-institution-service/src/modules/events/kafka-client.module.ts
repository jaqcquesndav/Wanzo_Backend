import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzobe/shared';

export const PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE = 'PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;
          return {
            ...baseKafkaConfig,
            options: {
              ...baseKafkaConfig.options,
              client: {
                ...(baseKafkaConfig.options?.client || {}),
                clientId: 'portfolio-institution-service-producer',
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
              producer: {
                ...(baseKafkaConfig.options?.producer || {}),
                allowAutoTopicCreation: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [
    ClientsModule,
  ],
})
export class KafkaClientModule {}