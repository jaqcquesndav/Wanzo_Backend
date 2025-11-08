import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction, PaymentStatus, PaymentType } from '../entities/payment-transaction.entity';
import { SerdiPayProvider } from '../providers/serdipay.provider';
import { SubscriptionPaymentEventsService } from './subscription-payment-events.service';

/**
 * Service pour écouter les événements Kafka de demande de paiement depuis customer-service
 * Architecture: customer-service → Kafka → payment-service → REST API → SerdiPay
 */
@Injectable()
export class PaymentRequestListenerService {
  private readonly logger = new Logger(PaymentRequestListenerService.name);

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly transactionRepository: Repository<PaymentTransaction>,
    private readonly serdiPayProvider: SerdiPayProvider,
    private readonly eventsService: SubscriptionPaymentEventsService,
  ) {}

  /**
   * Traite une demande de paiement d'abonnement reçue via Kafka du customer-service
   * TODO: Décorer avec @EventPattern('subscription.payment.request')
   */
  async handleSubscriptionPaymentRequest(eventData: any): Promise<void> {
    this.logger.log(`[KAFKA] Received subscription.payment.request: ${eventData.requestId}`);

    try {
      // 1. Créer une transaction en base
      const transaction = this.transactionRepository.create({
        amount: eventData.paymentData.amount,
        currency: eventData.paymentData.currency,
        clientPhone: eventData.paymentData.clientPhone,
        telecom: eventData.paymentData.telecom,
        clientReference: eventData.paymentData.clientReference,
        status: PaymentStatus.PENDING,
        paymentType: PaymentType.SUBSCRIPTION,
        customerId: eventData.customerId,
        planId: eventData.planId,
        subscriptionId: eventData.subscriptionContext.existingSubscriptionId,
        meta: {
          requestId: eventData.requestId,
          telecom: eventData.paymentData.telecom,
          channel: eventData.paymentData.channel,
          clientReference: eventData.paymentData.clientReference,
          planName: eventData.planDetails.planName,
          planType: eventData.planDetails.planType,
          tokensIncluded: eventData.planDetails.tokensIncluded,
          isRenewal: eventData.subscriptionContext.isRenewal,
          billingCycleStart: eventData.subscriptionContext.billingCycleStart,
          billingCycleEnd: eventData.subscriptionContext.billingCycleEnd,
          customerType: eventData.customerContext.customerType,
          customerName: eventData.customerContext.customerName,
          source: 'customer-service-kafka'
        }
      });

      const savedTransaction = await this.transactionRepository.save(transaction);
      this.logger.log(`Transaction ${savedTransaction.id} created for payment request ${eventData.requestId}`);

      // 2. Émettre événement de paiement initié
      await this.eventsService.emitSubscriptionPaymentInitiated(savedTransaction);

      // 3. Appeler SerdiPay via REST API (seule communication REST externe)
      const serdiPayResponse = await this.serdiPayProvider.initiatePayment({
        amount: parseFloat(eventData.paymentData.amount),
        currency: eventData.paymentData.currency,
        clientPhone: eventData.paymentData.clientPhone,
        telecom: eventData.paymentData.telecom,
        channel: eventData.paymentData.channel || 'merchant',
        clientReference: eventData.paymentData.clientReference
      });

      // 4. Mettre à jour la transaction avec la réponse SerdiPay
      savedTransaction.providerTransactionId = serdiPayResponse.providerTransactionId;
      savedTransaction.sessionId = serdiPayResponse.sessionId;
      savedTransaction.status = this.mapSerdiPayStatus(serdiPayResponse.status);
      savedTransaction.meta = {
        ...savedTransaction.meta,
        sessionId: serdiPayResponse.sessionId,
        providerResponse: serdiPayResponse,
        lastUpdated: new Date().toISOString()
      };

      await this.transactionRepository.save(savedTransaction);

      // 5. Émettre l'événement approprié selon le statut
      if (savedTransaction.status === PaymentStatus.PENDING) {
        await this.eventsService.emitSubscriptionPaymentPending(
          savedTransaction, 
          this.generatePaymentInstructions(eventData.paymentData.telecom, eventData.planDetails.planName, eventData.paymentData.amount)
        );
      } else if (savedTransaction.status === PaymentStatus.SUCCESS) {
        savedTransaction.completedAt = new Date();
        await this.transactionRepository.save(savedTransaction);
        await this.eventsService.emitSubscriptionPaymentSuccess(savedTransaction);
        
        // Émettre événement vers admin-service pour calculs financiers
        await this.eventsService.emitFinancePaymentReceived(savedTransaction);
      } else if (savedTransaction.status === PaymentStatus.FAILED) {
        await this.eventsService.emitSubscriptionPaymentFailed(savedTransaction, serdiPayResponse.providerMessage || 'Payment failed');
      }

      this.logger.log(`Payment request ${eventData.requestId} processed successfully, status: ${savedTransaction.status}`);

    } catch (error: any) {
      this.logger.error(`Error processing payment request ${eventData.requestId}: ${error.message}`, error.stack);
      
      // Émettre un événement d'échec si possible
      try {
        const failedTransaction = this.transactionRepository.create({
          amount: eventData.paymentData.amount,
          currency: eventData.paymentData.currency,
          clientPhone: eventData.paymentData.clientPhone,
          telecom: eventData.paymentData.telecom,
          status: PaymentStatus.FAILED,
          paymentType: PaymentType.SUBSCRIPTION,
          customerId: eventData.customerId,
          planId: eventData.planId,
          meta: {
            requestId: eventData.requestId,
            error: error.message,
            source: 'customer-service-kafka'
          }
        });

        const savedFailedTransaction = await this.transactionRepository.save(failedTransaction);
        await this.eventsService.emitSubscriptionPaymentFailed(savedFailedTransaction, error.message);
      } catch (emitError: any) {
        this.logger.error(`Failed to emit error event: ${emitError.message}`);
      }
    }
  }

  /**
   * Convertit le statut SerdiPay vers notre enum interne
   */
  private mapSerdiPayStatus(serdiPayStatus: string): PaymentStatus {
    switch (serdiPayStatus?.toLowerCase()) {
      case 'success':
      case 'completed':
        return PaymentStatus.SUCCESS;
      case 'pending':
      case 'processing':
        return PaymentStatus.PENDING;
      case 'failed':
      case 'error':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Génère les instructions de paiement selon l'opérateur
   */
  private generatePaymentInstructions(telecom: string, planName: string, amount: string): string {
    const amountFormatted = parseFloat(amount).toFixed(2);
    
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