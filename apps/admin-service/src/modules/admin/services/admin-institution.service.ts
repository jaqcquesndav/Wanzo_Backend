import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Service pour gérer les institutions financières via Portfolio Institution Service
 */
@Injectable()
export class AdminInstitutionService {
  private readonly logger = new Logger(AdminInstitutionService.name);
  private readonly institutionServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.institutionServiceUrl = this.configService.get<string>(
      'INSTITUTION_SERVICE_URL', 
      'http://localhost:3006'
    );
  }

  /**
   * Récupère toutes les institutions financières
   */
  async findAllInstitutions(page = 1, limit = 20, filters?: {
    status?: string;
    type?: string;
    search?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.institutionServiceUrl}/institutions`, {
          params: { page, limit, ...filters },
          headers: this.getServiceHeaders(),
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch institutions: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère une institution par ID
   */
  async findInstitutionById(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.institutionServiceUrl}/institutions/${id}`, {
          headers: this.getServiceHeaders(),
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch institution ${id}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les utilisateurs d'une institution
   */
  async getInstitutionUsers(institutionId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.institutionServiceUrl}/institutions/${institutionId}/users`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch users for institution ${institutionId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les portefeuilles d'une institution
   */
  async getInstitutionPortfolios(institutionId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.institutionServiceUrl}/institutions/${institutionId}/portfolios`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch portfolios for institution ${institutionId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'une institution
   */
  async getInstitutionStatistics(institutionId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.institutionServiceUrl}/institutions/${institutionId}/statistics`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch statistics for institution ${institutionId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Met à jour une institution
   */
  async updateInstitution(institutionId: string, updates: {
    name?: string;
    status?: string;
    institutionType?: string;
    regulatoryLicenseNumber?: string;
    contacts?: any;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.institutionServiceUrl}/institutions/${institutionId}`,
          { ...updates, updatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Updated institution ${institutionId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to update institution: ${err.message}`);
      throw error;
    }
  }

  /**
   * Suspend une institution
   */
  async suspendInstitution(institutionId: string, reason: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.institutionServiceUrl}/institutions/${institutionId}/suspend`,
          { reason, suspendedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Suspended institution ${institutionId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to suspend institution: ${err.message}`);
      throw error;
    }
  }

  /**
   * Réactive une institution
   */
  async reactivateInstitution(institutionId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.institutionServiceUrl}/institutions/${institutionId}/reactivate`,
          { reactivatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Reactivated institution ${institutionId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to reactivate institution: ${err.message}`);
      throw error;
    }
  }

  /**
   * Suspend un utilisateur d'une institution
   */
  async suspendInstitutionUser(institutionId: string, userId: string, reason: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.institutionServiceUrl}/institutions/${institutionId}/users/${userId}/suspend`,
          { reason, suspendedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Suspended user ${userId} of institution ${institutionId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to suspend institution user: ${err.message}`);
      throw error;
    }
  }

  /**
   * Réactive un utilisateur d'une institution
   */
  async reactivateInstitutionUser(institutionId: string, userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.institutionServiceUrl}/institutions/${institutionId}/users/${userId}/reactivate`,
          { reactivatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Reactivated user ${userId} of institution ${institutionId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to reactivate institution user: ${err.message}`);
      throw error;
    }
  }

  /**
   * Alloue des tokens à une institution
   */
  async allocateTokensToInstitution(institutionId: string, data: {
    amount: number;
    reason: string;
    expiryDate?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.institutionServiceUrl}/institutions/${institutionId}/tokens/allocate`,
          { ...data, allocatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Allocated ${data.amount} tokens to institution ${institutionId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to allocate tokens to institution: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère l'abonnement d'une institution
   */
  async getInstitutionSubscription(institutionId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.institutionServiceUrl}/institutions/${institutionId}/subscription`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch subscription for institution ${institutionId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Met à jour l'abonnement d'une institution
   */
  async updateInstitutionSubscription(institutionId: string, subscriptionId: string, updates: {
    status?: string;
    tokensIncluded?: number;
    tokensRemaining?: number;
    endDate?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.institutionServiceUrl}/institutions/${institutionId}/subscriptions/${subscriptionId}`,
          { ...updates, updatedBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Updated subscription ${subscriptionId} for institution ${institutionId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to update institution subscription: ${err.message}`);
      throw error;
    }
  }

  /**
   * Annule l'abonnement d'une institution
   */
  async cancelInstitutionSubscription(institutionId: string, subscriptionId: string, reason: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.institutionServiceUrl}/institutions/${institutionId}/subscriptions/${subscriptionId}/cancel`,
          { reason, canceledBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Cancelled subscription ${subscriptionId} for institution ${institutionId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to cancel institution subscription: ${err.message}`);
      throw error;
    }
  }

  /**
   * Crée un abonnement pour une institution
   */
  async createInstitutionSubscription(institutionId: string, data: {
    planId: string;
    startDate: string;
    billingCycle: string;
    autoRenew?: boolean;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.institutionServiceUrl}/institutions/${institutionId}/subscriptions`,
          { ...data, createdBy: 'admin-service' },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Created subscription for institution ${institutionId} with plan ${data.planId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to create institution subscription: ${err.message}`);
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
