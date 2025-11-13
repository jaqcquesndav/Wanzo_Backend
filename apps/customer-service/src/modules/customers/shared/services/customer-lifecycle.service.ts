import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus } from '../../entities/customer.entity';
import { CustomerEventsProducer } from '../../../kafka/producers/customer-events.producer';

export interface ValidationDetails {
  notes?: string;
  validatedBy?: string;
  validationLevel?: 'basic' | 'enhanced' | 'complete';
  additionalData?: Record<string, any>;
}

export interface CustomerStatusUpdate {
  customerId: string;
  fromStatus: CustomerStatus;
  toStatus: CustomerStatus;
  updatedBy: string;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Service pour gérer le cycle de vie des clients
 * Fonctions métier communes pour Company et Financial-Institution modules
 */
@Injectable()
export class CustomerLifecycleService {
  private readonly logger = new Logger(CustomerLifecycleService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  /**
   * Valide un client avec gestion avancée des détails
   */
  async validateCustomer(
    customerId: string,
    adminId: string,
    details?: ValidationDetails,
    requestingService?: string,
  ): Promise<Customer> {
    this.logger.log(`Validating customer ${customerId} by admin ${adminId}`);

    const customer = await this.getCustomer(customerId);
    const previousStatus = customer.status;

    // Mise à jour du statut
    customer.status = CustomerStatus.ACTIVE;
    customer.validatedAt = new Date();
    customer.validatedBy = details?.validatedBy || adminId;

    // Gestion de l'historique de validation
    await this.addValidationHistoryEntry(customer, {
      action: 'validated',
      by: adminId,
      notes: details?.notes || 'Client validé par l\'administrateur',
      metadata: details?.additionalData,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Publication d'événement
    await this.customerEventsProducer.emitCustomerValidated({
      customerId: savedCustomer.id,
      adminId,
      timestamp: savedCustomer.validatedAt!.toISOString(),
      targetService: requestingService,
    });

    this.logger.log(`Customer ${customerId} validated successfully`);
    return savedCustomer;
  }

  /**
   * Suspend un client avec raison détaillée
   */
  async suspendCustomer(
    customerId: string,
    adminId: string,
    reason: string,
    requestingService?: string,
    metadata?: Record<string, any>,
  ): Promise<Customer> {
    this.logger.log(`Suspending customer ${customerId} by admin ${adminId}`);

    const customer = await this.getCustomer(customerId);
    const previousStatus = customer.status;

    // Mise à jour du statut
    customer.status = CustomerStatus.SUSPENDED;
    customer.suspendedAt = new Date();
    customer.suspendedBy = adminId;
    customer.suspensionReason = reason;

    // Gestion de l'historique
    await this.addValidationHistoryEntry(customer, {
      action: 'revoked',
      by: adminId,
      notes: `Client suspendu: ${reason}`,
      metadata,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Publication d'événement
    await this.customerEventsProducer.emitCustomerSuspended({
      customerId: savedCustomer.id,
      adminId,
      reason,
      timestamp: savedCustomer.suspendedAt!.toISOString(),
      targetService: requestingService,
    });

    this.logger.log(`Customer ${customerId} suspended successfully`);
    return savedCustomer;
  }

  /**
   * Réactive un client suspendu
   */
  async reactivateCustomer(
    customerId: string,
    adminId: string,
    requestingService?: string,
    notes?: string,
  ): Promise<Customer> {
    this.logger.log(`Reactivating customer ${customerId} by admin ${adminId}`);

    const customer = await this.getCustomer(customerId);
    const previousStatus = customer.status;

    // Vérification que le client peut être réactivé
    if (customer.status !== CustomerStatus.SUSPENDED && customer.status !== CustomerStatus.INACTIVE) {
      throw new Error(`Customer ${customerId} cannot be reactivated from status ${customer.status}`);
    }

    // Mise à jour du statut
    customer.status = CustomerStatus.ACTIVE;
    customer.reactivatedAt = new Date();
    customer.reactivatedBy = adminId;

    // Gestion de l'historique
    await this.addValidationHistoryEntry(customer, {
      action: 'validated',
      by: adminId,
      notes: notes || 'Client réactivé par l\'administrateur',
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Publication d'événement
    await this.customerEventsProducer.emitCustomerReactivated({
      customerId: savedCustomer.id,
      adminId,
      timestamp: savedCustomer.reactivatedAt!.toISOString(),
      targetService: requestingService,
    });

    this.logger.log(`Customer ${customerId} reactivated successfully`);
    return savedCustomer;
  }

  /**
   * Met à jour le statut d'un client avec historique complet
   */
  async updateCustomerStatus(
    customerId: string,
    newStatus: CustomerStatus,
    updatedBy: string,
    reason?: string,
    metadata?: Record<string, any>,
  ): Promise<CustomerStatusUpdate> {
    this.logger.log(`Updating customer ${customerId} status to ${newStatus}`);

    const customer = await this.getCustomer(customerId);
    const previousStatus = customer.status;

    if (previousStatus === newStatus) {
      this.logger.warn(`Customer ${customerId} already has status ${newStatus}`);
      return {
        customerId,
        fromStatus: previousStatus,
        toStatus: newStatus,
        updatedBy,
        reason: 'No change required',
        timestamp: new Date(),
      };
    }

    // Mise à jour du statut
    customer.status = newStatus;
    customer.updatedAt = new Date();

    // Champs spécifiques selon le statut
    switch (newStatus) {
      case CustomerStatus.ACTIVE:
        customer.validatedAt = new Date();
        customer.validatedBy = updatedBy;
        break;
      case CustomerStatus.SUSPENDED:
        customer.suspendedAt = new Date();
        customer.suspendedBy = updatedBy;
        customer.suspensionReason = reason || 'Status updated to suspended';
        break;
      case CustomerStatus.INACTIVE:
        customer.rejectedAt = new Date();
        customer.rejectedBy = updatedBy;
        break;
    }

    // Historique
    await this.addValidationHistoryEntry(customer, {
      action: this.getHistoryAction(newStatus),
      by: updatedBy,
      notes: reason || `Status updated to ${newStatus}`,
      metadata,
    });

    await this.customerRepository.save(customer);

    const statusUpdate: CustomerStatusUpdate = {
      customerId,
      fromStatus: previousStatus,
      toStatus: newStatus,
      updatedBy,
      reason,
      metadata,
      timestamp: new Date(),
    };

    // Publication d'événement générique
    await this.customerEventsProducer.emitCustomerUpdated({
      customerId,
      // type: customer.type, // Propriété non autorisée dans le DTO
      // updatedBy, // Propriété non autorisée
      // updatedAt: customer.updatedAt.toISOString(), // Propriété non autorisée
      changedFields: ['status'],
      statusChange: statusUpdate,
    });

    this.logger.log(`Customer ${customerId} status updated from ${previousStatus} to ${newStatus}`);
    return statusUpdate;
  }

  /**
   * Récupère un client par ID avec vérification d'existence
   */
  private async getCustomer(customerId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return customer;
  }

  /**
   * Ajoute une entrée à l'historique de validation
   */
  private async addValidationHistoryEntry(
    customer: Customer,
    entry: {
      action: 'validated' | 'revoked' | 'info_requested' | 'info_submitted';
      by: string;
      notes?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    if (!customer.validationHistory) {
      customer.validationHistory = [];
    }

    customer.validationHistory.push({
      date: new Date(),
      action: entry.action,
      by: entry.by,
      notes: entry.notes,
      ...entry.metadata,
    });
  }

  /**
   * Détermine l'action d'historique selon le statut
   */
  private getHistoryAction(status: CustomerStatus): 'validated' | 'revoked' | 'info_requested' | 'info_submitted' {
    switch (status) {
      case CustomerStatus.ACTIVE:
        return 'validated';
      case CustomerStatus.SUSPENDED:
      case CustomerStatus.INACTIVE:
        return 'revoked';
      case CustomerStatus.NEEDS_VALIDATION:
        return 'info_requested';
      case CustomerStatus.VALIDATION_IN_PROGRESS:
        return 'info_submitted';
      default:
        return 'info_submitted';
    }
  }
}