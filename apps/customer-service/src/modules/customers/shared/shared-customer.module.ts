import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Customer } from '../entities/customer.entity';

// Services
import { CustomerLifecycleService } from './services/customer-lifecycle.service';
import { CustomerRegistryService } from './services/customer-registry.service';
import { CustomerOwnershipService } from './services/customer-ownership.service';
import { CustomerEventsService } from './services/customer-events.service';

// External dependencies
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

/**
 * Module des services partagés pour tous les types de clients
 * Fournit les services communs utilisés par Company et Financial-Institution modules
 * 
 * Note: BaseCustomerService est une classe abstraite et n'est pas incluse ici.
 * Elle est utilisée comme base pour les services concrets dans les sous-modules.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
    ]),
  ],
  providers: [
    // Services partagés
    CustomerLifecycleService,
    CustomerRegistryService,
    CustomerOwnershipService,
    CustomerEventsService,
    
    // Producers Kafka
    CustomerEventsProducer,
  ],
  exports: [
    // Services disponibles pour les sous-modules
    CustomerLifecycleService,
    CustomerRegistryService,
    CustomerOwnershipService,
    CustomerEventsService,
    
    // Entities pour les sous-modules
    TypeOrmModule,
  ],
})
export class SharedCustomerModule {}