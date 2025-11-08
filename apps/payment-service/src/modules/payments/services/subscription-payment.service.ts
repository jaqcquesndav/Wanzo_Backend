import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { PaymentTransaction, PaymentStatus, PaymentType } from '../entities/payment-transaction.entity';
import { SerdiPayProvider } from '../providers/serdipay.provider';
import { InitiateSubscriptionPaymentDto } from '../dto/initiate-subscription-payment.dto';
import { SerdiPayCallbackDto } from '../dto/serdipay-callback.dto';
import { SubscriptionPaymentEventsService } from './subscription-payment-events.service';

interface SubscriptionPlan {
  id: string;
  name: string;
  priceUSD: number;
  priceLocal?: number;
  currency?: string;
  type: string;
  includedTokens: number;
  isActive: boolean;
}

interface CreateSubscriptionRequest {
  customerId: string;
  planId: string;
  paymentReference: string;
  amount: number;
  currency: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}

@Injectable()
export class SubscriptionPaymentService {
  private readonly logger = new Logger(SubscriptionPaymentService.name);

  constructor(
    private readonly serdiPayProvider: SerdiPayProvider,
    @InjectRepository(PaymentTransaction)
    private readonly paymentRepository: Repository<PaymentTransaction>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly eventsService: SubscriptionPaymentEventsService,
  ) {}

