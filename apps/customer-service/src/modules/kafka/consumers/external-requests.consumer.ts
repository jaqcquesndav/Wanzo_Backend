import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '../decorators/on-event.decorator';
import { ClientKafka } from '@nestjs/microservices';
import { CustomerService } from '../../customers/services/customer.service';
import { UserService } from '../../system-users/services/user.service';
import { SubscriptionService } from '../../subscriptions/services/subscription.service';
import { TokenService } from '../../tokens/services/token.service';

/**
 * Consumer pour les actions demandées par d'autres microservices
 * Ce service écoute les événements Kafka venant d'autres services et exécute les actions appropriées
 */
@Injectable()
export class ExternalRequestsConsumer {
  private readonly logger = new Logger(ExternalRequestsConsumer.name);

  constructor(
    private readonly customerService: CustomerService,
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly tokenService: TokenService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  /**
   * Traite les demandes de mise à jour de données client venant d'autres services
   */
  @OnEvent('customer.update.request')
  async handleCustomerUpdateRequest(payload: {
    customerId: string;
    requestingService: string;
    updateFields: Record<string, any>;
    requestId: string;
  }): Promise<void> {
    this.logger.log(`Processing customer update request from ${payload.requestingService} for customer ${payload.customerId}`);
    
    try {
      // Vérifier les autorisations du service demandeur
      if (!this.isServiceAuthorized(payload.requestingService, 'update', 'customer')) {
        this.logger.warn(`Unauthorized update request from ${payload.requestingService}`);
        return;
      }
      
      // Exécuter la mise à jour avec les champs autorisés uniquement
      const sanitizedFields = this.sanitizeUpdateFields(
        payload.updateFields, 
        this.getAllowedFieldsForService(payload.requestingService)
      );
      
      await this.customerService.updateById(payload.customerId, sanitizedFields);
      
      this.logger.log(`Successfully processed update request ${payload.requestId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to process customer update request: ${err.message}`, 
        err.stack
      );
    }
  }

  /**
   * Traite les demandes d'action administratives venant du service admin
   */
  @OnEvent('admin.customer.action')
  async handleAdminCustomerAction(payload: {
    customerId: string;
    adminId: string;
    action: string;
    reason?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Processing admin action ${payload.action} for customer ${payload.customerId}`);
    
    try {
      switch (payload.action) {
        case 'validate':
          await this.customerService.validateCustomer(
            payload.customerId, 
            payload.adminId,
            payload.details
          );
          break;
        case 'suspend':
          await this.customerService.suspendCustomer(
            payload.customerId, 
            payload.adminId, 
            payload.reason || 'Administrative decision'
          );
          break;
        case 'reactivate':
          await this.customerService.reactivateCustomer(
            payload.customerId, 
            payload.adminId
          );
          break;
        default:
          this.logger.warn(`Unknown admin action: ${payload.action}`);
      }
      
      this.logger.log(`Successfully processed admin action ${payload.action}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to process admin action: ${err.message}`, 
        err.stack
      );
    }
  }

  /**
   * Traite les demandes spécifiques à l'accounting-service
   */
  @OnEvent('accounting.customer.request')
  async handleAccountingRequest(payload: {
    customerId: string;
    requestType: 'billing_update' | 'invoice_request' | 'payment_record';
    data: Record<string, any>;
    requestId: string;
  }): Promise<void> {
    this.logger.log(`Processing accounting request ${payload.requestType} for customer ${payload.customerId}`);
    
    try {
      if (!this.isServiceAuthorized('accounting-service', 'update', 'customer')) {
        this.logger.warn('Unauthorized accounting service request');
        return;
      }
      
      switch (payload.requestType) {
        case 'billing_update':
          // Mise à jour des informations de facturation
          await this.customerService.updateById(payload.customerId, {
            billingInfo: payload.data.billingInfo
          });
          break;
          
        case 'invoice_request':
          // Logique pour créer une nouvelle facture
          // Cette fonctionnalité serait implémentée dans un service de facturation
          this.logger.log(`Invoice request received: ${JSON.stringify(payload.data)}`);
          break;
          
        case 'payment_record':
          // Enregistrement d'un paiement
          this.logger.log(`Payment record received: ${JSON.stringify(payload.data)}`);
          break;
          
        default:
          this.logger.warn(`Unknown accounting request type: ${payload.requestType}`);
      }
      
      this.logger.log(`Successfully processed accounting request ${payload.requestId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to process accounting request: ${err.message}`, 
        err.stack
      );
    }
  }

  /**
   * Traite la consommation de tokens venant d'Adha-ai-service
   */
  @OnEvent('adha-ai.token.usage')
  async handleAdhaAiTokenUsage(payload: {
    customerId: string;
    userId?: string;
    amount: number;
    serviceType: string;
    requestId?: string;
    context?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(
      `Processing token usage of ${payload.amount} from Adha-ai-service for customer ${payload.customerId}`,
    );

    try {
      await this.tokenService.recordTokenUsage({
        customerId: payload.customerId,
        userId: payload.userId,
        amount: payload.amount,
        serviceType: payload.serviceType,
        requestId: payload.requestId,
        context: {
          ...(payload.context || {}),
          requestingService: 'adha-ai-service',
        },
      });
      this.logger.log(`Successfully recorded token usage for request ${payload.requestId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to record token usage: ${err.message}`, err.stack);
    }
  }

  /**
   * Traite les demandes spécifiques à l'app-mobile-service
   */
  @OnEvent('mobile.user.action')
  async handleMobileUserAction(payload: {
    userId: string;
    customerId: string;
    action: string;
    data: Record<string, any>;
    deviceInfo?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Processing mobile user action ${payload.action} for user ${payload.userId}`);
    
    try {
      switch (payload.action) {
        case 'user_preference_update':
          // Mettre à jour les préférences utilisateur
          await this.userService.updateUserPreferences(payload.userId, payload.data.preferences);
          break;
          
        case 'device_registered':
          // Enregistrer un nouvel appareil pour l'utilisateur
          if (payload.deviceInfo) {
            const deviceInfo = {
              deviceId: payload.deviceInfo.deviceId || 'unknown',
              deviceType: payload.deviceInfo.deviceType || 'unknown',
              platform: payload.deviceInfo.platform || 'unknown',
              appVersion: payload.deviceInfo.appVersion,
              osVersion: payload.deviceInfo.osVersion,
            };
            await this.userService.registerUserDevice(payload.userId, deviceInfo);
          }
          break;
          
        case 'token_usage_request':
          // Traiter une demande d'utilisation de tokens
          if (payload.data.tokenAmount && payload.data.purpose) {
            await this.tokenService.recordTokenUsage({
              customerId: payload.customerId,
              userId: payload.userId,
              amount: payload.data.tokenAmount,
              serviceType: payload.data.purpose, // Correction: 'purpose' -> 'serviceType'
              context: { 
                ...(payload.data.context || {}),
                requestingService: 'mobile-service',
                deviceInfo: payload.deviceInfo 
              },
            });
          }
          break;
          
        default:
          this.logger.warn(`Unknown mobile user action: ${payload.action}`);
      }
      
      this.logger.log(`Successfully processed mobile user action ${payload.action}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to process mobile user action: ${err.message}`, 
        err.stack
      );
    }
  }

  /**
   * Traite les demandes spécifiques au portfolio-sme-service
   */
  @OnEvent('portfolio-sme.customer.update')
  async handleSmePortfolioUpdate(payload: {
    customerId: string;
    smeId: string;
    updateType: 'profile' | 'documents' | 'financial_data';
    data: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Processing SME portfolio update ${payload.updateType} for customer ${payload.customerId}`);
    
    try {
      if (!this.isServiceAuthorized('portfolio-sme-service', 'update', 'customer')) {
        this.logger.warn('Unauthorized SME portfolio service request');
        return;
      }
      
      switch (payload.updateType) {
        case 'profile':
          // Mise à jour du profil PME
          await this.customerService.updateById(payload.customerId, {
            name: payload.data.name,
            phone: payload.data.phone,
            address: payload.data.address,
            city: payload.data.city,
            country: payload.data.country,
          });
          break;
          
        case 'documents':
          // Mise à jour des documents
          this.logger.log(`Documents update received: ${JSON.stringify(payload.data.documentIds)}`);
          // Logique pour associer de nouveaux documents au client
          break;
          
        case 'financial_data':
          // Mise à jour des données financières
          this.logger.log(`Financial data update received`);
          // Cette mise à jour serait propagée à d'autres services concernés
          break;
          
        default:
          this.logger.warn(`Unknown SME portfolio update type: ${payload.updateType}`);
      }
      
      this.logger.log(`Successfully processed SME portfolio update for customer ${payload.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to process SME portfolio update: ${err.message}`, 
        err.stack
      );
    }
  }

  /**
   * Traite les demandes spécifiques au portfolio-institution-service
   */
  @OnEvent('portfolio-institution.customer.update')
  async handleInstitutionPortfolioUpdate(payload: {
    customerId: string;
    institutionId: string;
    updateType: 'profile' | 'documents' | 'regulatory_info';
    data: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Processing institution portfolio update ${payload.updateType} for customer ${payload.customerId}`);
    
    try {
      if (!this.isServiceAuthorized('portfolio-institution-service', 'update', 'customer')) {
        this.logger.warn('Unauthorized institution portfolio service request');
        return;
      }
      
      switch (payload.updateType) {
        case 'profile':
          // Mise à jour du profil de l'institution
          await this.customerService.updateById(payload.customerId, {
            name: payload.data.name,
            phone: payload.data.phone,
            address: payload.data.address,
            city: payload.data.city,
            country: payload.data.country,
          });
          break;
          
        case 'documents':
          // Mise à jour des documents réglementaires
          this.logger.log(`Institution documents update received: ${JSON.stringify(payload.data.documentIds)}`);
          break;
          
        case 'regulatory_info':
          // Mise à jour des informations réglementaires
          this.logger.log(`Regulatory info update received`);
          break;
          
        default:
          this.logger.warn(`Unknown institution portfolio update type: ${payload.updateType}`);
      }
      
      this.logger.log(`Successfully processed institution portfolio update for customer ${payload.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to process institution portfolio update: ${err.message}`, 
        err.stack
      );
    }
  }

  /**
   * Traite les requêtes de lecture de données par d'autres services
   */
  @OnEvent('customer.data.request')
  async handleCustomerDataRequest(payload: {
    requestingService: string;
    requestType: 'customer' | 'user' | 'subscription' | 'token';
    entityId: string;
    responsePattern: string;
  }): Promise<void> {
    this.logger.log(`Processing customer data request from ${payload.requestingService} for ${payload.requestType} ${payload.entityId}`);
    
    try {
      // Vérifier les autorisations du service demandeur
      if (!this.isServiceAuthorized(payload.requestingService, 'read', payload.requestType as any)) {
        this.logger.warn(`Unauthorized data request from ${payload.requestingService}`);
        // Envoyer une réponse d'erreur
        await this.kafkaClient.emit(payload.responsePattern, {
          error: 'Unauthorized',
          status: 403
        });
        return;
      }
      
      // Récupérer les données demandées selon le type
      let data: any = null;
      let error: string | undefined = undefined;
      
      try {
        switch (payload.requestType) {
          case 'customer':
            data = await this.customerService.findById(payload.entityId);
            break;
            
          case 'user':
            data = await this.userService.findById(payload.entityId);
            break;
            
          case 'subscription':
            data = await this.subscriptionService.findById(payload.entityId);
            break;
            
          case 'token':
            data = await this.tokenService.getTokenBalance(payload.entityId);
            break;
            
          default:
            error = `Unknown request type: ${payload.requestType}`;
        }
      } catch (err: unknown) {
        error = (err as Error).message;
      }
      
      // Envoyer la réponse
      await this.kafkaClient.emit(payload.responsePattern, {
        data,
        error,
        status: error ? 404 : 200
      });
      
      this.logger.log(`Customer data request processed, response sent to ${payload.responsePattern}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to process customer data request: ${err.message}`, 
        err.stack
      );
      
      // Tenter d'envoyer une réponse d'erreur
      try {
        await this.kafkaClient.emit(payload.responsePattern, {
          error: err.message,
          status: 500
        });
      } catch (e) {
        this.logger.error(`Failed to send error response: ${(e as Error).message}`);
      }
    }
  }

  /**
   * Vérifie si un service a l'autorisation pour une action donnée
   */
  private isServiceAuthorized(
    serviceName: string, 
    action: 'read' | 'update' | 'delete', 
    resource: 'customer' | 'user' | 'subscription'
  ): boolean {
    // Mapping des autorisations par service
    const servicePermissions: Record<string, Record<string, string[]>> = {
      'admin-service': {
        'customer': ['read', 'update', 'delete'],
        'user': ['read', 'update', 'delete'],
        'subscription': ['read', 'update', 'delete'],
      },
      'analytics-service': {
        'customer': ['read'],
        'user': ['read'],
        'subscription': ['read'],
      },
      'accounting-service': {
        'customer': ['read'],
        'user': ['read'],
        'subscription': ['read'],
      },
      'portfolio-sme-service': {
        'customer': ['read', 'update'],
        'user': ['read'],
        'subscription': ['read'],
      },
      'portfolio-institution-service': {
        'customer': ['read', 'update'],
        'user': ['read'],
        'subscription': ['read'],
      },
    };
    
    // Vérifier les autorisations
    if (!servicePermissions[serviceName]) {
      return false;
    }
    
    if (!servicePermissions[serviceName][resource]) {
      return false;
    }
    
    return servicePermissions[serviceName][resource].includes(action);
  }

  /**
   * Filtrer les champs de mise à jour selon les autorisations du service
   */
  private sanitizeUpdateFields(
    updateFields: Record<string, any>,
    allowedFields: string[]
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        sanitized[field] = updateFields[field];
      }
    }
    
    return sanitized;
  }

  /**
   * Obtenir les champs autorisés pour un service donné
   */
  private getAllowedFieldsForService(serviceName: string): string[] {
    const fieldsByService: Record<string, string[]> = {
      'admin-service': [
        'name', 'email', 'phone', 'address', 'city', 'country', 
        'status', 'accountType', 'tokenAllocation', 'preferences'
      ],
      'portfolio-sme-service': [
        'name', 'phone', 'address', 'city', 'country', 'preferences'
      ],
      'portfolio-institution-service': [
        'name', 'phone', 'address', 'city', 'country', 'preferences'
      ],
      'accounting-service': [
        'preferences'
      ],
      'analytics-service': [
        'preferences'
      ],
    };
    
    return fieldsByService[serviceName] || [];
  }
}
