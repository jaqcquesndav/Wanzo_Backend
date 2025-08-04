import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { SMEData } from '../../risk-analysis/services/risk-calculation.service';

export interface CustomerData {
  customerId: string;
  customerType: 'SME' | 'FINANCIAL';
  companyName?: string;
  industry?: string;
  employeeCount?: number;
  annualRevenue?: number;
  city?: string;
  foundedYear?: number;
  institutionType?: 'BANK' | 'MICROFINANCE' | 'coopérative d\'épargne et crédit';
  licenseNumber?: string;
}

export interface PortfolioData {
  institutionId: string;
  portfolios: Array<{
    id: string;
    type: 'CREDIT' | 'SAVINGS' | 'MICROFINANCE' | 'TREASURY';
    netValue: number;
    riskProfile: number;
    balanceAge: any;
  }>;
}

export interface TransactionHistoryData {
  customerId: string;
  totalTransactions: number;
  averageAmount: number;
  transactionFrequency: number;
  lastTransactionDate: Date;
  creditScore?: number;
}

@Injectable()
export class MicroserviceIntegrationService {
  private readonly logger = new Logger(MicroserviceIntegrationService.name);

  constructor(
    @Inject('CUSTOMER_SERVICE') private customerServiceClient: ClientProxy,
    @Inject('PORTFOLIO_SERVICE') private portfolioServiceClient: ClientProxy,
    @Inject('GESTION_COMMERCIALE_SERVICE') private commerceServiceClient: ClientProxy,
    @Inject('ACCOUNTING_SERVICE') private accountingServiceClient: ClientProxy,
  ) {}

