import { 
  Controller, 
  Post, 
  Body, 
  HttpStatus,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody 
} from '@nestjs/swagger';
import { SerdiPayService } from '../services/serdipay.service';

export interface FinancingPaymentRequest {
  amount: number;
  phone: string;
  operator: 'AM' | 'OM' | 'WAVE' | 'MP' | 'AF';
  reference: string;
  description?: string;
  contractId?: string;
  scheduleId?: string;
  callbackUrl?: string;
  metadata?: {
    portfolioId?: string;
    clientId?: string;
    paymentType?: 'disbursement' | 'repayment';
  };
}

export interface FinancingPaymentResponse {
  success: boolean;
  transactionId: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  fees?: number;
  message?: string;
  operatorResponse?: any;
}

@ApiTags('serdipay-financing')
@Controller('serdipay')
export class SerdiPayFinancingController {
  private readonly logger = new Logger(SerdiPayFinancingController.name);

  constructor(
    private readonly serdiPayService: SerdiPayService,
  ) {}

  @Post('process-financing-payment')
  @ApiOperation({ 
    summary: 'Traiter un paiement de financement via SerdiPay',
    description: 'Traite un paiement mobile money pour les déboursements ou remboursements de financement avec montants variables'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { 
          type: 'number', 
          description: 'Montant du paiement (variable)',
          example: 50000
        },
        phone: { 
          type: 'string', 
          description: 'Numéro de téléphone mobile money',
          example: '+243999123456'
        },
        operator: { 
          type: 'string', 
          enum: ['AM', 'OM', 'WAVE', 'MP', 'AF'],
          description: 'Opérateur mobile money'
        },
        reference: { 
          type: 'string', 
          description: 'Référence unique du paiement',
          example: 'DISB-CNT-2025-001-1673456789'
        },
        description: { 
          type: 'string', 
          description: 'Description du paiement',
          example: 'Déboursement contrat CNT-2025-001'
        },
        contractId: { 
          type: 'string', 
          description: 'ID du contrat de financement',
          example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        },
        scheduleId: { 
          type: 'string', 
          description: 'ID de l\'échéance (pour remboursements)',
          example: 'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'
        },
        callbackUrl: { 
          type: 'string', 
          description: 'URL de callback pour notification',
          example: 'https://api.wanzo.cd/portfolio/payments/callback'
        },
        metadata: {
          type: 'object',
          description: 'Métadonnées additionnelles',
          properties: {
            portfolioId: { type: 'string' },
            clientId: { type: 'string' },
            paymentType: { type: 'string', enum: ['disbursement', 'repayment'] }
          }
        }
      },
      required: ['amount', 'phone', 'operator', 'reference']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Paiement de financement traité avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            transactionId: { type: 'string' },
            reference: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
            amount: { type: 'number' },
            fees: { type: 'number' },
            message: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données de paiement invalides' 
  })
  async processFinancingPayment(
    @Body() request: FinancingPaymentRequest,
  ): Promise<{ success: boolean; data: FinancingPaymentResponse }> {
    this.logger.log(`Processing financing payment: ${request.reference} - ${request.amount} XOF`);

    try {
      // Valider les données d'entrée
      this.validateFinancingPaymentRequest(request);

      // Traiter le paiement via SerdiPay
      const result = await this.serdiPayService.processVariableAmountPayment({
        amount: request.amount,
        phone: request.phone,
        operator: request.operator,
        reference: request.reference,
        description: request.description || `Paiement financement ${request.reference}`,
        callbackUrl: request.callbackUrl,
        metadata: {
          ...request.metadata,
          contractId: request.contractId,
          scheduleId: request.scheduleId,
          isFinancingPayment: true,
          timestamp: new Date().toISOString()
        }
      });

      this.logger.log(`Financing payment processed successfully: ${result.transactionId}`);

      const response: FinancingPaymentResponse = {
        success: true,
        transactionId: result.transactionId,
        reference: result.reference,
        status: result.status,
        amount: result.amount,
        fees: result.fees,
        message: result.message || 'Paiement de financement traité avec succès',
        operatorResponse: result.operatorResponse
      };

      return {
        success: true,
        data: response
      };
    } catch (error) {
      this.logger.error(`Error processing financing payment:`, error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Erreur lors du traitement du paiement de financement');
    }
  }

  @Post('callback/financing')
  @ApiOperation({ 
    summary: 'Callback pour les paiements de financement',
    description: 'Endpoint de callback pour recevoir les notifications des opérateurs mobile money'
  })
  @ApiBody({
    schema: {
      type: 'object',
      description: 'Données de callback de l\'opérateur mobile money'
    }
  })
  async handleFinancingCallback(
    @Body() callbackData: any,
  ) {
    this.logger.log(`Received financing payment callback:`, callbackData);

    try {
      // Traiter le callback
      const result = await this.serdiPayService.handleCallback(callbackData);

      // Si c'est un paiement de financement, notifier le portfolio-service
      if (result.metadata?.isFinancingPayment) {
        await this.notifyPortfolioService(result);
      }

      return {
        success: true,
        message: 'Callback traité avec succès'
      };
    } catch (error) {
      this.logger.error(`Error handling financing callback:`, error);
      return {
        success: false,
        message: 'Erreur lors du traitement du callback'
      };
    }
  }

  /**
   * Limites de transaction par opérateur mobile money (en XOF)
   */
  private readonly OPERATOR_LIMITS: Record<string, { min: number; max: number; daily: number }> = {
    'AM': { min: 100, max: 5000000, daily: 10000000 },      // Airtel Money
    'OM': { min: 100, max: 3000000, daily: 8000000 },       // Orange Money
    'WAVE': { min: 100, max: 10000000, daily: 20000000 },   // WAVE
    'MP': { min: 100, max: 2000000, daily: 5000000 },       // M-Pesa
    'AF': { min: 100, max: 2000000, daily: 5000000 }        // Africell
  };

  /**
   * Valide les données de paiement de financement
   */
  private validateFinancingPaymentRequest(request: FinancingPaymentRequest): void {
    if (!request.amount || request.amount <= 0) {
      throw new BadRequestException('Le montant doit être supérieur à zéro');
    }

    // Validation E.164 pour numéros RDC
    if (!request.phone || !request.phone.match(/^\+243[0-9]{9}$/)) {
      throw new BadRequestException('Numéro de téléphone invalide (format: +243XXXXXXXXX)');
    }

    if (!['AM', 'OM', 'WAVE', 'MP', 'AF'].includes(request.operator)) {
      throw new BadRequestException('Opérateur mobile money invalide. Valeurs acceptées: AM, OM, WAVE, MP, AF');
    }

    if (!request.reference || request.reference.trim().length === 0) {
      throw new BadRequestException('Référence de paiement requise');
    }

    // Validation des limites par opérateur
    const limits = this.OPERATOR_LIMITS[request.operator];
    if (request.amount < limits.min) {
      throw new BadRequestException(`Montant minimum pour ${request.operator}: ${limits.min} XOF`);
    }
    if (request.amount > limits.max) {
      throw new BadRequestException(`Montant maximum pour ${request.operator}: ${limits.max} XOF`);
    }
  }

  /**
   * Notifie le portfolio-service du résultat du callback
   */
  private async notifyPortfolioService(callbackResult: any): Promise<void> {
    try {
      // TODO: Implémenter la notification vers portfolio-service via HTTP ou Kafka
      this.logger.log(`Notifying portfolio service for transaction: ${callbackResult.transactionId}`);
      
      // Exemple d'appel HTTP vers portfolio-service
      // await this.httpService.post(`${portfolioServiceUrl}/payments/callback`, callbackResult);
      
      // Ou publication d'événement Kafka
      // await this.eventEmitter.emit('financing-payment.callback', callbackResult);
    } catch (error) {
      this.logger.error(`Failed to notify portfolio service:`, error);
    }
  }
}