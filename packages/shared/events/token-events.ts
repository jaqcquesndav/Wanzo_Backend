import { EntityType } from './subscription-types';
import { TokenEventTopics } from './kafka-config';

export interface TokenTransactionEvent {
  userId: string;
  entityId: string;
  entityType: EntityType; // Reuse the same entity type enum
  amount: number;
  transactionId: string;
  reason?: string; // Optional reason for the transaction
  service?: string; // Optional service that used the tokens
  timestamp: string;
}

// Re-export the token event topics for convenience
export { TokenEventTopics };