  /**
   * Récupère les données réelles d'une SME du Customer Service
   */
  async getRealSMEData(customerId: string): Promise<SMEData | null> {
    try {
      // Récupération des données customer
      const customerData = await firstValueFrom(
        this.customerServiceClient.send('get_customer_by_id', { 
          customerId 
        }).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.warn(`Customer service error for ${customerId}: ${error.message}`);
            return of(null);
          })
        )
      );

      if (!customerData || customerData.customerType !== 'SME') {
        this.logger.debug(`Customer ${customerId} is not an SME or not found`);
        return null;
      }

      // Récupération de l'historique transactionnel
      const transactionHistory = await this.getTransactionHistory(customerId);

      // Mapping vers l'interface SMEData pour l'analyse
      return {
        id: customerData.customerId,
        location: customerData.city ? {
          province: this.getCityProvince(customerData.city),
          city: customerData.city
        } : undefined,
        business: {
          sector: this.mapIndustryToSector(customerData.industry),
          yearsInBusiness: customerData.foundedYear ? 
            new Date().getFullYear() - customerData.foundedYear : 1,
          employeeCount: customerData.employeeCount || 1,
          monthlyRevenue: customerData.annualRevenue ? 
            customerData.annualRevenue / 12 : 0
        },
        history: {
          payments: [], // À implémenter avec le service comptable
          creditHistory: transactionHistory?.creditScore ? [{
            amount: 0,
            status: 'active',
            performance: transactionHistory.creditScore > 650 ? 'good' : 
                       transactionHistory.creditScore > 500 ? 'fair' : 'poor'
          }] : []
        }
      };

    } catch (error) {
      this.logger.error(`Error fetching real SME data for ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Récupère les données réelles d'une institution financière
   */
  async getRealInstitutionData(customerId: string): Promise<any | null> {
    try {
      const customerData = await firstValueFrom(
        this.customerServiceClient.send('get_customer_by_id', { 
          customerId 
        }).pipe(
          timeout(5000),
          catchError(() => of(null))
        )
      );

      if (!customerData || customerData.customerType !== 'FINANCIAL') {
        return null;
      }

      // Récupération des portfolios de l'institution
      const portfolioData = await this.getInstitutionPortfolios(customerId);

      return {
        customerId: customerData.customerId,
        institutionName: customerData.companyName,
        institutionType: customerData.institutionType,
        licenseNumber: customerData.licenseNumber,
        portfolios: portfolioData?.portfolios || [],
        location: customerData.city
      };

    } catch (error) {
      this.logger.error(`Error fetching institution data for ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Récupère l'historique transactionnel d'un customer
   */
  private async getTransactionHistory(customerId: string): Promise<TransactionHistoryData | null> {
    try {
      return await firstValueFrom(
        this.commerceServiceClient.send('get_customer_transaction_summary', { 
          customerId 
        }).pipe(
          timeout(5000),
          catchError(() => of(null))
        )
      );
    } catch (error) {
      this.logger.warn(`Failed to get transaction history for ${customerId}`);
      return null;
    }
  }

  /**
   * Récupère les portfolios d'une institution
   */
  private async getInstitutionPortfolios(institutionId: string): Promise<PortfolioData | null> {
    try {
      return await firstValueFrom(
        this.portfolioServiceClient.send('get_institution_portfolios', { 
          institutionId 
        }).pipe(
          timeout(5000),
          catchError(() => of(null))
        )
      );
    } catch (error) {
      this.logger.warn(`Failed to get portfolios for institution ${institutionId}`);
      return null;
    }
  }

  /**
   * Mapping des industries vers les secteurs d'analyse
   */
  private mapIndustryToSector(industry?: string): string {
    if (!industry) return 'COMMERCE';
    
    const sectorMap: Record<string, string> = {
      'agriculture': 'AGRICULTURE',
      'commerce': 'COMMERCE',
      'services': 'SERVICES',
      'manufacturing': 'MANUFACTURING',
      'technology': 'TECHNOLOGY',
      'finance': 'FINANCE',
      'healthcare': 'HEALTHCARE',
      'education': 'EDUCATION',
      'construction': 'CONSTRUCTION',
      'transport': 'TRANSPORT'
    };

    return sectorMap[industry.toLowerCase()] || 'COMMERCE';
  }

  /**
   * Mapping basique des villes vers les provinces RDC
   */
  private getCityProvince(city: string): string {
    const provinceMap: Record<string, string> = {
      'kinshasa': 'Kinshasa',
      'lubumbashi': 'Haut-Katanga',
      'mbuji-mayi': 'Kasaï-Oriental',
      'kisangani': 'Tshopo',
      'kananga': 'Kasaï-Central',
      'kolwezi': 'Lualaba',
      'bukavu': 'Sud-Kivu',
      'goma': 'Nord-Kivu',
      'matadi': 'Kongo-Central',
      'mbandaka': 'Équateur'
    };

    return provinceMap[city.toLowerCase()] || 'Kinshasa';
  }

  /**
   * Récupère les données comptables d'un client depuis le service accounting
   */
  async getAccountingData(entityId: string): Promise<any | null> {
    try {
      const accountingData = await firstValueFrom(
        this.accountingServiceClient.send('get_entity_financial_data', { 
          entityId 
        }).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.warn(`Accounting service error for ${entityId}: ${error.message}`);
            return of(null);
          })
        )
      );

      return accountingData;
    } catch (error) {
      this.logger.error(`Error fetching accounting data for ${entityId}:`, error);
      return null;
    }
  }

  /**
   * Récupère les données de portfolio d'une institution
   */
  async getPortfolioData(institutionId: string): Promise<PortfolioData | null> {
    try {
      const portfolioData = await firstValueFrom(
        this.portfolioServiceClient.send('get_institution_portfolios', { 
          institutionId 
        }).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.warn(`Portfolio service error for ${institutionId}: ${error.message}`);
            return of(null);
          })
        )
      );

      return portfolioData;
    } catch (error) {
      this.logger.error(`Error fetching portfolio data for ${institutionId}:`, error);
      return null;
    }
  }

  /**
   * Vérifie la connectivité avec les microservices
   */
  async checkMicroservicesHealth(): Promise<{
    customerService: boolean;
    portfolioService: boolean;
    commerceService: boolean;
    accountingService: boolean;
  }> {
    const checks = await Promise.allSettled([
      firstValueFrom(
        this.customerServiceClient.send('health_check', {}).pipe(
          timeout(3000),
          catchError(() => of(false))
        )
      ),
      firstValueFrom(
        this.portfolioServiceClient.send('health_check', {}).pipe(
          timeout(3000),
          catchError(() => of(false))
        )
      ),
      firstValueFrom(
        this.commerceServiceClient.send('health_check', {}).pipe(
          timeout(3000),
          catchError(() => of(false))
        )
      ),
      firstValueFrom(
        this.accountingServiceClient.send('health_check', {}).pipe(
          timeout(3000),
          catchError(() => of(false))
        )
      )
    ]);

    return {
      customerService: checks[0].status === 'fulfilled' && checks[0].value !== false,
      portfolioService: checks[1].status === 'fulfilled' && checks[1].value !== false,
      commerceService: checks[2].status === 'fulfilled' && checks[2].value !== false,
      accountingService: checks[3].status === 'fulfilled' && checks[3].value !== false
    };
  }
}
