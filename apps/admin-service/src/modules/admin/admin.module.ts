import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CustomerSyncModule } from '../../../../../packages/customer-sync/src';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminCustomerController } from './controllers/admin-customer.controller';
import { AdminAccountingController } from './controllers/admin-accounting.controller';
import { AdminInstitutionController } from './controllers/admin-institution.controller';
import { AdminCompanyController } from './controllers/admin-company.controller';
import { AdminCustomerService } from './services/admin-customer.service';
import { AdminAccountingService } from './services/admin-accounting.service';
import { AdminInstitutionService } from './services/admin-institution.service';
import { AdminCompanyService } from './services/admin-company.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    AuthModule, // Pour les guards et décorateurs
    CustomerSyncModule.register({
      kafkaClientId: 'admin-service-client',
      kafkaBrokers: ['kafka:9092'],
      serviceIdentifier: 'admin-service',
    }),
  ],
  controllers: [
    AdminCustomerController, 
    AdminAccountingController,
    AdminInstitutionController,
    AdminCompanyController,
  ],
  providers: [
    AdminCustomerService, 
    AdminAccountingService,
    AdminInstitutionService,
    AdminCompanyService,
  ],
  exports: [
    AdminCustomerService, 
    AdminAccountingService,
    AdminInstitutionService,
    AdminCompanyService,
  ],
})
export class AdminModule {}
