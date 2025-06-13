import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EntityType as SubEntityType, SubscriptionPlanType as SubPlanType, SubscriptionStatusType as SubStatusType } from './subscription-types';

export const getKafkaConfig = (configService: ConfigService): KafkaOptions => {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get<string>('KAFKA_CLIENT_ID'),
        brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
        ssl: configService.get<boolean>('KAFKA_SSL', false),
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'wanzo-backend'),
        allowAutoTopicCreation: true,
      },
    },
  };
};

export enum UserEventTopics {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_STATUS_CHANGED = 'user.status.changed',
  USER_ROLE_CHANGED = 'user.role.changed',
  USER_DELETED = 'user.deleted',
  SUBSCRIPTION_CHANGED = 'subscription.changed',
  SUBSCRIPTION_EXPIRED = 'subscription.expired',
  TOKEN_PURCHASE = 'token.purchase',
  TOKEN_USAGE = 'token.usage',
  TOKEN_ALERT = 'token.alert',
  DATA_SHARING_CONSENT_CHANGED = 'data.sharing.consent.changed',
}

// Define event topics for Institution lifecycle events
export enum InstitutionEventTopics {
  INSTITUTION_CREATED = 'institution.created',
  INSTITUTION_PROFILE_UPDATED = 'institution.profile.updated',
  INSTITUTION_STATUS_CHANGED = 'institution.status.changed',
}

// Define more specific user types for events
export enum EventUserType {
  SME_OWNER = 'SME_OWNER',
  SME_USER = 'SME_USER',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  INSTITUTION_USER = 'INSTITUTION_USER',
  INTERNAL_ADMIN = 'INTERNAL_ADMIN',
  INTERNAL_STAFF = 'INTERNAL_STAFF',
  // Add other specific types as needed
}

// It is recommended to define a shared enum for UserStatus values (e.g., 'active', 'pending', 'suspended')
// and use it consistently across services and events. For example:
// export enum SharedUserStatus { ACTIVE = 'active', PENDING = 'pending', SUSPENDED = 'suspended', INACTIVE = 'inactive' }

export interface UserCreatedEventData {
  userId: string;
  email: string;
  timestamp: Date;
  isOwner?: boolean; // Flag to indicate if this user is creating/owning a new organization
  organizationDetails?: {
    id?: string; // Optional: If admin/auth pre-generates an ID for the organization
    name: string;
    initialPlan?: string; // e.g., 'pme_basic', 'pme_premium'
    country?: string;
    industry?: string;
    // Add any other details collected at registration relevant for accounting
  };
  // Potentially userType (e.g., 'sme_owner', 'sme_user', 'institution_admin') if not implicit by isOwner
  userType?: EventUserType; // Updated from string
  firstName?: string; // Added
  lastName?: string; // Added
  phoneNumber?: string; // Added
}

export interface UserDeletedEvent { // Added this interface
  userId: string;
  timestamp: Date;
  deletedBy: string; // User ID of the admin/system that performed the deletion
  reason?: string;
}

export interface UserStatusChangedEvent {
  userId: string;
  previousStatus: string; // Consider using a shared UserStatus enum
  newStatus: string;     // Consider using a shared UserStatus enum
  userType: EventUserType; // Updated from string
  timestamp: Date;
  changedBy: string;
  reason?: string;
}

export interface UserRoleChangedEvent {
  userId: string;
  previousRole: string;
  newRole: string;
  userType: EventUserType; // Updated from string
  timestamp: Date;
  changedBy: string;
}

export interface SubscriptionChangedEvent {
  userId: string;
  entityId: string; // Company or institution ID
  entityType: SubEntityType; // Use aliased import
  previousPlan?: SubPlanType; // Use aliased import
  newPlan: SubPlanType;     // Use aliased import
  status: SubStatusType; // Use the aliased import
  expiresAt?: Date;
  timestamp: Date;
  changedBy: string;
  reason?: string;
}

export interface TokenTransactionEvent {
  userId: string;
  entityId: string;
  entityType: SubEntityType; // Corrected: Was EntityType, now SubEntityType
  amount: number;
  operation: 'purchase' | 'use' | 'refund' | 'expire' | 'alert' | 'subscription_changed' | 'subscription_expired';
  currentBalance: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Added new interface for data sharing consent changes
export interface DataSharingConsentChangedEventData {
  smeOrganizationId: string; // ID of the SME's organization
  consentingUserId: string; // ID of the user in the SME who configured the consent
  shareWithAll: boolean; // True if sharing with all, false for granular
  targetInstitutionTypes: string[] | null; // Array of institution types if shareWithAll is false, otherwise null
  timestamp: Date;
  changedBy: string; // User ID who made the change (likely same as consentingUserId)
}

// Event data for Institution Created
export interface InstitutionCreatedEventData {
  institutionId: string;
  name: string;
  kiotaId: string;
  type?: string; // e.g., 'Bank', 'Microfinance', 'Incubator'
  createdByUserId: string;
  timestamp: Date;
  metadata?: Record<string, any>; // e.g., initial country, industry
}

// Event data for Institution Profile Updated
export interface InstitutionProfileUpdatedEventData {
  institutionId: string;
  updatedByUserId: string;
  updatedFields: string[]; // e.g., ['name', 'type', 'address.street']
  timestamp: Date;
  // Consider adding a snapshot of key updated data if small and frequently needed by consumers
}

// Event data for Institution Status Changed
export interface InstitutionStatusChangedEventData {
  institutionId: string;
  changedBy: string; // User ID of who made the change
  previousStatus: InstitutionStatusType; // Consider using InstitutionStatusType here as well if appropriate
  newStatus: InstitutionStatusType; // Consider using InstitutionStatusType here as well
  reason?: string;
  timestamp: Date;
}

// New Enum for Institution Status
export enum InstitutionStatusType {
  PENDING_VERIFICATION = 'pending_verification', // Initial state, needs review
  ACTIVE = 'active',                           // Fully operational
  INACTIVE = 'inactive',                         // Temporarily not operational, self-imposed or minor issue
  SUSPENDED = 'suspended',                       // Restricted by system admin due to issues
  UNDER_REVIEW = 'under_review',                 // Specific review process ongoing (e.g., compliance)
  CLOSED = 'closed',                           // Permanently closed
}

// Export the types for use in other modules
export { SubStatusType as SubscriptionStatusType };
export { SubEntityType as EntityType };
export { SubPlanType as SubscriptionPlanType };
