import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerType } from '../../customers/entities/customer.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../../billing/entities/payment.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

export interface StripeCustomerData {
  customerId: string;
  stripeCustomerId: string;
  email: string;
  name: string;
}

export interface CardPaymentRequest {
  customerId: string;
  planId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string; // Stripe Payment Method ID
  saveCard?: boolean;
  returnUrl?: string; // Pour 3D Secure
}

export interface CardPaymentResult {
  success: boolean;
  paymentIntentId: string;
  status: string;
  clientSecret?: string; // Pour confirmer côté client si nécessaire
  requiresAction?: boolean;
  nextAction?: any;
  paymentId?: string; // Notre ID interne
  message: string;
}

export interface RecurringSetupRequest {
  customerId: string;
  planId: string;
  paymentMethodId: string;
  trialDays?: number;
}

export interface RecurringSetupResult {
  success: boolean;
  subscriptionId: string;
  stripeSubscriptionId: string;
  status: string;
  nextPaymentDate: Date;
  message: string;
}

@Injectable()
export class StripePaymentService {
  private readonly logger = new Logger(StripePaymentService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private customerEventsProducer: CustomerEventsProducer,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-10-28.acacia',
    });
  }

// Fonctions utilitaires pour mapper les statuts
  private mapStripeStatusToPaymentStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return PaymentStatus.COMPLETED;
      case 'processing':
      case 'requires_action':
      case 'requires_confirmation':
      case 'requires_payment_method':
        return PaymentStatus.PENDING;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  private mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'trialing':
        return SubscriptionStatus.TRIAL;
      case 'incomplete':
      case 'incomplete_expired':
        return SubscriptionStatus.PENDING;
      case 'unpaid':
      case 'paused':
        return SubscriptionStatus.SUSPENDED;
      default:
        return SubscriptionStatus.INACTIVE;
    }
  }

  private mapPaymentServiceStatusToLocal(paymentServiceStatus: string): PaymentStatus {
    switch (paymentServiceStatus) {
      case 'succeeded':
        return PaymentStatus.COMPLETED;
      case 'pending':
      case 'requires_action':
      case 'requires_confirmation':
      case 'requires_payment_method':
        return PaymentStatus.PENDING;
      case 'failed':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Crée ou récupère un customer Stripe
   */
  async getOrCreateStripeCustomer(customerId: string): Promise<StripeCustomerData> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId }
    });

    if (!customer) {
      throw new BadRequestException('Client non trouvé');
    }

    // Vérifier s'il a déjà un customer Stripe
    if (customer.stripeCustomerId) {
      try {
        await this.stripe.customers.retrieve(customer.stripeCustomerId);
        return {
          customerId: customer.id,
          stripeCustomerId: customer.stripeCustomerId,
          email: customer.email,
          name: customer.name
        };
      } catch (error) {
        // Le customer Stripe n'existe plus, on va en créer un nouveau
        this.logger.warn(`Stripe customer ${customer.stripeCustomerId} not found, creating new one`);
      }
    }

    // Créer un nouveau customer Stripe
    const stripeCustomer = await this.stripe.customers.create({
      email: customer.email,
      name: customer.name,
      metadata: {
        wanzoCustomerId: customer.id,
        customerType: customer.type || 'unknown'
      }
    });

    // Sauvegarder l'ID Stripe
    await this.customerRepository.update(customerId, {
      stripeCustomerId: stripeCustomer.id
    });

    return {
      customerId: customer.id,
      stripeCustomerId: stripeCustomer.id,
      email: customer.email,
      name: customer.name
    };
  }

  /**
   * Traite un paiement par carte unique - Via Kafka vers payment-service
   * SÉCURITÉ: Validation stricte des inputs + délégation sécurisée
   */
  async processCardPayment(request: CardPaymentRequest): Promise<CardPaymentResult> {
    try {
      const { customerId, planId, amount, currency, paymentMethodId, saveCard = false, returnUrl } = request;

      // SÉCURITÉ: Validation stricte du montant
      if (!amount || amount <= 0 || amount > 1000000 || !Number.isFinite(amount)) {
        throw new BadRequestException('Montant invalide');
      }

      // SÉCURITÉ: Validation de la devise
      if (!currency || !['USD', 'EUR', 'CDF'].includes(currency.toUpperCase())) {
        throw new BadRequestException('Devise non supportée');
      }

      // Récupérer les informations du client
      const customer = await this.customerRepository.findOne({
        where: { id: customerId }
      });

      if (!customer) {
        throw new BadRequestException('Client non trouvé');
      }

      // Récupérer les informations du plan
      const subscription = await this.subscriptionRepository.findOne({
        where: { customerId, planId },
        relations: ['plan']
      });

      if (!subscription) {
        throw new BadRequestException('Abonnement non trouvé');
      }

      // Créer ou récupérer le customer Stripe (pour la continuité)
      const stripeCustomer = await this.getOrCreateStripeCustomer(customerId);

      // SÉCURITÉ: Construire l'événement Kafka avec données validées et sanitisées
      const paymentEvent = {
        eventType: 'stripe.payment.request',
        customerId,
        subscriptionPlanId: planId,
        amount: Math.round(amount * 100) / 100, // SÉCURITÉ: Arrondir aux centimes
        currency: currency.toUpperCase(),
        paymentMethodId,
        customerInfo: {
          name: customer.name?.trim() || 'Unknown', // SÉCURITÉ: Sanitisation
          email: customer.email?.toLowerCase()?.trim() || '',
          type: customer.type === CustomerType.FINANCIAL ? 'financial' as const : 'sme' as const,
          country: customer.address?.country?.trim() || 'Unknown',
          industry: customer.industry?.trim() || 'Unknown'
        },
        planInfo: {
          name: subscription.plan?.name?.trim() || 'Plan d\'abonnement',
          type: subscription.plan?.type?.trim() || 'subscription',
          tokensIncluded: subscription.plan?.includedTokens || 0
        },
        paymentOptions: {
          savePaymentMethod: !!saveCard,
          returnUrl: returnUrl?.trim() || '',
          requiresSetupIntent: false
        },
        subscriptionContext: {
          existingSubscriptionId: subscription.id,
          isRenewal: subscription.status === 'active',
          setupRecurring: false
        },
        metadata: {
          stripeCustomerId: stripeCustomer.stripeCustomerId,
          source: 'customer-service-subscription',
          requestTime: new Date().toISOString()
        }
      };

      // Émettre l'événement via le producer Kafka
      await this.customerEventsProducer.emitSubscriptionEvent({
        type: 'stripe.payment.initiated',
        subscriptionId: subscription.id,
        customerId,
        planId,
        timestamp: new Date(),
        metadata: {
          amount,
          currency,
          paymentMethod: 'card',
          paymentMethodId,
          stripeCustomerId: stripeCustomer.stripeCustomerId
        }
      });

      // Créer notre enregistrement de paiement interne
      const payment = this.paymentRepository.create({
        customerId,
        amount,
        currency,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        metadata: {
          stripeCustomerId: stripeCustomer.stripeCustomerId,
          paymentMethodId,
          source: 'kafka-payment-service',
          subscriptionId: subscription.id
        }
      });

      const savedPayment = await this.paymentRepository.save(payment);

      // Retourner une réponse immédiate (le paiement sera traité de manière asynchrone)
      const result: CardPaymentResult = {
        success: false, // Pending, sera mis à jour via Kafka
        paymentIntentId: '', // Sera fourni par le payment-service via Kafka
        status: 'pending',
        paymentId: savedPayment.id,
        requiresAction: false,
        message: 'Demande de paiement envoyée au payment-service. Réponse asynchrone attendue.'
      };

      // SÉCURITÉ: Logging sécurisé sans données sensibles
      this.logger.log(`Card payment request sent via Kafka for customer ${customerId}`, {
        amount: Math.round(amount * 100) / 100,
        currency: currency.toUpperCase(),
        planId,
        paymentId: savedPayment.id,
        hasPaymentMethod: !!paymentMethodId,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error: any) {
      this.logger.error('Error processing card payment via Kafka', { 
        request, 
        error: error?.message 
      });
      
      throw new BadRequestException(error.message || 'Erreur lors du traitement du paiement');
    }
  }

  /**
   * Configure un abonnement récurrent avec Stripe
   */
  async setupRecurringPayment(request: RecurringSetupRequest): Promise<RecurringSetupResult> {
    try {
      const { customerId, planId, paymentMethodId, trialDays = 0 } = request;

      // Créer ou récupérer le customer Stripe
      const stripeCustomer = await this.getOrCreateStripeCustomer(customerId);

      // Récupérer les détails du plan
      const subscription = await this.subscriptionRepository.findOne({
        where: { customerId, planId },
        relations: ['plan']
      });

      if (!subscription) {
        throw new BadRequestException('Abonnement non trouvé');
      }

      // Attacher le payment method au customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomer.stripeCustomerId,
      });

      // Définir comme méthode de paiement par défaut
      await this.stripe.customers.update(stripeCustomer.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Créer le produit Stripe si nécessaire
      const product = await this.getOrCreateStripeProduct(subscription.plan);

      // Créer le prix Stripe si nécessaire
      const price = await this.getOrCreateStripePrice(product.id, subscription.plan);

      // Créer l'abonnement Stripe
      const stripeSubscriptionData: Stripe.SubscriptionCreateParams = {
        customer: stripeCustomer.stripeCustomerId,
        items: [
          {
            price: price.id,
          },
        ],
        default_payment_method: paymentMethodId,
        metadata: {
          wanzoCustomerId: customerId,
          wanzoSubscriptionId: subscription.id,
          planId
        },
        expand: ['latest_invoice.payment_intent'],
      };

      // Ajouter période d'essai si spécifiée
      if (trialDays > 0) {
        stripeSubscriptionData.trial_period_days = trialDays;
      }

      const stripeSubscription = await this.stripe.subscriptions.create(stripeSubscriptionData);

      // Mettre à jour notre abonnement avec l'ID Stripe
      await this.subscriptionRepository.update(subscription.id, {
        stripeSubscriptionId: stripeSubscription.id,
        paymentMethodId,
        autoRenew: true,
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000)
      });

      this.logger.log(`Recurring payment setup completed: ${stripeSubscription.id}`, {
        customerId,
        planId
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        nextPaymentDate: new Date(stripeSubscription.current_period_end * 1000),
        message: `Abonnement récurrent configuré avec succès`
      };

    } catch (error) {
      this.logger.error('Error setting up recurring payment', { request, error });
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Erreur configuration récurrence: ${error.message}`);
      }
      
      throw new BadRequestException('Erreur lors de la configuration du paiement récurrent');
    }
  }

  /**
   * Annule un abonnement récurrent
   */
  async cancelRecurringPayment(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId }
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new BadRequestException('Abonnement Stripe non trouvé');
    }

    try {
      await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      
      await this.subscriptionRepository.update(subscriptionId, {
        autoRenew: false,
        canceledAt: new Date(),
        cancelReason: 'user_cancelled'
      });

      this.logger.log(`Recurring payment cancelled: ${subscription.stripeSubscriptionId}`);

    } catch (error) {
      this.logger.error('Error cancelling recurring payment', { subscriptionId, error });
      throw new BadRequestException('Erreur lors de l\'annulation de l\'abonnement');
    }
  }

  /**
   * Gère les webhooks Stripe - Délègue UNIQUEMENT au payment-service via Kafka
   * SÉCURITÉ: Validation signature stricte + délégation exclusive (pas de double traitement)
   */
  async handleWebhook(signature: string, payload: string): Promise<void> {
    try {
      this.logger.log('Webhook Stripe reçu - validation et délégation sécurisée');

      // SÉCURITÉ: Validation obligatoire de la signature
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        this.logger.error('STRIPE_WEBHOOK_SECRET manquant - webhook rejeté');
        throw new BadRequestException('Configuration webhook Stripe manquante');
      }

      // SÉCURITÉ: Validation signature Stripe (protection anti-replay et authenticité)
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      this.logger.log(`Webhook Stripe validé: ${event.type} (${event.id})`);

      // SÉCURITÉ: Délégation EXCLUSIVE au payment-service via Kafka
      // Pas de traitement local pour éviter le double traitement
      await this.customerEventsProducer.emitSubscriptionEvent({
        type: 'stripe.webhook.received',
        subscriptionId: this.extractSubscriptionId(event) || 'unknown',
        customerId: this.extractCustomerId(event) || 'unknown',
        timestamp: new Date(),
        metadata: {
          eventType: event.type,
          eventId: event.id,
          // SÉCURITÉ: signature et rawPayload supprimés (pas d'exposition dans Kafka)
          processedAt: new Date().toISOString(),
          source: 'customer-service-webhook-handler'
        }
      });

      // SÉCURITÉ: Le payment-service traitera TOUT le business logic
      // Aucun traitement local pour éviter les incohérences

      this.logger.log(`Webhook Stripe délégué avec succès: ${event.type}`);

    } catch (error: any) {
      // SÉCURITÉ: Rejet strict en cas d'erreur de validation
      this.logger.error('Webhook Stripe rejeté - signature invalide ou erreur critique', { 
        error: error?.message,
        hasSignature: !!signature,
        payloadLength: payload?.length || 0
      });
      
      // SÉCURITÉ: Toujours rejeter les webhooks invalides
      throw new BadRequestException(`Webhook Stripe invalide: ${error.message}`);
    }
  }

  /**
   * Utilitaires privés
   */
  private async getOrCreateStripeProduct(plan: any): Promise<Stripe.Product> {
    // Chercher si le produit existe déjà
    const products = await this.stripe.products.list({
      limit: 100
    });
    
    const existingProduct = products.data.find(p => 
      p.metadata && p.metadata.wanzoPlanId === plan.id
    );

    if (existingProduct) {
      return existingProduct;
    }

    // Créer un nouveau produit
    return this.stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        wanzoPlanId: plan.id,
        customerType: plan.customerType
      }
    });
  }

  private async getOrCreateStripePrice(
    productId: string,
    plan: any
  ): Promise<Stripe.Price> {
    // Chercher si le prix existe déjà
    const prices = await this.stripe.prices.list({
      product: productId,
      limit: 100
    });
    
    const existingPrice = prices.data.find(p => 
      p.metadata && p.metadata.wanzoPlanId === plan.id
    );

    if (existingPrice) {
      return existingPrice;
    }

    // Créer un nouveau prix
    return this.stripe.prices.create({
      product: productId,
      unit_amount: Math.round(plan.price * 100),
      currency: plan.currency.toLowerCase(),
      recurring: {
        interval: plan.billingCycle === 'annual' ? 'year' : 'month',
      },
      metadata: {
        wanzoPlanId: plan.id
      }
    });
  }

  private mapStripeStatusToInternal(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'succeeded': 'verified',
      'pending': 'pending',
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'pending',
      'requires_capture': 'pending',
      'canceled': 'rejected',
      'failed': 'rejected'
    };

    return statusMap[stripeStatus] || 'pending';
  }

  private getPaymentStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      'succeeded': 'Paiement réussi',
      'pending': 'Paiement en cours',
      'requires_payment_method': 'Méthode de paiement requise',
      'requires_confirmation': 'Confirmation requise',
      'requires_action': 'Action requise (vérification 3D Secure)',
      'processing': 'Paiement en cours de traitement',
      'requires_capture': 'Paiement autorisé, capture requise',
      'canceled': 'Paiement annulé',
      'failed': 'Paiement échoué'
    };

    return messages[status] || 'Statut inconnu';
  }

  // SÉCURITÉ: Handlers webhook supprimés - tout le traitement se fait dans payment-service
  // pour éviter le double traitement et assurer la cohérence des données
  
  /**
   * DEPRECATED: Ces méthodes ont été supprimées pour des raisons de sécurité
   * Tout le traitement des webhooks Stripe se fait maintenant dans le payment-service
   * via Kafka pour éviter le double traitement et assurer la cohérence des données.
   * 
   * Les mises à jour de paiements et abonnements sont gérées par le payment-response-consumer
   * qui écoute les événements du payment-service.
   */



  /**
   * Extrait l'ID de l'abonnement à partir de l'événement Stripe
   */
  private extractSubscriptionId(event: Stripe.Event): string | null {
    try {
      const obj = event.data.object as any;
      return obj.subscription || obj.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Extrait l'ID du client à partir de l'événement Stripe
   */
  private extractCustomerId(event: Stripe.Event): string | null {
    try {
      const obj = event.data.object as any;
      return obj.customer || obj.client_reference_id || null;
    } catch {
      return null;
    }
  }
}