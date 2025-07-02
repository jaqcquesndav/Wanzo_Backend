import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CustomerSyncService } from './customer-sync.service';

export interface CustomerSyncOptions {
  kafkaClientId: string;
  kafkaBrokers: string[];
  serviceIdentifier: string;
}

@Module({})
export class CustomerSyncModule {
  static register(options: CustomerSyncOptions): DynamicModule {
    return {
      module: CustomerSyncModule,
      imports: [
        ClientsModule.register([
          {
            name: 'CUSTOMER_KAFKA_CLIENT',
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: options.kafkaClientId,
                brokers: options.kafkaBrokers,
              },
              consumer: {
                groupId: `${options.serviceIdentifier}-customer-consumer`,
              },
            },
          },
        ]),
      ],
      providers: [
        {
          provide: 'CUSTOMER_SYNC_OPTIONS',
          useValue: options,
        },
        CustomerSyncService,
      ],
      exports: [CustomerSyncService],
    };
  }
}
