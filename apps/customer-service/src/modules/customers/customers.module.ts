import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { CustomerController } from './controllers/customer.controller';
import { FinancialInstitutionController } from './controllers/financial-institution.controller';
import { CompanyController } from './controllers/company.controller';
import { OwnershipValidationController } from './controllers/ownership-validation.controller';

import { CustomerService } from './services/customer.service';
import { InstitutionService } from './services/institution.service';
import { SmeService } from './services/sme.service';
import { CustomerEventsDistributor } from './services/customer-events-distributor.service';
import { OwnershipValidatorService } from './services/ownership-validator.service';

import { Customer } from './entities/customer.entity';
import { Institution } from './entities/institution.entity';
import { Sme } from './entities/sme.entity';
import { CustomerDocument } from './entities/customer-document.entity';
import { FinancialInstitutionSpecificData } from './entities/financial-institution-specific-data.entity';
import { SmeSpecificData } from './entities/sme-specific-data.entity';
import { User } from '../system-users/entities/user.entity';
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
      SmeSpecificData,
      User
    ]),
    forwardRef(() => KafkaModule),
    CloudinaryModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    CustomerController, 
    FinancialInstitutionController,
    CompanyController,
    OwnershipValidationController
  ],
  providers: [CustomerService, InstitutionService, SmeService, CustomerEventsDistributor, OwnershipValidatorService],
  exports: [CustomerService, InstitutionService, SmeService, CustomerEventsDistributor, OwnershipValidatorService],
})
export class CustomersModule {}
