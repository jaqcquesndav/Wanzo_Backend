import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentsModule } from './modules/payments/payments.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { PaymentTransaction } from './modules/payments/entities/payment-transaction.entity';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    HttpModule.register({ timeout: 15000 }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'postgres',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'payment-service',
        entities: [PaymentTransaction],
        synchronize: true,
        logging: false,
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_KAFKA_CLIENT',
        useFactory: () => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: process.env.KAFKA_CLIENT_ID || 'payment-service',
              brokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
            },
            consumer: {
              groupId: process.env.KAFKA_GROUP_ID || 'payment-service-group',
            },
          },
        }),
      },
    ]),
    MonitoringModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
