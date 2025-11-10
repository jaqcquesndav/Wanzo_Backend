import { 
  Controller, 
  Get, 
  Query, 
  UseGuards,
  Logger,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SubscriptionPaymentEventListener } from '../services/subscription-payment-event-listener.service';

/**
 * Contrôleur pour les analytics de paiement d'abonnement
 * Fournit les données pour le dashboard admin
 */
@ApiTags('Subscription Payment Analytics')
@Controller('admin/subscription-payments')
export class SubscriptionPaymentAnalyticsController {
  private readonly logger = new Logger(SubscriptionPaymentAnalyticsController.name);

  constructor(
    private readonly paymentEventListener: SubscriptionPaymentEventListener,
  ) {}

  /**
   * Récupère les statistiques globales de paiement d'abonnement
   * Dashboard principal pour les admins
   */
  @Get('statistics')
  @ApiOperation({ 
    summary: 'Statistiques globales des paiements d\'abonnement',
    description: 'Métriques temps réel pour le dashboard admin incluant revenus, volumes, répartition par méthode de paiement et type de client'
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalTransactions: { type: 'number' },
            totalRevenue: { type: 'number' },
            mobileMoneyTransactions: { type: 'number' },
            cardTransactions: { type: 'number' },
            failedTransactions: { type: 'number' },
            byCustomerType: {
              type: 'object',
              properties: {
                sme: { 
                  type: 'object',
                  properties: {
                    count: { type: 'number' },
                    revenue: { type: 'number' }
                  }
                },
                financial: {
                  type: 'object', 
                  properties: {
                    count: { type: 'number' },
                    revenue: { type: 'number' }
                  }
                }
              }
            },
            byCurrency: {
              type: 'object',
              properties: {
                USD: { 
                  type: 'object',
                  properties: {
                    count: { type: 'number' },
                    revenue: { type: 'number' }
                  }
                }
              }
            },
            lastUpdated: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async getPaymentStatistics() {
    try {
      this.logger.log('Récupération des statistiques de paiement d\'abonnement');
      
      const statistics = this.paymentEventListener.getPaymentStatistics();
      
      return {
        success: true,
        data: statistics,
        message: 'Statistiques récupérées avec succès'
      };

    } catch (error) {
      this.logger.error('Erreur lors de la récupération des statistiques:', error);
      
      return {
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
        data: null
      };
    }
  }

  /**
   * Récupère les transactions récentes d'abonnement
   * Pour monitoring temps réel des paiements
   */
  @Get('recent-transactions')
  @ApiOperation({ 
    summary: 'Transactions d\'abonnement récentes',
    description: 'Liste des dernières transactions pour monitoring temps réel avec détails client et paiement'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Nombre maximum de transactions à retourner (défaut: 50, max: 100)' 
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions récentes récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              transactionId: { type: 'string' },
              customerId: { type: 'string' },
              customerName: { type: 'string' },
              amount: { type: 'number' },
              currency: { type: 'string' },
              paymentMethod: { type: 'string', enum: ['mobile_money', 'card'] },
              provider: { type: 'string' },
              completedAt: { type: 'string', format: 'date-time' },
              planId: { type: 'string' },
              paymentDetails: { type: 'object' }
            }
          }
        },
        total: { type: 'number' }
      }
    }
  })
  async getRecentTransactions(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number
  ) {
    try {
      // Limite de sécurité
      const safeLimit = Math.min(Math.max(1, limit), 100);
      
      this.logger.log(`Récupération des ${safeLimit} dernières transactions d'abonnement`);
      
      const transactions = this.paymentEventListener.getRecentTransactions(safeLimit);
      
      return {
        success: true,
        data: transactions,
        total: transactions.length,
        message: `${transactions.length} transactions récupérées avec succès`
      };

    } catch (error) {
      this.logger.error('Erreur lors de la récupération des transactions récentes:', error);
      
      return {
        success: false,
        error: 'Erreur lors de la récupération des transactions',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Récupère les métriques de performance par méthode de paiement
   * Analyse de conversion et taux d'échec
   */
  @Get('payment-method-metrics')
  @ApiOperation({ 
    summary: 'Métriques par méthode de paiement',
    description: 'Analyse de performance, conversion et taux d\'échec par méthode de paiement (mobile money vs cartes)'
  })
  @ApiResponse({
    status: 200,
    description: 'Métriques récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            mobile_money: {
              type: 'object',
              properties: {
                count: { type: 'number' },
                revenue: { type: 'number' },
                percentage: { type: 'number' }
              }
            },
            card: {
              type: 'object',
              properties: {
                count: { type: 'number' },
                revenue: { type: 'number' },
                percentage: { type: 'number' }
              }
            },
            failureRate: { type: 'number' }
          }
        }
      }
    }
  })
  async getPaymentMethodMetrics() {
    try {
      this.logger.log('Récupération des métriques par méthode de paiement');
      
      const metrics = this.paymentEventListener.getPaymentMethodMetrics();
      
      return {
        success: true,
        data: metrics,
        message: 'Métriques récupérées avec succès'
      };

    } catch (error) {
      this.logger.error('Erreur lors de la récupération des métriques:', error);
      
      return {
        success: false,
        error: 'Erreur lors de la récupération des métriques',
        data: null
      };
    }
  }

  /**
   * Point de santé pour vérifier l'état du système de tracking
   * Utilisé par le monitoring système
   */
  @Get('health')
  @ApiOperation({ 
    summary: 'État de santé du système de tracking',
    description: 'Vérification de l\'état du système d\'écoute des événements de paiement'
  })
  @ApiResponse({
    status: 200,
    description: 'État de santé récupéré avec succès'
  })
  async getHealthStatus() {
    try {
      const statistics = this.paymentEventListener.getPaymentStatistics();
      
      return {
        success: true,
        status: 'healthy',
        data: {
          lastUpdated: statistics.lastUpdated,
          totalTransactions: statistics.totalTransactions,
          isActive: true
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Erreur lors de la vérification de l\'état de santé:', error);
      
      return {
        success: false,
        status: 'unhealthy',
        error: 'Erreur du système de tracking',
        timestamp: new Date().toISOString()
      };
    }
  }
}