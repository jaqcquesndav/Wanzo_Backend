import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export interface SubscriptionValidationResult {
  hasAccess: boolean;
  subscription?: {
    id: string;
    planName: string;
    status: string;
    expiresAt: Date;
    features: string[];
  };
  limits?: {
    maxTransactions: number;
    maxCustomers: number;
    maxUsers: number;
    maxProducts: number;
    maxFiles: number;
    [key: string]: number;
  };
  error?: string;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly customerServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.customerServiceUrl = this.configService.get<string>('CUSTOMER_SERVICE_URL') || 'http://localhost:3002';
  }

  /**
   * Valide si un client de la plateforme a accès au service de gestion commerciale
   * @param platformClientId ID du client dans le système customer-service
   */
  async validateCommercialAccess(platformClientId: string): Promise<SubscriptionValidationResult> {
    try {
      this.logger.log(`Vérification de l'accès pour le client ${platformClientId}`);
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.customerServiceUrl}/api/subscriptions/validate/${platformClientId}?service=commercial-management`
        ).pipe(
          timeout(5000),
          catchError(error => {
            this.logger.error(`Erreur lors de la validation d'abonnement: ${error.message}`);
            // En cas d'erreur de service, on peut donner un accès temporaire
            // pour éviter de bloquer les utilisateurs en cas de panne du service d'abonnement
            throw new HttpException(
              'Service de validation d\'abonnement temporairement indisponible',
              HttpStatus.SERVICE_UNAVAILABLE
            );
          })
        )
      );

      return response.data;
    } catch (error) {
      // En développement ou en environnement de test, on peut permettre l'accès
      if (this.configService.get<string>('NODE_ENV') !== 'production') {
        this.logger.warn(`Mode non-production: Accès accordé par défaut pour le client ${platformClientId}`);
        return {
          hasAccess: true,
          subscription: {
            id: 'dev-subscription',
            planName: 'Development Plan',
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            features: ['all'],
          },
          limits: {
            maxTransactions: 1000,
            maxCustomers: 1000,
            maxUsers: 10,
            maxProducts: 1000,
            maxFiles: 100,
          },
        };
      }
      
      throw error;
    }
  }

  /**
   * Vérifie si une fonctionnalité spécifique est disponible pour ce client
   * @param platformClientId ID du client dans le système customer-service
   * @param featureKey Clé de la fonctionnalité à vérifier
   */
  async hasFeature(platformClientId: string, featureKey: string): Promise<boolean> {
    try {
      const validation = await this.validateCommercialAccess(platformClientId);
      
      if (!validation.hasAccess || !validation.subscription) {
        return false;
      }
      
      return validation.subscription.features.includes(featureKey) || 
             validation.subscription.features.includes('all');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur lors de la vérification de la fonctionnalité ${featureKey}: ${errorMessage}`);
      return false;
    }
  }
}
