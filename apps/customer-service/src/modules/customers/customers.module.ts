import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { CustomerController } from './controllers/customer.controller';
import { FinancialInstitutionController } from './controllers/financial-institution.controller';
import { CompanyController } from './controllers/company.controller';

import { CustomerService } from './services/customer.service';
import { InstitutionService } from './services/institution.service';
import { SmeService } from './services/sme.service';
import { CustomerEventsDistributor } from './services/customer-events-distributor.service';

import { Customer } from './entities/customer.entity';
import { Institution } from './entities/institution.entity';
import { Sme } from './entities/sme.entity';
import { CustomerDocument } from './entities/customer-document.entity';
import { FinancialInstitutionSpecificData } from './entities/financial-institution-specific-data.entity';
import { SmeSpecificData } from './entities/sme-specific-data.entity';
import { KafkaModule } from '../kafka/kafka.module';
// Import the CloudinaryModule
import { CloudinaryModule } from '../cloudinary';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer, 
      Institution, 
      Sme, 
      CustomerDocument, 
      FinancialInstitutionSpecificData,
      SmeSpecificData
    ]),
    forwardRef(() => KafkaModule),
    CloudinaryModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    CustomerController, 
    FinancialInstitutionController,
    CompanyController
  ],
  providers: [CustomerService, InstitutionService, SmeService, CustomerEventsDistributor],
  exports: [CustomerService, InstitutionService, SmeService, CustomerEventsDistributor],
})
export class CustomersModule {}
