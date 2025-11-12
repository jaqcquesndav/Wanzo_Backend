import { Injectable, Logger } from '@nestjs/common';
import { CustomerEventsProducer } from '../../../kafka/producers/customer-events.producer';
import { Customer, CustomerType, CustomerStatus } from '../../entities/customer.entity';

export interface CustomerEventContext {
  customerId: string;
  customerName?: string;
  customerType?: CustomerType;
  userId?: string;
  adminId?: string;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface CustomerLifecycleEventData extends CustomerEventContext {
  previousStatus?: CustomerStatus;
  newStatus?: CustomerStatus;
  validationDetails?: Record<string, any>;
  processingDuration?: number;
}

export interface CustomerOwnershipEventData extends CustomerEventContext {
  resourceId?: string;
  resourceType?: string;
  validationType?: 'USER_ACCESS' | 'RESOURCE_ACCESS' | 'ADMIN_ACCESS';
  userRole?: string;
  requiredPermissions?: string[];
  adminOverride?: boolean;
}

export interface CustomerRegistryEventData extends CustomerEventContext {
  changedFields?: string[];
  previousData?: Partial<Customer>;
  newData?: Partial<Customer>;
}

/**
 * Service centralisé pour la distribution d'événements clients
 * Migré depuis CustomerEventsDistributor pour servir tous les modules
 */
@Injectable()
export class CustomerEventsService {
  private readonly logger = new Logger(CustomerEventsService.name);

