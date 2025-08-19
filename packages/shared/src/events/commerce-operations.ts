/**
 * Statut des opérations commerciales
 */
export enum SharedOperationStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

/**
 * Types d'opérations commerciales
 */
export enum SharedOperationType {
  SALE = 'sale',
  EXPENSE = 'expense',
  FINANCING = 'financing',
  INVENTORY = 'inventory',
  TRANSACTION = 'transaction',
}

export enum BusinessOperationEventTopics {
  OPERATION_CREATED = 'commerce.operation.created',
  OPERATION_UPDATED = 'commerce.operation.updated',
  OPERATION_DELETED = 'commerce.operation.deleted',
}

/**
 * Interface représentant un événement d'opération commerciale créée
 */
export interface BusinessOperationCreatedEvent {
  id: string;
  type: SharedOperationType;
  date: Date;
  description: string;
  amountCdf: number;
  status: SharedOperationStatus;
  clientId: string; // Important pour tracer le client
  companyId: string; // Important pour tracer l'entreprise
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Autres champs utiles
  relatedPartyId?: string;
  relatedPartyType?: string;
  relatedEntityId?: string; 
  relatedEntityType?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface pour l'événement de mise à jour d'une opération commerciale
 */
export interface BusinessOperationUpdatedEvent extends BusinessOperationCreatedEvent {
  previousState?: Partial<BusinessOperationCreatedEvent>;
}

/**
 * Interface pour l'événement de suppression d'une opération commerciale
 */
export interface BusinessOperationDeletedEvent {
  id: string;
  clientId: string;
  companyId: string;
  deletedBy: string;
  deletedAt: Date;
}
