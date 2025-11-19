import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction, PaymentStatus, PaymentType } from '../entities/payment-transaction.entity';
import { SerdiPayProvider } from '../providers/serdipay.provider';
import { DisbursementCompletedEvent, RepaymentReceivedEvent } from '@wanzobe/shared';

/**
 * Consumer pour gérer les décaissements et remboursements de crédit via SerdiPay
 * Architecture: portfolio-institution → Kafka → payment-service → SerdiPay
 */
@Injectable()
export class CreditPaymentConsumerService {
  private readonly logger = new Logger(CreditPaymentConsumerService.name);

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly transactionRepository: Repository<PaymentTransaction>,
    private readonly serdiPayProvider: SerdiPayProvider,
  ) {}

  /**
   * Écoute les événements de décaissement de crédit depuis portfolio-institution
   * Exécute le paiement via SerdiPay et confirme le décaissement
   */
  @EventPattern('portfolio.disbursement.initiated')
  async handleDisbursementInitiated(@Payload() data: any, @Ctx() context: KafkaContext) {
    const startTime = Date.now();
    this.logger.log(`[KAFKA] Received disbursement.initiated: ${data.id || data.reference}`);

    try {
      // Valider les données reçues
      if (!data.amount || !data.currency || !data.contractId) {
        throw new Error('Invalid disbursement data: missing required fields');
      }

      // Déterminer le compte de destination
      let clientPhone: string | undefined;
      let telecom: string | undefined;
      let bankAccountInfo: any;

      if (data.mobileMoneyAccount) {
        // Décaissement vers Mobile Money
        clientPhone = data.mobileMoneyAccount.phoneNumber;
        telecom = data.mobileMoneyAccount.operator; // AM, OM, MP, etc.
        
        if (!clientPhone || !telecom) {
          throw new Error('Invalid mobile money account: missing phone or operator');
        }
      } else if (data.bankAccount) {
        // Décaissement vers compte bancaire
        bankAccountInfo = data.bankAccount;
        this.logger.warn('Bank disbursement not yet fully implemented - will be stored for manual processing');
      } else {
        throw new Error('No payment method specified (mobile money or bank account)');
      }

      // Créer la transaction en base
      const transaction = this.transactionRepository.create({
        amount: data.amount.toString(),
        currency: data.currency,
        clientPhone: clientPhone || 'N/A',
        telecom: telecom || 'N/A',
        clientReference: data.reference || data.id,
        status: PaymentStatus.PENDING,
        paymentType: PaymentType.DISBURSEMENT,
        contractId: data.contractId,
        portfolioId: data.portfolioId,
        customerId: data.clientId,
        meta: {
          contractNumber: data.contractNumber,
          disbursementType: data.disbursementType,
          mobileMoneyAccount: data.mobileMoneyAccount,
          bankAccount: data.bankAccount,
          disbursementDate: data.disbursementDate,
          executedBy: data.executedBy,
          source: 'portfolio-institution-kafka',
        },
      });

      const savedTransaction = await this.transactionRepository.save(transaction);
      this.logger.log(`Transaction ${savedTransaction.id} created for disbursement ${data.reference}`);

      // Appeler SerdiPay uniquement pour Mobile Money
      if (clientPhone && telecom) {
        try {
          const serdiPayResponse = await this.serdiPayProvider.initiatePayment({
            amount: parseFloat(data.amount),
            currency: data.currency,
            clientPhone,
            telecom,
            channel: 'merchant',
            clientReference: data.reference || data.id,
          });

          // Mettre à jour la transaction avec la réponse SerdiPay
          savedTransaction.providerTransactionId = serdiPayResponse.providerTransactionId;
          savedTransaction.sessionId = serdiPayResponse.sessionId;
          savedTransaction.status = this.mapSerdiPayStatus(serdiPayResponse.status);
          savedTransaction.meta = {
            ...savedTransaction.meta,
            sessionId: serdiPayResponse.sessionId,
            providerResponse: serdiPayResponse,
            lastUpdated: new Date().toISOString(),
          };

          if (savedTransaction.status === PaymentStatus.SUCCESS) {
            savedTransaction.completedAt = new Date();
          }

          await this.transactionRepository.save(savedTransaction);

          const processingTime = Date.now() - startTime;
          this.logger.log(
            `Disbursement ${data.reference} processed successfully via SerdiPay in ${processingTime}ms, ` +
            `status: ${savedTransaction.status}`
          );
        } catch (serdiPayError: any) {
          this.logger.error(`SerdiPay error for disbursement ${data.reference}: ${serdiPayError.message}`, serdiPayError.stack);
          
          savedTransaction.status = PaymentStatus.FAILED;
          savedTransaction.meta = {
            ...savedTransaction.meta,
            error: serdiPayError.message,
            failedAt: new Date().toISOString(),
          };
          await this.transactionRepository.save(savedTransaction);
        }
      }

      context.getMessage();
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Failed to process disbursement.initiated: ${error.message} (failed after ${processingTime}ms)`,
        error.stack
      );
    }
  }

  /**
   * Écoute les événements de demande de remboursement depuis portfolio-institution
   * Valide le remboursement reçu et met à jour les statuts
   */
  @EventPattern('portfolio.repayment.requested')
  async handleRepaymentRequested(@Payload() data: any, @Ctx() context: KafkaContext) {
    const startTime = Date.now();
    this.logger.log(`[KAFKA] Received repayment.requested: ${data.id || data.reference}`);

    try {
      // Valider les données reçues
      if (!data.amount || !data.currency || !data.contractId) {
        throw new Error('Invalid repayment data: missing required fields');
      }

      // Déterminer le compte source du remboursement
      let clientPhone: string | undefined;
      let telecom: string | undefined;

      if (data.mobileMoneyAccount) {
        clientPhone = data.mobileMoneyAccount.phoneNumber;
        telecom = data.mobileMoneyAccount.operator;
      }

      // Créer la transaction en base
      const transaction = this.transactionRepository.create({
        amount: data.amount.toString(),
        currency: data.currency,
        clientPhone: clientPhone || 'N/A',
        telecom: telecom || 'N/A',
        clientReference: data.reference || data.id,
        status: PaymentStatus.PENDING,
        paymentType: PaymentType.REPAYMENT,
        contractId: data.contractId,
        portfolioId: data.portfolioId,
        customerId: data.clientId,
        meta: {
          contractNumber: data.contractNumber,
          paymentType: data.paymentType,
          paymentMethod: data.paymentMethod,
          scheduleItemsAffected: data.scheduleItemsAffected,
          mobileMoneyAccount: data.mobileMoneyAccount,
          bankAccount: data.bankAccount,
          paymentDate: data.paymentDate,
          processedBy: data.processedBy,
          externalTransactionId: data.externalTransactionId,
          source: 'portfolio-institution-kafka',
        },
      });

      const savedTransaction = await this.transactionRepository.save(transaction);

      // Pour les remboursements, on valide généralement qu'ils sont déjà reçus
      // Marquer comme SUCCESS si externalTransactionId existe (déjà validé)
      if (data.externalTransactionId || data.transactionId) {
        savedTransaction.status = PaymentStatus.SUCCESS;
        savedTransaction.providerTransactionId = data.externalTransactionId || data.transactionId;
        savedTransaction.completedAt = new Date();
        await this.transactionRepository.save(savedTransaction);
        
        this.logger.log(`Repayment ${data.reference} validated and recorded as successful`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Repayment request processed in ${processingTime}ms`);

      context.getMessage();
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Failed to process repayment.requested: ${error.message} (failed after ${processingTime}ms)`,
        error.stack
      );
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
}
