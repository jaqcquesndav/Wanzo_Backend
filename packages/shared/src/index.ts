// Export all shared modules - Wanzobe Backend
// Core Kafka Configuration and Events
export * from './events/kafka-config';
export * from './events/kafka-error-handler';

// Export Standard Kafka Infrastructure - Priority
export { 
  StandardKafkaTopics,
  BusinessOperationEventTopics,
  UserEventTopics,
  CustomerEventTopics,
  TokenEventTopics,
  SubscriptionEventTopics,
  PortfolioEventTopics
} from './events/standard-kafka-topics';
export { MessageVersionManager } from './events/message-versioning';

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

// Export Credit Score Interfaces and Utilities
export {
  // Enums
  RiskLevel,
  CreditScoreClass,
} from './interfaces/credit-score.interface';

export type {
  // Interfaces principales
  StandardCreditScore,
  DetailedCreditScore,
  CreditScoreComponents,
  CreditScoreHistory,
  CreditScoreCalculationParams,
  CreditScoreApiResponse,
  
  // Utilitaires
  CreditScoreUtils
} from './interfaces/credit-score.interface';

// Types utilitaires pour TypeScript
export type CreditScoreValue = number; // 1-100, toujours entier
export type ConfidenceScore = number;  // 0-1, decimal autorisé
export type ModelVersion = string;     // Format: "v1.2.3"
