import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { CustomerController } from './controllers/customer.controller';
import { InstitutionsController } from './controllers/institutions.controller';
import { SmeController } from './controllers/sme.controller';

import { CustomerService } from './services/customer.service';
import { InstitutionService } from './services/institution.service';
import { SmeService } from './services/sme.service';
import { CustomerEventsDistributor } from './services/customer-events-distributor.service';

import { Customer } from './entities/customer.entity';
import { Institution } from './entities/institution.entity';
import { Sme } from './entities/sme.entity';
import { CustomerDocument } from './entities/customer-document.entity';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Institution, Sme, CustomerDocument]),
    KafkaModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [CustomerController, InstitutionsController, SmeController],
  providers: [CustomerService, InstitutionService, SmeService, CustomerEventsDistributor],
  exports: [CustomerService, InstitutionService, SmeService, CustomerEventsDistributor],
})
export class CustomersModule {}
