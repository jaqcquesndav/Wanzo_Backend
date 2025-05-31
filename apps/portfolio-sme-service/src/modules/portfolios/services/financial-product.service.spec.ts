import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialProductService } from './financial-product.service';
import { FinancialProduct, ProductType } from '../entities/financial-product.entity';
import { CreateFinancialProductDto } from '../dtos/financial-product.dto';
import { NotFoundException } from '@nestjs/common';

describe('FinancialProductService', () => {
  let service: FinancialProductService;
  let repository: Repository<FinancialProduct>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialProductService,
        {
          provide: getRepositoryToken(FinancialProduct),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FinancialProductService>(FinancialProductService);
    repository = module.get<Repository<FinancialProduct>>(getRepositoryToken(FinancialProduct));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProductDto: CreateFinancialProductDto = {
      portfolioId: 'portfolio-123',
      name: 'Test Product',
      type: ProductType.CREDIT,
      characteristics: {
        minAmount: 1000,
        maxAmount: 10000,
        minDuration: 12,
        maxDuration: 36,
        interestRateType: 'fixed',
        minInterestRate: 5,
        maxInterestRate: 15,
        requiredGuarantees: ['collateral'],
        eligibilityCriteria: ['minimum_revenue'],
      },
    };

    it('should create a financial product successfully', async () => {
      const product = { id: 'product-123', ...createProductDto };

      mockRepository.create.mockReturnValue(product);
      mockRepository.save.mockResolvedValue(product);

      const result = await service.create(createProductDto);

      expect(result).toEqual(product);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createProductDto.name,
          type: createProductDto.type,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const products = [
        { id: 'product-1', name: 'Product 1' },
        { id: 'product-2', name: 'Product 2' },
      ];

      mockRepository.findAndCount.mockResolvedValue([products, 2]);

      const result = await service.findAll({}, 1, 10);

      expect(result).toEqual({
        products,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        portfolioId: 'portfolio-123',
        type: ProductType.CREDIT,
      };

      await service.findAll(filters, 1, 10);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(filters),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a product if found', async () => {
      const product = { id: 'product-123', name: 'Test Product' };
      mockRepository.findOne.mockResolvedValue(product);

      const result = await service.findById('product-123');

      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const product = {
        id: 'product-123',
        name: 'Original Name',
        type: ProductType.CREDIT,
      };

      const updateDto = {
        name: 'Updated Name',
        characteristics: {
          minAmount: 2000,
          maxAmount: 20000,
          minDuration: 12,
          maxDuration: 36,
          interestRateType: 'fixed',
          minInterestRate: 5,
          maxInterestRate: 15,
          requiredGuarantees: ['collateral'],
          eligibilityCriteria: ['minimum_revenue'],
        },
      };

      mockRepository.findOne.mockResolvedValue(product);
      mockRepository.save.mockResolvedValue({ ...product, ...updateDto });

      const result = await service.update('product-123', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
    });
  });

  describe('delete', () => {
    it('should deactivate product successfully', async () => {
      const product = {
        id: 'product-123',
        name: 'Test Product',
        active: true,
      };

      mockRepository.findOne.mockResolvedValue(product);
      mockRepository.save.mockResolvedValue({ ...product, active: false });

      const result = await service.delete('product-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Financial product deactivated successfully');
    });
  });
});