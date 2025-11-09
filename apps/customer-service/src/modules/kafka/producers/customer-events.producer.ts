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
   * Notifie l'Admin Service qu'une nouvelle souscription a été créée
   * Utilisé pour la communication bidirectionnelle Customer Service → Admin Service
   */
  async notifyAdminServiceSubscriptionCreated(subscription: {
    id: string;
    customerId: string;
    planId: string;
    status: string;
    startDate: Date;
    endDate: Date;
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const eventData = {
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      planId: subscription.planId,
      status: subscription.status,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      amount: subscription.amount,
      currency: subscription.currency || 'USD',
      metadata: subscription.metadata || {},
      source: 'customer-service',
      timestamp: new Date().toISOString(),
    };

    await this.publishEvent(
      'admin-service.subscription.created',
      eventData,
      `Event admin-service.subscription.created published for subscription ${subscription.id}`
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

  // =====================================================
  // ÉVÉNEMENTS PROFIL CLIENT POUR ADMIN-SERVICE
  // =====================================================

  /**
   * Publie le profil complet d'une entreprise (PME) pour l'admin-service
   */
  async emitCompanyProfileShare(data: {
    customer: Customer;
    smeData: any;
    extendedIdentification?: any;
    assets?: any[];
    stocks?: any[];
    financialData?: any;
  }): Promise<void> {
    const profileData = {
      // Informations client de base
      customerId: data.customer.id,
      customerType: 'COMPANY',
      name: data.customer.name,
      email: data.customer.email,
      phone: data.customer.phone,
      logo: data.customer.logo,
      address: data.customer.address,
      status: data.customer.status,
      accountType: data.customer.accountType,
      createdAt: data.customer.createdAt?.toISOString(),
      updatedAt: data.customer.updatedAt?.toISOString(),
      
      // Données spécifiques entreprise
      companyProfile: {
        legalForm: data.smeData?.legalForm,
        industry: data.smeData?.industry,
        size: data.smeData?.size,
        rccm: data.smeData?.rccm,
        taxId: data.smeData?.taxId,
        natId: data.smeData?.natId,
        activities: data.smeData?.activities,
        capital: data.smeData?.capital,
        financials: data.smeData?.financials,
        affiliations: data.smeData?.affiliations,
        owner: data.smeData?.owner,
        associates: data.smeData?.associates,
        locations: data.smeData?.locations,
        yearFounded: data.smeData?.yearFounded,
        employeeCount: data.smeData?.employeeCount,
        contactPersons: data.smeData?.contactPersons,
        socialMedia: data.smeData?.socialMedia,
      },
      
      // Identification étendue (formulaire détaillé)
      extendedProfile: data.extendedIdentification ? {
        generalInfo: data.extendedIdentification.generalInfo,
        legalInfo: data.extendedIdentification.legalInfo,
        patrimonyAndMeans: data.extendedIdentification.patrimonyAndMeans,
        specificities: data.extendedIdentification.specificities,
        performance: data.extendedIdentification.performance,
        completionPercentage: data.extendedIdentification.completionPercentage,
        isComplete: data.extendedIdentification.isComplete,
      } : null,
      
      // Patrimoine détaillé
      patrimoine: {
        assets: data.assets || [],
        stocks: data.stocks || [],
        totalAssetsValue: data.financialData?.totalAssetsValue || 0,
        lastValuationDate: data.financialData?.lastValuationDate,
      },
      
      profileCompleteness: this.calculateCompanyProfileCompleteness(data),
      lastProfileUpdate: new Date().toISOString(),
    };

    await this.publishEvent(
      'admin.customer.company.profile.shared',
      profileData,
      `Company profile shared with admin-service for customer ${data.customer.id}`
    );
  }

  /**
   * Publie le profil complet d'une institution financière pour l'admin-service
   */
  async emitInstitutionProfileShare(data: {
    customer: Customer;
    financialData: any;
    regulatoryData?: any;
    performanceMetrics?: any;
  }): Promise<void> {
    const profileData = {
      // Informations client de base
      customerId: data.customer.id,
      customerType: 'FINANCIAL_INSTITUTION',
      name: data.customer.name,
      email: data.customer.email,
      phone: data.customer.phone,
      logo: data.customer.logo,
      address: data.customer.address,
      status: data.customer.status,
      accountType: data.customer.accountType,
      createdAt: data.customer.createdAt?.toISOString(),
      updatedAt: data.customer.updatedAt?.toISOString(),
      
      // Données spécifiques institution financière
      institutionProfile: {
        // Informations de base
        denominationSociale: data.financialData?.denominationSociale,
        sigleLegalAbrege: data.financialData?.sigleLegalAbrege,
        type: data.financialData?.type,
        category: data.financialData?.category,
        licenseNumber: data.financialData?.licenseNumber,
        establishedDate: data.financialData?.establishedDate,
        
        // Informations réglementaires
        typeInstitution: data.financialData?.typeInstitution,
        autorisationExploitation: data.financialData?.autorisationExploitation,
        dateOctroi: data.financialData?.dateOctroi,
        autoriteSupervision: data.financialData?.autoriteSupervision,
        dateAgrement: data.financialData?.dateAgrement,
        coordonneesGeographiques: data.financialData?.coordonneesGeographiques,
        regulatoryInfo: data.financialData?.regulatoryInfo,
        
        // Présence digitale et branding
        website: data.financialData?.website,
        brandColors: data.financialData?.brandColors,
        facebookPage: data.financialData?.facebookPage,
        linkedinPage: data.financialData?.linkedinPage,
        
        // Structure organisationnelle
        capitalStructure: data.financialData?.capitalStructure,
        branches: data.financialData?.branches,
        contacts: data.financialData?.contacts,
        leadership: data.financialData?.leadership,
        
        // Services et capacités
        services: data.financialData?.services,
        financialInfo: data.financialData?.financialInfo,
        digitalPresence: data.financialData?.digitalPresence,
        partnerships: data.financialData?.partnerships,
        certifications: data.financialData?.certifications,
        
        // Métriques de performance
        creditRating: data.financialData?.creditRating,
        performanceMetrics: data.performanceMetrics,
      },
      
      // Données réglementaires spécifiques
      regulatoryProfile: data.regulatoryData ? {
        complianceStatus: data.regulatoryData.complianceStatus,
        lastAuditDate: data.regulatoryData.lastAuditDate,
        reportingRequirements: data.regulatoryData.reportingRequirements,
        riskAssessment: data.regulatoryData.riskAssessment,
      } : null,
      
      profileCompleteness: this.calculateInstitutionProfileCompleteness(data),
      lastProfileUpdate: new Date().toISOString(),
    };

    await this.publishEvent(
      'admin.customer.institution.profile.shared',
      profileData,
      `Institution profile shared with admin-service for customer ${data.customer.id}`
    );
  }

  /**
   * Publie une mise à jour de profil client (entreprise ou institution)
   */
  async emitCustomerProfileUpdated(data: {
    customerId: string;
    customerType: 'COMPANY' | 'FINANCIAL_INSTITUTION';
    updatedFields: string[];
    updateContext: {
      updatedBy?: string;
      updateSource: 'form_submission' | 'admin_action' | 'system_update';
      formType?: string;
    };
  }): Promise<void> {
    const eventData = {
      customerId: data.customerId,
      customerType: data.customerType,
      updatedFields: data.updatedFields,
      updateContext: data.updateContext,
      timestamp: new Date().toISOString(),
    };

    await this.publishEvent(
      'admin.customer.profile.updated',
      eventData,
      `Customer profile update notification sent to admin-service for ${data.customerId}`
    );
  }

  // =====================================================
  // NOUVEAUX ÉVÉNEMENTS POUR STRUCTURES V2.1
  // =====================================================

  /**
   * Publie les données spécialisées d'une institution financière (70+ champs v2.1)
   */
  async emitFinancialInstitutionSpecificData(data: {
    customerId: string;
    specificData: {
      // Informations légales et réglementaires
      denominationSociale: string;
      sigleLegalAbrege?: string;
      numeroAgrement: string;
      dateAgrement: string;
      autoriteSupervision: string;
      typeInstitution: string;
      categorieInstitution?: string;
      
      // Activités autorisées
      activitesAutorisees: string[];
      servicesOfferts: string[];
      produitsBancaires?: string[];
      
      // Structure du capital
      capitalSocial: number;
      capitalMinimumReglementaire: number;
      structureActionnariat: any[];
      principauxActionnaires: any[];
      
      // Gouvernance
      conseilAdministration: any[];
      directionGenerale: any[];
      comitesSpecialises: any[];
      
      // Réseau et implantations
      siegeSocial: any;
      agences: any[];
      pointsService: any[];
      reseauDistribution: any;
      
      // Informations financières
      chiffreAffaires: number;
      totalBilan: number;
      fondsPropreNets: number;
      ratioSolvabilite: number;
      notationCredit?: string;
      
      // Présence digitale
      siteWeb?: string;
      plateformeDigitale?: any;
      servicesEnLigne: string[];
      applicationsMobiles?: any[];
      
      // Partenariats et affiliations
      partenairesStrategiques?: any[];
      affiliationsInternationales?: any[];
      reseauxCorrespondants?: any[];
      
      // Conformité et certifications
      certificationsISO?: string[];
      auditExterne?: any;
      rapportsConformite: any[];
      
      // Données complémentaires
      historiquePerformances?: any[];
      indicateursRisque?: any;
      perspectivesStrategiques?: string;
      notesSpeciales?: string;
    };
  }): Promise<void> {
    const eventData = {
      customerId: data.customerId,
      dataType: 'FINANCIAL_INSTITUTION_SPECIFIC_V2_1',
      specificData: data.specificData,
      dataVersion: '2.1',
      timestamp: new Date().toISOString(),
    };

    await this.publishEvent(
      'admin.customer.financial.institution.specific.data',
      eventData,
      `Financial institution specific data (v2.1) shared for customer ${data.customerId}`
    );
  }

  /**
   * Publie les données détaillées de patrimoine (AssetData)
   */
  async emitAssetDataUpdate(data: {
    customerId: string;
    assets: {
      id: string;
      nom: string;
      description: string;
      categorie: string;
      sousCategorie?: string;
      prixAchat: number;
      dateAcquisition: string;
      valeurActuelle: number;
      dateEvaluation: string;
      etatActuel: 'neuf' | 'tres_bon' | 'bon' | 'moyen' | 'mauvais' | 'deteriore';
      proprietaire: string;
      localisation?: string;
      numeroSerie?: string;
      garantie?: {
        dateExpiration: string;
        fournisseur: string;
      };
      documentsAssocies?: string[];
      metadata?: Record<string, any>;
    }[];
    summary: {
      totalValue: number;
      assetsCount: number;
      lastUpdateDate: string;
      depreciation: number;
    };
  }): Promise<void> {
    const eventData = {
      customerId: data.customerId,
      dataType: 'ASSET_DATA_V2_1',
      assets: data.assets,
      summary: data.summary,
      dataVersion: '2.1',
      timestamp: new Date().toISOString(),
    };

    await this.publishEvent(
      'admin.customer.assets.data',
      eventData,
      `Asset data (v2.1) shared for customer ${data.customerId} - ${data.assets.length} assets`
    );
  }

  /**
   * Publie les données de stock professionnel (StockData)
   */
  async emitStockDataUpdate(data: {
    customerId: string;
    stocks: {
      id: string;
      nomProduit: string;
      codeProduit: string;
      categorie: string;
      quantiteStock: number;
      seuilMinimum: number;
      seuilMaximum: number;
      coutUnitaire: number;
      valeurTotaleStock: number;
      uniteMessure: string;
      fournisseurPrincipal?: string;
      dateEntreeStock: string;
      dateDerniereRotation?: string;
      emplacementStock: string;
      etatStock: 'disponible' | 'reserve' | 'endommage' | 'expire';
      metadata?: Record<string, any>;
    }[];
    summary: {
      totalStockValue: number;
      totalItems: number;
      lowStockItems: number;
      lastUpdateDate: string;
    };
  }): Promise<void> {
    const eventData = {
      customerId: data.customerId,
      dataType: 'STOCK_DATA_V2_1',
      stocks: data.stocks,
      summary: data.summary,
      dataVersion: '2.1',
      timestamp: new Date().toISOString(),
    };

    await this.publishEvent(
      'admin.customer.stocks.data',
      eventData,
      `Stock data (v2.1) shared for customer ${data.customerId} - ${data.stocks.length} items`
    );
  }

  /**
   * Publie le formulaire d'identification d'entreprise étendu
   */
  async emitEnterpriseIdentificationForm(data: {
    customerId: string;
    identification: {
      // Informations générales
      generalInfo: {
        denominationSociale: string;
        sigleCommercial?: string;
        formeJuridique: string;
        secteurActivite: {
          principal: string;
          secondaire?: string[];
          custom?: string;
        };
        tailleEntreprise: 'micro' | 'petite' | 'moyenne' | 'grande';
        anneeCreation: number;
        numeroRCCM?: string;
        numeroImpot?: string;
        numeroEmployeur?: string;
      };
      
      // Informations légales
      legalInfo: {
        siegeSocial: any;
        adressePostale?: any;
        capitalSocial?: number;
        nombreActions?: number;
        valeurNominaleAction?: number;
        dirigeants: any[];
        actionnaires?: any[];
        commissaireComptes?: any;
      };
      
      // Patrimoine et moyens
      patrimonyAndMeans: {
        chiffreAffairesAnnuel?: number;
        beneficeNet?: number;
        totalActifs?: number;
        nombreEmployes?: number;
        massSalariale?: number;
        equipementsProduction?: any[];
        immobilisations?: any[];
        creancesClients?: number;
        dettesFournisseurs?: number;
      };
      
      // Spécificités sectorielles
      specificities: {
        licencesProfessionnelles?: string[];
        certificationsQualite?: string[];
        agreementsSpeciaux?: string[];
        partenairesStrategiques?: any[];
        clientsPrincipaux?: any[];
        fournisseursPrincipaux?: any[];
      };
      
      // Performance et perspectives
      performance: {
        croissanceCA?: number;
        evolitionEffectifs?: number;
        projetsDeveloppement?: string[];
        investissementsPrevis?: any[];
        objectifsStrategiques?: string[];
        defisRencontres?: string[];
      };
      
      // Métadonnées du formulaire
      completionPercentage: number;
      lastUpdated: string;
      isComplete: boolean;
      validatedBy?: string;
      validationDate?: string;
    };
  }): Promise<void> {
    const eventData = {
      customerId: data.customerId,
      dataType: 'ENTERPRISE_IDENTIFICATION_FORM_V2_1',
      identification: data.identification,
      dataVersion: '2.1',
      timestamp: new Date().toISOString(),
    };

    await this.publishEvent(
      'admin.customer.enterprise.identification',
      eventData,
      `Enterprise identification form (v2.1) shared for customer ${data.customerId} - ${data.identification.completionPercentage}% complete`
    );
  }

  /**
   * Publie une mise à jour complète de profil avec toutes les données v2.1
   */
  async emitCompleteProfileShare(data: {
    customer: Customer;
    customerType: 'COMPANY' | 'FINANCIAL_INSTITUTION';
    specificData?: any;
    assets?: any[];
    stocks?: any[];
    extendedIdentification?: any;
    performanceMetrics?: any;
    complianceData?: any;
  }): Promise<void> {
    // Construire le profil complet selon le type
    const baseProfile = {
      customerId: data.customer.id,
      customerType: data.customerType,
      name: data.customer.name,
      email: data.customer.email,
      phone: data.customer.phone,
      logo: data.customer.logo,
      address: data.customer.address,
      status: data.customer.status,
      accountType: data.customer.accountType,
      createdAt: data.customer.createdAt?.toISOString(),
      updatedAt: data.customer.updatedAt?.toISOString(),
      dataVersion: '2.1',
    };

    let profileData: any = { ...baseProfile };

    if (data.customerType === 'FINANCIAL_INSTITUTION') {
      profileData = {
        ...profileData,
        institutionSpecificData: data.specificData,
        complianceData: data.complianceData,
        performanceMetrics: data.performanceMetrics,
        profileCompleteness: this.calculateInstitutionProfileCompleteness({
          customer: data.customer,
          financialData: data.specificData,
          regulatoryData: data.complianceData
        }),
      };
    } else if (data.customerType === 'COMPANY') {
      profileData = {
        ...profileData,
        companySpecificData: data.specificData,
        extendedIdentification: data.extendedIdentification,
        patrimoine: {
          assets: data.assets || [],
          stocks: data.stocks || [],
          totalAssetsValue: data.assets?.reduce((sum, asset) => sum + (asset.valeurActuelle || 0), 0) || 0,
          totalStockValue: data.stocks?.reduce((sum, stock) => sum + (stock.valeurTotaleStock || 0), 0) || 0,
          lastUpdateDate: new Date().toISOString(),
        },
        profileCompleteness: this.calculateCompanyProfileCompleteness({
          customer: data.customer,
          smeData: data.specificData,
          extendedIdentification: data.extendedIdentification,
          assets: data.assets,
          stocks: data.stocks
        }),
      };
    }

    await this.publishEvent(
      'admin.customer.complete.profile.v2_1',
      profileData,
      `Complete profile (v2.1) shared with admin-service for ${data.customerType} customer ${data.customer.id}`
    );
  }

  /**
   * Publie un événement de synchronisation de données critique
   */
  async emitCriticalDataSync(data: {
    customerId: string;
    syncType: 'full_profile' | 'financial_data' | 'assets_update' | 'compliance_update';
    priority: 'high' | 'medium' | 'low';
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
      impact: 'high' | 'medium' | 'low';
    }[];
    metadata: {
      source: string;
      requestId: string;
      requiresAdminApproval?: boolean;
    };
  }): Promise<void> {
    const eventData = {
      customerId: data.customerId,
      syncType: data.syncType,
      priority: data.priority,
      changes: data.changes,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
      dataVersion: '2.1',
    };

    // Utiliser un topic de haute priorité pour les synchronisations critiques
    const topic = data.priority === 'high' 
      ? 'admin.customer.critical.sync.priority'
      : 'admin.customer.data.sync';

    await this.publishEvent(
      topic,
      eventData,
      `Critical data sync (${data.syncType}) for customer ${data.customerId} with ${data.changes.length} changes`
    );
  }

  /**
   * Calcule le pourcentage de complétude du profil d'une entreprise
   */
  private calculateCompanyProfileCompleteness(data: {
    customer: Customer;
    smeData: any;
    extendedIdentification?: any;
    assets?: any[];
    stocks?: any[];
  }): { percentage: number; missingFields: string[]; completedSections: string[] } {
    const missingFields: string[] = [];
    const completedSections: string[] = [];
    let totalFields = 0;
    let completedFields = 0;

    // Vérification des champs de base du customer
    const customerFields = ['name', 'email', 'phone', 'address'];
    customerFields.forEach(field => {
      totalFields++;
      if (data.customer[field as keyof Customer]) {
        completedFields++;
      } else {
        missingFields.push(`customer.${field}`);
      }
    });

    // Vérification des données SME
    if (data.smeData) {
      const smeFields = ['legalForm', 'industry', 'rccm', 'taxId', 'activities', 'capital'];
      smeFields.forEach(field => {
        totalFields++;
        if (data.smeData[field]) {
          completedFields++;
        } else {
          missingFields.push(`sme.${field}`);
        }
      });
      
      if (data.smeData.owner) completedSections.push('owner_info');
      if (data.smeData.associates && data.smeData.associates.length > 0) completedSections.push('associates');
      if (data.smeData.locations && data.smeData.locations.length > 0) completedSections.push('locations');
    }

    // Vérification identification étendue
    if (data.extendedIdentification) {
      completedSections.push('extended_identification');
      if (data.extendedIdentification.isComplete) {
        completedFields += 5; // Bonus pour identification complète
      }
      totalFields += 5;
    } else {
      missingFields.push('extended_identification');
      totalFields += 5;
    }

    // Vérification patrimoine
    if (data.assets && data.assets.length > 0) completedSections.push('assets');
    if (data.stocks && data.stocks.length > 0) completedSections.push('stocks');

    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    return {
      percentage,
      missingFields,
      completedSections
    };
  }

  /**
   * Calcule le pourcentage de complétude du profil d'une institution financière
   */
  private calculateInstitutionProfileCompleteness(data: {
    customer: Customer;
    financialData: any;
    regulatoryData?: any;
  }): { percentage: number; missingFields: string[]; completedSections: string[] } {
    const missingFields: string[] = [];
    const completedSections: string[] = [];
    let totalFields = 0;
    let completedFields = 0;

    // Vérification des champs de base du customer
    const customerFields = ['name', 'email', 'phone', 'address'];
    customerFields.forEach(field => {
      totalFields++;
      if (data.customer[field as keyof Customer]) {
        completedFields++;
      } else {
        missingFields.push(`customer.${field}`);
      }
    });

    // Vérification des données financières
    if (data.financialData) {
      const requiredFields = [
        'denominationSociale', 'type', 'licenseNumber', 'typeInstitution',
        'autorisationExploitation', 'autoriteSupervision'
      ];
      
      requiredFields.forEach(field => {
        totalFields++;
        if (data.financialData[field]) {
          completedFields++;
        } else {
          missingFields.push(`financial.${field}`);
        }
      });

      // Vérification des sections complexes
      if (data.financialData.regulatoryInfo) completedSections.push('regulatory_info');
      if (data.financialData.capitalStructure) completedSections.push('capital_structure');
      if (data.financialData.branches && data.financialData.branches.length > 0) completedSections.push('branches');
      if (data.financialData.leadership) completedSections.push('leadership');
      if (data.financialData.services) completedSections.push('services');
      if (data.financialData.financialInfo) completedSections.push('financial_metrics');
      if (data.financialData.digitalPresence) completedSections.push('digital_presence');
    }

    // Vérification données réglementaires
    if (data.regulatoryData) {
      completedSections.push('regulatory_compliance');
      completedFields += 3; // Bonus pour conformité réglementaire
      totalFields += 3;
    } else {
      missingFields.push('regulatory_data');
      totalFields += 3;
    }

    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    return {
      percentage,
      missingFields,
      completedSections
    };
  }
}