  /**
   * Initie un paiement de subscription via SerdiPay
   */
  async initiateSubscriptionPayment(dto: InitiateSubscriptionPaymentDto) {
    this.logger.log(`Initiating subscription payment for plan ${dto.planId}, customer ${dto.customerId}`);

    // 1. Valider le plan avec customer-service
    const plan = await this.validatePlanWithCustomerService(dto.planId, dto.customerId);
    if (!plan) {
      throw new BadRequestException(`Plan ${dto.planId} not found or not available for customer ${dto.customerId}`);
    }

    // 2. Vérifier que le montant correspond au plan
    const expectedAmount = plan.priceLocal || plan.priceUSD;
    if (Math.abs(dto.amount - expectedAmount) > 0.01) {
      throw new BadRequestException(
        `Amount mismatch. Expected: ${expectedAmount} ${dto.currency}, Received: ${dto.amount} ${dto.currency}`
      );
    }

    // 3. Initier le paiement via SerdiPay (utilise l'infrastructure existante)
    try {
      const paymentResponse = await this.serdiPayProvider.initiatePayment({
        amount: dto.amount,
        currency: dto.currency,
        clientPhone: dto.clientPhone,
        telecom: dto.telecom,
        channel: dto.channel || 'merchant',
        clientReference: dto.clientReference,
      });

      // 4. Mapper le status de SerdiPay vers notre enum
      const mapPaymentStatus = (status: string): PaymentStatus => {
        switch (status.toLowerCase()) {
          case 'success':
          case 'completed':
            return PaymentStatus.SUCCESS;
          case 'failed':
          case 'error':
            return PaymentStatus.FAILED;
          default:
            return PaymentStatus.PENDING;
        }
      };

      // 5. Créer l'enregistrement de transaction avec les nouvelles colonnes
      const transaction = this.paymentRepository.create({
        // Colonnes existantes
        amount: String(dto.amount),
        currency: dto.currency,
        clientPhone: dto.clientPhone,
        telecom: dto.telecom,
        clientReference: dto.clientReference,
        status: mapPaymentStatus(paymentResponse.status),
        provider: 'SerdiPay',
        providerTransactionId: paymentResponse.providerTransactionId,
        sessionId: paymentResponse.sessionId,
        
        // Nouvelles colonnes pour subscription
        paymentType: PaymentType.SUBSCRIPTION,
        customerId: dto.customerId,
        planId: dto.planId,
        subscriptionId: dto.existingSubscriptionId, // null si nouveau, ou ID si renouvellement
        
        // Meta incluant les détails du plan et subscription
        meta: {
          request: dto,
          plan: {
            id: plan.id,
            name: plan.name,
            type: plan.type,
            includedTokens: plan.includedTokens,
          },
          subscriptionContext: {
            isRenewal: dto.metadata?.isRenewal || false,
            isUpgrade: dto.metadata?.isUpgrade || false,
            billingCycleStart: dto.metadata?.billingCycleStart,
            billingCycleEnd: dto.metadata?.billingCycleEnd,
          }
        },
      });

      const savedTransaction = await this.paymentRepository.save(transaction);

      // Émettre événement de paiement initié
      await this.eventsService.emitSubscriptionPaymentInitiated(savedTransaction);

      this.logger.log(`Subscription payment initiated: ${savedTransaction.id} for customer ${dto.customerId}`);

      return {
        transactionId: savedTransaction.id,
        providerTransactionId: paymentResponse.providerTransactionId,
        sessionId: paymentResponse.sessionId,
        status: paymentResponse.status,
        httpStatus: paymentResponse.httpStatus,
        message: paymentResponse.providerMessage,
        plan: {
          id: plan.id,
          name: plan.name,
          tokensIncluded: plan.includedTokens,
        },
      };

    } catch (error: any) {
      this.logger.error(`Failed to initiate subscription payment: ${error.message}`, error.stack);
      throw new BadRequestException(`Payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Traite le callback SerdiPay pour les paiements de subscription
   */
  async handleSubscriptionPaymentCallback(payload: SerdiPayCallbackDto) {
    this.logger.log(`Processing subscription payment callback: ${JSON.stringify(payload)}`);

    // Utiliser la logique existante du SerdiPayProvider
    await this.serdiPayProvider.handleCallback(payload);

    const providerTransactionId = payload?.payment?.transactionId;
    if (!providerTransactionId) {
      this.logger.warn('No transaction ID in callback payload');
      return;
    }

    // Trouver la transaction de subscription
    const transaction = await this.paymentRepository.findOne({
      where: { 
        providerTransactionId,
        paymentType: 'subscription'
      }
    });

    if (!transaction) {
      this.logger.warn(`Subscription transaction not found for provider ID: ${providerTransactionId}`);
      return;
    }

    const paymentStatus = (payload?.payment?.status || '').toLowerCase();
    const normalizedStatus = ['success', 'pending', 'failed'].includes(paymentStatus) 
      ? (paymentStatus as any) 
      : 'failed';

    // Mettre à jour le statut de la transaction
    await this.paymentRepository.update(
      { id: transaction.id },
      { 
        status: normalizedStatus, 
        meta: { ...transaction.meta, callback: payload }
      }
    );

    // Si le paiement est réussi, créer/mettre à jour la subscription
    if (normalizedStatus === 'success') {
      await this.processSuccessfulSubscriptionPayment(transaction);
      await this.eventsService.emitSubscriptionPaymentSuccess(transaction);
      
      // Émettre événement vers admin-service pour calculs financiers
      await this.eventsService.emitFinancePaymentReceived(transaction);
    } else if (normalizedStatus === 'failed') {
      this.logger.error(`Subscription payment failed for transaction ${transaction.id}`);
      await this.eventsService.emitSubscriptionPaymentFailed(transaction, payload?.payment?.status);
    }
  }

  /**
   * Traite un paiement de subscription réussi
   */
  private async processSuccessfulSubscriptionPayment(transaction: PaymentTransaction) {
    try {
      this.logger.log(`Processing successful subscription payment: ${transaction.id}`);

      const isRenewal = transaction.meta?.subscriptionContext?.isRenewal || false;
      const billingCycleStart = transaction.meta?.subscriptionContext?.billingCycleStart 
        ? new Date(transaction.meta.subscriptionContext.billingCycleStart)
        : new Date();
      
      // Calculer la fin de période selon le type de plan
      const billingCycleEnd = this.calculateBillingPeriodEnd(
        billingCycleStart, 
        transaction.meta?.plan?.type || 'monthly'
      );

      if (isRenewal && transaction.subscriptionId) {
        // Renouveler subscription existante
        await this.renewSubscriptionInCustomerService({
          subscriptionId: transaction.subscriptionId,
          paymentReference: transaction.id,
          billingPeriodStart: billingCycleStart,
          billingPeriodEnd: billingCycleEnd,
        });
      } else {
        // Créer nouvelle subscription
        const subscriptionId = await this.createSubscriptionInCustomerService({
          customerId: transaction.customerId!,
          planId: transaction.planId!,
          paymentReference: transaction.id,
          amount: parseFloat(transaction.amount),
          currency: transaction.currency,
          billingPeriodStart: billingCycleStart,
          billingPeriodEnd: billingCycleEnd,
        });

        // Mettre à jour la transaction avec l'ID de subscription
        await this.paymentRepository.update(
          { id: transaction.id },
          { subscriptionId }
        );
      }

      this.logger.log(`Successfully processed subscription payment: ${transaction.id}`);

    } catch (error: any) {
      this.logger.error(`Failed to process successful payment: ${error.message}`, error.stack);
      // Le paiement est réussi mais on n'a pas pu créer la subscription
      await this.eventsService.emitSubscriptionPaymentPending(transaction, 'manual_review_required');
    }
  }

  /**
   * Valide un plan avec le customer-service
   */
  private async validatePlanWithCustomerService(planId: string, customerId: string): Promise<SubscriptionPlan | null> {
    try {
      const customerServiceUrl = this.configService.get<string>('CUSTOMER_SERVICE_URL', 'http://customer-service:3000');
      const response = await firstValueFrom(
        this.httpService.get(`${customerServiceUrl}/subscriptions/plans/${planId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            customerId, // Pour vérifier l'éligibilité
          }
        })
      );

