import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { 
  StandardCreditScore, 
  DetailedCreditScore, 
  CreditScoreHistory 
} from '@wanzobe/shared';

export interface CreditScoreApiRequest {
  companyId: string;
  startDate?: Date;
  endDate?: Date;
  forceRecalculation?: boolean;
  calculatedBy?: string;
}

/**
 * Service pour communiquer avec l'API XGBoost du service accounting
 * Utilisé par Gestion Commerciale pour obtenir les cotes crédit
 */
@Injectable()
export class CreditScoreApiService {
  private readonly logger = new Logger(CreditScoreApiService.name);
  private readonly accountingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accountingServiceUrl = this.configService.get<string>(
      'ACCOUNTING_SERVICE_URL', 
      'http://localhost:3002'
    );
  }

  /**
   * Obtient la cote crédit XGBoost pour une entreprise
   */
  async getCreditScore(request: CreditScoreApiRequest): Promise<DetailedCreditScore> {
    try {
      this.logger.debug(`Requesting credit score for company ${request.companyId}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.accountingServiceUrl}/credit-score/get`, {
          companyId: request.companyId,
          startDate: request.startDate,
          endDate: request.endDate,
          forceRecalculation: request.forceRecalculation || false,
          trigger: 'api_request',
          calculatedBy: request.calculatedBy
        }, {
          timeout: 30000, // 30 secondes pour le calcul XGBoost
          headers: {
            'Content-Type': 'application/json',
            'X-Service': 'gestion-commerciale'
          }
        })
      );

      if (!response.data.success) {
        throw new HttpException(
          response.data.message || 'Failed to get credit score',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Credit score received for company ${request.companyId}: ${response.data.score.score}`);
      
      return response.data.score;

    } catch (error) {
      this.logger.error(`Error getting credit score for company ${request.companyId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Credit score service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Obtient l'historique des cotes crédit pour une entreprise
   */
  async getCreditScoreHistory(
    companyId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<CreditScoreHistory[]> {
    try {
      this.logger.debug(`Requesting credit score history for company ${companyId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/credit-score/history`, {
          params: { companyId, limit, offset },
          headers: {
            'X-Service': 'gestion-commerciale'
          }
        })
      );

      if (!response.data.success) {
        throw new HttpException(
          response.data.message || 'Failed to get credit score history',
          HttpStatus.BAD_REQUEST
        );
      }

      return response.data.history;

    } catch (error) {
      this.logger.error(`Error getting credit score history for company ${companyId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Credit score service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Obtient les statistiques des cotes crédit pour une entreprise
   */
  async getCreditScoreStats(companyId: string): Promise<{
    totalCalculations: number;
    averageScore: number;
    scoresTrend: 'improving' | 'declining' | 'stable';
    lastCalculation: Date;
    validUntil: Date;
  }> {
    try {
      this.logger.debug(`Requesting credit score stats for company ${companyId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/credit-score/stats`, {
          params: { companyId },
          headers: {
            'X-Service': 'gestion-commerciale'
          }
        })
      );

      if (!response.data.success) {
        throw new HttpException(
          response.data.message || 'Failed to get credit score stats',
          HttpStatus.BAD_REQUEST
        );
      }

      return response.data.stats;

    } catch (error) {
      this.logger.error(`Error getting credit score stats for company ${companyId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Credit score service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Force le recalcul de la cote crédit pour une entreprise
   */
  async recalculateCreditScore(
    companyId: string,
    calculatedBy?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DetailedCreditScore> {
    return this.getCreditScore({
      companyId,
      forceRecalculation: true,
      calculatedBy,
      startDate,
      endDate
    });
  }

  /**
   * Vérifie si une cote crédit est valide (non expirée)
   */
  isScoreValid(score: StandardCreditScore | DetailedCreditScore): boolean {
    return new Date() < new Date(score.validUntil);
  }

  /**
   * Calcule les jours restants avant expiration
   */
  getDaysUntilExpiration(score: StandardCreditScore | DetailedCreditScore): number {
    const now = new Date();
    const expiry = new Date(score.validUntil);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Vérifie si une cote crédit expire bientôt (moins de 7 jours)
   */
  isScoreExpiringSoon(score: StandardCreditScore | DetailedCreditScore): boolean {
    return this.getDaysUntilExpiration(score) <= 7;
  }
}