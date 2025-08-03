import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesService } from '../../src/modules/sales/sales.service';
import { Sale, SaleStatus } from '../../src/modules/sales/entities/sale.entity';
import { SaleItem } from '../../src/modules/sales/entities/sale-item.entity';
import { Product } from '../../src/modules/inventory/entities/product.entity';
import { CustomersService } from '../../src/modules/customers/customers.service';
import { CreateSaleDto } from '../../src/modules/sales/dto/create-sale.dto';
import { UpdateSaleDto } from '../../src/modules/sales/dto/update-sale.dto';

describe('SalesService', () => {
  let service: SalesService;
  let saleRepository: Repository<Sale>;
  let saleItemRepository: Repository<SaleItem>;
  let productRepository: Repository<Product>;
  let customersService: CustomersService;
  let dataSource: DataSource;

  const mockSaleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockSaleItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCustomersService = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(Sale),
          useValue: mockSaleRepository,
        },
        {
          provide: getRepositoryToken(SaleItem),
          useValue: mockSaleItemRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    saleRepository = module.get<Repository<Sale>>(getRepositoryToken(Sale));
    saleItemRepository = module.get<Repository<SaleItem>>(getRepositoryToken(SaleItem));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    customersService = module.get<CustomersService>(CustomersService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new sale with items', async () => {
      const createSaleDto: CreateSaleDto = {
        customerId: 'customer-123',
        customerName: 'John Doe',
        items: [
          {
            productId: 'product-1',
            productName: 'Product 1',
            quantity: 2,
            unitPrice: 50000,
          },
        ],
        date: '2023-08-01T12:30:00.000Z',
        paymentMethod: 'cash',
        exchangeRate: 2000,
      };

      const mockCustomer = {
        id: 'customer-123',
        name: 'John Doe',
      };

      const mockProduct = {
        id: 'product-1',
        name: 'Product 1',
        stockQuantity: 10,
        sellingPrice: 50000,
      };

      const mockSale = {
        id: 'sale-123',
        customerId: 'customer-123',
        customerName: 'John Doe',
        totalAmountInCdf: 100000,
        status: SaleStatus.PENDING,
        items: [],
      };

      // Mock transaction
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn()
            .mockResolvedValueOnce(mockCustomer) // For customer lookup
            .mockResolvedValueOnce(mockProduct) // For product lookup
            .mockResolvedValueOnce(mockSale), // For finding the created sale after saving
          save: jest.fn().mockResolvedValue(mockSale),
          create: jest.fn().mockReturnValue(mockSale),
        };
        return callback(mockManager);
      });

      const result = await service.create(createSaleDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result).toEqual(mockSale);
    });

    it('should throw NotFoundException for invalid customer', async () => {
      const createSaleDto: CreateSaleDto = {
        customerId: 'invalid-customer',
        customerName: 'John Doe',
        items: [],
        date: '2023-08-01T12:30:00.000Z',
        paymentMethod: 'cash',
        exchangeRate: 2000,
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null), // Customer not found
        };
        return callback(mockManager);
      });

      await expect(service.create(createSaleDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated sales', async () => {
      const mockSales = [
        {
          id: 'sale-1',
          customerName: 'Customer 1',
          totalAmountInCdf: 100000,
          status: SaleStatus.COMPLETED,
        },
        {
          id: 'sale-2',
          customerName: 'Customer 2',
          totalAmountInCdf: 150000,
          status: SaleStatus.PENDING,
        },
      ];

      mockSaleRepository.find.mockResolvedValue(mockSales);

      const result = await service.findAll({
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(mockSales);
    });

    it('should filter sales by status', async () => {
      const mockSales = [
        {
          id: 'sale-1',
          customerName: 'Customer 1',
          totalAmountInCdf: 100000,
          status: SaleStatus.COMPLETED,
        },
      ];

      mockSaleRepository.find.mockResolvedValue(mockSales);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        status: SaleStatus.COMPLETED,
      });

      expect(result).toEqual(mockSales);
    });
  });

  describe('findOne', () => {
    it('should return a sale by id', async () => {
      const mockSale = {
        id: 'sale-123',
        customerName: 'John Doe',
        totalAmountInCdf: 100000,
        status: SaleStatus.PENDING,
        items: [],
      };

      mockSaleRepository.findOne.mockResolvedValue(mockSale);

      const result = await service.findOne('sale-123');

      expect(mockSaleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sale-123' },
        relations: ['customer', 'items', 'items.product'],
      });
      expect(result).toEqual(mockSale);
    });

    it('should throw NotFoundException when sale not found', async () => {
      mockSaleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a sale', async () => {
      const updateSaleDto: UpdateSaleDto = {
        customerName: 'Updated Customer',
        notes: 'Updated notes',
      };

      const existingSale = {
        id: 'sale-123',
        customerName: 'Original Customer',
        totalAmountInCdf: 100000,
        status: SaleStatus.PENDING,
        items: [],
        customer: null,
      };

      const updatedSale = {
        ...existingSale,
        ...updateSaleDto,
      };

      // Mock the initial findOne call outside transaction
      mockSaleRepository.findOne.mockResolvedValue(existingSale);

      // Mock transaction behavior
      const mockEntityManager = {
        merge: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn().mockResolvedValue(updatedSale), // Final findOne inside transaction
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      const result = await service.update('sale-123', updateSaleDto);

      expect(mockSaleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sale-123' },
        relations: ['items', 'items.product', 'customer'],
      });
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result).toEqual(updatedSale);
    });

    it('should throw NotFoundException when sale not found', async () => {
      mockSaleRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeSale', () => {
    it('should complete a pending sale', async () => {
      const completeSaleDto = {
        amountPaidInCdf: 100000,
        paymentMethod: 'cash',
      };

      const pendingSale = {
        id: 'sale-123',
        customerName: 'John Doe',
        totalAmountInCdf: 100000,
        status: SaleStatus.PENDING,
        amountPaidInCdf: 0,
      };

      const completedSale = {
        ...pendingSale,
        status: SaleStatus.COMPLETED,
        amountPaidInCdf: 100000,
      };

      // Mock transaction for completeSale
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(pendingSale),
          save: jest.fn().mockResolvedValue(completedSale),
        };
        return callback(mockManager);
      });

      const result = await service.completeSale('sale-123', completeSaleDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(SaleStatus.COMPLETED);
      expect(result.amountPaidInCdf).toBe(100000);
    });

    it('should throw BadRequestException for already completed sale', async () => {
      const completedSale = {
        id: 'sale-123',
        status: SaleStatus.COMPLETED,
      };

      // Mock transaction for already completed sale
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(completedSale),
          save: jest.fn(),
        };
        return callback(mockManager);
      });

      await expect(service.completeSale('sale-123', {
        amountPaidInCdf: 100000,
        paymentMethod: 'cash',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelSale', () => {
    it('should cancel a pending sale', async () => {
      const cancelSaleDto = {
        reason: 'Customer request',
      };

      const pendingSale = {
        id: 'sale-123',
        customerName: 'John Doe',
        status: SaleStatus.PENDING,
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            product: { id: 'product-1', stockQuantity: 10 }
          }
        ]
      };

      const product = {
        id: 'product-1',
        stockQuantity: 10
      };

      const cancelledSale = {
        ...pendingSale,
        status: SaleStatus.CANCELLED,
      };

      // Mock transaction behavior
      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(pendingSale) // First call for sale
          .mockResolvedValueOnce(product), // Second call for product
        save: jest.fn()
          .mockResolvedValueOnce(product) // Save updated product
          .mockResolvedValueOnce(cancelledSale), // Save updated sale
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      const result = await service.cancelSale('sale-123', cancelSaleDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Sale, { 
        where: { id: 'sale-123' }, 
        relations: ['items', 'items.product'] 
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(Sale, expect.objectContaining({
        status: SaleStatus.CANCELLED,
      }));
      expect(result).toBeDefined();
      expect(result.status).toBe(SaleStatus.CANCELLED);
    });

    it('should throw BadRequestException for already completed sale', async () => {
      const completedSale = {
        id: 'sale-123',
        status: SaleStatus.COMPLETED,
      };

      // Mock transaction behavior
      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(completedSale),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      await expect(service.cancelSale('sale-123', {
        reason: 'Test',
      })).rejects.toThrow(BadRequestException);
    });
  });
});
