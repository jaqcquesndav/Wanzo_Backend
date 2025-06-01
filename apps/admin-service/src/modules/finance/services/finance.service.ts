import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  SubscriptionPlan,
  CustomerSubscription,
  Invoice,
  Transaction,
  PlanStatus,
  SubscriptionStatus,
  TransactionStatus, 
  InvoiceStatus,
} from '../entities/finance.entity';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanQueryParamsDto,
  SubscriptionPlanDto,
  CreateCustomerSubscriptionDto,
  UpdateCustomerSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionQueryParamsDto,
  CustomerSubscriptionDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryParamsDto,
  InvoiceDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryParamsDto,
  TransactionDto,
  RevenueStatisticsDto,
  SubscriptionStatisticsDto,
  FinanceDashboardDto,
} from '../dtos';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(CustomerSubscription)
    private customerSubscriptionRepository: Repository<CustomerSubscription>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>
  ) {}

  // Subscription Plans
  async findAllPlans(queryParams: SubscriptionPlanQueryParamsDto): Promise<SubscriptionPlanDto[]> {
    const { customerType, status } = queryParams;
    const where: FindOptionsWhere<SubscriptionPlan> = {};

    if (status) {
      where.status = status as PlanStatus;
    }
    
    let plans = await this.subscriptionPlanRepository.find({
      where,
      order: { basePriceUSD: 'ASC' }
    });

    // Filter by customerType if provided
    if (customerType) {
      plans = plans.filter(plan => 
        plan.targetCustomerTypes.includes(customerType as any)
      );
    }

    return plans;
  }

  async findOnePlan(id: string): Promise<SubscriptionPlanDto> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id }
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  async createPlan(createDto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanDto> {
    // Check if plan with same name exists
    const existingPlan = await this.subscriptionPlanRepository.findOne({
      where: { name: createDto.name }
    });

    if (existingPlan) {
      throw new ConflictException('Subscription plan with this name already exists');
    }

    const newPlan = this.subscriptionPlanRepository.create(createDto);
    return this.subscriptionPlanRepository.save(newPlan);
  }

  async updatePlan(id: string, updateDto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanDto> {
    const plan = await this.findOnePlan(id);

    // Check if updating name and if it would conflict
    if (updateDto.name && updateDto.name !== plan.name) {
      const existingPlan = await this.subscriptionPlanRepository.findOne({
        where: { name: updateDto.name }
      });

      if (existingPlan) {
        throw new ConflictException('Subscription plan with this name already exists');
      }
    }

    // Update only provided fields
    Object.assign(plan, updateDto);
    return this.subscriptionPlanRepository.save(plan);
  }

  async removePlan(id: string): Promise<void> {
    const plan = await this.subscriptionPlanRepository.findOne({ where: { id } }); 
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    
    // Check if plan has active subscriptions
    const activeSubscriptions = await this.customerSubscriptionRepository.count({
      where: {
        planId: id,
        status: SubscriptionStatus.ACTIVE
      }
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException('Cannot delete plan with active subscriptions');
    }

    await this.subscriptionPlanRepository.remove(plan); 
  }

  // Customer Subscriptions
  async findAllSubscriptions(queryParams: SubscriptionQueryParamsDto): Promise<{
    subscriptions: CustomerSubscriptionDto[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const { customerId, status, planId, page = 1, limit = 10 } = queryParams;
    const where: FindOptionsWhere<CustomerSubscription> = {};

    if (customerId) where.customerId = customerId;
    if (status) where.status = status as SubscriptionStatus;
    if (planId) where.planId = planId;

    const [subscriptions, total] = await this.customerSubscriptionRepository.findAndCount({
      where,
      relations: ['plan'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return {
      subscriptions,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async findOneSubscription(id: string): Promise<CustomerSubscriptionDto> {
    const subscription = await this.customerSubscriptionRepository.findOne({
      where: { id },
      relations: ['plan']
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async createSubscription(createDto: CreateCustomerSubscriptionDto): Promise<CustomerSubscriptionDto> {
    // Verify plan exists
    await this.findOnePlan(createDto.planId);

    // Check if customer already has an active subscription
    const existingSubscription = await this.customerSubscriptionRepository.findOne({
      where: {
        customerId: createDto.customerId,
        status: SubscriptionStatus.ACTIVE
      }
    });

    if (existingSubscription) {
      throw new ConflictException('Customer already has an active subscription');
    }

    const newSubscription = this.customerSubscriptionRepository.create(createDto);
    return this.customerSubscriptionRepository.save(newSubscription);
  }

  async updateSubscription(id: string, updateDto: UpdateCustomerSubscriptionDto): Promise<CustomerSubscriptionDto> {
    const subscription = await this.findOneSubscription(id);
    
    // If updating plan, verify it exists
    if (updateDto.planId) {
      await this.findOnePlan(updateDto.planId);
    }

    // Update only provided fields
    Object.assign(subscription, updateDto);
    return this.customerSubscriptionRepository.save(subscription);
  }

  async cancelSubscription(id: string, cancelDto: CancelSubscriptionDto): Promise<CustomerSubscriptionDto> {
    const subscription = await this.findOneSubscription(id);
    
    if (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.TRIALING) {
      throw new BadRequestException('Only active or trialing subscriptions can be canceled');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceledAt = new Date();
    subscription.cancellationReason = cancelDto.reason;

    return this.customerSubscriptionRepository.save(subscription);
  }

  // Invoices
  async findAllInvoices(queryParams: InvoiceQueryParamsDto): Promise<{
    invoices: InvoiceDto[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const { customerId, status, startDate, endDate, page = 1, limit = 10 } = queryParams;
    const where: FindOptionsWhere<Invoice> = {};

    if (customerId) where.customerId = customerId;
    if (status) where.status = status as InvoiceStatus; 
      // Date range filtering
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return {
      invoices,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async findOneInvoice(id: string): Promise<InvoiceDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id }
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async createInvoice(createDto: CreateInvoiceDto): Promise<InvoiceDto> {
    const newInvoice = this.invoiceRepository.create(createDto);
    return this.invoiceRepository.save(newInvoice);
  }

  async updateInvoice(id: string, updateDto: UpdateInvoiceDto): Promise<InvoiceDto> {
    const invoice = await this.findOneInvoice(id);

    // Update only provided fields
    Object.assign(invoice, updateDto);
    return this.invoiceRepository.save(invoice);
  }

  async removeInvoice(id: string): Promise<void> {
    const invoiceEntity = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoiceEntity) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    await this.invoiceRepository.remove(invoiceEntity);
  }

  // Transactions
  async findAllTransactions(queryParams: TransactionQueryParamsDto): Promise<{
    transactions: TransactionDto[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const { customerId, type, status, startDate, endDate, page = 1, limit = 10 } = queryParams;
    const where: FindOptionsWhere<Transaction> = {};

    if (customerId) where.customerId = customerId;
    if (type) where.type = type as any; 
    if (status) where.status = status as TransactionStatus; 
    
    // Date range filtering
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = Between(new Date(startDate), new Date());
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return {
      transactions,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async findOneTransaction(id: string): Promise<TransactionDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id }
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async createTransaction(createDto: CreateTransactionDto): Promise<TransactionDto> {
    const newTransaction = this.transactionRepository.create(createDto);
    return this.transactionRepository.save(newTransaction);
  }

  async updateTransaction(id: string, updateDto: UpdateTransactionDto): Promise<TransactionDto> {
    const transaction = await this.findOneTransaction(id);

    // Update only provided fields
    Object.assign(transaction, updateDto);
    return this.transactionRepository.save(transaction);
  }

  // Dashboard and Statistics
  async getRevenueStatistics(startDate?: string, endDate?: string): Promise<RevenueStatisticsDto> {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(end.getDate() - 30));
    
    // Query for revenue data between dates
    const transactions = await this.transactionRepository.find({
      where: {
        status: TransactionStatus.SUCCEEDED, // Corrected: Use SUCCEEDED from the enum
        createdAt: Between(start, end)
      }
    });

    // Calculate statistics
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Group by month for monthly revenue
    const monthlyRevenue: { [key: string]: number } = {}; 
    transactions.forEach(t => {
      const month = t.createdAt.toISOString().substring(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + t.amount;
    });

    // Convert to array for charting
    const revenueByMonth: { month: string; amount: number }[] = Object.entries(monthlyRevenue).map(([month, amount]) => ({ 
      month,
      amount: amount as number
    }));

    return {
      totalRevenue,
      revenueByMonth, // This now matches the DTO
      transactionCount: transactions.length,
      averageTransactionValue: transactions.length ? totalRevenue / transactions.length : 0
    };
  }

  async getSubscriptionStatistics(): Promise<SubscriptionStatisticsDto> {
    // Active subscriptions count
    const activeSubscriptionsCount = await this.customerSubscriptionRepository.count({
      where: { status: SubscriptionStatus.ACTIVE }
    });

    // Subscriptions by plan
    const rawSubscriptionsByPlan = await this.customerSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan') 
      .select('plan.name', 'planName') 
      .addSelect('COUNT(subscription.id)', 'count')
      .where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
      .groupBy('plan.name') 
      .getRawMany();

    const subscriptionsByPlanMap: { [key: string]: number } = {};
    rawSubscriptionsByPlan.forEach(item => {
      subscriptionsByPlanMap[item.planName] = parseInt(item.count, 10);
    });

    const activeSubscriptions = await this.customerSubscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan']
    });

    const mrr = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.plan?.basePriceUSD || 0);
    }, 0);

    return {
      activeSubscriptions: activeSubscriptionsCount,
      subscriptionsByPlan: subscriptionsByPlanMap, // This now matches the DTO
      mrr,
      averageSubscriptionValue: activeSubscriptionsCount ? mrr / activeSubscriptionsCount : 0
    };
  }

  async getFinanceDashboard(startDate?: string, endDate?: string): Promise<FinanceDashboardDto> {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(end.getDate() - 30));

    const [revenueStats, subscriptionStats, recentTransactions, pendingInvoices] = await Promise.all([
      this.getRevenueStatistics(start.toISOString().split('T')[0], end.toISOString().split('T')[0]),
      this.getSubscriptionStatistics(),
      this.transactionRepository.find({
        where: { createdAt: MoreThanOrEqual(new Date(new Date().setDate(new Date().getDate() - 30))) }, 
        order: { createdAt: 'DESC' },
        take: 10
      }),
      this.invoiceRepository.find({
        where: { status: InvoiceStatus.OPEN }, // Corrected: Use OPEN from the enum
        order: { dueDate: 'ASC' },
        take: 10
      })
    ]);

    return {
      revenueStatistics: revenueStats,
      subscriptionStatistics: subscriptionStats,
      recentTransactions, 
      pendingInvoices, 
    };
  }
}
