import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual, Like } from 'typeorm';
import {
  SubscriptionPlan,
  Subscription,
  Invoice,
  Transaction,
  InvoiceItem,
  TransactionStatus,
  PaymentStatus,
  InvoiceStatus as EntityInvoiceStatus,
  BillingCycle,
  SubscriptionStatus
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
} from '../dtos';
import { User } from '../../users/entities/user.entity';
import { EventsService } from '../../events/events.service';
import { InvoiceStatus as KafkaInvoiceStatus } from '@wanzo/shared/events/kafka-config';

@Injectable()
export class FinanceService {
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

  // --- Subscription Plan Endpoints ---

  async listSubscriptionPlans(query: ListSubscriptionsQueryDto): Promise<SubscriptionPlanDto[]> {
    const where: FindOptionsWhere<SubscriptionPlan> = {};
    
    // Ajout de conditions seulement si ces propriétés existent dans la query
    if (query.billingCycle) {
      where.billingCycle = query.billingCycle as BillingCycle;
    }
    
    const plans = await this.subscriptionPlanRepository.find({ where });
    return plans.map(plan => this.mapToSubscriptionPlanDto(plan));
  }

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
        // Calculate end date based on billing cycle
    });
    
    const savedSubscription = await this.subscriptionRepository.save(newSubscription);
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
    }

    Object.assign(subscription, dto);
    const updatedSubscription = await this.subscriptionRepository.save(subscription);
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
    
    // Logique simplifiée pour la démo
    // Dans une implémentation réelle, cela impliquerait des requêtes plus complexes
    
    return {
        totalRevenue: 0,
        pendingInvoices: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        paidInvoices: 0,
        revenueByMonth: {},
        topCustomers: [],
    };
  }

  // --- Mappers ---

  private mapToSubscriptionPlanDto(plan: SubscriptionPlan): SubscriptionPlanDto {
    // Conversion du metadata en type SubscriptionPlanMetadataDto pour garantir la conformité
    const metadata: SubscriptionPlanMetadataDto = {
      maxUsers: plan.metadata?.maxUsers || 0,
      storageLimit: plan.metadata?.storageLimit || '0GB'
    };
    
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features || [],
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
        method: undefined, // Transaction entity needs a method property
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
}
