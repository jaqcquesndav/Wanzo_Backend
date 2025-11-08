import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual, Like, Not, IsNull } from 'typeorm';
import {
  SubscriptionPlan,
  Subscription,
  Invoice,
  Transaction,
  InvoiceItem,
  Payment,
  TransactionStatus,
  PaymentStatus,
  PaymentMethod,
  InvoiceStatus as EntityInvoiceStatus,
  BillingCycle,
  SubscriptionStatus,
  PlanStatus,
  CustomerType,
  FeatureCode
} from '../entities/finance.entity';
import {
  SubscriptionPlanDto,
  SubscriptionPlanMetadataDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceDto,
  RecordManualPaymentDto,
  VerifyPaymentDto,
  PaymentDto,
  CreateTransactionDto,
  TransactionDto,
  FinancialSummaryDto,
  ListSubscriptionsQueryDto,
  ListInvoicesQueryDto,
  ListPaymentsQueryDto,
  ListTransactionsQueryDto,
  GetFinancialSummaryQueryDto,
  // Nouveaux DTOs pour la gestion des plans
  CreatePlanDto,
  UpdatePlanDto,
  DeployPlanDto,
  ArchivePlanDto,
  DetailedPlanDto,
  ListPlansQueryDto,
  PaginatedPlansDto,
  PlanEventDto,
  PlanAnalyticsDto,
} from '../dtos';
import { User } from '../../users/entities/user.entity';
import { EventsService } from '../../events/events.service';
import { InvoiceStatus as KafkaInvoiceStatus } from '@wanzobe/shared';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly eventsService: EventsService,
  ) {}

  // --- Subscription Plan Endpoints (Legacy) ---

  async listSubscriptionPlans(query: ListSubscriptionsQueryDto): Promise<SubscriptionPlanDto[]> {
    const where: FindOptionsWhere<SubscriptionPlan> = {};
    
    // Ajout de conditions seulement si ces propriétés existent dans la query
    if (query.billingCycle) {
      where.billingCycle = query.billingCycle as BillingCycle;
    }
    
    const plans = await this.subscriptionPlanRepository.find({ where });
    return plans.map(plan => this.mapToSubscriptionPlanDto(plan));
  }

  // === NOUVELLES MÉTHODES POUR LA GESTION DYNAMIQUE DES PLANS ===

  async listDynamicPlans(query: ListPlansQueryDto): Promise<PaginatedPlansDto> {
    const { page = 1, limit = 10, search, status, customerType, isActive, isVisible, sortBy = 'createdAt', sortDirection = 'DESC' } = query;
    
    const queryBuilder = this.subscriptionPlanRepository.createQueryBuilder('plan');

    // Filtres
    if (status) {
      queryBuilder.andWhere('plan.status = :status', { status });
    }
    
    if (customerType) {
      queryBuilder.andWhere('plan.customerType = :customerType', { customerType });
    }
    
    if (isActive !== undefined) {
      queryBuilder.andWhere('plan.isActive = :isActive', { isActive });
    }
    
    if (isVisible !== undefined) {
      queryBuilder.andWhere('plan.isVisible = :isVisible', { isVisible });
    }

    // Recherche
    if (search) {
      queryBuilder.andWhere(
        '(plan.name ILIKE :search OR plan.description ILIKE :search OR :search = ANY(plan.tags))',
        { search: `%${search}%` }
      );
    }

    // Tri
    queryBuilder.orderBy(`plan.${sortBy}`, sortDirection);

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [items, totalCount] = await queryBuilder.getManyAndCount();

    return {
      items: items.map(plan => this.mapToDetailedPlanDto(plan)),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getPlanById(planId: string): Promise<DetailedPlanDto> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id: planId },
      relations: ['previousVersion', 'nextVersions'],
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    return this.mapToDetailedPlanDto(plan);
  }

  async createPlan(dto: CreatePlanDto, userId: string): Promise<DetailedPlanDto> {
    // Valider que le nom n'existe pas déjà pour ce type de customer
    const existingPlan = await this.subscriptionPlanRepository.findOne({
      where: {
        name: dto.name,
        customerType: dto.customerType,
        status: Not(PlanStatus.DELETED),
      },
    });

    if (existingPlan) {
      throw new ConflictException(`A plan with name "${dto.name}" already exists for ${dto.customerType} customers`);
    }

    // Créer le nouveau plan
    const newPlan = this.subscriptionPlanRepository.create({
      ...dto,
      status: PlanStatus.DRAFT,
      version: 1,
      createdBy: userId,
      updatedBy: userId,
      analytics: {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        churnRate: 0,
        averageLifetimeValue: 0,
        monthlyRecurringRevenue: 0,
        conversionRate: 0,
        popularFeatures: [],
        customerSatisfactionScore: 0,
        supportTicketsPerMonth: 0,
      },
    });

    const savedPlan = await this.subscriptionPlanRepository.save(newPlan);

    // Émettre événement Kafka
    await this.emitPlanEvent('CREATED', savedPlan, userId);

    this.logger.log(`Created new plan: ${savedPlan.name} (${savedPlan.id}) by user ${userId}`);

    return this.mapToDetailedPlanDto(savedPlan);
  }

  async updatePlan(planId: string, dto: UpdatePlanDto, userId: string): Promise<DetailedPlanDto> {
    const plan = await this.subscriptionPlanRepository.findOne({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Vérifier que le plan peut être modifié
    if (plan.status === PlanStatus.DELETED) {
      throw new BadRequestException('Cannot update a deleted plan');
    }

    // Si le plan est déployé, créer une nouvelle version
    if (plan.status === PlanStatus.DEPLOYED) {
      const newVersion = new SubscriptionPlan();
      Object.assign(newVersion, plan, dto, {
        id: undefined,
        version: plan.version + 1,
        previousVersionId: plan.id,
        status: PlanStatus.DRAFT,
        updatedBy: userId,
        deployedAt: null,
        deployedBy: null,
        createdAt: undefined,
        updatedAt: undefined,
      });

      const savedNewVersion = await this.subscriptionPlanRepository.save(newVersion);
      
      // Émettre événement pour la nouvelle version
      await this.emitPlanEvent('UPDATED', savedNewVersion, userId);

      this.logger.log(`Created new version ${savedNewVersion.version} of plan ${plan.name} by user ${userId}`);

      return this.mapToDetailedPlanDto(savedNewVersion);
    } else {
      // Mettre à jour la version actuelle (brouillon)
      Object.assign(plan, dto, { updatedBy: userId });
      const updatedPlan = await this.subscriptionPlanRepository.save(plan);

      // Émettre événement
      await this.emitPlanEvent('UPDATED', updatedPlan, userId);

      this.logger.log(`Updated plan: ${updatedPlan.name} (${updatedPlan.id}) by user ${userId}`);

      return this.mapToDetailedPlanDto(updatedPlan);
    }
  }

  async deployPlan(planId: string, dto: DeployPlanDto, userId: string): Promise<DetailedPlanDto> {
    const plan = await this.subscriptionPlanRepository.findOne({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    if (!plan.canBeDeployed()) {
      throw new BadRequestException(`Plan cannot be deployed. Current status: ${plan.status}, Active: ${plan.isActive}`);
    }

    // Mettre à jour le statut
    plan.status = PlanStatus.DEPLOYED;
    plan.deployedAt = new Date();
    plan.deployedBy = userId;

    const deployedPlan = await this.subscriptionPlanRepository.save(plan);

    // Émettre événement Kafka vers Customer Service
    await this.emitPlanEvent('DEPLOYED', deployedPlan, userId, dto.deploymentNotes);

    this.logger.log(`Deployed plan: ${deployedPlan.name} (${deployedPlan.id}) by user ${userId}`);

    return this.mapToDetailedPlanDto(deployedPlan);
  }

  async archivePlan(planId: string, dto: ArchivePlanDto, userId: string): Promise<DetailedPlanDto> {
    const plan = await this.subscriptionPlanRepository.findOne({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    if (!plan.canBeArchived()) {
      throw new BadRequestException(`Plan cannot be archived. Current status: ${plan.status}`);
    }

    // Vérifier s'il y a des abonnements actifs
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: {
        planId: planId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (activeSubscriptions > 0 && !dto.replacementPlanId) {
      throw new BadRequestException(`Cannot archive plan with ${activeSubscriptions} active subscriptions without a replacement plan`);
    }

    // Archiver le plan
    plan.status = PlanStatus.ARCHIVED;
    plan.archivedAt = new Date();
    plan.archivedBy = userId;
    plan.isActive = false;
    plan.isVisible = false;

    // Ajouter la raison dans les métadonnées
    plan.metadata = {
      ...plan.metadata,
      archiveReason: dto.reason,
      replacementPlanId: dto.replacementPlanId,
    };

    const archivedPlan = await this.subscriptionPlanRepository.save(plan);

    // Émettre événement
    await this.emitPlanEvent('ARCHIVED', archivedPlan, userId, dto.reason);

    this.logger.log(`Archived plan: ${archivedPlan.name} (${archivedPlan.id}) by user ${userId}. Reason: ${dto.reason}`);

    return this.mapToDetailedPlanDto(archivedPlan);
  }

  async deletePlan(planId: string, userId: string): Promise<void> {
    const plan = await this.subscriptionPlanRepository.findOne({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    if (!plan.canBeDeleted()) {
      throw new BadRequestException(`Plan cannot be deleted. Current status: ${plan.status}`);
    }

    // Vérifier qu'il n'y a aucun abonnement (même inactif)
    const subscriptionCount = await this.subscriptionRepository.count({
      where: { planId: planId },
    });

    if (subscriptionCount > 0) {
      throw new BadRequestException(`Cannot delete plan with existing subscriptions. Archive it instead.`);
    }

    // Soft delete - marquer comme supprimé
    plan.status = PlanStatus.DELETED;
    plan.isActive = false;
    plan.isVisible = false;

    await this.subscriptionPlanRepository.save(plan);

    // Émettre événement
    await this.emitPlanEvent('DELETED', plan, userId);

    this.logger.log(`Deleted plan: ${plan.name} (${plan.id}) by user ${userId}`);
  }

  async duplicatePlan(planId: string, newName: string, userId: string): Promise<DetailedPlanDto> {
    const sourcePlan = await this.subscriptionPlanRepository.findOne({ where: { id: planId } });

    if (!sourcePlan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Créer une copie
    const duplicatedPlan = new SubscriptionPlan();
    Object.assign(duplicatedPlan, sourcePlan, {
      id: undefined,
      name: newName,
      status: PlanStatus.DRAFT,
      version: 1,
      previousVersionId: null,
      deployedAt: null,
      archivedAt: null,
      deployedBy: null,
      archivedBy: null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: undefined,
      updatedAt: undefined,
      analytics: {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        churnRate: 0,
        averageLifetimeValue: 0,
        monthlyRecurringRevenue: 0,
        conversionRate: 0,
        popularFeatures: [],
        customerSatisfactionScore: 0,
        supportTicketsPerMonth: 0,
      },
      metadata: {
        ...sourcePlan.metadata,
        duplicatedFrom: sourcePlan.id,
        duplicatedFromName: sourcePlan.name,
      },
    });

    const savedPlan = await this.subscriptionPlanRepository.save(duplicatedPlan);

    // Émettre événement
    await this.emitPlanEvent('CREATED', savedPlan, userId, `Duplicated from ${sourcePlan.name}`);

    this.logger.log(`Duplicated plan ${sourcePlan.name} to ${newName} (${savedPlan.id}) by user ${userId}`);

    return this.mapToDetailedPlanDto(savedPlan);
  }

  async getPlanAnalytics(planId: string): Promise<PlanAnalyticsDto> {
    const plan = await this.subscriptionPlanRepository.findOne({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Calculer les analytics en temps réel
    const totalSubscriptions = await this.subscriptionRepository.count({
      where: { planId: planId },
    });

    const activeSubscriptions = await this.subscriptionRepository.count({
      where: {
        planId: planId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const subscriptions = await this.subscriptionRepository.find({
      where: { planId: planId },
      order: { createdAt: 'DESC' },
    });

    // Calculer le churn rate et autres métriques
    const churnRate = this.calculateChurnRate(subscriptions);
    const averageLifetimeValue = this.calculateAverageLifetimeValue(subscriptions);
    const monthlyRecurringRevenue = this.calculateMRR(subscriptions);
    const conversionRate = this.calculateConversionRate(subscriptions);

    const analytics: PlanAnalyticsDto = {
      totalSubscriptions,
      activeSubscriptions,
      churnRate,
      averageLifetimeValue,
      monthlyRecurringRevenue,
      conversionRate,
      popularFeatures: plan.analytics?.popularFeatures || [],
      customerSatisfactionScore: plan.analytics?.customerSatisfactionScore || 0,
      supportTicketsPerMonth: plan.analytics?.supportTicketsPerMonth || 0,
    };

    // Mettre à jour les analytics du plan
    plan.analytics = analytics;
    await this.subscriptionPlanRepository.save(plan);

    return analytics;
  }

  // === MÉTHODES UTILITAIRES PRIVÉES ===

  private async emitPlanEvent(
    eventType: 'CREATED' | 'UPDATED' | 'DEPLOYED' | 'ARCHIVED' | 'DELETED',
    plan: SubscriptionPlan,
    userId: string,
    reason?: string,
  ): Promise<void> {
    const event: PlanEventDto = {
      planId: plan.id,
      eventType,
      planData: this.mapToDetailedPlanDto(plan),
      timestamp: new Date().toISOString(),
      triggeredBy: userId,
      reason,
    };

    // Utiliser le service Kafka existant
    await this.eventsService.emitPlanEvent(event);
  }

  private mapToDetailedPlanDto(plan: SubscriptionPlan): DetailedPlanDto {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      customerType: plan.customerType,
      price: Number(plan.price),
      annualPrice: Number(plan.annualPrice || plan.price * 12),
      annualDiscount: Number(plan.annualDiscount),
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      status: plan.status,
      version: plan.version,
      tokenConfig: plan.tokenConfig,
      features: plan.features || {},
      limits: plan.limits,
      isActive: plan.isActive,
      isVisible: plan.isVisible,
      sortOrder: plan.sortOrder,
      trialPeriodDays: plan.trialPeriodDays || 0,
      tags: plan.tags || [],
      analytics: plan.analytics,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      deployedAt: plan.deployedAt?.toISOString(),
      archivedAt: plan.archivedAt?.toISOString(),
      createdBy: plan.createdBy,
      updatedBy: plan.updatedBy,
      deployedBy: plan.deployedBy,
      archivedBy: plan.archivedBy,
      metadata: plan.metadata || {},
    };
  }

  private calculateChurnRate(subscriptions: Subscription[]): number {
    // Logique simplifiée pour calculer le taux de churn
    const canceledCount = subscriptions.filter(s => s.status === SubscriptionStatus.CANCELED).length;
    return subscriptions.length > 0 ? (canceledCount / subscriptions.length) * 100 : 0;
  }

  private calculateAverageLifetimeValue(subscriptions: Subscription[]): number {
    // Logique simplifiée pour calculer la valeur vie moyenne
    const totalValue = subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0);
    return subscriptions.length > 0 ? totalValue / subscriptions.length : 0;
  }

  private calculateMRR(subscriptions: Subscription[]): number {
    // Calculer le revenu récurrent mensuel
    const activeSubscriptions = subscriptions.filter(s => s.status === SubscriptionStatus.ACTIVE);
    return activeSubscriptions.reduce((sum, sub) => {
      const monthlyAmount = sub.billingCycle === BillingCycle.ANNUALLY ? Number(sub.amount) / 12 : Number(sub.amount);
      return sum + monthlyAmount;
    }, 0);
  }

  private calculateConversionRate(subscriptions: Subscription[]): number {
    // Logique simplifiée pour le taux de conversion
    const trialSubscriptions = subscriptions.filter(s => s.trialEndsAt != null);
    const convertedFromTrial = trialSubscriptions.filter(s => s.status === SubscriptionStatus.ACTIVE);
    return trialSubscriptions.length > 0 ? (convertedFromTrial.length / trialSubscriptions.length) * 100 : 0;
  }

  // === FIN DES NOUVELLES MÉTHODES ===

  // --- Subscription Endpoints ---

  async listSubscriptions(query: ListSubscriptionsQueryDto): Promise<{ items: SubscriptionDto[], totalCount: number, page: number, totalPages: number }> {
    const { page = 1, limit = 10, search, status, planId, customerId } = query;
    const where: FindOptionsWhere<Subscription> = {};

    if (status) where.status = status as SubscriptionStatus;
    if (planId) where.planId = planId;
    if (customerId) where.customerId = customerId;
    
    // Search implementation (simplified)
    if (search) {
      // Simplified search logic
    }

    const [items, totalCount] = await this.subscriptionRepository.findAndCount({
      where,
      relations: ['plan'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items: items.map(sub => this.mapToSubscriptionDto(sub)),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getSubscriptionById(subscriptionId: string): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });
    
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }
    
    return this.mapToSubscriptionDto(subscription);
  }

  async createSubscription(dto: CreateSubscriptionDto): Promise<SubscriptionDto> {
    const { customerId, planId } = dto;
    
    const customer = await this.userRepository.findOne({ where: { id: customerId }});
    if (!customer) throw new NotFoundException(`Customer with ID ${customerId} not found`);

    const plan = await this.subscriptionPlanRepository.findOne({ where: { id: planId }});
    if (!plan) throw new NotFoundException(`Plan with ID ${planId} not found`);

    const existingSubscription = await this.subscriptionRepository.findOne({
        where: { customerId, planId, status: SubscriptionStatus.ACTIVE }
    });
    
    if (existingSubscription) {
        throw new ConflictException('Customer already has an active subscription to this plan.');
    }

    const newSubscription = this.subscriptionRepository.create({
        ...dto,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        tokensIncluded: plan.includedTokens || 0,
        tokensUsed: 0,
        tokensRemaining: plan.includedTokens || 0,
        tokensRolledOver: 0,
        // Calculate end date based on billing cycle
    });
    
    const savedSubscription = await this.subscriptionRepository.save(newSubscription);
    
    // ✅ Émettre événement Kafka vers Customer Service
    await this.eventsService.publishSubscriptionCreated({
      subscriptionId: savedSubscription.id,
      userId: customerId,
      entityId: customerId,
      entityType: 'customer' as any,
      newPlan: plan.name as any,
      newStatus: 'active' as any,
      startDate: savedSubscription.startDate.toISOString(),
      endDate: savedSubscription.endDate?.toISOString() || '',
      changedBy: 'admin-service',
      timestamp: new Date().toISOString(),
    });
    
    return this.getSubscriptionById(savedSubscription.id);
  }

  async updateSubscription(subscriptionId: string, dto: UpdateSubscriptionDto): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepository.findOneBy({ id: subscriptionId });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }

    if (dto.planId) {
        const plan = await this.subscriptionPlanRepository.findOne({ where: { id: dto.planId }});
        if (!plan) throw new NotFoundException(`Plan with ID ${dto.planId} not found`);
        
        // Si le plan change, ajuster les tokens
        if (plan.id !== subscription.planId) {
          subscription.tokensIncluded = plan.includedTokens || 0;
          subscription.tokensRemaining = plan.includedTokens || 0;
        }
    }

    const previousStatus = subscription.status;
    const previousPlan = subscription.planId;
    
    Object.assign(subscription, dto);
    const updatedSubscription = await this.subscriptionRepository.save(subscription);
    
    // ✅ Émettre événement Kafka
    await this.eventsService.publishSubscriptionUpdated({
      subscriptionId: updatedSubscription.id,
      userId: updatedSubscription.customerId,
      entityId: updatedSubscription.customerId,
      entityType: 'customer' as any,
      previousPlan: previousPlan as any,
      newPlan: updatedSubscription.planId as any,
      previousStatus: previousStatus as any,
      newStatus: updatedSubscription.status as any,
      startDate: updatedSubscription.startDate.toISOString(),
      endDate: updatedSubscription.endDate?.toISOString() || '',
      changedBy: 'admin-service',
      timestamp: new Date().toISOString(),
    });
    
    return this.getSubscriptionById(updatedSubscription.id);
  }

  async cancelSubscription(subscriptionId: string, dto: CancelSubscriptionDto): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepository.findOneBy({ id: subscriptionId });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }
    
    if (subscription.status === SubscriptionStatus.CANCELED) {
        throw new ConflictException('Subscription is already canceled.');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    subscription.cancellationReason = dto.reason;
    subscription.canceledAt = new Date();
    
    const updatedSubscription = await this.subscriptionRepository.save(subscription);
    
    // ✅ Émettre événement Kafka
    await this.eventsService.publishSubscriptionCancelled({
      subscriptionId: updatedSubscription.id,
      userId: updatedSubscription.customerId,
      entityId: updatedSubscription.customerId,
      entityType: 'customer' as any,
      newPlan: updatedSubscription.planId as any,
      previousStatus: 'active' as any,
      newStatus: 'canceled' as any,
      startDate: updatedSubscription.startDate.toISOString(),
      endDate: updatedSubscription.endDate?.toISOString() || '',
      changedBy: 'admin-service',
      timestamp: new Date().toISOString(),
    });
    
    return this.mapToSubscriptionDto(updatedSubscription);
  }

  // --- Invoice Endpoints ---

  async listInvoices(query: ListInvoicesQueryDto): Promise<{ items: InvoiceDto[], totalCount: number, page: number, totalPages: number }> {
    const { page = 1, limit = 10, search, status, customerId, startDate, endDate } = query;
    const where: FindOptionsWhere<Invoice> = {};

    if (status) where.status = status as EntityInvoiceStatus;
    if (customerId) where.customerId = customerId;
    
    if (startDate && endDate) {
      where.issueDate = Between(new Date(startDate), new Date(endDate));
    }
    
    // Search implementation
    if (search) {
      // For search we'd typically use more complex queries or a dedicated search solution
      // Simplified example:
      where.invoiceNumber = Like(`%${search}%`);
    }

    const [items, totalCount] = await this.invoiceRepository.findAndCount({
        where,
        relations: ['items'],
        skip: (page - 1) * limit,
        take: limit,
        order: { issueDate: 'DESC' },
    });

    return {
        items: items.map(invoice => this.mapToInvoiceDto(invoice)),
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getInvoiceById(invoiceId: string): Promise<InvoiceDto> {
    const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId },
        relations: ['items'],
    });
    
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }
    
    return this.mapToInvoiceDto(invoice);
  }

  async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceDto> {
    const customer = await this.userRepository.findOne({ where: { id: dto.customerId }});
    if (!customer) throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);

    const newInvoice = this.invoiceRepository.create({
        ...dto,
        status: EntityInvoiceStatus.PENDING,
        // Generate invoice number logic
    });
    
    const savedInvoice = await this.invoiceRepository.save(newInvoice);
    
    await this.eventsService.publishInvoiceCreated({
      invoiceId: savedInvoice.id,
      customerId: savedInvoice.customerId,
      amount: savedInvoice.totalAmount,
      currency: savedInvoice.currency || 'USD',
      dueDate: savedInvoice.dueDate?.toISOString() || new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });
    
    return this.getInvoiceById(savedInvoice.id);
  }

  async updateInvoice(invoiceId: string, dto: UpdateInvoiceDto): Promise<InvoiceDto> {
    const invoice = await this.invoiceRepository.findOneBy({ id: invoiceId });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }
    
    if (invoice.status === EntityInvoiceStatus.PAID || invoice.status === EntityInvoiceStatus.CANCELED) {
        throw new ConflictException(`Cannot update a ${invoice.status} invoice.`);
    }
    
    const previousStatus = invoice.status;
    Object.assign(invoice, dto);
    const updatedInvoice = await this.invoiceRepository.save(invoice);
    
    // Check if status has changed
    if (previousStatus !== updatedInvoice.status) {
      // Map from entity status to shared Kafka enum status
      const prevKafkaStatus = this.mapToKafkaInvoiceStatus(previousStatus);
      const newKafkaStatus = this.mapToKafkaInvoiceStatus(updatedInvoice.status);
      
      await this.eventsService.publishInvoiceStatusChanged({
        invoiceId: updatedInvoice.id,
        previousStatus: prevKafkaStatus,
        newStatus: newKafkaStatus,
        timestamp: new Date().toISOString(),
      });
    }
    
    return this.mapToInvoiceDto(updatedInvoice);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOneBy({ id: invoiceId });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }
    
    if (invoice.status === EntityInvoiceStatus.PAID) {
        throw new ConflictException('Cannot delete a paid invoice.');
    }
    
    await this.invoiceRepository.remove(invoice);
  }

  // --- Payment Endpoints ---
  async listPayments(query: ListPaymentsQueryDto): Promise<{ items: PaymentDto[], totalCount: number, page: number, totalPages: number }> {
    const { page = 1, limit = 10, search, status, customerId } = query;
    const where: FindOptionsWhere<Transaction> = {};

    if (status) {
      // Conversion sécurisée entre les statuts de paiement et de transaction
      if (status === PaymentStatus.VERIFIED) {
        where.status = TransactionStatus.VERIFIED;
      } else if (status === PaymentStatus.REJECTED) {
        where.status = TransactionStatus.REJECTED;
      } else {
        where.status = TransactionStatus.PENDING;
      }
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    // Search implementation
    if (search) {
      where.reference = Like(`%${search}%`);
    }

    const [items, totalCount] = await this.transactionRepository.findAndCount({
        where,
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
    });

    return {
        items: items.map(transaction => this.mapToPaymentDto(transaction)),
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getPaymentById(paymentId: string): Promise<PaymentDto> {
    const transaction = await this.transactionRepository.findOne({
        where: { id: paymentId },
    });
    
    if (!transaction) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }
    
    return this.mapToPaymentDto(transaction);
  }
  async recordManualPayment(dto: RecordManualPaymentDto, adminUser: User): Promise<PaymentDto> {
    const customer = await this.userRepository.findOne({ where: { id: dto.customerId }});
    if (!customer) throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);

    const newTransaction = this.transactionRepository.create({
        customerId: dto.customerId,
        amount: dto.amount,
        currency: dto.currency,
        reference: dto.transactionReference,
        status: TransactionStatus.PENDING,
        description: dto.description,
        // Add invoice reference if available in your DTO
        // invoiceId: dto.invoiceId
    });
    
    const savedTransaction = await this.transactionRepository.save(newTransaction);
    
    // Only publish payment event if related to an invoice
    // You should add invoiceId to your DTO if needed
    // if (dto.invoiceId) {
    //   await this.eventsService.publishPaymentReceived({
    //     paymentId: savedTransaction.id,
    //     invoiceId: dto.invoiceId,
    //     customerId: dto.customerId,
    //     amount: dto.amount,
    //     currency: dto.currency,
    //     paymentDate: new Date().toISOString(),
    //     timestamp: new Date().toISOString(),
    //   });
    // }
    
    return this.getPaymentById(savedTransaction.id);
  }

  async verifyPayment(dto: VerifyPaymentDto, adminUser: User): Promise<PaymentDto> {
    const { paymentId, status, adminNotes } = dto;
    const transaction = await this.transactionRepository.findOneBy({ id: paymentId });
    
    if (!transaction) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }
    
    if (transaction.status !== TransactionStatus.PENDING) {
        throw new ConflictException('Payment is not in a pending state.');
    }

    // Conversion du statut PaymentStatus vers TransactionStatus
    let newStatus: TransactionStatus;
    if (status === PaymentStatus.VERIFIED) {
      newStatus = TransactionStatus.VERIFIED;
    } else if (status === PaymentStatus.REJECTED) {
      newStatus = TransactionStatus.REJECTED;
    } else {
      newStatus = TransactionStatus.PENDING;
    }

    transaction.status = newStatus;
    // Note: Les champs comme verifiedById, verifiedAt doivent être ajoutés à l'entité Transaction
    // pour une implémentation complète
    
    const updatedTransaction = await this.transactionRepository.save(transaction);

    // If the transaction is verified and related to an invoice (you'll need to add this field to your entity)
    // if (newStatus === TransactionStatus.VERIFIED && transaction.invoiceId) {
    //   const invoice = await this.invoiceRepository.findOneBy({ id: transaction.invoiceId });
    //   if (invoice) {
    //     const previousStatus = invoice.status;
    //     invoice.status = EntityInvoiceStatus.PAID;
    //     invoice.paidDate = new Date();
    //     await this.invoiceRepository.save(invoice);
    //     
    //     // Map from entity status to shared Kafka enum status
    //     const prevKafkaStatus = this.mapToKafkaInvoiceStatus(previousStatus);
    //     const newKafkaStatus = this.mapToKafkaInvoiceStatus(EntityInvoiceStatus.PAID);
    //     
    //     // Publish invoice status changed event
    //     await this.eventsService.publishInvoiceStatusChanged({
    //       invoiceId: invoice.id,
    //       previousStatus: prevKafkaStatus,
    //       newStatus: newKafkaStatus,
    //       timestamp: new Date().toISOString(),
    //     });
    //   }
    // }
    
    return this.mapToPaymentDto(updatedTransaction);
  }  // Helper method to map entity InvoiceStatus to shared Kafka InvoiceStatus
  private mapToKafkaInvoiceStatus(status: EntityInvoiceStatus): KafkaInvoiceStatus {
    switch(status) {      case EntityInvoiceStatus.PAID:
        return KafkaInvoiceStatus.PAID;
      case EntityInvoiceStatus.DRAFT:
        return KafkaInvoiceStatus.DRAFT;
      case EntityInvoiceStatus.SENT:
        return KafkaInvoiceStatus.SENT;
      case EntityInvoiceStatus.OVERDUE:
        return KafkaInvoiceStatus.OVERDUE;
      case EntityInvoiceStatus.CANCELED:
        return KafkaInvoiceStatus.CANCELLED;
      case EntityInvoiceStatus.PENDING:
        return KafkaInvoiceStatus.DRAFT; // Map PENDING to DRAFT in Kafka (ou autre valeur appropriée)
      default:
        return KafkaInvoiceStatus.DRAFT;
    }
  }

  // --- Financial Summary Endpoint ---

  async getFinancialSummary(query: GetFinancialSummaryQueryDto): Promise<FinancialSummaryDto> {
    const { period, customerId } = query;
    
    // Calculer la date de début selon la période
    const startDate = this.calculatePeriodStart(period);
    
    // 1. Calculer revenus totaux des paiements vérifiés
    const paymentRepo = this.transactionRepository.manager.getRepository(Payment);
    
    const totalRevenueQuery = paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.VERIFIED });
      
    if (startDate) {
      totalRevenueQuery.andWhere('payment.createdAt >= :startDate', { startDate });
    }
    
    if (customerId) {
      totalRevenueQuery.andWhere('payment.customerId = :customerId', { customerId });
    }
    
    const totalRevenueResult = await totalRevenueQuery.getRawOne();
    const totalRevenue = parseFloat(totalRevenueResult.total) || 0;

    // 2. Calculer revenus par mois
    const revenueByMonth = await this.calculateRevenueByMonth(startDate, customerId);
    
    // 3. Top customers par revenus
    const topCustomers = await this.getTopCustomersByRevenue(startDate, 5);
    
    // 4. Compter factures payées
    const paidInvoicesCount = await this.invoiceRepository.count({
      where: {
        status: EntityInvoiceStatus.PAID,
        ...(startDate && { createdAt: MoreThanOrEqual(startDate) }),
        ...(customerId && { customerId })
      }
    });
    
    // 5. Compter factures en attente
    const pendingInvoicesCount = await this.invoiceRepository.count({
      where: {
        status: EntityInvoiceStatus.PENDING,
        ...(customerId && { customerId })
      }
    });
    
    // 6. Calculer montants en attente
    const pendingAmountQuery = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount)', 'total')
      .where('invoice.status = :status', { status: EntityInvoiceStatus.PENDING })
      .andWhere(customerId ? 'invoice.customerId = :customerId' : '1=1', customerId ? { customerId } : {})
      .getRawOne();
    const pendingAmount = parseFloat(pendingAmountQuery.total) || 0;
    
    // 7. Calculer montants en retard
    const overdueAmountQuery = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount)', 'total')
      .where('invoice.status = :status', { status: EntityInvoiceStatus.OVERDUE })
      .andWhere(customerId ? 'invoice.customerId = :customerId' : '1=1', customerId ? { customerId } : {})
      .getRawOne();
    const overdueAmount = parseFloat(overdueAmountQuery.total) || 0;

    this.logger.log(`Financial summary calculated - Total Revenue: ${totalRevenue}, Paid Invoices: ${paidInvoicesCount}`);

    return {
      totalRevenue,
      pendingInvoices: pendingInvoicesCount,
      pendingAmount,
      overdueAmount,
      paidInvoices: paidInvoicesCount,
      revenueByMonth,
      topCustomers,
    };
  }

  private calculatePeriodStart(period?: string): Date | null {
    if (!period) return null;
    
    const now = new Date();
    switch (period.toLowerCase()) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return null;
    }
  }

  private async calculateRevenueByMonth(startDate: Date | null, customerId?: string): Promise<Record<string, number>> {
    const paymentRepo = this.transactionRepository.manager.getRepository(Payment);
    
    const query = paymentRepo
      .createQueryBuilder('payment')
      .select(`DATE_TRUNC('month', payment.createdAt)`, 'month')
      .addSelect('SUM(payment.amount)', 'revenue')
      .where('payment.status = :status', { status: PaymentStatus.VERIFIED })
      .groupBy(`DATE_TRUNC('month', payment.createdAt)`)
      .orderBy('month', 'ASC');

    if (startDate) {
      query.andWhere('payment.createdAt >= :startDate', { startDate });
    }
    
    if (customerId) {
      query.andWhere('payment.customerId = :customerId', { customerId });
    }

    const results = await query.getRawMany();
    
    const revenueByMonth: Record<string, number> = {};
    results.forEach(result => {
      const monthKey = new Date(result.month).toISOString().substring(0, 7); // YYYY-MM
      revenueByMonth[monthKey] = parseFloat(result.revenue) || 0;
    });

    return revenueByMonth;
  }

  private async getTopCustomersByRevenue(startDate: Date | null, limit: number = 5): Promise<Array<{ customerId: string; customerName: string; totalSpent: number }>> {
    const paymentRepo = this.transactionRepository.manager.getRepository(Payment);
    
    const query = paymentRepo
      .createQueryBuilder('payment')
      .select('payment.customerId', 'customerId')
      .addSelect('payment.customerName', 'customerName')
      .addSelect('SUM(payment.amount)', 'totalSpent')
      .where('payment.status = :status', { status: PaymentStatus.VERIFIED })
      .groupBy('payment.customerId, payment.customerName')
      .orderBy('totalSpent', 'DESC')
      .limit(limit);

    if (startDate) {
      query.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    const results = await query.getRawMany();
    
    return results.map(result => ({
      customerId: result.customerId,
      customerName: result.customerName,
      totalSpent: parseFloat(result.totalSpent) || 0
    }));
  }

  // --- Mappers ---

  private mapToSubscriptionPlanDto(plan: SubscriptionPlan): SubscriptionPlanDto {
    // Conversion du metadata en type SubscriptionPlanMetadataDto pour garantir la conformité
    const metadata: SubscriptionPlanMetadataDto = {
      maxUsers: plan.limits?.maxUsers || plan.metadata?.maxUsers || 0,
      storageLimit: plan.limits?.maxDataStorageGB ? `${plan.limits.maxDataStorageGB}GB` : plan.metadata?.storageLimit || '0GB'
    };
    
    // Convertir les features object en array de strings pour le DTO
    const featuresArray: string[] = plan.features 
      ? Object.entries(plan.features)
          .filter(([_, value]) => value.enabled === true)
          .map(([key, _]) => key)
      : [];
    
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: featuresArray,
      isActive: plan.isActive,
      trialPeriodDays: plan.trialPeriodDays || 0,
      metadata: metadata,
    };
  }

  private mapToSubscriptionDto(sub: Subscription): SubscriptionDto {
    return {
      id: sub.id,
      customerId: sub.customerId,
      customerName: '', // À remplir avec les données du client si nécessaire
      planId: sub.planId,
      planName: sub.plan?.name || '',
      status: sub.status,
      startDate: sub.startDate?.toISOString() || new Date().toISOString(),
      endDate: sub.endDate?.toISOString(),
      currentPeriodStart: sub.currentPeriodStart?.toISOString() || new Date().toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || new Date().toISOString(),
      nextBillingDate: sub.nextBillingDate?.toISOString(),
      amount: sub.amount || 0,
      currency: sub.currency || 'USD',
      billingCycle: sub.billingCycle,
      autoRenew: sub.autoRenew || false,
      paymentMethodId: sub.paymentMethodId,
      createdAt: sub.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: sub.updatedAt?.toISOString() || new Date().toISOString(),
      trialEndsAt: sub.trialEndsAt?.toISOString(),
      canceledAt: sub.canceledAt?.toISOString(),
      cancellationReason: sub.cancellationReason,
      metadata: sub.metadata || {},
    };
  }

  private mapToInvoiceDto(invoice: Invoice): InvoiceDto {
    // Calcul du sous-total à partir des éléments de la facture
    const subtotal = invoice.items?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0;
    
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: '', // À remplir avec les données du client si nécessaire
      amount: invoice.totalAmount,
      currency: invoice.currency,
      status: invoice.status,
      issueDate: invoice.issueDate?.toISOString() || new Date().toISOString(),
      dueDate: invoice.dueDate?.toISOString() || new Date().toISOString(),
      paidDate: invoice.paidDate?.toISOString(),
      items: invoice.items?.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
      })) || [],
      subtotal: subtotal,
      taxAmount: invoice.taxAmount || 0,
      discountAmount: invoice.discountAmount || 0,
      totalAmount: invoice.totalAmount,
      notes: invoice.notes,
    };
  }
  private mapToPaymentDto(transaction: Transaction): PaymentDto {
    // Conversion du statut de Transaction en PaymentStatus
    let paymentStatus: PaymentStatus;
    if (transaction.status === TransactionStatus.VERIFIED) {
      paymentStatus = PaymentStatus.VERIFIED;
    } else if (transaction.status === TransactionStatus.REJECTED) {
      paymentStatus = PaymentStatus.REJECTED;
    } else {
      paymentStatus = PaymentStatus.PENDING;
    }
    
    return {
        id: transaction.id,
        invoiceId: '', // À remplir si la transaction est liée à une facture
        customerId: transaction.customerId,
        customerName: '', // À remplir avec les données du client si nécessaire
        amount: transaction.amount,
        currency: transaction.currency || 'USD',
        method: PaymentMethod.OTHER, // Default payment method
        proofType: '', // Transaction entity needs a proofType property
        proofUrl: '', // Transaction entity needs a proofUrl property
        status: paymentStatus,
        transactionReference: transaction.reference || '',
        paidAt: transaction.createdAt?.toISOString() || new Date().toISOString(),
        createdAt: transaction.createdAt?.toISOString() || new Date().toISOString(),
        description: transaction.description || '',
        verifiedBy: '', // À remplir avec les données de l'utilisateur qui a vérifié si nécessaire
        verifiedAt: '', // Transaction entity needs a verifiedAt property
        metadata: {
          approvalNotes: '',
        },
    };
  }

  async sendInvoiceReminder(invoiceId: string): Promise<{ message: string }> {
    const invoice = await this.invoiceRepository.findOneBy({ id: invoiceId });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }
      if (invoice.status !== EntityInvoiceStatus.PENDING && invoice.status !== EntityInvoiceStatus.OVERDUE) {
      throw new ConflictException(`Invoice is not in a pending or overdue state.`);
    }
    
    // Logique d'envoi de rappel (email, notification, etc.)
    // Dans une implémentation réelle, cette méthode pourrait appeler un service de messagerie
    console.log(`Sending reminder for invoice ${invoice.invoiceNumber} to customer ${invoice.customerId}`);
    
    return { message: 'Reminder sent successfully.' };
  }

  /**
   * Crée ou met à jour un Payment depuis un événement Kafka de payment-service
   * Utilisé pour alimenter les calculations financières et dashboards
   */
  async createOrUpdatePaymentFromEvent(paymentData: {
    id: string;
    customerId: string;
    customerName: string;
    amount: number;
    currency: string;
    method: any;
    status: any;
    transactionReference: string;
    paidAt: Date;
    planId?: string;
    subscriptionId?: string;
    providerTransactionId?: string;
    metadata?: any;
  }): Promise<void> {
    const { Payment } = await import('../entities/finance.entity');
    const paymentRepo = this.transactionRepository.manager.getRepository(Payment);
    
    // Vérifier si le payment existe déjà
    let existingPayment = await paymentRepo.findOne({ 
      where: { transactionReference: paymentData.transactionReference } 
    });

    if (existingPayment) {
      // Mettre à jour payment existant
      existingPayment.status = paymentData.status;
      existingPayment.paidAt = paymentData.paidAt;
      existingPayment.metadata = {
        ...existingPayment.metadata,
        ...paymentData.metadata
      };
      
      await paymentRepo.save(existingPayment);
      this.logger.log(`Updated existing payment ${existingPayment.id}`);
    } else {
      // Créer nouveau payment
      const newPayment = paymentRepo.create({
        customerId: paymentData.customerId,
        customerName: paymentData.customerName,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: paymentData.method,
        status: paymentData.status,
        transactionReference: paymentData.transactionReference,
        paidAt: paymentData.paidAt,
        planId: paymentData.planId,
        subscriptionId: paymentData.subscriptionId,
        providerTransactionId: paymentData.providerTransactionId,
        metadata: paymentData.metadata
      });

      await paymentRepo.save(newPayment);
      this.logger.log(`Created new payment ${newPayment.id} for customer ${paymentData.customerId}`);
    }
  }

  /**
   * Méthode de test pour vérifier les calculs de revenus
   * Récupère quelques statistiques de base pour validation
   */
  async getPaymentStatistics(): Promise<{
    totalPayments: number;
    totalRevenue: number;
    verifiedPayments: number;
    subscriptionPayments: number;
  }> {
    const paymentRepo = this.transactionRepository.manager.getRepository(Payment);
    
    const totalPayments = await paymentRepo.count();
    
    const totalRevenueResult = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.VERIFIED })
      .getRawOne();
    const totalRevenue = parseFloat(totalRevenueResult.total) || 0;
    
    const verifiedPayments = await paymentRepo.count({
      where: { status: PaymentStatus.VERIFIED }
    });
    
    const subscriptionPayments = await paymentRepo.count({
      where: { planId: Not(IsNull()) }
    });

    return {
      totalPayments,
      totalRevenue,
      verifiedPayments,
      subscriptionPayments
    };
  }
}
