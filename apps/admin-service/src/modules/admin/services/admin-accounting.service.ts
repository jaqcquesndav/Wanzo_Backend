import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * AdminAccountingService - Communication entre Admin Service et Accounting Service
 * Permet aux admins Wanzo d'agir sur les données comptables
 */
@Injectable()
export class AdminAccountingService {
  private readonly logger = new Logger(AdminAccountingService.name);
  private readonly accountingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accountingServiceUrl = this.configService.get<string>(
      'ACCOUNTING_SERVICE_URL',
      'http://localhost:3001'
    );
  }

  /**
   * En-têtes d'authentification inter-services
   */
  private getServiceHeaders() {
    return {
      'X-Service-ID': 'admin-service',
      'X-Service-Secret': this.configService.get<string>('SERVICE_SECRET', ''),
    };
  }

  /**
   * Récupère les entrées comptables d'un client
   */
  async getAccountingEntries(params: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/accounting-entries`, {
          params,
          headers: this.getServiceHeaders(),
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch accounting entries: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère une entrée comptable spécifique
   */
  async getAccountingEntryById(entryId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/accounting-entries/${entryId}`, {
          headers: this.getServiceHeaders(),
        }),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch accounting entry ${entryId}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Crée un ajustement comptable manuel
   */
  async createManualAdjustment(data: {
    customerId: string;
    amount: number;
    currency: string;
    type: 'debit' | 'credit';
    description: string;
    reason: string;
    createdBy: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.accountingServiceUrl}/api/v1/accounting-entries/adjustment`,
          data,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Manual adjustment created for customer ${data.customerId}: ${response.data.id}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to create manual adjustment: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère le rapport financier d'un client
   */
  async getFinancialReport(params: {
    customerId: string;
    startDate: string;
    endDate: string;
    includeProjections?: boolean;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.accountingServiceUrl}/api/v1/reports/financial`,
          {
            params,
            headers: this.getServiceHeaders(),
          }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch financial report: ${err.message}`);
      throw error;
    }
  }

  /**
   * Réconcilie un paiement avec une facture
   */
  async reconcilePayment(data: {
    invoiceId: string;
    paymentId: string;
    amount: number;
    reconciledBy: string;
    notes?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.accountingServiceUrl}/api/v1/reconciliation`,
          data,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Payment reconciliation completed: Invoice ${data.invoiceId} with Payment ${data.paymentId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to reconcile payment: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère le solde d'un client
   */
  async getCustomerBalance(customerId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.accountingServiceUrl}/api/v1/customers/${customerId}/balance`,
          { headers: this.getServiceHeaders() }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch customer balance: ${err.message}`);
      throw error;
    }
  }

  /**
   * Récupère les transactions d'un client
   */
  async getCustomerTransactions(params: {
    customerId: string;
    startDate?: string;
    endDate?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.accountingServiceUrl}/api/v1/transactions`,
          {
            params,
            headers: this.getServiceHeaders(),
          }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to fetch customer transactions: ${err.message}`);
      throw error;
    }
  }

  /**
   * Exporte les données comptables
   */
  async exportAccountingData(params: {
    customerId?: string;
    startDate: string;
    endDate: string;
    format: 'csv' | 'xlsx' | 'pdf';
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.accountingServiceUrl}/api/v1/export`,
          params,
          {
            headers: this.getServiceHeaders(),
            responseType: 'arraybuffer',
          }
        ),
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to export accounting data: ${err.message}`);
      throw error;
    }
  }

  /**
   * Valide une facture
   */
  async validateInvoice(invoiceId: string, validatedBy: string, notes?: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.accountingServiceUrl}/api/v1/invoices/${invoiceId}/validate`,
          { validatedBy, notes },
          { headers: this.getServiceHeaders() }
        ),
      );
      
      this.logger.log(`Invoice ${invoiceId} validated by ${validatedBy}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to validate invoice: ${err.message}`);
      throw error;
    }
  }
}
