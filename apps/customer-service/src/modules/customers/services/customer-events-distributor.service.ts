import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '../../kafka/decorators/on-event.decorator';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

/**
 * Service intermédiaire qui écoute les événements internes au service customer
 * et les propage vers les autres services en fonction des besoins spécifiques
 * 
 * Ce service sert de point central pour propager les événements aux services concernés
 */
@Injectable()
export class CustomerEventsDistributor {
  private readonly logger = new Logger(CustomerEventsDistributor.name);

  constructor(
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  /**
   * Distribue l'événement de création de client aux services concernés
   */
  @OnEvent('customer.created')
  async onCustomerCreated(customer: any): Promise<void> {
    this.logger.log(`Distributing customer created event for ${customer.id}`);
    
    try {
      // Envoyer aux différents services concernés
      
      // Admin service - toujours informé des nouveaux clients
      await this.customerEventsProducer.emitCustomerCreated({
        customerId: customer.id,
        customerType: customer.type,
        timestamp: new Date().toISOString(),
        targetService: 'admin-service'
      });
      
      // Accounting service - pour la facturation et les tokens
      await this.customerEventsProducer.emitCustomerCreated({
        customerId: customer.id,
        customerType: customer.type,
        timestamp: new Date().toISOString(),
        targetService: 'accounting-service'
      });
      
      // Portfolio service spécifique selon le type de client
      if (customer.type === 'institution') {
        await this.customerEventsProducer.emitCustomerCreated({
          customerId: customer.id,
          customerType: customer.type,
          timestamp: new Date().toISOString(),
          targetService: 'portfolio-institution-service'
        });
      }
      
      // Analytics service - pour les statistiques et le suivi
      await this.customerEventsProducer.emitCustomerCreated({
        customerId: customer.id,
        customerType: customer.type,
        timestamp: new Date().toISOString(),
        targetService: 'analytics-service'
      });
      
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to distribute customer created event: ${err.message}`, err.stack);
    }
  }

  /**
   * Distribue l'événement de mise à jour de client aux services concernés
   */
  @OnEvent('customer.updated')
  async onCustomerUpdated(data: any): Promise<void> {
    this.logger.log(`Distributing customer updated event for ${data.customerId}`);
    
    try {
      // Envoyer aux différents services selon les champs mis à jour
      const updatedFields = data.updatedFields || [];
      
      // Admin service - toujours informé des mises à jour clients
      await this.customerEventsProducer.emitCustomerUpdated({
        customerId: data.customerId,
        updatedFields: updatedFields,
        timestamp: new Date().toISOString(),
        targetService: 'admin-service'
      });
      
      // Accounting service - si les champs de facturation sont modifiés
      const billingRelatedFields = ['billingInfo', 'paymentMethod', 'taxId'];
      if (updatedFields.some((field: string) => billingRelatedFields.includes(field))) {
        await this.customerEventsProducer.emitCustomerUpdated({
          customerId: data.customerId,
          updatedFields: updatedFields.filter((field: string) => billingRelatedFields.includes(field)),
          timestamp: new Date().toISOString(),
          targetService: 'accounting-service'
        });
      }
      
      // Portfolio services - si les informations de profil sont modifiées
      const profileFields = ['name', 'address', 'phone', 'email', 'city', 'country'];
      if (updatedFields.some((field: string) => profileFields.includes(field))) {
        if (data.customerType === 'institution') {
          await this.customerEventsProducer.emitCustomerUpdated({
            customerId: data.customerId,
            updatedFields: updatedFields.filter((field: string) => profileFields.includes(field)),
            timestamp: new Date().toISOString(),
            targetService: 'portfolio-institution-service'
          });
        }
      }
      
      // Analytics service - pour statistiques et suivi
      await this.customerEventsProducer.emitCustomerUpdated({
        customerId: data.customerId,
        updatedFields: updatedFields,
        timestamp: new Date().toISOString(),
        targetService: 'analytics-service'
      });
      
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to distribute customer updated event: ${err.message}`, err.stack);
    }
  }

