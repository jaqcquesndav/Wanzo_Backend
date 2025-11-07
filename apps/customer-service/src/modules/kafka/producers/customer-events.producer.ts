import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { User, UserRole, UserType } from '../../system-users/entities/user.entity';
import { Customer, CustomerType } from '../../customers/entities/customer.entity';
import { TokenPurchase } from '../../tokens/entities/token-purchase.entity';
import { StandardKafkaTopics } from '@wanzobe/shared/events/standard-kafka-topics';
import { MessageVersionManager } from '@wanzobe/shared/events/message-versioning';
import { kafkaMonitoring } from '@wanzobe/shared/monitoring';

/**
 * Service responsable de la publication des événements clients vers Kafka
 */
@Injectable()
export class CustomerEventsProducer {
  private readonly logger = new Logger(CustomerEventsProducer.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  /**
   * Méthode utilitaire pour publier des événements avec monitoring et versioning
   */
  private async publishEvent<T>(topic: string, eventData: T, eventDescription: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Vérifier si le topic fait partie des topics standardisés
      const standardTopic = StandardKafkaTopics.isValidTopic(topic) ? topic : this.getStandardTopic(topic);
      
      // Créer un message standardisé avec versioning
      const standardMessage = MessageVersionManager.createStandardMessage(
        standardTopic,
        eventData,
        'customer-service'
      );

      await this.kafkaClient.emit(standardTopic, standardMessage);
      
      const processingTime = Date.now() - startTime;
      kafkaMonitoring.recordMessageSent(standardTopic, processingTime, true);
      
      this.logger.log(`${eventDescription} in ${processingTime}ms`);
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      const err = error as Error;
      
      kafkaMonitoring.recordMessageSent(topic, processingTime, false);
      
      this.logger.error(`Failed to publish ${eventDescription}: ${err.message} (failed after ${processingTime}ms)`, err.stack);
      throw error;
    }
  }

  /**
   * Mappe les anciens topics vers les nouveaux topics standardisés
   */
  private getStandardTopic(oldTopic: string): string {
    const topicMapping: Record<string, string> = {
      'user.created': StandardKafkaTopics.USER_CREATED,
      'user.updated': StandardKafkaTopics.USER_UPDATED,
      'user.status.changed': StandardKafkaTopics.USER_STATUS_CHANGED,
      'user.login': StandardKafkaTopics.USER_LOGIN,
      'user.logout': StandardKafkaTopics.USER_LOGOUT,
      'user.document.uploaded': StandardKafkaTopics.USER_DOCUMENT_UPLOADED,
      'customer.created': StandardKafkaTopics.CUSTOMER_CREATED,
      'customer.updated': StandardKafkaTopics.CUSTOMER_UPDATED,
      'customer.deleted': StandardKafkaTopics.CUSTOMER_DELETED,
      'customer.status.changed': StandardKafkaTopics.CUSTOMER_STATUS_CHANGED,
      'customer.validated': StandardKafkaTopics.CUSTOMER_VALIDATED,
      'customer.suspended': StandardKafkaTopics.CUSTOMER_SUSPENDED,
      'customer.reactivated': StandardKafkaTopics.CUSTOMER_REACTIVATED,
      'customer.institution.created': StandardKafkaTopics.CUSTOMER_INSTITUTION_CREATED,
      'customer.institution.updated': StandardKafkaTopics.CUSTOMER_INSTITUTION_UPDATED,
      'customer.institution.deleted': StandardKafkaTopics.CUSTOMER_INSTITUTION_DELETED,
      'customer.institution.validated': StandardKafkaTopics.CUSTOMER_INSTITUTION_VALIDATED,
      'customer.institution.suspended': StandardKafkaTopics.CUSTOMER_INSTITUTION_SUSPENDED,
      'customer.sme.created': StandardKafkaTopics.CUSTOMER_SME_CREATED,
      'customer.sme.updated': StandardKafkaTopics.CUSTOMER_SME_UPDATED,
      'customer.sme.deleted': StandardKafkaTopics.CUSTOMER_SME_DELETED,
      'customer.sme.validated': StandardKafkaTopics.CUSTOMER_SME_VALIDATED,
      'customer.sme.suspended': StandardKafkaTopics.CUSTOMER_SME_SUSPENDED,
      'customer.admin.action': StandardKafkaTopics.CUSTOMER_ADMIN_ACTION,
      'customer.update.request': StandardKafkaTopics.CUSTOMER_UPDATE_REQUEST,
      'token.purchased': StandardKafkaTopics.TOKEN_PURCHASE,
      'subscription.created': StandardKafkaTopics.SUBSCRIPTION_CREATED,
      'subscription.event': StandardKafkaTopics.SUBSCRIPTION_EVENT,
    };

    return topicMapping[oldTopic] || oldTopic;
  }

