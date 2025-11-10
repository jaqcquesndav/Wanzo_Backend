import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  UnauthorizedException, 
  BadRequestException,
  Headers,
  RawBodyRequest,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StripePaymentService, CardPaymentRequest, CardPaymentResult, RecurringSetupRequest } from '../services/stripe-payment.service';
import { SubscriptionService } from '../services/subscription.service';
import { UserService } from '../../system-users/services/user.service';

class CreatePaymentIntentDto {
  planId!: string;
  saveCard?: boolean;
  returnUrl?: string;
}

class ConfirmPaymentDto {
  paymentIntentId!: string;
  paymentMethodId!: string;
}

class SetupRecurringPaymentDto {
  planId!: string;
  paymentMethodId!: string;
  trialDays?: number;
}

class CancelSubscriptionDto {
  subscriptionId!: string;
  reason?: string;
}

/**
 * Contrôleur pour les paiements Stripe (cartes bancaires) d'abonnements
 * Intégré avec Stripe Elements pour une sécurité maximale
 */
@ApiTags('stripe-subscription-payments')
@ApiBearerAuth()
@Controller('subscriptions/stripe')
export class StripeSubscriptionPaymentController {
  private readonly logger = new Logger(StripeSubscriptionPaymentController.name);

  constructor(
    private readonly stripePaymentService: StripePaymentService,
    private readonly subscriptionService: SubscriptionService,
    private readonly userService: UserService,
  ) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Créer un PaymentIntent Stripe pour un paiement unique d\'abonnement',
    description: 'Créer un PaymentIntent Stripe pour payer un plan d\'abonnement avec une carte bancaire. Compatible avec Stripe Elements.'
  })
  @ApiBody({
    type: CreatePaymentIntentDto,
    examples: {
      basicPayment: {
        summary: 'Paiement basique',
        description: 'Paiement unique sans sauvegarde de carte',
        value: {
          planId: 'plan-uuid-123',
          saveCard: false,
          returnUrl: 'https://app.wanzo.ai/payment/return'
        }
      },
      saveCardPayment: {
        summary: 'Paiement avec sauvegarde',
        description: 'Paiement avec sauvegarde de carte pour futurs paiements',
        value: {
          planId: 'plan-uuid-456',
          saveCard: true,
          returnUrl: 'https://app.wanzo.ai/payment/return'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'PaymentIntent créé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            paymentIntentId: { 
              type: 'string', 
              description: 'ID du PaymentIntent Stripe',
              example: 'pi_1ABC123def456GHI'
            },
            clientSecret: { 
              type: 'string', 
              description: 'Client secret pour Stripe Elements',
              example: 'pi_1ABC123def456GHI_secret_xyz'
            },
            status: { 
              type: 'string', 
              description: 'Statut du PaymentIntent',
              example: 'requires_payment_method'
            },
            amount: { 
              type: 'number', 
              description: 'Montant en centimes USD',
              example: 5000
            },
            currency: { 
              type: 'string', 
              example: 'usd'
            },
            plan: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'plan-uuid-123' },
                name: { type: 'string', example: 'Standard Monthly Plan' },
                priceUSD: { type: 'number', example: 50.00 },
                tokensIncluded: { type: 'number', example: 1000 }
              }
            }
          }
        },
        message: { type: 'string', example: 'PaymentIntent créé avec succès' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur de validation ou plan indisponible'
  })
  @ApiResponse({
    status: 401,
    description: 'Utilisateur non authentifié'
  })
  async createPaymentIntent(
    @Body() createDto: CreatePaymentIntentDto,
    @Req() req: any
  ) {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    try {
      // Récupérer les détails de l'utilisateur via Auth0 ID
      const user = await this.userService.findByAuth0Id(auth0Id);
      if (!user || !user.companyId) {
        throw new BadRequestException('Utilisateur ou entreprise non trouvé');
      }
      // Pour l'instant utilisons l'ID de l'entreprise comme customer
      const customer = { id: user.companyId, type: user.userType };

      // Pour l'instant, créons un plan par défaut (TODO: implémenter une vraie recherche de plan)
      const plan = {
        id: createDto.planId,
        name: 'Plan Standard',
        priceUSD: 29.99,
        includedTokens: 10000,
        description: 'Plan d\'abonnement standard',
        customerType: 'all',
        isActive: true
      };

      // Vérifier que le plan est disponible pour ce type de client
      if (!this.isPlanAvailableForCustomer(plan, customer)) {
        throw new BadRequestException('Ce plan n\'est pas disponible pour votre type de compte');
      }

      // Créer le PaymentIntent via Stripe
      const paymentRequest: CardPaymentRequest = {
        customerId: customer.id,
        planId: createDto.planId,
        amount: plan.priceUSD, // Prix en USD pour Stripe
        currency: 'USD',
        saveCard: createDto.saveCard,
        returnUrl: createDto.returnUrl
      };

      const paymentResult: CardPaymentResult = await this.stripePaymentService.processCardPayment(paymentRequest);

      this.logger.log(`PaymentIntent créé pour le client ${customer.id}, plan ${plan.name}`, {
        paymentIntentId: paymentResult.paymentIntentId,
        amount: plan.priceUSD
      });

      return {
        success: true,
        data: {
          paymentIntentId: paymentResult.paymentIntentId,
          clientSecret: paymentResult.clientSecret,
          status: paymentResult.status,
          amount: Math.round(plan.priceUSD * 100), // Centimes pour le frontend
          currency: 'usd',
          requiresAction: paymentResult.requiresAction,
          nextAction: paymentResult.nextAction,
          plan: {
            id: plan.id,
            name: plan.name,
            priceUSD: plan.priceUSD,
            tokensIncluded: plan.includedTokens,
            description: plan.description
          }
        },
        message: paymentResult.message
      };

    } catch (error: any) {
      this.logger.error(`Erreur création PaymentIntent:`, error);
      throw new BadRequestException(error.message || 'Erreur lors de la création du paiement');
    }
  }

  @Post('setup-recurring')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Configurer un abonnement récurrent avec Stripe',
    description: 'Configure un abonnement récurrent pour un plan avec une méthode de paiement par carte. Utilise Stripe Subscriptions.'
  })
  @ApiBody({
    type: SetupRecurringPaymentDto,
    examples: {
      monthlySubscription: {
        summary: 'Abonnement mensuel',
        description: 'Configuration d\'un abonnement mensuel',
        value: {
          planId: 'plan-uuid-123',
          paymentMethodId: 'pm_1ABC123def456GHI',
          trialDays: 0
        }
      },
      trialSubscription: {
        summary: 'Abonnement avec essai',
        description: 'Configuration avec période d\'essai',
        value: {
          planId: 'plan-uuid-456',
          paymentMethodId: 'pm_1ABC123def456GHI',
          trialDays: 7
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement récurrent configuré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            subscriptionId: { 
              type: 'string', 
              description: 'ID de l\'abonnement interne',
              example: 'sub-uuid-789'
            },
            stripeSubscriptionId: { 
              type: 'string', 
              description: 'ID de l\'abonnement Stripe',
              example: 'sub_1ABC123def456GHI'
            },
            status: { 
              type: 'string', 
              description: 'Statut de l\'abonnement',
              example: 'active'
            },
            nextPaymentDate: { 
              type: 'string', 
              format: 'date-time',
              description: 'Date du prochain paiement',
              example: '2024-12-10T10:00:00Z'
            },
            plan: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                priceUSD: { type: 'number' }
              }
            }
          }
        },
        message: { type: 'string', example: 'Abonnement récurrent configuré avec succès' }
      }
    }
  })
  async setupRecurringPayment(
    @Body() setupDto: SetupRecurringPaymentDto,
    @Req() req: any
  ) {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    try {
      // Récupérer les détails de l'utilisateur via Auth0 ID
      const user = await this.userService.findByAuth0Id(auth0Id);
      if (!user || !user.companyId) {
        throw new BadRequestException('Utilisateur ou entreprise non trouvé');
      }
      // Pour l'instant utilisons l'ID de l'entreprise comme customer
      const customer = { id: user.companyId, type: user.userType };

      // Plan par défaut (TODO: implémenter une vraie recherche de plan)
      const plan = {
        id: setupDto.planId,
        name: 'Plan Standard',
        priceUSD: 29.99,
        includedTokens: 10000,
        description: 'Plan d\'abonnement standard',
        customerType: 'all',
        isActive: true
      };

      // Vérifier la disponibilité du plan
      if (!this.isPlanAvailableForCustomer(plan, customer)) {
        throw new BadRequestException('Ce plan n\'est pas disponible pour votre type de compte');
      }

      // Configurer l'abonnement récurrent
      const recurringRequest: RecurringSetupRequest = {
        customerId: customer.id,
        planId: setupDto.planId,
        paymentMethodId: setupDto.paymentMethodId,
        trialDays: setupDto.trialDays || 0
      };

      const recurringResult = await this.stripePaymentService.setupRecurringPayment(recurringRequest);

      this.logger.log(`Abonnement récurrent configuré pour le client ${customer.id}`, {
        subscriptionId: recurringResult.subscriptionId,
        stripeSubscriptionId: recurringResult.stripeSubscriptionId,
        planId: setupDto.planId
      });

      return {
        success: true,
        data: {
          ...recurringResult,
          plan: {
            id: plan.id,
            name: plan.name,
            priceUSD: plan.priceUSD,
            tokensIncluded: plan.includedTokens
          }
        },
        message: recurringResult.message
      };

    } catch (error: any) {
      this.logger.error(`Erreur configuration abonnement récurrent:`, error);
      throw new BadRequestException(error.message || 'Erreur lors de la configuration de l\'abonnement');
    }
  }

  @Post('cancel-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Annuler un abonnement récurrent',
    description: 'Annule un abonnement récurrent Stripe existant'
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement annulé avec succès'
  })
  async cancelSubscription(
    @Body() cancelDto: CancelSubscriptionDto,
    @Req() req: any
  ) {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    try {
      // Vérifier que l'abonnement appartient au client
      const user = await this.userService.findByAuth0Id(auth0Id);
      if (!user || !user.companyId) {
        throw new BadRequestException('Utilisateur ou entreprise non trouvé');
      }
      // Pour l'instant utilisons l'ID de l'entreprise comme customer
      const customer = { id: user.companyId, type: user.userType };

      const subscription = await this.subscriptionService.findById(cancelDto.subscriptionId);
      if (!subscription || subscription.customerId !== customer.id) {
        throw new BadRequestException('Abonnement non trouvé ou non autorisé');
      }

      // Annuler l'abonnement
      await this.stripePaymentService.cancelRecurringPayment(cancelDto.subscriptionId);

      this.logger.log(`Abonnement annulé pour le client ${customer.id}`, {
        subscriptionId: cancelDto.subscriptionId,
        reason: cancelDto.reason
      });

      return {
        success: true,
        message: 'Abonnement annulé avec succès'
      };

    } catch (error: any) {
      this.logger.error(`Erreur annulation abonnement:`, error);
      throw new BadRequestException(error.message || 'Erreur lors de l\'annulation');
    }
  }

  @Post('webhook')
  @ApiOperation({ 
    summary: 'Webhook Stripe pour les événements de paiement',
    description: 'Endpoint pour recevoir les webhooks Stripe (payment intents, subscriptions, etc.)'
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook traité avec succès'
  })
  @ApiResponse({
    status: 400,
    description: 'Signature webhook invalide'
  })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException('Signature Stripe manquante');
    }

    try {
      const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      
      await this.stripePaymentService.handleWebhook(signature, payload);

      this.logger.log('Webhook Stripe traité avec succès');

      return {
        success: true,
        message: 'Webhook traité avec succès'
      };

    } catch (error: any) {
      this.logger.error('Erreur traitement webhook Stripe:', error);
      throw new BadRequestException('Erreur traitement webhook');
    }
  }

  /**
   * Méthodes utilitaires privées
   */
  private isPlanAvailableForCustomer(plan: any, customer: any): boolean {
    // Vérifier si le plan est disponible pour le type de client
    if (plan.customerType && plan.customerType !== 'all') {
      return plan.customerType === customer.type;
    }
    
    // Vérifier si le plan est actif
    if (plan.status !== 'active') {
      return false;
    }

    return true;
  }
}