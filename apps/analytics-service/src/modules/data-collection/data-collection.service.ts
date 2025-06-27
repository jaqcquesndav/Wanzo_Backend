import { Injectable, Logger, OnModuleInit, ServiceUnavailableException, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsConfig } from '../../entities';

/**
 * Service responsible for collecting data from other microservices
 * to support analytics operations.
 */
@Injectable()
export class DataCollectionService implements OnModuleInit {
  private readonly logger = new Logger(DataCollectionService.name);
  private dbConnected = false;
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(AnalyticsConfig)
    private readonly analyticsConfigRepository: Repository<AnalyticsConfig>,
  ) {}

  /**
   * Check database connection when service initializes
   */
  async onModuleInit() {
    try {
      await this.checkDatabaseConnection();
      this.dbConnected = true;
      this.logger.log('Successfully connected to database');
    } catch (error: any) {
      this.dbConnected = false;
      this.logger.error(`Failed to connect to database: ${error.message || String(error)}`);
      // We don't throw here to allow the service to start, but operations will be limited
    }
  }

  /**
   * Verifies database connection is active
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Try to execute a simple query to check connection
      await this.analyticsConfigRepository.find({ take: 1 });
      return true;
    } catch (error: any) {
      this.logger.error(`Database connection check failed: ${error.message || String(error)}`);
      return false;
    }
  }

  /**
   * Ensures database is connected before proceeding with operations
   * @throws ServiceUnavailableException if database is not connected
   */
  private async ensureDatabaseConnected() {
    if (!this.dbConnected) {
      // Try to reconnect
      const connected = await this.checkDatabaseConnection();
      if (!connected) {
        throw new ServiceUnavailableException('Analytics service database connection unavailable');
      }
      this.dbConnected = true;
    }
  }

  /**
   * Checks if an SME has enabled data sharing
   * @param smeId The ID of the SME to check
   * @returns True if data sharing is enabled, false otherwise
   * @throws ForbiddenException if data sharing is not enabled
   */
  async checkSMEDataSharingEnabled(smeId: string): Promise<boolean> {
    await this.ensureDatabaseConnected();
    
    try {
      const config = await this.analyticsConfigRepository.findOne({ 
        where: { entityId: smeId, entityType: 'SME' } 
      });
      
      const isEnabled = config?.dataSharingEnabled ?? false;
      
      if (!isEnabled) {
        throw new ForbiddenException('SME has not enabled data sharing');
      }
      
      return isEnabled;
    } catch (error: any) {
      this.logger.error(`Failed to check SME data sharing settings: ${error.message || String(error)}`);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Collects portfolio data from the portfolio-institution-service
   */
  async getInstitutionPortfolioData(institutionId: string, period?: string) {
    try {
      const serviceUrl = this.configService.get('PORTFOLIO_INSTITUTION_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.get(`${serviceUrl}/api/portfolios/${institutionId}`, {
          params: period ? { period } : {}
        })
      );      
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch institution portfolio data: ${error.message || String(error)}`);
      throw error;
    }
  }

  /**
   * Collects SME data from the portfolio-sme-service
   */
  async getSMEPortfolioData(smeId: string, period?: string) {
    await this.ensureDatabaseConnected();
    
    // Check if SME has enabled data sharing
    const dataSharingEnabled = await this.checkSMEDataSharingEnabled(smeId);
    if (!dataSharingEnabled) {
      this.logger.warn(`Data sharing not enabled for SME ${smeId}`);
      throw new ForbiddenException('SME has not enabled data sharing');
    }
    
    try {
      const serviceUrl = this.configService.get('PORTFOLIO_SME_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.get(`${serviceUrl}/api/portfolios/${smeId}`, {
          params: period ? { period } : {}
        })
      );
      
      // Check if we got empty data
      if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        this.logger.warn(`No data available for SME ${smeId}`);
        return { message: 'No data available', isEmpty: true };
      }
      
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch SME portfolio data: ${error.message || String(error)}`);
      throw error;
    }
  }

  /**
   * Collects accounting data from the accounting-service
   */
  async getAccountingData(companyId: string, fiscalYear?: string) {
    await this.ensureDatabaseConnected();
    
    try {
      const serviceUrl = this.configService.get('ACCOUNTING_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.get(`${serviceUrl}/api/dashboard`, {
          params: {
            companyId,
            ...(fiscalYear && { fiscalYearId: fiscalYear })
          }
        })
      );
      
      // Check if we got empty data
      if (!response.data || Object.keys(response.data).length === 0) {
        this.logger.warn(`No accounting data available for company ${companyId}`);
        return { message: 'No accounting data available', isEmpty: true };
      }
      
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch accounting data: ${error.message || String(error)}`);
      throw error;
    }
  }

  /**
   * Aggregates data from multiple services for comprehensive analysis
   */
  async getAggregatedData(institutionId: string, period?: string) {
    await this.ensureDatabaseConnected();
    
    try {
      const [portfolioData, accountingData] = await Promise.all([
        this.getInstitutionPortfolioData(institutionId, period),
        this.getAccountingData(institutionId)
      ]);

      // Check if we have any data to analyze
      const hasPortfolioData = !portfolioData.isEmpty;
      const hasAccountingData = !accountingData.isEmpty;
      
      if (!hasPortfolioData && !hasAccountingData) {
        return {
          message: 'Insufficient data available for analysis',
          hasData: false,
          timestamp: new Date().toISOString()
        };
      }

      return {
        portfolioData,
        accountingData,
        timestamp: new Date().toISOString(),
        source: 'aggregated',
        hasData: true
      };
    } catch (error: any) {
      this.logger.error(`Failed to aggregate data: ${error.message || String(error)}`);
      throw error;
    }
  }
}
