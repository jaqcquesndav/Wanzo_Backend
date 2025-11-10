import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SUBSCRIPTION_PAYMENT_TOPICS, KafkaEventBuilder } from '../events/subscription-payment.events';

import { SubscriptionPlan, Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { User } from '../../system-users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

export interface InitiateSubscriptionPaymentDto {
  planId: string;
  clientPhone: string;
  telecom: 'AM' | 'OM' | 'MP' | 'AF';
  channel?: 'merchant' | 'client';
  clientReference?: string;
}

export interface PaymentServiceResponse {
  transactionId: string;
  providerTransactionId?: string;
  sessionId?: string;
  status: 'pending' | 'success' | 'failed';
  httpStatus: number;
  message?: string;
  plan?: {
    id: string;
    name: string;
    tokensIncluded: number;
  };
}

@Injectable()
export class SubscriptionMobilePaymentService {
  private readonly logger = new Logger(SubscriptionMobilePaymentService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  /**
   * Initie un paiement de plan d'abonnement directement pour un customer
   * Cette méthode traite le paiement au niveau client
   */
  async initiateSubscriptionPaymentByCustomerId(
    customerId: string,
    paymentData: InitiateSubscriptionPaymentDto
  ): Promise<PaymentServiceResponse> {
    this.logger.log(`Initiating subscription payment for customer ${customerId}, plan ${paymentData.planId}`);

    // 1. Trouver le customer
    const customer = await this.customerRepository.findOne({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Client ${customerId} non trouvé`);
    }

    // 2. Valider le plan
    const plan = await this.planRepository.findOne({
      where: { 
        id: paymentData.planId,
        isActive: true,
        isVisible: true 
      }
    });

    if (!plan) {
      throw new BadRequestException(`Plan ${paymentData.planId} non trouvé ou indisponible`);
    }

    // 3. Vérifier l'éligibilité du client pour ce plan
    this.validateCustomerPlanEligibility(customer, plan);

    // 4. Vérifier les abonnements actifs du client
    const currentSubscription = await this.subscriptionRepository.findOne({
      where: {
        customerId: customer.id,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' }
    });

    return this.processSubscriptionPayment(customer, plan, paymentData, currentSubscription || undefined);
  }

  /**
   * Initie un paiement de plan d'abonnement pour un utilisateur connecté (via Auth0)
   * Cette méthode est appelée par le frontend via le customer-service
   */
  async initiateSubscriptionPaymentByAuth0Id(
    auth0Id: string,
    paymentData: InitiateSubscriptionPaymentDto
  ): Promise<PaymentServiceResponse> {
    this.logger.log(`Initiating subscription payment for user ${auth0Id}, plan ${paymentData.planId}`);

    // 1. Trouver l'utilisateur et son customer
    const user = await this.userRepository.findOne({ 
      where: { auth0Id },
      relations: ['customer'] 
    });

    if (!user || !user.customer) {
      throw new NotFoundException('Utilisateur ou client non trouvé');
    }

    // 2. Déléguer au traitement par customerId
    return this.initiateSubscriptionPaymentByCustomerId(user.customer.id, paymentData);
  }

  /**
   * Traite le paiement d'abonnement pour un customer et un plan donnés
   */
  private async processSubscriptionPayment(
    customer: Customer,
    plan: SubscriptionPlan,
    paymentData: InitiateSubscriptionPaymentDto,
    currentSubscription?: Subscription
  ): Promise<PaymentServiceResponse> {
    this.logger.log(`Processing subscription payment for customer ${customer.id} (${customer.type}), plan ${plan.id} (${plan.name})`);

    // 1. Calculer le montant et la devise
    const amount = plan.priceLocal || plan.priceUSD;
    const currency = plan.currency || 'CDF';

    // 2. Préparer les données pour payment-service
    const paymentServicePayload = {
      clientPhone: paymentData.clientPhone,
      amount: amount,
      currency: currency,
      telecom: paymentData.telecom,
      channel: paymentData.channel || 'merchant',
      clientReference: paymentData.clientReference,
      
      // Données spécifiques à la subscription - CENTRÉ SUR LE CUSTOMER
      planId: plan.id,
      customerId: customer.id,
      planType: plan.type,
      planName: plan.name,
      tokensIncluded: plan.includedTokens,
      existingSubscriptionId: currentSubscription?.id,
      
      metadata: {
        isRenewal: !!currentSubscription,
        isUpgrade: false, // TODO: logique d'upgrade
        billingCycleStart: new Date().toISOString(),
        billingCycleEnd: this.calculateBillingCycleEnd(new Date(), plan.type).toISOString(),
        customerType: customer.type,
        customerName: customer.name,
      }
    };

    try {
      // 3. Émettre événement Kafka vers payment-service (communication inter-services)
      const kafkaPaymentRequest = {
        eventType: 'subscription.payment.request',
        requestId: `req_${Date.now()}_${customer.id}`,
        customerId: customer.id,
        planId: plan.id,
        paymentData: {
          clientPhone: paymentData.clientPhone,
          amount: amount,
          currency: currency,
          telecom: paymentData.telecom,
          channel: paymentData.channel || 'merchant',
          clientReference: paymentData.clientReference,
        },
        planDetails: {
          planName: plan.name,
          planType: plan.type,
          tokensIncluded: plan.includedTokens,
        },
        subscriptionContext: {
          existingSubscriptionId: currentSubscription?.id,
          isRenewal: !!currentSubscription,
          billingCycleStart: new Date().toISOString(),
          billingCycleEnd: this.calculateBillingCycleEnd(new Date(), plan.type).toISOString(),
        },
        customerContext: {
          customerType: customer.type,
          customerName: customer.name,
        },
        timestamp: new Date().toISOString()
      };

      // Créer l'événement Kafka standardisé
      const paymentRequestEvent = KafkaEventBuilder.createPaymentRequestEvent({
        requestId: kafkaPaymentRequest.requestId,
        customerId: customer.id,
        planId: plan.id,
        paymentData: kafkaPaymentRequest.paymentData,
        planDetails: kafkaPaymentRequest.planDetails,
        subscriptionContext: kafkaPaymentRequest.subscriptionContext,
        customerContext: kafkaPaymentRequest.customerContext,
      });

      // Émettre l'événement Kafka vers payment-service
      await this.customerEventsProducer.emitSubscriptionEvent(paymentRequestEvent);

      // Pour l'instant, simuler une réponse synchrone
      // TODO: Implémenter la gestion asynchrone avec écoute des événements de réponse
      const paymentResponse: PaymentServiceResponse = {
        transactionId: `tx_${Date.now()}_${customer.id}`,
        status: 'pending',
        httpStatus: 202,
        message: 'Demande de paiement envoyée au payment-service via Kafka',
        plan: {
          id: plan.id,
          name: plan.name,
          tokensIncluded: plan.includedTokens
        }
      };

      // 4. Émettre événement de demande de paiement initiée - CENTRÉ SUR LE CUSTOMER
      await this.customerEventsProducer.emitSubscriptionEvent({
        type: 'subscription.payment.initiated',
        subscriptionId: currentSubscription?.id || 'new',
        customerId: customer.id,
        planId: plan.id,
        timestamp: new Date(),
        metadata: {
          transactionId: paymentResponse.transactionId,
          amount,
          currency,
          paymentMethod: 'mobile_money',
          telecom: paymentData.telecom,
          customerType: customer.type,
        }
      });

      this.logger.log(`Payment initiated successfully for customer ${customer.id}: ${paymentResponse.transactionId}`);
      return paymentResponse;

    } catch (error: any) {
      this.logger.error(`Failed to initiate payment for customer ${customer.id}: ${error.message}`, error.stack);
      
      // Émettre événement d'échec d'initiation - CENTRÉ SUR LE CUSTOMER
      await this.customerEventsProducer.emitSubscriptionEvent({
        type: 'subscription.payment.initiation_failed',
        subscriptionId: currentSubscription?.id || 'new',
        customerId: customer.id,
        planId: plan.id,
        timestamp: new Date(),
        metadata: {
          error: error.message,
          amount,
          currency,
          customerType: customer.type,
        }
      });

      throw new BadRequestException(`Échec de l'initiation du paiement: ${error.message}`);
    }
  }

  /**
   * Traite une notification de paiement réussi du payment-service
   * Cette méthode peut être appelée via Kafka ou webhook
   */
  async handleSuccessfulPayment(paymentData: {
    transactionId: string;
    customerId: string;
    planId: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
  }): Promise<Subscription> {
    this.logger.log(`Processing successful payment for customer ${paymentData.customerId}`);

    const plan = await this.planRepository.findOne({ where: { id: paymentData.planId } });
    if (!plan) {
      throw new NotFoundException(`Plan ${paymentData.planId} not found`);
    }

    if (paymentData.subscriptionId) {
      // Renouvellement d'une subscription existante
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: paymentData.subscriptionId }
      });

      if (!subscription) {
        throw new NotFoundException(`Subscription ${paymentData.subscriptionId} not found`);
      }

      subscription.endDate = paymentData.billingPeriodEnd;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.lastPaymentDate = new Date();
      subscription.lastPaymentAmount = paymentData.amount;
      subscription.paymentReference = paymentData.transactionId;

      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      await this.customerEventsProducer.emitSubscriptionEvent({
        type: 'subscription.renewed',
        subscriptionId: subscription.id,
        customerId: paymentData.customerId,
        planId: paymentData.planId,
        timestamp: new Date(),
        metadata: {
          transactionId: paymentData.transactionId,
          newEndDate: paymentData.billingPeriodEnd,
        }
      });

      return updatedSubscription;
    } else {
      // Nouvelle subscription
      const newSubscription = this.subscriptionRepository.create({
        customerId: paymentData.customerId,
        planId: paymentData.planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: paymentData.billingPeriodStart,
        endDate: paymentData.billingPeriodEnd,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: 'mobile_money',
        paymentReference: paymentData.transactionId,
        autoRenew: false,
        lastPaymentDate: new Date(),
        lastPaymentAmount: paymentData.amount,
        billingContactEmail: '', // TODO: récupérer depuis user
        createdBy: 'payment-service',
        
        // Configuration des tokens depuis le plan
        tokensIncluded: plan.includedTokens,
        tokensUsed: 0,
        tokensRemaining: plan.includedTokens,
        tokensRolloverAllowed: plan.tokenConfig?.rolloverAllowed || false,
        tokenRates: plan.tokenConfig?.tokenRates,
        subscriptionFeatures: plan.features,
        subscriptionLimits: plan.limits,
      });

      const savedSubscription = await this.subscriptionRepository.save(newSubscription);

      await this.customerEventsProducer.emitSubscriptionCreated(savedSubscription);

      return savedSubscription;
    }
  }

  /**
   * Récupère les plans disponibles pour un customer par son ID
   * Filtre selon le type de client (SME ou FINANCIAL_INSTITUTION)
   */
  async getAvailablePlansForCustomerId(customerId: string): Promise<SubscriptionPlan[]> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Client ${customerId} non trouvé`);
    }

    // Convertir le type de customer vers le format des plans
    const planCustomerType = this.mapCustomerTypeToplanType(customer.type);

    this.logger.log(`Récupération des plans pour client ${customerId} de type ${customer.type} -> ${planCustomerType}`);

    return this.planRepository.find({
      where: [
        { customerType: planCustomerType, isActive: true, isVisible: true },
        { customerType: 'all', isActive: true, isVisible: true }  // Plans universels s'ils existent
      ],
      order: { sortOrder: 'ASC', priceUSD: 'ASC' }
    });
  }

  /**
   * Récupère les plans disponibles pour un utilisateur (via Auth0)
   * Délègue au traitement par customerId
   */
  async getAvailablePlansForAuth0Id(auth0Id: string): Promise<SubscriptionPlan[]> {
    const user = await this.userRepository.findOne({
      where: { auth0Id },
      relations: ['customer']
    });

    if (!user || !user.customer) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Déléguer au traitement centré sur le customer
    return this.getAvailablePlansForCustomerId(user.customer.id);
  }

  /**
   * Convertit le type de customer vers le format attendu par les plans
   */
  private mapCustomerTypeToplanType(customerType: string): string {
    switch (customerType) {
      case 'sme':
        return 'sme';
      case 'financial':
        return 'financial_institution';
      default:
        this.logger.warn(`Unknown customer type: ${customerType}, defaulting to 'sme'`);
        return 'sme';
    }
  }

  /**
   * Valide si un client peut accéder à un plan spécifique
   */
  private validateCustomerPlanEligibility(customer: Customer, plan: SubscriptionPlan): void {
    const planCustomerType = this.mapCustomerTypeToplanType(customer.type);
    
    if (plan.customerType !== 'all' && plan.customerType !== planCustomerType) {
      const customerTypeDisplay = customer.type === 'sme' ? 'PME' : 'Institutions Financières';
      const planTypeDisplay = plan.customerType === 'sme' ? 'PME' : 'Institutions Financières';
      
      this.logger.warn(
        `Plan eligibility validation failed: Customer ${customer.id} (${customer.type}) attempted to access plan ${plan.id} (${plan.customerType})`
      );
      
      throw new BadRequestException(
        `Le plan "${plan.name}" est réservé aux ${planTypeDisplay}. Votre compte est de type ${customerTypeDisplay}.`
      );
    }

    this.logger.log(`Plan eligibility validated: Customer ${customer.id} (${customer.type}) can access plan ${plan.id} (${plan.customerType})`);
  }

  /**
   * Calcule la fin de période de facturation
   */
  private calculateBillingCycleEnd(startDate: Date, planType: string): Date {
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
        endDate.setMonth(endDate.getMonth() + 1);
    }
    
    return endDate;
  }

  /**
   * Vérifie le statut d'un paiement via payment-service
   */
  async checkPaymentStatus(transactionId: string): Promise<any> {
    try {
      const paymentServiceUrl = this.configService.get<string>('PAYMENT_SERVICE_URL', 'http://payment-service:3000');
      const response = await firstValueFrom(
        this.httpService.get(`${paymentServiceUrl}/subscriptions/payments/${transactionId}`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to check payment status: ${error.message}`);
      return null;
    }
  }

  /**
   * Récupère l'historique des paiements d'abonnement pour un customer
   */
  async getCustomerPaymentHistory(customerId: string): Promise<any[]> {
    try {
      const paymentServiceUrl = this.configService.get<string>('PAYMENT_SERVICE_URL', 'http://payment-service:3000');
      const response = await firstValueFrom(
        this.httpService.get(`${paymentServiceUrl}/subscriptions/payments/customer/${customerId}/history`)
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.error(`Failed to get customer payment history: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère l'historique des paiements pour un utilisateur (via Auth0)
   * Délègue au traitement par customerId
   */
  async getPaymentHistoryByAuth0Id(auth0Id: string): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { auth0Id },
      relations: ['customer']
    });

    if (!user || !user.customer) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.getCustomerPaymentHistory(user.customer.id);
  }
}