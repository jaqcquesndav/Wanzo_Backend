import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { SubscriptionEventTopics } from './subscription-events';
import type { SubscriptionChangedEvent } from './subscription-events';
import { BusinessOperationEventTopics } from './commerce-operations';
import type { BusinessOperationCreatedEvent, BusinessOperationUpdatedEvent, BusinessOperationDeletedEvent } from './commerce-operations';

// #region Core Enums and Interfaces

export enum EventUserType {
    SME_OWNER = 'SME_OWNER',
    SME_USER = 'SME_USER',
    INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
    INSTITUTION_USER = 'INSTITUTION_USER',
    INTERNAL_ADMIN = 'INTERNAL_ADMIN',
    INTERNAL_STAFF = 'INTERNAL_STAFF',
}

export enum SharedUserStatus {
    ACTIVE = 'active',
    PENDING = 'pending',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

export enum InvoiceStatus {
    DRAFT = 'draft',
    SENT = 'sent',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
}

// #endregion

// #region Event Topics

export enum UserEventTopics {
    USER_CREATED = 'user.created',
    USER_UPDATED = 'user.updated',
    USER_DELETED = 'user.deleted',
    USER_STATUS_CHANGED = 'user.status.changed',
    USER_ROLE_CHANGED = 'user.role.changed',
    USER_PASSWORD_RESET = 'user.password.reset',
}

export enum CustomerEventTopics {
    CUSTOMER_CREATED = 'customer.created',
    CUSTOMER_UPDATED = 'customer.updated',
    CUSTOMER_DELETED = 'customer.deleted',
    CUSTOMER_STATUS_CHANGED = 'customer.status.changed',
    CUSTOMER_VALIDATED = 'customer.validated',
    CUSTOMER_SUSPENDED = 'customer.suspended',
    CUSTOMER_REACTIVATED = 'customer.reactivated',
    CUSTOMER_SYNC_REQUEST = 'customer.sync.request',
    CUSTOMER_SYNC_RESPONSE = 'customer.sync.response',
}

export { BusinessOperationEventTopics } from './commerce-operations';

export enum FinanceEventTopics {
    INVOICE_CREATED = 'finance.invoice.created',
    INVOICE_STATUS_CHANGED = 'finance.invoice.status.changed',
    PAYMENT_RECEIVED = 'finance.payment.received',
}

export enum TokenEventTopics {
    TOKEN_PURCHASE = 'token.purchase',
    TOKEN_USAGE = 'token.usage',
    TOKEN_ALLOCATED = 'token.allocated',
    TOKEN_ALERT = 'token.alert',
}

export enum DocumentEventTopics {
    DOCUMENT_UPLOADED = 'document.uploaded',
    DOCUMENT_DELETED = 'document.deleted',
    DOCUMENT_ANALYSIS_COMPLETED = 'document.analysis.completed',
}

export enum InstitutionEventTopics {
    INSTITUTION_CREATED = 'institution.created',
    INSTITUTION_PROFILE_UPDATED = 'institution.profile.updated',
    INSTITUTION_STATUS_CHANGED = 'institution.status.changed',
}

export enum OrganizationEventTopics {
    ORGANIZATION_CREATED = 'organization.created',
    ORGANIZATION_UPDATED = 'organization.updated',
    ORGANIZATION_DELETED = 'organization.deleted',
    ORGANIZATION_SYNC_REQUEST = 'organization.sync.request',
    ORGANIZATION_SYNC_RESPONSE = 'organization.sync.response',
}

// #endregion

// #region Event Payloads

// Used by event consumers
export interface UserCreatedEvent {
    userId: string;
    email: string;
    name: string;
    role: string;
    userType: EventUserType;
    customerAccountId?: string;
    customerName?: string;
    timestamp: string;
}

// Used by event producers - aliased for backward compatibility
export interface UserCreatedEventData extends UserCreatedEvent {}

export interface UserUpdatedEvent {
    userId: string;
    updatedFields: Record<string, any>;
    timestamp: string;
}

export interface UserDeletedEvent {
    userId: string;
    deletedBy: string; // User ID of admin
    timestamp: string;
}

export interface UserStatusChangedEvent {
    userId: string;
    previousStatus: SharedUserStatus;
    newStatus: SharedUserStatus;
    userType: EventUserType;
    changedBy: string; // User ID of admin
    timestamp: string;
}

export interface UserRoleChangedEvent {
    userId: string;
    previousRole: string;
    newRole: string;
    userType: EventUserType;
    changedBy: string; // User ID of admin
    timestamp: string;
}

export interface UserPasswordResetEvent {
    userId: string;
    email: string;
    timestamp: string;
}

export interface InvoiceCreatedEvent {
    invoiceId: string;
    customerId: string;
    amount: number;
    currency: string;
    dueDate: string;
    timestamp: string;
}

export interface InvoiceStatusChangedEvent {
    invoiceId: string;
    newStatus: InvoiceStatus;
    previousStatus: InvoiceStatus;
    timestamp: string;
}

export interface PaymentReceivedEvent {
    paymentId: string;
    invoiceId: string;
    customerId: string;
    amount: number;
    currency: string;
    paymentDate: string;
    timestamp: string;
}

export interface CustomerCreatedEvent {
    customerId: string;
    name: string;
    email?: string;
    createdBy: string; // User ID
    timestamp: string;
}

export interface CustomerUpdatedEvent {
    customerId: string;
    updatedFields: Record<string, any>;
    updatedBy: string; // User ID
    timestamp: string;
}

export interface CustomerDeletedEvent {
    customerId: string;
    deletedBy: string; // User ID
    timestamp: string;
}

export interface CustomerStatusChangedEvent {
    customerId: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    reason?: string;
    timestamp: string;
}

export interface OrganizationCreatedEvent {
    organizationId: string;
    name: string;
    type: 'company' | 'financial_institution';
    ownerId: string;
    registrationNumber?: string;
    taxId?: string;
    country?: string;
    timestamp: string;
}

export interface OrganizationUpdatedEvent {
    organizationId: string;
    updatedFields: Record<string, any>;
    updatedBy: string;
    timestamp: string;
}

export interface OrganizationSyncRequestEvent {
    organizationId: string;
    requestedBy: string; // Service name requesting the sync
    requestId: string;
    timestamp: string;
}

export interface OrganizationSyncResponseEvent {
    requestId: string;
    organizationId: string;
    organization: {
        id: string;
        name: string;
        type: 'company' | 'financial_institution';
        registrationNumber?: string;
        taxId?: string;
        vatNumber?: string;
        address?: string;
        city?: string;
        country?: string;
        phone?: string;
        email?: string;
        ownerId: string;
        createdAt: string;
        updatedAt: string;
    } | null;
    found: boolean;
    timestamp: string;
}

export interface CustomerValidatedEvent {
    customerId: string;
    validatedBy: string;
    timestamp: string;
}

export interface CustomerSuspendedEvent {
    customerId: string;
    suspendedBy: string;
    reason: string;
    timestamp: string;
}

export interface CustomerReactivatedEvent {
    customerId: string;
    reactivatedBy: string;
    timestamp: string;
}

export interface DocumentUploadedEvent {
    documentId: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    userId: string; // The user who uploaded the document
    companyId: string;
    timestamp: string;
}

export interface DocumentDeletedEvent {
    documentId: string;
    deletedBy: string; // User ID of who deleted it
    timestamp: string;
}

export interface DocumentAnalysisCompletedEvent {
    documentId: string;
    status: 'success' | 'failure';
    analysisResult?: Record<string, any>;
    errorMessage?: string;
    timestamp: string;
}

export interface TokenPurchaseEvent {
    purchaseId: string;
    customerId: string;
    packageId: string;
    tokensPurchased: number;
    amountPaid: number;
    currency: string;
    timestamp: string;
}

export interface TokenAllocatedEvent {
    allocationId: string;
    customerId: string;
    tokensAllocated: number;
    allocatedBy: string; // Admin/System
    reason: string;
    timestamp: string;
}

export interface TokenUsageEvent {
    usageId: string;
    customerId: string;
    userId: string;
    tokensUsed: number;
    service: string; // e.g., 'document_analysis', 'report_generation'
    timestamp: string;
}

export interface TokenAlertEvent {
    customerId: string;
    remainingTokens: number;
    alertThreshold: number;
    timestamp: string;
}

export interface InstitutionCreatedEvent {
    institutionId: string;
    name: string;
    createdBy: string; // User ID
    timestamp: string;
}

export interface InstitutionProfileUpdatedEvent {
    institutionId: string;
    updatedFields: Record<string, any>;
    updatedBy: string; // User ID
    timestamp: string;
}

export interface InstitutionStatusChangedEvent {
    institutionId: string;
    newStatus: string; // e.g., 'active', 'inactive', 'suspended'
    previousStatus: string;
    changedBy: string; // User ID
    timestamp: string;
}

// #endregion

// #region Kafka Configuration

export const getKafkaConfig = (configService: ConfigService): KafkaOptions => {
    return {
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: configService.get<string>('KAFKA_CLIENT_ID'),
                brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
                ssl: configService.get<boolean>('KAFKA_SSL', false),
            },
            consumer: {
                groupId: configService.get<string>('KAFKA_GROUP_ID', 'wanzo-backend'),
                allowAutoTopicCreation: true,
            },
        },
    };
};