  /**
   * Publie un événement user.created
   */
  async emitUserCreated(user: User): Promise<void> {
    const eventData = {
      userId: user.id,
      customerId: user.customerId,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
    
    await this.publishEvent(
      StandardKafkaTopics.USER_CREATED,
      eventData,
      `Event user.created published for user ${user.id}`
    );
  }

  /**
   * Publie un événement user.updated
   */
  async emitUserUpdated(user: User, changes?: Partial<User>): Promise<void> {
    const eventData = {
      userId: user.id,
      customerId: user.customerId,
      email: user.email,
      role: user.role,
      changes,
      updatedAt: user.updatedAt.toISOString(),
    };
    
    await this.publishEvent(
      StandardKafkaTopics.USER_UPDATED,
      eventData,
      `Event user.updated published for user ${user.id}`
    );
  }

  /**
   * Publie un événement user.status.changed
   */
  async emitUserStatusChanged(user: User): Promise<void> {
    const eventData = {
      userId: user.id,
      customerId: user.customerId,
      email: user.email,
      status: user.status,
      updatedAt: user.updatedAt.toISOString(),
    };
    
    await this.publishEvent(
      StandardKafkaTopics.USER_STATUS_CHANGED,
      eventData,
      `Event user.status.changed published for user ${user.id}`
    );
  }

  /**
   * Publie un événement user.login
   */
  async emitUserLogin(user: User, metadata?: { 
    ipAddress?: string; 
    userAgent?: string; 
    deviceInfo?: any;
    isFirstLogin?: boolean;
    accessibleApps?: string[];
  }): Promise<void> {
    const eventData = {
      userId: user.id,
      auth0Id: user.auth0Id,
      customerId: user.customerId,
      companyId: user.companyId,
      financialInstitutionId: user.financialInstitutionId,
      email: user.email,
      role: user.role,
      userType: user.userType,
      loginTime: new Date().toISOString(),
      isFirstLogin: metadata?.isFirstLogin || false,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      deviceInfo: metadata?.deviceInfo,
      accessibleApps: metadata?.accessibleApps || this.getAccessibleApps(user),
    };
    
    await this.publishEvent(
      StandardKafkaTopics.USER_CREATED, // Map to existing topic or create USER_LOGIN
      eventData,
      `Event user.login published for user ${user.id} with accessible apps: ${eventData.accessibleApps?.join(', ')}`
    );
  }

  /**
   * Publie un événement user.logout
   */
  async emitUserLogout(user: User, metadata?: { 
    ipAddress?: string; 
    sessionDuration?: number; 
  }): Promise<void> {
    const eventData = {
      userId: user.id,
      auth0Id: user.auth0Id,
      customerId: user.customerId,
      email: user.email,
      logoutTime: new Date().toISOString(),
      sessionDuration: metadata?.sessionDuration,
      ipAddress: metadata?.ipAddress,
    };
    
    await this.publishEvent(
      StandardKafkaTopics.USER_UPDATED, // Map to existing topic or create USER_LOGOUT
      eventData,
      `Event user.logout published for user ${user.id}`
    );
  }

  /**
   * Détermine les applications accessibles pour un utilisateur basé sur son rôle et type
   */
  private getAccessibleApps(user: User): string[] {
    const apps: string[] = [];
    
    // Apps de base pour tous les utilisateurs authentifiés
    apps.push('customer-service');
    
    // Apps basées sur le type d'utilisateur
    switch (user.userType) {
      case UserType.SME:
        apps.push('gestion_commerciale_service');
        if (user.role === UserRole.CUSTOMER_ADMIN) {
          apps.push('analytics-service');
        }
        break;
        
      case UserType.FINANCIAL_INSTITUTION:
        apps.push('portfolio-institution-service');
        apps.push('analytics-service');
        apps.push('accounting-service');
        if (user.role === UserRole.ADMIN) {
          apps.push('admin-service');
        }
        break;
        
      default:
        break;
    }
    
    // Apps basées sur le rôle
    if (user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN) {
      apps.push('admin-service', 'analytics-service', 'accounting-service', 'portfolio-institution-service');
    }
    
    // App IA accessible à tous
    apps.push('adha-ai-service');
    
    return [...new Set(apps)]; // Éliminer les doublons
  }

  /**
   * Publie un événement customer.created
   */
  async publishCustomerCreated(data: {
    customerId: string;
    name: string;
    type: string;
    accountType?: string;
    createdBy: string;
    createdAt: string;
  }): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_CREATED,
      data,
      `Event customer.created published for customer ${data.customerId}`
    );
  }

  /**
   * Publie un événement customer.updated
   */
  async publishCustomerUpdated(data: {
    customerId: string;
    name: string;
    type: string;
    accountType?: string;
    updatedBy: string;
    updatedAt: string;
    changedFields: string[];
  }): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_UPDATED,
      data,
      `Event customer.updated published for customer ${data.customerId}`
    );
  }

  /**
   * Publie un événement customer.status.changed
   */
  async publishCustomerStatusChanged(data: {
    customerId: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    changedAt: string;
    reason?: string;
  }): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_STATUS_CHANGED,
      data,
      `Event customer.status.changed published for customer ${data.customerId}`
    );
  }

  /**
   * Publie un événement customer.created (utilisé par le service client)
   */
  async customerCreated(customer: Customer): Promise<void> {
    try {
      const eventData = {
        customerId: customer.id,
        name: customer.name,
        type: customer.type,
        accountType: customer.accountType ? customer.accountType.toString() : undefined,
        email: customer.email,
        createdBy: customer.ownerId || 'system',
        createdAt: customer.createdAt.toISOString(),
      };
      
      await this.publishCustomerCreated(eventData);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.created event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.updated (utilisé par le service client)
   */
  async customerUpdated(customer: Customer): Promise<void> {
    try {
      const eventData = {
        customerId: customer.id,
        name: customer.name,
        type: customer.type,
        accountType: customer.accountType ? customer.accountType.toString() : undefined,
        updatedBy: customer.ownerId || 'system',
        updatedAt: customer.updatedAt.toISOString(),
        changedFields: ['name', 'email', 'phone', 'address'] // Ideally would calculate actual changed fields
      };
      
      await this.publishCustomerUpdated(eventData);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.updated event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.deleted (utilisé par le service client)
   */
  async customerDeleted(customerId: string): Promise<void> {
    const eventData = {
      customerId: customerId,
      deletedBy: 'system', 
      deletedAt: new Date().toISOString(),
    };
    
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_DELETED,
      eventData,
      `Event customer.deleted published for customer ${customerId}`
    );
  }

  /**
   * Publie un événement customer.validated (utilisé par le service client)
   */
  async customerValidated(customer: Customer): Promise<void> {
    try {
      const eventData = {
        customerId: customer.id,
        previousStatus: 'pending', // Ideally we'd have the previous status stored
        newStatus: customer.status,
        changedBy: customer.validatedBy || 'system',
        changedAt: customer.validatedAt?.toISOString() || new Date().toISOString(),
      };
      
      await this.publishCustomerStatusChanged(eventData);
      this.logger.log(`Event customer.validated published for customer ${customer.id}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.validated event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.suspended (utilisé par le service client)
   */
  async customerSuspended(customer: Customer): Promise<void> {
    try {
      const eventData = {
        customerId: customer.id,
        previousStatus: 'active', // Ideally we'd have the previous status stored
        newStatus: customer.status,
        changedBy: customer.suspendedBy || 'system',
        changedAt: customer.suspendedAt?.toISOString() || new Date().toISOString(),
        reason: customer.suspensionReason
      };
      
      await this.publishCustomerStatusChanged(eventData);
      this.logger.log(`Event customer.suspended published for customer ${customer.id}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.suspended event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.reactivated (utilisé par le service client)
   */
  async customerReactivated(customer: Customer): Promise<void> {
    try {
      const eventData = {
        customerId: customer.id,
        previousStatus: 'suspended', // Ideally we'd have the previous status stored
        newStatus: customer.status,
        changedBy: customer.reactivatedBy || 'system',
        changedAt: customer.reactivatedAt?.toISOString() || new Date().toISOString(),
      };
      
      await this.publishCustomerStatusChanged(eventData);
      this.logger.log(`Event customer.reactivated published for customer ${customer.id}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.reactivated event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.institution.created
   */
  async emitInstitutionCreated(data: {
    customer: Customer;
    institution: any;
  }): Promise<void> {
    const eventData = {
      customerId: data.customer.id,
      institutionId: data.institution.customerId,
      type: CustomerType.FINANCIAL,
      name: data.customer.name,
      email: data.customer.email,
      institutionType: data.institution.institutionType,
      createdAt: data.customer.createdAt.toISOString(),
    };
    
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_INSTITUTION_CREATED,
      eventData,
      `Event customer.institution.created published for customer ${data.customer.id}`
    );
  }

  /**
   * Publie un événement customer.institution.updated
   */
  async emitInstitutionUpdated(data: {
    institution: any;
    customer?: Customer;
  }): Promise<void> {
    const eventData = {
      customerId: data.institution.customerId,
      institutionId: data.institution.customerId,
      institutionType: data.institution.institutionType,
      updatedAt: data.institution.updatedAt.toISOString(),
      changedFields: ['institutionType', 'licenseNumber', 'regulatoryAuthority'], // ideally calculate actual fields
    };
    
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_INSTITUTION_UPDATED,
      eventData,
      `Event customer.institution.updated published for institution ${data.institution.customerId}`
    );
  }

  /**
   * Publie un événement customer.institution.deleted
   */
  async emitInstitutionDeleted(data: {
    id: string;
    customerId: string;
  }): Promise<void> {
    const eventData = {
      customerId: data.customerId,
      institutionId: data.id,
      deletedAt: new Date().toISOString(),
    };
    
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_INSTITUTION_DELETED,
      eventData,
      `Event customer.institution.deleted published for institution ${data.id}`
    );
  }

  /**
   * Publie un événement customer.institution.validated
   */
  async emitInstitutionValidated(data: {
    institution: any;
    customer: Customer;
  }): Promise<void> {
    const eventData = {
      customerId: data.customer.id,
      institutionId: data.institution.customerId,
      previousStatus: 'pending',
      newStatus: data.customer.status,
      validatedAt: data.customer.validatedAt?.toISOString() || new Date().toISOString(),
      validatedBy: data.customer.validatedBy || 'system',
    };
    
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_INSTITUTION_VALIDATED,
      eventData,
      `Event customer.institution.validated published for institution ${data.institution.customerId}`
    );
  }

  /**
   * Publie un événement customer.institution.suspended
   */
  async emitInstitutionSuspended(data: {
    institution: any;
    customer: Customer;
    reason: string;
  }): Promise<void> {
    const eventData = {
      customerId: data.customer.id,
      institutionId: data.institution.customerId,
      previousStatus: 'active',
      newStatus: data.customer.status,
      suspendedAt: data.customer.suspendedAt?.toISOString() || new Date().toISOString(),
      suspendedBy: data.customer.suspendedBy || 'system',
      reason: data.reason,
    };
    
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_INSTITUTION_SUSPENDED,
      eventData,
      `Event customer.institution.suspended published for institution ${data.institution.customerId}`
    );
  }

  /**
   * Publie un événement customer.sme.created
   */
  async emitSmeCreated(data: {
    customer: Customer;
    sme: any;
  }): Promise<void> {
    const createdAt = data.customer.createdAt ? 
      data.customer.createdAt.toISOString() : 
      new Date().toISOString();
      
    const eventData = {
      customerId: data.customer.id,
      smeId: data.sme.customerId,
      type: CustomerType.SME,
      name: data.customer.name,
      email: data.customer.email,
      registrationNumber: data.sme.registrationNumber,
      createdAt: createdAt,
    };
    
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_SME_CREATED,
      eventData,
      `Event customer.sme.created published for customer ${data.customer.id}`
    );
  }

  /**
   * Publie un événement customer.sme.updated
   */
  async emitSmeUpdated(data: {
    sme: any;
    customer?: Customer;
  }): Promise<void> {
    try {
      const updatedAt = data.sme.updatedAt ? 
        data.sme.updatedAt.toISOString() : 
        new Date().toISOString();
        
      const eventData = {
        customerId: data.sme.customerId,
        smeId: data.sme.customerId,
        updatedAt: updatedAt,
        changedFields: ['registrationNumber', 'legalForm', 'industry'], // ideally calculate actual fields
      };
      
      await this.kafkaClient.emit('customer.sme.updated', eventData);
      this.logger.log(`Event customer.sme.updated published for sme ${data.sme.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.sme.updated event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.sme.deleted
   */
  async emitSmeDeleted(data: {
    id: string;
    customerId: string;
  }): Promise<void> {
    try {
      const eventData = {
        customerId: data.customerId,
        smeId: data.id,
        deletedAt: new Date().toISOString(),
      };
      
      await this.kafkaClient.emit('customer.sme.deleted', eventData);
      this.logger.log(`Event customer.sme.deleted published for sme ${data.id}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.sme.deleted event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.sme.validated
   */
  async emitSmeValidated(data: {
    sme: any;
    customer: Customer;
  }): Promise<void> {
    try {
      const eventData = {
        customerId: data.customer.id,
        smeId: data.sme.customerId,
        previousStatus: 'pending',
        newStatus: data.customer.status,
        validatedAt: data.customer.validatedAt?.toISOString() || new Date().toISOString(),
        validatedBy: data.customer.validatedBy || 'system',
      };
      
      await this.kafkaClient.emit('customer.sme.validated', eventData);
      this.logger.log(`Event customer.sme.validated published for sme ${data.sme.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.sme.validated event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.sme.suspended
   */
  async emitSmeSuspended(data: {
    sme: any;
    customer: Customer;
    reason: string;
  }): Promise<void> {
    try {
      const eventData = {
        customerId: data.customer.id,
        smeId: data.sme.customerId,
        previousStatus: 'active',
        newStatus: data.customer.status,
        suspendedAt: data.customer.suspendedAt?.toISOString() || new Date().toISOString(),
        suspendedBy: data.customer.suspendedBy || 'system',
        reason: data.reason,
      };
      
      await this.kafkaClient.emit('customer.sme.suspended', eventData);
      this.logger.log(`Event customer.sme.suspended published for sme ${data.sme.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.sme.suspended event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement subscription.created
   */
  async emitSubscriptionCreated(subscription: any): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.SUBSCRIPTION_CREATED,
      subscription,
      `Event subscription.created published for customer ${subscription.customerId}`
    );
  }

  /**
   * Publie un événement token.purchased
   */
  async emitTokenPurchased(purchase: TokenPurchase): Promise<void> {
    const eventData = {
      purchaseId: purchase.id,
      customerId: purchase.customerId,
      amount: purchase.amount,
      purchaseDate: purchase.purchaseDate.toISOString(),
      transactionId: purchase.transactionId,
      price: purchase.price,
      currency: purchase.currency,
      metadata: purchase.metadata,
    };

    await this.publishEvent(
      StandardKafkaTopics.TOKEN_PURCHASE,
      eventData,
      `Event token.purchased published for customer ${purchase.customerId}`
    );
  }

  /**
   * Publie un événement générique de souscription
   */
  async emitSubscriptionEvent(event: {
    type: string;
    subscriptionId: string;
    customerId: string;
    planId?: string;
    oldPlanId?: string;
    newPlanId?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const eventData = {
      ...event,
      timestamp: event.timestamp.toISOString(),
    };

    await this.publishEvent(
      StandardKafkaTopics.SUBSCRIPTION_EVENT,
      eventData,
      `Event subscription.event (${event.type}) published for customer ${event.customerId}`
    );
  }

  /**
   * Centralisation des événements pour communication inter-services
   * 
   * Les autres microservices pourront:
   * 1. Consommer ces événements pour mettre à jour leurs données locales
   * 2. Émettre des événements pour demander des modifications (pattern Command/Event Sourcing)
   */

  /**
   * Publie un événement pour une action administrative sur un client
   */
  async emitCustomerAdminAction(data: {
    customerId: string;
    action: 'validate' | 'suspend' | 'reactivate' | 'update_limits';
    adminId: string;
    reason?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    const eventData = {
      customerId: data.customerId,
      action: data.action,
      adminId: data.adminId,
      reason: data.reason || '',
      details: data.details || {},
      timestamp: new Date().toISOString(),
    };
    
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_ADMIN_ACTION,
      eventData,
      `Event customer.admin.action (${data.action}) published for customer ${data.customerId}`
    );
  }

  /**
   * Publie un événement de requête de mise à jour de données client
   * (utilisé par d'autres services pour demander des modifications)
   */
  async emitCustomerUpdateRequest(data: {
    customerId: string;
    requestingService: string;
    updateFields: Record<string, any>;
    requestId: string;
  }): Promise<void> {
    const eventData = {
      customerId: data.customerId,
      requestingService: data.requestingService,
      updateFields: data.updateFields,
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
    };
    
    await this.publishEvent(
      StandardKafkaTopics.CUSTOMER_UPDATE_REQUEST,
      eventData,
      `Event customer.update.request published from ${data.requestingService} for customer ${data.customerId}`
    );
  }

  /**
   * Publie un événement customer.updated
   */
  async emitCustomerUpdated(data: {
    customerId: string;
    updatedFields: string[];
    timestamp?: string;
    targetService?: string;
  }): Promise<void> {
    try {
      const eventData = {
        customerId: data.customerId,
        updatedFields: data.updatedFields,
        timestamp: data.timestamp || new Date().toISOString(),
        targetService: data.targetService,
      };
      
      const topic = data.targetService 
        ? `${data.targetService}.customer.updated` 
        : 'customer.updated';
        
      await this.kafkaClient.emit(topic, eventData);
      this.logger.log(`Event customer.updated published for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.updated event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.validated
   */
  async emitCustomerValidated(data: {
    customerId: string;
    adminId: string;
    timestamp: string;
    targetService?: string;
  }): Promise<void> {
    try {
      const eventData = {
        customerId: data.customerId,
        adminId: data.adminId,
        timestamp: data.timestamp,
      };
      
      const topic = data.targetService 
        ? `${data.targetService}.customer.validated` 
        : 'customer.validated';
        
      await this.kafkaClient.emit(topic, eventData);
      this.logger.log(`Event customer.validated published for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.validated event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.suspended
   */
  async emitCustomerSuspended(data: {
    customerId: string;
    adminId: string;
    reason: string;
    timestamp: string;
    targetService?: string;
  }): Promise<void> {
    try {
      const eventData = {
        customerId: data.customerId,
        adminId: data.adminId,
        reason: data.reason,
        timestamp: data.timestamp,
      };
      
      const topic = data.targetService 
        ? `${data.targetService}.customer.suspended` 
        : 'customer.suspended';
        
      await this.kafkaClient.emit(topic, eventData);
      this.logger.log(`Event customer.suspended published for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.suspended event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.reactivated
   */
  async emitCustomerReactivated(data: {
    customerId: string;
    adminId: string;
    timestamp: string;
    targetService?: string;
  }): Promise<void> {
    try {
      const eventData = {
        customerId: data.customerId,
        adminId: data.adminId,
        timestamp: data.timestamp,
      };
      
      const topic = data.targetService 
        ? `${data.targetService}.customer.reactivated` 
        : 'customer.reactivated';
        
      await this.kafkaClient.emit(topic, eventData);
      this.logger.log(`Event customer.reactivated published for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.reactivated event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.created pour un service spécifique
   */
  async emitCustomerCreated(data: {
    customerId: string;
    customerType: string;
    timestamp: string;
    targetService: string;
  }): Promise<void> {
    try {
      const eventData = {
        customerId: data.customerId,
        customerType: data.customerType,
        timestamp: data.timestamp,
        targetService: data.targetService,
      };
      
      await this.kafkaClient.emit(`${data.targetService}.customer.created`, eventData);
      this.logger.log(`Event customer.created published for customer ${data.customerId} to ${data.targetService}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.created event: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Publie un événement customer.deleted pour un service spécifique
   */
  async emitCustomerDeleted(customerId: string, targetService: string): Promise<void> {
    try {
      const eventData = {
        customerId: customerId,
        deletedAt: new Date().toISOString(),
        targetService: targetService,
      };
      
      await this.kafkaClient.emit(`${targetService}.customer.deleted`, eventData);
      this.logger.log(`Event customer.deleted published for customer ${customerId} to ${targetService}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to publish customer.deleted event: ${err.message}`, err.stack);
      throw error;
    }
  }
  
  /**
   * Publie un événement user.document.uploaded
   */
  async emitUserDocumentUploaded(data: {
    userId: string;
    documentType: string;
    documentUrl: string;
    status: string;
    timestamp: string;
  }): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.USER_DOCUMENT_UPLOADED,
      data,
      `Event user.document.uploaded published for user ${data.userId}`
    );
  }
}
