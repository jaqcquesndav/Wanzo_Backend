/**
 * Index principal pour les ressources partagées
 */

// Module principal
export { SharedCustomerModule } from './shared-customer.module';

// Services partagés
export { BaseCustomerService } from './services/base-customer.service';
export { CustomerLifecycleService } from './services/customer-lifecycle.service';
export { CustomerRegistryService } from './services/customer-registry.service';
export { CustomerOwnershipService } from './services/customer-ownership.service';
export { CustomerEventsService } from './services/customer-events.service';

// Controllers
export * from './controllers/base-customer.controller';

// DTOs et Enums
export * from './dto';
export * from './enums';

// Types et interfaces
export type {
  CustomerSearchOptions,
  CustomerRegistryResult,
} from './services/customer-registry.service';

export type {
  OwnershipValidationResult,
  OwnershipContext,
} from './services/customer-ownership.service';

export type {
  CustomerEventContext,
  CustomerLifecycleEventData,
  CustomerOwnershipEventData,
  CustomerRegistryEventData,
} from './services/customer-events.service';

// NOTE: Types retirés - non définis dans customer-lifecycle.service
// export type {
//   ValidationResult,
//   ValidationContext,
//   SuspensionResult,
//   ReactivationResult,
// } from './services/customer-lifecycle.service';