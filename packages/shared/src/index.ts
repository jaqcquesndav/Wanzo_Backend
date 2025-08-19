// Export all shared modules - Wanzobe Backend
// Core Kafka Configuration
export * from '../events/kafka-config';
export * from '../events/kafka-error-handler';

// Event Schemas and Types  
export * from '../events/subscription-events';
export * from '../events/subscription-types';
export * from '../events/token-events';
export * from '../events/token.service';
export * from '../events/adha-events';

// Security
export * from '../security/encryption.service';
export * from '../security/encrypted-transformers';

// Re-export specific items from conflicting modules
export type {
  PortfolioEventTopics,
  FundingRequestStatusChangedEvent,
  ContractCreatedEvent,
  ContractStatusChangedEvent,
  ContractRestructuredEvent,
  DisbursementCompletedEvent,
  RepaymentReceivedEvent,
  PaymentScheduleUpdatedEvent,
  DocumentUpdatedEvent,
  DocumentStatusChangedEvent
} from '../events/portfolio-events';