// #endregion

// Re-export subscription events
export { SubscriptionEventTopics } from './subscription-events';
export type { SubscriptionChangedEvent } from './subscription-events';

// Re-export token events
export type { TokenTransactionEvent } from './token-events';

// Inline the institution event data types from kafka-config.d.ts
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

// Inline InstitutionStatusType
export enum InstitutionStatusType {
    PENDING_VERIFICATION = 'pending_verification',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    UNDER_REVIEW = 'under_review',
    CLOSED = 'closed'
}

export { SubscriptionPlanType, SubscriptionStatusType } from './subscription-types';

// #region Organization Events

export interface OrganizationCreatedEvent {
    organizationId: string;
    name: string;
    registrationNumber?: string;
    taxId?: string;
    country?: string;
    createdBy: string;
    timestamp: string;
}

export interface OrganizationUpdatedEvent {
    organizationId: string;
    updatedFields: Record<string, any>;
    updatedBy: string;
    timestamp: string;
}

export interface OrganizationSyncRequestEvent {
    organizationId: string;
    requestedBy: string;
    requestId: string;
    timestamp: string;
}

export interface OrganizationSyncResponseEvent {
    organizationId: string;
    requestId: string;
    found: boolean;
    organizationData?: {
        id: string;
        name: string;
        registrationNumber?: string;
        taxId?: string;
        vatNumber?: string;
        address?: string;
        city?: string;
        country?: string;
        phone?: string;
        email?: string;
        createdAt: string;
        updatedAt: string;
    };
    timestamp: string;
}

