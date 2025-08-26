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
}
