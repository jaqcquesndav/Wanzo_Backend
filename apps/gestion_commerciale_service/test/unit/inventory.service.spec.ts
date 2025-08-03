import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from '../../src/modules/inventory/products.service';
import { Product } from '../../src/modules/inventory/entities/product.entity';
import { StockTransaction } from '../../src/modules/inventory/entities/stock-transaction.entity';
import { CreateProductDto } from '../../src/modules/inventory/dto/create-product.dto';
import { UpdateProductDto } from '../../src/modules/inventory/dto/update-product.dto';
import { ProductCategory } from '../../src/modules/inventory/enums/product-category.enum';
import { MeasurementUnit } from '../../src/modules/inventory/enums/measurement-unit.enum';
import { StockTransactionType } from '../../src/modules/inventory/enums/stock-transaction-type.enum';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let stockTransactionRepository: Repository<StockTransaction>;

  const mockProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    preload: jest.fn(),
    delete: jest.fn(),
  };

  const mockStockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
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

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    stockTransactionRepository = module.get<Repository<StockTransaction>>(getRepositoryToken(StockTransaction));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Product Test',
        description: 'Test product description',
        sku: 'PROD-001',
        costPriceInCdf: 30000,
        sellingPriceInCdf: 50000,
        stockQuantity: 100,
        alertThreshold: 15,
        category: ProductCategory.ELECTRONICS,
        unit: MeasurementUnit.PIECE,
      };

      const mockProduct = {
        id: 'product-123',
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductRepository.create.mockReturnValue(mockProduct);
      mockProductRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(mockProductRepository.create).toHaveBeenCalledWith(createProductDto);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should throw error for duplicate SKU', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Product Test',
        sku: 'EXISTING-SKU',
        costPriceInCdf: 30000,
        sellingPriceInCdf: 50000,
        stockQuantity: 100,
        alertThreshold: 15,
        category: ProductCategory.ELECTRONICS,
        unit: MeasurementUnit.PIECE,
      };

      mockProductRepository.save.mockRejectedValue({
        code: 'ER_DUP_ENTRY',
        message: 'Duplicate entry for SKU',
      });

      await expect(service.create(createProductDto)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          sku: 'PROD-001',
          stockQuantity: 50,
          sellingPriceInCdf: 25000,
        },
        {
          id: 'product-2',
          name: 'Product 2',
          sku: 'PROD-002',
          stockQuantity: 30,
          sellingPriceInCdf: 35000,
        },
      ];

      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(mockProductRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        sku: 'PROD-001',
        stockQuantity: 50,
        sellingPriceInCdf: 25000,
      };

      mockProductRepository.findOneBy.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-123');

      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({ id: 'product-123' });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockProductRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        sellingPriceInCdf: 60000,
      };

      const existingProduct = {
        id: 'product-123',
        name: 'Original Product',
        sellingPriceInCdf: 50000,
        stockQuantity: 100,
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateProductDto,
      };

      mockProductRepository.preload.mockResolvedValue(updatedProduct);
      mockProductRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update('product-123', updateProductDto);

      expect(mockProductRepository.preload).toHaveBeenCalledWith({
        id: 'product-123',
        ...updateProductDto,
      });
      expect(mockProductRepository.save).toHaveBeenCalledWith(updatedProduct);
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockProductRepository.preload.mockResolvedValue(null);

      await expect(service.update('non-existent-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      mockProductRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('product-123');

      expect(mockProductRepository.delete).toHaveBeenCalledWith('product-123');
    });

    it('should throw NotFoundException when product not found', async () => {
      mockProductRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('product-123')).rejects.toThrow(NotFoundException);
    });
  });
});
