import { KafkaOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EntityType as SubEntityType, SubscriptionPlanType as SubPlanType, SubscriptionStatusType as SubStatusType } from './subscription-types';
export declare const getKafkaConfig: (configService: ConfigService) => KafkaOptions;
export declare enum UserEventTopics {
    USER_CREATED = "user.created",
    USER_UPDATED = "user.updated",
    USER_STATUS_CHANGED = "user.status.changed",
    USER_ROLE_CHANGED = "user.role.changed",
    USER_DELETED = "user.deleted",
    SUBSCRIPTION_CHANGED = "subscription.changed",
    SUBSCRIPTION_EXPIRED = "subscription.expired",
    TOKEN_PURCHASE = "token.purchase",
    TOKEN_USAGE = "token.usage",
    TOKEN_ALERT = "token.alert",
    DATA_SHARING_CONSENT_CHANGED = "data.sharing.consent.changed"
}
export declare enum InstitutionEventTopics {
    INSTITUTION_CREATED = "institution.created",
    INSTITUTION_PROFILE_UPDATED = "institution.profile.updated",
    INSTITUTION_STATUS_CHANGED = "institution.status.changed"
}
export declare enum EventUserType {
    SME_OWNER = "SME_OWNER",
    SME_USER = "SME_USER",
    INSTITUTION_ADMIN = "INSTITUTION_ADMIN",
    INSTITUTION_USER = "INSTITUTION_USER",
    INTERNAL_ADMIN = "INTERNAL_ADMIN",
    INTERNAL_STAFF = "INTERNAL_STAFF"
}
export interface UserCreatedEventData {
    userId: string;
    email: string;
    timestamp: Date;
    isOwner?: boolean;
    organizationDetails?: {
        id?: string;
        name: string;
        initialPlan?: string;
        country?: string;
        industry?: string;
    };
    userType?: EventUserType;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}
export interface UserDeletedEvent {
    userId: string;
    timestamp: Date;
    deletedBy: string;
    reason?: string;
}
export interface UserStatusChangedEvent {
    userId: string;
    previousStatus: string;
    newStatus: string;
    userType: EventUserType;
    timestamp: Date;
    changedBy: string;
    reason?: string;
}
export interface UserRoleChangedEvent {
    userId: string;
    previousRole: string;
    newRole: string;
    userType: EventUserType;
    timestamp: Date;
    changedBy: string;
}
export interface SubscriptionChangedEvent {
    userId: string;
    entityId: string;
    entityType: SubEntityType;
    previousPlan?: SubPlanType;
    newPlan: SubPlanType;
    status: SubStatusType;
    expiresAt?: Date;
    timestamp: Date;
    changedBy: string;
    reason?: string;
}
export interface TokenTransactionEvent {
    userId: string;
    entityId: string;
    entityType: SubEntityType;
    amount: number;
    operation: 'purchase' | 'use' | 'refund' | 'expire' | 'alert' | 'subscription_changed' | 'subscription_expired';
    currentBalance: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface DataSharingConsentChangedEventData {
    smeOrganizationId: string;
    consentingUserId: string;
    shareWithAll: boolean;
    targetInstitutionTypes: string[] | null;
    timestamp: Date;
    changedBy: string;
}
export interface InstitutionCreatedEventData {
    institutionId: string;
    name: string;
    kiotaId: string;
    type?: string;
    createdByUserId: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface InstitutionProfileUpdatedEventData {
    institutionId: string;
    updatedByUserId: string;
    updatedFields: string[];
    timestamp: Date;
}
export interface InstitutionStatusChangedEventData {
    institutionId: string;
    changedBy: string;
    previousStatus: InstitutionStatusType;
    newStatus: InstitutionStatusType;
    reason?: string;
    timestamp: Date;
}
export declare enum InstitutionStatusType {
    PENDING_VERIFICATION = "pending_verification",
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    UNDER_REVIEW = "under_review",
    CLOSED = "closed"
}
export { SubStatusType as SubscriptionStatusType };
export { SubEntityType as EntityType };
export { SubPlanType as SubscriptionPlanType };
//# sourceMappingURL=kafka-config.d.ts.map