  /**
   * Distribue l'événement de validation d'un client
   */
  @OnEvent('customer.validated')
  async onCustomerValidated(data: any): Promise<void> {
    this.logger.log(`Distributing customer validated event for ${data.customerId}`);
    
    try {
      // Informer tous les services concernés de la validation du client
      
      // Admin service
      await this.customerEventsProducer.emitCustomerValidated({
        customerId: data.customerId,
        adminId: data.adminId,
        timestamp: data.timestamp,
        targetService: 'admin-service'
      });
      
      // Accounting service - pour activer la facturation
      await this.customerEventsProducer.emitCustomerValidated({
        customerId: data.customerId,
        adminId: data.adminId,
        timestamp: data.timestamp,
        targetService: 'accounting-service'
      });
      
      // Portfolio services
      if (data.customerType === 'institution') {
        await this.customerEventsProducer.emitCustomerValidated({
          customerId: data.customerId,
          adminId: data.adminId,
          timestamp: data.timestamp,
          targetService: 'portfolio-institution-service'
        });
      }
      
      // Mobile service - pour notifier l'utilisateur
      await this.customerEventsProducer.emitCustomerValidated({
        customerId: data.customerId,
        adminId: data.adminId,
        timestamp: data.timestamp,
        targetService: 'app-mobile-service'
      });
      
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to distribute customer validated event: ${err.message}`, err.stack);
    }
  }

  /**
   * Distribue l'événement de suspension d'un client
   */
  @OnEvent('customer.suspended')
  async onCustomerSuspended(data: any): Promise<void> {
    this.logger.log(`Distributing customer suspended event for ${data.customerId}`);
    
    try {
      // Informer tous les services de la suspension du client
      
      // Admin service
      await this.customerEventsProducer.emitCustomerSuspended({
        customerId: data.customerId,
        adminId: data.adminId,
        reason: data.reason,
        timestamp: data.timestamp,
        targetService: 'admin-service'
      });
      
      // Accounting service - pour suspendre la facturation
      await this.customerEventsProducer.emitCustomerSuspended({
        customerId: data.customerId,
        adminId: data.adminId,
        reason: data.reason,
        timestamp: data.timestamp,
        targetService: 'accounting-service'
      });
      
      // Portfolio services
      if (data.customerType === 'institution') {
        await this.customerEventsProducer.emitCustomerSuspended({
          customerId: data.customerId,
          adminId: data.adminId,
          reason: data.reason,
          timestamp: data.timestamp,
          targetService: 'portfolio-institution-service'
        });
      }
      
      // Mobile service - pour notifier l'utilisateur
      await this.customerEventsProducer.emitCustomerSuspended({
        customerId: data.customerId,
        adminId: data.adminId,
        reason: data.reason,
        timestamp: data.timestamp,
        targetService: 'app-mobile-service'
      });
      
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to distribute customer suspended event: ${err.message}`, err.stack);
    }
  }

  /**
   * Distribue l'événement de réactivation d'un client
   */
  @OnEvent('customer.reactivated')
  async onCustomerReactivated(data: any): Promise<void> {
    this.logger.log(`Distributing customer reactivated event for ${data.customerId}`);
    
    try {
      // Informer tous les services de la réactivation du client
      
      // Admin service
      await this.customerEventsProducer.emitCustomerReactivated({
        customerId: data.customerId,
        adminId: data.adminId,
        timestamp: data.timestamp,
        targetService: 'admin-service'
      });
      
      // Accounting service - pour réactiver la facturation
      await this.customerEventsProducer.emitCustomerReactivated({
        customerId: data.customerId,
        adminId: data.adminId,
        timestamp: data.timestamp,
        targetService: 'accounting-service'
      });
      
      // Portfolio services
      if (data.customerType === 'institution') {
        await this.customerEventsProducer.emitCustomerReactivated({
          customerId: data.customerId,
          adminId: data.adminId,
          timestamp: data.timestamp,
          targetService: 'portfolio-institution-service'
        });
      }
      
      // Mobile service - pour notifier l'utilisateur
      await this.customerEventsProducer.emitCustomerReactivated({
        customerId: data.customerId,
        adminId: data.adminId,
        timestamp: data.timestamp,
        targetService: 'app-mobile-service'
      });
      
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to distribute customer reactivated event: ${err.message}`, err.stack);
    }
  }

  /**
   * Distribue l'événement de suppression d'un client
   */
  @OnEvent('customer.deleted')
  async onCustomerDeleted(data: { customerId: string, customerType: string }): Promise<void> {
    this.logger.log(`Distributing customer deleted event for ${data.customerId}`);
    
    try {
      // Informer tous les services de la suppression du client
      
      // Admin service
      await this.customerEventsProducer.emitCustomerDeleted(data.customerId, 'admin-service');
      
      // Accounting service
      await this.customerEventsProducer.emitCustomerDeleted(data.customerId, 'accounting-service');
      
      // Portfolio services
      if (data.customerType === 'institution') {
        await this.customerEventsProducer.emitCustomerDeleted(data.customerId, 'portfolio-institution-service');
      }
      
      // Analytics service
      await this.customerEventsProducer.emitCustomerDeleted(data.customerId, 'analytics-service');
      
      // Mobile service
      await this.customerEventsProducer.emitCustomerDeleted(data.customerId, 'app-mobile-service');
      
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to distribute customer deleted event: ${err.message}`, err.stack);
    }
  }
}
