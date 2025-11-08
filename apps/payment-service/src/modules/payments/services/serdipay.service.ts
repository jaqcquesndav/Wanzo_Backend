import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SerdiPayProvider } from '../providers/serdipay.provider';
import { PaymentRequest } from '../providers/payment-provider.interface';

export type MobileOperator = 'AM' | 'OM' | 'WAVE' | 'MP' | 'AF';

export interface VariableAmountPaymentRequest {
  amount: number;
  phone: string;
  operator: MobileOperator;
  reference: string;
  description?: string;
  callbackUrl?: string;
  metadata?: any;
}

export interface VariableAmountPaymentResponse {
  transactionId: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  fees?: number;
  message?: string;
  operatorResponse?: any;
}

/**
 * Service SerdiPay étendu pour supporter les paiements de financement
 * avec montants variables (non-abonnements)
 */
@Injectable()
export class SerdiPayService {
  private readonly logger = new Logger(SerdiPayService.name);

  constructor(
    private readonly serdiPayProvider: SerdiPayProvider,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Traite un paiement avec montant variable (pour financements)
   */
  async processVariableAmountPayment(
    request: VariableAmountPaymentRequest
  ): Promise<VariableAmountPaymentResponse> {
    this.logger.log(`Processing variable amount payment: ${request.reference} - ${request.amount} XOF`);

    try {
      // Validation des données
      this.validateRequest(request);

      // Conversion vers le format PaymentRequest du provider
      const paymentRequest: PaymentRequest = {
        amount: request.amount,
        currency: 'XOF',
        clientPhone: request.phone,
        telecom: this.mapOperatorToTelecom(request.operator),
        channel: 'client', // Paiement depuis le client
        clientReference: request.reference
      };

      // Stocker les métadonnées séparément pour usage interne
      const internalMetadata = {
        ...request.metadata,
        description: request.description,
        callbackUrl: request.callbackUrl,
        isVariableAmount: true,
        timestamp: new Date().toISOString()
      };

      // Appel au provider SerdiPay
      const providerResponse = await this.serdiPayProvider.initiatePayment(paymentRequest);

      // Transformation de la réponse
      return {
        transactionId: providerResponse.providerTransactionId || this.generateFallbackTransactionId(),
        reference: request.reference,
        status: this.mapProviderStatus(providerResponse.status),
        amount: request.amount,
        fees: this.calculateFees(request.amount, request.operator),
        message: providerResponse.providerMessage || 'Paiement initié avec succès',
        operatorResponse: {
          httpStatus: providerResponse.httpStatus,
          sessionId: providerResponse.sessionId,
          originalStatus: providerResponse.status
        }
      };
    } catch (error) {
      this.logger.error(`Error processing variable amount payment:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du traitement du paiement';
      
      return {
        transactionId: this.generateFallbackTransactionId(),
        reference: request.reference,
        status: 'failed',
        amount: request.amount,
        message: errorMessage
      };
    }
  }

  /**
   * Traite les callbacks des opérateurs
   */
  async handleCallback(callbackData: any): Promise<any> {
    this.logger.log(`Handling SerdiPay callback:`, callbackData);

    try {
      // Déléguer au provider pour le traitement de base
      await this.serdiPayProvider.handleCallback(callbackData);

      // Traitement supplémentaire pour les paiements variables
      const transactionId = callbackData?.payment?.transactionId;
      const status = callbackData?.payment?.status;
      const sessionId = callbackData?.payment?.sessionId;

      return {
        transactionId,
        status: this.mapCallbackStatus(status),
        sessionId,
        processedAt: new Date(),
        metadata: callbackData?.metadata || {}
      };
    } catch (error) {
      this.logger.error(`Error handling callback:`, error);
      throw error;
    }
  }

  /**
   * Vérifie le statut d'une transaction
   */
  async checkTransactionStatus(transactionId: string): Promise<any> {
    // TODO: Implémenter l'appel API pour vérifier le statut
    this.logger.log(`Checking transaction status: ${transactionId}`);
    
    return {
      transactionId,
      status: 'pending',
      message: 'Status check not implemented yet'
    };
  }

  /**
   * Valide les données de paiement
   */
  private validateRequest(request: VariableAmountPaymentRequest): void {
    if (!request.amount || request.amount <= 0) {
      throw new BadRequestException('Montant invalide');
    }

    if (!request.phone || !this.isValidPhoneNumber(request.phone)) {
      throw new BadRequestException('Numéro de téléphone invalide');
    }

    const validOperators: MobileOperator[] = ['AM', 'OM', 'WAVE', 'MP', 'AF'];
    if (!validOperators.includes(request.operator)) {
      throw new BadRequestException('Opérateur non supporté');
    }

    if (!request.reference || request.reference.trim().length === 0) {
      throw new BadRequestException('Référence requise');
    }

    // Limites spécifiques aux opérateurs
    const limits = this.getOperatorLimits(request.operator);
    if (request.amount < limits.min || request.amount > limits.max) {
      throw new BadRequestException(
        `Montant hors limites pour ${request.operator}: ${limits.min} - ${limits.max} XOF`
      );
    }
  }

  /**
   * Convertit l'opérateur vers le format telecom du provider
   */
  private mapOperatorToTelecom(operator: MobileOperator): string {
    const mapping: Record<MobileOperator, string> = {
      'AM': 'airtel',
      'OM': 'orange',
      'WAVE': 'wave',
      'MP': 'moov',
      'AF': 'africell'
    };

    return mapping[operator] || operator.toLowerCase();
  }

  /**
   * Convertit le statut du provider vers notre format
   */
  private mapProviderStatus(providerStatus: string): 'pending' | 'completed' | 'failed' {
    switch (providerStatus) {
      case 'success':
        return 'completed';
      case 'pending':
        return 'pending';
      case 'failed':
      default:
        return 'failed';
    }
  }

  /**
   * Convertit le statut du callback vers notre format
   */
  private mapCallbackStatus(callbackStatus: string): 'pending' | 'completed' | 'failed' {
    // Les statuts peuvent varier selon l'opérateur
    const successStatuses = ['success', 'completed', 'paid', 'confirmed'];
    const pendingStatuses = ['pending', 'processing', 'initiated'];
    
    if (successStatuses.includes(callbackStatus?.toLowerCase())) {
      return 'completed';
    }
    
    if (pendingStatuses.includes(callbackStatus?.toLowerCase())) {
      return 'pending';
    }
    
    return 'failed';
  }

  /**
   * Valide un numéro de téléphone
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Format attendu: +243XXXXXXXXX (RDC)
    return /^\+243[0-9]{9}$/.test(phone);
  }

  /**
   * Obtient les limites par opérateur
   */
  private getOperatorLimits(operator: MobileOperator): { min: number; max: number } {
    const limits: Record<MobileOperator, { min: number; max: number }> = {
      'AM': { min: 100, max: 5000000 },    // Airtel Money
      'OM': { min: 100, max: 3000000 },    // Orange Money
      'WAVE': { min: 100, max: 10000000 }, // Wave
      'MP': { min: 100, max: 2000000 },    // Moov Money
      'AF': { min: 100, max: 1000000 }     // Africell Money
    };

    return limits[operator] || { min: 100, max: 1000000 };
  }

  /**
   * Calcule les frais selon l'opérateur et le montant
   */
  private calculateFees(amount: number, operator: MobileOperator): number {
    // Grille tarifaire approximative (à ajuster selon les accords)
    const feeRates: Record<MobileOperator, number> = {
      'AM': 0.015,   // 1.5%
      'OM': 0.02,    // 2%
      'WAVE': 0.01,  // 1%
      'MP': 0.025,   // 2.5%
      'AF': 0.03     // 3%
    };

    const rate = feeRates[operator] || 0.02;
    return Math.round(amount * rate);
  }

  /**
   * Génère un ID de transaction de fallback
   */
  private generateFallbackTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }
}