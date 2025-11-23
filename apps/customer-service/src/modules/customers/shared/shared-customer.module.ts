import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaModule } from '../../kafka/kafka.module';

// Entities
import { Customer } from '../entities/customer.entity';
import { User } from '../../system-users/entities/user.entity';

// Services
import { CustomerLifecycleService } from './services/customer-lifecycle.service';
import { CustomerRegistryService } from './services/customer-registry.service';
import { CustomerOwnershipService } from './services/customer-ownership.service';
import { CustomerEventsService } from './services/customer-events.service';

/**
 * Module des services partagés pour tous les types de clients
 * Fournit les services communs utilisés par Company et Financial-Institution modules
 * 
 * Note: BaseCustomerService est une classe abstraite et n'est pas incluse ici.
 * Elle est utilisée comme base pour les services concrets dans les sous-modules.
 * Note: CustomerEventsProducer DOIT être fourni par le module parent CustomersModule
 * qui a accès à KafkaModule via imports. Ce module ne déclare PAS CustomerEventsProducer
 * pour éviter la dépendance circulaire KafkaModule <-> CustomersModule.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      User,
    ]),
    forwardRef(() => KafkaModule),
  ],
  providers: [
    // Services partagés (dépendent de CustomerEventsProducer fourni par le parent)
    CustomerLifecycleService,
    CustomerRegistryService,
    CustomerOwnershipService,
    CustomerEventsService,
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