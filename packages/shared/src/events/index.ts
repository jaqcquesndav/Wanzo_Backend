// Export prioritaires - nouvelles fonctionnalités
export { 
  StandardKafkaTopics,
  BusinessOperationEventTopics,
  UserEventTopics,
  CustomerEventTopics,
  TokenEventTopics,
  SubscriptionEventTopics,
  PortfolioEventTopics
} from './standard-kafka-topics';
export { MessageVersionManager } from './message-versioning';

// Export spécifiques pour éviter les conflits
export { 
  getKafkaConfig,
  EventUserType,
  SharedUserStatus,
  InvoiceStatus,
  type UserCreatedEvent,
  type UserCreatedEventData,
  type UserUpdatedEvent,
  type UserDeletedEvent,
  type UserStatusChangedEvent,
  type UserRoleChangedEvent,
  type InstitutionCreatedEventData,
  type InstitutionProfileUpdatedEventData,
  type InstitutionStatusChangedEventData,
  InstitutionStatusType,
  type OrganizationCreatedEvent,
  type OrganizationUpdatedEvent,
  type OrganizationSyncRequestEvent,
  type OrganizationSyncResponseEvent,
  type CustomerCreatedEvent,
  type CustomerUpdatedEvent,
  type CustomerSyncRequestEvent,
  type CustomerSyncResponseEvent
} from './kafka-config';

// Export spécifiques pour commerce operations (éviter conflits avec StandardKafkaTopics)
export {
  SharedOperationStatus,
  SharedOperationType,
  type BusinessOperationCreatedEvent,
  type BusinessOperationUpdatedEvent,
  type BusinessOperationDeletedEvent
} from './commerce-operations';

// Export spécifiques pour subscription events (éviter conflits avec StandardKafkaTopics)
export {
  type SubscriptionChangedEvent
} from './subscription-events';

// Export spécifiques pour token events (éviter conflits avec StandardKafkaTopics)
export {
  type TokenTransactionEvent
} from './token-events';

export * from './subscription-types';