// #endregion

// #region Customer Events (Financial Institutions)

export interface CustomerCreatedEvent {
    customerId: string;
    name: string;
    type: 'INSTITUTION' | 'SME'; // Distinguer institutions financières vs PME
    registrationNumber?: string;
    licenseNumber?: string;
    taxId?: string;
    country?: string;
    phone?: string;
    email?: string;
    address?: string;
    createdBy: string;
    timestamp: string;
}

export interface CustomerUpdatedEvent {
    customerId: string;
    type: 'INSTITUTION' | 'SME';
    updatedFields: Record<string, any>;
    updatedBy: string;
    timestamp: string;
}

export interface CustomerSyncRequestEvent {
    customerId: string;
    requestedBy: string;
    requestId: string;
    timestamp: string;
}

export interface CustomerSyncResponseEvent {
    customerId: string;
    requestId: string;
    found: boolean;
    customerData?: {
        id: string;
        name: string;
        type: 'INSTITUTION' | 'SME';
        registrationNumber?: string;
        licenseNumber?: string;
        taxId?: string;
        vatNumber?: string;
        address?: string;
        city?: string;
        country?: string;
        phone?: string;
        email?: string;
        website?: string;
        createdAt: string;
        updatedAt: string;
    };
    timestamp: string;
}

// #endregion
