import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Subscription, SubscriptionStatus, SubscriptionPlan, SubscriptionPlanType } from '../entities/subscription.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { AccessControlService } from './access-control.service';

interface CreateSubscriptionDto {
  customerId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

interface UpdateSubscriptionDto {
  planId?: string;
  status?: SubscriptionStatus;
  endDate?: Date;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    private readonly customerEventsProducer: CustomerEventsProducer,
    private readonly accessControlService: AccessControlService,
  ) {}

  /**
   * Crée un nouvel abonnement
   */
  async create(createDto: CreateSubscriptionDto): Promise<Subscription> {
    // Vérifier si le plan existe
    const plan = await this.planRepository.findOne({ where: { id: createDto.planId } });
    if (!plan) {
      throw new Error(`Plan with ID ${createDto.planId} not found`);
    }

    // Créer le nouvel abonnement
    const subscription = this.subscriptionRepository.create({
      ...createDto,
      status: SubscriptionStatus.PENDING,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // Configurer automatiquement les limites d'accès basées sur le plan
    try {
      await this.accessControlService.updateCustomerFeatureLimits(
        createDto.customerId,
        savedSubscription.id,
        createDto.planId
      );
    } catch (error) {
      console.error('Erreur lors de la configuration des limites d\'accès:', error);
      // Ne pas faire échouer la création de l'abonnement si la configuration des limites échoue
    }

    // Publier événement standard
    await this.customerEventsProducer.emitSubscriptionCreated(savedSubscription);

    // Notifier l'Admin Service de la nouvelle souscription (communication bidirectionnelle)
    try {
      await this.customerEventsProducer.notifyAdminServiceSubscriptionCreated({
        id: savedSubscription.id,
        customerId: savedSubscription.customerId,
        planId: savedSubscription.planId,
        status: savedSubscription.status,
        startDate: createDto.startDate,
        endDate: createDto.endDate,
        amount: createDto.amount,
        currency: createDto.currency,
        metadata: createDto.metadata,
      });
    } catch (error) {
      console.error('Erreur lors de la notification à l\'Admin Service:', error);
      // Ne pas faire échouer la création de l'abonnement si la notification échoue
    }

    return savedSubscription;
  }

  /**
   * Récupère tous les abonnements d'un client
   */
  async findByCustomer(customerId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { customerId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupère un abonnement par son ID
   */
  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['plan', 'customer'],
    });

    if (!subscription) {
      throw new Error(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  /**
   * Récupère un abonnement par son ID. Alias pour findOne.
   */
  async findById(id: string): Promise<Subscription> {
    return this.findOne(id);
  }

  /**
   * Met à jour un abonnement
   */
  async update(id: string, updateDto: UpdateSubscriptionDto): Promise<Subscription> {
    const subscription = await this.findOne(id);

    // Mettre à jour les propriétés
    Object.assign(subscription, updateDto);

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Annule un abonnement
   */
  async cancel(id: string, reason?: string): Promise<Subscription> {
    const subscription = await this.findOne(id);

    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceledAt = new Date();
    subscription.cancelReason = reason || 'Cancelled by customer';
    subscription.autoRenew = false;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Active un abonnement
   */
  async activate(id: string): Promise<Subscription> {
    const subscription = await this.findOne(id);

    subscription.status = SubscriptionStatus.ACTIVE;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Récupère les abonnements qui vont bientôt expirer
   */
  async findExpiringSubscriptions(daysThreshold: number = 7): Promise<Subscription[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysThreshold);

    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: Between(today, futureDate),
        autoRenew: false,
      },
      relations: ['customer', 'plan'],
    });
  }

  /**
   * Récupère les abonnements expirés
   */
  async findExpiredSubscriptions(): Promise<Subscription[]> {
    const today = new Date();

    return this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThanOrEqual(today),
      },
      relations: ['customer', 'plan'],
    });
  }

