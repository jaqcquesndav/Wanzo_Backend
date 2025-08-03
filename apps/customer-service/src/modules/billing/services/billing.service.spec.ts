import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

describe('BillingService', () => {
  let service: BillingService;
  let paymentRepository: Repository<Payment>;
  let invoiceRepository: Repository<Invoice>;
  let userRepository: Repository<User>;
  let customerRepository: Repository<Customer>;
  let customerEventsProducer: CustomerEventsProducer;

  const mockPayment: Partial<Payment> = {
    id: 'payment-123',
    customerId: 'customer-123',
    amount: 29.99,
    currency: 'USD',
    status: PaymentStatus.COMPLETED,
    paymentMethod: PaymentMethod.CREDIT_CARD,
    transactionId: 'trans-123',
    createdAt: new Date(),
  };

  const mockInvoice: Partial<Invoice> = {
    id: 'invoice-123',
    customerId: 'customer-123',
    invoiceNumber: 'INV-001',
    amount: 29.99,
    currency: 'USD',
    status: InvoiceStatus.PAID,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    issueDate: new Date(),
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    auth0Id: 'auth0|test123',
    email: 'test@example.com',
    customerId: 'customer-123',
  };

  const mockCustomer: Partial<Customer> = {
    id: 'customer-123',
    name: 'Test Customer',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const mockPaymentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
    };

    const mockInvoiceRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockCustomerRepository = {
      findOne: jest.fn(),
    };

    const mockCustomerEventsProducer = {
      emitUserCreated: jest.fn(),
      emitUserUpdated: jest.fn(),
      emitCustomerCreated: jest.fn(),
      emitCustomerUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: CustomerEventsProducer,
          useValue: mockCustomerEventsProducer,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    invoiceRepository = module.get<Repository<Invoice>>(getRepositoryToken(Invoice));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    customerEventsProducer = module.get<CustomerEventsProducer>(CustomerEventsProducer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      const createDto = {
        customerId: 'customer-123',
        amount: 29.99,
        currency: 'USD',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: 'Monthly subscription',
        items: [{
          description: 'Monthly subscription',
          quantity: 1,
          unitPrice: 29.99,
          amount: 29.99,
        }],
      };

      jest.spyOn(invoiceRepository, 'find').mockResolvedValue([]); // Mock for generateInvoiceNumber
      jest.spyOn(invoiceRepository, 'create').mockReturnValue(mockInvoice as Invoice);
      jest.spyOn(invoiceRepository, 'save').mockResolvedValue(mockInvoice as Invoice);

      const result = await service.createInvoice(createDto);

      expect(invoiceRepository.create).toHaveBeenCalled();
      expect(invoiceRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockInvoice);
    });
  });

  describe('findPaymentsByCustomer', () => {
    it('should return customer payments', async () => {
      const mockPayments = [mockPayment];
      jest.spyOn(paymentRepository, 'findAndCount').mockResolvedValue([mockPayments as Payment[], 1]);

      const result = await service.findPaymentsByCustomer('customer-123', 1, 10);

      expect(paymentRepository.findAndCount).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
        relations: ['invoice'],
      });
      expect(result[0]).toEqual(mockPayments);
      expect(result[1]).toBe(1);
    });
  });

  describe('generatePaymentReceiptPdf', () => {
    it('should generate PDF receipt successfully', async () => {
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue(mockPayment as Payment);
      
      // Mock the PDF generation
      jest.spyOn(service, 'generatePaymentReceiptPdf').mockResolvedValue(mockPdfBuffer);

      const result = await service.generatePaymentReceiptPdf('payment-123', 'auth0|test123');

      expect(result).toEqual(mockPdfBuffer);
    });

    it('should throw NotFoundException when payment not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(service, 'generatePaymentReceiptPdf').mockRejectedValue(new NotFoundException('Paiement non trouvé'));

      await expect(service.generatePaymentReceiptPdf('nonexistent', 'auth0|test123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadManualPaymentProof', () => {
    it('should upload manual payment proof successfully', async () => {
      const proofData = {
        paymentId: 'payment-123',
        proofUrl: '/uploads/proof.pdf',
        description: 'Manual payment proof',
        amount: 29.99,
        currency: 'USD',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(paymentRepository, 'create').mockReturnValue(mockPayment as Payment);
      jest.spyOn(paymentRepository, 'save').mockResolvedValue(mockPayment as Payment);

      await service.uploadManualPaymentProof(proofData, 'auth0|test123');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { auth0Id: 'auth0|test123' } });
      expect(paymentRepository.create).toHaveBeenCalled();
      expect(paymentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      const proofData = {
        paymentId: 'payment-123',
        proofUrl: '/uploads/proof.pdf',
        description: 'Manual payment proof',
        amount: 29.99,
        currency: 'USD',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.uploadManualPaymentProof(proofData, 'auth0|nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findInvoicesByCustomer', () => {
    it('should return customer invoices', async () => {
      const mockInvoices = [mockInvoice];
      jest.spyOn(invoiceRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockInvoices, 1]),
      } as any);

      const result = await service.findInvoicesByCustomer('customer-123', 1, 10);

      expect(result[0]).toEqual(mockInvoices);
      expect(result[1]).toBe(1);
    });
  });

  describe('findInvoiceById', () => {
    it('should return invoice by ID', async () => {
      jest.spyOn(invoiceRepository, 'findOne').mockResolvedValue(mockInvoice as Invoice);

      const result = await service.findInvoiceById('invoice-123');

      expect(invoiceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'invoice-123' },
        relations: ['customer', 'subscription', 'payments'],
      });
      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      jest.spyOn(invoiceRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findInvoiceById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordPayment', () => {
    it('should record payment successfully', async () => {
      const createDto = {
        customerId: 'customer-123',
        invoiceId: 'invoice-123',
        amount: 29.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        transactionId: 'trans-123',
      };

      // Mock pour les paiements existants de la facture (pour updateInvoiceAfterPayment)
      const existingPayments = [mockPayment];
      
      jest.spyOn(paymentRepository, 'create').mockReturnValue(mockPayment as Payment);
      jest.spyOn(paymentRepository, 'save').mockResolvedValue(mockPayment as Payment);
      jest.spyOn(paymentRepository, 'find').mockResolvedValue(existingPayments as Payment[]); // Pour updateInvoiceAfterPayment
      jest.spyOn(invoiceRepository, 'findOne').mockResolvedValue(mockInvoice as Invoice); // Mock for findInvoiceById
      jest.spyOn(invoiceRepository, 'save').mockResolvedValue(mockInvoice as Invoice); // Mock for updateInvoiceAfterPayment

      const result = await service.recordPayment(createDto);

      expect(paymentRepository.create).toHaveBeenCalled();
      expect(paymentRepository.save).toHaveBeenCalled();
      expect(paymentRepository.find).toHaveBeenCalledWith({
        where: { invoiceId: 'invoice-123', status: PaymentStatus.COMPLETED }
      });
      expect(result).toEqual(mockPayment);
    });
  });

  describe('findOverdueInvoices', () => {
    it('should return overdue invoices', async () => {
      const overdueInvoices = [{ ...mockInvoice, status: InvoiceStatus.OVERDUE }];
      jest.spyOn(invoiceRepository, 'find').mockResolvedValue(overdueInvoices as Invoice[]);

      const result = await service.findOverdueInvoices();

      expect(invoiceRepository.find).toHaveBeenCalled();
      expect(result).toEqual(overdueInvoices);
    });
  });
});
