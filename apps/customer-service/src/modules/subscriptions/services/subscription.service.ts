import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

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

    // Publier événement
    await this.customerEventsProducer.emitSubscriptionCreated(savedSubscription);

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
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      order: { priceUSD: 'ASC' },
    });
  }
}
