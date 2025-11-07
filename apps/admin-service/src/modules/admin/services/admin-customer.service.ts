import { Injectable, Logger } from '@nestjs/common';
import { CustomerSyncService } from '@wanzobe/customer-sync';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminCustomerService {
  private readonly logger = new Logger(AdminCustomerService.name);
  private readonly customerServiceUrl: string;

  constructor(
    private readonly customerSyncService: CustomerSyncService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.customerServiceUrl = this.configService.get<string>('CUSTOMER_SERVICE_URL', 'http://localhost:3004');
  }

  /**
   * Récupère tous les clients (via API REST)
   */
  async findAllCustomers(page = 1, limit = 20) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.customerServiceUrl}/customers`, {
          params: { page, limit },
          headers: {
            'X-Service-ID': 'admin-service',
            'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
          },
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch customers: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère un client par ID (via Kafka)
   */
  async findCustomerById(id: string) {
    try {
      return await this.customerSyncService.getCustomerById(id);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch customer ${id}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Exécute une action administrative sur un client (via Kafka)
   */
  async performCustomerAction(actionData: {
    customerId: string;
    adminId: string;
    action: 'validate' | 'suspend' | 'reactivate';
    reason?: string;
    details?: Record<string, any>;
  }) {
    try {
      // Envoyer l'événement Kafka pour l'action administrative
      const result = await this.customerSyncService.performAdminAction(actionData);
      
      return {
        success: true,
        message: `Action ${actionData.action} demandée avec succès`,
        requestId: result.requestId,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to perform action ${actionData.action} on customer ${actionData.customerId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les utilisateurs d'un client
   */
  async getCustomerUsers(customerId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.customerServiceUrl}/customers/${customerId}/users`, {
          headers: {
            'X-Service-ID': 'admin-service',
            'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
          },
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch users for customer ${customerId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les abonnements d'un client
   */
  async getCustomerSubscriptions(customerId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.customerServiceUrl}/customers/${customerId}/subscriptions`, {
          headers: {
            'X-Service-ID': 'admin-service',
            'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
          },
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch subscriptions for customer ${customerId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère l'utilisation des services par un client
   */
  async getCustomerUsage(customerId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.customerServiceUrl}/customers/${customerId}/usage`, {
          headers: {
            'X-Service-ID': 'admin-service',
            'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
          },
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch usage for customer ${customerId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Met à jour un abonnement d'un client dans Customer Service
   */
  async updateCustomerSubscription(customerId: string, subscriptionId: string, updates: {
    status?: string;
    tokensIncluded?: number;
    tokensRemaining?: number;
    endDate?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.customerServiceUrl}/customers/${customerId}/subscriptions/${subscriptionId}`,
          updates,
          {
            headers: {
              'X-Service-ID': 'admin-service',
              'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
            },
          }
        ),
      );
      
      this.logger.log(`Updated subscription ${subscriptionId} for customer ${customerId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to update subscription: ${err.message}`);
      throw error;
    }
  }

  /**
   * Annule un abonnement dans Customer Service
   */
  async cancelCustomerSubscription(customerId: string, subscriptionId: string, reason: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.customerServiceUrl}/customers/${customerId}/subscriptions/${subscriptionId}/cancel`,
          { reason, canceledBy: 'admin-service' },
          {
            headers: {
              'X-Service-ID': 'admin-service',
              'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
            },
          }
        ),
      );
      
      this.logger.log(`Cancelled subscription ${subscriptionId} for customer ${customerId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to cancel subscription: ${err.message}`);
      throw error;
    }
  }

  /**
   * Alloue des tokens à un client dans Customer Service
   */
  async allocateTokensToCustomer(customerId: string, data: {
    amount: number;
    reason: string;
    expiryDate?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.customerServiceUrl}/customers/${customerId}/tokens/allocate`,
          {
            ...data,
            allocatedBy: 'admin-service',
          },
          {
            headers: {
              'X-Service-ID': 'admin-service',
              'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
            },
          }
        ),
      );
      
      this.logger.log(`Allocated ${data.amount} tokens to customer ${customerId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to allocate tokens: ${err.message}`);
      throw error;
    }
  }

  /**
   * Suspend un utilisateur d'un client
   */
  async suspendCustomerUser(customerId: string, userId: string, reason: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.customerServiceUrl}/customers/${customerId}/users/${userId}/suspend`,
          { reason, suspendedBy: 'admin-service' },
          {
            headers: {
              'X-Service-ID': 'admin-service',
              'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
            },
          }
        ),
      );
      
      this.logger.log(`Suspended user ${userId} of customer ${customerId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to suspend user: ${err.message}`);
      throw error;
    }
  }

  /**
   * Réactive un utilisateur d'un client
   */
  async reactivateCustomerUser(customerId: string, userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.customerServiceUrl}/customers/${customerId}/users/${userId}/reactivate`,
          { reactivatedBy: 'admin-service' },
          {
            headers: {
              'X-Service-ID': 'admin-service',
              'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
            },
          }
        ),
      );
      
      this.logger.log(`Reactivated user ${userId} of customer ${customerId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to reactivate user: ${err.message}`);
      throw error;
    }
  }

  /**
   * Crée un nouvel abonnement pour un client dans Customer Service
   */
  async createCustomerSubscription(customerId: string, data: {
    planId: string;
    startDate: string;
    billingCycle: string;
    autoRenew?: boolean;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.customerServiceUrl}/customers/${customerId}/subscriptions`,
          {
            ...data,
            createdBy: 'admin-service',
          },
          {
            headers: {
              'X-Service-ID': 'admin-service',
              'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
            },
          }
        ),
      );
      
      this.logger.log(`Created subscription for customer ${customerId} with plan ${data.planId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to create subscription: ${err.message}`);
      throw error;
    }
  }
}
