import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, LessThan } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { User } from '../../users/entities/user.entity';

interface CreateInvoiceDto {
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  notes?: string;
  billingAddress?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  metadata?: Record<string, any>;
}

interface CreatePaymentDto {
  customerId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod | string;
  transactionId?: string;
  paymentGateway?: string;
  paymentDate?: Date;
  notes?: string;
  gatewayResponse?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  /**
   * Génère un numéro d'invoice unique
   */
  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `INV-${year}${month}`;
    
    const latestInvoice = await this.invoiceRepository.find({
      where: { invoiceNumber: Like(`${prefix}%`) },
      order: { invoiceNumber: 'DESC' },
      take: 1,
    });
    
    let sequence = 1;
    if (latestInvoice.length > 0) {
      const lastNumber = latestInvoice[0].invoiceNumber;
      const lastSequence = parseInt(lastNumber.split('-')[2], 10);
      sequence = lastSequence + 1;
    }
    
    return `${prefix}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Crée une nouvelle facture
   */
  async createInvoice(createDto: CreateInvoiceDto): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber();
    
    const invoice = this.invoiceRepository.create({
      ...createDto,
      invoiceNumber,
      status: InvoiceStatus.DRAFT,
      amountPaid: 0,
    });
    
    return this.invoiceRepository.save(invoice);
  }

  /**
   * Publie une facture (change le statut de DRAFT à ISSUED)
   */
  async issueInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findInvoiceById(id);
    
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be issued');
    }
    
    invoice.status = InvoiceStatus.ISSUED;
    return this.invoiceRepository.save(invoice);
  }

  /**
   * Récupère une facture par son ID
   */
  async findInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['customer', 'subscription', 'payments'],
    });
    
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    
    return invoice;
  }

  /**
   * Récupère les factures d'un client
   */
  async findInvoicesByCustomer(
    customerId: string,
    page = 1,
    limit = 10,
    status?: InvoiceStatus
  ): Promise<[Invoice[], number]> {
    const query = this.invoiceRepository.createQueryBuilder('invoice')
      .where('invoice.customerId = :customerId', { customerId });
      
    if (status) {
      query.andWhere('invoice.status = :status', { status });
    }
    
    return query
      .orderBy('invoice.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  /**
   * Enregistre un paiement
   */
  async recordPayment(createDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create({
      customerId: createDto.customerId,
      invoiceId: createDto.invoiceId,
      amount: createDto.amount,
      currency: createDto.currency,
      paymentMethod: createDto.paymentMethod as PaymentMethod,
      transactionId: createDto.transactionId,
      paymentGateway: createDto.paymentGateway,
      paymentDate: createDto.paymentDate || new Date(),
      notes: createDto.notes,
      gatewayResponse: createDto.gatewayResponse,
      metadata: createDto.metadata,
      status: PaymentStatus.COMPLETED,
    });
    
    const savedPayment = await this.paymentRepository.save(payment);
    
    // Si le paiement est lié à une facture, mettre à jour le statut de la facture
    if (createDto.invoiceId) {
      await this.updateInvoiceAfterPayment(createDto.invoiceId);
    }
    
    return savedPayment;
  }

  /**
   * Met à jour le statut d'une facture après un paiement
   */
  private async updateInvoiceAfterPayment(invoiceId: string): Promise<void> {
    const invoice = await this.findInvoiceById(invoiceId);
    const payments = await this.paymentRepository.find({
      where: { invoiceId, status: PaymentStatus.COMPLETED },
    });
    
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    invoice.amountPaid = totalPaid;
    
    // Déterminer le nouveau statut de la facture
    if (totalPaid >= Number(invoice.amount)) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidDate = new Date();
    } else if (totalPaid > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }
    
    await this.invoiceRepository.save(invoice);
  }

  /**
   * Récupère les paiements d'un client
   */
  async findPaymentsByCustomer(
    customerId: string,
    page = 1,
    limit = 10
  ): Promise<[Payment[], number]> {
    return this.paymentRepository.findAndCount({
      where: { customerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['invoice'],
    });
  }

  /**
   * Récupère les factures en retard de paiement
   */
  async findOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date();
    
    return this.invoiceRepository.find({
      where: {
        status: InvoiceStatus.ISSUED,
        dueDate: LessThan(today),
      },
      relations: ['customer'],
    });
  }

  /**
   * Marque les factures en retard
   */
  async markOverdueInvoices(): Promise<number> {
    const today = new Date();
    const result = await this.invoiceRepository.update(
      {
        status: InvoiceStatus.ISSUED,
        dueDate: LessThan(today),
      },
      {
        status: InvoiceStatus.OVERDUE,
      }
    );
    
    return result.affected || 0;
  }

  /**
   * Récupère les paiements d'un utilisateur par son Auth0 ID
   */
  async getPaymentsByAuth0Id(
    auth0Id: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ payments: Payment[], total: number, page: number, limit: number }> {
    // Trouver l'utilisateur par son Auth0 ID
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Récupérer les paiements du customer lié à cet utilisateur
    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { customerId: user.customerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['invoice'],
    });

    return {
      payments,
      total,
      page,
      limit
    };
  }

  /**
   * Génère un reçu PDF pour un paiement
   */
  async generatePaymentReceiptPdf(paymentId: string, auth0Id: string): Promise<Buffer> {
    // Vérifier que l'utilisateur a accès à ce paiement
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const payment = await this.paymentRepository.findOne({
      where: { 
        id: paymentId,
        customerId: user.customerId 
      },
      relations: ['invoice']
    });

    if (!payment) {
      throw new NotFoundException('Paiement non trouvé ou non autorisé');
    }

    // TODO: Implémenter la génération de PDF
    // Pour l'instant, on retourne un buffer simulé
    const receiptContent = `
      REÇU DE PAIEMENT
      
      ID du paiement: ${payment.id}
      Montant: ${payment.amount} ${payment.currency}
      Date: ${payment.createdAt.toLocaleDateString()}
      Méthode: ${payment.paymentMethod}
      ${payment.transactionId ? `Transaction ID: ${payment.transactionId}` : ''}
      
      Merci pour votre paiement !
    `;

    // Simuler un buffer PDF (à remplacer par une vraie génération PDF)
    return Buffer.from(receiptContent, 'utf-8');
  }

  /**
   * Upload une preuve de paiement manuelle
   */
  async uploadManualPaymentProof(
    proofData: {
      paymentId: string;
      proofUrl: string;
      description?: string;
      amount: number;
      currency: string;
    },
    auth0Id: string
  ): Promise<void> {
    // Vérifier l'utilisateur
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Créer un enregistrement de paiement manuel
    const manualPayment = this.paymentRepository.create({
      customerId: user.customerId,
      amount: proofData.amount,
      currency: proofData.currency,
      paymentMethod: PaymentMethod.MANUAL,
      status: PaymentStatus.PENDING, // En attente de validation
      notes: proofData.description,
      metadata: {
        proofUrl: proofData.proofUrl,
        manualSubmission: true,
        submittedAt: new Date(),
        submittedBy: auth0Id
      }
    });

    await this.paymentRepository.save(manualPayment);

    // Log de l'événement pour les administrateurs
    // TODO: Implémenter un système de notification pour les preuves de paiement manuelles
    console.log(`Preuve de paiement manuelle téléchargée - Payment ID: ${manualPayment.id}, User: ${auth0Id}, Amount: ${proofData.amount} ${proofData.currency}`);
  }
}
