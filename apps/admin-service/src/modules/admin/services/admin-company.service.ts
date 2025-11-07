import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Service pour gérer les entreprises (SME/Company) via Gestion Commerciale Service
 */
@Injectable()
export class AdminCompanyService {
  private readonly logger = new Logger(AdminCompanyService.name);
  private readonly gestionCommercialeUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.gestionCommercialeUrl = this.configService.get<string>(
      'GESTION_COMMERCIALE_SERVICE_URL', 
      'http://localhost:3005'
    );
  }

  /**
   * Récupère toutes les entreprises
   */
  async findAllCompanies(page = 1, limit = 20, filters?: {
    status?: string;
    category?: string;
    search?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.gestionCommercialeUrl}/company`, {
          params: { page, limit, ...filters },
          headers: this.getServiceHeaders(),
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch companies: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère une entreprise par ID
   */
  async findCompanyById(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.gestionCommercialeUrl}/company/${id}`, {
          headers: this.getServiceHeaders(),
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch company ${id}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les utilisateurs d'une entreprise
   */
  async getCompanyUsers(companyId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.gestionCommercialeUrl}/company/${companyId}/users`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch users for company ${companyId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les ventes d'une entreprise
   */
  async getCompanySales(companyId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.gestionCommercialeUrl}/company/${companyId}/sales`,
          {
            params: filters,
            headers: this.getServiceHeaders()
          }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch sales for company ${companyId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les dépenses d'une entreprise
   */
  async getCompanyExpenses(companyId: string, filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.gestionCommercialeUrl}/company/${companyId}/expenses`,
          {
            params: filters,
            headers: this.getServiceHeaders()
          }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch expenses for company ${companyId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère l'inventaire d'une entreprise
   */
  async getCompanyInventory(companyId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.gestionCommercialeUrl}/company/${companyId}/inventory`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch inventory for company ${companyId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les clients d'une entreprise (business customers)
   */
  async getCompanyCustomers(companyId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.gestionCommercialeUrl}/company/${companyId}/customers`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch customers for company ${companyId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les fournisseurs d'une entreprise
   */
  async getCompanySuppliers(companyId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.gestionCommercialeUrl}/company/${companyId}/suppliers`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch suppliers for company ${companyId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les statistiques financières d'une entreprise
   */
  async getCompanyFinancialStats(companyId: string, period?: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.gestionCommercialeUrl}/company/${companyId}/financial-stats`,
          {
            params: { period },
            headers: this.getServiceHeaders()
          }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch financial stats for company ${companyId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Met à jour une entreprise
   */
  async updateCompany(companyId: string, updates: {
    name?: string;
    status?: string;
    category?: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.gestionCommercialeUrl}/company/${companyId}`,
          { ...updates, updatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Updated company ${companyId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to update company: ${err.message}`);
      throw error;
    }
  }

  /**
   * Suspend une entreprise
   */
  async suspendCompany(companyId: string, reason: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.gestionCommercialeUrl}/company/${companyId}/suspend`,
          { reason, suspendedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Suspended company ${companyId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to suspend company: ${err.message}`);
      throw error;
    }
  }

  /**
   * Réactive une entreprise
   */
  async reactivateCompany(companyId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.gestionCommercialeUrl}/company/${companyId}/reactivate`,
          { reactivatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Reactivated company ${companyId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to reactivate company: ${err.message}`);
      throw error;
    }
  }

  /**
   * Suspend un utilisateur d'une entreprise
   */
  async suspendCompanyUser(companyId: string, userId: string, reason: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.gestionCommercialeUrl}/company/${companyId}/users/${userId}/suspend`,
          { reason, suspendedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Suspended user ${userId} of company ${companyId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to suspend company user: ${err.message}`);
      throw error;
    }
  }

  /**
   * Réactive un utilisateur d'une entreprise
   */
  async reactivateCompanyUser(companyId: string, userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.gestionCommercialeUrl}/company/${companyId}/users/${userId}/reactivate`,
          { reactivatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Reactivated user ${userId} of company ${companyId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to reactivate company user: ${err.message}`);
      throw error;
    }
  }

  /**
   * Alloue des tokens à une entreprise
   */
  async allocateTokensToCompany(companyId: string, data: {
    amount: number;
    reason: string;
    expiryDate?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.gestionCommercialeUrl}/company/${companyId}/tokens/allocate`,
          { ...data, allocatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Allocated ${data.amount} tokens to company ${companyId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to allocate tokens to company: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère l'abonnement d'une entreprise
   */
  async getCompanySubscription(companyId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.gestionCommercialeUrl}/company/${companyId}/subscription`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch subscription for company ${companyId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Met à jour l'abonnement d'une entreprise
   */
  async updateCompanySubscription(companyId: string, subscriptionId: string, updates: {
    status?: string;
    tokensIncluded?: number;
    tokensRemaining?: number;
    endDate?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.gestionCommercialeUrl}/company/${companyId}/subscriptions/${subscriptionId}`,
          { ...updates, updatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Updated subscription ${subscriptionId} for company ${companyId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to update company subscription: ${err.message}`);
      throw error;
    }
  }

  /**
   * Annule l'abonnement d'une entreprise
   */
  async cancelCompanySubscription(companyId: string, subscriptionId: string, reason: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.gestionCommercialeUrl}/company/${companyId}/subscriptions/${subscriptionId}/cancel`,
          { reason, canceledBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Cancelled subscription ${subscriptionId} for company ${companyId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to cancel company subscription: ${err.message}`);
      throw error;
    }
  }

  /**
   * Crée un abonnement pour une entreprise
   */
  async createCompanySubscription(companyId: string, data: {
    planId: string;
    startDate: string;
    billingCycle: string;
    autoRenew?: boolean;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.gestionCommercialeUrl}/company/${companyId}/subscriptions`,
          { ...data, createdBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Created subscription for company ${companyId} with plan ${data.planId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to create company subscription: ${err.message}`);
      throw error;
    }
  }

  /**
   * Headers d'authentification service-to-service
   */
  private getServiceHeaders() {
    return {
      'X-Service-ID': 'admin-service',
      'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
      'Content-Type': 'application/json',
    };
  }
}