  constructor(
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  // ==================== ÉVÉNEMENTS LIFECYCLE ====================

  /**
   * Événement de validation de client
   */
  async emitCustomerValidated(data: CustomerLifecycleEventData): Promise<void> {
    this.logger.log(`Emitting customer validated event: ${data.customerId}`);
    
    try {
      await this.customerEventsProducer.publishCustomerValidated({
        customerId: data.customerId,
        customerName: data.customerName || 'Unknown',
        customerType: data.customerType || CustomerType.SME,
        validatedBy: data.adminId || data.userId || 'system',
        validationDetails: data.validationDetails || {},
        previousStatus: data.previousStatus,
        newStatus: data.newStatus || CustomerStatus.ACTIVE,
        processingDuration: data.processingDuration,
        timestamp: data.timestamp || new Date().toISOString(),
        metadata: data.metadata,
      });

      this.logger.log(`Customer validated event sent successfully: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit customer validated event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Événement de suspension de client
   */
  async emitCustomerSuspended(data: CustomerLifecycleEventData): Promise<void> {
    this.logger.log(`Emitting customer suspended event: ${data.customerId}`);
    
    try {
      await this.customerEventsProducer.publishCustomerSuspended({
        customerId: data.customerId,
        customerName: data.customerName || 'Unknown',
        customerType: data.customerType || CustomerType.SME,
        suspendedBy: data.adminId || data.userId || 'system',
        reason: data.reason || 'No reason provided',
        previousStatus: data.previousStatus,
        suspensionMetadata: {
          suspendedAt: data.timestamp || new Date().toISOString(),
          processingDuration: data.processingDuration,
          ...data.metadata,
        },
        timestamp: data.timestamp || new Date().toISOString(),
      });

      this.logger.log(`Customer suspended event sent successfully: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit customer suspended event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Événement de réactivation de client
   */
  async emitCustomerReactivated(data: CustomerLifecycleEventData): Promise<void> {
    this.logger.log(`Emitting customer reactivated event: ${data.customerId}`);
    
    try {
      await this.customerEventsProducer.publishCustomerReactivated({
        customerId: data.customerId,
        customerName: data.customerName || 'Unknown',
        customerType: data.customerType || CustomerType.SME,
        reactivatedBy: data.adminId || data.userId || 'system',
        reason: data.reason || 'Reactivation requested',
        previousStatus: data.previousStatus,
        newStatus: data.newStatus || CustomerStatus.ACTIVE,
        reactivationMetadata: {
          reactivatedAt: data.timestamp || new Date().toISOString(),
          processingDuration: data.processingDuration,
          ...data.metadata,
        },
        timestamp: data.timestamp || new Date().toISOString(),
      });

      this.logger.log(`Customer reactivated event sent successfully: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit customer reactivated event: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==================== ÉVÉNEMENTS OWNERSHIP ====================

  /**
   * Événement de validation d'ownership réussie
   */
  async emitOwnershipValidationSuccess(data: CustomerOwnershipEventData): Promise<void> {
    this.logger.log(`Emitting ownership validation success: ${data.customerId}, ${data.userId}`);
    
    try {
      await this.customerEventsProducer.emitOwnershipValidationSuccess({
        customerId: data.customerId,
        userId: data.userId,
        resourceId: data.resourceId,
        validationType: data.validationType || 'USER_ACCESS',
        userRole: data.userRole,
        resourceType: data.resourceType,
        adminOverride: data.adminOverride,
        timestamp: data.timestamp || new Date().toISOString(),
        metadata: data.metadata,
      });

      this.logger.log(`Ownership validation success event sent: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit ownership validation success: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Événement de validation d'ownership échouée
   */
  async emitOwnershipValidationFailed(data: CustomerOwnershipEventData): Promise<void> {
    this.logger.log(`Emitting ownership validation failed: ${data.customerId}, ${data.userId}`);
    
    try {
      await this.customerEventsProducer.emitOwnershipValidationFailed({
        customerId: data.customerId,
        userId: data.userId,
        resourceId: data.resourceId,
        validationType: data.validationType || 'USER_ACCESS',
        reason: data.reason || 'Access denied',
        userRole: data.userRole,
        resourceType: data.resourceType,
        requiredPermissions: data.requiredPermissions,
        timestamp: data.timestamp || new Date().toISOString(),
        metadata: data.metadata,
      });

      this.logger.log(`Ownership validation failed event sent: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit ownership validation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==================== ÉVÉNEMENTS REGISTRY ====================

  /**
   * Événement de création de client
   */
  async emitCustomerCreated(data: CustomerRegistryEventData): Promise<void> {
    this.logger.log(`Emitting customer created event: ${data.customerId}`);
    
    try {
      await this.customerEventsProducer.publishCustomerCreated({
        customerId: data.customerId,
        name: data.customerName || 'Unknown',
        type: data.customerType || CustomerType.SME,
        createdBy: data.userId || data.adminId || 'system',
        createdAt: data.timestamp || new Date().toISOString(),
        metadata: data.metadata,
      });

      this.logger.log(`Customer created event sent successfully: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit customer created event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Événement de mise à jour de client
   */
  async emitCustomerUpdated(data: CustomerRegistryEventData): Promise<void> {
    this.logger.log(`Emitting customer updated event: ${data.customerId}`);
    
    try {
      await this.customerEventsProducer.publishCustomerUpdated({
        customerId: data.customerId,
        name: data.customerName || 'Unknown',
        type: data.customerType || CustomerType.SME,
        updatedBy: data.userId || data.adminId || 'system',
        updatedAt: data.timestamp || new Date().toISOString(),
        changedFields: data.changedFields || [],
        previousData: data.previousData,
        newData: data.newData,
        metadata: data.metadata,
      });

      this.logger.log(`Customer updated event sent successfully: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit customer updated event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Événement de suppression de client
   */
  async emitCustomerDeleted(data: CustomerRegistryEventData): Promise<void> {
    this.logger.log(`Emitting customer deleted event: ${data.customerId}`);
    
    try {
      await this.customerEventsProducer.emitCustomerDeleted({
        customerId: data.customerId,
        customerName: data.customerName || 'Unknown',
        customerType: data.customerType || CustomerType.SME,
        deletedBy: data.userId || data.adminId || 'system',
        deletedAt: data.timestamp || new Date().toISOString(),
        reason: data.reason,
        metadata: data.metadata,
      });

      this.logger.log(`Customer deleted event sent successfully: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit customer deleted event: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==================== ÉVÉNEMENTS COMPOSÉS ET MÉTIERS ====================

  /**
   * Événement de changement de statut complet
   */
  async emitCustomerStatusChanged(data: {
    customerId: string;
    customerName?: string;
    customerType?: CustomerType;
    previousStatus: CustomerStatus;
    newStatus: CustomerStatus;
    changedBy: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Emitting customer status changed: ${data.customerId} (${data.previousStatus} → ${data.newStatus})`);
    
    try {
      // Événement spécifique selon le nouveau statut
      switch (data.newStatus) {
        case CustomerStatus.ACTIVE:
          if (data.previousStatus === CustomerStatus.SUSPENDED) {
            await this.emitCustomerReactivated({
              customerId: data.customerId,
              customerName: data.customerName,
              customerType: data.customerType,
              previousStatus: data.previousStatus,
              newStatus: data.newStatus,
              adminId: data.changedBy,
              reason: data.reason,
              metadata: data.metadata,
            });
          } else {
            await this.emitCustomerValidated({
              customerId: data.customerId,
              customerName: data.customerName,
              customerType: data.customerType,
              previousStatus: data.previousStatus,
              newStatus: data.newStatus,
              adminId: data.changedBy,
              metadata: data.metadata,
            });
          }
          break;

        case CustomerStatus.SUSPENDED:
          await this.emitCustomerSuspended({
            customerId: data.customerId,
            customerName: data.customerName,
            customerType: data.customerType,
            previousStatus: data.previousStatus,
            adminId: data.changedBy,
            reason: data.reason,
            metadata: data.metadata,
          });
          break;

        default:
          // Événement générique de mise à jour
          await this.emitCustomerUpdated({
            customerId: data.customerId,
            customerName: data.customerName,
            customerType: data.customerType,
            adminId: data.changedBy,
            changedFields: ['status'],
            previousData: { status: data.previousStatus },
            newData: { status: data.newStatus },
            metadata: {
              ...data.metadata,
              statusChangeReason: data.reason,
            },
          });
          break;
      }

      this.logger.log(`Customer status changed event sent successfully: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit customer status changed event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Événement de validation complète d'un client avec détails
   */
  async emitCustomerFullValidation(data: {
    customerId: string;
    customerName: string;
    customerType: CustomerType;
    validatedBy: string;
    validationSteps: Array<{
      step: string;
      status: 'success' | 'failed' | 'skipped';
      duration?: number;
      details?: any;
    }>;
    totalDuration: number;
    finalStatus: CustomerStatus;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Emitting customer full validation: ${data.customerId}`);
    
    try {
      await this.emitCustomerValidated({
        customerId: data.customerId,
        customerName: data.customerName,
        customerType: data.customerType,
        newStatus: data.finalStatus,
        adminId: data.validatedBy,
        processingDuration: data.totalDuration,
        validationDetails: {
          steps: data.validationSteps,
          totalSteps: data.validationSteps.length,
          successfulSteps: data.validationSteps.filter(s => s.status === 'success').length,
          failedSteps: data.validationSteps.filter(s => s.status === 'failed').length,
          skippedSteps: data.validationSteps.filter(s => s.status === 'skipped').length,
        },
        metadata: data.metadata,
      });

      this.logger.log(`Customer full validation event sent successfully: ${data.customerId}`);
    } catch (error) {
      this.logger.error(`Failed to emit customer full validation event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Émission d'événements en lot
   */
  async emitBatchEvents(events: Array<{
    type: 'created' | 'updated' | 'deleted' | 'validated' | 'suspended' | 'reactivated';
    data: CustomerEventContext;
  }>): Promise<void> {
    this.logger.log(`Emitting batch events: ${events.length} events`);
    
    try {
      await Promise.all(
        events.map(event => {
          switch (event.type) {
            case 'created':
              return this.emitCustomerCreated(event.data as CustomerRegistryEventData);
            case 'updated':
              return this.emitCustomerUpdated(event.data as CustomerRegistryEventData);
            case 'deleted':
              return this.emitCustomerDeleted(event.data as CustomerRegistryEventData);
            case 'validated':
              return this.emitCustomerValidated(event.data as CustomerLifecycleEventData);
            case 'suspended':
              return this.emitCustomerSuspended(event.data as CustomerLifecycleEventData);
            case 'reactivated':
              return this.emitCustomerReactivated(event.data as CustomerLifecycleEventData);
            default:
              this.logger.warn(`Unknown event type: ${event.type}`);
              return Promise.resolve();
          }
        })
      );

      this.logger.log(`Batch events sent successfully: ${events.length} events`);
    } catch (error) {
      this.logger.error(`Failed to emit batch events: ${error.message}`, error.stack);
      throw error;
    }
  }
}