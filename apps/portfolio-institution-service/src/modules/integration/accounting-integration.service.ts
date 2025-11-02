import { Injectable, Logger, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

export interface SMEDataSharingSettings {
  banks: boolean;
  microfinance: boolean;
  coopec: boolean;
  analysts: boolean;
  partners: boolean;
  consentGiven: boolean;
  consentDate: string | null;
  lastModified: string;
  modifiedBy: string | null;
}

export interface SMEFinancialData {
  companyId: string;
  companyName: string;
  totalRevenue: number;
  annual_revenue: number; // Ajout de la propriété manquante
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  cashFlow: number;
  debt_ratio: number;
  working_capital: number;
  credit_score: number;
  financial_rating: string;
  revenue_growth: number;
  profit_margin: number;
  ebitda?: number;
  lastUpdated: string;
}

export interface SMEProspectData {
  id: string;
  name: string;
  sector: string;
  size: 'small' | 'medium' | 'large';
  annual_revenue: number;
  employee_count: number;
  website_url?: string;
  financial_metrics: {
    revenue_growth: number;
    profit_margin: number;
    cash_flow: number;
    debt_ratio: number;
    working_capital: number;
    credit_score: number;
    financial_rating: string;
    ebitda?: number;
  };
  esg_metrics: {
    carbon_footprint: number;
    environmental_rating: string;
    social_rating: string;
    governance_rating: string;
  };
  dataSharing: SMEDataSharingSettings;
  lastContact?: Date;
}

/**
 * Service d'intégration avec le service accounting pour récupérer les données des PME
 * qui ont autorisé le partage de données pour la prospection
 */
@Injectable()
export class AccountingIntegrationService {
  private readonly logger = new Logger(AccountingIntegrationService.name);
  private readonly accountingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accountingServiceUrl = this.configService.get<string>('ACCOUNTING_SERVICE_URL') || 'http://localhost:3002';
  }

  /**
   * Vérifie si une PME a autorisé le partage de données
   */
  async checkDataSharingAuthorization(companyId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<SMEDataSharingSettings> = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/settings/data-sharing`, {
          params: { companyId }
        })
      );

      const settings = response.data;
      return settings.consentGiven && (settings.partners || settings.analysts);
    } catch (error: any) {
      this.logger.error(`Error checking data sharing authorization for ${companyId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Récupère la liste des PME qui ont autorisé le partage de données
   */
  async getAuthorizedSMEsList(): Promise<string[]> {
    try {
      const response: AxiosResponse<{ authorizedCompanies: string[] }> = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/settings/data-sharing/authorized-companies`)
      );

      return response.data.authorizedCompanies || [];
    } catch (error: any) {
      this.logger.error(`Error fetching authorized SMEs list: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les données financières d'une PME spécifique
   */
  async getSMEFinancialData(companyId: string): Promise<SMEFinancialData> {
    // Vérifier l'autorisation de partage
    const isAuthorized = await this.checkDataSharingAuthorization(companyId);
    if (!isAuthorized) {
      throw new ForbiddenException(`SME ${companyId} has not authorized data sharing`);
    }

    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/dashboard`, {
          params: { companyId }
        })
      );

      const dashboardData = response.data;

      // Transformer les données du dashboard en format prospection
      return {
        companyId,
        companyName: dashboardData.companyInfo?.name || 'Unknown',
        totalRevenue: dashboardData.financialSummary?.totalRevenue || 0,
        annual_revenue: dashboardData.financialSummary?.totalRevenue || 0, // Même valeur que totalRevenue
        netProfit: dashboardData.financialSummary?.netProfit || 0,
        totalAssets: dashboardData.financialSummary?.totalAssets || 0,
        totalLiabilities: dashboardData.financialSummary?.totalLiabilities || 0,
        cashFlow: dashboardData.financialSummary?.cashFlow || 0,
        debt_ratio: this.calculateDebtRatio(dashboardData.financialSummary),
        working_capital: this.calculateWorkingCapital(dashboardData.financialSummary),
        credit_score: dashboardData.creditScore || 0,
        financial_rating: dashboardData.financialRating || 'N/A',
        revenue_growth: this.calculateRevenueGrowth(dashboardData.financialSummary),
        profit_margin: this.calculateProfitMargin(dashboardData.financialSummary),
        ebitda: dashboardData.financialSummary?.ebitda,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      this.logger.error(`Error fetching SME financial data for ${companyId}: ${error.message}`);
      throw new HttpException(
        `Failed to fetch financial data for company ${companyId}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Récupère les données de prospection pour toutes les PME autorisées
   */
  async getAuthorizedSMEsForProspection(): Promise<SMEProspectData[]> {
    try {
      const authorizedCompanies = await this.getAuthorizedSMEsList();
      
      if (authorizedCompanies.length === 0) {
        this.logger.log('No authorized companies found for prospection');
        return [];
      }

      const prospectData: SMEProspectData[] = [];

      // Récupérer les données pour chaque PME autorisée
      for (const companyId of authorizedCompanies) {
        try {
          const financialData = await this.getSMEFinancialData(companyId);
          const dataSharingSettings = await this.getDataSharingSettings(companyId);

          const prospectInfo: SMEProspectData = {
            id: companyId,
            name: financialData.companyName,
            sector: await this.getSMESector(companyId),
            size: this.classifyCompanySize(financialData.annual_revenue, financialData.totalAssets),
            annual_revenue: financialData.totalRevenue,
            employee_count: await this.getSMEEmployeeCount(companyId),
            website_url: await this.getSMEWebsite(companyId),
            financial_metrics: {
              revenue_growth: financialData.revenue_growth,
              profit_margin: financialData.profit_margin,
              cash_flow: financialData.cashFlow,
              debt_ratio: financialData.debt_ratio,
              working_capital: financialData.working_capital,
              credit_score: financialData.credit_score,
              financial_rating: financialData.financial_rating,
              ebitda: financialData.ebitda
            },
            esg_metrics: await this.getESGMetrics(companyId),
            dataSharing: dataSharingSettings
          };

          prospectData.push(prospectInfo);
        } catch (error: any) {
          this.logger.warn(`Failed to get data for company ${companyId}: ${error.message}`);
          // Continuer avec les autres PME même si une échoue
        }
      }

      return prospectData;
    } catch (error: any) {
      this.logger.error(`Error fetching authorized SMEs for prospection: ${error.message}`);
      throw new HttpException(
        'Failed to fetch authorized SMEs data',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Synchronise les données d'une PME vers la base de données locale pour prospection
   */
  async syncSMEDataForProspection(companyId: string): Promise<SMEProspectData> {
    const isAuthorized = await this.checkDataSharingAuthorization(companyId);
    if (!isAuthorized) {
      throw new ForbiddenException(`SME ${companyId} has not authorized data sharing`);
    }

    try {
      const financialData = await this.getSMEFinancialData(companyId);
      const dataSharingSettings = await this.getDataSharingSettings(companyId);

      return {
        id: companyId,
        name: financialData.companyName,
        sector: await this.getSMESector(companyId),
        size: this.classifyCompanySize(financialData.annual_revenue, financialData.totalAssets),
        annual_revenue: financialData.totalRevenue,
        employee_count: await this.getSMEEmployeeCount(companyId),
        website_url: await this.getSMEWebsite(companyId),
        financial_metrics: {
          revenue_growth: financialData.revenue_growth,
          profit_margin: financialData.profit_margin,
          cash_flow: financialData.cashFlow,
          debt_ratio: financialData.debt_ratio,
          working_capital: financialData.working_capital,
          credit_score: financialData.credit_score,
          financial_rating: financialData.financial_rating,
          ebitda: financialData.ebitda
        },
        esg_metrics: await this.getESGMetrics(companyId),
        dataSharing: dataSharingSettings
      };
    } catch (error: any) {
      this.logger.error(`Error syncing SME data for ${companyId}: ${error.message}`);
      throw error;
    }
  }

  // Méthodes utilitaires privées

  private async getDataSharingSettings(companyId: string): Promise<SMEDataSharingSettings> {
    try {
      const response: AxiosResponse<SMEDataSharingSettings> = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/settings/data-sharing`, {
          params: { companyId }
        })
      );
      return response.data;
    } catch (error: any) {
      this.logger.warn(`Failed to get data sharing settings for ${companyId}: ${error.message}`);
      // Retourner des paramètres par défaut
      return {
        banks: false,
        microfinance: false,
        coopec: false,
        analysts: false,
        partners: false,
        consentGiven: false,
        consentDate: null,
        lastModified: new Date().toISOString(),
        modifiedBy: null
      };
    }
  }

  private async getSMESector(companyId: string): Promise<string> {
    // Récupérer le secteur depuis les données comptables ou profil entreprise
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/users/profile`, {
          params: { companyId }
        })
      );
      return response.data.sector || 'Other';
    } catch (error: any) {
      return 'Other';
    }
  }

  private async getSMEEmployeeCount(companyId: string): Promise<number> {
    // Récupérer le nombre d'employés depuis le profil entreprise
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/users/profile`, {
          params: { companyId }
        })
      );
      return response.data.employeeCount || 0;
    } catch (error: any) {
      return 0;
    }
  }

  private async getSMEWebsite(companyId: string): Promise<string | undefined> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/users/profile`, {
          params: { companyId }
        })
      );
      return response.data.website;
    } catch (error: any) {
      return undefined;
    }
  }

  private async getESGMetrics(companyId: string): Promise<any> {
    // Pour l'instant, retourner des métriques ESG par défaut
    // À terme, ces données pourraient venir d'un service dédié ESG
    return {
      carbon_footprint: 0,
      environmental_rating: 'N/A',
      social_rating: 'N/A',
      governance_rating: 'N/A',
      gender_ratio: {
        male: 50,
        female: 50
      }
    };
  }

  private classifyCompanySize(revenue: number, assets: number): 'small' | 'medium' | 'large' {
    // Classification basée sur le chiffre d'affaires (en CDF - Franc Congolais)
    // Petite entreprise: < 500M CDF (~200k USD)
    // Moyenne entreprise: 500M - 2B CDF (~200k - 800k USD)  
    // Grande entreprise: > 2B CDF (~800k USD)
    
    if (revenue < 500000000) {
      return 'small';
    } else if (revenue < 2000000000) {
      return 'medium';
    } else {
      return 'large';
    }
  }

  private calculateDebtRatio(financialSummary: any): number {
    if (!financialSummary || !financialSummary.totalAssets || financialSummary.totalAssets === 0) {
      return 0;
    }
    return (financialSummary.totalLiabilities || 0) / financialSummary.totalAssets;
  }

  private calculateWorkingCapital(financialSummary: any): number {
    if (!financialSummary) {
      return 0;
    }
    const currentAssets = financialSummary.currentAssets || 0;
    const currentLiabilities = financialSummary.currentLiabilities || 0;
    return currentAssets - currentLiabilities;
  }

  private calculateRevenueGrowth(financialSummary: any): number {
    // Calculer la croissance du chiffre d'affaires YoY
    if (!financialSummary || !financialSummary.previousYearRevenue || financialSummary.previousYearRevenue === 0) {
      return 0;
    }
    const currentRevenue = financialSummary.totalRevenue || 0;
    const previousRevenue = financialSummary.previousYearRevenue;
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  }

  private calculateProfitMargin(financialSummary: any): number {
    if (!financialSummary || !financialSummary.totalRevenue || financialSummary.totalRevenue === 0) {
      return 0;
    }
    const netProfit = financialSummary.netProfit || 0;
    return (netProfit / financialSummary.totalRevenue) * 100;
  }
}