import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CustomerSyncModule } from '../../../../../packages/customer-sync/src';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminCustomerController } from './controllers/admin-customer.controller';
import { AdminCustomerService } from './services/admin-customer.service';

@Module({
  imports: [
    HttpModule,
    CustomerSyncModule.register({
      kafkaClientId: 'admin-service-client',
      kafkaBrokers: ['kafka:9092'],
      serviceIdentifier: 'admin-service',
    }),
  ],
  controllers: [AdminCustomerController],
  providers: [AdminCustomerService],
  exports: [AdminCustomerService],
})
export class AdminModule {}
