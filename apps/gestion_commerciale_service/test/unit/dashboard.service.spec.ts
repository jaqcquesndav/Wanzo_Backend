import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DashboardService } from '../../src/modules/dashboard/dashboard.service';
import { Sale } from '../../src/modules/sales/entities/sale.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { Expense } from '../../src/modules/expenses/entities/expense.entity';
import { Product } from '../../src/modules/inventory/entities/product.entity';
import { StockTransaction } from '../../src/modules/inventory/entities/stock-transaction.entity';
import { DashboardData, SalesToday } from '../../src/modules/dashboard/interfaces/dashboard.interface';
import { OperationType } from '../../src/modules/dashboard/enums/operation-type.enum';

describe('DashboardService', () => {
  let service: DashboardService;
  let saleRepository: Repository<Sale>;
  let customerRepository: Repository<Customer>;
  let expenseRepository: Repository<Expense>;
  let productRepository: Repository<Product>;
  let stockTransactionRepository: Repository<StockTransaction>;

  // Mock repositories
  const mockSaleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCustomerRepository = {
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockExpenseRepository = {
    find: jest.fn(),
    sum: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockStockTransactionRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Sale),
          useValue: mockSaleRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(StockTransaction),
          useValue: mockStockTransactionRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    saleRepository = module.get<Repository<Sale>>(getRepositoryToken(Sale));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    expenseRepository = module.get<Repository<Expense>>(getRepositoryToken(Expense));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    stockTransactionRepository = module.get<Repository<StockTransaction>>(getRepositoryToken(StockTransaction));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardData', () => {
    it('should return dashboard data with correct structure', async () => {
      // Mock des données de vente
      const mockSales = [
        {
          id: '1',
          totalAmountInCdf: 150000,
          exchangeRate: 2000,
          customerId: 'customer1',
        },
        {
          id: '2',
          totalAmountInCdf: 200000,
          exchangeRate: 2000,
          customerId: 'customer2',
        },
      ];

      // Mock des dépenses
      const mockExpenses = [
        { id: '1', amount: 50000 },
        { id: '2', amount: 30000 },
      ];

      // Mock des ventes à crédit
      const mockCreditSales = [
        {
          id: '3',
          totalAmountInCdf: 100000,
          amountPaidInCdf: 60000,
          status: 'PENDING',
        },
      ];

      // Configuration des mocks
      mockSaleRepository.find
        .mockResolvedValueOnce(mockSales) // Pour calculateSalesToday
        .mockResolvedValueOnce(mockCreditSales); // Pour calculateReceivables

      mockSaleRepository.createQueryBuilder = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2), // Pour calculateClientsServedToday
        getMany: jest.fn().mockResolvedValue(mockCreditSales),
      });

      mockExpenseRepository.find.mockResolvedValue(mockExpenses);

      const result = await service.getDashboardData({});

      expect(result).toEqual({
        salesTodayCdf: 350000, // 150000 + 200000
        salesTodayUsd: 175, // (150000 + 200000) / 2000
        clientsServedToday: 2,
        receivables: 40000, // 100000 - 60000
        expenses: 80000, // 50000 + 30000
      });
    });
  });

  describe('getSalesToday', () => {
    it('should return sales for today', async () => {
      const mockSales = [
        {
          totalAmountInCdf: 100000,
          exchangeRate: 2000,
        },
        {
          totalAmountInCdf: 150000,
          exchangeRate: 2000,
        },
      ];

      mockSaleRepository.find.mockResolvedValue(mockSales);

      const result = await service.getSalesToday({});

      expect(result).toEqual({
        cdf: 250000,
        usd: 125,
      });
    });
  });

  describe('getClientsServedToday', () => {
    it('should return count of unique clients served today', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      mockSaleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getClientsServedToday({});

      expect(result).toBe(5);
      expect(mockSaleRepository.createQueryBuilder).toHaveBeenCalledWith('sale');
    });
  });

  describe('getReceivables', () => {
    it('should return total receivables amount', async () => {
      const mockCreditSales = [
        {
          totalAmountInCdf: 200000,
          amountPaidInCdf: 100000,
        },
        {
          totalAmountInCdf: 150000,
          amountPaidInCdf: 50000,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockCreditSales),
      };

      mockSaleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getReceivables();

      expect(result).toBe(200000); // (200000-100000) + (150000-50000)
    });
  });

  describe('getExpensesToday', () => {
    it('should return total expenses for today', async () => {
      const mockExpenses = [
        { amount: 75000 },
        { amount: 25000 },
      ];

      mockExpenseRepository.find.mockResolvedValue(mockExpenses);

      const result = await service.getExpensesToday({});

      expect(result).toBe(100000);
    });
  });

  describe('getOperationsJournal', () => {
    it('should return operations journal entries', async () => {
      const result = await service.getOperationsJournal({
        page: 1,
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Vérifier la structure du premier élément
      if (result.length > 0) {
        const entry = result[0];
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('description');
        expect(entry).toHaveProperty('type');
        expect(entry).toHaveProperty('amount');
        expect(entry).toHaveProperty('currencyCode');
        expect(entry).toHaveProperty('isDebit');
        expect(entry).toHaveProperty('isCredit');
        expect(entry).toHaveProperty('balanceAfter');
      }
    });

    it('should filter operations by type', async () => {
      const result = await service.getOperationsJournal({
        type: OperationType.SALE_CASH,
        page: 1,
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('exportOperationsJournal', () => {
    it('should export journal as CSV', async () => {
      const result = await service.exportOperationsJournal({
        format: 'csv',
      });

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should export journal as PDF', async () => {
      const result = await service.exportOperationsJournal({
        format: 'pdf',
      });

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });
});