  /**
   * Récupère les plans d'abonnement disponibles
   */
  async getSubscriptionPlans(customerType?: string): Promise<any[]> {
    const whereCondition: any = { 
      isActive: true, 
      isVisible: true 
    };
    
    if (customerType) {
      whereCondition.customerType = customerType === 'pme' ? 'sme' : customerType;
    }

    const plans = await this.planRepository.find({
      where: whereCondition,
      order: { sortOrder: 'ASC', priceUSD: 'ASC' },
    });
    
    // Transformer les plans pour correspondre à la structure attendue par le frontend
    return plans.map(plan => ({
      id: plan.id,
      configId: plan.configId,
      name: plan.name,
      description: plan.description,
      customerType: plan.customerType,
      planType: plan.tier,
      billingPeriod: plan.type,
      monthlyPriceUSD: this.calculateMonthlyPrice(plan),
      annualPriceUSD: this.calculateAnnualPrice(plan),
      annualDiscountPercentage: this.calculateDiscountPercentage(plan),
      tokenAllocation: plan.tokenConfig || plan.tokenAllocation || {
        monthlyTokens: plan.includedTokens,
        tokenRollover: true,
        maxRolloverMonths: 3
      },
      features: plan.features || {},
      limits: plan.limits || {},
      isPopular: plan.isPopular,
      isVisible: plan.isVisible,
      sortOrder: plan.sortOrder,
      tags: plan.tags || [],
      metadata: {
        ...plan.metadata,
        fromAdminService: !!plan.metadata?.adminServicePlanId,
        version: plan.metadata?.version || 1
      }
    }));
  }

  /**
   * Récupère un plan spécifique par son ID
   */
  async getSubscriptionPlan(planId: string): Promise<any | null> {
    const plan = await this.planRepository.findOne({
      where: [
        { id: planId },
        { configId: planId }
      ]
    });

    if (!plan) {
      return null;
    }

    return {
      id: plan.id,
      configId: plan.configId,
      name: plan.name,
      description: plan.description,
      customerType: plan.customerType,
      planType: plan.tier,
      billingPeriod: plan.type,
      monthlyPriceUSD: this.calculateMonthlyPrice(plan),
      annualPriceUSD: this.calculateAnnualPrice(plan),
      annualDiscountPercentage: this.calculateDiscountPercentage(plan),
      tokenAllocation: plan.tokenConfig || plan.tokenAllocation || {
        monthlyTokens: plan.includedTokens,
        tokenRollover: true,
        maxRolloverMonths: 3
      },
      features: plan.features || {},
      limits: plan.limits || {},
      isPopular: plan.isPopular,
      isVisible: plan.isVisible,
      sortOrder: plan.sortOrder,
      tags: plan.tags || [],
      metadata: {
        ...plan.metadata,
        fromAdminService: !!plan.metadata?.adminServicePlanId,
        version: plan.metadata?.version || 1
      }
    };
  }

  // Méthodes utilitaires privées pour les calculs de prix

  private calculateMonthlyPrice(plan: SubscriptionPlan): number {
    switch (plan.type) {
      case SubscriptionPlanType.MONTHLY:
        return plan.priceUSD;
      case SubscriptionPlanType.QUARTERLY:
        return plan.priceUSD / 3;
      case SubscriptionPlanType.ANNUAL:
        return plan.priceUSD / 12;
      default:
        return plan.priceUSD;
    }
  }

  private calculateAnnualPrice(plan: SubscriptionPlan): number {
    switch (plan.type) {
      case SubscriptionPlanType.MONTHLY:
        return plan.priceUSD * 12;
      case SubscriptionPlanType.QUARTERLY:
        return plan.priceUSD * 4;
      case SubscriptionPlanType.ANNUAL:
        return plan.priceUSD;
      default:
        return plan.priceUSD * 12;
    }
  }

  private calculateDiscountPercentage(plan: SubscriptionPlan): number {
    if (plan.discounts && plan.discounts.length > 0) {
      const annualDiscount = plan.discounts.find(d => d.code === 'ANNUAL');
      if (annualDiscount) {
        return annualDiscount.percentage;
      }
    }

    // Calcul automatique de la réduction pour les plans annuels
    if (plan.type === SubscriptionPlanType.ANNUAL) {
      const monthlyEquivalent = plan.priceUSD / 12;
      const discountPercentage = ((monthlyEquivalent * 12 - plan.priceUSD) / (monthlyEquivalent * 12)) * 100;
      return Math.round(discountPercentage);
    }

    return 0;
  }