      return response.data as SubscriptionPlan;
    } catch (error: any) {
      this.logger.error(`Failed to validate plan ${planId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Crée une subscription dans le customer-service
   */
  private async createSubscriptionInCustomerService(request: CreateSubscriptionRequest): Promise<string> {
    const customerServiceUrl = this.configService.get<string>('CUSTOMER_SERVICE_URL', 'http://customer-service:3000');
    
    const response = await firstValueFrom(
      this.httpService.post(`${customerServiceUrl}/subscriptions`, {
        customerId: request.customerId,
        planId: request.planId,
        startDate: request.billingPeriodStart.toISOString(),
        endDate: request.billingPeriodEnd.toISOString(),
        amount: request.amount,
        currency: request.currency,
        paymentMethod: 'mobile_money',
        paymentReference: request.paymentReference,
        status: 'active',
      })
    );

    return response.data.id;
  }

  /**
   * Renouvelle une subscription dans le customer-service
   */
  private async renewSubscriptionInCustomerService(request: {
    subscriptionId: string;
    paymentReference: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
  }): Promise<void> {
    const customerServiceUrl = this.configService.get<string>('CUSTOMER_SERVICE_URL', 'http://customer-service:3000');
    
    await firstValueFrom(
      this.httpService.post(`${customerServiceUrl}/subscriptions/${request.subscriptionId}/renew`, {
        endDate: request.billingPeriodEnd.toISOString(),
        paymentReference: request.paymentReference,
        renewalDate: request.billingPeriodStart.toISOString(),
      })
    );
  }

  /**
   * Calcule la fin de période de facturation
   */
  private calculateBillingPeriodEnd(startDate: Date, planType: string): Date {
    const endDate = new Date(startDate);
    
    switch (planType) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'annual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        // Default to monthly
        endDate.setMonth(endDate.getMonth() + 1);
    }
    
    return endDate;
  }

  /**
   * Récupère les transactions de subscription pour un customer
   */
  async getSubscriptionPayments(customerId: string) {
    return this.paymentRepository.find({
      where: {
        customerId,
        paymentType: 'subscription',
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupère une transaction de subscription par ID
   */
  async getSubscriptionPayment(transactionId: string) {
    const transaction = await this.paymentRepository.findOne({
      where: {
        id: transactionId,
        paymentType: 'subscription',
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Subscription payment ${transactionId} not found`);
    }

    return transaction;
  }
}