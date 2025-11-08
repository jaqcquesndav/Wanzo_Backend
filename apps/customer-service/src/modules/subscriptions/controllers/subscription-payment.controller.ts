import { Controller, Post, Get, Body, Param, UseGuards, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SubscriptionPaymentService, InitiateSubscriptionPaymentDto } from '../services/subscription-payment.service';
import { SubscriptionService } from '../services/subscription.service';

class PurchaseSubscriptionDto {
  planId!: string;
  clientPhone!: string;
  telecom!: 'AM' | 'OM' | 'MP' | 'AF';
  channel?: 'merchant' | 'client';
  clientReference?: string;
}

class TelecomOperator {
  static readonly AIRTEL_MONEY = 'AM';
  static readonly ORANGE_MONEY = 'OM';
  static readonly MPESA = 'MP';
  static readonly AFRICELL = 'AF';
}

@ApiTags('subscription-payments')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionPaymentController {
  constructor(
    private readonly subscriptionPaymentService: SubscriptionPaymentService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Acheter un plan d\'abonnement via mobile money',
    description: 'Permet à un utilisateur connecté d\'acheter un plan d\'abonnement en utilisant le mobile money (Airtel Money, Orange Money, M-Pesa, Africell)'
  })
  @ApiBody({
    type: PurchaseSubscriptionDto,
    examples: {
      airtelMoney: {
        summary: 'Paiement Airtel Money',
        description: 'Exemple de paiement avec Airtel Money',
        value: {
          planId: 'plan-uuid-123',
          clientPhone: '243994972450',
          telecom: 'AM',
          channel: 'merchant',
          clientReference: 'my-ref-001'
        }
      },
      orangeMoney: {
        summary: 'Paiement Orange Money',
        description: 'Exemple de paiement avec Orange Money',
        value: {
          planId: 'plan-uuid-456',
          clientPhone: '243810123456',
          telecom: 'OM',
          channel: 'client'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Paiement initié avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            transactionId: { 
              type: 'string', 
              description: 'ID de transaction interne',
              example: 'tx-uuid-789'
            },
            providerTransactionId: { 
              type: 'string', 
              description: 'ID de transaction SerdiPay',
              example: 'serdipay-tx-123'
            },
            sessionId: { 
              type: 'string', 
              description: 'ID de session SerdiPay',
              example: 'session-456'
            },
            status: { 
              type: 'string', 
              enum: ['pending', 'success', 'failed'],
              example: 'pending'
            },
            message: { 
              type: 'string', 
              description: 'Message du provider de paiement',
              example: 'Transaction in process'
            },
            plan: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'plan-uuid-123' },
                name: { type: 'string', example: 'Standard Monthly Plan' },
                tokensIncluded: { type: 'number', example: 1000 }
              }
            },
            instructions: {
              type: 'string',
              description: 'Instructions pour l\'utilisateur',
              example: 'Composez *150# et suivez les instructions pour confirmer le paiement de 50.00 CDF'
            }
          }
        }
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
  @ApiResponse({
    status: 404,
    description: 'Plan non trouvé'
  })
  async purchaseSubscription(
    @Body() purchaseDto: PurchaseSubscriptionDto,
    @Req() req: any
  ) {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Validation des données d'entrée
    this.validatePurchaseDto(purchaseDto);

    try {
      const paymentResponse = await this.subscriptionPaymentService.initiateSubscriptionPaymentByAuth0Id(
        auth0Id,
        {
          planId: purchaseDto.planId,
          clientPhone: purchaseDto.clientPhone,
          telecom: purchaseDto.telecom,
          channel: purchaseDto.channel || 'merchant',
          clientReference: purchaseDto.clientReference,
        }
      );

      return {
        success: true,
        data: {
          ...paymentResponse,
          instructions: this.generatePaymentInstructions(
            purchaseDto.telecom,
            paymentResponse.plan?.name || 'Plan',
            50.00 // TODO: récupérer le vrai montant
          )
        }
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('plans/available')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Récupérer les plans disponibles pour l\'utilisateur connecté',
    description: 'Retourne la liste des plans d\'abonnement disponibles selon le type de compte de l\'utilisateur'
  })
  @ApiResponse({
    status: 200,
    description: 'Plans disponibles récupérés avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'plan-uuid-123' },
              name: { type: 'string', example: 'Standard Monthly Plan' },
              description: { type: 'string', example: 'Plan mensuel avec 1000 tokens inclus' },
              type: { type: 'string', example: 'monthly' },
              priceUSD: { type: 'number', example: 50.00 },
              priceLocal: { type: 'number', example: 125000 },
              currency: { type: 'string', example: 'CDF' },
              includedTokens: { type: 'number', example: 1000 },
              features: { type: 'object' },
              isPopular: { type: 'boolean', example: false },
              durationDays: { type: 'number', example: 30 }
            }
          }
        }
      }
    }
  })
  async getAvailablePlans(@Req() req: any) {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    const plans = await this.subscriptionPaymentService.getAvailablePlansForAuth0Id(auth0Id);
    
    return {
      success: true,
      data: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        type: plan.type,
        priceUSD: plan.priceUSD,
        priceLocal: plan.priceLocal,
        currency: plan.currency || 'CDF',
        includedTokens: plan.includedTokens,
        features: plan.features,
        limits: plan.limits,
        isPopular: plan.isPopular,
        durationDays: plan.durationDays,
        tokenConfig: plan.tokenConfig,
      }))
    };
  }

  @Get('payment-status/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Vérifier le statut d\'un paiement',
    description: 'Permet de vérifier le statut actuel d\'une transaction de paiement'
  })
  @ApiResponse({
    status: 200,
    description: 'Statut du paiement récupéré',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            transactionId: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'success', 'failed'] },
            amount: { type: 'string' },
            currency: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async checkPaymentStatus(
    @Param('transactionId') transactionId: string,
    @Req() req: any
  ) {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    const paymentStatus = await this.subscriptionPaymentService.checkPaymentStatus(transactionId);
    
    if (!paymentStatus) {
      throw new BadRequestException('Transaction non trouvée');
    }

    return {
      success: true,
      data: paymentStatus
    };
  }

  @Get('current/payment-history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Historique des paiements de subscription du client',
    description: 'Retourne l\'historique des paiements de plans d\'abonnement pour le client de l\'utilisateur connecté'
  })
  @ApiResponse({
    status: 200,
    description: 'Historique des paiements récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              transactionId: { type: 'string' },
              planId: { type: 'string' },
              planName: { type: 'string' },
              amount: { type: 'string' },
              currency: { type: 'string' },
              status: { type: 'string' },
              telecom: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              completedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  async getCurrentUserPaymentHistory(@Req() req: any) {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    try {
      const paymentHistory = await this.subscriptionPaymentService.getPaymentHistoryByAuth0Id(auth0Id);
      
      return {
        success: true,
        data: paymentHistory
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // Méthodes privées d'aide

  private validatePurchaseDto(dto: PurchaseSubscriptionDto): void {
    // Validation du numéro de téléphone (format RDC)
    if (!dto.clientPhone.match(/^243[0-9]{9}$/)) {
      throw new BadRequestException('Format de numéro de téléphone invalide. Utilisez le format 243XXXXXXXXX');
    }

    // Validation de l'opérateur télécom
    const validTelecoms = ['AM', 'OM', 'MP', 'AF'];
    if (!validTelecoms.includes(dto.telecom)) {
      throw new BadRequestException('Opérateur télécom non supporté. Utilisez AM, OM, MP ou AF');
    }

    // Validation du planId (UUID format)
    if (!dto.planId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new BadRequestException('Format de plan ID invalide');
    }
  }

  private generatePaymentInstructions(telecom: string, planName: string, amount: number): string {
    const amountFormatted = amount.toFixed(2);
    
    switch (telecom) {
      case 'AM': // Airtel Money
        return `Composez *150# et suivez les instructions pour confirmer le paiement de ${amountFormatted} CDF pour ${planName}`;
      
      case 'OM': // Orange Money
        return `Composez #150# et suivez les instructions pour confirmer le paiement de ${amountFormatted} CDF pour ${planName}`;
      
      case 'MP': // M-Pesa
        return `Ouvrez l'application M-Pesa ou composez *100# pour confirmer le paiement de ${amountFormatted} CDF pour ${planName}`;
      
      case 'AF': // Africell
        return `Composez *144# et suivez les instructions pour confirmer le paiement de ${amountFormatted} CDF pour ${planName}`;
      
      default:
        return `Suivez les instructions de votre opérateur mobile pour confirmer le paiement de ${amountFormatted} CDF pour ${planName}`;
    }
  }
}