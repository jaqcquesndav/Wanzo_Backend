import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  type: 'sme' | 'financial';
  status: string;
  [key: string]: any;
}

export interface UserData {
  id: string;
  customerId: string;
  email: string;
  role: string;
  status: string;
  [key: string]: any;
}

@Injectable()
export class CustomerSyncService {
  private readonly logger = new Logger(CustomerSyncService.name);
  private readonly serviceIdentifier: string;

  constructor(
    @Inject('CUSTOMER_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    @Inject('CUSTOMER_SYNC_OPTIONS') private readonly options: any,
  ) {
    this.serviceIdentifier = options.serviceIdentifier;
  }

  /**
   * Récupère les données d'un client par son ID
   */
  async getCustomerById(customerId: string): Promise<CustomerData> {
    return this.sendCustomerServiceRequest({
      action: 'getCustomer',
      customerId,
      service: this.serviceIdentifier,
    });
  }

  /**
   * Récupère les utilisateurs d'un client
   */
  async getCustomerUsers(customerId: string): Promise<UserData[]> {
    return this.sendCustomerServiceRequest({
      action: 'getCustomerUsers',
      customerId,
      service: this.serviceIdentifier,
    });
  }

  /**
   * Demande une mise à jour de données client
   */
  async requestCustomerUpdate(
    customerId: string,
    updateFields: Record<string, any>,
  ): Promise<{ success: boolean; requestId: string }> {
    const requestId = this.generateRequestId();
    
    await this.kafkaClient.emit('customer.update.request', {
      customerId,
      requestingService: this.serviceIdentifier,
      updateFields,
      requestId,
      timestamp: new Date().toISOString(),
    });
    
    return { success: true, requestId };
  }

  /**
   * Demande une action administrative sur un client
   */
  async performAdminAction(actionData: {
    customerId: string;
    adminId: string;
    action: 'validate' | 'suspend' | 'reactivate';
    reason?: string;
    details?: Record<string, any>;
  }): Promise<{ success: boolean; requestId: string }> {
    const requestId = this.generateRequestId();

    await this.kafkaClient.emit('admin.customer.action', {
      ...actionData,
      requestingService: this.serviceIdentifier,
      requestId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, requestId };
  }

  /**
   * Envoie une requête au customer-service et attend la réponse
   */
  private async sendCustomerServiceRequest(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const responsePattern = `customer.response.${this.serviceIdentifier}.${this.generateRequestId()}`;
      
      // S'abonner au pattern de réponse
      this.kafkaClient.subscribeToResponseOf(responsePattern);
      
      // Envoyer la requête
      this.kafkaClient
        .send('customer.request', {
          ...payload,
          responsePattern,
        })
        .subscribe({
          next: (response) => {
            resolve(response);
          },
          error: (error) => {
            this.logger.error(`Error in customer service request: ${error}`);
            reject(error);
          },
        });
    });
  }

  /**
   * Génère un ID de requête unique
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

export * from './customer-sync.module';
