// Export all shared modules - Wanzobe Backend
// Core Kafka Configuration and Events
export * from './events/kafka-config';
export * from './events/kafka-error-handler';

// Event Schemas and Types  
export * from './events/subscription-events';
export * from './events/subscription-types';
export * from './events/token-events';
export * from './events/token.service';
export * from './events/adha-events';

// Security
export * from './security/encryption.service';
export * from './security/encrypted-transformers';
export { SecurityModule } from './security/security.module';

// Re-export specific items from conflicting modules
export {
  PortfolioEventTopics,
  type FundingRequestStatusChangedEvent,
  type ContractCreatedEvent,
  type ContractStatusChangedEvent,
  type ContractRestructuredEvent,
  type DisbursementCompletedEvent,
  type RepaymentReceivedEvent,
  type PaymentScheduleUpdatedEvent,
  type DocumentUpdatedEvent,
  type DocumentStatusChangedEvent,
  type DocumentUploadedEvent
} from './events/portfolio-events';