  /**
   * Récupère l'abonnement actuel d'un utilisateur par son Auth0 ID
   */
  async getCurrentSubscriptionByAuth0Id(auth0Id: string): Promise<Subscription | null> {
    // D'abord, trouver l'utilisateur par son Auth0 ID
    const userRepository = this.subscriptionRepository.manager.getRepository('User');
    const user = await userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      return null;
    }

    // Ensuite, trouver l'abonnement actuel du customer lié à cet utilisateur
    return this.subscriptionRepository.findOne({
      where: {
        customerId: user.customerId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['customer', 'plan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Annule l'abonnement actuel d'un utilisateur par son Auth0 ID
   */
  async cancelCurrentSubscriptionByAuth0Id(auth0Id: string, reason?: string): Promise<Subscription> {
    const subscription = await this.getCurrentSubscriptionByAuth0Id(auth0Id);
    
    if (!subscription) {
      throw new Error('Aucun abonnement actuel trouvé pour cet utilisateur');
    }

    return this.cancel(subscription.id, reason);
  }

  /**
   * Change le plan d'abonnement d'un utilisateur par son Auth0 ID
   */
  async changePlanByAuth0Id(auth0Id: string, planId: string): Promise<Subscription> {
    const currentSubscription = await this.getCurrentSubscriptionByAuth0Id(auth0Id);
    
    if (!currentSubscription) {
      throw new Error('Aucun abonnement actuel trouvé pour cet utilisateur');
    }

    // Vérifier si le nouveau plan existe
    const newPlan = await this.planRepository.findOne({ where: { id: planId } });
    if (!newPlan) {
      throw new Error(`Plan avec l'ID ${planId} non trouvé`);
    }

    // Mettre à jour l'abonnement actuel
    const updatedSubscription = await this.update(currentSubscription.id, { planId });

    // Mettre à jour les limites d'accès pour le nouveau plan
    try {
      await this.accessControlService.updateCustomerFeatureLimits(
        updatedSubscription.customerId,
        updatedSubscription.id,
        planId
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour des limites d\'accès pour le nouveau plan:', error);
    }

    // Publier un événement de changement de plan
    await this.customerEventsProducer.emitSubscriptionEvent({
      type: 'subscription.plan_changed',
      subscriptionId: updatedSubscription.id,
      customerId: updatedSubscription.customerId,
      oldPlanId: currentSubscription.planId,
      newPlanId: planId,
      timestamp: new Date(),
    });

    return updatedSubscription;
  }

  /**
   * Renouveler un abonnement
   */
  async renew(subscriptionId: string, renewalData?: { endDate?: Date; autoRenew?: boolean }): Promise<Subscription> {
    const subscription = await this.findById(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.EXPIRED) {
      throw new Error('Only active or expired subscriptions can be renewed');
    }

    // Calculer la nouvelle date de fin (par défaut, ajouter 1 an)
    const currentEndDate = subscription.endDate || new Date();
    const newEndDate = renewalData?.endDate || new Date(currentEndDate.getTime() + (365 * 24 * 60 * 60 * 1000));

    // Mettre à jour l'abonnement
    const updatedSubscription = await this.update(subscriptionId, {
      status: SubscriptionStatus.ACTIVE,
      endDate: newEndDate,
      autoRenew: renewalData?.autoRenew ?? subscription.autoRenew
    });

    // Publier un événement de renouvellement
    await this.customerEventsProducer.emitSubscriptionEvent({
      type: 'subscription.renewed',
      subscriptionId: updatedSubscription.id,
      customerId: updatedSubscription.customerId,
      timestamp: new Date(),
      metadata: {
        oldEndDate: currentEndDate,
        newEndDate: newEndDate
      }
    });

    return updatedSubscription;
  }
}
